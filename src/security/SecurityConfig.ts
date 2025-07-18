/**
 * Security Configuration and Policy Management
 * Centralized security settings for the neural agent system
 */

export interface SecurityPolicy {
  // Input Validation
  maxInputSize: number;
  maxNeuralInputElements: number;
  maxWeightFileSize: number;
  allowedFileTypes: string[];
  
  // Authentication & Authorization
  enableAuthentication: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  accountLockoutDuration: number; // minutes
  
  // Rate Limiting
  enableRateLimiting: boolean;
  globalRateLimit: { window: number; maxRequests: number };
  endpointRateLimits: { [endpoint: string]: { window: number; maxRequests: number } };
  
  // Encryption
  enableEncryption: boolean;
  encryptionAlgorithm: 'aes-256-gcm' | 'aes-256-cbc';
  keyRotationInterval: number; // hours
  
  // Audit Logging
  enableAuditLogging: boolean;
  logLevel: 'low' | 'medium' | 'high' | 'verbose';
  logRetentionDays: number;
  logCriticalEventsOnly: boolean;
  
  // Network Security
  enableCORS: boolean;
  allowedOrigins: string[];
  enableCSP: boolean;
  cspDirectives: { [directive: string]: string[] };
  
  // Data Protection
  enableDataSanitization: boolean;
  enableChecksumValidation: boolean;
  enforceDataIntegrity: boolean;
  
  // Threat Detection
  enableThreatDetection: boolean;
  threatDetectionSensitivity: 'low' | 'medium' | 'high';
  autoMitigationEnabled: boolean;
  alertingEnabled: boolean;
  
  // Memory Security
  enableMemoryProtection: boolean;
  maxMemoryPerAgent: number; // bytes
  enableMemoryEncryption: boolean;
  
  // WASM Security
  enableWasmSandboxing: boolean;
  wasmMemoryLimit: number; // bytes
  enableSIMDValidation: boolean;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  // Input Validation
  maxInputSize: 1024 * 1024, // 1MB
  maxNeuralInputElements: 10000,
  maxWeightFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['.bin', '.wasm', '.json'],
  
  // Authentication & Authorization
  enableAuthentication: true,
  sessionTimeout: 30, // 30 minutes
  maxLoginAttempts: 5,
  accountLockoutDuration: 15, // 15 minutes
  
  // Rate Limiting
  enableRateLimiting: true,
  globalRateLimit: { window: 60, maxRequests: 100 }, // 100 requests per minute
  endpointRateLimits: {
    '/api/agent/spawn': { window: 60, maxRequests: 10 },
    '/api/agent/train': { window: 300, maxRequests: 5 }, // 5 training sessions per 5 minutes
    '/api/agent/inference': { window: 60, maxRequests: 1000 },
    '/api/weights/save': { window: 60, maxRequests: 20 },
    '/api/weights/load': { window: 60, maxRequests: 50 }
  },
  
  // Encryption
  enableEncryption: true,
  encryptionAlgorithm: 'aes-256-gcm',
  keyRotationInterval: 24, // 24 hours
  
  // Audit Logging
  enableAuditLogging: true,
  logLevel: 'medium',
  logRetentionDays: 30,
  logCriticalEventsOnly: false,
  
  // Network Security
  enableCORS: true,
  allowedOrigins: ['http://localhost:3000', 'https://sasi-neural.app'],
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'"], // unsafe-eval needed for WASM
    'worker-src': ["'self'", 'blob:'],
    'wasm-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': ["'self'", 'ws:', 'wss:']
  },
  
  // Data Protection
  enableDataSanitization: true,
  enableChecksumValidation: true,
  enforceDataIntegrity: true,
  
  // Threat Detection
  enableThreatDetection: true,
  threatDetectionSensitivity: 'medium',
  autoMitigationEnabled: true,
  alertingEnabled: true,
  
  // Memory Security
  enableMemoryProtection: true,
  maxMemoryPerAgent: 50 * 1024 * 1024, // 50MB
  enableMemoryEncryption: false, // Performance impact
  
  // WASM Security
  enableWasmSandboxing: true,
  wasmMemoryLimit: 64 * 1024 * 1024, // 64MB
  enableSIMDValidation: true
};

export const PRODUCTION_SECURITY_POLICY: SecurityPolicy = {
  ...DEFAULT_SECURITY_POLICY,
  
  // Stricter production settings
  maxInputSize: 512 * 1024, // 512KB
  maxNeuralInputElements: 5000,
  maxWeightFileSize: 50 * 1024 * 1024, // 50MB
  
  sessionTimeout: 15, // 15 minutes
  maxLoginAttempts: 3,
  accountLockoutDuration: 30, // 30 minutes
  
  globalRateLimit: { window: 60, maxRequests: 50 }, // Stricter rate limit
  endpointRateLimits: {
    '/api/agent/spawn': { window: 60, maxRequests: 5 },
    '/api/agent/train': { window: 300, maxRequests: 2 },
    '/api/agent/inference': { window: 60, maxRequests: 500 },
    '/api/weights/save': { window: 60, maxRequests: 10 },
    '/api/weights/load': { window: 60, maxRequests: 25 }
  },
  
  logLevel: 'high',
  logRetentionDays: 90,
  
  threatDetectionSensitivity: 'high',
  enableMemoryEncryption: true,
  
  maxMemoryPerAgent: 25 * 1024 * 1024, // 25MB
  wasmMemoryLimit: 32 * 1024 * 1024 // 32MB
};

export const DEVELOPMENT_SECURITY_POLICY: SecurityPolicy = {
  ...DEFAULT_SECURITY_POLICY,
  
  // Relaxed development settings
  enableAuthentication: false, // Disabled for development
  enableRateLimiting: false,
  
  allowedOrigins: ['*'], // Allow all origins in development
  
  logLevel: 'verbose',
  logRetentionDays: 7,
  
  threatDetectionSensitivity: 'low',
  autoMitigationEnabled: false, // Manual review in development
  
  maxMemoryPerAgent: 100 * 1024 * 1024, // 100MB
  wasmMemoryLimit: 128 * 1024 * 1024 // 128MB
};

export class SecurityConfigManager {
  private currentPolicy: SecurityPolicy;
  private environment: 'development' | 'testing' | 'production';

  constructor(environment: 'development' | 'testing' | 'production' = 'development') {
    this.environment = environment;
    this.currentPolicy = this.getDefaultPolicyForEnvironment();
  }

  /**
   * Get the default security policy for the current environment
   */
  private getDefaultPolicyForEnvironment(): SecurityPolicy {
    switch (this.environment) {
      case 'production':
        return { ...PRODUCTION_SECURITY_POLICY };
      case 'development':
        return { ...DEVELOPMENT_SECURITY_POLICY };
      case 'testing':
        return {
          ...DEFAULT_SECURITY_POLICY,
          enableAuditLogging: false, // Reduce noise in tests
          logLevel: 'low',
          threatDetectionSensitivity: 'low'
        };
      default:
        return { ...DEFAULT_SECURITY_POLICY };
    }
  }

  /**
   * Get the current security policy
   */
  getPolicy(): SecurityPolicy {
    return { ...this.currentPolicy };
  }

  /**
   * Update specific security settings
   */
  updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.currentPolicy = { ...this.currentPolicy, ...updates };
    console.log('🔒 Security policy updated:', Object.keys(updates));
  }

  /**
   * Reset to default policy for current environment
   */
  resetToDefault(): void {
    this.currentPolicy = this.getDefaultPolicyForEnvironment();
    console.log('🔒 Security policy reset to default for environment:', this.environment);
  }

  /**
   * Validate a security policy configuration
   */
  validatePolicy(policy: Partial<SecurityPolicy>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate input size limits
    if (policy.maxInputSize && policy.maxInputSize > 10 * 1024 * 1024) {
      errors.push('maxInputSize exceeds 10MB limit');
    }

    if (policy.maxNeuralInputElements && policy.maxNeuralInputElements > 100000) {
      errors.push('maxNeuralInputElements exceeds 100k limit');
    }

    if (policy.maxWeightFileSize && policy.maxWeightFileSize > 1024 * 1024 * 1024) {
      errors.push('maxWeightFileSize exceeds 1GB limit');
    }

    // Validate session settings
    if (policy.sessionTimeout && (policy.sessionTimeout < 1 || policy.sessionTimeout > 1440)) {
      errors.push('sessionTimeout must be between 1 and 1440 minutes');
    }

    if (policy.maxLoginAttempts && (policy.maxLoginAttempts < 1 || policy.maxLoginAttempts > 10)) {
      errors.push('maxLoginAttempts must be between 1 and 10');
    }

    // Validate rate limiting
    if (policy.globalRateLimit) {
      if (policy.globalRateLimit.window < 1 || policy.globalRateLimit.window > 3600) {
        errors.push('globalRateLimit window must be between 1 and 3600 seconds');
      }
      if (policy.globalRateLimit.maxRequests < 1 || policy.globalRateLimit.maxRequests > 10000) {
        errors.push('globalRateLimit maxRequests must be between 1 and 10000');
      }
    }

    // Validate memory limits
    if (policy.maxMemoryPerAgent && policy.maxMemoryPerAgent > 1024 * 1024 * 1024) {
      errors.push('maxMemoryPerAgent exceeds 1GB limit');
    }

    if (policy.wasmMemoryLimit && policy.wasmMemoryLimit > 512 * 1024 * 1024) {
      errors.push('wasmMemoryLimit exceeds 512MB limit');
    }

    // Validate key rotation interval
    if (policy.keyRotationInterval && (policy.keyRotationInterval < 1 || policy.keyRotationInterval > 168)) {
      errors.push('keyRotationInterval must be between 1 and 168 hours (1 week)');
    }

    // Validate log retention
    if (policy.logRetentionDays && (policy.logRetentionDays < 1 || policy.logRetentionDays > 365)) {
      errors.push('logRetentionDays must be between 1 and 365 days');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get rate limit for a specific endpoint
   */
  getRateLimitForEndpoint(endpoint: string): { window: number; maxRequests: number } {
    const endpointLimits = this.currentPolicy.endpointRateLimits[endpoint];
    return endpointLimits || this.currentPolicy.globalRateLimit;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof SecurityPolicy): boolean {
    const value = this.currentPolicy[feature];
    return typeof value === 'boolean' ? value : true;
  }

  /**
   * Get CSP header value
   */
  getCSPHeader(): string {
    if (!this.currentPolicy.enableCSP) {
      return '';
    }

    const directives = Object.entries(this.currentPolicy.cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    return directives;
  }

  /**
   * Get CORS configuration
   */
  getCORSConfig(): { origin: string[] | boolean; credentials: boolean } {
    if (!this.currentPolicy.enableCORS) {
      return { origin: false, credentials: false };
    }

    const origins = this.currentPolicy.allowedOrigins;
    return {
      origin: origins.includes('*') ? true : origins,
      credentials: true
    };
  }

  /**
   * Export current policy for backup/restore
   */
  exportPolicy(): string {
    return JSON.stringify(this.currentPolicy, null, 2);
  }

  /**
   * Import policy from JSON string
   */
  importPolicy(policyJson: string): { success: boolean; error?: string } {
    try {
      const policy = JSON.parse(policyJson) as SecurityPolicy;
      const validation = this.validatePolicy(policy);
      
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      this.currentPolicy = policy;
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Get security recommendations based on current environment
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.environment === 'production') {
      if (!this.currentPolicy.enableAuthentication) {
        recommendations.push('Enable authentication for production environment');
      }
      if (!this.currentPolicy.enableRateLimiting) {
        recommendations.push('Enable rate limiting for production environment');
      }
      if (this.currentPolicy.allowedOrigins.includes('*')) {
        recommendations.push('Restrict CORS origins for production environment');
      }
      if (!this.currentPolicy.enableEncryption) {
        recommendations.push('Enable encryption for production environment');
      }
      if (this.currentPolicy.logLevel === 'low') {
        recommendations.push('Use medium or high log level for production monitoring');
      }
    }

    if (this.currentPolicy.maxMemoryPerAgent > 100 * 1024 * 1024) {
      recommendations.push('Consider reducing maxMemoryPerAgent for better resource management');
    }

    if (!this.currentPolicy.enableChecksumValidation) {
      recommendations.push('Enable checksum validation for data integrity');
    }

    if (!this.currentPolicy.enableThreatDetection) {
      recommendations.push('Enable threat detection for security monitoring');
    }

    return recommendations;
  }
}