module.exports = {
  // Test Environment Configuration for Phase 2A
  testEnvironment: 'node', // Changed to node for SQLite testing
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  },
  
  // Simplified test environment for Phase 2A persistence layer
  // Projects configuration disabled to avoid babel/setup conflicts
  
  // Test Pattern Matching for Phase 2A
  testMatch: [
    '**/tests/**/*.test.{js,ts,tsx}',
    '**/src/**/__tests__/**/*.{js,ts,tsx}',
    '**/src/**/*.{test,spec}.{js,ts,tsx}',
    '**/tests/unit/**/*.test.{js,ts}',
    '**/tests/integration/**/*.test.{js,ts}',
    '**/tests/performance/**/*.test.{js,ts}',
    '**/tests/persistence/**/*.test.{js,ts}',
    '**/tests/coordination/**/*.test.{js,ts}',
    '**/tests/tdd/**/*.test.{js,ts}'
  ],
  
  // Test Exclusions
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/tests/e2e/'
  ],
  
  // Setup Files for Phase 2A
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Timeout Configuration for Phase 2A
  testTimeout: 90000, // 90 seconds for comprehensive tests including SQLite operations
  
  // Output Configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  bail: false, // Continue running tests after failures
  
  // TypeScript Configuration
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }
  },
  
  // Transform Configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
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
    }],
    '\\.(wasm)$': '<rootDir>/tests/utils/wasm-transformer.js',
    '\\.(glsl|vert|frag)$': '<rootDir>/tests/utils/shader-transformer.js'
  },
  
  // Module Mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@performance/(.*)$': '<rootDir>/src/performance/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js'
  },
  
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/tests/**',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!node_modules/**',
    '!dist/**',
    '!build/**',
    '!coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json', 'cobertura'],
  
  // Coverage Thresholds for Phase 2A (>90% requirement)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
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
    './src/coordination/': {
      branches: 93,
      functions: 93,
      lines: 93,
      statements: 93
    }
  },
  
  // Watch Configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Performance Configuration
  maxWorkers: '50%', // Use half of available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Reporter Configuration
  reporters: [
    'default'
  ],
  
  // Error Handling
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false
};