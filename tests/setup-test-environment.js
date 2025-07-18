// Test environment setup for SASI Jest configuration
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up test environment for SASI...');

// Create necessary directories
const testDirs = [
  'tests/temp-db',
  'tests/mocks',
  'tests/utils',
  'coverage'
];

testDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Check if required files exist
const requiredFiles = [
  'tests/setup.js',
  'tests/mocks/fileMock.js',
  'tests/utils/wasm-transformer.js',
  'tests/utils/shader-transformer.js'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Missing file: ${file}`);
  } else {
    console.log(`✅ Found file: ${file}`);
  }
});

console.log('✅ Test environment setup complete');