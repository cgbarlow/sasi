module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/src/**/*.test.js',
    '**/src/**/*.test.ts'
  ],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'es2022',
        target: 'es2022'
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{js,ts,jsx,tsx}'
  ],
  coverageDirectory: 'coverage',
  reporters: ['default']
};