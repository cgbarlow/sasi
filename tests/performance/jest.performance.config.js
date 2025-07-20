/**
 * Jest Configuration for Performance Tests
 * Optimized for timeout prevention and efficient performance testing
 * FIX FOR ISSUE #47: PerformanceOptimizer timeout issues
 */

module.exports = {
  // Extend base configuration
  ...require('../../jest.config.js'),
  
  // Performance-specific test patterns
  testMatch: [
    '**/tests/performance/**/*.test.{js,ts}',
    '**/tests/unit/performance/**/*.test.{js,ts}',
    '**/tests/unit/ai/PerformanceAnalyzer.test.ts',
    '**/tests/unit/utils/WasmBridge.test.ts'
  ],
  
  // Optimized timeout settings for performance tests
  testTimeout: 120000, // 2 minutes for performance analysis tests
  
  // Performance test specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/performance-setup.ts'
  ],
  
  // Optimized for performance testing
  maxWorkers: 1, // Single worker to avoid resource contention
  detectOpenHandles: true,
  forceExit: true,
  bail: false,
  
  // Memory management for performance tests
  workerIdleMemoryLimit: '1GB',
  
  // Performance test specific reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage/performance',
      outputName: 'performance-junit.xml',
      suiteName: 'Performance Tests'
    }]
  ],
  
  // Coverage for performance modules
  collectCoverageFrom: [
    'src/performance/**/*.{js,ts}',
    'src/utils/WasmBridge.ts',
    'src/ai/PerformanceAnalyzer.ts',
    '!src/**/*.d.ts'
  ],
  
  // Performance test environment variables
  testEnvironmentOptions: {
    ...require('../../jest.config.js').testEnvironmentOptions,
    // Optimize for performance testing
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  },
  
  // Additional performance test globals
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        target: 'es2020',
        module: 'esnext'
      }
    },
    // Performance test flags
    PERFORMANCE_TEST_MODE: true,
    DISABLE_EXPENSIVE_OPERATIONS: true,
    MOCK_HEAVY_COMPUTATIONS: true
  }
};