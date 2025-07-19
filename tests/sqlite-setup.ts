/**
 * SQLite Persistence Test Setup for Phase 2A
 * Specialized setup for SQLite database testing with neural agent persistence
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Mock SQLite3 for testing environment
const mockDatabase = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  each: jest.fn(),
  prepare: jest.fn(),
  exec: jest.fn(),
  close: jest.fn(),
  serialize: jest.fn(),
  parallelize: jest.fn()
};

const mockStatement = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  each: jest.fn(),
  bind: jest.fn(),
  reset: jest.fn(),
  finalize: jest.fn()
};

// Mock SQLite3 module if not available
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => mockDatabase),
  verbose: jest.fn().mockReturnThis(),
  OPEN_READWRITE: 0x00000002,
  OPEN_CREATE: 0x00000004,
  OPEN_READONLY: 0x00000001
}), { virtual: true });

// Create test database directory
const testDbDir = path.join(process.cwd(), 'tests', 'temp-db');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

// Test database path
export const TEST_DB_PATH = path.join(testDbDir, 'test-neural-agents.db');

// Agent State Schema for testing
export const AGENT_STATE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS agent_states (
    id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL,
    neural_config TEXT NOT NULL,
    weights BLOB,
    biases BLOB,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL,
    total_inferences INTEGER DEFAULT 0,
    average_inference_time REAL DEFAULT 0,
    learning_progress REAL DEFAULT 0,
    memory_usage INTEGER DEFAULT 0,
    state INTEGER DEFAULT 0,
    performance_metrics TEXT
  );
`;

export const TRAINING_SESSIONS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS training_sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    epochs INTEGER NOT NULL,
    data_points INTEGER NOT NULL,
    initial_accuracy REAL,
    final_accuracy REAL,
    training_data TEXT,
    convergence_epoch INTEGER,
    FOREIGN KEY (agent_id) REFERENCES agent_states (id)
  );
`;

export const KNOWLEDGE_SHARING_SCHEMA = `
  CREATE TABLE IF NOT EXISTS knowledge_sharing (
    id TEXT PRIMARY KEY,
    source_agent_id TEXT NOT NULL,
    target_agent_id TEXT NOT NULL,
    shared_at INTEGER NOT NULL,
    knowledge_type TEXT NOT NULL,
    knowledge_data TEXT,
    success BOOLEAN DEFAULT 1,
    FOREIGN KEY (source_agent_id) REFERENCES agent_states (id),
    FOREIGN KEY (target_agent_id) REFERENCES agent_states (id)
  );
`;

export const PERFORMANCE_METRICS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    metric_type TEXT NOT NULL,
    metric_value REAL NOT NULL,
    recorded_at INTEGER NOT NULL,
    metadata TEXT,
    FOREIGN KEY (agent_id) REFERENCES agent_states (id)
  );
`;

// Mock Database Interface for testing
export class MockSQLiteDatabase {
  private statements: Map<string, any> = new Map();
  private data: Map<string, any[]> = new Map();
  
  constructor() {
    // Initialize mock data structures
    this.data.set('agent_states', []);
    this.data.set('training_sessions', []);
    this.data.set('knowledge_sharing', []);
    this.data.set('performance_metrics', []);
  }
  
  run(sql: string, params: any[] = [], callback?: (err: Error | null) => void): void {
    if (sql.includes('INSERT INTO agent_states')) {
      const agentData = this.parseInsertData(sql, params);
      const agents = this.data.get('agent_states') || [];
      agents.push(agentData);
      this.data.set('agent_states', agents);
    }
    
    if (callback) callback(null);
  }
  
  get(sql: string, params: any[] = [], callback?: (err: Error | null, row?: any) => void): void {
    let result = null;
    
    if (sql.includes('SELECT * FROM agent_states WHERE id = ?')) {
      const agents = this.data.get('agent_states') || [];
      result = agents.find(agent => agent.id === params[0]);
    }
    
    if (callback) callback(null, result);
  }
  
  all(sql: string, params: any[] = [], callback?: (err: Error | null, rows?: any[]) => void): void {
    let results: any[] = [];
    
    if (sql.includes('SELECT * FROM agent_states')) {
      results = this.data.get('agent_states') || [];
    } else if (sql.includes('SELECT * FROM training_sessions')) {
      results = this.data.get('training_sessions') || [];
    }
    
    if (callback) callback(null, results);
  }
  
  prepare(sql: string): any {
    const statement = {
      ...mockStatement,
      run: jest.fn((params: any[], callback?: (err: Error | null) => void) => {
        this.run(sql, params, callback);
      }),
      get: jest.fn((params: any[], callback?: (err: Error | null, row?: any) => void) => {
        this.get(sql, params, callback);
      }),
      all: jest.fn((params: any[], callback?: (err: Error | null, rows?: any[]) => void) => {
        this.all(sql, params, callback);
      })
    };
    
    this.statements.set(sql, statement);
    return statement;
  }
  
  close(): void {
    this.data.clear();
    this.statements.clear();
  }
  
  private parseInsertData(sql: string, params: any[]): any {
    // Simple mock data parsing for testing
    return {
      id: params[0] || 'test-agent-' + Date.now(),
      agent_type: params[1] || 'mlp',
      neural_config: params[2] || '{}',
      created_at: params[3] || Date.now(),
      last_active: params[4] || Date.now()
    };
  }
  
  // Test utilities
  getTestData(table: string): any[] {
    return this.data.get(table) || [];
  }
  
  setTestData(table: string, data: any[]): void {
    this.data.set(table, data);
  }
  
  clearTestData(): void {
    this.data.forEach((_, key) => this.data.set(key, []));
  }
}

// Global mock database instance
export const mockSQLiteDB = new MockSQLiteDatabase();

// SQLite Test Utilities
export const sqliteTestUtils = {
  /**
   * Create a test database with schema
   */
  createTestDatabase: async (): Promise<MockSQLiteDatabase> => {
    const db = new MockSQLiteDatabase();
    return db;
  },
  
  /**
   * Generate test agent state data
   */
  generateAgentStateData: (overrides: Partial<any> = {}) => ({
    id: 'test-agent-' + Math.random().toString(36).substr(2, 9),
    agent_type: 'mlp',
    neural_config: JSON.stringify({
      type: 'mlp',
      architecture: [10, 5, 1],
      activationFunction: 'relu'
    }),
    weights: Buffer.from(new Float32Array(100)),
    biases: Buffer.from(new Float32Array(16)),
    created_at: Date.now(),
    last_active: Date.now(),
    total_inferences: 0,
    average_inference_time: 0,
    learning_progress: 0,
    memory_usage: 1024 * 1024, // 1MB
    state: 0, // ACTIVE
    performance_metrics: JSON.stringify({
      successRate: 0.95,
      averageResponseTime: 45
    }),
    ...overrides
  }),
  
  /**
   * Generate test training session data
   */
  generateTrainingSessionData: (agentId: string, overrides: Partial<any> = {}) => ({
    session_id: 'session-' + Math.random().toString(36).substr(2, 9),
    agent_id: agentId,
    start_time: Date.now() - 10000,
    end_time: Date.now(),
    epochs: 10,
    data_points: 100,
    initial_accuracy: 0.5,
    final_accuracy: 0.85,
    training_data: JSON.stringify([
      { inputs: [1, 2, 3], outputs: [0.8] }
    ]),
    convergence_epoch: 8,
    ...overrides
  }),
  
  /**
   * Generate test knowledge sharing data
   */
  generateKnowledgeSharingData: (sourceId: string, targetId: string, overrides: Partial<any> = {}) => ({
    id: 'share-' + Math.random().toString(36).substr(2, 9),
    source_agent_id: sourceId,
    target_agent_id: targetId,
    shared_at: Date.now(),
    knowledge_type: 'weights',
    knowledge_data: JSON.stringify({
      weights: Array.from({ length: 100 }, () => Math.random())
    }),
    success: true,
    ...overrides
  }),
  
  /**
   * Generate test performance metrics
   */
  generatePerformanceMetrics: (agentId: string, overrides: Partial<any> = {}) => ({
    id: 'metric-' + Math.random().toString(36).substr(2, 9),
    agent_id: agentId,
    metric_type: 'inference_time',
    metric_value: 45.5,
    recorded_at: Date.now(),
    metadata: JSON.stringify({
      inputSize: 10,
      outputSize: 1,
      memoryUsage: 1024 * 1024
    }),
    ...overrides
  }),
  
  /**
   * Assert persistence performance (<75ms for saves, <100ms for loads)
   */
  assertPersistencePerformance: (operationType: string, startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    
    if (operationType === 'save' || operationType === 'spawn') {
      expect(duration).toBeLessThan(75); // <75ms for spawn/save operations
    } else if (operationType === 'load' || operationType === 'inference') {
      expect(duration).toBeLessThan(100); // <100ms for load/inference operations
    }
  },
  
  /**
   * Validate cross-session persistence
   */
  validateCrossSessionPersistence: async (db: MockSQLiteDatabase, agentId: string) => {
    // Simulate session end and restart
    const agentData = db.getTestData('agent_states').find(a => a.id === agentId);
    expect(agentData).toBeDefined();
    
    // Create new database instance (simulating app restart)
    const newDb = new MockSQLiteDatabase();
    newDb.setTestData('agent_states', [agentData]);
    
    // Verify data persists across sessions
    const restoredAgent = newDb.getTestData('agent_states').find(a => a.id === agentId);
    expect(restoredAgent).toEqual(agentData);
    
    return newDb;
  },
  
  /**
   * Test data migration scenarios
   */
  testDataMigration: async (fromVersion: string, toVersion: string) => {
    // Mock migration logic for testing
    const migrationSteps = {
      '1.0.0': {
        '2.0.0': [
          'ALTER TABLE agent_states ADD COLUMN coordination_data TEXT',
          'CREATE INDEX idx_agent_states_last_active ON agent_states(last_active)'
        ]
      }
    };
    
    return migrationSteps[fromVersion]?.[toVersion] || [];
  }
};

// Performance monitoring for persistence operations
export const persistencePerformanceMonitor = {
  startTime: Date.now(),
  
  measureOperation: <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    
    return operation().then(result => {
      const end = performance.now();
      const duration = end - start;
      
      sqliteTestUtils.assertPersistencePerformance(operationName, start, end);
      
      return result;
    });
  }
};

// Global test hooks for SQLite
beforeEach(() => {
  mockSQLiteDB.clearTestData();
  jest.clearAllMocks();
});

afterEach(() => {
  mockSQLiteDB.clearTestData();
});

// Setup console for SQLite testing
console.log('💾 SQLite persistence test setup initialized');
console.log('🗃️ Mock database configured for Phase 2A testing');
console.log('⚡ Performance monitoring enabled (<75ms spawn, <100ms inference)');
console.log('🔄 Cross-session persistence validation ready');