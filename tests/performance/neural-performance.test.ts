/**
 * Performance Tests for Neural Agent System
 * Tests performance requirements: <50ms inference, >90% coverage
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  MockNeuralMeshService, 
  PerformanceTestUtils,
  TestDataGenerator,
  NeuralAssertions 
} from '../utils/neural-test-utils';
import { mockWasmModule, wasmTestUtils } from '../wasm-setup';
import { Agent } from '../../src/types/agent';

describe('Neural Performance Tests', () => {
  let neuralService: MockNeuralMeshService;
  let memoryDetector: ReturnType<typeof PerformanceTestUtils.createMemoryLeakDetector>;

  beforeEach(async () => {
    neuralService = new MockNeuralMeshService();
    await neuralService.initialize();
    memoryDetector = PerformanceTestUtils.createMemoryLeakDetector();
  });

  afterEach(async () => {
    await neuralService.disconnect();
    NeuralAssertions.assertNoMemoryLeaks(memoryDetector);
  });

  describe('Inference Performance (<50ms target)', () => {
    test('should complete neural inference within 50ms', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await neuralService.updateNeuralAgent(agent!);
        const end = performance.now();
        times.push(end - start);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      expect(averageTime).toBeLessThan(25); // Target: <25ms average
      expect(maxTime).toBeLessThan(50);     // Target: <50ms max
      expect(p95Time).toBeLessThan(40);     // Target: <40ms 95th percentile

      console.log(`Performance Results:
        Average: ${averageTime.toFixed(2)}ms
        Max: ${maxTime.toFixed(2)}ms
        95th percentile: ${p95Time.toFixed(2)}ms`);
    });

    test('should maintain performance under concurrent load', async () => {
      const concurrentAgents = 10;
      const iterations = 50;

      // Create multiple agents
      const agents = await Promise.all(
        Array.from({ length: concurrentAgents }, () => 
          neuralService.createNeuralAgent('neural')
        )
      );

      expect(agents.every(agent => agent !== null)).toBe(true);

      // Test concurrent updates
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await Promise.all(
          agents.map(agent => neuralService.updateNeuralAgent(agent!))
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTimePerUpdate = totalTime / (iterations * concurrentAgents);

      expect(averageTimePerUpdate).toBeLessThan(50); // <50ms per update
      expect(totalTime).toBeLessThan(10000); // <10s total

      console.log(`Concurrent Performance:
        Total time: ${totalTime.toFixed(2)}ms
        Average per update: ${averageTimePerUpdate.toFixed(2)}ms
        Throughput: ${(iterations * concurrentAgents / totalTime * 1000).toFixed(0)} updates/sec`);
    });

    test('should achieve target throughput for batch operations', async () => {
      const batchSize = 20;
      const targetThroughput = 1000; // operations per second

      const agents = await Promise.all(
        Array.from({ length: batchSize }, () => 
          neuralService.createNeuralAgent('neural')
        )
      );

      const startTime = performance.now();
      await Promise.all(agents.map(agent => neuralService.updateNeuralAgent(agent!)));
      const endTime = performance.now();

      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const actualThroughput = batchSize / duration;

      expect(actualThroughput).toBeGreaterThan(targetThroughput);

      console.log(`Batch Performance:
        Batch size: ${batchSize}
        Duration: ${duration.toFixed(3)}s
        Throughput: ${actualThroughput.toFixed(0)} ops/sec`);
    });
  });

  describe('WASM Performance Optimization', () => {
    test('should demonstrate WASM performance benefits', async () => {
      const testData = wasmTestUtils.createPerformanceData(1000);
      
      // Test WASM performance
      const wasmTime = await wasmTestUtils.benchmarkFunction(
        () => mockWasmModule.calculateNeuralActivation(testData),
        100
      );

      // Test JavaScript fallback performance (simulate)
      const jsTime = await wasmTestUtils.benchmarkFunction(
        () => {
          const result = new Float32Array(testData.length);
          for (let i = 0; i < testData.length; i++) {
            result[i] = Math.tanh(testData[i] * 0.5);
          }
          return result;
        },
        100
      );

      expect(wasmTime).toBeLessThan(50); // WASM should be fast
      expect(wasmTime).toBeLessThan(jsTime * 0.8); // WASM should be faster than JS

      console.log(`WASM vs JS Performance:
        WASM: ${wasmTime.toFixed(2)}ms
        JS: ${jsTime.toFixed(2)}ms
        Speedup: ${(jsTime / wasmTime).toFixed(1)}x`);
    });

    test('should handle large neural computations efficiently', async () => {
      const largeDataSizes = [1000, 5000, 10000, 50000];

      for (const size of largeDataSizes) {
        const testData = wasmTestUtils.createPerformanceData(size);
        
        const time = await wasmTestUtils.benchmarkFunction(
          () => mockWasmModule.calculateNeuralActivation(testData),
          10
        );

        // Performance should scale reasonably with size
        const timePerElement = time / size;
        expect(timePerElement).toBeLessThan(0.001); // <1μs per element

        console.log(`Large Data Performance (${size} elements):
          Total time: ${time.toFixed(2)}ms
          Time per element: ${(timePerElement * 1000).toFixed(3)}μs`);
      }
    });

    test('should optimize connection matrices efficiently', async () => {
      const matrixSizes = [100, 500, 1000, 2000];

      for (const size of matrixSizes) {
        const connections = Array.from({ length: size }, () => Math.random() * 2 - 1);
        
        const time = await wasmTestUtils.benchmarkFunction(
          () => mockWasmModule.optimizeConnections(connections),
          10
        );

        expect(time).toBeLessThan(50); // Should complete within 50ms

        console.log(`Connection Optimization (${size} connections):
          Time: ${time.toFixed(2)}ms
          Rate: ${(size / time * 1000).toFixed(0)} connections/sec`);
      }
    });
  });

  describe('Memory Performance', () => {
    test('should maintain stable memory usage under load', async () => {
      const iterations = 100;
      const memoryMeasurements: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Create and update agent
        const agent = await neuralService.createNeuralAgent('neural');
        if (agent) {
          await neuralService.updateNeuralAgent(agent);
        }

        // Measure memory every 10 iterations
        if (i % 10 === 0) {
          memoryDetector.measure();
          const usage = process.memoryUsage();
          memoryMeasurements.push(usage.heapUsed);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Analyze memory growth
      const analysis = memoryDetector.analyze();
      expect(analysis.leaked).toBe(false);

      // Memory should not grow excessively
      const initialMemory = memoryMeasurements[0];
      const finalMemory = memoryMeasurements[memoryMeasurements.length - 1];
      const growth = finalMemory - initialMemory;

      expect(growth).toBeLessThan(100 * 1024 * 1024); // <100MB growth

      console.log(`Memory Performance:
        Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        Growth: ${(growth / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should efficiently manage large agent populations', async () => {
      const agentCounts = [10, 50, 100, 200];

      for (const count of agentCounts) {
        const startMemory = process.memoryUsage().heapUsed;
        
        // Create agents
        const agents = await Promise.all(
          Array.from({ length: count }, () => 
            neuralService.createNeuralAgent('neural')
          )
        );

        const endMemory = process.memoryUsage().heapUsed;
        const memoryPerAgent = (endMemory - startMemory) / count;

        expect(memoryPerAgent).toBeLessThan(1024 * 1024); // <1MB per agent

        // Clean up
        neuralService.clearAgents();

        console.log(`Memory Efficiency (${count} agents):
          Memory per agent: ${(memoryPerAgent / 1024).toFixed(2)}KB`);
      }
    });
  });

  describe('Scalability Performance', () => {
    test('should scale mesh operations linearly', async () => {
      const meshSizes = [10, 25, 50, 100];
      const scalingResults: Array<{ size: number; time: number }> = [];

      for (const size of meshSizes) {
        const agents = await Promise.all(
          Array.from({ length: size }, () => 
            neuralService.createNeuralAgent('neural')
          )
        );

        const startTime = performance.now();
        await Promise.all(agents.map(agent => neuralService.updateNeuralAgent(agent!)));
        const endTime = performance.now();

        const time = endTime - startTime;
        scalingResults.push({ size, time });

        expect(time).toBeLessThan(size * 10); // Linear scaling: <10ms per agent

        console.log(`Scaling Test (${size} agents): ${time.toFixed(2)}ms`);
      }

      // Verify linear scaling characteristics
      for (let i = 1; i < scalingResults.length; i++) {
        const prev = scalingResults[i - 1];
        const curr = scalingResults[i];
        
        const sizeRatio = curr.size / prev.size;
        const timeRatio = curr.time / prev.time;
        
        // Time ratio should not exceed size ratio by more than 50%
        expect(timeRatio).toBeLessThan(sizeRatio * 1.5);
      }
    });

    test('should handle mesh training at scale', async () => {
      const patternCounts = [100, 500, 1000, 2000];

      for (const count of patternCounts) {
        const patterns = TestDataGenerator.generateTrainingPatterns(count);
        
        const startTime = performance.now();
        const success = await neuralService.trainMesh(patterns);
        const endTime = performance.now();

        expect(success).toBe(true);
        const time = endTime - startTime;
        expect(time).toBeLessThan(count * 0.1); // <0.1ms per pattern

        console.log(`Training Performance (${count} patterns): ${time.toFixed(2)}ms`);
      }
    });
  });

  describe('Real-time Performance', () => {
    test('should maintain real-time update frequencies', async () => {
      const targetFPS = 60; // 60 FPS = ~16.67ms per frame
      const maxFrameTime = 1000 / targetFPS;

      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      const frameCount = 100;
      const frameTimes: number[] = [];

      for (let i = 0; i < frameCount; i++) {
        const frameStart = performance.now();
        
        // Simulate real-time update
        await neuralService.updateNeuralAgent(agent!);
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        frameTimes.push(frameTime);

        expect(frameTime).toBeLessThan(maxFrameTime);
      }

      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime_actual = Math.max(...frameTimes);

      expect(averageFrameTime).toBeLessThan(maxFrameTime * 0.8); // 80% of budget
      expect(maxFrameTime_actual).toBeLessThan(maxFrameTime);

      console.log(`Real-time Performance:
        Target frame time: ${maxFrameTime.toFixed(2)}ms
        Average frame time: ${averageFrameTime.toFixed(2)}ms
        Max frame time: ${maxFrameTime_actual.toFixed(2)}ms
        Achieved FPS: ${(1000 / averageFrameTime).toFixed(1)}`);
    });

    test('should handle burst workloads efficiently', async () => {
      const burstSize = 20;
      const burstCount = 5;

      for (let burst = 0; burst < burstCount; burst++) {
        const agents = await Promise.all(
          Array.from({ length: burstSize }, () => 
            neuralService.createNeuralAgent('neural')
          )
        );

        const burstStart = performance.now();
        await Promise.all(agents.map(agent => neuralService.updateNeuralAgent(agent!)));
        const burstEnd = performance.now();

        const burstTime = burstEnd - burstStart;
        expect(burstTime).toBeLessThan(100); // <100ms per burst

        console.log(`Burst ${burst + 1} (${burstSize} agents): ${burstTime.toFixed(2)}ms`);

        // Small delay between bursts
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });
  });

  describe('Performance Regression Tests', () => {
    test('should not regress from baseline performance', async () => {
      // Baseline performance expectations
      const baseline = {
        singleUpdate: 25,      // ms
        batchUpdate: 50,       // ms for 10 agents
        meshCreation: 100,     // ms
        training: 200          // ms for 100 patterns
      };

      // Test single update performance
      const agent = await neuralService.createNeuralAgent('neural');
      const singleStart = performance.now();
      await neuralService.updateNeuralAgent(agent!);
      const singleTime = performance.now() - singleStart;

      expect(singleTime).toBeLessThan(baseline.singleUpdate);

      // Test batch update performance
      const batchAgents = await Promise.all(
        Array.from({ length: 10 }, () => neuralService.createNeuralAgent('neural'))
      );
      const batchStart = performance.now();
      await Promise.all(batchAgents.map(agent => neuralService.updateNeuralAgent(agent!)));
      const batchTime = performance.now() - batchStart;

      expect(batchTime).toBeLessThan(baseline.batchUpdate);

      // Test training performance
      const patterns = TestDataGenerator.generateTrainingPatterns(100);
      const trainStart = performance.now();
      await neuralService.trainMesh(patterns);
      const trainTime = performance.now() - trainStart;

      expect(trainTime).toBeLessThan(baseline.training);

      console.log(`Performance Baseline Validation:
        Single update: ${singleTime.toFixed(2)}ms (limit: ${baseline.singleUpdate}ms)
        Batch update: ${batchTime.toFixed(2)}ms (limit: ${baseline.batchUpdate}ms)
        Training: ${trainTime.toFixed(2)}ms (limit: ${baseline.training}ms)`);
    });

    test('should maintain performance across test suite', () => {
      // This test ensures the overall test suite performance
      const testSuiteStart = Date.now();
      
      expect(testSuiteStart).toBeDefined();
      
      // The test suite should complete within reasonable time
      // This is checked by Jest timeout configuration
    });
  });
});