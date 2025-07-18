/**
 * WASM Test Setup
 * Provides WASM module mocking and testing utilities for Jest
 */

import { jest } from '@jest/globals';

// Mock WASM module for testing
export const mockWasmModule = {
  initialized: true,
  simdSupported: true,
  performanceMultiplier: 2.8,
  memoryPool: new ArrayBuffer(1024 * 1024),
  
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
    operations_per_second: 1000000,
    memory_usage: 1024 * 1024,
    simd_acceleration: true
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
   * Mock WASM memory management
   */
  mockMemoryManager: () => ({
    allocate: jest.fn((size: number) => new ArrayBuffer(size)),
    deallocate: jest.fn(),
    getUsage: jest.fn(() => ({ used: 1024, available: 1024 * 1024 }))
  })
};

// Setup WASM environment for tests
beforeAll(() => {
  // Mock WebAssembly global if not available
  if (typeof WebAssembly === 'undefined') {
    (global as any).WebAssembly = {
      instantiate: jest.fn().mockResolvedValue({
        instance: {
          exports: mockWasmModule
        }
      }),
      compile: jest.fn().mockResolvedValue({}),
      Module: jest.fn()
    };
  }

  // Mock performance API
  if (typeof performance === 'undefined') {
    (global as any).performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn()
    };
  }
});

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
});

export default mockWasmModule;