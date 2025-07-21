// CI-specific test setup for enhanced stability
// This file is loaded only in CI environments

if (process.env.CI) {
  console.log('🔧 Loading CI-specific test configuration...');
  
  // Enhanced error reporting for CI
  process.on('unhandledRejection', (reason, promise) => {
    console.error('CI Unhandled Rejection:', promise, 'reason:', reason);
    process.exit(1); // Fail fast in CI
  });
  
  // Increase global timeout for CI operations
  jest.setTimeout(30000);
  
  // Force garbage collection to prevent memory issues
  if (global.gc) {
    const originalAfterEach = afterEach;
    global.afterEach = function(fn, timeout) {
      return originalAfterEach(function() {
        if (fn) fn.apply(this, arguments);
        if (global.gc) {
          global.gc();
        }
      }, timeout);
    };
  }
  
  // Enhanced console logging for CI debugging
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Add timestamp to CI error logs
    originalConsoleError('[CI ERROR]', new Date().toISOString(), ...args);
  };
  
  console.log('✅ CI-specific test configuration loaded');
}