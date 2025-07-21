/**
 * CI-Optimized Test Setup
 * 
 * Ultra-fast test environment setup specifically designed to eliminate
 * the 5+ minute timeout issues in NeuralBridge tests
 */

// Set CI environment variables immediately
process.env.CI = 'true'
process.env.NODE_ENV = 'test'
process.env.WASM_ENABLED = 'false'
process.env.DISABLE_WASM_ACCELERATION = 'true'
process.env.TEST_ENVIRONMENT = 'ci'
process.env.JEST_WORKER_ID = '1'

// CRITICAL: Monkey-patch setTimeout for CI speed
// This eliminates the primary source of test delays
const originalSetTimeout = global.setTimeout
const originalSetInterval = global.setInterval

global.setTimeout = (callback, delay = 0, ...args) => {
  // In CI, reduce all delays by 95% (but keep some async behavior)
  const reducedDelay = process.env.CI === 'true' ? Math.max(0, Math.floor(delay * 0.05)) : delay
  return originalSetTimeout(callback, reducedDelay, ...args)
}

global.setInterval = (callback, delay = 1000, ...args) => {
  const reducedDelay = process.env.CI === 'true' ? Math.max(1, Math.floor(delay * 0.05)) : delay
  return originalSetInterval(callback, reducedDelay, ...args)
}

// Mock performance.now for consistent timing
const startTime = Date.now()
global.performance = global.performance || {}
global.performance.now = () => Date.now() - startTime

// Ultra-fast WASM bridge mock (zero delays)
global.mockWasmModule = {
  createNeuralNetwork: jest.fn().mockImplementation(async (config) => {
    // Zero delay in CI - immediate response
    return {
      id: `network_${Date.now()}`,
      type: config.type || 'mlp',
      architecture: config.architecture || [10, 5, 1],
      weights: new Float32Array(100),
      biases: new Float32Array(16),
      memoryUsage: 1024 * 1024 // 1MB
    }
  }),
  
  runInference: jest.fn().mockImplementation(async (network, inputs) => {
    // Zero delay inference
    const outputSize = network.architecture?.[network.architecture.length - 1] || 1
    return Array.from({ length: outputSize }, () => Math.random())
  }),
  
  trainNetwork: jest.fn().mockImplementation(async (network, data, epochs) => {
    // Zero delay training
    return {
      accuracy: 0.85 + Math.random() * 0.1, // 85-95% accuracy
      convergenceEpoch: Math.floor(epochs * 0.7)
    }
  }),
  
  serializeWeights: jest.fn().mockImplementation(async (network) => {
    return network.weights?.buffer || new ArrayBuffer(400)
  }),
  
  deserializeWeights: jest.fn().mockImplementation(async (network, weights, influence) => {
    // Immediate weight update
    if (network.weights && weights) {
      const newWeights = new Float32Array(weights)
      for (let i = 0; i < Math.min(network.weights.length, newWeights.length); i++) {
        network.weights[i] = network.weights[i] * (1 - influence) + newWeights[i] * influence
      }
    }
  })
}

// Mock global fetch for any HTTP requests
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('OK')
  })
)

// Suppress console output for maximum CI speed (except errors)
const originalConsoleLog = console.log
const originalConsoleInfo = console.info
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.log = () => {} // Silent in CI
console.info = () => {} // Silent in CI  
console.warn = () => {} // Silent in CI
console.error = originalConsoleError // Keep errors visible

// Restore original console methods for debugging if needed
global.restoreConsole = () => {
  console.log = originalConsoleLog
  console.info = originalConsoleInfo
  console.warn = originalConsoleWarn
}

// Memory management for CI stability
global.gc = global.gc || (() => {})

// Jest timeout protection
jest.setTimeout(3000) // 3 second max per test

console.error('🚀 CI-Optimized test setup complete - Ultra-fast mode enabled')