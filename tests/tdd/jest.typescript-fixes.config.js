/**
 * Jest Configuration for TypeScript Fixes TDD Tests
 * Specialized configuration for testing TypeScript fixes
 */

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'TypeScript Fixes TDD',
  
  // Test files specific to TypeScript fixes
  testMatch: [
    '<rootDir>/tests/tdd/typescript-fixes-*.test.ts'
  ],
  
  // Coverage settings for TypeScript fixes
  collectCoverageFrom: [
    'src/types/*.ts',
    'src/services/MeshTopology.ts',
    'src/github/*.ts',
    'src/ai/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  // Coverage thresholds for TypeScript fixes
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    'src/types/': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    'src/services/MeshTopology.ts': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  
  // Module name mapping for TypeScript fixes
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/github/(.*)$': '<rootDir>/src/github/$1',
    '^@/ai/(.*)$': '<rootDir>/src/ai/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1'
  },
  
  // Setup files for TypeScript fixes tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/tdd/typescript-fixes-setup.ts'
  ],
  
  // Timeout for TypeScript fixes tests
  testTimeout: 30000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Fail fast on first test failure
  bail: false,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaks
  detectLeaks: false,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/typescript-fixes',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@octokit))'
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Globals for TypeScript tests
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        alwaysStrict: true,
        noUnusedLocals: false, // Disabled for tests
        noUnusedParameters: false, // Disabled for tests
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: false,
        noUncheckedIndexedAccess: false
      }
    }
  },
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/typescript-fixes/html',
        filename: 'typescript-fixes-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'TypeScript Fixes TDD Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/typescript-fixes',
        outputName: 'typescript-fixes-junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: false,
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ]
};