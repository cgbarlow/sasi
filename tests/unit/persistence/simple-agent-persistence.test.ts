/**
 * Simplified TDD Unit Tests for Agent Persistence Manager
 * Tests SQLite database operations with Phase 2A performance requirements
 * Focus: Red-Green-Refactor TDD methodology
 */

import { performance } from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';

// Import our implementation
import { AgentPersistenceManager } from '../../../src/persistence/AgentPersistenceManager';

// Simple types for testing
interface SimpleAgentConfig {
  id: string;
  type: string;
  cognitivePattern: string;
  networkLayers: number[];
  status: string;
  createdAt: number;
  lastActive: number;
}

describe('AgentPersistenceManager - TDD Red-Green-Refactor', () => {
  let persistenceManager: AgentPersistenceManager;
  let testDbPath: string;

  beforeEach(async () => {
    // Create unique test database for each test
    testDbPath = path.join(__dirname, `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`);
    persistenceManager = new AgentPersistenceManager(testDbPath);
    await persistenceManager.initialize();
  });

  afterEach(async () => {
    // Clean up test database
    if (persistenceManager) {
      await persistenceManager.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TDD Red Phase - Database Schema', () => {
    test('should create all required tables', async () => {
      // TDD: This will initially fail until we implement schema creation
      const tables = await persistenceManager.getTables();
      
      expect(tables).toContain('agents');
      expect(tables).toContain('neural_weights');
      expect(tables).toContain('agent_memory');
      expect(tables).toContain('agent_metrics');
      expect(tables).toContain('session_state');
    });

    test('should create performance indexes', async () => {
      // TDD: This will initially fail until we implement index creation
      const indexes = await persistenceManager.getIndexes();
      
      expect(indexes.length).toBeGreaterThan(0);
      expect(indexes).toContain('idx_agents_status');
      expect(indexes).toContain('idx_agents_type');
    });

    test('should enable WAL mode for concurrent access', async () => {
      // TDD: This will initially fail until we configure SQLite properly
      const journalMode = await persistenceManager.getJournalMode();
      expect(journalMode).toBe('wal');
    });
  });

  describe('TDD Red Phase - Agent CRUD Operations', () => {
    test('should save agent within 50ms performance target', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: SimpleAgentConfig = {
        id: 'test-agent-001',
        type: 'researcher',
        cognitivePattern: 'divergent',
        networkLayers: [64, 128, 64, 32],
        status: 'spawning',
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      const startTime = performance.now();
      const savedAgent = await persistenceManager.saveAgent(agentConfig as any);
      const saveTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(saveTime).toBeLessThan(50);
      expect(savedAgent.id).toBe(agentConfig.id);
      expect(savedAgent.type).toBe(agentConfig.type);
    });

    test('should retrieve agent by ID within 50ms', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: SimpleAgentConfig = {
        id: 'test-agent-002',
        type: 'coder',
        cognitivePattern: 'convergent',
        networkLayers: [128, 256, 128, 64],
        status: 'active',
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      await persistenceManager.saveAgent(agentConfig as any);

      const startTime = performance.now();
      const retrievedAgent = await persistenceManager.getAgent(agentConfig.id);
      const retrieveTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(retrieveTime).toBeLessThan(50);
      expect(retrievedAgent).toBeDefined();
      expect(retrievedAgent!.id).toBe(agentConfig.id);
      expect(retrievedAgent!.type).toBe(agentConfig.type);
    });

    test('should update agent status atomically within 50ms', async () => {
      // TDD Red: This test should fail initially
      const agentId = 'test-agent-003';
      await persistenceManager.saveAgent({
        id: agentId,
        type: 'analyst',
        cognitivePattern: 'critical',
        networkLayers: [96, 192, 96, 48],
        status: 'spawning',
        createdAt: Date.now(),
        lastActive: Date.now()
      } as any);

      const startTime = performance.now();
      await persistenceManager.updateAgentStatus(agentId, 'active');
      const updateTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(updateTime).toBeLessThan(50);

      // Validate status change
      const updatedAgent = await persistenceManager.getAgent(agentId);
      expect(updatedAgent!.status).toBe('active');
    });

    test('should prevent duplicate agent IDs', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: SimpleAgentConfig = {
        id: 'duplicate-test',
        type: 'coordinator',
        cognitivePattern: 'adaptive',
        networkLayers: [112, 224, 112, 56],
        status: 'spawning',
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      // First save should succeed
      await persistenceManager.saveAgent(agentConfig as any);

      // Second save should fail with unique constraint
      await expect(persistenceManager.saveAgent(agentConfig as any))
        .rejects.toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('TDD Red Phase - Performance Testing', () => {
    test('should handle concurrent operations efficiently', async () => {
      // TDD Red: This test should fail initially
      const concurrentSaves = Array.from({ length: 10 }, (_, i) => 
        persistenceManager.saveAgent({
          id: `concurrent-agent-${i}`,
          type: 'optimizer',
          cognitivePattern: 'systems',
          networkLayers: [80, 160, 80, 40],
          status: 'spawning',
          createdAt: Date.now(),
          lastActive: Date.now()
        } as any)
      );

      const startTime = performance.now();
      const results = await Promise.all(concurrentSaves);
      const totalTime = performance.now() - startTime;

      // All saves should succeed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toMatch(/concurrent-agent-\d/);
      });

      // Average save time should be reasonable for concurrent operations
      const avgSaveTime = totalTime / 10;
      expect(avgSaveTime).toBeLessThan(75); // Slightly higher threshold for concurrent ops
    });

    test('should efficiently batch save multiple agents', async () => {
      // TDD Red: This test should fail initially
      const agents: SimpleAgentConfig[] = Array.from({ length: 20 }, (_, i) => ({
        id: `batch-agent-${i}`,
        type: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator'][i % 5],
        cognitivePattern: ['convergent', 'divergent', 'critical', 'systems', 'adaptive'][i % 5],
        networkLayers: [64, 128, 64, 32],
        status: 'spawning',
        createdAt: Date.now(),
        lastActive: Date.now()
      }));

      const startTime = performance.now();
      await persistenceManager.batchSaveAgents(agents as any[]);
      const batchTime = performance.now() - startTime;

      // Batch operation should be efficient
      expect(batchTime).toBeLessThan(100); // 100ms for 20 agents = 5ms per agent

      // Verify all agents were saved
      const savedAgents = await persistenceManager.getAllAgents();
      expect(savedAgents).toHaveLength(20);
    });
  });

  describe('TDD Red Phase - Metrics Recording', () => {
    test('should record performance metrics', async () => {
      // TDD Red: This test should fail initially
      const agentId = 'metrics-test-agent';
      const spawnTime = 65; // ms

      await persistenceManager.saveAgent({
        id: agentId,
        type: 'researcher',
        cognitivePattern: 'divergent',
        networkLayers: [64, 128, 64],
        status: 'active',
        createdAt: Date.now(),
        lastActive: Date.now(),
        spawnTimeMs: spawnTime
      } as any);

      await persistenceManager.recordMetric({
        agentId,
        metricType: 'spawn_time',
        value: spawnTime,
        unit: 'ms',
        recordedAt: Date.now(),
        context: { target: 75, status: 'pass' }
      } as any);

      const metrics = await persistenceManager.getAgentMetrics(agentId, 'spawn_time');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(spawnTime);
      expect(metrics[0].unit).toBe('ms');
    });
  });

  describe('TDD Red Phase - Error Handling', () => {
    test('should handle missing agent gracefully', async () => {
      // TDD Red: This test should fail initially
      const nonExistentAgent = await persistenceManager.getAgent('non-existent-id');
      expect(nonExistentAgent).toBeNull();
    });

    test('should validate required fields', async () => {
      // TDD Red: This test should fail initially
      
      // Missing required fields should fail
      await expect(persistenceManager.saveAgent({} as any))
        .rejects.toThrow();

      await expect(persistenceManager.saveAgent({ 
        id: 'test'
      } as any))
        .rejects.toThrow();
    });
  });
});