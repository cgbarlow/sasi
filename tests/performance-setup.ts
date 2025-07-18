/**
 * Performance Test Setup for Phase 2A
 * Specialized setup for performance benchmarking with strict thresholds
 */

import { jest } from '@jest/globals';

// Performance thresholds for Phase 2A
export const PERFORMANCE_THRESHOLDS = {
  AGENT_SPAWN_TIME: 75,     // <75ms agent spawn time
  INFERENCE_TIME: 100,      // <100ms neural inference
  PERSISTENCE_SAVE: 75,     // <75ms database save operations
  PERSISTENCE_LOAD: 100,    // <100ms database load operations
  COORDINATION_OVERHEAD: 50, // <50ms coordination between agents
  MEMORY_USAGE_PER_AGENT: 50 * 1024 * 1024, // <50MB per agent
  REAL_TIME_FPS: 60,        // 60 FPS for real-time performance
  BATCH_PROCESSING: 200,    // <200ms for batch operations
  KNOWLEDGE_SHARING: 150,   // <150ms for knowledge transfer between agents
  CROSS_SESSION_RESTORE: 300 // <300ms for cross-session state restoration
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, any[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  startMeasurement(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }
  
  endMeasurement(operationId: string, metadata: any = {}): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`No start time found for operation: ${operationId}`);
    }
    
    const duration = performance.now() - startTime;
    
    const metric = {
      operationId,
      duration,
      timestamp: Date.now(),
      metadata
    };
    
    const operationMetrics = this.metrics.get(operationId) || [];
    operationMetrics.push(metric);
    this.metrics.set(operationId, operationMetrics);
    
    this.startTimes.delete(operationId);
    return duration;
  }
  
  getMetrics(operationId: string): any[] {
    return this.metrics.get(operationId) || [];
  }
  
  getAverageTime(operationId: string): number {
    const metrics = this.getMetrics(operationId);
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / metrics.length;
  }
  
  getPercentile(operationId: string, percentile: number): number {
    const metrics = this.getMetrics(operationId);
    if (metrics.length === 0) return 0;
    
    const sorted = metrics.map(m => m.duration).sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[index];
  }
  
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
  
  generateReport(): any {
    const report: any = {
      timestamp: Date.now(),
      operations: {}
    };
    
    for (const [operationId, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        report.operations[operationId] = {
          count: metrics.length,
          average: this.getAverageTime(operationId),
          p50: this.getPercentile(operationId, 50),
          p95: this.getPercentile(operationId, 95),
          p99: this.getPercentile(operationId, 99),
          min: Math.min(...metrics.map(m => m.duration)),
          max: Math.max(...metrics.map(m => m.duration))
        };
      }
    }
    
    return report;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Memory monitoring utilities
export class MemoryMonitor {
  private snapshots: any[] = [];
  
  takeSnapshot(label: string): any {
    const memUsage = process.memoryUsage();
    const snapshot = {
      label,
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  }
  
  comparSnapshots(labelA: string, labelB: string): any {
    const snapshotA = this.snapshots.find(s => s.label === labelA);
    const snapshotB = this.snapshots.find(s => s.label === labelB);
    
    if (!snapshotA || !snapshotB) {
      throw new Error('Snapshots not found for comparison');
    }
    
    return {
      rssDelta: snapshotB.rss - snapshotA.rss,
      heapUsedDelta: snapshotB.heapUsed - snapshotA.heapUsed,
      heapTotalDelta: snapshotB.heapTotal - snapshotA.heapTotal,
      externalDelta: snapshotB.external - snapshotA.external
    };
  }
  
  getMemoryGrowth(): number {
    if (this.snapshots.length < 2) return 0;
    
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    
    return last.heapUsed - first.heapUsed;
  }
  
  clear(): void {
    this.snapshots = [];
  }
}

// Global memory monitor instance
export const memoryMonitor = new MemoryMonitor();

// Performance test utilities
export const performanceTestUtils = {
  /**
   * Assert operation meets performance threshold
   */
  assertPerformanceThreshold: (operationType: keyof typeof PERFORMANCE_THRESHOLDS, actualTime: number) => {
    const threshold = PERFORMANCE_THRESHOLDS[operationType];
    expect(actualTime).toBeLessThan(threshold);
  },
  
  /**
   * Measure async operation performance
   */
  measureAsyncOperation: async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    const operationId = `${operationName}-${Date.now()}`;
    performanceMonitor.startMeasurement(operationId);
    
    const result = await operation();
    const duration = performanceMonitor.endMeasurement(operationId);
    
    return { result, duration };
  },
  
  /**
   * Measure synchronous operation performance
   */
  measureSyncOperation: <T>(
    operationName: string,
    operation: () => T
  ): { result: T; duration: number } => {
    const operationId = `${operationName}-${Date.now()}`;
    performanceMonitor.startMeasurement(operationId);
    
    const result = operation();
    const duration = performanceMonitor.endMeasurement(operationId);
    
    return { result, duration };
  },
  
  /**
   * Run performance stress test
   */
  runStressTest: async (
    operationName: string,
    operation: () => Promise<any>,
    iterations: number = 100
  ): Promise<any> => {
    const results = [];
    
    memoryMonitor.takeSnapshot(`${operationName}-start`);
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await performanceTestUtils.measureAsyncOperation(
        `${operationName}-${i}`,
        operation
      );
      results.push(duration);
    }
    
    memoryMonitor.takeSnapshot(`${operationName}-end`);
    const memoryGrowth = memoryMonitor.getMemoryGrowth();
    
    return {
      iterations,
      averageTime: results.reduce((sum, time) => sum + time, 0) / results.length,
      minTime: Math.min(...results),
      maxTime: Math.max(...results),
      memoryGrowth,
      results
    };
  },
  
  /**
   * Test concurrent operations performance
   */
  testConcurrentPerformance: async (
    operationName: string,
    operation: () => Promise<any>,
    concurrency: number = 10
  ): Promise<any> => {
    memoryMonitor.takeSnapshot(`${operationName}-concurrent-start`);
    
    const promises = Array.from({ length: concurrency }, (_, i) =>
      performanceTestUtils.measureAsyncOperation(`${operationName}-concurrent-${i}`, operation)
    );
    
    const results = await Promise.all(promises);
    
    memoryMonitor.takeSnapshot(`${operationName}-concurrent-end`);
    const memoryGrowth = memoryMonitor.getMemoryGrowth();
    
    const durations = results.map(r => r.duration);
    
    return {
      concurrency,
      averageTime: durations.reduce((sum, time) => sum + time, 0) / durations.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      memoryGrowth,
      results
    };
  },
  
  /**
   * Validate real-time performance (60 FPS = ~16.67ms per frame)
   */
  validateRealTimePerformance: (frameTime: number) => {
    const fpsThreshold = 1000 / PERFORMANCE_THRESHOLDS.REAL_TIME_FPS; // ~16.67ms for 60 FPS
    expect(frameTime).toBeLessThan(fpsThreshold);
  },
  
  /**
   * Generate performance test scenarios
   */
  generatePerformanceScenarios: () => [
    {
      name: 'Agent Spawn Performance',
      thresholdType: 'AGENT_SPAWN_TIME' as keyof typeof PERFORMANCE_THRESHOLDS,
      operation: async () => {
        // Mock agent spawn
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return { agentId: 'test-agent', spawnTime: Date.now() };
      }
    },
    {
      name: 'Neural Inference Performance',
      thresholdType: 'INFERENCE_TIME' as keyof typeof PERFORMANCE_THRESHOLDS,
      operation: async () => {
        // Mock neural inference
        await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
        return [Math.random(), Math.random(), Math.random()];
      }
    },
    {
      name: 'Persistence Save Performance',
      thresholdType: 'PERSISTENCE_SAVE' as keyof typeof PERFORMANCE_THRESHOLDS,
      operation: async () => {
        // Mock database save
        await new Promise(resolve => setTimeout(resolve, Math.random() * 60));
        return { saved: true, timestamp: Date.now() };
      }
    },
    {
      name: 'Coordination Overhead Performance',
      thresholdType: 'COORDINATION_OVERHEAD' as keyof typeof PERFORMANCE_THRESHOLDS,
      operation: async () => {
        // Mock agent coordination
        await new Promise(resolve => setTimeout(resolve, Math.random() * 40));
        return { coordinated: true, agentCount: 3 };
      }
    }
  ]
};

// Performance assertion helpers
export const performanceAssertions = {
  /**
   * Assert agent spawn time meets threshold
   */
  assertAgentSpawnTime: (spawnTime: number) => {
    performanceTestUtils.assertPerformanceThreshold('AGENT_SPAWN_TIME', spawnTime);
  },
  
  /**
   * Assert neural inference time meets threshold
   */
  assertInferenceTime: (inferenceTime: number) => {
    performanceTestUtils.assertPerformanceThreshold('INFERENCE_TIME', inferenceTime);
  },
  
  /**
   * Assert persistence operation time meets threshold
   */
  assertPersistenceTime: (operationType: 'save' | 'load', operationTime: number) => {
    const thresholdType = operationType === 'save' ? 'PERSISTENCE_SAVE' : 'PERSISTENCE_LOAD';
    performanceTestUtils.assertPerformanceThreshold(thresholdType, operationTime);
  },
  
  /**
   * Assert coordination overhead meets threshold
   */
  assertCoordinationOverhead: (coordinationTime: number) => {
    performanceTestUtils.assertPerformanceThreshold('COORDINATION_OVERHEAD', coordinationTime);
  },
  
  /**
   * Assert memory usage per agent meets threshold
   */
  assertMemoryUsagePerAgent: (memoryUsage: number) => {
    expect(memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_PER_AGENT);
  },
  
  /**
   * Assert no memory leaks in operation
   */
  assertNoMemoryLeaks: (initialMemory: number, finalMemory: number, maxGrowth: number = 1024 * 1024) => {
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(maxGrowth);
  }
};

// Mock performance-critical components
export const mockPerformanceComponents = {
  fastNeuralInference: jest.fn().mockImplementation(async (input: Float32Array) => {
    // Simulate fast inference (<100ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
    return new Float32Array(input.length).map(() => Math.random());
  }),
  
  optimizedAgentSpawn: jest.fn().mockImplementation(async (config: any) => {
    // Simulate fast agent spawn (<75ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 60));
    return {
      agentId: 'fast-agent-' + Date.now(),
      config,
      spawnTime: Date.now()
    };
  }),
  
  rapidPersistence: jest.fn().mockImplementation(async (data: any) => {
    // Simulate fast persistence save (<75ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    return { saved: true, data, timestamp: Date.now() };
  }),
  
  efficientCoordination: jest.fn().mockImplementation(async (agents: string[]) => {
    // Simulate fast coordination (<50ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
    return { coordinated: agents, overhead: Date.now() };
  })
};

// Global performance test hooks
beforeEach(() => {
  performanceMonitor.clear();
  memoryMonitor.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  // Generate performance report if test failed
  if (expect.getState().currentTestName && expect.getState().assertionCalls > 0) {
    const report = performanceMonitor.generateReport();
    if (Object.keys(report.operations).length > 0) {
      console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
    }
  }
});

console.log('⚡ Performance test setup initialized');
console.log('🎯 Thresholds: <75ms spawn, <100ms inference, <50ms coordination');
console.log('📊 Memory monitoring enabled with leak detection');
console.log('🔄 Real-time performance validation ready (60 FPS)');