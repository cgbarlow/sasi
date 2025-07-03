#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');

const SERVER_URL = 'http://localhost:3000';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

console.log('🚀 SASI@home E2E Test Runner');
console.log('================================');

// Function to check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(SERVER_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Function to wait for server to be ready
async function waitForServer() {
  console.log('🔍 Checking if development server is running...');
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const isRunning = await checkServer();
    
    if (isRunning) {
      console.log('✅ Development server is ready!');
      return true;
    }
    
    if (i === 0) {
      console.log('⏳ Waiting for development server to start...');
    }
    
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  console.log('\n❌ Development server is not responding after 30 seconds');
  return false;
}

// Function to run tests
function runTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Starting E2E tests...');
    console.log('================================\n');
    
    const testProcess = spawn('npx', ['jest', 'tests/e2e/', '--verbose'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 All E2E tests passed!');
        resolve();
      } else {
        console.log('\n❌ Some E2E tests failed');
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Error running tests:', error);
      reject(error);
    });
  });
}

// Main execution
async function main() {
  try {
    const serverReady = await waitForServer();
    
    if (!serverReady) {
      console.log('\n💡 Please ensure the development server is running:');
      console.log('   npm run dev');
      process.exit(1);
    }
    
    await runTests();
    
    console.log('\n✨ E2E testing completed successfully!');
    console.log('================================');
    
  } catch (error) {
    console.error('\n💥 E2E testing failed:', error.message);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 E2E tests interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 E2E tests terminated');
  process.exit(0);
});

main();