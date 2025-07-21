/**
 * Optimized Jest Configuration for SwarmContext Tests
 * Fixes timeout issues, DOM environment setup, and mock configurations
 */

module.exports = {
  // Test Environment - Optimized for React components
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      // Ensure crypto API is available for neural services
      if (!window.crypto) {
        window.crypto = require('crypto').webcrypto || {
          getRandomValues: (arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          }
        };
      }
    }
  },

  // Timeout Configuration - Balanced for component tests
  testTimeout: 10000, // 10 seconds for SwarmContext tests
  
  // Test Pattern Matching - Focus on unit tests
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
    '/tests/e2e/', // Exclude e2e tests for unit testing
    '/tests/integration/' // Exclude integration tests for focused testing
  ],

  // Setup Files - Enhanced for SwarmContext
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // TypeScript and Transform Configuration
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        target: 'es2020',
        module: 'esnext',
        isolatedModules: true
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

  // Module Resolution - Optimized paths
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

  // Performance Configuration - Optimized for unit tests
  maxWorkers: 1, // Single worker for focused testing and memory control
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Memory Management
  workerIdleMemoryLimit: '256MB', // Reduced for SwarmContext tests
  
  // Output Configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true, // Force exit to prevent hanging from infinite loops
  
  // ES Module Support
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill|universal-user-agent|before-after-hook|deprecation)/)'
  ],

  // Error Handling - Strict for finding issues
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true, // Reset all mocks between tests
  
  // Coverage Configuration - Focused on contexts
  collectCoverage: false, // Disable by default for faster testing
  collectCoverageFrom: [
    'src/contexts/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  
  // Reporters - Enhanced for debugging
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'swarmcontext-junit.xml',
      suiteName: 'SwarmContext Unit Tests'
    }]
  ],

  // Global Configuration
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },

  // Test Runner - Use circus for better async handling
  testRunner: 'jest-circus'
};