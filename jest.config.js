module.exports = {
  // Test environment configuration
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/src/**/*.test.js',
    '**/src/**/*.test.ts',
    '**/sasi/**/*.test.js',
    '**/sasi/**/*.test.ts',
    '**/synaptic-mesh/**/*.test.js',
    '**/synaptic-mesh/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Transformations
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'es2022',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        target: 'es2022'
      }
    }],
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { modules: false }]]
    }],
    '^.+\\.jsx$': ['babel-jest', {
      presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react']
    }],
    '^.+\\.tsx$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'es2022',
        jsx: 'react-jsx',
        target: 'es2022'
      }
    }]
  },
  
  // Module mappings
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@sasi/(.*)$': '<rootDir>/sasi/src/$1',
    '^@synaptic/(.*)$': '<rootDir>/synaptic-mesh/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    'sasi/src/**/*.{js,ts,jsx,tsx}',
    'synaptic-mesh/src/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/*.test.{js,ts,jsx,tsx}',
    '!**/*.spec.{js,ts,jsx,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout and retries
  testTimeout: 60000,
  retry: 2,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  detectOpenHandles: true,
  forceExit: true,
  
  // Test suites
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,ts}'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      testTimeout: 120000
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      testTimeout: 300000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/tests/performance/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      testTimeout: 600000
    },
    {
      displayName: 'WASM Tests',
      testMatch: ['<rootDir>/tests/wasm/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      testTimeout: 180000
    },
    {
      displayName: 'SASI Tests',
      testMatch: ['<rootDir>/sasi/tests/**/*.test.{js,ts}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/sasi-setup.js']
    },
    {
      displayName: 'Synaptic Mesh Tests',
      testMatch: ['<rootDir>/synaptic-mesh/tests/**/*.test.{js,ts}'],
      testEnvironment: 'node'
    }
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      openReport: false
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml'
    }]
  ],
  
  // Watch configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/'
  ]
};