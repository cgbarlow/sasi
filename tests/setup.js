// Jest setup for E2E tests
jest.setTimeout(60000);

// Global test configuration
global.expect = expect;

// Console colors for better test output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Enhanced console.log for tests
const originalLog = console.log;
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('✅')) {
    originalLog(colors.green + args[0] + colors.reset, ...args.slice(1));
  } else if (args[0] && typeof args[0] === 'string' && args[0].startsWith('❌')) {
    originalLog(colors.red + args[0] + colors.reset, ...args.slice(1));
  } else if (args[0] && typeof args[0] === 'string' && args[0].startsWith('🚀')) {
    originalLog(colors.cyan + args[0] + colors.reset, ...args.slice(1));
  } else {
    originalLog(...args);
  }
};