/**
 * Code Quality Analyzer - AI-powered code quality assessment
 * Analyzes code for maintainability, readability, and best practices
 */

// Interfaces for PR data analysis
export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  sha?: string;
}

export interface PRData {
  number: number;
  title: string;
  body: string;
  files: PRFile[];
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  halstead: number;
}

export interface MaintainabilityMetrics {
  index: number;
  techDebt: number;
  codeSmells: number;
}

export interface DuplicationMetrics {
  percentage: number;
  duplicatedLines: number;
  duplicatedBlocks: number;
}

export interface StyleMetrics {
  consistency: number;
  adherence: number;
  violations: number;
}

export interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
}

export interface AnalysisWithIssues {
  issues: CodeQualityIssue[];
  metrics: ComplexityMetrics | MaintainabilityMetrics | DuplicationMetrics | StyleMetrics;
}

export interface CodeQualityConfig {
  enableComplexityAnalysis: boolean;
  enableDuplicationDetection: boolean;
  enableStyleGuideChecks: boolean;
  complexityThreshold: number;
  duplicationThreshold: number;
  styleGuideRules: string[];
}

export interface CodeQualityIssue {
  id: string;
  type: 'complexity' | 'duplication' | 'style' | 'maintainability' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file: string;
  line: number;
  column?: number;
  suggestion?: string;
  documentation?: string;
  confidence: number;
}

export interface CodeQualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: number;
  };
  maintainability: {
    index: number;
    techDebt: number;
    codeSmells: number;
  };
  duplication: {
    percentage: number;
    duplicatedLines: number;
    duplicatedBlocks: number;
  };
  style: {
    consistency: number;
    adherence: number;
    violations: number;
  };
  coverage: {
    lines: number;
    branches: number;
    functions: number;
  };
}

export interface CodeQualityAnalysis {
  overall: number;
  issues: CodeQualityIssue[];
  metrics: CodeQualityMetrics;
  recommendations: string[];
  confidence: number;
  timestamp: string;
}

export class CodeQualityAnalyzer {
  private config: CodeQualityConfig;
  private analysisCache: Map<string, CodeQualityAnalysis> = new Map();

  constructor(config: CodeQualityConfig = {
    enableComplexityAnalysis: true,
    enableDuplicationDetection: true,
    enableStyleGuideChecks: true,
    complexityThreshold: 10,
    duplicationThreshold: 5,
    styleGuideRules: ['eslint:recommended', '@typescript-eslint/recommended']
  }) {
    this.config = config;
  }

  /**
   * Analyze code quality for PR data
   */
  async analyze(prData: PRData): Promise<CodeQualityAnalysis> {
    const cacheKey = this.generateCacheKey(prData);
    
    // Check cache
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey)!;
      if (this.isCacheValid(cached)) {
        return cached;
      }
    }

    try {
      // Analyzing code quality...

      const [
        complexityAnalysis,
        duplicationAnalysis,
        styleAnalysis,
        maintainabilityAnalysis
      ] = await Promise.all([
        this.analyzeComplexity(prData.files),
        this.analyzeDuplication(prData.files),
        this.analyzeStyle(prData.files),
        this.analyzeMaintainability(prData.files)
      ]);

      const issues = [
        ...complexityAnalysis.issues,
        ...duplicationAnalysis.issues,
        ...styleAnalysis.issues,
        ...maintainabilityAnalysis.issues
      ];

      const metrics: CodeQualityMetrics = {
        complexity: complexityAnalysis.metrics,
        maintainability: maintainabilityAnalysis.metrics,
        duplication: duplicationAnalysis.metrics,
        style: styleAnalysis.metrics,
        coverage: await this.analyzeCoverage(prData.files)
      };

      const overallScore = this.calculateOverallScore(metrics, issues);
      const recommendations = this.generateRecommendations(issues, metrics);

      const analysis: CodeQualityAnalysis = {
        overall: overallScore,
        issues,
        metrics,
        recommendations,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      };

      // Cache result
      this.analysisCache.set(cacheKey, analysis);

      // Code quality analysis complete
      return analysis;

    } catch (error) {
      // Code quality analysis failed - using fallback
      
      // Return fallback analysis
      return {
        overall: 0.5,
        issues: [],
        metrics: this.getDefaultMetrics(),
        recommendations: ['Unable to analyze code quality due to errors'],
        confidence: 0.1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze code complexity
   */
  private async analyzeComplexity(files: PRFile[]): Promise<{
    issues: CodeQualityIssue[];
    metrics: ComplexityMetrics;
  }> {
    const issues: CodeQualityIssue[] = [];
    let totalComplexity = 0;
    let fileCount = 0;

    for (const file of files) {
      if (!this.isCodeFile(file.filename)) continue;

      const complexity = this.calculateFileComplexity(file);
      totalComplexity += complexity.cyclomatic;
      fileCount++;

      if (complexity.cyclomatic > this.config.complexityThreshold) {
        issues.push({
          id: `complexity_${file.filename}_${Date.now()}`,
          type: 'complexity',
          severity: this.getComplexitySeverity(complexity.cyclomatic),
          message: `High cyclomatic complexity: ${complexity.cyclomatic}`,
          file: file.filename,
          line: 1,
          suggestion: 'Consider breaking down this function into smaller, more focused functions',
          documentation: 'High complexity makes code harder to understand and maintain',
          confidence: 0.9
        });
      }
    }

    return {
      issues,
      metrics: {
        cyclomatic: fileCount > 0 ? totalComplexity / fileCount : 0,
        cognitive: totalComplexity * 0.8, // Simplified cognitive complexity
        halstead: totalComplexity * 1.2  // Simplified Halstead complexity
      }
    };
  }

  /**
   * Analyze code duplication
   */
  private async analyzeDuplication(files: PRFile[]): Promise<{
    issues: CodeQualityIssue[];
    metrics: DuplicationMetrics;
  }> {
    const issues: CodeQualityIssue[] = [];
    let duplicatedLines = 0;
    let totalLines = 0;

    // Simplified duplication detection
    const codeBlocks = new Map<string, { file: string; line: number }[]>();

    for (const file of files) {
      if (!this.isCodeFile(file.filename)) continue;

      const lines = (file.patch || '').split('\n').filter(line => 
        line.startsWith('+') && line.length > 10
      );

      totalLines += lines.length;

      lines.forEach((line, index) => {
        const normalizedLine = this.normalizeCodeLine(line);
        if (normalizedLine.length > 20) { // Only check substantial lines
          if (!codeBlocks.has(normalizedLine)) {
            codeBlocks.set(normalizedLine, []);
          }
          codeBlocks.get(normalizedLine)!.push({
            file: file.filename,
            line: index + 1
          });
        }
      });
    }

    // Find duplications
    codeBlocks.forEach((occurrences) => {
      if (occurrences.length > 1) {
        duplicatedLines += occurrences.length;
        
        issues.push({
          id: `duplication_${Date.now()}_${Math.random()}`,
          type: 'duplication',
          severity: 'medium',
          message: `Duplicated code found in ${occurrences.length} locations`,
          file: occurrences[0].file,
          line: occurrences[0].line,
          suggestion: 'Extract this code into a reusable function or constant',
          confidence: 0.7
        });
      }
    });

    const duplicationPercentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

    return {
      issues,
      metrics: {
        percentage: duplicationPercentage,
        duplicatedLines,
        duplicatedBlocks: issues.length
      }
    };
  }

  /**
   * Analyze code style
   */
  private async analyzeStyle(files: PRFile[]): Promise<{
    issues: CodeQualityIssue[];
    metrics: StyleMetrics;
  }> {
    const issues: CodeQualityIssue[] = [];
    let styleViolations = 0;
    let totalChecks = 0;

    for (const file of files) {
      if (!this.isCodeFile(file.filename)) continue;

      const violations = this.checkStyleViolations(file);
      styleViolations += violations.length;
      totalChecks += 50; // Assume 50 style checks per file

      issues.push(...violations);
    }

    const consistency = totalChecks > 0 ? ((totalChecks - styleViolations) / totalChecks) * 100 : 100;

    return {
      issues,
      metrics: {
        consistency,
        adherence: Math.max(0, 100 - (styleViolations / Math.max(files.length, 1)) * 10),
        violations: styleViolations
      }
    };
  }

  /**
   * Analyze maintainability
   */
  private async analyzeMaintainability(files: PRFile[]): Promise<{
    issues: CodeQualityIssue[];
    metrics: MaintainabilityMetrics;
  }> {
    const issues: CodeQualityIssue[] = [];
    let maintainabilityScore = 100;
    let codeSmells = 0;

    for (const file of files) {
      if (!this.isCodeFile(file.filename)) continue;

      const smells = this.detectCodeSmells(file);
      codeSmells += smells.length;
      issues.push(...smells);

      // Reduce maintainability score based on issues
      maintainabilityScore -= smells.length * 5;
    }

    return {
      issues,
      metrics: {
        index: Math.max(0, maintainabilityScore),
        techDebt: codeSmells * 2, // hours
        codeSmells
      }
    };
  }

  /**
   * Analyze test coverage
   */
  private async analyzeCoverage(files: PRFile[]): Promise<CoverageMetrics> {
    // Simplified coverage analysis
    const testFiles = files.filter(f => 
      f.filename.includes('.test.') || 
      f.filename.includes('.spec.') ||
      f.filename.includes('test/')
    );

    const codeFiles = files.filter(f => 
      this.isCodeFile(f.filename) && 
      !f.filename.includes('test')
    );

    const coverageRatio = codeFiles.length > 0 ? (testFiles.length / codeFiles.length) * 100 : 0;

    return {
      lines: Math.min(100, coverageRatio * 1.2),
      branches: Math.min(100, coverageRatio),
      functions: Math.min(100, coverageRatio * 0.8)
    };
  }

  /**
   * Calculate file complexity
   */
  private calculateFileComplexity(file: PRFile): { cyclomatic: number } {
    const patch = file.patch || '';
    
    // Count complexity indicators in the patch
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /catch\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /&&/g,
      /\|\|/g,
      /\?.*:/g
    ];

    let complexity = 1; // Base complexity

    complexityIndicators.forEach(indicator => {
      const matches = patch.match(indicator);
      complexity += matches ? matches.length : 0;
    });

    return { cyclomatic: complexity };
  }

  /**
   * Check style violations
   */
  private checkStyleViolations(file: PRFile): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    const patch = file.patch || '';
    const lines = patch.split('\n');

    lines.forEach((line, index) => {
      if (!line.startsWith('+')) return;

      const cleanLine = line.substring(1);

      // Check for common style issues
      if (cleanLine.includes('\t') && cleanLine.includes('  ')) {
        issues.push({
          id: `style_mixed_indent_${file.filename}_${index}`,
          type: 'style',
          severity: 'low',
          message: 'Mixed tabs and spaces for indentation',
          file: file.filename,
          line: index + 1,
          suggestion: 'Use consistent indentation (spaces or tabs, not both)',
          confidence: 0.9
        });
      }

      if (cleanLine.length > 120) {
        issues.push({
          id: `style_long_line_${file.filename}_${index}`,
          type: 'style',
          severity: 'low',
          message: 'Line too long (>120 characters)',
          file: file.filename,
          line: index + 1,
          suggestion: 'Break long lines for better readability',
          confidence: 0.8
        });
      }
    });

    return issues;
  }

  /**
   * Detect code smells
   */
  private detectCodeSmells(file: PRFile): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    const patch = file.patch || '';

    // Detect large function smell
    const functionMatches = patch.match(/function\s+\w+|=>\s*{|\w+\s*\(/g);
    if (functionMatches && functionMatches.length > 10) {
      issues.push({
        id: `smell_large_file_${file.filename}`,
        type: 'maintainability',
        severity: 'medium',
        message: 'File contains many functions, consider splitting',
        file: file.filename,
        line: 1,
        suggestion: 'Split large files into smaller, focused modules',
        confidence: 0.7
      });
    }

    // Detect magic numbers
    const magicNumbers = patch.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 3) {
      issues.push({
        id: `smell_magic_numbers_${file.filename}`,
        type: 'maintainability',
        severity: 'low',
        message: 'Multiple magic numbers detected',
        file: file.filename,
        line: 1,
        suggestion: 'Replace magic numbers with named constants',
        confidence: 0.6
      });
    }

    return issues;
  }

  /**
   * Helper methods
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  private normalizeCodeLine(line: string): string {
    return line
      .replace(/\s+/g, ' ')
      .replace(/\/\/.*$/, '')
      .replace(/\/\*.*?\*\//g, '')
      .trim()
      .toLowerCase();
  }

  private getComplexitySeverity(complexity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (complexity > 20) return 'critical';
    if (complexity > 15) return 'high';
    if (complexity > 10) return 'medium';
    return 'low';
  }

  private calculateOverallScore(metrics: CodeQualityMetrics, issues: CodeQualityIssue[]): number {
    const weights = {
      complexity: 0.3,
      maintainability: 0.3,
      duplication: 0.2,
      style: 0.1,
      coverage: 0.1
    };

    // Normalize metrics to 0-1 scale
    const normalizedComplexity = Math.max(0, 1 - metrics.complexity.cyclomatic / 20);
    const normalizedMaintainability = metrics.maintainability.index / 100;
    const normalizedDuplication = Math.max(0, 1 - metrics.duplication.percentage / 100);
    const normalizedStyle = metrics.style.consistency / 100;
    const normalizedCoverage = metrics.coverage.lines / 100;

    let score = 
      normalizedComplexity * weights.complexity +
      normalizedMaintainability * weights.maintainability +
      normalizedDuplication * weights.duplication +
      normalizedStyle * weights.style +
      normalizedCoverage * weights.coverage;

    // Penalize for critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    score -= criticalIssues * 0.2;
    score -= highIssues * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private generateRecommendations(issues: CodeQualityIssue[], metrics: CodeQualityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.complexity.cyclomatic > 15) {
      recommendations.push('Reduce cyclomatic complexity by breaking down complex functions');
    }

    if (metrics.duplication.percentage > 10) {
      recommendations.push('Eliminate code duplication by extracting common functionality');
    }

    if (metrics.style.consistency < 80) {
      recommendations.push('Improve code style consistency by using automated formatting tools');
    }

    if (metrics.maintainability.index < 60) {
      recommendations.push('Improve maintainability by addressing code smells and technical debt');
    }

    if (metrics.coverage.lines < 70) {
      recommendations.push('Increase test coverage to improve code reliability');
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical code quality issues immediately`);
    }

    return recommendations.length > 0 ? recommendations : ['Code quality looks good overall'];
  }

  private getDefaultMetrics(): CodeQualityMetrics {
    return {
      complexity: { cyclomatic: 0, cognitive: 0, halstead: 0 },
      maintainability: { index: 50, techDebt: 0, codeSmells: 0 },
      duplication: { percentage: 0, duplicatedLines: 0, duplicatedBlocks: 0 },
      style: { consistency: 50, adherence: 50, violations: 0 },
      coverage: { lines: 0, branches: 0, functions: 0 }
    };
  }

  private generateCacheKey(prData: PRData): string {
    const filesHash = prData.files
      .map((f: PRFile) => `${f.filename}_${f.sha || 'no-sha'}`)
      .join('|');
    return `quality_${filesHash}`;
  }

  private isCacheValid(cached: CodeQualityAnalysis): boolean {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - new Date(cached.timestamp).getTime() < maxAge;
  }
}

export default CodeQualityAnalyzer;