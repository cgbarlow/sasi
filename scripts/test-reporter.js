#!/usr/bin/env node

/**
 * Automated Test Result Reporter
 * Generates comprehensive reports and handles alerting for CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

class TestReporter {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'coverage',
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
      emailConfig: options.emailConfig,
      githubToken: process.env.GITHUB_TOKEN,
      thresholds: {
        coverage: parseInt(process.env.COVERAGE_THRESHOLD) || 90,
        performance: parseInt(process.env.PERFORMANCE_THRESHOLD_MS) || 100,
        ...options.thresholds
      }
    };
    
    this.reportData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ci: process.env.CI === 'true',
      commit: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      tests: {},
      coverage: {},
      performance: {},
      quality: {},
      alerts: []
    };
  }

  async generateReport() {
    console.log('📊 Generating comprehensive test report...');
    
    // Collect all test data
    await this.collectTestResults();
    await this.collectCoverageData();
    await this.collectPerformanceData();
    await this.collectQualityMetrics();
    
    // Analyze results and generate alerts
    this.analyzeResults();
    
    // Generate different report formats
    const reports = {
      json: this.generateJSONReport(),
      html: this.generateHTMLReport(),
      markdown: this.generateMarkdownReport(),
      junit: this.generateJUnitReport()
    };
    
    // Save reports
    await this.saveReports(reports);
    
    // Send notifications if configured
    await this.sendNotifications();
    
    return this.reportData;
  }

  async collectTestResults() {
    const testFiles = [
      'coverage/junit.xml',
      'coverage/ci-test-report.json',
      'test-results.json'
    ];

    for (const file of testFiles) {
      const filePath = path.join(this.options.outputDir, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          if (file.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.reportData.tests = { ...this.reportData.tests, ...data };
          }
        } catch (error) {
          console.warn(`Could not parse test file ${file}:`, error.message);
        }
      }
    }
  }

  async collectCoverageData() {
    const coverageFile = path.join(this.options.outputDir, 'coverage-final.json');
    
    if (fs.existsSync(coverageFile)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        this.reportData.coverage = this.analyzeCoverage(coverage);
      } catch (error) {
        console.warn('Could not parse coverage data:', error.message);
      }
    }
  }

  async collectPerformanceData() {
    const performanceFiles = [
      'coverage/performance-regression-report.md',
      'coverage/performance-baselines.json',
      'current-performance.json'
    ];

    for (const file of performanceFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          if (file.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.reportData.performance = { ...this.reportData.performance, ...data };
          }
        } catch (error) {
          console.warn(`Could not parse performance file ${file}:`, error.message);
        }
      }
    }
  }

  async collectQualityMetrics() {
    const qualityFiles = [
      'eslint-results.json',
      'security-audit.json'
    ];

    for (const file of qualityFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.reportData.quality[file.replace('.json', '')] = data;
        } catch (error) {
          console.warn(`Could not parse quality file ${file}:`, error.message);
        }
      }
    }
  }

  analyzeCoverage(coverage) {
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
      total: {
        lines: Math.round(totals.lines / Math.max(counts.lines, 1)),
        functions: Math.round(totals.functions / Math.max(counts.functions, 1)),
        branches: Math.round(totals.branches / Math.max(counts.branches, 1)),
        statements: Math.round(totals.statements / Math.max(counts.statements, 1))
      },
      files: Object.keys(coverage).length,
      threshold: this.options.thresholds.coverage
    };
  }

  analyzeResults() {
    const alerts = [];
    
    // Coverage alerts
    if (this.reportData.coverage.total) {
      const coverage = this.reportData.coverage.total;
      Object.entries(coverage).forEach(([type, value]) => {
        if (value < this.options.thresholds.coverage) {
          alerts.push({
            type: 'coverage',
            severity: 'error',
            message: `${type} coverage below threshold: ${value}% < ${this.options.thresholds.coverage}%`,
            value,
            threshold: this.options.thresholds.coverage
          });
        }
      });
    }
    
    // Performance alerts
    if (this.reportData.performance.tests) {
      const slowTests = this.reportData.performance.tests.filter(
        test => test.duration > this.options.thresholds.performance
      );
      
      if (slowTests.length > 0) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `${slowTests.length} tests exceeded performance threshold`,
          tests: slowTests.map(t => ({ name: t.suite, duration: t.duration }))
        });
      }
    }
    
    // Quality alerts
    if (this.reportData.quality['eslint-results']) {
      const eslintResults = this.reportData.quality['eslint-results'];
      const errorCount = eslintResults.reduce((sum, file) => sum + file.errorCount, 0);
      const warningCount = eslintResults.reduce((sum, file) => sum + file.warningCount, 0);
      
      if (errorCount > 0) {
        alerts.push({
          type: 'quality',
          severity: 'error',
          message: `${errorCount} ESLint errors found`,
          count: errorCount
        });
      }
      
      if (warningCount > 10) {
        alerts.push({
          type: 'quality',
          severity: 'warning',
          message: `${warningCount} ESLint warnings found`,
          count: warningCount
        });
      }
    }
    
    this.reportData.alerts = alerts;
  }

  generateJSONReport() {
    return JSON.stringify(this.reportData, null, 2);
  }

  generateHTMLReport() {
    const { coverage, performance, alerts, timestamp } = this.reportData;
    const alertsHtml = alerts.map(alert => 
      `<div class="alert alert-${alert.severity}">
        <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
      </div>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${new Date(timestamp).toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 0.9em; color: #6c757d; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .coverage-bar { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 80%); }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Test Report</h1>
        <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Environment:</strong> ${this.reportData.environment}</p>
        <p><strong>Branch:</strong> ${this.reportData.branch}</p>
        <p><strong>Commit:</strong> ${this.reportData.commit.substring(0, 8)}</p>
    </div>

    ${alerts.length > 0 ? `<h2>🚨 Alerts</h2>${alertsHtml}` : '<div class="alert alert-success">✅ No issues detected</div>'}

    ${coverage.total ? `
    <h2>📈 Coverage Metrics</h2>
    <div class="metric">
        <div class="metric-value">${coverage.total.lines}%</div>
        <div class="metric-label">Lines</div>
        <div class="coverage-bar">
            <div class="coverage-fill" style="width: ${coverage.total.lines}%"></div>
        </div>
    </div>
    <div class="metric">
        <div class="metric-value">${coverage.total.functions}%</div>
        <div class="metric-label">Functions</div>
        <div class="coverage-bar">
            <div class="coverage-fill" style="width: ${coverage.total.functions}%"></div>
        </div>
    </div>
    <div class="metric">
        <div class="metric-value">${coverage.total.branches}%</div>
        <div class="metric-label">Branches</div>
        <div class="coverage-bar">
            <div class="coverage-fill" style="width: ${coverage.total.branches}%"></div>
        </div>
    </div>
    ` : ''}

    <h2>📝 Summary</h2>
    <ul>
        <li>Coverage threshold: ${this.options.thresholds.coverage}%</li>
        <li>Performance threshold: ${this.options.thresholds.performance}ms</li>
        <li>Total alerts: ${alerts.length}</li>
        <li>Files analyzed: ${coverage.files || 0}</li>
    </ul>
</body>
</html>`;
  }

  generateMarkdownReport() {
    const { coverage, alerts, timestamp, environment, branch, commit } = this.reportData;
    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.type] = acc[alert.type] || [];
      acc[alert.type].push(alert);
      return acc;
    }, {});

    return `# 📊 Test Report

**Generated:** ${new Date(timestamp).toLocaleString()}  
**Environment:** ${environment}  
**Branch:** ${branch}  
**Commit:** ${commit.substring(0, 8)}

## 🎯 Summary

${alerts.length === 0 ? '✅ **All checks passed!**' : `⚠️ **${alerts.length} issues detected**`}

${coverage.total ? `
## 📈 Coverage Metrics

| Metric | Percentage | Status |
|--------|------------|---------|
| Lines | ${coverage.total.lines}% | ${coverage.total.lines >= this.options.thresholds.coverage ? '✅' : '❌'} |
| Functions | ${coverage.total.functions}% | ${coverage.total.functions >= this.options.thresholds.coverage ? '✅' : '❌'} |
| Branches | ${coverage.total.branches}% | ${coverage.total.branches >= this.options.thresholds.coverage ? '✅' : '❌'} |
| Statements | ${coverage.total.statements}% | ${coverage.total.statements >= this.options.thresholds.coverage ? '✅' : '❌'} |

**Threshold:** ${this.options.thresholds.coverage}%
` : ''}

${alerts.length > 0 ? `
## 🚨 Issues

${Object.entries(alertsByType).map(([type, typeAlerts]) => `
### ${type.toUpperCase()}
${typeAlerts.map(alert => `- ${alert.severity === 'error' ? '❌' : '⚠️'} ${alert.message}`).join('\n')}
`).join('')}
` : ''}

## 📋 Thresholds

- **Coverage:** ${this.options.thresholds.coverage}%
- **Performance:** ${this.options.thresholds.performance}ms

---
*Report generated by SASI Test Automation Pipeline*
`;
  }

  generateJUnitReport() {
    // Generate JUnit XML format for CI systems
    const testCount = this.reportData.tests.summary?.totalTests || 0;
    const failures = this.reportData.alerts.filter(a => a.severity === 'error').length;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="SASI Test Suite" tests="${testCount}" failures="${failures}" time="0">
  <testsuite name="Coverage Tests" tests="4" failures="${this.reportData.coverage.total ? 0 : 1}">
    <testcase name="Lines Coverage" classname="coverage">
      ${this.reportData.coverage.total?.lines < this.options.thresholds.coverage ? 
        `<failure message="Coverage below threshold: ${this.reportData.coverage.total.lines}%"></failure>` : ''}
    </testcase>
    <testcase name="Functions Coverage" classname="coverage">
      ${this.reportData.coverage.total?.functions < this.options.thresholds.coverage ? 
        `<failure message="Coverage below threshold: ${this.reportData.coverage.total.functions}%"></failure>` : ''}
    </testcase>
    <testcase name="Branches Coverage" classname="coverage">
      ${this.reportData.coverage.total?.branches < this.options.thresholds.coverage ? 
        `<failure message="Coverage below threshold: ${this.reportData.coverage.total.branches}%"></failure>` : ''}
    </testcase>
    <testcase name="Statements Coverage" classname="coverage">
      ${this.reportData.coverage.total?.statements < this.options.thresholds.coverage ? 
        `<failure message="Coverage below threshold: ${this.reportData.coverage.total.statements}%"></failure>` : ''}
    </testcase>
  </testsuite>
</testsuites>`;
  }

  async saveReports(reports) {
    const outputDir = path.resolve(this.options.outputDir);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = {
      'test-report.json': reports.json,
      'test-report.html': reports.html,
      'test-report.md': reports.markdown,
      'test-results.xml': reports.junit
    };

    for (const [filename, content] of Object.entries(files)) {
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, content);
      console.log(`📄 Report saved: ${filepath}`);
    }
  }

  async sendNotifications() {
    if (this.reportData.alerts.length === 0) {
      console.log('✅ No alerts to send');
      return;
    }

    const criticalAlerts = this.reportData.alerts.filter(a => a.severity === 'error');
    
    if (this.options.slackWebhook && criticalAlerts.length > 0) {
      await this.sendSlackNotification(criticalAlerts);
    }

    // Add other notification methods here (email, Teams, etc.)
  }

  async sendSlackNotification(alerts) {
    try {
      const message = {
        text: `🚨 Test Pipeline Alert - ${alerts.length} critical issues detected`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 SASI Test Pipeline Alert'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Branch:* ${this.reportData.branch}`
              },
              {
                type: 'mrkdwn',
                text: `*Environment:* ${this.reportData.environment}`
              },
              {
                type: 'mrkdwn',
                text: `*Commit:* ${this.reportData.commit.substring(0, 8)}`
              },
              {
                type: 'mrkdwn',
                text: `*Issues:* ${alerts.length}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: alerts.map(alert => `• *${alert.type.toUpperCase()}:* ${alert.message}`).join('\n')
            }
          }
        ]
      };

      // Send to Slack (requires fetch or axios)
      console.log('📱 Slack notification prepared:', JSON.stringify(message, null, 2));
      
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const reporter = new TestReporter();
  
  reporter.generateReport()
    .then((report) => {
      console.log('✅ Test report generated successfully');
      
      if (report.alerts.length > 0) {
        console.log(`⚠️ Found ${report.alerts.length} issues`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Failed to generate test report:', error.message);
      process.exit(1);
    });
}

module.exports = TestReporter;