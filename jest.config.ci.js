/**
 * Ultra-Optimized Jest Configuration for CI Performance
 * 
 * Designed to reduce test execution time from 5+ minutes to <30 seconds
 * by eliminating bottlenecks and optimizing for speed over comprehensive reporting
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // CRITICAL: Performance optimizations for CI speed
  maxWorkers: '50%',                    // Use 50% of CPU cores for parallel execution
  testTimeout: 3000,                    // 3 second timeout prevents hanging tests
  bail: 1,                              // Stop on first failure for fast feedback
  cache: false,                         // Disable cache for consistent CI behavior
  verbose: false,                       // Reduce output verbosity for speed
  silent: false,                        // Keep some output for debugging
  
  // Test file patterns - only unit tests for speed
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.test.js'
  ],
  
  // Exclude slow integration tests in CI-fast mode
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/',
    '/tests/e2e/',
    '/tests/performance/'
  ],
  
  // Ultra-fast setup for CI
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup-ci-optimized.js'
  ],
  
  // Transform only what's necessary
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false                    // Disable ESM for compatibility
    }]
  },
  
  // Disable coverage collection for maximum speed
  collectCoverage: false,
  
  // Environment variables for CI optimization
  setupFiles: [
    '<rootDir>/tests/ci-optimized-setup.js'
  ],
  
  // Aggressive module clearing for consistent state
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Fast reporters only
  reporters: [
    'default'
  ],
  
  // Disable unnecessary features for CI speed
  errorOnDeprecated: false,
  detectOpenHandles: false,
  detectLeaks: false,
  forceExit: true                      // Force exit after tests complete
}