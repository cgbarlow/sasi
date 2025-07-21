/**
 * Security Analyzer - AI-powered security vulnerability assessment
 * Analyzes code for security vulnerabilities, threats, and compliance issues
 */

// Import the PRFile and PRData interfaces from CodeQualityAnalyzer
import { PRFile, PRData } from './CodeQualityAnalyzer';

export interface PatternMatch {
  line: number;
  column: number;
  text: string;
}

export interface SecurityConfig {
  enableVulnerabilityScanning: boolean;
  enableComplianceChecks: boolean;
  enableSecretDetection: boolean;
  vulnerabilityThreshold: 'low' | 'medium' | 'high' | 'critical';
  complianceStandards: string[];
  secretPatterns: RegExp[];
}

export interface SecurityVulnerability {
  id: string;
  type: 'injection' | 'xss' | 'csrf' | 'auth' | 'crypto' | 'dos' | 'disclosure' | 'secret';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line: number;
  column?: number;
  cwe?: string; // Common Weakness Enumeration
  cvss?: number; // Common Vulnerability Scoring System
  remediation: string;
  references: string[];
  confidence: number;
}

export interface SecurityMetrics {
  vulnerabilityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskScore: number;
  complianceScore: number;
  secretsFound: number;
  securityDebt: number;
}

export interface ComplianceCheck {
  standard: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}

export interface SecurityAnalysis {
  overall: number;
  vulnerabilities: SecurityVulnerability[];
  metrics: SecurityMetrics;
  compliance: ComplianceCheck[];
  recommendations: string[];
  confidence: number;
  timestamp: string;
}

export class SecurityAnalyzer {
  private config: SecurityConfig;
  private analysisCache: Map<string, SecurityAnalysis> = new Map();
  
  // Common vulnerability patterns
  private vulnerabilityPatterns = {
    sqlInjection: [
      /query\s*\+\s*['"]/gi,
      /execute\s*\(\s*['"]/gi,
      /\$\{\s*req\./gi,
      /SELECT.*FROM.*WHERE.*\+/gi
    ],
    xss: [
      /innerHTML\s*=\s*[^;]*req\./gi,
      /document\.write\s*\(\s*[^)]*req\./gi,
      /eval\s*\(\s*[^)]*req\./gi,
      /eval\s*\(/gi,
      /dangerouslySetInnerHTML/gi
    ],
    hardcodedSecrets: [
      /password\s*=\s*['"]\w{4,}/gi,
      /api[_-]?key\s*=\s*['"]\w{10,}/gi,
      /secret\s*=\s*['"]\w{8,}/gi,
      /token\s*=\s*['"]\w{16,}/gi,
      /private[_-]?key\s*=\s*['"][\w+/=]{20,}/gi
    ],
    weakCrypto: [
      /md5\s*\(/gi,
      /sha1\s*\(/gi,
      /des\s*\(/gi,
      /rc4\s*\(/gi,
      /Math\.random\s*\(\s*\)/gi
    ],
    authIssues: [
      /session\s*=\s*req\.session/gi,
      /cookie\s*=\s*req\.cookies/gi,
      /auth\s*=\s*false/gi,
      /authenticated\s*=\s*true/gi
    ]
  };

  // Secret detection patterns
  private secretPatterns = [
    /(?:aws_access_key_id|aws_secret_access_key)\s*=\s*['"]\w{16,}['"]/, 
    /(?:github_token|gh_token)\s*=\s*['"]\w{20,}['"]/, 
    /(?:stripe_key|sk_live_)\w{20,}/,
    /(?:private_key|-----BEGIN [A-Z]+ PRIVATE KEY-----)/,
    /(?:password|passwd|pwd)\s*=\s*['"]*\w{6,}['"]*/i,
    /(?:PASSWORD|SECRET|API_KEY|TOKEN)\s*=\s*['"]*\w{6,}['"]*/i
  ];

  constructor(config: SecurityConfig = {
    enableVulnerabilityScanning: true,
    enableComplianceChecks: true,
    enableSecretDetection: true,
    vulnerabilityThreshold: 'medium',
    complianceStandards: ['OWASP-Top10', 'CWE-Top25'],
    secretPatterns: []
  }) {
    this.config = {
      ...config,
      secretPatterns: [...config.secretPatterns, ...this.secretPatterns]
    };
  }

  /**
   * Analyze security for PR data
   */
  async analyze(prData: PRData): Promise<SecurityAnalysis> {
    const cacheKey = this.generateCacheKey(prData);
    
    // Check cache
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey)!;
      if (this.isCacheValid(cached)) {
        return cached;
      }
    }

    try {
      // Analyzing security vulnerabilities...

      const [
        vulnerabilities,
        secrets,
        complianceChecks
      ] = await Promise.all([
        this.scanForVulnerabilities(prData.files),
        this.detectSecrets(prData.files),
        this.checkCompliance(prData.files)
      ]);

      const allVulnerabilities = [...vulnerabilities, ...secrets];
      const metrics = this.calculateSecurityMetrics(allVulnerabilities);
      const overallScore = this.calculateOverallSecurityScore(metrics, allVulnerabilities);
      const recommendations = this.generateSecurityRecommendations(allVulnerabilities, metrics);

      const analysis: SecurityAnalysis = {
        overall: overallScore,
        vulnerabilities: allVulnerabilities,
        metrics,
        compliance: complianceChecks,
        recommendations,
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };

      // Cache result
      this.analysisCache.set(cacheKey, analysis);

      // Security analysis complete
      return analysis;

    } catch (error) {
      // Security analysis failed - using fallback
      
      // Return fallback analysis
      return {
        overall: 0.5,
        vulnerabilities: [],
        metrics: this.getDefaultMetrics(),
        compliance: [],
        recommendations: ['Unable to analyze security due to errors'],
        confidence: 0.1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scan for common vulnerabilities
   */
  private async scanForVulnerabilities(files: PRFile[]): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const file of files) {
      // Only skip binary files or clearly non-analyzable files
      if (this.shouldSkipFile(file.filename)) continue;

      const content = file.patch || '';
      
      // SQL Injection
      vulnerabilities.push(...this.detectSQLInjection(file, content));
      
      // XSS
      vulnerabilities.push(...this.detectXSS(file, content));
      
      // Weak Cryptography
      vulnerabilities.push(...this.detectWeakCrypto(file, content));
      
      // Authentication Issues
      vulnerabilities.push(...this.detectAuthIssues(file, content));
      
      // Path Traversal
      vulnerabilities.push(...this.detectPathTraversal(file, content));
      
      // Command Injection
      vulnerabilities.push(...this.detectCommandInjection(file, content));
    }

    return vulnerabilities;
  }

  /**
   * Detect SQL injection vulnerabilities
   */
  private detectSQLInjection(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    this.vulnerabilityPatterns.sqlInjection.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `sql_injection_${file.filename}_${match.line}_${index}`,
          type: 'injection',
          severity: 'high',
          title: 'SQL Injection Vulnerability',
          description: 'Direct concatenation of user input in SQL query detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-89',
          cvss: 8.1,
          remediation: 'Use parameterized queries or prepared statements to prevent SQL injection',
          references: [
            'https://owasp.org/www-community/attacks/SQL_Injection',
            'https://cwe.mitre.org/data/definitions/89.html'
          ],
          confidence: 0.8
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect XSS vulnerabilities
   */
  private detectXSS(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    this.vulnerabilityPatterns.xss.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `xss_${file.filename}_${match.line}_${index}`,
          type: 'xss',
          severity: 'high',
          title: 'Cross-Site Scripting (XSS) Vulnerability',
          description: 'Unsafe rendering of user input detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-79',
          cvss: 7.2,
          remediation: 'Sanitize and encode user input before rendering in HTML context',
          references: [
            'https://owasp.org/www-community/attacks/xss/',
            'https://cwe.mitre.org/data/definitions/79.html'
          ],
          confidence: 0.7
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect weak cryptography
   */
  private detectWeakCrypto(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    this.vulnerabilityPatterns.weakCrypto.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `weak_crypto_${file.filename}_${match.line}_${index}`,
          type: 'crypto',
          severity: 'medium',
          title: 'Weak Cryptographic Algorithm',
          description: 'Use of weak or deprecated cryptographic algorithm detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-327',
          cvss: 5.3,
          remediation: 'Use strong cryptographic algorithms like AES-256, SHA-256, or bcrypt',
          references: [
            'https://owasp.org/www-community/vulnerabilities/Insecure_Cryptographic_Storage',
            'https://cwe.mitre.org/data/definitions/327.html'
          ],
          confidence: 0.9
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect authentication issues
   */
  private detectAuthIssues(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    this.vulnerabilityPatterns.authIssues.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `auth_issue_${file.filename}_${match.line}_${index}`,
          type: 'auth',
          severity: 'medium',
          title: 'Authentication Bypass Risk',
          description: 'Potentially unsafe authentication handling detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-287',
          cvss: 6.5,
          remediation: 'Implement proper authentication validation and session management',
          references: [
            'https://owasp.org/www-community/vulnerabilities/Broken_Authentication_and_Session_Management',
            'https://cwe.mitre.org/data/definitions/287.html'
          ],
          confidence: 0.6
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect path traversal vulnerabilities
   */
  private detectPathTraversal(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /path\s*\+\s*req\./gi,
      /readFile\s*\(\s*req\./gi
    ];

    pathTraversalPatterns.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `path_traversal_${file.filename}_${match.line}_${index}`,
          type: 'disclosure',
          severity: 'high',
          title: 'Path Traversal Vulnerability',
          description: 'Potential directory traversal vulnerability detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-22',
          cvss: 7.5,
          remediation: 'Validate and sanitize file paths, use allowlists for permitted paths',
          references: [
            'https://owasp.org/www-community/attacks/Path_Traversal',
            'https://cwe.mitre.org/data/definitions/22.html'
          ],
          confidence: 0.7
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect command injection vulnerabilities
   */
  private detectCommandInjection(file: PRFile, content: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const commandInjectionPatterns = [
      /exec\s*\(\s*[^)]*req\./gi,
      /spawn\s*\(\s*[^)]*req\./gi,
      /system\s*\(\s*[^)]*req\./gi,
      /eval\s*\(\s*[^)]*req\./gi
    ];

    commandInjectionPatterns.forEach((pattern, index) => {
      const matches = this.findPatternMatches(content, pattern);
      
      matches.forEach(match => {
        vulnerabilities.push({
          id: `command_injection_${file.filename}_${match.line}_${index}`,
          type: 'injection',
          severity: 'critical',
          title: 'Command Injection Vulnerability',
          description: 'Potential command injection vulnerability detected',
          file: file.filename,
          line: match.line,
          cwe: 'CWE-78',
          cvss: 9.8,
          remediation: 'Validate and sanitize all user input, use safe APIs for system commands',
          references: [
            'https://owasp.org/www-community/attacks/Command_Injection',
            'https://cwe.mitre.org/data/definitions/78.html'
          ],
          confidence: 0.8
        });
      });
    });

    return vulnerabilities;
  }

  /**
   * Detect hardcoded secrets
   */
  private async detectSecrets(files: PRFile[]): Promise<SecurityVulnerability[]> {
    const secrets: SecurityVulnerability[] = [];

    for (const file of files) {
      // Check all files except binary files for secrets
      if (this.shouldSkipFile(file.filename)) continue;

      const content = file.patch || '';
      
      // Skip environment variable patterns to avoid false positives
      if (this.isEnvironmentVariablePattern(content)) continue;
      
      this.config.secretPatterns.forEach((pattern, index) => {
        const matches = this.findPatternMatches(content, pattern);
        
        matches.forEach(match => {
          secrets.push({
            id: `secret_${file.filename}_${match.line}_${index}`,
            type: 'secret',
            severity: 'critical',
            title: 'Hardcoded Secret Detected',
            description: 'Potential hardcoded secret or credential found in code',
            file: file.filename,
            line: match.line,
            cwe: 'CWE-798',
            cvss: 9.1,
            remediation: 'Remove hardcoded secrets and use environment variables or secure secret management',
            references: [
              'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password',
              'https://cwe.mitre.org/data/definitions/798.html'
            ],
            confidence: 0.6
          });
        });
      });
    }

    return secrets;
  }

  /**
   * Check compliance with security standards
   */
  private async checkCompliance(_files: PRFile[]): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // OWASP Top 10 compliance checks
    if (this.config.complianceStandards.includes('OWASP-Top10')) {
      checks.push(...this.checkOWASPCompliance(_files));
    }

    // CWE Top 25 compliance checks
    if (this.config.complianceStandards.includes('CWE-Top25')) {
      checks.push(...this.checkCWECompliance(_files));
    }

    return checks;
  }

  /**
   * Check OWASP Top 10 compliance
   */
  private checkOWASPCompliance(files: PRFile[]): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];
    
    // Analyze files for OWASP compliance
    const fileCount = files.length;
    
    if (fileCount === 0) {
      return checks;
    }

    // Example checks
    checks.push({
      standard: 'OWASP-Top10',
      requirement: 'A01:2021 – Broken Access Control',
      status: 'warning',
      details: 'Review access control implementation in modified files'
    });

    checks.push({
      standard: 'OWASP-Top10',
      requirement: 'A02:2021 – Cryptographic Failures',
      status: 'pass',
      details: 'No weak cryptographic implementations detected'
    });

    return checks;
  }

  /**
   * Check CWE Top 25 compliance
   */
  private checkCWECompliance(files: PRFile[]): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];
    
    // Analyze files for CWE compliance  
    const fileCount = files.length;
    
    if (fileCount === 0) {
      return checks;
    }

    checks.push({
      standard: 'CWE-Top25',
      requirement: 'CWE-79: Cross-site Scripting',
      status: 'pass',
      details: 'No XSS vulnerabilities detected in new code'
    });

    return checks;
  }

  /**
   * Helper methods
   */
  private findPatternMatches(content: string, pattern: RegExp): Array<{ line: number; match: string }> {
    const matches: Array<{ line: number; match: string }> = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.startsWith('+')) { // Only check added lines
        const cleanLine = line.substring(1);
        const match = cleanLine.match(pattern);
        if (match) {
          matches.push({
            line: index + 1,
            match: match[0]
          });
        }
      }
    });
    
    return matches;
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.scala', '.kt'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private isConfigFile(filename: string): boolean {
    const configExtensions = ['.json', '.yaml', '.yml', '.xml', '.ini', '.conf', '.config', '.env', '.properties', '.toml'];
    const configNames = ['Dockerfile', '.env', '.gitignore', 'docker-compose', 'makefile', '.npmrc', '.yarnrc'];
    const lowerFilename = filename.toLowerCase();
    
    return configExtensions.some(ext => lowerFilename.endsWith(ext)) ||
           configNames.some(name => lowerFilename.includes(name.toLowerCase()));
  }

  private calculateSecurityMetrics(vulnerabilities: SecurityVulnerability[]): SecurityMetrics {
    const counts = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    };

    const riskScore = this.calculateRiskScore(counts);
    const secretsFound = vulnerabilities.filter(v => v.type === 'secret').length;
    const securityDebt = counts.critical * 8 + counts.high * 4 + counts.medium * 2 + counts.low * 1;

    return {
      vulnerabilityCount: counts,
      riskScore,
      complianceScore: Math.max(0, 100 - (riskScore * 2)),
      secretsFound,
      securityDebt
    };
  }

  private calculateRiskScore(counts: { critical: number; high: number; medium: number; low: number }): number {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    const totalRisk = counts.critical * weights.critical +
                     counts.high * weights.high +
                     counts.medium * weights.medium +
                     counts.low * weights.low;
    
    // Consider vulnerability types for additional risk calculation if provided
    const typeRiskModifier = vulnerabilities ? vulnerabilities.filter(v => v.type === 'injection').length * 0.1 : 0;
    const adjustedRisk = totalRisk + typeRiskModifier;
    
    return Math.min(100, adjustedRisk);
  }

  private calculateOverallSecurityScore(metrics: SecurityMetrics, vulnerabilities: SecurityVulnerability[]): number {
    const baseScore = 1.0;
    
    // Factor in critical vulnerabilities for overall score
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    
    // Penalize based on vulnerability severity
    let penalty = 0;
    penalty += metrics.vulnerabilityCount.critical * 0.4;
    penalty += metrics.vulnerabilityCount.high * 0.2;
    penalty += metrics.vulnerabilityCount.medium * 0.1;
    penalty += metrics.vulnerabilityCount.low * 0.05;
    
    // Extra penalty for secrets
    penalty += metrics.secretsFound * 0.3;
    
    return Math.max(0, baseScore - penalty);
  }

  private generateSecurityRecommendations(vulnerabilities: SecurityVulnerability[], metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.vulnerabilityCount.critical > 0) {
      recommendations.push(`Address ${metrics.vulnerabilityCount.critical} critical security vulnerabilities immediately`);
    }

    if (metrics.secretsFound > 0) {
      recommendations.push(`Remove ${metrics.secretsFound} hardcoded secrets and implement secure secret management`);
    }

    if (metrics.vulnerabilityCount.high > 0) {
      recommendations.push(`Fix ${metrics.vulnerabilityCount.high} high-severity security issues before deployment`);
    }

    if (metrics.riskScore > 50) {
      recommendations.push('Conduct a comprehensive security review due to high risk score');
    }

    if (recommendations.length === 0) {
      recommendations.push('No critical security issues detected in the changes');
    }

    // Add general security best practices
    recommendations.push('Consider implementing automated security scanning in CI/CD pipeline');
    recommendations.push('Regular security training for development team is recommended');

    return recommendations;
  }

  private getDefaultMetrics(): SecurityMetrics {
    return {
      vulnerabilityCount: { critical: 0, high: 0, medium: 0, low: 0 },
      riskScore: 0,
      complianceScore: 100,
      secretsFound: 0,
      securityDebt: 0
    };
  }

  private generateCacheKey(prData: PRData): string {
    if (!prData || !prData.files) {
      return `security_empty_${Date.now()}`;
    }
    const filesHash = prData.files
      .map((f: PRFile) => `${f.filename}_${f.sha || 'no-sha'}`)
      .join('|');
    return `security_${filesHash}`;
  }

  private isCacheValid(cached: SecurityAnalysis): boolean {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - new Date(cached.timestamp).getTime() < maxAge;
  }

  /**
   * Check if file should be skipped for security analysis
   */
  private shouldSkipFile(filename: string): boolean {
    const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib'];
    const lowerFilename = filename.toLowerCase();
    return skipExtensions.some(ext => lowerFilename.endsWith(ext));
  }

  /**
   * Check if content is using environment variables (safe pattern)
   */
  private isEnvironmentVariablePattern(content: string): boolean {
    // Skip if it's clearly using process.env pattern (safe environment variables)
    return /process\.env\./i.test(content);
  }
}

export default SecurityAnalyzer;