/**
 * Security Validator - Input Validation and Security Hardening
 * Implements comprehensive security measures for neural agent system
 * 
 * Security Features:
 * - Input validation and sanitization
 * - SQL injection prevention
 * - Neural weight integrity validation
 * - Rate limiting and DDoS protection
 * - Audit logging and monitoring
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

export interface SecurityConfig {
  enableInputValidation: boolean;
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  maxInputSize: number;
  rateLimitWindow: number; // seconds
  rateLimitMaxRequests: number;
  encryptionKey?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: any;
  securityScore: number;
}

export interface AuditLog {
  timestamp: number;
  action: string;
  userId?: string;
  agentId?: string;
  ipAddress?: string;
  details: any;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityValidator {
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private auditLogs: AuditLog[] = [];
  private encryptionKey: Buffer;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableInputValidation: true,
      enableRateLimiting: true,
      enableAuditLogging: true,
      maxInputSize: 1024 * 1024, // 1MB
      rateLimitWindow: 60, // 1 minute
      rateLimitMaxRequests: 100,
      ...config
    };

    // Initialize encryption key
    this.encryptionKey = this.config.encryptionKey 
      ? Buffer.from(this.config.encryptionKey, 'hex')
      : crypto.randomBytes(32);
  }

  /**
   * Validate and sanitize SQL query parameters
   * Prevents SQL injection attacks
   */
  validateSQLParameters(query: string, params: any[]): ValidationResult {
    const errors: string[] = [];
    let securityScore = 100;

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|(--|\/\*|\*\/|;))/,
      /((\%27)|(\')|(--)|(\%23)|(#))/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(--)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
    ];

    for (const param of params) {
      if (typeof param === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(param)) {
            errors.push(`Potential SQL injection detected in parameter: ${param.substring(0, 50)}...`);
            securityScore -= 20;
          }
        }

        // Check for excessive length
        if (param.length > this.config.maxInputSize) {
          errors.push(`Parameter exceeds maximum length: ${param.length}`);
          securityScore -= 10;
        }
      }
    }

    // Sanitize parameters
    const sanitizedParams = params.map(param => {
      if (typeof param === 'string') {
        return param
          .replace(/['"]/g, '') // Remove quotes
          .replace(/[-;]/g, '') // Remove dangerous characters
          .substring(0, this.config.maxInputSize); // Truncate
      }
      return param;
    });

    this.auditLog('sql_validation', {
      query: query.substring(0, 100),
      paramCount: params.length,
      securityScore,
      errors: errors.length
    }, errors.length > 0 ? 'high' : 'low');

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: sanitizedParams,
      securityScore
    };
  }

  /**
   * Validate neural network input data
   * Prevents malicious neural inputs
   */
  validateNeuralInput(inputs: Float32Array | number[]): ValidationResult {
    const errors: string[] = [];
    let securityScore = 100;

    // Check input size
    if (inputs.length > 10000) {
      errors.push(`Neural input too large: ${inputs.length} elements`);
      securityScore -= 30;
    }

    // Check for NaN or Infinity values
    const invalidValues = Array.from(inputs).filter(val => !isFinite(val));
    if (invalidValues.length > 0) {
      errors.push(`Invalid values detected: ${invalidValues.length} NaN/Infinity values`);
      securityScore -= 20;
    }

    // Check for extreme values that could cause overflow
    const extremeValues = Array.from(inputs).filter(val => Math.abs(val) > 1000);
    if (extremeValues.length > 0) {
      errors.push(`Extreme values detected: ${extremeValues.length} values > 1000`);
      securityScore -= 10;
    }

    // Sanitize inputs
    const sanitizedInputs = Array.from(inputs).map(val => {
      if (!isFinite(val)) return 0;
      return Math.max(-1000, Math.min(1000, val)); // Clamp to safe range
    });

    this.auditLog('neural_input_validation', {
      inputSize: inputs.length,
      invalidValues: invalidValues.length,
      extremeValues: extremeValues.length,
      securityScore
    }, extremeValues.length > 0 ? 'medium' : 'low');

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: new Float32Array(sanitizedInputs),
      securityScore
    };
  }

  /**
   * Validate neural weight integrity with checksums
   * Prevents weight tampering
   */
  validateNeuralWeights(weights: Buffer, expectedChecksum: string): ValidationResult {
    const errors: string[] = [];
    let securityScore = 100;

    // Calculate actual checksum
    const actualChecksum = crypto.createHash('sha256').update(weights).digest('hex');

    // Verify integrity
    if (actualChecksum !== expectedChecksum) {
      errors.push('Neural weight integrity check failed - data may be corrupted or tampered');
      securityScore = 0;
    }

    // Check weight size
    if (weights.length > 100 * 1024 * 1024) { // 100MB limit
      errors.push(`Neural weights too large: ${weights.length} bytes`);
      securityScore -= 20;
    }

    // Check for patterns that might indicate malicious weights
    const suspiciousPatterns = this.detectSuspiciousWeightPatterns(weights);
    if (suspiciousPatterns.length > 0) {
      errors.push(`Suspicious weight patterns detected: ${suspiciousPatterns.join(', ')}`);
      securityScore -= 30;
    }

    this.auditLog('weight_validation', {
      weightSize: weights.length,
      checksumMatch: actualChecksum === expectedChecksum,
      suspiciousPatterns: suspiciousPatterns.length,
      securityScore
    }, actualChecksum !== expectedChecksum ? 'critical' : 'low');

    return {
      isValid: errors.length === 0,
      errors,
      securityScore
    };
  }

  /**
   * Implement rate limiting for API endpoints
   * Prevents DDoS and brute force attacks
   */
  checkRateLimit(identifier: string): ValidationResult {
    if (!this.config.enableRateLimiting) {
      return { isValid: true, errors: [], securityScore: 100 };
    }

    const now = Date.now();
    const windowStart = now - (this.config.rateLimitWindow * 1000);
    
    const requestData = this.requestCounts.get(identifier);
    
    if (!requestData || requestData.windowStart < windowStart) {
      // New window or identifier
      this.requestCounts.set(identifier, { count: 1, windowStart: now });
      return { isValid: true, errors: [], securityScore: 100 };
    }

    requestData.count++;

    if (requestData.count > this.config.rateLimitMaxRequests) {
      this.auditLog('rate_limit_exceeded', {
        identifier,
        requestCount: requestData.count,
        timeWindow: this.config.rateLimitWindow
      }, 'high');

      return {
        isValid: false,
        errors: [`Rate limit exceeded: ${requestData.count} requests in ${this.config.rateLimitWindow}s`],
        securityScore: 0
      };
    }

    const securityScore = Math.max(0, 100 - (requestData.count / this.config.rateLimitMaxRequests) * 50);

    return {
      isValid: true,
      errors: [],
      securityScore
    };
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    cipher.setAAD(Buffer.from('neural-agent-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAAD(Buffer.from('neural-agent-data'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate secure random numbers for neural operations
   */
  generateSecureRandom(count: number): Float32Array {
    const bytes = crypto.randomBytes(count * 4);
    const randomValues = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const uint32 = bytes.readUInt32BE(i * 4);
      randomValues[i] = (uint32 / 0xFFFFFFFF) - 0.5; // Convert to [-0.5, 0.5]
    }
    
    return randomValues;
  }

  /**
   * Detect suspicious patterns in neural weights
   */
  private detectSuspiciousWeightPatterns(weights: Buffer): string[] {
    const patterns: string[] = [];
    const floats = new Float32Array(weights.buffer);

    // Check for all zeros (potential memory wipe)
    const zeroCount = floats.filter(w => w === 0).length;
    if (zeroCount > floats.length * 0.9) {
      patterns.push('excessive_zeros');
    }

    // Check for all same values (potential memory corruption)
    const firstValue = floats[0];
    const sameValueCount = floats.filter(w => w === firstValue).length;
    if (sameValueCount > floats.length * 0.8) {
      patterns.push('uniform_values');
    }

    // Check for extreme values (potential overflow attack)
    const extremeCount = floats.filter(w => Math.abs(w) > 1000).length;
    if (extremeCount > floats.length * 0.1) {
      patterns.push('extreme_values');
    }

    // Check for NaN/Infinity (potential corruption)
    const invalidCount = floats.filter(w => !isFinite(w)).length;
    if (invalidCount > 0) {
      patterns.push('invalid_values');
    }

    return patterns;
  }

  /**
   * Add entry to audit log
   */
  private auditLog(action: string, details: any, securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'): void {
    if (!this.config.enableAuditLogging) return;

    const logEntry: AuditLog = {
      timestamp: Date.now(),
      action,
      details,
      securityLevel
    };

    this.auditLogs.push(logEntry);

    // Keep only last 10000 entries
    if (this.auditLogs.length > 10000) {
      this.auditLogs.splice(0, 1000);
    }

    // Log critical events immediately
    if (securityLevel === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT:', logEntry);
    } else if (securityLevel === 'high') {
      console.warn('⚠️ HIGH SECURITY EVENT:', logEntry);
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  getAuditLogs(filter?: {
    action?: string;
    securityLevel?: string;
    startTime?: number;
    endTime?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filter) {
      if (filter.action) {
        logs = logs.filter(log => log.action === filter.action);
      }
      if (filter.securityLevel) {
        logs = logs.filter(log => log.securityLevel === filter.securityLevel);
      }
      if (filter.startTime) {
        logs = logs.filter(log => log.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        logs = logs.filter(log => log.timestamp <= filter.endTime!);
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generate security compliance report
   */
  generateSecurityReport(): {
    summary: {
      totalAuditEvents: number;
      criticalEvents: number;
      highRiskEvents: number;
      rateLimit: { enabled: boolean; currentRequests: number };
      encryption: { enabled: boolean; keyLength: number };
    };
    recommendations: string[];
    recentAlerts: AuditLog[];
  } {
    const criticalEvents = this.auditLogs.filter(log => log.securityLevel === 'critical').length;
    const highRiskEvents = this.auditLogs.filter(log => log.securityLevel === 'high').length;
    const recentAlerts = this.getAuditLogs({
      startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    }).filter(log => log.securityLevel === 'high' || log.securityLevel === 'critical');

    const currentRequests = Array.from(this.requestCounts.values())
      .reduce((sum, data) => sum + data.count, 0);

    const recommendations = [
      'Implement parameterized SQL queries to prevent injection',
      'Enable mandatory checksum validation for neural weights',
      'Use cryptographically secure random number generation',
      'Implement proper WASM memory bounds checking',
      'Add input size limits for neural operations',
      'Enable comprehensive audit logging',
      'Implement session timeout and authentication',
      'Add network-level security monitoring'
    ];

    return {
      summary: {
        totalAuditEvents: this.auditLogs.length,
        criticalEvents,
        highRiskEvents,
        rateLimit: {
          enabled: this.config.enableRateLimiting,
          currentRequests
        },
        encryption: {
          enabled: true,
          keyLength: this.encryptionKey.length * 8
        }
      },
      recommendations,
      recentAlerts
    };
  }

  /**
   * Clean up old audit logs and rate limit data
   */
  cleanup(): void {
    const now = Date.now();
    const oldestAllowed = now - (7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean audit logs
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > oldestAllowed);

    // Clean rate limit data
    const windowStart = now - (this.config.rateLimitWindow * 1000);
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.windowStart < windowStart) {
        this.requestCounts.delete(key);
      }
    }
  }
}