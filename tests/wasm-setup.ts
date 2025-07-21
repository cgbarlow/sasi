/**
 * WASM Test Setup
 * Provides WASM module mocking and testing utilities for Jest
 */

import { jest } from '@jest/globals';

// Mock WASM module for testing with enhanced CI compatibility  
export const mockWasmModule = {
  initialized: true,
  simdSupported: !!(process.env.CI || process.env.NODE_ENV === 'test') ? false : true, // Disable SIMD in CI
  performanceMultiplier: 2.8,
  memoryPool: new ArrayBuffer(128 * 1024), // Reduced from 1MB to 128KB for CI compatibility
  
  calculateNeuralActivation: jest.fn((inputs: Float32Array) => {
    const result = new Float32Array(inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      result[i] = Math.tanh(inputs[i] * 0.5);
    }
    return result;
  }),
  
  optimizeConnections: jest.fn((connections: number[]) => {
    return connections.map(w => Math.min(1, Math.max(0, w + (Math.random() - 0.5) * 0.1)));
  }),
  
  benchmark: jest.fn(() => ({
    operations_per_second: !!(process.env.CI || process.env.NODE_ENV === 'test') ? 500000 : 1000000, // Reduced for CI
    memory_usage: 128 * 1024, // Reduced memory usage for CI compatibility  
    simd_acceleration: !!(process.env.CI || process.env.NODE_ENV === 'test') ? false : true // Disable SIMD in CI
  }))
};

// Global WASM utilities
export const wasmTestUtils = {
  /**
   * Create performance test data
   */
  createPerformanceData: (size: number = 1000) => {
    return new Float32Array(Array.from({ length: size }, () => Math.random()));
  },

  /**
   * Benchmark function execution time
   */
  benchmarkFunction: async (fn: Function, iterations: number = 100): Promise<number> => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();
    return (end - start) / iterations;
  },

  /**
   * Assert performance threshold
   */
  assertPerformanceThreshold: (actualTime: number, thresholdMs: number) => {
    if (actualTime > thresholdMs) {
      throw new Error(`Performance threshold exceeded: ${actualTime}ms > ${thresholdMs}ms`);
    }
  },

  /**
   * Mock WASM memory management with aggressive CI-optimized limits
   */
  mockMemoryManager: () => ({
    allocate: jest.fn((size: number) => {
      // Enforce much smaller allocations in CI to prevent timeouts
      const isCI = !!(process.env.CI || process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)
      const maxSize = isCI ? 32 * 1024 : 64 * 1024 // Reduced from 64KB to 32KB for CI
      const actualSize = Math.min(size, maxSize)
      
      // Use cached arrays when possible in CI
      if (isCI && global._testArrayCache) {
        if (actualSize <= 40) return global._testArrayCache.small.buffer.slice(0, actualSize)
        if (actualSize <= 400) return global._testArrayCache.medium.buffer.slice(0, actualSize)
        if (actualSize <= 4000) return global._testArrayCache.large.buffer.slice(0, actualSize)
      }
      
      return new ArrayBuffer(actualSize)
    }),
    deallocate: jest.fn(),
    getUsage: jest.fn(() => ({ 
      used: 512, // Reduced from 1KB
      available: !!(process.env.CI || process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) ? 64 * 1024 : 1024 * 1024 
    }))
  })
};

// Setup WASM environment for tests with enhanced CI safety
beforeAll(async () => {
  // Enhanced timeout protection for CI environments
  const isCI = !!(process.env.CI || process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)
  const setupTimeout = isCI ? 100 : 500 // Faster setup in CI
  
  // Create timeout promise for CI safety
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), setupTimeout)
  })
  
  // Mock WebAssembly global if not available with aggressive timeout protection
  if (typeof WebAssembly === 'undefined') {
    const setupPromise = new Promise<void>((resolve) => {
      (global as any).WebAssembly = {
        instantiate: jest.fn().mockImplementation(async (moduleOrBuffer: any, imports?: any) => {
          // Ultra-fast mock response for CI environments
          if (isCI) {
            // Immediate resolution in CI to prevent timeouts
            return Promise.resolve({
              instance: { exports: { main: () => true } },
              module: {}
            })
          }
          
          // Handle both WebAssembly.instantiate(module) and WebAssembly.instantiate(buffer, imports)
          if (imports !== undefined) {
            // Called with (buffer, imports) - return full result for SIMD detection
            return Promise.resolve({ 
              instance: { 
                exports: { 
                  main: () => true  // This ensures SIMD detection returns true
                } 
              } 
            });
          } else {
            // Called with just (module) - return instance directly for SIMD detection
            return Promise.resolve({ 
              exports: { 
                main: () => true  // This ensures SIMD detection returns true
              } 
            });
          }
        }),
        compile: jest.fn().mockImplementation(async (bytes: any) => {
          // Immediate resolution in CI environments
          if (isCI) return Promise.resolve({})
          return Promise.resolve({})
        }),
        validate: jest.fn().mockImplementation((bytes: any) => {
          // Always return true for SIMD support in tests, but faster in CI
          return true
        }), 
        Module: jest.fn(),
        Memory: jest.fn().mockImplementation(() => ({
          buffer: new ArrayBuffer(isCI ? 128 * 1024 : 256 * 1024) // Smaller buffer in CI
        }))
      };
      resolve()
    })
    
    // Race setup against timeout to prevent hanging
    await Promise.race([setupPromise, timeoutPromise])
  }

  // Mock performance API with CI-optimized behavior
  if (typeof performance === 'undefined') {
    (global as any).performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn()
    };
  }
  
  // Pre-warm common test objects to reduce setup time
  if (isCI) {
    // Pre-allocate common test arrays to reduce GC pressure
    global._testArrayCache = {
      small: new Float32Array(10),
      medium: new Float32Array(100),
      large: new Float32Array(1000)
    }
  }
});

// Enhanced cleanup after tests with CI memory management
afterEach(() => {
  jest.clearAllMocks();
  
  // Enhanced CI memory cleanup to prevent accumulation
  const isCI = !!(process.env.CI || process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)
  if (isCI) {
    // Clear any cached test arrays
    if (global._testArrayCache) {
      global._testArrayCache = null
    }
    
    // Force garbage collection if available (Node.js CI environment)
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc()
      } catch (error) {
        // GC not available in this environment
      }
    }
  }
});

// Global cleanup after all tests
afterAll(() => {
  // Clean up WebAssembly mocks
  if (global.WebAssembly && global.WebAssembly.instantiate && global.WebAssembly.instantiate.mockClear) {
    global.WebAssembly.instantiate.mockClear()
  }
  
  // Clear test array cache
  if (global._testArrayCache) {
    global._testArrayCache = null
  }
});

export default mockWasmModule;