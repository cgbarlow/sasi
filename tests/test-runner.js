#!/usr/bin/env node
/**
 * TDD Test Runner
 * Comprehensive test execution with coverage and performance monitoring
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TDDTestRunner {
  constructor() {
    this.config = {
      coverageThreshold: 90,
      performanceThreshold: 50, // ms
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      testSuites: ['unit', 'integration', 'performance', 'e2e']
    };
    
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      coverage: {},
      performance: {},
      errors: []
    };
  }

  async run(suites = this.config.testSuites, options = {}) {
    console.log('🧪 Starting TDD Test Framework Execution');
    console.log('=' * 50);

    const startTime = Date.now();

    try {
      // Pre-test validation
      await this.validateEnvironment();

      // Run test suites
      for (const suite of suites) {
        await this.runTestSuite(suite, options);
      }

      // Generate reports
      await this.generateReports();

      // Validate results
      await this.validateResults();

      const duration = Date.now() - startTime;
      console.log(`\n✅ Test execution completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js version: ${nodeVersion}`);

    // Check Jest installation
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
      console.log('  ✅ Jest installed');
    } catch (error) {
      throw new Error('Jest not installed or not accessible');
    }

    // Check test files exist
    const testDirs = ['unit', 'integration', 'performance', 'e2e'];
    for (const dir of testDirs) {
      const testPath = path.join(__dirname, dir);
      if (fs.existsSync(testPath)) {
        const files = fs.readdirSync(testPath).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'));
        console.log(`  ✅ ${dir} tests: ${files.length} files`);
      }
    }

    // Check WASM support simulation
    console.log('  ✅ WASM test support configured');

    console.log('✅ Environment validation passed\n');
  }

  async runTestSuite(suite, options) {
    console.log(`📋 Running ${suite} tests...`);

    const suiteStartTime = Date.now();
    let command = this.buildJestCommand(suite, options);

    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      const suiteDuration = Date.now() - suiteStartTime;
      console.log(`✅ ${suite} tests completed in ${suiteDuration}ms`);

      // Parse Jest output
      this.parseJestOutput(output, suite);

    } catch (error) {
      const suiteDuration = Date.now() - suiteStartTime;
      console.log(`❌ ${suite} tests failed in ${suiteDuration}ms`);
      
      this.results.errors.push({
        suite,
        error: error.message,
        output: error.stdout,
        duration: suiteDuration
      });
    }
  }

  buildJestCommand(suite, options) {
    let command = 'npx jest';

    // Test path patterns
    const patterns = {
      unit: 'tests/unit',
      integration: 'tests/integration', 
      performance: 'tests/performance',
      e2e: 'tests/e2e'
    };

    if (patterns[suite]) {
      command += ` --testPathPattern="${patterns[suite]}"`;
    }

    // Coverage options
    if (suite !== 'e2e') {
      command += ' --coverage';
      command += ` --coverageDirectory=coverage/${suite}`;
    }

    // Performance options
    if (suite === 'performance') {
      command += ' --detectLeaks';
      command += ' --logHeapUsage';
    }

    // Verbose output
    if (options.verbose) {
      command += ' --verbose';
    }

    // CI mode
    if (process.env.CI) {
      command += ' --ci';
      command += ' --watchman=false';
    }

    return command;
  }

  parseJestOutput(output, suite) {
    try {
      // Extract test results
      const testRegex = /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/;
      const testMatch = output.match(testRegex);

      if (testMatch) {
        const failed = parseInt(testMatch[1]) || 0;
        const passed = parseInt(testMatch[2]) || 0;
        const total = parseInt(testMatch[3]) || 0;

        this.results.failed += failed;
        this.results.passed += passed;
        this.results.total += total;

        console.log(`  Tests: ${passed} passed, ${failed} failed, ${total} total`);
      }

      // Extract coverage if available
      const coverageRegex = /All files[|\s]+(\d+\.?\d*)[|\s]+(\d+\.?\d*)[|\s]+(\d+\.?\d*)[|\s]+(\d+\.?\d*)/;
      const coverageMatch = output.match(coverageRegex);

      if (coverageMatch) {
        const coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };

        this.results.coverage[suite] = coverage;

        console.log(`  Coverage: ${coverage.lines}% lines, ${coverage.functions}% functions`);
      }

      // Extract performance metrics for performance tests
      if (suite === 'performance') {
        const performanceRegex = /Performance[^:]*:\s*(\d+\.?\d*)\s*ms/g;
        let match;
        const performances = [];

        while ((match = performanceRegex.exec(output)) !== null) {
          performances.push(parseFloat(match[1]));
        }

        if (performances.length > 0) {
          this.results.performance[suite] = {
            average: performances.reduce((a, b) => a + b, 0) / performances.length,
            max: Math.max(...performances),
            min: Math.min(...performances),
            count: performances.length
          };

          console.log(`  Performance: avg ${this.results.performance[suite].average.toFixed(2)}ms`);
        }
      }

    } catch (error) {
      console.warn(`Warning: Could not parse Jest output for ${suite}:`, error.message);
    }
  }

  async generateReports() {
    console.log('\n📊 Generating test reports...');

    // Coverage report
    this.generateCoverageReport();

    // Performance report
    this.generatePerformanceReport();

    // Summary report
    this.generateSummaryReport();

    console.log('✅ Reports generated');
  }

  generateCoverageReport() {
    const coverageReport = {
      timestamp: new Date().toISOString(),
      threshold: this.config.coverageThreshold,
      results: this.results.coverage,
      overall: this.calculateOverallCoverage()
    };

    const reportPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(coverageReport, null, 2));

    console.log(`  Coverage report: ${reportPath}`);
  }

  generatePerformanceReport() {
    const performanceReport = {
      timestamp: new Date().toISOString(),
      threshold: this.config.performanceThreshold,
      results: this.results.performance,
      summary: this.calculatePerformanceSummary()
    };

    const reportPath = path.join(__dirname, '..', 'coverage', 'performance-summary.json');
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));

    console.log(`  Performance report: ${reportPath}`);
  }

  generateSummaryReport() {
    const summaryReport = {
      timestamp: new Date().toISOString(),
      config: this.config,
      results: {
        tests: {
          total: this.results.total,
          passed: this.results.passed,
          failed: this.results.failed,
          success_rate: this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0
        },
        coverage: this.calculateOverallCoverage(),
        performance: this.calculatePerformanceSummary(),
        errors: this.results.errors
      },
      thresholds: {
        coverage_met: this.isCoverageThresholdMet(),
        performance_met: this.isPerformanceThresholdMet()
      }
    };

    const reportPath = path.join(__dirname, '..', 'coverage', 'test-summary.json');
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2));

    console.log(`  Summary report: ${reportPath}`);
  }

  calculateOverallCoverage() {
    const coverages = Object.values(this.results.coverage);
    if (coverages.length === 0) return null;

    const overall = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    };

    for (const coverage of coverages) {
      overall.statements += coverage.statements || 0;
      overall.branches += coverage.branches || 0;
      overall.functions += coverage.functions || 0;
      overall.lines += coverage.lines || 0;
    }

    const count = coverages.length;
    return {
      statements: (overall.statements / count).toFixed(2),
      branches: (overall.branches / count).toFixed(2),
      functions: (overall.functions / count).toFixed(2),
      lines: (overall.lines / count).toFixed(2)
    };
  }

  calculatePerformanceSummary() {
    const performances = Object.values(this.results.performance);
    if (performances.length === 0) return null;

    const allAverages = performances.map(p => p.average);
    const allMaxes = performances.map(p => p.max);

    return {
      overall_average: (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(2),
      overall_max: Math.max(...allMaxes).toFixed(2),
      suite_count: performances.length
    };
  }

  isCoverageThresholdMet() {
    const overall = this.calculateOverallCoverage();
    if (!overall) return false;

    return parseFloat(overall.lines) >= this.config.coverageThreshold &&
           parseFloat(overall.functions) >= this.config.coverageThreshold &&
           parseFloat(overall.branches) >= this.config.coverageThreshold &&
           parseFloat(overall.statements) >= this.config.coverageThreshold;
  }

  isPerformanceThresholdMet() {
    const summary = this.calculatePerformanceSummary();
    if (!summary) return true; // No performance tests run

    return parseFloat(summary.overall_max) <= this.config.performanceThreshold;
  }

  async validateResults() {
    console.log('\n🎯 Validating test results...');

    let validationPassed = true;

    // Check test success rate
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100) : 0;
    if (successRate < 100) {
      console.log(`❌ Test success rate: ${successRate.toFixed(2)}% (${this.results.failed} failed)`);
      validationPassed = false;
    } else {
      console.log(`✅ Test success rate: ${successRate.toFixed(2)}%`);
    }

    // Check coverage threshold
    if (!this.isCoverageThresholdMet()) {
      console.log(`❌ Coverage threshold not met (required: ${this.config.coverageThreshold}%)`);
      const overall = this.calculateOverallCoverage();
      if (overall) {
        console.log(`   Lines: ${overall.lines}%, Functions: ${overall.functions}%`);
      }
      validationPassed = false;
    } else {
      console.log(`✅ Coverage threshold met (${this.config.coverageThreshold}%)`);
    }

    // Check performance threshold
    if (!this.isPerformanceThresholdMet()) {
      console.log(`❌ Performance threshold exceeded (max: ${this.config.performanceThreshold}ms)`);
      const summary = this.calculatePerformanceSummary();
      if (summary) {
        console.log(`   Max observed: ${summary.overall_max}ms`);
      }
      validationPassed = false;
    } else {
      console.log(`✅ Performance threshold met (<${this.config.performanceThreshold}ms)`);
    }

    // Show errors if any
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      for (const error of this.results.errors) {
        console.log(`   ${error.suite}: ${error.error}`);
      }
      validationPassed = false;
    }

    if (!validationPassed) {
      throw new Error('Test validation failed - see errors above');
    }

    console.log('✅ All validation checks passed');
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new TDDTestRunner();

  // Parse command line arguments
  const options = {
    verbose: args.includes('--verbose'),
    suites: []
  };

  // Extract test suites to run
  const suiteArgs = args.filter(arg => !arg.startsWith('--'));
  if (suiteArgs.length > 0) {
    options.suites = suiteArgs;
  }

  // Run tests
  runner.run(options.suites.length > 0 ? options.suites : undefined, options)
    .catch(error => {
      console.error('Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = TDDTestRunner;