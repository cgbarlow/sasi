/**
 * Specialized Jest configuration for SwarmContext tests
 * Optimized for React component testing with neural service mocks
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Optimized timeout for SwarmContext tests
  testTimeout: 15000, // 15 seconds - sufficient for React component tests
  
  // Focus on SwarmContext tests only
  testMatch: [
    '**/tests/unit/contexts/SwarmContext.test.{tsx,ts}',
    '**/src/contexts/**/*.test.{tsx,ts}'
  ],
  
  // Enhanced setup for React testing
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/setup/swarmcontext-setup.js'
  ],
  
  // Optimized for component testing
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Direct mock paths for neural services
    '^@/services/NeuralAgentManager$': '<rootDir>/tests/mocks/NeuralAgentManager.mock.js',
    '^@/services/NeuralMeshService$': '<rootDir>/tests/mocks/NeuralMeshService.mock.js',
    '^@/services/SwarmContextIntegration$': '<rootDir>/tests/mocks/SwarmContextIntegration.mock.js'
  },
  
  // Reduced workers for focused testing
  maxWorkers: 1,
  
  // Enhanced error handling for context tests
  verbose: true,
  detectOpenHandles: true,
  
  // Optimized for React component testing
  collectCoverageFrom: [
    'src/contexts/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  
  // Disable coverage by default for faster testing
  collectCoverage: false,
  
  // Enhanced reporting for context tests
  reporters: [
    'default',
    ['jest-junit', {
      outputName: 'swarmcontext-test-results.xml',
      suiteName: 'SwarmContext Tests'
    }]
  ]
};