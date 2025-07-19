/**
 * TDD Test Suite for SecurityAnalyzer
 * Comprehensive tests for AI-powered security vulnerability assessment
 */

import { SecurityAnalyzer, type SecurityConfig } from '../../../src/ai/SecurityAnalyzer';

describe('SecurityAnalyzer', () => {
  let analyzer: SecurityAnalyzer;
  let mockConfig: SecurityConfig;

  beforeEach(() => {
    mockConfig = {
      enableVulnerabilityScanning: true,
      enableComplianceChecks: true,
      enableSecretDetection: true,
      vulnerabilityThreshold: 'medium',
      complianceStandards: ['OWASP-Top10', 'CWE-Top25'],
      secretPatterns: []
    };
    analyzer = new SecurityAnalyzer(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with default config when no config provided', () => {
      const defaultAnalyzer = new SecurityAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(SecurityAnalyzer);
    });

    it('should initialize with provided config', () => {
      expect(analyzer).toBeInstanceOf(SecurityAnalyzer);
    });
  });

  describe('analyze', () => {
    const mockPRData = {
      files: [
        {
          filename: 'test.js',
          patch: `+const query = "SELECT * FROM users WHERE id = " + userId;
+document.innerHTML = userInput;`,
          sha: 'security123'
        }
      ]
    };

    it('should return analysis with overall security score', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('overall');
      expect(typeof result.overall).toBe('number');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(1);
    });

    it('should return vulnerabilities array', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('vulnerabilities');
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should return security metrics', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result.metrics).toHaveProperty('vulnerabilityCount');
      expect(result.metrics).toHaveProperty('riskScore');
      expect(result.metrics).toHaveProperty('complianceScore');
      expect(result.metrics).toHaveProperty('secretsFound');
      expect(result.metrics).toHaveProperty('securityDebt');
    });

    it('should return compliance checks', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('compliance');
      expect(Array.isArray(result.compliance)).toBe(true);
    });

    it('should include confidence score', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('confidence');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection vulnerabilities', async () => {
      const sqlInjectionCode = {
        files: [
          {
            filename: 'db.js',
            patch: `+const query = "SELECT * FROM users WHERE id = " + req.params.id;
+execute(query);`,
            sha: 'sql123'
          }
        ]
      };

      const result = await analyzer.analyze(sqlInjectionCode);
      const sqlIssues = result.vulnerabilities.filter(v => v.type === 'injection');
      
      expect(sqlIssues.length).toBeGreaterThan(0);
      expect(sqlIssues[0].severity).toBe('high');
      expect(sqlIssues[0].cwe).toBe('CWE-89');
      expect(sqlIssues[0].title).toContain('SQL Injection');
    });

    it('should not flag parameterized queries', async () => {
      const safeQuery = {
        files: [
          {
            filename: 'safe-db.js',
            patch: `+const query = "SELECT * FROM users WHERE id = ?";
+execute(query, [userId]);`,
            sha: 'safe123'
          }
        ]
      };

      const result = await analyzer.analyze(safeQuery);
      const sqlIssues = result.vulnerabilities.filter(v => 
        v.type === 'injection' && v.title.includes('SQL')
      );
      
      expect(sqlIssues.length).toBe(0);
    });
  });

  describe('XSS Detection', () => {
    it('should detect XSS vulnerabilities', async () => {
      const xssCode = {
        files: [
          {
            filename: 'view.js',
            patch: `+document.getElementById('content').innerHTML = req.body.userInput;
+eval(req.query.code);`,
            sha: 'xss123'
          }
        ]
      };

      const result = await analyzer.analyze(xssCode);
      const xssIssues = result.vulnerabilities.filter(v => v.type === 'xss');
      
      expect(xssIssues.length).toBeGreaterThan(0);
      expect(xssIssues[0].severity).toBe('high');
      expect(xssIssues[0].cwe).toBe('CWE-79');
    });

    it('should detect React dangerouslySetInnerHTML', async () => {
      const reactXSS = {
        files: [
          {
            filename: 'Component.jsx',
            patch: '+<div dangerouslySetInnerHTML={{__html: userContent}} />',
            sha: 'react-xss123'
          }
        ]
      };

      const result = await analyzer.analyze(reactXSS);
      const xssIssues = result.vulnerabilities.filter(v => v.type === 'xss');
      
      expect(xssIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Secret Detection', () => {
    it('should detect hardcoded passwords', async () => {
      const secretCode = {
        files: [
          {
            filename: 'config.js',
            patch: `+const password = "admin123456";
+const api_key = "sk_live_abcdef123456789";`,
            sha: 'secret123'
          }
        ]
      };

      const result = await analyzer.analyze(secretCode);
      const secretIssues = result.vulnerabilities.filter(v => v.type === 'secret');
      
      expect(secretIssues.length).toBeGreaterThan(0);
      expect(secretIssues[0].severity).toBe('critical');
      expect(secretIssues[0].cwe).toBe('CWE-798');
      expect(result.metrics.secretsFound).toBeGreaterThan(0);
    });

    it('should detect API keys', async () => {
      const apiKeyCode = {
        files: [
          {
            filename: 'keys.js',
            patch: '+const github_token = "ghp_1234567890abcdef1234567890abcdef123456";',
            sha: 'apikey123'
          }
        ]
      };

      const result = await analyzer.analyze(apiKeyCode);
      const secretIssues = result.vulnerabilities.filter(v => v.type === 'secret');
      
      expect(secretIssues.length).toBeGreaterThan(0);
    });

    it('should not flag environment variable usage', async () => {
      const envVarCode = {
        files: [
          {
            filename: 'env.js',
            patch: '+const password = process.env.PASSWORD;',
            sha: 'env123'
          }
        ]
      };

      const result = await analyzer.analyze(envVarCode);
      const secretIssues = result.vulnerabilities.filter(v => v.type === 'secret');
      
      expect(secretIssues.length).toBe(0);
    });
  });

  describe('Weak Cryptography Detection', () => {
    it('should detect weak hash algorithms', async () => {
      const weakCryptoCode = {
        files: [
          {
            filename: 'crypto.js',
            patch: `+const hash = md5(password);
+const digest = sha1(data);`,
            sha: 'crypto123'
          }
        ]
      };

      const result = await analyzer.analyze(weakCryptoCode);
      const cryptoIssues = result.vulnerabilities.filter(v => v.type === 'crypto');
      
      expect(cryptoIssues.length).toBeGreaterThan(0);
      expect(cryptoIssues[0].severity).toBe('medium');
      expect(cryptoIssues[0].cwe).toBe('CWE-327');
    });

    it('should detect Math.random usage for security', async () => {
      const randomCode = {
        files: [
          {
            filename: 'token.js',
            patch: '+const token = Math.random().toString();',
            sha: 'random123'
          }
        ]
      };

      const result = await analyzer.analyze(randomCode);
      const cryptoIssues = result.vulnerabilities.filter(v => v.type === 'crypto');
      
      expect(cryptoIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Issues', () => {
    it('should detect potential auth bypass', async () => {
      const authBypassCode = {
        files: [
          {
            filename: 'auth.js',
            patch: `+if (req.session.user) {
+  authenticated = true;
+}`,
            sha: 'auth123'
          }
        ]
      };

      const result = await analyzer.analyze(authBypassCode);
      const authIssues = result.vulnerabilities.filter(v => v.type === 'auth');
      
      expect(authIssues.length).toBeGreaterThan(0);
      expect(authIssues[0].severity).toBe('medium');
      expect(authIssues[0].cwe).toBe('CWE-287');
    });
  });

  describe('Path Traversal Detection', () => {
    it('should detect directory traversal attempts', async () => {
      const pathTraversalCode = {
        files: [
          {
            filename: 'file.js',
            patch: `+const filePath = req.params.path;
+readFile('../../../etc/passwd');`,
            sha: 'path123'
          }
        ]
      };

      const result = await analyzer.analyze(pathTraversalCode);
      const pathIssues = result.vulnerabilities.filter(v => v.type === 'disclosure');
      
      expect(pathIssues.length).toBeGreaterThan(0);
      expect(pathIssues[0].severity).toBe('high');
      expect(pathIssues[0].cwe).toBe('CWE-22');
    });
  });

  describe('Command Injection Detection', () => {
    it('should detect command injection vulnerabilities', async () => {
      const commandInjectionCode = {
        files: [
          {
            filename: 'cmd.js',
            patch: `+exec('ls ' + req.params.directory);
+spawn(req.body.command);`,
            sha: 'cmd123'
          }
        ]
      };

      const result = await analyzer.analyze(commandInjectionCode);
      const cmdIssues = result.vulnerabilities.filter(v => 
        v.type === 'injection' && v.title.includes('Command')
      );
      
      expect(cmdIssues.length).toBeGreaterThan(0);
      expect(cmdIssues[0].severity).toBe('critical');
      expect(cmdIssues[0].cwe).toBe('CWE-78');
    });
  });

  describe('Compliance Checks', () => {
    it('should perform OWASP Top 10 compliance checks', async () => {
      const result = await analyzer.analyze({ files: [] });
      const owaspChecks = result.compliance.filter(c => c.standard === 'OWASP-Top10');
      
      expect(owaspChecks.length).toBeGreaterThan(0);
      expect(owaspChecks[0]).toHaveProperty('requirement');
      expect(owaspChecks[0]).toHaveProperty('status');
      expect(owaspChecks[0]).toHaveProperty('details');
    });

    it('should perform CWE Top 25 compliance checks', async () => {
      const result = await analyzer.analyze({ files: [] });
      const cweChecks = result.compliance.filter(c => c.standard === 'CWE-Top25');
      
      expect(cweChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Security Metrics', () => {
    it('should calculate vulnerability counts correctly', async () => {
      const vulnerableCode = {
        files: [
          {
            filename: 'vuln.js',
            patch: `+const query = "SELECT * FROM users WHERE id = " + userId;
+const password = "admin123";
+eval(userInput);`,
            sha: 'vuln123'
          }
        ]
      };

      const result = await analyzer.analyze(vulnerableCode);
      
      expect(result.metrics.vulnerabilityCount.critical).toBeGreaterThan(0);
      expect(result.metrics.vulnerabilityCount.high).toBeGreaterThan(0);
      expect(result.metrics.riskScore).toBeGreaterThan(0);
    });

    it('should calculate security debt', async () => {
      const vulnerableCode = {
        files: [
          {
            filename: 'debt.js',
            patch: `+eval(req.body.code);
+const password = "hardcoded123";`,
            sha: 'debt123'
          }
        ]
      };

      const result = await analyzer.analyze(vulnerableCode);
      
      expect(result.metrics.securityDebt).toBeGreaterThan(0);
    });
  });

  describe('File Type Filtering', () => {
    it('should analyze code files for vulnerabilities', async () => {
      const codeFile = {
        files: [
          {
            filename: 'app.js',
            patch: '+eval(userInput);',
            sha: 'code123'
          }
        ]
      };

      const result = await analyzer.analyze(codeFile);
      
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
    });

    it('should analyze config files for secrets', async () => {
      const configFile = {
        files: [
          {
            filename: '.env',
            patch: '+PASSWORD=secret123456',
            sha: 'config123'
          }
        ]
      };

      const result = await analyzer.analyze(configFile);
      
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
    });

    it('should skip irrelevant files', async () => {
      const imageFile = {
        files: [
          {
            filename: 'image.png',
            patch: 'Binary file changed',
            sha: 'img123'
          }
        ]
      };

      const result = await analyzer.analyze(imageFile);
      
      expect(result.vulnerabilities.length).toBe(0);
    });
  });

  describe('Vulnerability Properties', () => {
    it('should ensure all vulnerabilities have required properties', async () => {
      const vulnerableCode = {
        files: [
          {
            filename: 'test.js',
            patch: '+eval(userInput);',
            sha: 'props123'
          }
        ]
      };

      const result = await analyzer.analyze(vulnerableCode);
      
      result.vulnerabilities.forEach(vuln => {
        expect(vuln).toHaveProperty('id');
        expect(vuln).toHaveProperty('type');
        expect(vuln).toHaveProperty('severity');
        expect(vuln).toHaveProperty('title');
        expect(vuln).toHaveProperty('description');
        expect(vuln).toHaveProperty('file');
        expect(vuln).toHaveProperty('line');
        expect(vuln).toHaveProperty('remediation');
        expect(vuln).toHaveProperty('confidence');
        
        expect(typeof vuln.id).toBe('string');
        expect(['injection', 'xss', 'csrf', 'auth', 'crypto', 'dos', 'disclosure', 'secret'].includes(vuln.type)).toBe(true);
        expect(['low', 'medium', 'high', 'critical'].includes(vuln.severity)).toBe(true);
        expect(typeof vuln.confidence).toBe('number');
        expect(vuln.confidence).toBeGreaterThan(0);
        expect(vuln.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Recommendations', () => {
    it('should provide security recommendations', async () => {
      const vulnerableCode = {
        files: [
          {
            filename: 'insecure.js',
            patch: `+const password = "admin123";
+eval(userInput);`,
            sha: 'rec123'
          }
        ]
      };

      const result = await analyzer.analyze(vulnerableCode);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.includes('critical') || rec.includes('security')
      )).toBe(true);
    });

    it('should provide clean code recommendations for secure code', async () => {
      const secureCode = {
        files: [
          {
            filename: 'secure.js',
            patch: '+const password = process.env.PASSWORD;',
            sha: 'secure123'
          }
        ]
      };

      const result = await analyzer.analyze(secureCode);
      
      expect(result.recommendations).toContain('No critical security issues detected in the changes');
    });
  });

  describe('Caching', () => {
    it('should cache analysis results', async () => {
      const prData = {
        files: [
          {
            filename: 'test.js',
            patch: '+const safe = "code";',
            sha: 'cache123'
          }
        ]
      };

      const result1 = await analyzer.analyze(prData);
      const result2 = await analyzer.analyze(prData);
      
      expect(result1.timestamp).toBe(result2.timestamp);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty PR gracefully', async () => {
      const result = await analyzer.analyze({ files: [] });
      
      expect(result).toHaveProperty('overall');
      expect(result.vulnerabilities).toEqual([]);
      expect(result.metrics.vulnerabilityCount.critical).toBe(0);
    });

    it('should return fallback analysis on error', async () => {
      // Simulate error by passing invalid data
      const invalidPR = null as any;
      
      const result = await analyzer.analyze(invalidPR);
      
      expect(result.overall).toBe(0.5);
      expect(result.confidence).toBe(0.1);
      expect(result.recommendations).toContain('Unable to analyze security due to errors');
    });
  });
});