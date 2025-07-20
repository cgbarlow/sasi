/**
 * AgentPersistenceManager - SQLite Database Layer for Phase 2A
 * Implements TDD-driven database operations with performance monitoring
 * 
 * Performance Requirements:
 * - Agent spawn: <75ms
 * - Database operations: <50ms
 * - Memory usage: <50MB per agent
 * - Test coverage: >95%
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { performance } from 'perf_hooks';
import type { 
  AgentConfig, 
  AgentMetric, 
  AgentMemoryEntry, 
  SessionState,
  NeuralWeightRecord,
  DatabaseConnectionConfig,
  BatchOperation
} from '../types/agent';
import { SecurityValidator } from '../security/SecurityValidator';

export class AgentPersistenceManager {
  private db: DatabaseType | null = null;
  private dbPath: string;
  private config: DatabaseConnectionConfig;
  private isInitialized: boolean = false;
  private writeQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private securityValidator: SecurityValidator;

  constructor(dbPath: string = './.swarm/agents.db') {
    this.dbPath = path.resolve(dbPath);
    this.securityValidator = new SecurityValidator({
      enableInputValidation: true,
      enableAuditLogging: true,
      maxInputSize: 1024 * 1024 // 1MB
    });
    this.config = {
      path: this.dbPath,
      timeout: 30000,
      maxConnections: 5,
      busyTimeout: 5000,
      cacheSize: 64000, // 64MB cache
      mmapSize: 268435456, // 256MB mmap
      walMode: true,
      synchronous: 'NORMAL'
    };
  }

  /**
   * Initialize SQLite database with Phase 2A schema and performance optimizations
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize database connection
      this.db = new Database(this.dbPath, {
        timeout: this.config.timeout,
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      });

      // Configure SQLite for performance
      await this.configureSQLitePerformance();

      // Create schema
      await this.createSchema();

      // Create indexes for performance
      await this.createIndexes();

      this.isInitialized = true;
      console.log('✅ AgentPersistenceManager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize AgentPersistenceManager:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Configure SQLite for optimal performance
   */
  private async configureSQLitePerformance(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Enable WAL mode for concurrent reads
    this.db.pragma('journal_mode = WAL');
    
    // Set synchronous mode for balanced performance/safety
    this.db.pragma(`synchronous = ${this.config.synchronous}`);
    
    // Configure cache size
    this.db.pragma(`cache_size = -${this.config.cacheSize / 1024}`); // Negative = KB
    
    // Use memory for temporary storage
    this.db.pragma('temp_store = MEMORY');
    
    // Configure memory mapping
    this.db.pragma(`mmap_size = ${this.config.mmapSize}`);
    
    // Set busy timeout
    this.db.pragma(`busy_timeout = ${this.config.busyTimeout}`);
    
    // Enable foreign key constraints
    this.db.pragma('foreign_keys = ON');
    
    // Set WAL autocheckpoint for immediate visibility
    this.db.pragma('wal_autocheckpoint = 1000');
    
    // Enable automatic index selection
    this.db.pragma('automatic_index = ON');
    
    console.log('🔧 SQLite performance configuration applied');
  }

  /**
   * Create database schema for Phase 2A
   */
  private async createSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schemas = [
      // Agent Lifecycle Management
      `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'spawning',
        cognitive_pattern TEXT NOT NULL,
        network_layers TEXT NOT NULL,
        learning_rate REAL DEFAULT 0.01,
        momentum REAL DEFAULT 0.0,
        created_at INTEGER NOT NULL,
        last_active INTEGER NOT NULL,
        memory_usage_mb REAL DEFAULT 0,
        performance_score REAL DEFAULT 0,
        spawn_time_ms INTEGER DEFAULT NULL,
        config_json TEXT DEFAULT '{}',
        metadata_json TEXT DEFAULT '{}'
      )`,

      // Neural Network State Persistence
      `CREATE TABLE IF NOT EXISTS neural_weights (
        agent_id TEXT NOT NULL,
        layer_index INTEGER NOT NULL,
        weight_data BLOB NOT NULL,
        bias_data BLOB NOT NULL,
        updated_at INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        compression_type TEXT DEFAULT 'gzip',
        PRIMARY KEY (agent_id, layer_index),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )`,

      // Agent Memory and Knowledge Base
      `CREATE TABLE IF NOT EXISTS agent_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        key TEXT NOT NULL,
        value_data BLOB NOT NULL,
        importance_score REAL DEFAULT 0.5,
        access_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        ttl_expires INTEGER DEFAULT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )`,

      // Performance Metrics and Monitoring
      `CREATE TABLE IF NOT EXISTS agent_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        recorded_at INTEGER NOT NULL,
        context_json TEXT DEFAULT '{}',
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )`,

      // Cross-Session State Management
      `CREATE TABLE IF NOT EXISTS session_state (
        id TEXT PRIMARY KEY,
        swarm_topology TEXT NOT NULL,
        active_agents TEXT NOT NULL,
        coordination_state BLOB NOT NULL,
        created_at INTEGER NOT NULL,
        last_checkpoint INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )`
    ];

    for (const schema of schemas) {
      this.db.exec(schema);
    }

    console.log('📋 Database schema created successfully');
  }

  /**
   * Create indexes for Phase 2A performance requirements
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status, last_active)',
      'CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type, status)',
      'CREATE INDEX IF NOT EXISTS idx_neural_weights_agent ON neural_weights(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(agent_id, memory_type)',
      'CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON agent_memory(importance_score DESC, last_accessed DESC)',
      'CREATE INDEX IF NOT EXISTS idx_metrics_agent_type ON agent_metrics(agent_id, metric_type, recorded_at)',
      'CREATE INDEX IF NOT EXISTS idx_session_active ON session_state(is_active, last_checkpoint)'
    ];

    for (const index of indexes) {
      this.db.exec(index);
    }

    console.log('🔍 Database indexes created successfully');
  }

  /**
   * Save agent configuration to database
   * Performance target: <50ms
   */
  async saveAgent(config: AgentConfig): Promise<AgentConfig> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    // TDD Green Phase: Implement input validation as expected by tests
    
    // Check if config is empty or null
    if (!config || typeof config !== 'object') {
      throw new Error('Agent configuration is required');
    }
    
    // Check for required fields
    if (!config.id) {
      throw new Error('Agent ID is required');
    }
    
    if (!config.type) {
      throw new Error('Agent type is required');
    }
    
    // Validate agent type
    const validTypes = ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'tester', 'reviewer'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid agent type: ${config.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const startTime = performance.now();

    try {
      // Ensure WAL checkpoint for immediate visibility
      this.db.pragma('wal_checkpoint(PASSIVE)');
      
      const stmt = this.db.prepare(`
        INSERT INTO agents (
          id, type, status, cognitive_pattern, network_layers, learning_rate, momentum,
          created_at, last_active, memory_usage_mb, performance_score, spawn_time_ms,
          config_json, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        config.id,
        config.type,
        config.status || 'spawning',
        config.cognitivePattern || 'default',
        JSON.stringify(config.networkLayers || []),
        config.learningRate || 0.01,
        config.momentum || 0.0,
        config.createdAt || Date.now(),
        config.lastActive || Date.now(),
        config.memoryUsageMB || 0,
        config.performanceScore || 0,
        config.spawnTimeMs || null,
        config.configJson || '{}',
        config.metadataJson || '{}'
      );

      // Debug: Log the successful save
      console.debug(`🔍 Agent saved successfully: ${config.id}, changes: ${result.changes}, lastInsertRowid: ${result.lastInsertRowid}`);

      // Force WAL checkpoint to ensure data is immediately available for reads
      this.db.pragma('wal_checkpoint(FULL)');

      const saveTime = performance.now() - startTime;
      
      // Log performance warning if exceeding threshold
      if (saveTime > 50) {
        console.warn(`⚠️ Agent save time exceeded threshold: ${saveTime.toFixed(2)}ms`);
      }

      // Return the config with defaults applied for consistency
      return {
        ...config,
        status: config.status || 'spawning',
        cognitivePattern: config.cognitivePattern || 'default',
        networkLayers: config.networkLayers || [],
        learningRate: config.learningRate || 0.01,
        momentum: config.momentum || 0.0,
        createdAt: config.createdAt || Date.now(),
        lastActive: config.lastActive || Date.now(),
        memoryUsageMB: config.memoryUsageMB || 0,
        performanceScore: config.performanceScore || 0,
        configJson: config.configJson || '{}',
        metadataJson: config.metadataJson || '{}'
      };

    } catch (error) {
      const saveTime = performance.now() - startTime;
      
      // If it's a database constraint error (like UNIQUE constraint), re-throw with specific message
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`UNIQUE constraint failed: Agent with ID ${config.id} already exists`);
      }
      
      // If it's a validation error, re-throw it
      if (error.message.includes('required') || error.message.includes('Invalid')) {
        throw error;
      }
      
      console.error(`❌ Failed to save agent ${config.id} (${saveTime.toFixed(2)}ms):`, error.message);
      throw new Error(`Failed to save agent: ${error.message}`);
    }
  }

  /**
   * Retrieve agent by ID
   * Performance target: <50ms
   */
  async getAgent(id: string): Promise<AgentConfig | null> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    // Security validation - but bypass sanitization for agent IDs as they're internal identifiers
    const validation = this.securityValidator.validateSQLParameters(
      'SELECT * FROM agents WHERE id = ?',
      [id]
    );
    if (!validation.isValid) {
      throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use original parameter for agent ID lookup (security validator corrupts hyphens)
    const queryParam = id;

    const startTime = performance.now();

    try {
      // Ensure we read from the latest WAL state
      this.db.pragma('wal_checkpoint(PASSIVE)');
      
      const stmt = this.db.prepare(`
        SELECT * FROM agents WHERE id = ?
      `);

      const row = stmt.get(queryParam) as any;

      // Debug: Check if we found the row
      console.debug(`🔍 Query for agent ${id}: found = ${!!row}`);
      if (row) {
        console.debug(`🔍 Found agent data: id=${row.id}, type=${row.type}, status=${row.status}`);
      }

      const retrieveTime = performance.now() - startTime;
      
      // Log performance warning if exceeding threshold
      if (retrieveTime > 50) {
        console.warn(`⚠️ Agent retrieval time exceeded threshold: ${retrieveTime.toFixed(2)}ms`);
      }

      if (!row) {
        // Debug: Check if there are any agents in the database
        const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM agents');
        const countResult = countStmt.get() as any;
        console.debug(`🔍 Total agents in database: ${countResult.count}`);
        
        // List all agent IDs
        const listStmt = this.db.prepare('SELECT id FROM agents');
        const allIds = listStmt.all() as any[];
        console.debug(`🔍 All agent IDs in database: ${allIds.map(a => a.id).join(', ')}`);
        
        console.debug(`🔍 Agent not found in database: ${id}`);
        return null;
      }

      return {
        id: row.id,
        type: row.type,
        cognitivePattern: row.cognitive_pattern,
        networkLayers: JSON.parse(row.network_layers || '[]'),
        learningRate: row.learning_rate,
        momentum: row.momentum,
        status: row.status,
        createdAt: row.created_at,
        lastActive: row.last_active,
        memoryUsageMB: row.memory_usage_mb,
        performanceScore: row.performance_score,
        spawnTimeMs: row.spawn_time_ms,
        configJson: row.config_json || '{}',
        metadataJson: row.metadata_json || '{}'
      };

    } catch (error) {
      const retrieveTime = performance.now() - startTime;
      console.error(`❌ Failed to retrieve agent ${id} (${retrieveTime.toFixed(2)}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Update agent status atomically
   * Performance target: <50ms
   */
  async updateAgentStatus(id: string, status: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    // Security validation - but preserve original parameters for agent operations
    const validation = this.securityValidator.validateSQLParameters(
      'UPDATE agents SET status = ?, last_active = ? WHERE id = ?',
      [status, Date.now(), id]
    );
    if (!validation.isValid) {
      throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use original parameters (security validator corrupts agent IDs with hyphens)
    const updateParams = [status, Date.now(), id];

    const startTime = performance.now();

    try {
      // Ensure we're working with the latest WAL state
      this.db.pragma('wal_checkpoint(PASSIVE)');
      
      // First verify the agent exists
      const checkStmt = this.db.prepare('SELECT id FROM agents WHERE id = ?');
      const existingAgent = checkStmt.get(updateParams[2]);
      
      if (!existingAgent) {
        throw new Error(`Agent not found: ${id}`);
      }
      
      const stmt = this.db.prepare(`
        UPDATE agents SET status = ?, last_active = ? WHERE id = ?
      `);

      const result = stmt.run(updateParams[0], updateParams[1], updateParams[2]);

      // Force WAL checkpoint to ensure update is immediately visible
      this.db.pragma('wal_checkpoint(FULL)');

      const updateTime = performance.now() - startTime;
      
      // Log performance warning if exceeding threshold
      if (updateTime > 50) {
        console.warn(`⚠️ Agent status update time exceeded threshold: ${updateTime.toFixed(2)}ms`);
      }

    } catch (error) {
      const updateTime = performance.now() - startTime;
      console.error(`❌ Failed to update agent status ${id} (${updateTime.toFixed(2)}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Record performance metric
   */
  async recordMetric(metric: AgentMetric): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO agent_metrics (agent_id, metric_type, value, unit, recorded_at, context_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metric.agentId,
      metric.metricType,
      metric.value,
      metric.unit,
      metric.recordedAt,
      JSON.stringify(metric.context || {})
    );
  }

  /**
   * Get agent metrics by type
   */
  async getAgentMetrics(agentId: string, metricType?: string): Promise<AgentMetric[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    let query = 'SELECT * FROM agent_metrics WHERE agent_id = ?';
    const params: any[] = [agentId];

    if (metricType) {
      query += ' AND metric_type = ?';
      params.push(metricType);
    }

    query += ' ORDER BY recorded_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      agentId: row.agent_id,
      metricType: row.metric_type,
      value: row.value,
      unit: row.unit,
      recordedAt: row.recorded_at,
      context: JSON.parse(row.context_json || '{}')
    }));
  }

  /**
   * Batch save multiple agents efficiently
   */
  async batchSaveAgents(agents: AgentConfig[]): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const startTime = performance.now();

    try {
      const transaction = this.db.transaction((agentList: AgentConfig[]) => {
        const stmt = this.db!.prepare(`
          INSERT INTO agents (
            id, type, status, cognitive_pattern, network_layers, learning_rate, momentum,
            created_at, last_active, memory_usage_mb, performance_score, spawn_time_ms,
            config_json, metadata_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const agent of agentList) {
          stmt.run(
            agent.id,
            agent.type,
            agent.status,
            agent.cognitivePattern,
            JSON.stringify(agent.networkLayers),
            agent.learningRate || 0.01,
            agent.momentum || 0.0,
            agent.createdAt,
            agent.lastActive,
            agent.memoryUsageMB || 0,
            agent.performanceScore || 0,
            agent.spawnTimeMs,
            agent.configJson || '{}',
            agent.metadataJson || '{}'
          );
        }
      });

      transaction(agents);

      const batchTime = performance.now() - startTime;
      const avgTime = batchTime / agents.length;

      console.log(`📊 Batch saved ${agents.length} agents in ${batchTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms/agent)`);

    } catch (error) {
      const batchTime = performance.now() - startTime;
      console.error(`❌ Failed to batch save agents (${batchTime.toFixed(2)}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Get all agents with optional filtering
   */
  async getAllAgents(filter?: { type?: string; status?: string }): Promise<AgentConfig[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    let query = 'SELECT * FROM agents';
    const params: any[] = [];

    if (filter) {
      const conditions: string[] = [];
      
      if (filter.type) {
        conditions.push('type = ?');
        params.push(filter.type);
      }
      
      if (filter.status) {
        conditions.push('status = ?');
        params.push(filter.status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }

    query += ' ORDER BY created_at DESC';

    // Security validation for parameterized query
    const validation = this.securityValidator.validateSQLParameters(query, params);
    if (!validation.isValid) {
      throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...(validation.sanitizedInput || params)) as any[];

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      cognitivePattern: row.cognitive_pattern,
      networkLayers: JSON.parse(row.network_layers),
      learningRate: row.learning_rate,
      momentum: row.momentum,
      status: row.status,
      createdAt: row.created_at,
      lastActive: row.last_active,
      memoryUsageMB: row.memory_usage_mb,
      performanceScore: row.performance_score,
      spawnTimeMs: row.spawn_time_ms,
      configJson: row.config_json,
      metadataJson: row.metadata_json
    }));
  }

  /**
   * Get database table names (for testing)
   */
  async getTables(): Promise<string[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => row.name);
  }

  /**
   * Get database index names (for testing)
   */
  async getIndexes(): Promise<string[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => row.name);
  }

  /**
   * Get journal mode (for testing)
   */
  async getJournalMode(): Promise<string> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const result = this.db.pragma('journal_mode');
    
    // Handle both string and object responses from better-sqlite3
    if (typeof result === 'string') {
      return result;
    } else if (Array.isArray(result) && result.length > 0 && result[0] && 'journal_mode' in result[0]) {
      return (result[0] as any).journal_mode;
    } else if (typeof result === 'object' && result && 'journal_mode' in result) {
      return (result as any).journal_mode;
    }
    
    return 'unknown';
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('🔒 Database connection closed');
  }
}