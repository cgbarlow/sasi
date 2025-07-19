#!/usr/bin/env node

/**
 * Phase 2A Test Runner
 * Comprehensive test execution and reporting for Phase 2A integration tests
 * 
 * Features:
 * - Parallel test execution with optimal resource usage
 * - Real-time performance monitoring
 * - Comprehensive reporting and metrics collection
 * - CI/CD integration support
 * - Memory leak detection
 * - Performance regression detection
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Test execution configuration
const TEST_CONFIG = {
  // Test suites to execute
  suites: [
    {
      name: 'Unit Tests',
      pattern: 'tests/unit/**/*.test.{js,ts}',
      timeout: 30000,
      parallel: true,
      priority: 1
    },
    {
      name: 'Integration Tests',
      pattern: 'tests/integration/**/*.test.{js,ts}',
      timeout: 60000,
      parallel: true,
      priority: 2
    },
    {
      name: 'Performance Benchmarks',
      pattern: 'tests/performance/**/*.test.{js,ts}',
      timeout: 120000,
      parallel: false, // Sequential for accurate benchmarks
      priority: 3
    },
    {
      name: 'Mock→Neural Transition',
      pattern: 'tests/integration/mock-neural-transition-validation.test.ts',
      timeout: 90000,
      parallel: true,
      priority: 4
    },
    {
      name: 'E2E Workflows',
      pattern: 'tests/e2e/**/*.test.{js,ts}',
      timeout: 180000,
      parallel: false, // Sequential for workflow integrity
      priority: 5
    }
  ],
  
  // Performance thresholds
  performanceThresholds: {
    maxExecutionTime: 600000, // 10 minutes total
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    minCoverage: 90,
    maxFailureRate: 0.05 // 5%
  },
  
  // Reporting configuration
  reporting: {
    console: true,
    json: true,
    html: true,
    junit: true,
    coverage: true
  }
};

class Phase2ATestRunner {
  constructor() {
    this.startTime = performance.now();
    this.results = {
      suites: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      performance: {
        memoryUsage: [],
        executionTimes: [],
        bottlenecks: []
      },
      coverage: null
    };
    this.memoryMonitor = null;
  }

  /**
   * Main test execution entry point
   */
  async run() {
    console.log('🚀 Starting Phase 2A Test Runner');
    console.log('=' .repeat(60));
    
    try {
      await this.validateEnvironment();
      await this.initializeMonitoring();
      await this.executeTestSuites();
      await this.generateReports();
      await this.validatePerformance();
      
      const success = this.results.summary.failed === 0;
      console.log(`\n${success ? '✅' : '❌'} Test execution ${success ? 'PASSED' : 'FAILED'}`);
      
      if (!success) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Test runner failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  /**
   * Validate test environment and dependencies
   */
  async validateEnvironment() {
    console.log('🔍 Validating test environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js version: ${nodeVersion}`);
    
    // Check package.json and dependencies
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }
    
    // Check Jest configuration
    const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
    if (!fs.existsSync(jestConfigPath)) {
      throw new Error('jest.config.js not found');
    }
    
    // Check test directories
    const testDirs = ['tests/unit', 'tests/integration', 'tests/performance', 'tests/e2e'];
    for (const dir of testDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  Test directory not found: ${dir}`);
      }
    }
    
    console.log('✅ Environment validation completed');
  }

  /**
   * Initialize performance monitoring
   */
  async initializeMonitoring() {
    console.log('📊 Initializing performance monitoring...');
    
    // Start memory monitoring
    this.memoryMonitor = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.results.performance.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });
      
      // Check for memory leaks
      if (memUsage.heapUsed > TEST_CONFIG.performanceThresholds.maxMemoryUsage) {
        console.warn(`⚠️  High memory usage detected: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 1000);
    
    console.log('✅ Performance monitoring initialized');
  }

  /**
   * Execute all test suites
   */
  async executeTestSuites() {
    console.log('🧪 Executing test suites...');
    
    // Sort suites by priority
    const sortedSuites = TEST_CONFIG.suites.sort((a, b) => a.priority - b.priority);
    
    for (const suite of sortedSuites) {
      console.log(`\n📋 Running ${suite.name}...`);
      const startTime = performance.now();
      
      try {
        const result = await this.runTestSuite(suite);
        const duration = performance.now() - startTime;
        
        result.duration = duration;
        this.results.suites.push(result);
        
        // Update summary
        this.results.summary.total += result.total;
        this.results.summary.passed += result.passed;
        this.results.summary.failed += result.failed;
        this.results.summary.skipped += result.skipped;
        
        console.log(`   ✅ ${suite.name} completed in ${(duration / 1000).toFixed(2)}s`);
        console.log(`   📊 ${result.passed}/${result.total} passed, ${result.failed} failed, ${result.skipped} skipped`);
        
        // Check for failures
        if (result.failed > 0) {
          console.warn(`   ⚠️  ${result.failed} test(s) failed in ${suite.name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ ${suite.name} execution failed:`, error.message);
        this.results.suites.push({
          name: suite.name,
          status: 'ERROR',
          error: error.message,
          total: 0,
          passed: 0,
          failed: 1,
          skipped: 0,
          duration: performance.now() - startTime
        });
        this.results.summary.failed += 1;
      }
    }
    
    this.results.summary.duration = performance.now() - this.startTime;
    console.log(`\n🎯 All test suites completed in ${(this.results.summary.duration / 1000).toFixed(2)}s`);
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    return new Promise((resolve, reject) => {
      const args = [
        '--testPathPattern', suite.pattern,
        '--testTimeout', suite.timeout.toString(),
        '--verbose',
        '--forceExit',
        '--detectOpenHandles'
      ];
      
      // Add coverage for specific suites
      if (suite.name === 'Integration Tests' || suite.name === 'Unit Tests') {
        args.push('--coverage');
      }
      
      // Configure parallelism
      if (!suite.parallel) {
        args.push('--runInBand');
      } else {
        args.push('--maxWorkers=50%');
      }
      
      const jest = spawn('npx', ['jest', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      jest.stdout.on('data', (data) => {
        stdout += data.toString();
        if (TEST_CONFIG.reporting.console) {
          process.stdout.write(data);
        }
      });
      
      jest.stderr.on('data', (data) => {
        stderr += data.toString();
        if (TEST_CONFIG.reporting.console) {
          process.stderr.write(data);
        }
      });
      
      jest.on('close', (code) => {
        const result = this.parseJestOutput(stdout, stderr, suite.name);
        result.exitCode = code;
        result.status = code === 0 ? 'PASSED' : 'FAILED';
        
        if (code === 0) {
          resolve(result);
        } else {
          // Don't reject on test failures, just return the result
          resolve(result);
        }
      });
      
      jest.on('error', (error) => {
        reject(new Error(`Failed to start Jest for ${suite.name}: ${error.message}`));
      });
      
      // Kill test if it exceeds timeout
      setTimeout(() => {
        if (!jest.killed) {
          console.warn(`⏰ ${suite.name} timed out, killing process...`);
          jest.kill('SIGKILL');
          reject(new Error(`${suite.name} execution timed out`));
        }
      }, suite.timeout + 30000); // 30 second buffer
    });
  }

  /**
   * Parse Jest output to extract test results
   */
  parseJestOutput(stdout, stderr, suiteName) {
    const result = {
      name: suiteName,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    
    try {
      // Extract test summary from Jest output
      const summaryMatch = stdout.match(/Tests:\s+(\d+)\s+failed,?\s*(\d+)\s+passed,?\s*(\d+)\s+total/);
      if (summaryMatch) {
        result.failed = parseInt(summaryMatch[1]) || 0;
        result.passed = parseInt(summaryMatch[2]) || 0;
        result.total = parseInt(summaryMatch[3]) || 0;
        result.skipped = result.total - result.passed - result.failed;
      }
      
      // Extract individual test results
      const testMatches = stdout.matchAll(/^\s*([✓✗])\s+(.+?)\s+\((\d+)\s*ms\)/gm);
      for (const match of testMatches) {
        const [, status, name, duration] = match;
        result.tests.push({
          name: name.trim(),
          status: status === '✓' ? 'PASSED' : 'FAILED',
          duration: parseInt(duration)
        });
      }
      
      // Extract coverage information
      const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        result.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }
      
    } catch (error) {
      console.warn(`⚠️  Failed to parse Jest output for ${suiteName}:`, error.message);
    }
    
    return result;
  }

  /**
   * Generate comprehensive test reports
   */
  async generateReports() {
    console.log('\n📋 Generating test reports...');
    
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate JSON report
    if (TEST_CONFIG.reporting.json) {
      const jsonReport = {
        timestamp: new Date().toISOString(),
        summary: this.results.summary,
        suites: this.results.suites,
        performance: this.results.performance,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage()
        }
      };
      
      fs.writeFileSync(
        path.join(reportsDir, 'phase2a-test-results.json'),
        JSON.stringify(jsonReport, null, 2)
      );
      console.log('   ✅ JSON report generated');
    }
    
    // Generate HTML report
    if (TEST_CONFIG.reporting.html) {
      const htmlReport = this.generateHtmlReport();
      fs.writeFileSync(
        path.join(reportsDir, 'phase2a-test-report.html'),
        htmlReport
      );
      console.log('   ✅ HTML report generated');
    }
    
    // Generate JUnit XML report
    if (TEST_CONFIG.reporting.junit) {
      const junitReport = this.generateJunitReport();
      fs.writeFileSync(
        path.join(reportsDir, 'phase2a-junit.xml'),
        junitReport
      );
      console.log('   ✅ JUnit XML report generated');
    }
    
    console.log(`📁 Reports saved to: ${reportsDir}`);
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport() {
    const { summary, suites } = this.results;
    const successRate = ((summary.passed / summary.total) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 2A Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.passed { border-color: #28a745; }
        .metric.failed { border-color: #dc3545; }
        .metric.duration { border-color: #007bff; }
        .suite { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .suite.passed { border-color: #28a745; background: #f8fff8; }
        .suite.failed { border-color: #dc3545; background: #fff8f8; }
        .progress-bar { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Phase 2A Integration Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Duration: ${(summary.duration / 1000).toFixed(2)} seconds</p>
    </div>
    
    <div class="summary">
        <div class="metric passed">
            <h3>${summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric failed">
            <h3>${summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${summary.total}</h3>
            <p>Total</p>
        </div>
        <div class="metric duration">
            <h3>${successRate}%</h3>
            <p>Success Rate</p>
        </div>
    </div>
    
    <div class="progress-bar">
        <div class="progress-fill" style="width: ${successRate}%"></div>
    </div>
    
    <h2>Test Suites</h2>
    ${suites.map(suite => `
        <div class="suite ${suite.status.toLowerCase()}">
            <h3>${suite.name} - ${suite.status}</h3>
            <p>Duration: ${(suite.duration / 1000).toFixed(2)}s</p>
            <p>Results: ${suite.passed}/${suite.total} passed</p>
            ${suite.failed > 0 ? `<p style="color: #dc3545;">❌ ${suite.failed} failed</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate JUnit XML report
   */
  generateJunitReport() {
    const { summary, suites } = this.results;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Phase2A" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${(summary.duration / 1000).toFixed(3)}">
`;
    
    for (const suite of suites) {
      for (const test of (suite.tests || [])) {
        xml += `  <testcase classname="${suite.name}" name="${test.name}" time="${(test.duration / 1000).toFixed(3)}">
`;
        if (test.status === 'FAILED') {
          xml += `    <failure message="Test failed"></failure>
`;
        }
        xml += `  </testcase>
`;
      }
    }
    
    xml += `</testsuite>`;
    return xml;
  }

  /**
   * Validate performance against thresholds
   */
  async validatePerformance() {
    console.log('\n⚡ Validating performance metrics...');
    
    const { summary, performance } = this.results;
    const thresholds = TEST_CONFIG.performanceThresholds;
    
    // Check execution time
    if (summary.duration > thresholds.maxExecutionTime) {
      console.warn(`⚠️  Execution time exceeded threshold: ${(summary.duration / 1000).toFixed(2)}s > ${(thresholds.maxExecutionTime / 1000).toFixed(2)}s`);
    } else {
      console.log(`✅ Execution time within threshold: ${(summary.duration / 1000).toFixed(2)}s`);
    }
    
    // Check memory usage
    const maxMemory = Math.max(...performance.memoryUsage.map(m => m.heapUsed));
    if (maxMemory > thresholds.maxMemoryUsage) {
      console.warn(`⚠️  Memory usage exceeded threshold: ${(maxMemory / 1024 / 1024).toFixed(2)}MB > ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    } else {
      console.log(`✅ Memory usage within threshold: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Check failure rate
    const failureRate = summary.failed / summary.total;
    if (failureRate > thresholds.maxFailureRate) {
      console.warn(`⚠️  Failure rate exceeded threshold: ${(failureRate * 100).toFixed(1)}% > ${(thresholds.maxFailureRate * 100).toFixed(1)}%`);
    } else {
      console.log(`✅ Failure rate within threshold: ${(failureRate * 100).toFixed(1)}%`);
    }
    
    // Check coverage (if available)
    const coverageSuite = this.results.suites.find(s => s.coverage);
    if (coverageSuite && coverageSuite.coverage) {
      const avgCoverage = (
        coverageSuite.coverage.statements +
        coverageSuite.coverage.branches +
        coverageSuite.coverage.functions +
        coverageSuite.coverage.lines
      ) / 4;
      
      if (avgCoverage < thresholds.minCoverage) {
        console.warn(`⚠️  Coverage below threshold: ${avgCoverage.toFixed(1)}% < ${thresholds.minCoverage}%`);
      } else {
        console.log(`✅ Coverage meets threshold: ${avgCoverage.toFixed(1)}%`);
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(1);
});

// Main execution
if (require.main === module) {
  const runner = new Phase2ATestRunner();
  
  runner.run()
    .then(() => {
      runner.cleanup();
      console.log('\n🎉 Phase 2A test execution completed successfully');
    })
    .catch((error) => {
      runner.cleanup();
      console.error('\n💥 Phase 2A test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = Phase2ATestRunner;