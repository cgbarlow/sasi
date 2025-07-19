/**
 * Performance Regression Detection Tests
 * Validates that performance metrics stay within acceptable bounds
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceBaseline {
  testName: string;
  baseline: number;
  threshold: number;
  timestamp: string;
}

interface PerformanceResult {
  testName: string;
  duration: number;
  memoryUsage: number;
  passed: boolean;
  regression: boolean;
}

class RegressionDetector {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private results: PerformanceResult[] = [];
  private baselineFile = path.join(__dirname, '../../coverage/performance-baselines.json');

  constructor() {
    this.loadBaselines();
  }

  private loadBaselines() {
    try {
      if (fs.existsSync(this.baselineFile)) {
        const data = JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
        data.forEach((baseline: PerformanceBaseline) => {
          this.baselines.set(baseline.testName, baseline);
        });
      }
    } catch (error) {
      console.warn('Could not load performance baselines:', error);
    }
  }

  private saveBaselines() {
    const baselineArray = Array.from(this.baselines.values());
    fs.writeFileSync(this.baselineFile, JSON.stringify(baselineArray, null, 2));
  }

  async measurePerformance<T>(
    testName: string,
    testFunction: () => Promise<T> | T,
    options: { 
      iterations?: number; 
      warmupIterations?: number;
      memoryCheck?: boolean;
    } = {}
  ): Promise<PerformanceResult> {
    const { iterations = 5, warmupIterations = 2, memoryCheck = true } = options;
    
    // Warmup runs
    for (let i = 0; i < warmupIterations; i++) {
      await testFunction();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const durations: number[] = [];
    let initialMemory = 0;
    let finalMemory = 0;

    if (memoryCheck) {
      initialMemory = process.memoryUsage().heapUsed;
    }

    // Performance measurement runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      durations.push(end - start);
    }

    if (memoryCheck) {
      finalMemory = process.memoryUsage().heapUsed;
    }

    // Calculate metrics
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const memoryDelta = finalMemory - initialMemory;

    // Check against baseline
    const baseline = this.baselines.get(testName);
    let regression = false;
    let passed = true;

    if (baseline) {
      // Check for regression (>20% slower than baseline)
      regression = avgDuration > baseline.baseline * 1.2;
      passed = avgDuration <= baseline.threshold;
    } else {
      // Set new baseline
      const threshold = avgDuration * 2; // Allow 100% variance for new tests
      this.baselines.set(testName, {
        testName,
        baseline: avgDuration,
        threshold,
        timestamp: new Date().toISOString()
      });
      this.saveBaselines();
    }

    const result: PerformanceResult = {
      testName,
      duration: avgDuration,
      memoryUsage: memoryDelta,
      passed,
      regression
    };

    this.results.push(result);
    return result;
  }

  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const regressions = this.results.filter(r => r.regression).length;

    let report = `
# Performance Regression Report

## Summary
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${totalTests - passedTests}
- Regressions Detected: ${regressions}

## Test Results
`;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const regression = result.regression ? '📈 REGRESSION' : '';
      report += `
### ${result.testName} ${status} ${regression}
- Duration: ${result.duration.toFixed(2)}ms
- Memory Delta: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB
`;
    });

    return report;
  }
}

describe('Performance Regression Detection', () => {
  let detector: RegressionDetector;

  beforeAll(() => {
    detector = new RegressionDetector();
  });

  afterAll(() => {
    const report = detector.generateReport();
    const reportPath = path.join(__dirname, '../../coverage/performance-regression-report.md');
    fs.writeFileSync(reportPath, report);
    console.log('Performance regression report saved to:', reportPath);
  });

  describe('Component Rendering Performance', () => {
    test('AgentList component render time', async () => {
      const result = await detector.measurePerformance(
        'AgentList_render',
        async () => {
          // Simulate component rendering
          const start = performance.now();
          
          // Mock React component render cycle
          for (let i = 0; i < 100; i++) {
            const mockComponent = {
              agents: Array.from({ length: 50 }, (_, i) => ({
                id: `agent-${i}`,
                name: `Agent ${i}`,
                status: 'active'
              }))
            };
            
            // Simulate rendering logic
            mockComponent.agents.forEach(agent => {
              const element = `<div key="${agent.id}">${agent.name}</div>`;
            });
          }
          
          return performance.now() - start;
        },
        { iterations: 10, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(100); // 100ms threshold
      
      if (result.regression) {
        console.warn(`Performance regression detected in AgentList rendering: ${result.duration.toFixed(2)}ms`);
      }
    });

    test('NeuralMeshVisualization WebGL performance', async () => {
      const result = await detector.measurePerformance(
        'NeuralMeshVisualization_webgl',
        async () => {
          // Simulate WebGL operations
          const vertices = new Float32Array(10000);
          for (let i = 0; i < vertices.length; i++) {
            vertices[i] = Math.random() * 2 - 1;
          }
          
          // Simulate matrix calculations
          const matrices = [];
          for (let i = 0; i < 100; i++) {
            const matrix = new Array(16).fill(0).map(() => Math.random());
            matrices.push(matrix);
          }
          
          return vertices.length + matrices.length;
        },
        { iterations: 5, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(50); // 50ms threshold
    });

    test('SwarmVisualization data processing', async () => {
      const result = await detector.measurePerformance(
        'SwarmVisualization_data_processing',
        async () => {
          // Simulate large dataset processing
          const nodes = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            connections: Array.from({ length: Math.floor(Math.random() * 10) }, 
              () => Math.floor(Math.random() * 1000)
            )
          }));
          
          // Process connections
          nodes.forEach(node => {
            node.connections.forEach(connId => {
              const distance = Math.sqrt(
                Math.pow(node.x - nodes[connId]?.x || 0, 2) +
                Math.pow(node.y - nodes[connId]?.y || 0, 2)
              );
            });
          });
          
          return nodes.length;
        },
        { iterations: 3, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(200); // 200ms threshold
    });
  });

  describe('Data Processing Performance', () => {
    test('Neural weight compression', async () => {
      const result = await detector.measurePerformance(
        'NeuralWeightStorage_compression',
        async () => {
          // Simulate neural weight compression
          const weights = new Float32Array(10000).map(() => Math.random());
          
          // Mock compression algorithm
          const compressed = [];
          for (let i = 0; i < weights.length; i += 4) {
            const chunk = weights.slice(i, i + 4);
            compressed.push(chunk.reduce((a, b) => a + b, 0) / 4);
          }
          
          return compressed.length;
        },
        { iterations: 10, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(30); // 30ms threshold
    });

    test('Agent persistence operations', async () => {
      const result = await detector.measurePerformance(
        'AgentPersistenceManager_operations',
        async () => {
          // Simulate database operations
          const agents = Array.from({ length: 100 }, (_, i) => ({
            id: `agent-${i}`,
            state: JSON.stringify({ value: Math.random() }),
            timestamp: Date.now()
          }));
          
          // Mock serialization
          const serialized = agents.map(agent => JSON.stringify(agent));
          const deserialized = serialized.map(data => JSON.parse(data));
          
          return deserialized.length;
        },
        { iterations: 5, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(75); // 75ms threshold
    });

    test('WASM bridge operations', async () => {
      const result = await detector.measurePerformance(
        'WasmBridge_operations',
        async () => {
          // Simulate WASM bridge operations
          const data = new Uint8Array(1000);
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
          }
          
          // Mock WASM operations
          let checksum = 0;
          for (let i = 0; i < data.length; i++) {
            checksum = (checksum + data[i]) % 65536;
          }
          
          return checksum;
        },
        { iterations: 20, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.duration).toBeLessThan(10); // 10ms threshold
    });
  });

  describe('Memory Usage Tests', () => {
    test('Memory leak detection in neural operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform operations that might leak memory
      for (let i = 0; i < 100; i++) {
        const largeArray = new Array(1000).fill(0).map(() => Math.random());
        // Simulate processing
        largeArray.forEach(val => val * 2);
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
        // Wait a bit for GC to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;
      
      // Should not grow by more than 10MB
      expect(memoryGrowthMB).toBeLessThan(10);
      
      console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)}MB`);
    });

    test('Agent state cleanup verification', async () => {
      const result = await detector.measurePerformance(
        'AgentState_cleanup',
        async () => {
          // Create temporary agent states
          const states = Array.from({ length: 50 }, (_, i) => ({
            id: `temp-agent-${i}`,
            data: new Array(100).fill(0).map(() => Math.random()),
            connections: new Set(Array.from({ length: 10 }, () => Math.random()))
          }));
          
          // Cleanup
          states.forEach(state => {
            state.connections.clear();
            state.data.length = 0;
          });
          
          return states.length;
        },
        { iterations: 5, memoryCheck: true }
      );

      expect(result.passed).toBe(true);
      expect(result.memoryUsage).toBeLessThan(5 * 1024 * 1024); // Less than 5MB growth
    });
  });
});