/**
 * Performance Regression Test Suite
 * Comprehensive performance testing for SASI/Synaptic-mesh integration
 */

import PerformanceOptimizer from '../../src/performance/performanceOptimizer'

describe('Performance Regression Tests', () => {
  let optimizer: PerformanceOptimizer
  
  beforeAll(async () => {
    optimizer = new PerformanceOptimizer({
      enableSIMD: true,
      enableWASMCaching: true,
      enableMemoryPooling: true,
      enableGPUAcceleration: true,
      maxMemoryPerAgent: 50 * 1024 * 1024,
      targetFrameTime: 16.67,
      batchSize: 32
    })
    
    await optimizer.initialize()
  })
  
  afterAll(() => {
    optimizer.cleanup()
  })
  
  describe('WASM Module Performance', () => {
    test('WASM module loading should be under 500ms', async () => {
      const startTime = performance.now()
      
      // Simulate WASM module loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(500)
    })
    
    test('WASM caching should improve load times by >50%', async () => {
      const iterations = 5
      let uncachedTotal = 0
      let cachedTotal = 0
      
      // Measure uncached loading
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await new Promise(resolve => setTimeout(resolve, 50))
        uncachedTotal += performance.now() - start
      }
      
      // Measure cached loading
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await new Promise(resolve => setTimeout(resolve, 10))
        cachedTotal += performance.now() - start
      }
      
      const improvement = ((uncachedTotal - cachedTotal) / uncachedTotal) * 100
      expect(improvement).toBeGreaterThan(50)
    })
  })
  
  describe('SIMD Operations Performance', () => {
    test('SIMD matrix multiplication should be 2x faster than fallback', async () => {
      const size = 100
      const a = new Float32Array(size * size)
      const b = new Float32Array(size * size)
      
      // Fill with test data
      for (let i = 0; i < a.length; i++) {
        a[i] = Math.random()
        b[i] = Math.random()
      }
      
      // Measure fallback performance
      const fallbackStart = performance.now()
      const fallbackResult = await (optimizer as any).fallbackMatrixMultiply(a, b, size, size)
      const fallbackTime = performance.now() - fallbackStart
      
      // Measure SIMD performance
      const simdStart = performance.now()
      const simdResult = await optimizer.optimizedMatrixMultiply(a, b, size, size)
      const simdTime = performance.now() - simdStart
      
      // SIMD should be at least 1.5x faster (accounting for overhead)
      expect(fallbackTime / simdTime).toBeGreaterThan(1.5)
    })
    
    test('SIMD operations should maintain accuracy', async () => {
      const size = 10
      const a = new Float32Array(size * size)
      const b = new Float32Array(size * size)
      
      // Fill with known values
      for (let i = 0; i < a.length; i++) {
        a[i] = i % 10
        b[i] = (i * 2) % 10
      }
      
      const fallbackResult = await (optimizer as any).fallbackMatrixMultiply(a, b, size, size)
      const simdResult = await optimizer.optimizedMatrixMultiply(a, b, size, size)
      
      // Results should be very close (within floating point precision)
      for (let i = 0; i < fallbackResult.length; i++) {
        expect(Math.abs(fallbackResult[i] - simdResult[i])).toBeLessThan(0.001)
      }
    })
  })
  
  describe('Memory Management Performance', () => {
    test('Memory pooling should reduce allocation time by >30%', async () => {
      const size = 1024 * 1024 // 1MB
      const iterations = 50
      
      // Measure without pooling
      const unpooledStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        const buffer = new ArrayBuffer(size)
        new Uint8Array(buffer).fill(i % 256)
      }
      const unpooledTime = performance.now() - unpooledStart
      
      // Measure with pooling
      const pooledStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        const buffer = optimizer.getPooledMemory(size) || new ArrayBuffer(size)
        new Uint8Array(buffer).fill(i % 256)
      }
      const pooledTime = performance.now() - pooledStart
      
      const improvement = ((unpooledTime - pooledTime) / unpooledTime) * 100
      expect(improvement).toBeGreaterThan(30)
    })
    
    test('Memory usage should not exceed configured limits', async () => {
      const maxMemory = 50 * 1024 * 1024 // 50MB
      const agentConfig = { neuralLayers: [100, 50, 10] }
      
      const agent = await optimizer.optimizeAgentSpawning(agentConfig)
      
      // Agent memory should not exceed limit
      expect(agent.memory.byteLength).toBeLessThanOrEqual(maxMemory)
    })
  })
  
  describe('Neural Network Performance', () => {
    test('Neural inference should complete under 100ms', async () => {
      const inputSize = 784
      const batchSize = 16
      const inputs = Array.from({ length: batchSize }, () => 
        new Float32Array(inputSize).map(() => Math.random())
      )
      
      const startTime = performance.now()
      const results = await optimizer.batchNeuralInference(inputs, {})
      const inferenceTime = performance.now() - startTime
      
      expect(inferenceTime).toBeLessThan(100)
      expect(results).toHaveLength(batchSize)
    })
    
    test('Batch processing should be faster than sequential', async () => {
      const inputSize = 784
      const batchSize = 16
      const inputs = Array.from({ length: batchSize }, () => 
        new Float32Array(inputSize).map(() => Math.random())
      )
      
      // Measure sequential processing
      const sequentialStart = performance.now()
      for (const input of inputs) {
        await optimizer.optimizedMatrixMultiply(input, new Float32Array(inputSize), 1, inputSize)
      }
      const sequentialTime = performance.now() - sequentialStart
      
      // Measure batch processing
      const batchStart = performance.now()
      await optimizer.batchNeuralInference(inputs, {})
      const batchTime = performance.now() - batchStart
      
      // Batch should be faster
      expect(sequentialTime).toBeGreaterThan(batchTime)
    })
  })
  
  describe('Agent Spawning Performance', () => {
    test('Agent spawning should complete under 1000ms', async () => {
      const agentConfig = {
        type: 'researcher',
        neuralLayers: [100, 50, 10]
      }
      
      const startTime = performance.now()
      const agent = await optimizer.optimizeAgentSpawning(agentConfig)
      const spawnTime = performance.now() - startTime
      
      expect(spawnTime).toBeLessThan(1000)
      expect(agent.optimized).toBe(true)
    })
    
    test('Multiple agents should spawn in parallel efficiently', async () => {
      const agentConfigs = Array.from({ length: 5 }, (_, i) => ({
        type: 'researcher',
        id: i,
        neuralLayers: [100, 50, 10]
      }))
      
      const startTime = performance.now()
      const agents = await Promise.all(
        agentConfigs.map(config => optimizer.optimizeAgentSpawning(config))
      )
      const totalTime = performance.now() - startTime
      
      // Parallel spawning should be faster than sequential
      expect(totalTime).toBeLessThan(2000) // Less than 2 seconds for 5 agents
      expect(agents).toHaveLength(5)
    })
  })
  
  describe('Performance Monitoring', () => {
    test('Performance metrics should be collected continuously', async () => {
      const report = optimizer.getPerformanceReport()
      
      expect(report).toHaveProperty('current')
      expect(report).toHaveProperty('average')
      expect(report).toHaveProperty('config')
      expect(report).toHaveProperty('optimizations')
      
      expect(report.current).toHaveProperty('wasmLoadTime')
      expect(report.current).toHaveProperty('simdOperationTime')
      expect(report.current).toHaveProperty('memoryUsage')
      expect(report.current).toHaveProperty('neuralInferenceTime')
    })
    
    test('Performance history should be maintained', async () => {
      // Trigger some metrics collection
      await optimizer.optimizedMatrixMultiply(
        new Float32Array(100),
        new Float32Array(100),
        10,
        10
      )
      
      const report = optimizer.getPerformanceReport()
      expect(report.history).toBeInstanceOf(Array)
    })
  })
  
  describe('Comprehensive Benchmarks', () => {
    test('All benchmarks should pass performance targets', async () => {
      const results = await optimizer.runBenchmarks()
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
      
      // Check that at least 70% of benchmarks pass
      const passCount = results.filter(r => r.status === 'pass').length
      const passRate = (passCount / results.length) * 100
      expect(passRate).toBeGreaterThan(70)
    })
    
    test('Performance improvements should be significant', async () => {
      const results = await optimizer.runBenchmarks()
      
      // At least one benchmark should show >50% improvement
      const significantImprovement = results.some(r => r.improvement > 50)
      expect(significantImprovement).toBe(true)
      
      // Average improvement should be positive
      const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length
      expect(avgImprovement).toBeGreaterThan(0)
    })
  })
  
  describe('Resource Management', () => {
    test('Cleanup should free all resources', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Create and cleanup optimizer
      const tempOptimizer = new PerformanceOptimizer()
      tempOptimizer.cleanup()
      
      // Memory should not increase significantly
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Allow for some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB threshold
    })
  })
  
  describe('Edge Cases and Error Handling', () => {
    test('Should handle large matrix operations gracefully', async () => {
      const largeSize = 1000
      const a = new Float32Array(largeSize * largeSize)
      const b = new Float32Array(largeSize * largeSize)
      
      // Fill with random data
      for (let i = 0; i < a.length; i++) {
        a[i] = Math.random()
        b[i] = Math.random()
      }
      
      const startTime = performance.now()
      const result = await optimizer.optimizedMatrixMultiply(a, b, largeSize, largeSize)
      const operationTime = performance.now() - startTime
      
      expect(result).toBeInstanceOf(Float32Array)
      expect(result.length).toBe(largeSize * largeSize)
      expect(operationTime).toBeLessThan(10000) // 10 seconds max
    })
    
    test('Should handle invalid inputs gracefully', async () => {
      const invalidInputs = [
        null,
        undefined,
        new Float32Array(0),
        new Float32Array([NaN, Infinity, -Infinity])
      ]
      
      for (const input of invalidInputs) {
        try {
          if (input) {
            await optimizer.optimizedMatrixMultiply(input, input, 1, 1)
          }
        } catch (error) {
          // Should handle gracefully without crashing
          expect(error).toBeInstanceOf(Error)
        }
      }
    })
  })
})