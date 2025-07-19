/**
 * WASM Performance Tests
 * Tests WASM module performance and SIMD acceleration
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mockWasmModule, wasmTestUtils } from '../wasm-setup';
import { PerformanceTestUtils } from '../utils/neural-test-utils';

describe('WASM Performance Tests', () => {
  let memoryDetector: ReturnType<typeof PerformanceTestUtils.createMemoryLeakDetector>;

  beforeEach(() => {
    memoryDetector = PerformanceTestUtils.createMemoryLeakDetector();
  });

  afterEach(() => {
    // Check for memory leaks
    const analysis = memoryDetector.analyze();
    expect(analysis.leaked).toBe(false);
  });

  describe('SIMD Acceleration Performance', () => {
    test('should utilize SIMD for neural calculations', async () => {
      expect(mockWasmModule.simdSupported).toBe(true);
      
      const testSizes = [128, 512, 1024, 4096];
      
      for (const size of testSizes) {
        const input = wasmTestUtils.createPerformanceData(size);
        
        const time = await wasmTestUtils.benchmarkFunction(
          () => mockWasmModule.calculateNeuralActivation(input),
          50
        );
        
        // SIMD should enable very fast computation
        const timePerElement = time / size;
        expect(timePerElement).toBeLessThan(0.0005); // <0.5μs per element with SIMD
        
        console.log(`SIMD Performance (${size} elements): ${time.toFixed(2)}ms, ${(timePerElement * 1000000).toFixed(2)}ns per element`);
      }
    });

    test('should demonstrate performance multiplier', () => {
      expect(mockWasmModule.performanceMultiplier).toBeGreaterThan(2.0);
      
      const baseline = 100; // ms baseline time
      const expectedImprovement = baseline / mockWasmModule.performanceMultiplier;
      
      expect(expectedImprovement).toBeLessThan(50); // Should be less than half
      
      console.log(`Performance multiplier: ${mockWasmModule.performanceMultiplier}x`);
    });
  });

  describe('Memory Management Performance', () => {
    test('should efficiently manage WASM memory', () => {
      const memoryManager = wasmTestUtils.mockMemoryManager();
      
      // Test allocation performance
      const allocSizes = [1024, 4096, 16384, 65536];
      
      for (const size of allocSizes) {
        const start = performance.now();
        const buffer = memoryManager.allocate(size);
        const end = performance.now();
        
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(buffer.byteLength).toBe(size);
        expect(end - start).toBeLessThan(1); // <1ms allocation time
        
        memoryManager.deallocate();
      }
    });

    test('should track memory usage accurately', () => {
      const memoryManager = wasmTestUtils.mockMemoryManager();
      const usage = memoryManager.getUsage();
      
      expect(usage.used).toBeGreaterThanOrEqual(0);
      expect(usage.available).toBeGreaterThan(0);
      expect(usage.used).toBeLessThanOrEqual(usage.available);
    });

    test('should handle large memory allocations', () => {
      const largeSize = 16 * 1024 * 1024; // 16MB
      const memoryManager = wasmTestUtils.mockMemoryManager();
      
      const start = performance.now();
      const buffer = memoryManager.allocate(largeSize);
      const end = performance.now();
      
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(end - start).toBeLessThan(10); // <10ms for large allocation
    });
  });

  describe('Computation Benchmarks', () => {
    test('should benchmark neural activation functions', async () => {
      const testCases = [
        { name: 'Small batch', size: 100 },
        { name: 'Medium batch', size: 1000 },
        { name: 'Large batch', size: 10000 },
        { name: 'XL batch', size: 100000 }
      ];

      for (const testCase of testCases) {
        const input = wasmTestUtils.createPerformanceData(testCase.size);
        
        const time = await wasmTestUtils.benchmarkFunction(
          () => {
            const result = mockWasmModule.calculateNeuralActivation(input);
            expect(result).toBeInstanceOf(Float32Array);
            expect(result.length).toBe(input.length);
            return result;
          },
          testCase.size > 10000 ? 10 : 50 // Fewer iterations for large batches
        );

        const throughput = testCase.size / (time / 1000); // elements per second
        
        expect(time).toBeLessThan(50); // All should complete within 50ms
        expect(throughput).toBeGreaterThan(10000); // >10K elements/sec

        console.log(`${testCase.name} (${testCase.size}): ${time.toFixed(2)}ms, ${(throughput/1000).toFixed(0)}K elem/sec`);
      }
    });

    test('should benchmark connection optimization', async () => {
      const connectionSizes = [100, 500, 1000, 5000];

      for (const size of connectionSizes) {
        const connections = Array.from({ length: size }, () => Math.random() * 2 - 1);
        
        const time = await wasmTestUtils.benchmarkFunction(
          () => {
            const optimized = mockWasmModule.optimizeConnections(connections);
            expect(optimized).toHaveLength(size);
            expect(optimized.every(w => w >= 0 && w <= 1)).toBe(true);
            return optimized;
          },
          20
        );

        const rate = size / (time / 1000); // connections per second
        
        expect(time).toBeLessThan(25); // Should complete within 25ms
        expect(rate).toBeGreaterThan(1000); // >1K connections/sec

        console.log(`Connection optimization (${size}): ${time.toFixed(2)}ms, ${(rate/1000).toFixed(1)}K conn/sec`);
      }
    });
  });

  describe('Performance Comparison Tests', () => {
    test('should outperform JavaScript implementation', async () => {
      const testSize = 10000;
      const input = wasmTestUtils.createPerformanceData(testSize);

      // WASM performance
      const wasmTime = await wasmTestUtils.benchmarkFunction(
        () => mockWasmModule.calculateNeuralActivation(input),
        20
      );

      // JavaScript simulation
      const jsTime = await wasmTestUtils.benchmarkFunction(
        () => {
          const result = new Float32Array(input.length);
          for (let i = 0; i < input.length; i++) {
            result[i] = Math.tanh(input[i] * 0.5);
          }
          return result;
        },
        20
      );

      const speedup = jsTime / wasmTime;
      
      expect(speedup).toBeGreaterThan(1.5); // At least 1.5x faster
      expect(wasmTime).toBeLessThan(jsTime);

      console.log(`Performance comparison (${testSize} elements):
        WASM: ${wasmTime.toFixed(2)}ms
        JavaScript: ${jsTime.toFixed(2)}ms
        Speedup: ${speedup.toFixed(1)}x`);
    });

    test('should demonstrate consistent performance advantage', async () => {
      const iterations = 10;
      const testSize = 5000;
      const wasmTimes: number[] = [];
      const jsTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const input = wasmTestUtils.createPerformanceData(testSize);

        // WASM test
        const wasmStart = performance.now();
        mockWasmModule.calculateNeuralActivation(input);
        const wasmEnd = performance.now();
        wasmTimes.push(wasmEnd - wasmStart);

        // JS test
        const jsStart = performance.now();
        const result = new Float32Array(input.length);
        for (let j = 0; j < input.length; j++) {
          result[j] = Math.tanh(input[j] * 0.5);
        }
        const jsEnd = performance.now();
        jsTimes.push(jsEnd - jsStart);
      }

      const avgWasmTime = wasmTimes.reduce((a, b) => a + b, 0) / wasmTimes.length;
      const avgJsTime = jsTimes.reduce((a, b) => a + b, 0) / jsTimes.length;
      const consistentSpeedup = avgJsTime / avgWasmTime;

      expect(consistentSpeedup).toBeGreaterThan(1.5);

      // Check consistency (low variance)
      const wasmVariance = wasmTimes.reduce((acc, time) => acc + Math.pow(time - avgWasmTime, 2), 0) / wasmTimes.length;
      const wasmStdDev = Math.sqrt(wasmVariance);
      const coefficientOfVariation = wasmStdDev / avgWasmTime;

      expect(coefficientOfVariation).toBeLessThan(0.2); // <20% variation

      console.log(`Consistency test (${iterations} iterations):
        WASM avg: ${avgWasmTime.toFixed(2)}ms ±${wasmStdDev.toFixed(2)}ms
        JS avg: ${avgJsTime.toFixed(2)}ms
        Consistent speedup: ${consistentSpeedup.toFixed(1)}x
        CV: ${(coefficientOfVariation * 100).toFixed(1)}%`);
    });
  });

  describe('Stress Testing', () => {
    test('should handle sustained high-performance workloads', async () => {
      const duration = 5000; // 5 seconds
      const batchSize = 1000;
      const startTime = Date.now();
      let operations = 0;

      while (Date.now() - startTime < duration) {
        const input = wasmTestUtils.createPerformanceData(batchSize);
        mockWasmModule.calculateNeuralActivation(input);
        operations++;
      }

      const actualDuration = Date.now() - startTime;
      const operationsPerSecond = operations / (actualDuration / 1000);
      const elementsPerSecond = operationsPerSecond * batchSize;

      expect(operationsPerSecond).toBeGreaterThan(100); // >100 ops/sec
      expect(elementsPerSecond).toBeGreaterThan(50000); // >50K elements/sec

      console.log(`Stress test (${actualDuration}ms):
        Operations: ${operations}
        Ops/sec: ${operationsPerSecond.toFixed(0)}
        Elements/sec: ${(elementsPerSecond/1000).toFixed(0)}K`);
    });

    test('should maintain performance under memory pressure', async () => {
      const largeBatches = 20;
      const batchSize = 50000; // 50K elements per batch
      const times: number[] = [];

      for (let i = 0; i < largeBatches; i++) {
        const input = wasmTestUtils.createPerformanceData(batchSize);
        
        const start = performance.now();
        mockWasmModule.calculateNeuralActivation(input);
        const end = performance.now();
        
        times.push(end - start);
        
        // Should complete each batch within reasonable time
        expect(end - start).toBeLessThan(100);
      }

      // Performance should not degrade significantly
      const firstHalf = times.slice(0, largeBatches / 2);
      const secondHalf = times.slice(largeBatches / 2);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      expect(secondAvg).toBeLessThan(firstAvg * 1.5); // <50% degradation

      console.log(`Memory pressure test:
        First half avg: ${firstAvg.toFixed(2)}ms
        Second half avg: ${secondAvg.toFixed(2)}ms
        Degradation: ${((secondAvg / firstAvg - 1) * 100).toFixed(1)}%`);
    });
  });

  describe('Benchmark Regression', () => {
    test('should meet performance benchmarks', async () => {
      const benchmark = mockWasmModule.benchmark();
      
      expect(benchmark.operations_per_second).toBeGreaterThan(500000); // >500K ops/sec
      expect(benchmark.memory_usage).toBeLessThan(10 * 1024 * 1024); // <10MB
      expect(benchmark.simd_acceleration).toBe(true);

      console.log(`Benchmark results:
        Ops/sec: ${(benchmark.operations_per_second/1000).toFixed(0)}K
        Memory: ${(benchmark.memory_usage/1024/1024).toFixed(1)}MB
        SIMD: ${benchmark.simd_acceleration}`);
    });

    test('should validate performance targets', async () => {
      const targets = {
        minThroughput: 100000,    // elements/sec
        maxLatency: 50,           // ms
        maxMemoryGrowth: 50,      // MB
        minSpeedupVsJS: 2.0       // multiplier
      };

      // Throughput test
      const testSize = 10000;
      const input = wasmTestUtils.createPerformanceData(testSize);
      
      const time = await wasmTestUtils.benchmarkFunction(
        () => mockWasmModule.calculateNeuralActivation(input),
        10
      );

      const throughput = testSize / (time / 1000);
      
      expect(throughput).toBeGreaterThan(targets.minThroughput);
      expect(time).toBeLessThan(targets.maxLatency);

      console.log(`Performance targets validation:
        Throughput: ${(throughput/1000).toFixed(0)}K elem/sec (target: ${targets.minThroughput/1000}K)
        Latency: ${time.toFixed(2)}ms (target: <${targets.maxLatency}ms)
        Memory multiplier: ${mockWasmModule.performanceMultiplier}x (target: >${targets.minSpeedupVsJS}x)`);
    });
  });
});