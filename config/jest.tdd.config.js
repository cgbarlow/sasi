/**
 * Simplified Jest Configuration for TDD Phase 2A Development
 * Focus: SQLite persistence layer testing only
 */

module.exports = {
  testEnvironment: 'node',
  
  // Test Pattern Matching for TDD persistence tests only
  testMatch: [
    '**/tests/unit/persistence/**/*.test.{js,ts}',
    '**/tests/integration/persistence/**/*.test.{js,ts}'
  ],
  
  // Simple setup - no complex dependencies
  setupFilesAfterEnv: [],
  
  // Timeout Configuration
  testTimeout: 30000, // 30 seconds for SQLite operations
  
  // TypeScript Configuration
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        target: 'es2020',
        module: 'esnext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }
  },
  
  // Simple Transform Configuration for TDD only
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      isolatedModules: true
    }]
  },
  
  // Module Mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage Configuration for TDD
  collectCoverage: true,
  collectCoverageFrom: [
    'src/persistence/**/*.{js,ts}',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage-tdd',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // TDD Coverage Thresholds (>95% for persistence layer)
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Performance Configuration
  maxWorkers: 2,
  cache: false, // Disable cache for TDD development
  
  // Output Configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};