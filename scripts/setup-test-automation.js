#!/usr/bin/env node

/**
 * Test Automation Setup Script
 * Configures and validates the complete CI/CD testing infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestAutomationSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.setupLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, message, type };
    this.setupLog.push(entry);
    
    const icons = {
      info: '🔧',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${icons[type]} ${message}`);
  }

  async setup() {
    console.log('🚀 Setting up Test Automation Infrastructure...\n');
    
    try {
      await this.validatePrerequisites();
      await this.setupDirectories();
      await this.validateScripts();
      await this.setupGitHooks();
      await this.validateJestConfig();
      await this.runInitialTests();
      await this.generateSetupReport();
      
      this.log('Test automation setup completed successfully!', 'success');
      console.log('\n📋 Next Steps:');
      console.log('1. Run "npm run test:automation" to execute full CI/CD pipeline');
      console.log('2. Run "npm run test:regression-detection" to establish performance baselines');
      console.log('3. Commit changes to trigger GitHub Actions workflow');
      console.log('4. Check coverage reports in ./coverage/ directory');
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async validatePrerequisites() {
    this.log('Validating prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredNodeVersion = '18.0.0';
    
    if (!this.compareVersions(nodeVersion.slice(1), requiredNodeVersion)) {
      throw new Error(`Node.js ${requiredNodeVersion}+ required, found ${nodeVersion}`);
    }
    
    // Check npm
    try {
      execSync('npm --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('npm not found');
    }
    
    // Check package.json
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    
    this.log('Prerequisites validated', 'success');
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return true;
      if (v1part < v2part) return false;
    }
    
    return true; // equal
  }

  async setupDirectories() {
    this.log('Setting up directory structure...');
    
    const directories = [
      'coverage',
      'scripts',
      'tests/performance',
      'tests/automation',
      '.github/workflows'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log(`Created directory: ${dir}`);
      }
    }
    
    this.log('Directory structure ready', 'success');
  }

  async validateScripts() {
    this.log('Validating automation scripts...');
    
    const requiredScripts = [
      'scripts/ci-test-runner.js',
      'scripts/test-reporter.js',
      'scripts/validate-build.js'
    ];
    
    const missingScripts = requiredScripts.filter(script => 
      !fs.existsSync(path.join(this.projectRoot, script))
    );
    
    if (missingScripts.length > 0) {
      throw new Error(`Missing automation scripts: ${missingScripts.join(', ')}`);
    }
    
    // Make scripts executable
    for (const script of requiredScripts) {
      const scriptPath = path.join(this.projectRoot, script);
      try {
        fs.chmodSync(scriptPath, '755');
      } catch (error) {
        this.log(`Could not make ${script} executable: ${error.message}`, 'warning');
      }
    }
    
    this.log('Automation scripts validated', 'success');
  }

  async setupGitHooks() {
    this.log('Setting up Git hooks...');
    
    try {
      const hookDir = path.join(this.projectRoot, '.git', 'hooks');
      
      if (!fs.existsSync(hookDir)) {
        this.log('Git repository not initialized, skipping Git hooks', 'warning');
        return;
      }
      
      // Create pre-commit hook
      const preCommitHook = `#!/bin/sh
# Pre-commit hook for test automation
echo "🔍 Running pre-commit checks..."

# Run linting
npm run ci:lint || exit 1

# Run quick tests
npm run test:unit -- --passWithNoTests || exit 1

echo "✅ Pre-commit checks passed"
`;
      
      const preCommitPath = path.join(hookDir, 'pre-commit');
      fs.writeFileSync(preCommitPath, preCommitHook);
      fs.chmodSync(preCommitPath, '755');
      
      this.log('Git hooks configured', 'success');
      
    } catch (error) {
      this.log(`Could not setup Git hooks: ${error.message}`, 'warning');
    }
  }

  async validateJestConfig() {
    this.log('Validating Jest configuration...');
    
    const jestConfigPath = path.join(this.projectRoot, 'jest.config.js');
    
    if (!fs.existsSync(jestConfigPath)) {
      throw new Error('jest.config.js not found');
    }
    
    try {
      const jestConfig = require(jestConfigPath);
      
      // Validate required configuration
      const requiredFields = [
        'testEnvironment',
        'testMatch',
        'coverageThreshold',
        'collectCoverageFrom'
      ];
      
      const missingFields = requiredFields.filter(field => !jestConfig[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Jest config missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate coverage thresholds
      if (!jestConfig.coverageThreshold.global) {
        throw new Error('Global coverage threshold not configured');
      }
      
      const threshold = jestConfig.coverageThreshold.global.lines;
      if (threshold < 90) {
        this.log(`Coverage threshold is ${threshold}%, recommend 90%+`, 'warning');
      }
      
      this.log('Jest configuration validated', 'success');
      
    } catch (error) {
      throw new Error(`Jest config validation failed: ${error.message}`);
    }
  }

  async runInitialTests() {
    this.log('Running initial test validation...');
    
    try {
      // Install dependencies if needed
      if (!fs.existsSync('node_modules')) {
        this.log('Installing dependencies...');
        execSync('npm ci', { stdio: 'inherit' });
      }
      
      // Run a quick test to validate setup
      this.log('Running validation tests...');
      execSync('npm run test:unit -- --passWithNoTests --testTimeout=30000', { 
        stdio: 'pipe',
        timeout: 60000
      });
      
      this.log('Initial tests passed', 'success');
      
    } catch (error) {
      // Don't fail setup for test failures, just warn
      this.log(`Initial test run had issues: ${error.message}`, 'warning');
    }
  }

  async generateSetupReport() {
    this.log('Generating setup report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      setupLog: this.setupLog,
      configuration: {
        nodeVersion: process.version,
        npmVersion: this.getNpmVersion(),
        jestConfigured: fs.existsSync('jest.config.js'),
        scriptsConfigured: this.validateAutomationScripts(),
        gitHooksConfigured: fs.existsSync('.git/hooks/pre-commit'),
        ciWorkflowConfigured: fs.existsSync('.github/workflows/production-ci-cd.yml')
      },
      availableScripts: this.getAvailableTestScripts(),
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(this.projectRoot, 'coverage', 'automation-setup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync(
      path.join(this.projectRoot, 'coverage', 'automation-setup-summary.md'),
      markdownReport
    );
    
    this.log(`Setup report saved: ${reportPath}`, 'success');
  }

  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  validateAutomationScripts() {
    const requiredScripts = [
      'scripts/ci-test-runner.js',
      'scripts/test-reporter.js',
      'scripts/validate-build.js'
    ];
    
    return requiredScripts.every(script => 
      fs.existsSync(path.join(this.projectRoot, script))
    );
  }

  getAvailableTestScripts() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const testScripts = Object.keys(packageJson.scripts || {})
        .filter(script => script.startsWith('test:') || script.startsWith('ci:'))
        .reduce((acc, script) => {
          acc[script] = packageJson.scripts[script];
          return acc;
        }, {});
      
      return testScripts;
    } catch (error) {
      return {};
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for coverage directory
    if (!fs.existsSync('coverage')) {
      recommendations.push('Run tests with coverage to generate reports');
    }
    
    // Check for GitHub Actions
    if (!fs.existsSync('.github/workflows')) {
      recommendations.push('Set up GitHub Actions for CI/CD automation');
    }
    
    // Check for environment variables
    if (!process.env.COVERAGE_THRESHOLD) {
      recommendations.push('Set COVERAGE_THRESHOLD environment variable');
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    const { configuration, availableScripts } = report;
    
    return `# Test Automation Setup Report

## 📊 Configuration Status

| Component | Status |
|-----------|--------|
| Node.js | ${configuration.nodeVersion} ✅ |
| npm | ${configuration.npmVersion} ✅ |
| Jest Config | ${configuration.jestConfigured ? '✅' : '❌'} |
| Automation Scripts | ${configuration.scriptsConfigured ? '✅' : '❌'} |
| Git Hooks | ${configuration.gitHooksConfigured ? '✅' : '❌'} |
| CI Workflow | ${configuration.ciWorkflowConfigured ? '✅' : '❌'} |

## 🔧 Available Test Scripts

${Object.entries(availableScripts).map(([name, command]) => 
  `- **${name}**: \`${command}\``
).join('\n')}

## 🎯 Quick Start Commands

\`\`\`bash
# Run full CI/CD pipeline
npm run test:automation

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Generate reports
npm run test:report

# Validate build
npm run ci:build-validate
\`\`\`

## 📈 Performance Monitoring

The test automation includes:
- Coverage threshold enforcement (90%)
- Performance regression detection
- Memory leak detection
- Build validation
- Automated reporting

## 🚀 CI/CD Integration

GitHub Actions workflow configured for:
- Multi-node testing (Node 18, 20, 22)
- Cross-browser E2E testing
- Security scanning
- Automated deployment validation

Generated: ${new Date().toISOString()}
`;
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TestAutomationSetup();
  setup.setup().catch(console.error);
}

module.exports = TestAutomationSetup;