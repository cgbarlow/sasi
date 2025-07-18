// Global setup for test environment
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
  console.log('🚀 Starting global test setup...');
  
  // Create test directories
  const testDirs = [
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/performance',
    'tests/wasm',
    'tests/fixtures',
    'tests/mocks',
    'coverage'
  ];
  
  testDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Initialize test databases
  global.__TEST_DB_PATH__ = path.join(__dirname, 'fixtures', 'test.db');
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CLAUDE_FLOW_TEST_MODE = 'true';
  process.env.SASI_TEST_MODE = 'true';
  process.env.SYNAPTIC_MESH_TEST_MODE = 'true';
  process.env.DISABLE_WASM_SIMD = 'false';
  process.env.TEST_TIMEOUT = '60000';
  
  // Initialize claude-flow hooks in test mode
  try {
    await require('child_process').execSync('npx claude-flow@alpha hooks pre-task --description "Global test setup"', {
      stdio: 'pipe',
      timeout: 10000
    });
  } catch (error) {
    console.warn('⚠️  Claude-flow hooks not available in test mode');
  }
  
  // Mock neural mesh initialization
  global.__NEURAL_MESH_INITIALIZED__ = true;
  
  // Set up performance monitoring
  global.__PERFORMANCE_METRICS__ = {
    testStart: Date.now(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  console.log('✅ Global test setup complete');
};