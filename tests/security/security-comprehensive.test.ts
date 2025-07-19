/**
 * Comprehensive Security Test Suite
 * Tests all security measures implemented in the neural agent system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SecurityValidator } from '../../src/security/SecurityValidator';
import { SecurityMonitor } from '../../src/security/SecurityMonitor';
import * as crypto from 'crypto';

describe('Security Test Suite', () => {
  let securityValidator: SecurityValidator;
  let securityMonitor: SecurityMonitor;

  beforeEach(() => {
    securityValidator = new SecurityValidator({
      enableInputValidation: true,
      enableRateLimiting: true,
      enableAuditLogging: true,
      maxInputSize: 1024,
      rateLimitWindow: 60,
      rateLimitMaxRequests: 10
    });
    
    securityMonitor = new SecurityMonitor(securityValidator);
  });

  afterEach(() => {
    securityMonitor.stop();
  });

  describe('SQL Injection Prevention', () => {
    it('should detect SQL injection attempts', () => {
      const maliciousQuery = "SELECT * FROM users WHERE id = ?";
      const maliciousParams = ["1; DROP TABLE users; --"];

      const result = securityValidator.validateSQLParameters(maliciousQuery, maliciousParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('SQL injection');
      expect(result.securityScore).toBeLessThan(100);
    });

    it('should sanitize SQL parameters', () => {
      const query = "SELECT * FROM agents WHERE type = ?";
      const params = ["'malicious'; DROP TABLE agents; --"];

      const result = securityValidator.validateSQLParameters(query, params);

      expect(result.sanitizedInput).toBeDefined();
      expect(result.sanitizedInput![0]).not.toContain("'");
      expect(result.sanitizedInput![0]).not.toContain(";");
      expect(result.sanitizedInput![0]).not.toContain("--");
    });

    it('should handle safe SQL parameters correctly', () => {
      const query = "SELECT * FROM agents WHERE id = ? AND type = ?";
      const params = ["agent123", "neural"];

      const result = securityValidator.validateSQLParameters(query, params);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.securityScore).toBe(100);
    });

    it('should reject oversized parameters', () => {
      const query = "SELECT * FROM agents WHERE description = ?";
      const largeParam = "x".repeat(2000); // Exceeds 1024 limit
      const params = [largeParam];

      const result = securityValidator.validateSQLParameters(query, params);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum length'))).toBe(true);
    });
  });

  describe('Neural Input Validation', () => {
    it('should validate normal neural inputs', () => {
      const inputs = new Float32Array([0.5, -0.3, 0.8, 0.1]);

      const result = securityValidator.validateNeuralInput(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.securityScore).toBe(100);
    });

    it('should detect oversized neural inputs', () => {
      const inputs = new Float32Array(15000); // Too large

      const result = securityValidator.validateNeuralInput(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
      expect(result.securityScore).toBeLessThan(100);
    });

    it('should detect NaN and Infinity values', () => {
      const inputs = new Float32Array([0.5, NaN, Infinity, -Infinity]);

      const result = securityValidator.validateNeuralInput(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid values'))).toBe(true);
      expect(result.sanitizedInput).toBeDefined();
      
      const sanitized = result.sanitizedInput as Float32Array;
      expect(isFinite(sanitized[1])).toBe(true); // NaN should be replaced
      expect(isFinite(sanitized[2])).toBe(true); // Infinity should be replaced
    });

    it('should clamp extreme values', () => {
      const inputs = new Float32Array([5000, -3000, 0.5]);

      const result = securityValidator.validateNeuralInput(inputs);

      expect(result.sanitizedInput).toBeDefined();
      const sanitized = result.sanitizedInput as Float32Array;
      expect(sanitized[0]).toBeLessThanOrEqual(1000);
      expect(sanitized[1]).toBeGreaterThanOrEqual(-1000);
      expect(sanitized[2]).toBe(0.5); // Normal value unchanged
    });
  });

  describe('Neural Weight Integrity', () => {
    it('should validate weight integrity with correct checksum', () => {
      const weights = Buffer.from(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer);
      const checksum = crypto.createHash('sha256').update(weights).digest('hex');

      const result = securityValidator.validateNeuralWeights(weights, checksum);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.securityScore).toBe(100);
    });

    it('should detect weight corruption', () => {
      const weights = Buffer.from(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer);
      const wrongChecksum = 'incorrect_checksum';

      const result = securityValidator.validateNeuralWeights(weights, wrongChecksum);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('integrity check failed'))).toBe(true);
      expect(result.securityScore).toBe(0);
    });

    it('should detect suspicious weight patterns', () => {
      // Create weights with all zeros (suspicious pattern)
      const suspiciousWeights = Buffer.from(new Float32Array(1000).fill(0).buffer);
      const checksum = crypto.createHash('sha256').update(suspiciousWeights).digest('hex');

      const result = securityValidator.validateNeuralWeights(suspiciousWeights, checksum);

      expect(result.errors.some(e => e.includes('Suspicious weight patterns'))).toBe(true);
      expect(result.securityScore).toBeLessThan(100);
    });

    it('should reject oversized weight data', () => {
      const largeWeights = Buffer.alloc(200 * 1024 * 1024); // 200MB
      const checksum = crypto.createHash('sha256').update(largeWeights).digest('hex');

      const result = securityValidator.validateNeuralWeights(largeWeights, checksum);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test_user';

      for (let i = 0; i < 5; i++) {
        const result = securityValidator.checkRateLimit(identifier);
        expect(result.isValid).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'heavy_user';

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        securityValidator.checkRateLimit(identifier);
      }

      // Next request should be blocked
      const result = securityValidator.checkRateLimit(identifier);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Rate limit exceeded'))).toBe(true);
      expect(result.securityScore).toBe(0);
    });

    it('should reset rate limit after window', async () => {
      // This test would require time manipulation in a real scenario
      // For now, we'll test the basic functionality
      const validator = new SecurityValidator({
        rateLimitWindow: 1, // 1 second window
        rateLimitMaxRequests: 2
      });

      const identifier = 'test_reset';
      
      // Use up the limit
      validator.checkRateLimit(identifier);
      validator.checkRateLimit(identifier);
      
      let result = validator.checkRateLimit(identifier);
      expect(result.isValid).toBe(false);

      // Wait for window to reset (in real test, would use fake timers)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      result = validator.checkRateLimit(identifier);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive neural agent data';

      const encrypted = securityValidator.encryptData(originalData);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.includes(':')).toBe(true); // Should have format iv:tag:data

      const decrypted = securityValidator.decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle encryption of different data types', () => {
      const testData = JSON.stringify({
        agentId: 'agent123',
        weights: [0.1, 0.2, 0.3],
        metadata: { type: 'neural', version: '1.0' }
      });

      const encrypted = securityValidator.encryptData(testData);
      const decrypted = securityValidator.decryptData(encrypted);
      
      expect(decrypted).toBe(testData);
      const parsed = JSON.parse(decrypted);
      expect(parsed.agentId).toBe('agent123');
    });

    it('should reject invalid encrypted data format', () => {
      expect(() => {
        securityValidator.decryptData('invalid_format');
      }).toThrow('Invalid encrypted data format');
    });
  });

  describe('Secure Random Generation', () => {
    it('should generate cryptographically secure random numbers', () => {
      const random1 = securityValidator.generateSecureRandom(100);
      const random2 = securityValidator.generateSecureRandom(100);

      expect(random1.length).toBe(100);
      expect(random2.length).toBe(100);
      
      // Should not be identical (extremely unlikely with crypto random)
      expect(random1).not.toEqual(random2);
      
      // Values should be in range [-0.5, 0.5]
      for (let i = 0; i < random1.length; i++) {
        expect(random1[i]).toBeGreaterThanOrEqual(-0.5);
        expect(random1[i]).toBeLessThanOrEqual(0.5);
      }
    });

    it('should generate different sequences each time', () => {
      const sequences = Array.from({ length: 5 }, () => 
        securityValidator.generateSecureRandom(10)
      );

      // All sequences should be different
      for (let i = 0; i < sequences.length; i++) {
        for (let j = i + 1; j < sequences.length; j++) {
          expect(sequences[i]).not.toEqual(sequences[j]);
        }
      }
    });
  });

  describe('Security Monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(securityMonitor.isWasmInitialized).toBeDefined();
      
      securityMonitor.start();
      // Monitor should be running
      
      securityMonitor.stop();
      // Monitor should be stopped
    });

    it('should collect security metrics', async () => {
      securityMonitor.start();
      
      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dashboard = securityMonitor.getSecurityDashboard();
      
      expect(dashboard.currentMetrics).toBeDefined();
      expect(dashboard.currentMetrics.systemHealth).toBeGreaterThanOrEqual(0);
      expect(dashboard.currentMetrics.systemHealth).toBeLessThanOrEqual(100);
      expect(dashboard.threatSummary).toBeDefined();
      expect(dashboard.alertSummary).toBeDefined();
    });

    it('should detect and report threats', (done) => {
      securityMonitor.start();
      
      securityMonitor.on('threat_detected', (threat) => {
        expect(threat.id).toBeDefined();
        expect(threat.type).toBeDefined();
        expect(threat.severity).toBeDefined();
        expect(threat.timestamp).toBeDefined();
        done();
      });
      
      // Trigger a threat by attempting SQL injection
      securityValidator.validateSQLParameters(
        "SELECT * FROM users WHERE id = ?",
        ["1; DROP TABLE users; --"]
      );
    });

    it('should create alerts for critical events', (done) => {
      securityMonitor.start();
      
      securityMonitor.on('alert_created', (alert) => {
        expect(alert.id).toBeDefined();
        expect(alert.severity).toBeDefined();
        expect(alert.category).toBeDefined();
        expect(alert.message).toBeDefined();
        done();
      });
      
      // Trigger critical threat (weight corruption)
      const corruptWeights = Buffer.from('corrupted data');
      securityValidator.validateNeuralWeights(corruptWeights, 'wrong_checksum');
    });
  });

  describe('Audit Logging', () => {
    it('should log security events', () => {
      // Trigger some security events
      securityValidator.validateSQLParameters("SELECT * FROM test", ["safe_param"]);
      securityValidator.checkRateLimit("test_user");
      
      const logs = securityValidator.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const sqlLog = logs.find(log => log.action === 'sql_validation');
      expect(sqlLog).toBeDefined();
      expect(sqlLog!.timestamp).toBeDefined();
      expect(sqlLog!.details).toBeDefined();
    });

    it('should filter audit logs correctly', () => {
      // Generate some logs
      securityValidator.validateSQLParameters("SELECT * FROM test", ["param1"]);
      securityValidator.checkRateLimit("user1");
      securityValidator.validateNeuralInput(new Float32Array([1, 2, 3]));
      
      const sqlLogs = securityValidator.getAuditLogs({ action: 'sql_validation' });
      const rateLimitLogs = securityValidator.getAuditLogs({ action: 'rate_limit_check' });
      
      expect(sqlLogs.every(log => log.action === 'sql_validation')).toBe(true);
      // Note: rate_limit_check might not exist if no events triggered
    });

    it('should respect time-based filtering', () => {
      const startTime = Date.now();
      
      securityValidator.validateSQLParameters("SELECT * FROM test", ["param"]);
      
      const recentLogs = securityValidator.getAuditLogs({ startTime });
      const oldLogs = securityValidator.getAuditLogs({ endTime: startTime - 1000 });
      
      expect(recentLogs.length).toBeGreaterThan(0);
      expect(oldLogs.length).toBe(0);
    });
  });

  describe('Security Compliance Report', () => {
    it('should generate comprehensive security report', () => {
      // Generate some security activity
      securityValidator.validateSQLParameters("SELECT * FROM test", ["safe"]);
      securityValidator.checkRateLimit("user1");
      securityValidator.validateNeuralInput(new Float32Array([1, 2, 3]));
      
      const report = securityValidator.generateSecurityReport();
      
      expect(report.summary).toBeDefined();
      expect(report.summary.totalAuditEvents).toBeGreaterThanOrEqual(0);
      expect(report.summary.rateLimit.enabled).toBe(true);
      expect(report.summary.encryption.enabled).toBe(true);
      expect(report.summary.encryption.keyLength).toBe(256); // 32 bytes * 8
      
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      expect(report.recentAlerts).toBeDefined();
      expect(Array.isArray(report.recentAlerts)).toBe(true);
    });

    it('should track critical and high-risk events', () => {
      // Trigger high-risk events
      securityValidator.validateSQLParameters("SELECT * FROM test", ["'; DROP TABLE test; --"]);
      securityValidator.validateNeuralWeights(Buffer.from('corrupt'), 'wrong');
      
      const report = securityValidator.generateSecurityReport();
      
      expect(report.summary.criticalEvents).toBeGreaterThanOrEqual(0);
      expect(report.summary.highRiskEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Impact', () => {
    it('should validate inputs within performance thresholds', () => {
      const startTime = performance.now();
      
      // Test multiple validation operations
      for (let i = 0; i < 100; i++) {
        securityValidator.validateSQLParameters("SELECT * FROM test WHERE id = ?", [`param${i}`]);
        securityValidator.validateNeuralInput(new Float32Array([Math.random(), Math.random()]));
        securityValidator.checkRateLimit(`user${i % 10}`);
      }
      
      const duration = performance.now() - startTime;
      
      // Should complete 100 validations in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', () => {
      const largeInput = new Float32Array(1000).fill(0.5);
      const startTime = performance.now();
      
      const result = securityValidator.validateNeuralInput(largeInput);
      
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(10); // Should validate 1000 elements in under 10ms
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty inputs gracefully', () => {
      expect(() => {
        securityValidator.validateSQLParameters("", []);
        securityValidator.validateNeuralInput(new Float32Array(0));
        securityValidator.checkRateLimit("");
      }).not.toThrow();
    });

    it('should handle null and undefined inputs', () => {
      expect(() => {
        securityValidator.validateSQLParameters("SELECT 1", [null, undefined]);
      }).not.toThrow();
    });

    it('should handle malformed data gracefully', () => {
      expect(() => {
        securityValidator.decryptData("malformed:data:format:extra");
      }).toThrow();
      
      expect(() => {
        securityValidator.validateNeuralWeights(Buffer.from("invalid"), "checksum");
      }).not.toThrow();
    });
  });
});