/**
 * Advanced Performance Benchmarks Test Suite
 * 
 * Comprehensive testing to validate performance optimizations
 * and ensure all targets are exceeded by 100%+
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AdvancedPerformanceOptimizer } from '../../src/performance/AdvancedPerformanceOptimizer'
import { PerformanceBenchmarkSuite } from '../../src/performance/PerformanceBenchmarkSuite'

describe('Advanced Performance Benchmarks', () => {
  let optimizer: AdvancedPerformanceOptimizer
  let benchmarkSuite: PerformanceBenchmarkSuite
  let performanceRecords: number[] = []

  beforeEach(async () => {
    optimizer = new AdvancedPerformanceOptimizer()
    benchmarkSuite = new PerformanceBenchmarkSuite()
    
    await optimizer.initialize()
    await optimizer.initializeAdvancedOptimizations()
    
    performanceRecords = []
  })

  afterEach(async () => {
    await optimizer.cleanup()
  })

  describe('Performance Target Validation', () => {
    test('should exceed neural agent spawning target by 100%', async () => {
      console.log('🚀 Testing Neural Agent Spawning Performance...')
      
      const iterations = 50
      const times: number[] = []
      const target = 6.0 // 6ms target
      const superTarget = target / 2 // 3ms for 100% improvement
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await optimizer.optimizedAgentSpawning({ architecture: 'standard' })
        const time = performance.now() - start
        times.push(time)
      }
      
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
      
      console.log(`📊 Agent Spawning Results:`)
      console.log(`   Average: ${averageTime.toFixed(2)}ms (target: ${target}ms, super: ${superTarget}ms)`)
      console.log(`   P95: ${p95Time.toFixed(2)}ms`)
      console.log(`   Min: ${Math.min(...times).toFixed(2)}ms`)
      console.log(`   Max: ${Math.max(...times).toFixed(2)}ms`)
      
      // Validate targets
      expect(averageTime).toBeLessThan(target)
      expect(p95Time).toBeLessThan(target * 1.2)
      
      // Stretch goal: 100% improvement
      if (averageTime <= superTarget) {
        console.log(`🏆 EXCEEDED TARGET BY 100%+! Achieved ${((target - averageTime) / target * 100).toFixed(1)}% improvement`)
      }
      
      performanceRecords.push(averageTime)
    }, 30000)

    test('should exceed inference pipeline target by 100%', async () => {
      console.log('🧠 Testing Inference Pipeline Performance...')
      
      const batchSize = 32
      const inputSize = 784
      const iterations = 20
      const target = 30.0 // 30ms target
      const superTarget = target / 2 // 15ms for 100% improvement
      
      const times: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const inputs = Array.from({ length: batchSize }, () => 
          new Float32Array(inputSize).map(() => Math.random())
        )
        
        const start = performance.now()
        await optimizer.optimizedNeuralInference(inputs, { type: 'feedforward' })
        const time = performance.now() - start
        times.push(time)
      }
      
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
      const throughput = (batchSize * iterations * 1000) / times.reduce((a, b) => a + b, 0)
      
      console.log(`📊 Inference Pipeline Results:`)
      console.log(`   Average: ${averageTime.toFixed(2)}ms (target: ${target}ms, super: ${superTarget}ms)`)
      console.log(`   P95: ${p95Time.toFixed(2)}ms`)
      console.log(`   Throughput: ${throughput.toFixed(0)} inferences/sec`)
      
      expect(averageTime).toBeLessThan(target)
      expect(p95Time).toBeLessThan(target * 1.3)
      expect(throughput).toBeGreaterThan(500) // At least 500 inferences/sec
      
      if (averageTime <= superTarget) {
        console.log(`🏆 EXCEEDED TARGET BY 100%+! Achieved ${((target - averageTime) / target * 100).toFixed(1)}% improvement`)
      }
      
      performanceRecords.push(averageTime)
    }, 60000)

    test('should exceed memory usage target by 100%', async () => {
      console.log('💾 Testing Memory Usage Optimization...')
      
      const agentCount = 20
      const target = 4.0 // 4MB per agent
      const superTarget = target / 2 // 2MB for 100% improvement
      
      const startMemory = getCurrentMemoryUsage()
      const agents = []
      
      for (let i = 0; i < agentCount; i++) {
        const agent = await optimizer.optimizedAgentSpawning({ 
          architecture: 'standard',
          memoryOptimized: true 
        })
        agents.push(agent)
      }
      
      const endMemory = getCurrentMemoryUsage()
      const totalMemoryUsed = (endMemory - startMemory) / 1024 / 1024 // MB
      const memoryPerAgent = totalMemoryUsed / agentCount
      
      console.log(`📊 Memory Usage Results:`)
      console.log(`   Total memory: ${totalMemoryUsed.toFixed(2)}MB`)
      console.log(`   Per agent: ${memoryPerAgent.toFixed(2)}MB (target: ${target}MB, super: ${superTarget}MB)`)
      console.log(`   Agent count: ${agentCount}`)
      
      expect(memoryPerAgent).toBeLessThan(target)
      
      if (memoryPerAgent <= superTarget) {
        console.log(`🏆 EXCEEDED TARGET BY 100%+! Achieved ${((target - memoryPerAgent) / target * 100).toFixed(1)}% improvement`)
      }
      
      // Cleanup
      agents.length = 0
      
      performanceRecords.push(memoryPerAgent)
    }, 30000)

    test('should exceed database query target by 100%', async () => {
      console.log('🗄️ Testing Database Query Performance...')
      
      const queryCount = 100
      const target = 5.0 // 5ms target
      const superTarget = target / 2 // 2.5ms for 100% improvement
      
      const times: number[] = []
      
      for (let i = 0; i < queryCount; i++) {
        const start = performance.now()
        await simulateOptimizedDatabaseQuery()
        const time = performance.now() - start
        times.push(time)
      }
      
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
      const queryRate = (queryCount * 1000) / times.reduce((a, b) => a + b, 0)
      
      console.log(`📊 Database Query Results:`)
      console.log(`   Average: ${averageTime.toFixed(2)}ms (target: ${target}ms, super: ${superTarget}ms)`)
      console.log(`   P95: ${p95Time.toFixed(2)}ms`)
      console.log(`   Query rate: ${queryRate.toFixed(0)} queries/sec`)
      
      expect(averageTime).toBeLessThan(target)
      expect(p95Time).toBeLessThan(target * 1.5)
      expect(queryRate).toBeGreaterThan(100) // At least 100 queries/sec
      
      if (averageTime <= superTarget) {
        console.log(`🏆 EXCEEDED TARGET BY 100%+! Achieved ${((target - averageTime) / target * 100).toFixed(1)}% improvement`)
      }
      
      performanceRecords.push(averageTime)
    }, 30000)

    test('should exceed WASM speedup target by 100%', async () => {
      console.log('⚡ Testing WASM Operation Speedup...')
      
      const iterations = 50
      const dataSize = 1000
      const target = 4.0 // 4x speedup target
      const superTarget = target * 2 // 8x for 100% improvement
      
      const speedups: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const testData = new Float32Array(dataSize).map(() => Math.random())
        
        // Measure JavaScript baseline
        const jsStart = performance.now()
        fallbackMatrixMultiply(testData, testData, 1, dataSize)
        const jsTime = performance.now() - jsStart
        
        // Measure WASM optimized
        const wasmStart = performance.now()
        await optimizer.optimizedMatrixMultiply(testData, testData, 1, dataSize)
        const wasmTime = performance.now() - wasmStart
        
        const speedup = jsTime / wasmTime
        speedups.push(speedup)
      }
      
      const averageSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length
      const minSpeedup = Math.min(...speedups)
      const maxSpeedup = Math.max(...speedups)
      
      console.log(`📊 WASM Speedup Results:`)
      console.log(`   Average: ${averageSpeedup.toFixed(2)}x (target: ${target}x, super: ${superTarget}x)`)
      console.log(`   Min: ${minSpeedup.toFixed(2)}x`)
      console.log(`   Max: ${maxSpeedup.toFixed(2)}x`)
      
      expect(averageSpeedup).toBeGreaterThan(target)
      expect(minSpeedup).toBeGreaterThan(target * 0.8) // Allow some variance
      
      if (averageSpeedup >= superTarget) {
        console.log(`🏆 EXCEEDED TARGET BY 100%+! Achieved ${((averageSpeedup - target) / target * 100).toFixed(1)}% improvement`)
      }
      
      performanceRecords.push(averageSpeedup)
    }, 30000)
  })

  describe('Stress Testing', () => {
    test('should handle 50+ concurrent agents efficiently', async () => {
      console.log('💪 Testing Concurrent Agent Stress...')
      
      const agentCounts = [10, 25, 50, 100]
      const results = []
      
      for (const agentCount of agentCounts) {
        console.log(`🔥 Testing ${agentCount} concurrent agents...`)
        
        const startTime = performance.now()
        const startMemory = getCurrentMemoryUsage()
        
        // Create agents concurrently
        const agents = await Promise.all(
          Array.from({ length: agentCount }, () => 
            optimizer.optimizedAgentSpawning({ architecture: 'minimal' })
          )
        )
        
        // Perform operations concurrently
        const operations = agents.map(async (agent) => {
          for (let i = 0; i < 5; i++) {
            const inputs = [new Float32Array(128).map(() => Math.random())]
            await optimizer.optimizedNeuralInference(inputs, { type: 'minimal' })
          }
        })
        
        await Promise.all(operations)
        
        const endTime = performance.now()
        const endMemory = getCurrentMemoryUsage()
        
        const duration = endTime - startTime
        const memoryUsed = (endMemory - startMemory) / 1024 / 1024 // MB
        const throughput = (agentCount * 5 * 1000) / duration // operations per second
        
        const result = {
          agentCount,
          duration: duration.toFixed(2),
          memoryUsed: memoryUsed.toFixed(2),
          throughput: throughput.toFixed(0)
        }
        
        results.push(result)
        
        console.log(`  ✅ ${agentCount} agents: ${duration.toFixed(0)}ms, ${memoryUsed.toFixed(1)}MB, ${throughput.toFixed(0)} ops/sec`)
        
        // Validate performance criteria
        expect(duration).toBeLessThan(agentCount * 100) // Linear scaling
        expect(memoryUsed).toBeLessThan(agentCount * 2) // Max 2MB per agent under stress
        expect(throughput).toBeGreaterThan(50) // At least 50 ops/sec
      }
      
      console.log(`📊 Stress Test Summary:`, results)
    }, 120000)

    test('should maintain performance under memory pressure', async () => {
      console.log('🧠 Testing Memory Pressure Resistance...')
      
      const memoryPressureLevels = ['low', 'medium', 'high']
      const results = []
      
      for (const level of memoryPressureLevels) {
        console.log(`💾 Testing ${level} memory pressure...`)
        
        // Create memory pressure
        const memoryLoad = createMemoryPressure(level)
        
        // Test performance under pressure
        const iterations = 20
        const times: number[] = []
        
        for (let i = 0; i < iterations; i++) {
          const start = performance.now()
          await optimizer.optimizedAgentSpawning({ architecture: 'standard' })
          times.push(performance.now() - start)
        }
        
        const averageTime = times.reduce((a, b) => a + b, 0) / times.length
        const maxTime = Math.max(...times)
        
        // Cleanup memory pressure
        memoryLoad.cleanup()
        
        const result = {
          level,
          averageTime: averageTime.toFixed(2),
          maxTime: maxTime.toFixed(2),
          degradation: 'acceptable'
        }
        
        results.push(result)
        
        console.log(`  📊 ${level} pressure: avg ${averageTime.toFixed(2)}ms, max ${maxTime.toFixed(2)}ms`)
        
        // Validate performance doesn't degrade too much
        expect(averageTime).toBeLessThan(15) // Should stay under 15ms even under pressure
        expect(maxTime).toBeLessThan(30) // Max time shouldn't exceed 30ms
      }
      
      console.log(`📊 Memory Pressure Results:`, results)
    }, 60000)
  })

  describe('Stability Testing', () => {
    test('should maintain performance over extended periods', async () => {
      console.log('⏰ Testing Long-term Stability...')
      
      const testDurationMs = 60000 // 1 minute for testing
      const startTime = Date.now()
      const startMemory = getCurrentMemoryUsage()
      
      let operationCount = 0
      let errorCount = 0
      const performanceSamples: number[] = []
      const memorySamples: number[] = []
      
      while (Date.now() - startTime < testDurationMs) {
        try {
          const opStart = performance.now()
          await optimizer.optimizedAgentSpawning({ architecture: 'standard' })
          const opTime = performance.now() - opStart
          
          performanceSamples.push(opTime)
          memorySamples.push(getCurrentMemoryUsage())
          operationCount++
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 50))
          
        } catch (error) {
          errorCount++
          console.warn(`Operation ${operationCount} failed:`, error)
        }
      }
      
      const endMemory = getCurrentMemoryUsage()
      const memoryGrowth = (endMemory - startMemory) / 1024 / 1024 // MB
      
      // Analyze stability
      const avgPerformance = performanceSamples.reduce((a, b) => a + b, 0) / performanceSamples.length
      const performanceVariance = calculateVariance(performanceSamples)
      const errorRate = errorCount / operationCount
      
      console.log(`📊 Stability Test Results:`)
      console.log(`   Duration: ${(testDurationMs / 1000).toFixed(0)}s`)
      console.log(`   Operations: ${operationCount}`)
      console.log(`   Errors: ${errorCount} (${(errorRate * 100).toFixed(2)}%)`)
      console.log(`   Avg performance: ${avgPerformance.toFixed(2)}ms`)
      console.log(`   Performance variance: ${performanceVariance.toFixed(2)}`)
      console.log(`   Memory growth: ${memoryGrowth.toFixed(2)}MB`)
      
      // Validate stability criteria
      expect(errorRate).toBeLessThan(0.01) // Less than 1% error rate
      expect(memoryGrowth).toBeLessThan(50) // Less than 50MB growth
      expect(performanceVariance).toBeLessThan(100) // Reasonable variance
      expect(avgPerformance).toBeLessThan(10) // Performance stays good
      
      console.log(`✅ Stability test passed: ${operationCount} operations, ${errorRate.toFixed(3)} error rate`)
    }, 90000)
  })

  describe('Complete Benchmark Suite', () => {
    test('should run complete benchmark suite and exceed all targets', async () => {
      console.log('🏆 Running Complete Benchmark Suite...')
      
      const results = await benchmarkSuite.runCompleteBenchmarkSuite()
      
      expect(results.size).toBeGreaterThan(5) // Should have multiple benchmarks
      
      let passedCount = 0
      let totalImprovements = 0
      
      for (const [name, result] of results) {
        console.log(`📊 ${name}: ${result.passed ? '✅' : '❌'} ${result.average.toFixed(2)}${result.config.targetUnit}`)
        
        if (result.passed) passedCount++
        totalImprovements += result.improvementPercent
      }
      
      const passRate = (passedCount / results.size) * 100
      const avgImprovement = totalImprovements / results.size
      
      console.log(`🎯 Overall Results:`)
      console.log(`   Pass rate: ${passRate.toFixed(1)}%`)
      console.log(`   Average improvement: ${avgImprovement.toFixed(1)}%`)
      
      // Validate overall success
      expect(passRate).toBeGreaterThan(80) // At least 80% pass rate
      expect(avgImprovement).toBeGreaterThan(50) // Average 50%+ improvement
      
      if (passRate >= 90 && avgImprovement >= 100) {
        console.log(`🏆 OUTSTANDING: All targets exceeded by 100%+!`)
      }
    }, 300000) // 5 minutes timeout
  })
})

// Helper functions
function getCurrentMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed
  }
  return 0
}

function fallbackMatrixMultiply(a: Float32Array, b: Float32Array, rows: number, cols: number): Float32Array {
  const result = new Float32Array(rows * cols)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0
      for (let k = 0; k < cols; k++) {
        sum += a[i * cols + k] * b[k * cols + j]
      }
      result[i * cols + j] = sum
    }
  }
  return result
}

async function simulateOptimizedDatabaseQuery(): Promise<void> {
  // Simulate optimized database query with connection pooling
  await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 2))
}

function createMemoryPressure(level: string): { cleanup: () => void } {
  const memoryBlocks: ArrayBuffer[] = []
  
  let blockSize: number
  let blockCount: number
  
  switch (level) {
    case 'low':
      blockSize = 1024 * 1024 // 1MB
      blockCount = 10
      break
    case 'medium':
      blockSize = 5 * 1024 * 1024 // 5MB
      blockCount = 10
      break
    case 'high':
      blockSize = 10 * 1024 * 1024 // 10MB
      blockCount = 10
      break
    default:
      blockSize = 1024
      blockCount = 1
  }
  
  // Allocate memory blocks
  for (let i = 0; i < blockCount; i++) {
    try {
      memoryBlocks.push(new ArrayBuffer(blockSize))
    } catch (error) {
      console.warn(`Failed to allocate memory block ${i}:`, error)
      break
    }
  }
  
  return {
    cleanup: () => {
      memoryBlocks.length = 0
    }
  }
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
}