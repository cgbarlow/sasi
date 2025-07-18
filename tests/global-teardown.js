// Global teardown for test environment
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Starting global test teardown...');
  
  // Calculate performance metrics
  if (global.__PERFORMANCE_METRICS__) {
    const endTime = Date.now();
    const duration = endTime - global.__PERFORMANCE_METRICS__.testStart;
    const finalMemory = process.memoryUsage();
    const finalCpu = process.cpuUsage();
    
    const performanceReport = {
      duration,
      memoryUsage: {
        start: global.__PERFORMANCE_METRICS__.memoryUsage,
        end: finalMemory,
        diff: {
          rss: finalMemory.rss - global.__PERFORMANCE_METRICS__.memoryUsage.rss,
          heapUsed: finalMemory.heapUsed - global.__PERFORMANCE_METRICS__.memoryUsage.heapUsed,
          heapTotal: finalMemory.heapTotal - global.__PERFORMANCE_METRICS__.memoryUsage.heapTotal,
          external: finalMemory.external - global.__PERFORMANCE_METRICS__.memoryUsage.external
        }
      },
      cpuUsage: {
        start: global.__PERFORMANCE_METRICS__.cpuUsage,
        end: finalCpu,
        diff: {
          user: finalCpu.user - global.__PERFORMANCE_METRICS__.cpuUsage.user,
          system: finalCpu.system - global.__PERFORMANCE_METRICS__.cpuUsage.system
        }
      }
    };
    
    // Save performance report
    const reportPath = path.join(__dirname, '..', 'coverage', 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
    
    console.log(`📊 Performance report saved to ${reportPath}`);
    console.log(`⏱️  Total test duration: ${duration}ms`);
    console.log(`💾 Memory usage delta: ${(performanceReport.memoryUsage.diff.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Clean up test files
  const testDbPath = global.__TEST_DB_PATH__;
  if (testDbPath && fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  // Clean up temporary files
  const tempDir = path.join(__dirname, 'fixtures', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Final claude-flow hooks cleanup
  try {
    await require('child_process').execSync('npx claude-flow@alpha hooks post-task --task-id "global-test-teardown"', {
      stdio: 'pipe',
      timeout: 10000
    });
  } catch (error) {
    console.warn('⚠️  Claude-flow hooks cleanup not available');
  }
  
  console.log('✅ Global test teardown complete');
};