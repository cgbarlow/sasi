// Test environment teardown for SASI Jest configuration
const fs = require('fs');
const path = require('path');

console.log('🧹 Tearing down test environment...');

// Clean up temp directories
const tempDirs = [
  'tests/temp-db',
  '.jest-cache'
];

tempDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleaned up: ${dir}`);
    } catch (error) {
      console.log(`⚠️  Failed to clean up ${dir}: ${error.message}`);
    }
  }
});

console.log('✅ Test environment teardown complete');