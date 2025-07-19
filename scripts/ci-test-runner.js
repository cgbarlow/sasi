#!/usr/bin/env node

/**
 * Comprehensive CI/CD Test Runner
 * Executes all test suites with proper reporting and CI integration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CITestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      tests: [],
      coverage: {},
      performance: {},
      errors: []
    };
    
    this.isCI = process.env.CI === 'true';
    this.coverageThreshold = parseInt(process.env.COVERAGE_THRESHOLD) || 90;
    this.performanceThreshold = parseInt(process.env.PERFORMANCE_THRESHOLD_MS) || 100;
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Running: ${command}`);
      
      const child = spawn('sh', ['-c', command], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data;
        if (!this.isCI) process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        stderr += data;
        if (!this.isCI) process.stderr.write(data);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async runTestSuite(suiteName, command, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${suiteName} tests...`);
      
      const result = await this.runCommand(command, options);
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        suite: suiteName,
        status: 'passed',
        duration,
        output: result.stdout
      });
      
      console.log(`✅ ${suiteName} tests passed (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        suite: suiteName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      this.results.errors.push({
        suite: suiteName,
        error: error.message,
        timestamp: new Date()
      });
      
      console.error(`❌ ${suiteName} tests failed: ${error.message}`);
      
      if (options.failFast) {
        throw error;
      }
    }
  }

  async validateCoverage() {
    console.log('\n📊 Validating coverage thresholds...');
    
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
      
      if (!fs.existsSync(coveragePath)) {
        throw new Error('Coverage report not found');
      }
      
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const totals = this.calculateCoverageTotals(coverage);
      
      this.results.coverage = totals;
      
      const meetsThreshold = Object.values(totals).every(value => value >= this.coverageThreshold);
      
      if (meetsThreshold) {
        console.log(`✅ Coverage meets threshold (${this.coverageThreshold}%)`);
        console.log(`   Lines: ${totals.lines}%, Functions: ${totals.functions}%, Branches: ${totals.branches}%`);
      } else {
        throw new Error(`Coverage below threshold: ${JSON.stringify(totals)}`);
      }
      
    } catch (error) {
      console.error(`❌ Coverage validation failed: ${error.message}`);
      this.results.errors.push({
        suite: 'coverage',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  calculateCoverageTotals(coverage) {
    const totals = { lines: 0, functions: 0, branches: 0, statements: 0 };
    const counts = { lines: 0, functions: 0, branches: 0, statements: 0 };
    
    Object.values(coverage).forEach(file => {
      if (file.lines) {
        totals.lines += file.lines.pct || 0;
        counts.lines++;
      }
      if (file.functions) {
        totals.functions += file.functions.pct || 0;
        counts.functions++;
      }
      if (file.branches) {
        totals.branches += file.branches.pct || 0;
        counts.branches++;
      }
      if (file.statements) {
        totals.statements += file.statements.pct || 0;
        counts.statements++;
      }
    });
    
    return {
      lines: Math.round(totals.lines / Math.max(counts.lines, 1)),
      functions: Math.round(totals.functions / Math.max(counts.functions, 1)),
      branches: Math.round(totals.branches / Math.max(counts.branches, 1)),
      statements: Math.round(totals.statements / Math.max(counts.statements, 1))
    };
  }

  async validatePerformance() {
    console.log('\n⚡ Analyzing performance metrics...');
    
    try {
      // Extract performance data from test results
      const performanceTests = this.results.tests
        .filter(test => test.suite.includes('performance'))
        .map(test => ({
          suite: test.suite,
          duration: test.duration
        }));
      
      const exceedsThreshold = performanceTests.filter(
        test => test.duration > this.performanceThreshold
      );
      
      if (exceedsThreshold.length > 0) {
        const failures = exceedsThreshold.map(test => 
          `${test.suite}: ${test.duration}ms (threshold: ${this.performanceThreshold}ms)`
        ).join(', ');
        
        throw new Error(`Performance threshold exceeded: ${failures}`);
      }
      
      this.results.performance = {
        threshold: this.performanceThreshold,
        tests: performanceTests,
        passed: true
      };
      
      console.log(`✅ All performance tests within ${this.performanceThreshold}ms threshold`);
      
    } catch (error) {
      console.error(`❌ Performance validation failed: ${error.message}`);
      this.results.errors.push({
        suite: 'performance',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async generateReports() {
    console.log('\n📝 Generating test reports...');
    
    const reportDir = path.join(process.cwd(), 'coverage');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Generate JSON report
    const jsonReport = {
      ...this.results,
      endTime: new Date(),
      totalDuration: Date.now() - this.results.startTime.getTime(),
      summary: {
        totalTests: this.results.tests.length,
        passed: this.results.tests.filter(t => t.status === 'passed').length,
        failed: this.results.tests.filter(t => t.status === 'failed').length,
        errors: this.results.errors.length
      }
    };
    
    fs.writeFileSync(
      path.join(reportDir, 'ci-test-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(jsonReport);
    fs.writeFileSync(
      path.join(reportDir, 'ci-test-summary.md'),
      markdownReport
    );
    
    console.log('✅ Reports generated in coverage/ directory');
  }

  generateMarkdownReport(report) {
    const { summary, coverage, performance, errors } = report;
    const successRate = Math.round((summary.passed / summary.totalTests) * 100);
    
    return `# CI/CD Test Report

## Summary
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passed} ✅
- **Failed**: ${summary.failed} ❌
- **Success Rate**: ${successRate}%
- **Total Duration**: ${Math.round(report.totalDuration / 1000)}s

## Coverage Metrics
${coverage ? `
- **Lines**: ${coverage.lines}%
- **Functions**: ${coverage.functions}%
- **Branches**: ${coverage.branches}%
- **Statements**: ${coverage.statements}%
` : 'Coverage data not available'}

## Performance
${performance.tests ? `
- **Threshold**: ${performance.threshold}ms
- **Tests Analyzed**: ${performance.tests.length}
- **Status**: ${performance.passed ? '✅ PASSED' : '❌ FAILED'}
` : 'Performance data not available'}

## Test Suites
${report.tests.map(test => 
  `- **${test.suite}**: ${test.status === 'passed' ? '✅' : '❌'} (${test.duration}ms)`
).join('\n')}

${errors.length > 0 ? `
## Errors
${errors.map(error => 
  `- **${error.suite}**: ${error.error}`
).join('\n')}
` : ''}

Generated: ${new Date().toISOString()}
`;
  }

  async run() {
    console.log('🚀 Starting CI/CD Test Pipeline...');
    console.log(`Environment: ${this.isCI ? 'CI' : 'Local'}`);
    console.log(`Coverage Threshold: ${this.coverageThreshold}%`);
    console.log(`Performance Threshold: ${this.performanceThreshold}ms`);
    
    try {
      // Install dependencies if needed
      if (!fs.existsSync('node_modules')) {
        await this.runCommand('npm ci');
      }
      
      // Run linting
      await this.runTestSuite('Lint', 'npm run lint');
      
      // Run type checking
      await this.runTestSuite('TypeCheck', 'npm run typecheck');
      
      // Run unit tests with coverage
      await this.runTestSuite(
        'Unit', 
        'npm run test:unit -- --coverage --passWithNoTests=false',
        { failFast: false }
      );
      
      // Run integration tests
      await this.runTestSuite(
        'Integration',
        'npm run test:integration -- --coverage',
        { failFast: false }
      );
      
      // Run performance tests
      await this.runTestSuite(
        'Performance',
        'npm run test:performance -- --verbose',
        { failFast: false }
      );
      
      // Run persistence tests
      await this.runTestSuite(
        'Persistence',
        'npm run test:persistence -- --coverage',
        { failFast: false }
      );
      
      // Validate coverage and performance
      await this.validateCoverage();
      await this.validatePerformance();
      
      // Generate reports
      await this.generateReports();
      
      const hasFailures = this.results.errors.length > 0;
      
      if (hasFailures) {
        console.log('\n❌ CI/CD Pipeline completed with errors');
        console.log(`Failures: ${this.results.errors.length}`);
        process.exit(1);
      } else {
        console.log('\n✅ CI/CD Pipeline completed successfully!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('\n💥 CI/CD Pipeline failed:', error.message);
      await this.generateReports();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new CITestRunner();
  runner.run().catch(console.error);
}

module.exports = CITestRunner;