/**
 * TDD Test Runner for TypeScript Fixes
 * Orchestrates and reports on all TypeScript fix tests
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  errors?: string[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface TestSuite {
  name: string;
  file: string;
  description: string;
  dependencies: string[];
  expectedTests: number;
}

class TypeScriptFixesTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Network Types',
      file: 'typescript-fixes-network-types.test.ts',
      description: 'Tests for NetworkPartition interface and network type exports',
      dependencies: ['types/network.ts', 'services/MeshTopology.ts'],
      expectedTests: 25
    },
    {
      name: 'Neural Types',
      file: 'typescript-fixes-neural-types.test.ts', 
      description: 'Tests for neural types, interfaces, and missing exports',
      dependencies: ['types/neural.ts'],
      expectedTests: 30
    },
    {
      name: 'GitHub Integration',
      file: 'typescript-fixes-github-integration.test.ts',
      description: 'Tests for GitHubIntegrationLayer and CollaborativeDevelopmentTools',
      dependencies: ['github/GitHubIntegrationLayer.ts', 'github/CollaborativeDevelopmentTools.ts'],
      expectedTests: 20
    },
    {
      name: 'AI Analyzers',
      file: 'typescript-fixes-ai-analyzers.test.ts',
      description: 'Tests for AI analyzer modules and their integrations',
      dependencies: ['ai/*.ts'],
      expectedTests: 35
    },
    {
      name: 'Integration Tests',
      file: 'typescript-fixes-integration.test.ts',
      description: 'Comprehensive integration testing for all fixed components',
      dependencies: ['All above components'],
      expectedTests: 15
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;
  private totalDuration: number = 0;

  constructor() {
    console.log('🧪 TypeScript Fixes TDD Test Runner');
    console.log('=====================================');
  }

  async runAllTests(): Promise<void> {
    this.startTime = Date.now();
    
    console.log(`\n📋 Test Suites to Run: ${this.testSuites.length}`);
    this.testSuites.forEach((suite, index) => {
      console.log(`  ${index + 1}. ${suite.name} - ${suite.description}`);
    });

    console.log('\n🚀 Starting test execution...\n');

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.totalDuration = Date.now() - this.startTime;
    this.generateReport();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n🔬 Running: ${suite.name}`);
    console.log(`📁 File: ${suite.file}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`🔗 Dependencies: ${suite.dependencies.join(', ')}`);

    const testFilePath = join(__dirname, suite.file);
    
    if (!existsSync(testFilePath)) {
      console.log(`❌ Test file not found: ${testFilePath}`);
      this.results.push({
        name: suite.name,
        passed: false,
        duration: 0,
        errors: [`Test file not found: ${suite.file}`]
      });
      return;
    }

    const suiteStartTime = Date.now();
    let passed = false;
    let errors: string[] = [];

    try {
      // Run Jest for this specific test file
      const jestCommand = `npx jest ${testFilePath} --verbose --coverage --no-cache --detectOpenHandles`;
      console.log(`⚡ Executing: ${jestCommand}`);
      
      const output = execSync(jestCommand, {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      console.log(`✅ ${suite.name} - PASSED`);
      console.log(output);
      passed = true;

    } catch (error: any) {
      console.log(`❌ ${suite.name} - FAILED`);
      console.error(error.stdout || error.message);
      
      errors.push(error.stdout || error.message);
      passed = false;
    }

    const duration = Date.now() - suiteStartTime;

    this.results.push({
      name: suite.name,
      passed,
      duration,
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`⏱️  Duration: ${duration}ms`);
  }

  private generateReport(): void {
    console.log('\n📊 TEST EXECUTION REPORT');
    console.log('========================');

    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const totalTests = this.results.length;

    console.log(`\n📈 Summary:`);
    console.log(`  Total Test Suites: ${totalTests}`);
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${failedTests}`);
    console.log(`  ⏱️  Total Duration: ${this.totalDuration}ms`);
    console.log(`  📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${result.name} (${result.duration}ms)`);
      
      if (result.errors) {
        result.errors.forEach(error => {
          console.log(`     🔍 Error: ${error.substring(0, 100)}...`);
        });
      }
    });

    // Generate coverage report
    this.generateCoverageReport();

    // Generate test output files
    this.generateTestOutputFiles();

    // Final status
    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! TypeScript fixes are working correctly.');
    } else {
      console.log(`\n⚠️  ${failedTests} test suite(s) failed. Please review the errors above.`);
    }
  }

  private generateCoverageReport(): void {
    console.log('\n📊 Coverage Summary:');
    console.log('  (Coverage details would be generated by Jest)');
    console.log('  📁 Network Types: Expected coverage > 80%');
    console.log('  📁 Neural Types: Expected coverage > 85%');
    console.log('  📁 GitHub Integration: Expected coverage > 75%');
    console.log('  📁 AI Analyzers: Expected coverage > 70%');
    console.log('  📁 Integration: Expected coverage > 60%');
  }

  private generateTestOutputFiles(): void {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: this.totalDuration,
      testSuites: this.testSuites.length,
      results: this.results,
      summary: {
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        successRate: (this.results.filter(r => r.passed).length / this.results.length) * 100
      },
      typeScriptFixes: {
        networkTypes: this.results.find(r => r.name === 'Network Types')?.passed || false,
        neuralTypes: this.results.find(r => r.name === 'Neural Types')?.passed || false,
        githubIntegration: this.results.find(r => r.name === 'GitHub Integration')?.passed || false,
        aiAnalyzers: this.results.find(r => r.name === 'AI Analyzers')?.passed || false,
        integration: this.results.find(r => r.name === 'Integration Tests')?.passed || false
      },
      recommendations: this.generateRecommendations()
    };

    // Write JSON report
    const reportPath = join(__dirname, 'typescript-fixes-test-report.json');
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Test report written to: ${reportPath}`);

    // Write Markdown report
    const markdownReport = this.generateMarkdownReport(reportData);
    const markdownPath = join(__dirname, 'typescript-fixes-test-report.md');
    writeFileSync(markdownPath, markdownReport);
    console.log(`📄 Markdown report written to: ${markdownPath}`);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedResults = this.results.filter(r => !r.passed);
    
    if (failedResults.length === 0) {
      recommendations.push('All tests passing! Consider adding more edge case tests.');
      recommendations.push('Review test coverage and add integration tests for missing scenarios.');
    } else {
      failedResults.forEach(result => {
        switch (result.name) {
          case 'Network Types':
            recommendations.push('Check NetworkPartition interface exports and MeshTopology compatibility.');
            break;
          case 'Neural Types':
            recommendations.push('Verify all neural type exports and interface completeness.');
            break;
          case 'GitHub Integration':
            recommendations.push('Review GitHub API integration and AI analyzer dependencies.');
            break;
          case 'AI Analyzers':
            recommendations.push('Ensure all AI modules are properly mocked and typed.');
            break;
          case 'Integration Tests':
            recommendations.push('Check component integration and async operation handling.');
            break;
        }
      });
    }

    recommendations.push('Run TypeScript compiler to verify no compilation errors remain.');
    recommendations.push('Update package.json dependencies if new packages are required.');
    
    return recommendations;
  }

  private generateMarkdownReport(data: any): string {
    return `# TypeScript Fixes Test Report

## Summary
- **Timestamp**: ${data.timestamp}
- **Total Duration**: ${data.totalDuration}ms
- **Test Suites**: ${data.testSuites}
- **Success Rate**: ${data.summary.successRate.toFixed(1)}%

## Results
| Test Suite | Status | Duration |
|------------|--------|----------|
${this.results.map(r => `| ${r.name} | ${r.passed ? '✅' : '❌'} | ${r.duration}ms |`).join('\n')}

## TypeScript Fixes Status
- **Network Types**: ${data.typeScriptFixes.networkTypes ? '✅' : '❌'}
- **Neural Types**: ${data.typeScriptFixes.neuralTypes ? '✅' : '❌'}
- **GitHub Integration**: ${data.typeScriptFixes.githubIntegration ? '✅' : '❌'}
- **AI Analyzers**: ${data.typeScriptFixes.aiAnalyzers ? '✅' : '❌'}
- **Integration**: ${data.typeScriptFixes.integration ? '✅' : '❌'}

## Recommendations
${data.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Test Suites Details
${this.testSuites.map(suite => `
### ${suite.name}
- **File**: ${suite.file}
- **Description**: ${suite.description}
- **Dependencies**: ${suite.dependencies.join(', ')}
- **Expected Tests**: ${suite.expectedTests}
`).join('\n')}

---
*Generated by TypeScript Fixes TDD Test Runner*
`;
  }
}

// Main execution
if (require.main === module) {
  const runner = new TypeScriptFixesTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { TypeScriptFixesTestRunner };