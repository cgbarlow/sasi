/**
 * Jest Configuration for TDD Test Suite
 * Issue #22: TDD Test Suite Implementation
 * 
 * This configuration file is specifically designed for running the TDD test suite
 * with comprehensive coverage, performance monitoring, and regression detection.
 * 
 * Features:
 * - Optimized for TDD test execution
 * - Comprehensive coverage reporting
 * - Performance monitoring integration
 * - Memory leak detection
 * - Parallel execution support
 * - CI/CD integration
 * - Real-time reporting
 */

module.exports = {
  // Test Environment
  testEnvironment: 'node',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  },
  
  // Test Discovery
  testMatch: [
    '**/tests/tdd/**/*.test.{js,ts,tsx}',
    '**/tests/tdd/**/*.spec.{js,ts,tsx}'
  ],
  
  // Test Exclusions
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/reports/',
    '/archive/'
  ],
  
  // Module Resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@tdd/(.*)$': '<rootDir>/tests/tdd/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@performance/(.*)$': '<rootDir>/src/performance/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js'
  },
  
  // TypeScript Configuration
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Transform Configuration
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
        isolatedModules: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        declaration: false,
        sourceMap: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedLocals: false,
        noUnusedParameters: false
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript', { allowDeclareFields: true }]
      ]
    }],
    '\\.(wasm)$': '<rootDir>/tests/utils/wasm-transformer.js',
    '\\.(glsl|vert|frag)$': '<rootDir>/tests/utils/shader-transformer.js'
  },
  
  // Setup Files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/tdd/tdd-setup.js'
  ],
  
  // Test Timeouts
  testTimeout: 300000, // 5 minutes for TDD tests
  
  // Performance Configuration
  maxWorkers: process.env.CI ? 2 : '75%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache-tdd',
  
  // Output Configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  bail: false,
  
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    'tests/tdd/**/*.{js,ts,tsx}',
    '!src/tests/**',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/App.tsx',
    '!node_modules/**',
    '!dist/**',
    '!build/**',
    '!coverage/**',
    '!tests/mocks/**',
    '!tests/utils/**',
    '!tests/setup.js',
    '!**/*.config.js',
    '!**/*.config.ts'
  ],
  
  coverageDirectory: 'coverage/tdd',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'cobertura',
    'clover',
    'json-summary'
  ],
  
  // TDD-Specific Coverage Thresholds (>90% requirement)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/performance/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/persistence/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/utils/': {
      branches: 97,
      functions: 97,
      lines: 97,
      statements: 97
    },
    './tests/tdd/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Reporter Configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage/tdd',
      outputName: 'tdd-junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      addFileAttribute: 'true',
      includeConsoleOutput: 'true',
      includeShortConsoleOutput: 'true'
    }],
    ['jest-html-reporters', {
      publicDir: 'coverage/tdd',
      filename: 'tdd-report.html',
      pageTitle: 'TDD Test Suite Report',
      logoImgPath: undefined,
      expand: true,
      hideIcon: false,
      testCommand: 'npm run test:tdd',
      openReport: false,
      failureMessageOnly: false,
      enableMergeData: true,
      dataMergeLevel: 1,
      inlineSource: false,
      urlForTestFiles: undefined
    }]
  ],
  
  // Memory Management
  workerIdleMemoryLimit: '1GB',
  
  // Error Handling
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // Watch Configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/reports/',
    '/.jest-cache/'
  ],
  
  // Test Retry Configuration (for flaky tests)
  retryTimes: process.env.CI ? 2 : 0,
  
  // Global Configuration
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [1343]
      },
      astTransformers: {
        before: [
          {
            path: 'ts-jest/dist/transformers/hoist-jest.js',
            options: {
              debug: false
            }
          }
        ]
      }
    },
    // TDD-specific globals
    TDD_MODE: true,
    PERFORMANCE_MONITORING: true,
    REGRESSION_DETECTION: true,
    MEMORY_LEAK_DETECTION: true,
    REAL_TIME_REPORTING: true,
    COVERAGE_THRESHOLD: 90,
    PERFORMANCE_THRESHOLD: {
      AGENT_SPAWN_TIME: 75,
      INFERENCE_TIME: 100,
      PERSISTENCE_SAVE_TIME: 75,
      PERSISTENCE_LOAD_TIME: 100,
      COORDINATION_OVERHEAD: 50,
      MEMORY_USAGE_PER_AGENT: 50 * 1024 * 1024,
      REAL_TIME_FPS: 60
    }
  },
  
  // Test Execution Order
  testSequencer: '<rootDir>/tests/tdd/tdd-sequencer.js',
  
  // Custom Test Runner
  runner: 'jest-runner',
  
  // Module Directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests',
    '<rootDir>/tests/tdd'
  ],
  
  // File Extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node',
    'wasm'
  ],
  
  // Snapshot Configuration
  snapshotSerializers: [
    'jest-serializer-html',
    'enzyme-to-json/serializer'
  ],
  
  // Project Configuration for Multi-Project Setup
  projects: [
    {
      displayName: 'TDD Unit Tests',
      testMatch: ['<rootDir>/tests/tdd/**/unit/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 60000
    },
    {
      displayName: 'TDD Integration Tests',
      testMatch: ['<rootDir>/tests/tdd/**/integration/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 120000
    },
    {
      displayName: 'TDD Performance Tests',
      testMatch: ['<rootDir>/tests/tdd/**/performance/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 300000,
      maxWorkers: 1 // Run performance tests sequentially
    },
    {
      displayName: 'TDD E2E Tests',
      testMatch: ['<rootDir>/tests/tdd/**/e2e/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 300000,
      maxWorkers: 1 // Run E2E tests sequentially
    },
    {
      displayName: 'TDD Comprehensive Suite',
      testMatch: [
        '<rootDir>/tests/tdd/comprehensive-tdd-test-suite.test.ts',
        '<rootDir>/tests/tdd/p2p-mesh-networking-tests.test.ts',
        '<rootDir>/tests/tdd/automated-test-reporting.test.ts'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 900000, // 15 minutes for comprehensive tests
      maxWorkers: 1 // Run comprehensive tests sequentially
    }
  ],
  
  // CI/CD Specific Configuration
  ...(process.env.CI && {
    silent: true,
    passWithNoTests: false,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'cobertura', 'json-summary'],
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: 'coverage/tdd',
        outputName: 'tdd-junit.xml'
      }]
    ],
    maxWorkers: 2,
    workerIdleMemoryLimit: '512MB',
    testTimeout: 600000, // 10 minutes in CI
    bail: process.env.CI_FAIL_FAST === 'true'
  }),
  
  // Development Mode Configuration
  ...(process.env.NODE_ENV === 'development' && {
    verbose: true,
    collectCoverage: false,
    watchAll: false,
    testTimeout: 300000,
    maxWorkers: '50%',
    bail: false
  }),
  
  // Debugging Configuration
  ...(process.env.DEBUG_TESTS === 'true' && {
    verbose: true,
    runInBand: true,
    detectOpenHandles: true,
    forceExit: false,
    testTimeout: 0, // No timeout for debugging
    collectCoverage: false
  })
}
