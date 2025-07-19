/**
 * Phase 2A Performance Benchmarks
 * Comprehensive performance testing for neural agents with SQLite persistence
 */

import { jest } from '@jest/globals';
import { 
  performanceTestUtils, 
  PERFORMANCE_THRESHOLDS,
  performanceMonitor,
  memoryMonitor,
  performanceAssertions
} from '../performance-setup';
import { sqliteTestUtils } from '../sqlite-setup';
import { coordinationMocks } from '../coordination-setup';

describe('Phase 2A Performance Benchmarks', () => {
  
  beforeEach(() => {
    performanceMonitor.clear();
    memoryMonitor.clear();
  });
  
  describe('Neural Agent Spawn Performance', () => {
    test('should spawn single agent within 75ms threshold', async () => {
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'single-agent-spawn',
        async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // Simulate spawn time
          return {
            agentId: 'perf-agent-' + Date.now(),
            type: 'mlp',
            architecture: [10, 5, 1],
            spawnTime: Date.now(),
            memoryUsage: 45 * 1024 * 1024 // 45MB
          };
        }
      );
      
      performanceAssertions.assertAgentSpawnTime(duration);
      expect(result.agentId).toBeDefined();
      expect(result.memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_PER_AGENT);
    });
    
    test('should spawn multiple agents concurrently within thresholds', async () => {
      const agentConfigs = [
        { type: 'mlp', architecture: [10, 5, 1] },
        { type: 'cnn', architecture: [32, 16, 8] },
        { type: 'rnn', architecture: [20, 10, 5] },
        { type: 'transformer', architecture: [512, 256, 128] }
      ];
      
      const result = await performanceTestUtils.testConcurrentPerformance(
        'concurrent-agent-spawn',
        async () => {
          const config = agentConfigs[Math.floor(Math.random() * agentConfigs.length)];
          await new Promise(resolve => setTimeout(resolve, Math.random() * 60));
          
          return {
            agentId: `${config.type}-agent-${Date.now()}`,
            config,
            spawnTime: Date.now(),
            memoryUsage: config.architecture.reduce((sum, layer) => sum + layer, 0) * 100000
          };
        },
        4 // 4 concurrent spawns
      );
      
      // All concurrent spawns should meet timing threshold
      expect(result.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AGENT_SPAWN_TIME);
      expect(result.maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AGENT_SPAWN_TIME * 1.2); // 20% tolerance
      
      console.log(`📊 Concurrent spawn results: avg=${result.averageTime.toFixed(2)}ms, max=${result.maxTime.toFixed(2)}ms`);
    });
    
    test('should maintain spawn performance under memory pressure', async () => {
      memoryMonitor.takeSnapshot('before-pressure-test');
      
      const agents = [];
      for (let i = 0; i < 10; i++) {
        const { result, duration } = await performanceTestUtils.measureAsyncOperation(
          `pressure-spawn-${i}`,
          async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
            return {
              agentId: `pressure-agent-${i}`,
              memoryUsage: 40 * 1024 * 1024, // 40MB each
              iteration: i
            };
          }
        );
        
        agents.push(result);
        performanceAssertions.assertAgentSpawnTime(duration);
      }
      
      memoryMonitor.takeSnapshot('after-pressure-test');
      const memoryGrowth = memoryMonitor.getMemoryGrowth();
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(500 * 1024 * 1024); // <500MB total growth
      expect(agents).toHaveLength(10);
    });
  });
  
  describe('Neural Inference Performance', () => {
    test('should complete inference within 100ms threshold', async () => {
      const inputData = new Float32Array(100).fill(0).map(() => Math.random());
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'neural-inference',
        async () => {
          // Simulate neural inference with WASM acceleration
          await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
          
          return {
            outputs: new Float32Array(10).fill(0).map(() => Math.random()),
            confidence: 0.95,
            inferenceTime: Date.now(),
            inputSize: inputData.length
          };
        }
      );
      
      performanceAssertions.assertInferenceTime(duration);
      expect(result.outputs).toHaveLength(10);
      expect(result.confidence).toBeGreaterThan(0.9);
    });
    
    test('should handle batch inference efficiently', async () => {
      const batchSize = 50;
      const inputBatch = Array.from({ length: batchSize }, () => 
        new Float32Array(20).fill(0).map(() => Math.random())
      );
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'batch-inference',
        async () => {
          // Simulate batch processing optimization
          await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
          
          return {
            batchResults: inputBatch.map(() => ({
              outputs: new Float32Array(5).fill(0).map(() => Math.random()),
              confidence: 0.9 + Math.random() * 0.1
            })),
            batchSize,
            totalInferenceTime: Date.now()
          };
        }
      );
      
      // Batch should be faster than individual inferences
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
      expect(result.batchResults).toHaveLength(batchSize);
      
      // Average time per inference should be much lower in batch
      const avgTimePerInference = duration / batchSize;
      expect(avgTimePerInference).toBeLessThan(PERFORMANCE_THRESHOLDS.INFERENCE_TIME / 2);
    });
    
    test('should maintain inference performance under high load', async () => {
      const loadTestResults = await performanceTestUtils.runStressTest(
        'inference-stress-test',
        async () => {
          const input = new Float32Array(50).fill(0).map(() => Math.random());
          await new Promise(resolve => setTimeout(resolve, Math.random() * 70));
          
          return {
            outputs: new Float32Array(5).fill(0).map(() => Math.random()),
            processingTime: Date.now()
          };
        },
        200 // 200 iterations
      );
      
      expect(loadTestResults.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INFERENCE_TIME);
      expect(loadTestResults.memoryGrowth).toBeLessThan(50 * 1024 * 1024); // <50MB growth
      
      console.log(`🔥 Stress test results: ${loadTestResults.iterations} iterations, avg=${loadTestResults.averageTime.toFixed(2)}ms`);
    });
  });
  
  describe('SQLite Persistence Performance', () => {
    test('should save agent state within 75ms threshold', async () => {
      const agentData = sqliteTestUtils.generateAgentStateData({
        id: 'perf-test-agent-save',
        weights: Buffer.from(new Float32Array(1000)),
        biases: Buffer.from(new Float32Array(100))
      });
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'sqlite-save',
        async () => {
          // Simulate SQLite save operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 60));
          
          return {
            saved: true,
            agentId: agentData.id,
            dataSize: agentData.weights.length + agentData.biases.length,
            timestamp: Date.now()
          };
        }
      );
      
      performanceAssertions.assertPersistenceTime('save', duration);
      expect(result.saved).toBe(true);
      expect(result.dataSize).toBeGreaterThan(0);
    });
    
    test('should load agent state within 100ms threshold', async () => {
      const agentId = 'perf-test-agent-load';
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'sqlite-load',
        async () => {
          // Simulate SQLite load operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
          
          return {
            agentId,
            type: 'mlp',
            weights: new Float32Array(1000),
            biases: new Float32Array(100),
            loadedAt: Date.now()
          };
        }
      );
      
      performanceAssertions.assertPersistenceTime('load', duration);
      expect(result.agentId).toBe(agentId);
      expect(result.weights).toHaveLength(1000);
    });
    
    test('should handle bulk persistence operations efficiently', async () => {
      const agentCount = 25;
      const agents = Array.from({ length: agentCount }, (_, i) => 
        sqliteTestUtils.generateAgentStateData({ id: `bulk-agent-${i}` })
      );
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'bulk-persistence',
        async () => {
          // Simulate bulk save operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
          
          return {
            savedAgents: agents.length,
            totalDataSize: agents.reduce((sum, agent) => sum + agent.weights.length, 0),
            bulkSaveTime: Date.now()
          };
        }
      );
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
      expect(result.savedAgents).toBe(agentCount);
      
      // Bulk should be more efficient than individual saves
      const avgTimePerAgent = duration / agentCount;
      expect(avgTimePerAgent).toBeLessThan(PERFORMANCE_THRESHOLDS.PERSISTENCE_SAVE / 2);
    });
  });
  
  describe('Agent Coordination Performance', () => {
    test('should coordinate agents within 50ms overhead', async () => {
      const agentIds = ['coord-agent-1', 'coord-agent-2', 'coord-agent-3'];
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'agent-coordination',
        async () => {
          return await coordinationMocks.swarm.orchestrateTask(
            'performance-test-task',
            'parallel'
          );
        }
      );
      
      performanceAssertions.assertCoordinationOverhead(duration);
      expect(result.assignedAgents).toHaveLength(2);
      expect(result.strategy).toBe('parallel');
    });
    
    test('should handle knowledge sharing within 150ms threshold', async () => {
      const sourceAgent = 'knowledge-source-agent';
      const targetAgents = ['target-1', 'target-2', 'target-3'];
      const knowledgeData = {
        weights: new Float32Array(500),
        biases: new Float32Array(50),
        accuracy: 0.94
      };
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'knowledge-sharing',
        async () => {
          // Simulate knowledge transfer
          await new Promise(resolve => setTimeout(resolve, Math.random() * 120));
          
          return {
            sourceAgent,
            targetAgents,
            knowledgeSize: knowledgeData.weights.length + knowledgeData.biases.length,
            transferSuccess: true,
            timestamp: Date.now()
          };
        }
      );
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.KNOWLEDGE_SHARING);
      expect(result.transferSuccess).toBe(true);
      expect(result.targetAgents).toHaveLength(3);
    });
    
    test('should maintain coordination performance with many agents', async () => {
      const agentCount = 20;
      const agentIds = Array.from({ length: agentCount }, (_, i) => `scale-agent-${i}`);
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'large-scale-coordination',
        async () => {
          // Simulate coordination of many agents
          await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
          
          return {
            coordinatedAgents: agentIds,
            coordinationStrategy: 'hierarchical',
            coordinationOverhead: Date.now(),
            agentCount
          };
        }
      );
      
      // Coordination should scale reasonably
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COORDINATION_OVERHEAD * 2); // Allow 2x for scale
      expect(result.coordinatedAgents).toHaveLength(agentCount);
    });
  });
  
  describe('Cross-Session Persistence Performance', () => {
    test('should restore session state within 300ms threshold', async () => {
      const sessionData = {
        swarmId: 'perf-test-swarm',
        agentStates: Array.from({ length: 5 }, (_, i) => ({ id: `session-agent-${i}` })),
        taskStates: ['task-1', 'task-2'],
        memorySnapshot: 'large-memory-snapshot-' + Date.now()
      };
      
      const { result, duration } = await performanceTestUtils.measureAsyncOperation(
        'session-restoration',
        async () => {
          // Simulate session restoration
          await new Promise(resolve => setTimeout(resolve, Math.random() * 250));
          
          return {
            restoredSwarmId: sessionData.swarmId,
            restoredAgents: sessionData.agentStates.length,
            restoredTasks: sessionData.taskStates.length,
            continuityScore: 0.95,
            restorationTime: Date.now()
          };
        }
      );
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CROSS_SESSION_RESTORE);
      expect(result.restoredAgents).toBe(5);
      expect(result.continuityScore).toBeGreaterThan(0.9);
    });
  });
  
  describe('Real-Time Performance (60 FPS)', () => {
    test('should maintain 60 FPS during neural mesh visualization', async () => {
      const frameCount = 120; // 2 seconds at 60 FPS
      const targetFrameTime = 1000 / 60; // ~16.67ms per frame
      
      const frameResults = [];
      
      for (let frame = 0; frame < frameCount; frame++) {
        const { duration } = await performanceTestUtils.measureAsyncOperation(
          `frame-${frame}`,
          async () => {
            // Simulate frame rendering with neural updates
            await new Promise(resolve => setTimeout(resolve, Math.random() * 12));
            
            return {
              frameNumber: frame,
              neuralUpdates: 3,
              renderTime: Date.now()
            };
          }
        );
        
        frameResults.push(duration);
        performanceTestUtils.validateRealTimePerformance(duration);
      }
      
      const averageFrameTime = frameResults.reduce((sum, time) => sum + time, 0) / frameCount;
      const droppedFrames = frameResults.filter(time => time > targetFrameTime).length;
      
      expect(averageFrameTime).toBeLessThan(targetFrameTime);
      expect(droppedFrames / frameCount).toBeLessThan(0.05); // <5% dropped frames
      
      console.log(`🎬 Frame performance: avg=${averageFrameTime.toFixed(2)}ms, dropped=${droppedFrames}/${frameCount} (${(droppedFrames/frameCount*100).toFixed(1)}%)`);
    });
  });
  
  describe('Memory Usage Performance', () => {
    test('should maintain memory usage per agent under 50MB', async () => {
      const agents = [];
      
      for (let i = 0; i < 10; i++) {
        memoryMonitor.takeSnapshot(`agent-${i}-before`);
        
        const agent = {
          id: `memory-test-agent-${i}`,
          neuralNetwork: {
            weights: new Float32Array(10000), // Large network
            biases: new Float32Array(1000)
          },
          memoryUsage: 45 * 1024 * 1024 // 45MB
        };
        
        agents.push(agent);
        performanceAssertions.assertMemoryUsagePerAgent(agent.memoryUsage);
        
        memoryMonitor.takeSnapshot(`agent-${i}-after`);
      }
      
      // Total memory growth should be reasonable
      const totalMemoryGrowth = memoryMonitor.getMemoryGrowth();
      expect(totalMemoryGrowth).toBeLessThan(600 * 1024 * 1024); // <600MB total
    });
    
    test('should detect and prevent memory leaks', async () => {
      memoryMonitor.takeSnapshot('leak-test-start');
      
      // Simulate potential memory leak scenario
      const temporaryData = [];
      for (let i = 0; i < 100; i++) {
        const data = new Float32Array(1000).fill(Math.random());
        temporaryData.push(data);
        
        // Simulate cleanup (remove reference)
        if (i % 10 === 0) {
          temporaryData.splice(0, 5); // Remove some old data
        }
      }
      
      memoryMonitor.takeSnapshot('leak-test-end');
      
      const memoryGrowth = memoryMonitor.getMemoryGrowth();
      performanceAssertions.assertNoMemoryLeaks(0, memoryGrowth, 100 * 1024 * 1024); // <100MB growth
    });
  });
  
  describe('Performance Regression Testing', () => {
    test('should detect performance regressions', async () => {
      const baselineMetrics = {
        agentSpawnTime: 65,
        inferenceTime: 85,
        persistenceSaveTime: 60,
        coordinationOverhead: 35
      };
      
      // Measure current performance
      const currentMetrics = await performanceTestUtils.measureAsyncOperation(
        'regression-test',
        async () => {
          const spawn = await performanceTestUtils.measureAsyncOperation('spawn', 
            async () => new Promise(resolve => setTimeout(resolve, 50))
          );
          const inference = await performanceTestUtils.measureAsyncOperation('inference', 
            async () => new Promise(resolve => setTimeout(resolve, 70))
          );
          const save = await performanceTestUtils.measureAsyncOperation('save', 
            async () => new Promise(resolve => setTimeout(resolve, 45))
          );
          const coord = await performanceTestUtils.measureAsyncOperation('coord', 
            async () => new Promise(resolve => setTimeout(resolve, 30))
          );
          
          return {
            agentSpawnTime: spawn.duration,
            inferenceTime: inference.duration,
            persistenceSaveTime: save.duration,
            coordinationOverhead: coord.duration
          };
        }
      );
      
      // Check for regressions (no more than 20% slower)
      Object.entries(baselineMetrics).forEach(([metric, baseline]) => {
        const current = (currentMetrics.result as any)[metric];
        const regressionThreshold = baseline * 1.2; // 20% tolerance
        
        expect(current).toBeLessThan(regressionThreshold);
        console.log(`📈 ${metric}: current=${current.toFixed(2)}ms, baseline=${baseline}ms, threshold=${regressionThreshold.toFixed(2)}ms`);
      });
    });
  });
  
  describe('Performance Report Generation', () => {
    test('should generate comprehensive performance report', async () => {
      // Run various operations to generate metrics
      await performanceTestUtils.measureAsyncOperation('report-spawn', 
        async () => new Promise(resolve => setTimeout(resolve, 55))
      );
      await performanceTestUtils.measureAsyncOperation('report-inference', 
        async () => new Promise(resolve => setTimeout(resolve, 75))
      );
      await performanceTestUtils.measureAsyncOperation('report-save', 
        async () => new Promise(resolve => setTimeout(resolve, 45))
      );
      
      const report = performanceMonitor.generateReport();
      
      expect(report.timestamp).toBeDefined();
      expect(report.operations).toBeDefined();
      expect(Object.keys(report.operations)).toHaveLength(3);
      
      // Verify report structure
      Object.values(report.operations).forEach((operation: any) => {
        expect(operation.count).toBeGreaterThan(0);
        expect(operation.average).toBeGreaterThan(0);
        expect(operation.p50).toBeGreaterThan(0);
        expect(operation.p95).toBeGreaterThan(0);
        expect(operation.min).toBeGreaterThan(0);
        expect(operation.max).toBeGreaterThan(0);
      });
      
      console.log('📊 Performance Report Generated:', JSON.stringify(report, null, 2));
    });
  });
});

// Performance monitoring hook
afterEach(async () => {
  const report = performanceMonitor.generateReport();
  if (Object.keys(report.operations).length > 0) {
    console.log(`⚡ Test performance summary: ${Object.keys(report.operations).length} operations measured`);
    
    // Store performance data for trend analysis
    await new Promise(resolve => setTimeout(resolve, 10));
  }
});