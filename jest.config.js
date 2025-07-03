module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 60000, // 60 seconds timeout for E2E tests
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};