/**
 * FINAL Optimized Jest Configuration for SwarmContext Tests
 * Addresses all identified issues: timeouts, DOM setup, mocks, and infinite loops
 */

module.exports = {
  // Test Environment - Optimized for React components with SwarmContext
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  },

  // Timeout Configuration - Optimized for SwarmContext
  testTimeout: 15000, // 15 seconds - allows for async operations without being too long
  
  // Test Pattern Matching - Focused on unit tests
  testMatch: [
    '**/tests/unit/**/*.test.{js,ts,tsx}',
    '**/src/**/__tests__/**/*.{js,ts,tsx}',
    '**/src/**/*.{test,spec}.{js,ts,tsx}'
  ],

  // Test Exclusions
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/tests/e2e/',
    '/tests/integration/'
  ],

  // Setup Files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // TypeScript Configuration
  preset: 'ts-jest',
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        target: 'es2020',
        module: 'esnext'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript', { allowDeclareFields: true }]
      ]
    }]
  },

  // Module Resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js'
  },

  // Performance Configuration
  maxWorkers: 1,
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Memory Management - Critical for preventing infinite loops
  workerIdleMemoryLimit: '512MB',
  
  // Output Configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Mock Configuration
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Coverage Configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/contexts/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  
  // ES Module Support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill|universal-user-agent|before-after-hook|deprecation)/)'
  ],

  // Test Runner
  testRunner: 'jest-circus',
  
  // Error Handling
  errorOnDeprecated: true
};