/**
 * TDD Unit Tests for Agent Persistence Manager
 * Tests SQLite database operations with Phase 2A performance requirements
 */

import { performance } from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';
import { AgentPersistenceManager } from '../../../src/persistence/AgentPersistenceManager';
import type { AgentConfig, AgentState } from '../../../src/types/agent';

describe('AgentPersistenceManager - TDD Implementation', () => {
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

  describe('Database Initialization - TDD Red Phase', () => {
    test('should create all required tables with proper schema', async () => {
      // TDD: Testing database schema creation
      const tables = await persistenceManager.getTables();
      
      expect(tables).toContain('agents');
      expect(tables).toContain('neural_weights');
      expect(tables).toContain('agent_memory');
      expect(tables).toContain('agent_metrics');
      expect(tables).toContain('session_state');
    });

    test('should create all required indexes for performance', async () => {
      // TDD: Testing index creation for Phase 2A performance requirements
      const indexes = await persistenceManager.getIndexes();
      
      expect(indexes).toContain('idx_agents_status');
      expect(indexes).toContain('idx_agents_type');
      expect(indexes).toContain('idx_neural_weights_agent');
      expect(indexes).toContain('idx_agent_memory_type');
      expect(indexes).toContain('idx_metrics_agent_type');
    });

    test('should enable WAL mode for concurrent access', async () => {
      // TDD: Testing WAL mode configuration
      const journalMode = await persistenceManager.getJournalMode();
      expect(journalMode).toBe('wal');
    });
  });

  describe('Agent CRUD Operations - TDD Red Phase', () => {
    test('should save agent with all required fields within 50ms', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: AgentConfig = {
        id: 'test-agent-001',
        type: 'researcher',
        cognitivePattern: 'divergent',
        networkLayers: [64, 128, 64, 32],
        learningRate: 0.7,
        momentum: 0.3,
        status: 'spawning' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsageMB: 0,
        performanceScore: 0,
        spawnTimeMs: null,
        configJson: JSON.stringify({
          temperature: 0.8,
          maxTokens: 2048
        }),
        metadataJson: JSON.stringify({
          priority: 'high',
          tags: ['research', 'analysis']
        })
      };

      const startTime = performance.now();
      const savedAgent = await persistenceManager.saveAgent(agentConfig);
      const saveTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(saveTime).toBeLessThan(50);

      // Validate saved data
      expect(savedAgent.id).toBe(agentConfig.id);
      expect(savedAgent.type).toBe(agentConfig.type);
      expect(savedAgent.status).toBe('spawning');
      expect(savedAgent.createdAt).toBeGreaterThan(0);
    });

    test('should retrieve agent by ID within 50ms', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: AgentConfig = {
        id: 'test-agent-002',
        type: 'coder',
        cognitivePattern: 'convergent',
        networkLayers: [128, 256, 128, 64],
        learningRate: 0.5,
        momentum: 0.2,
        status: 'active' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      await persistenceManager.saveAgent(agentConfig);

      const startTime = performance.now();
      const retrievedAgent = await persistenceManager.getAgent(agentConfig.id);
      const retrieveTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(retrieveTime).toBeLessThan(50);

      // Validate retrieved data
      expect(retrievedAgent).toBeDefined();
      expect(retrievedAgent!.id).toBe(agentConfig.id);
      expect(retrievedAgent!.type).toBe(agentConfig.type);
      expect(retrievedAgent!.cognitivePattern).toBe(agentConfig.cognitivePattern);
    });

    test('should update agent status atomically within 50ms', async () => {
      // TDD Red: This test should fail initially
      const agentId = 'test-agent-003';
      await persistenceManager.saveAgent({
        id: agentId,
        type: 'analyst',
        cognitivePattern: 'critical',
        networkLayers: [96, 192, 96, 48],
        status: 'spawning' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now()
      });

      const startTime = performance.now();
      await persistenceManager.updateAgentStatus(agentId, 'active');
      const updateTime = performance.now() - startTime;

      // Phase 2A requirement: database operations <50ms
      expect(updateTime).toBeLessThan(50);

      // Validate status change
      const updatedAgent = await persistenceManager.getAgent(agentId);
      expect(updatedAgent!.status).toBe('active');
    });

    test('should handle concurrent agent saves without corruption', async () => {
      // TDD Red: This test should fail initially
      const concurrentSaves = Array.from({ length: 10 }, (_, i) => 
        persistenceManager.saveAgent({
          id: `concurrent-agent-${i}`,
          type: 'optimizer',
          cognitivePattern: 'systems',
          networkLayers: [80, 160, 80, 40],
          status: 'spawning' as AgentState,
          createdAt: Date.now(),
          lastActive: Date.now()
        })
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

      // Average save time should be reasonable
      const avgSaveTime = totalTime / 10;
      expect(avgSaveTime).toBeLessThan(75); // Slightly higher threshold for concurrent operations
    });

    test('should prevent duplicate agent IDs', async () => {
      // TDD Red: This test should fail initially
      const agentConfig: AgentConfig = {
        id: 'duplicate-test',
        type: 'coordinator',
        cognitivePattern: 'adaptive',
        networkLayers: [112, 224, 112, 56],
        status: 'spawning' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      // First save should succeed
      await persistenceManager.saveAgent(agentConfig);

      // Second save should fail
      await expect(persistenceManager.saveAgent(agentConfig))
        .rejects.toThrow(/UNIQUE constraint failed/);
    });

    test('should validate required fields', async () => {
      // TDD Red: This test should fail initially
      
      // Missing required fields should fail
      await expect(persistenceManager.saveAgent({} as AgentConfig))
        .rejects.toThrow(/NOT NULL constraint failed/);

      await expect(persistenceManager.saveAgent({ 
        id: 'test',
        type: 'researcher' 
      } as AgentConfig))
        .rejects.toThrow(/NOT NULL constraint failed/);
    });
  });

  describe('Performance Metrics Tracking - TDD Red Phase', () => {
    test('should record agent spawn metrics', async () => {
      // TDD Red: This test should fail initially
      const agentId = 'metrics-test-agent';
      const spawnTime = 65; // ms

      await persistenceManager.saveAgent({
        id: agentId,
        type: 'researcher',
        cognitivePattern: 'divergent',
        networkLayers: [64, 128, 64],
        status: 'active' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now(),
        spawnTimeMs: spawnTime
      });

      await persistenceManager.recordMetric({
        agentId,
        metricType: 'spawn_time',
        value: spawnTime,
        unit: 'ms',
        recordedAt: Date.now(),
        context: { target: 75, status: 'pass' }
      });

      const metrics = await persistenceManager.getAgentMetrics(agentId, 'spawn_time');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(spawnTime);
      expect(metrics[0].unit).toBe('ms');
    });

    test('should track memory usage metrics', async () => {
      // TDD Red: This test should fail initially
      const agentId = 'memory-test-agent';
      const memoryUsage = 35.5; // MB

      await persistenceManager.saveAgent({
        id: agentId,
        type: 'coder',
        cognitivePattern: 'convergent',
        networkLayers: [128, 256, 128],
        status: 'active' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsageMB: memoryUsage
      });

      await persistenceManager.recordMetric({
        agentId,
        metricType: 'memory_usage',
        value: memoryUsage,
        unit: 'mb',
        recordedAt: Date.now(),
        context: { target: 50, status: 'pass' }
      });

      const metrics = await persistenceManager.getAgentMetrics(agentId, 'memory_usage');
      expect(metrics[0].value).toBe(memoryUsage);
      expect(metrics[0].unit).toBe('mb');
    });
  });

  describe('Batch Operations - TDD Red Phase', () => {
    test('should handle batch agent saves efficiently', async () => {
      // TDD Red: This test should fail initially
      const agents: AgentConfig[] = Array.from({ length: 50 }, (_, i) => ({
        id: `batch-agent-${i}`,
        type: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator'][i % 5] as any,
        cognitivePattern: ['convergent', 'divergent', 'critical', 'systems', 'adaptive'][i % 5] as any,
        networkLayers: [64, 128, 64, 32],
        status: 'spawning' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now()
      }));

      const startTime = performance.now();
      await persistenceManager.batchSaveAgents(agents);
      const batchTime = performance.now() - startTime;

      // Batch operation should be more efficient than individual saves
      expect(batchTime).toBeLessThan(200); // 200ms for 50 agents = 4ms per agent

      // Verify all agents were saved
      const savedAgents = await persistenceManager.getAllAgents();
      expect(savedAgents).toHaveLength(50);
    });
  });

  describe('Data Integrity and Consistency - TDD Red Phase', () => {
    test('should maintain ACID properties during concurrent operations', async () => {
      // TDD Red: This test should fail initially
      const concurrentOperations = [];

      // Simulate concurrent read/write operations
      for (let i = 0; i < 20; i++) {
        concurrentOperations.push(
          persistenceManager.saveAgent({
            id: `acid-test-${i}`,
            type: 'researcher',
            cognitivePattern: 'divergent',
            networkLayers: [64, 128, 64],
            status: 'spawning' as AgentState,
            createdAt: Date.now(),
            lastActive: Date.now()
          })
        );

        if (i > 5) {
          // Add some read operations
          concurrentOperations.push(
            persistenceManager.getAgent(`acid-test-${i - 5}`)
          );
        }
      }

      const startTime = performance.now();
      const results = await Promise.allSettled(concurrentOperations);
      const totalTime = performance.now() - startTime;

      // All operations should complete successfully
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures).toHaveLength(0);

      // Performance should still be reasonable
      expect(totalTime).toBeLessThan(500); // 500ms for mixed operations
    });
  });

  describe('Error Handling and Recovery - TDD Red Phase', () => {
    test('should handle database corruption gracefully', async () => {
      // TDD Red: This test should fail initially
      
      // Save some data first
      await persistenceManager.saveAgent({
        id: 'corruption-test',
        type: 'researcher',
        cognitivePattern: 'divergent',
        networkLayers: [64, 128, 64],
        status: 'active' as AgentState,
        createdAt: Date.now(),
        lastActive: Date.now()
      });

      // Close the database
      await persistenceManager.close();

      // Corrupt the database file (simulate corruption)
      fs.writeFileSync(testDbPath, 'corrupted data');

      // Try to initialize again - should handle corruption
      const corruptedManager = new AgentPersistenceManager(testDbPath);
      
      await expect(corruptedManager.initialize()).rejects.toThrow();
    });

    test('should implement connection pooling for high concurrency', async () => {
      // TDD Red: This test should fail initially
      
      // Test connection pooling under high load
      const highConcurrencyOps = Array.from({ length: 100 }, (_, i) =>
        persistenceManager.saveAgent({
          id: `pool-test-${i}`,
          type: 'researcher',
          cognitivePattern: 'divergent',
          networkLayers: [64, 128, 64],
          status: 'spawning' as AgentState,
          createdAt: Date.now(),
          lastActive: Date.now()
        })
      );

      const startTime = performance.now();
      await Promise.all(highConcurrencyOps);
      const totalTime = performance.now() - startTime;

      // Should handle high concurrency efficiently
      expect(totalTime).toBeLessThan(1000); // 1 second for 100 operations
    });
  });
});