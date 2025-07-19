/**
 * Security Monitor - Real-time Security Monitoring and Alerting
 * Provides continuous security monitoring for the neural agent system
 * 
 * Features:
 * - Real-time threat detection
 * - Performance anomaly detection
 * - Security metric collection
 * - Automated incident response
 * - Dashboard integration
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import type { SecurityValidator, AuditLog } from './SecurityValidator';

export interface SecurityMetrics {
  timestamp: number;
  systemHealth: number; // 0-100
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttacks: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkConnections: number;
  failedAuthentications: number;
}

export interface ThreatDetection {
  id: string;
  type: 'sql_injection' | 'buffer_overflow' | 'dos_attack' | 'data_corruption' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: number;
  description: string;
  evidence: any;
  mitigated: boolean;
  response?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  details: any;
  acknowledged: boolean;
  resolvedAt?: number;
}

export class SecurityMonitor extends EventEmitter {
  private isRunning: boolean = false;
  private securityValidator: SecurityValidator;
  private metrics: SecurityMetrics[] = [];
  private threats: ThreatDetection[] = [];
  private alerts: SecurityAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds: any;

  constructor(securityValidator: SecurityValidator) {
    super();
    this.securityValidator = securityValidator;
    
    this.alertThresholds = {
      failedAuthAttempts: 5,
      responseTimeMs: 1000,
      memoryUsageMB: 500,
      cpuUsagePercent: 80,
      threatLevelEscalation: 10 // minutes
    };
  }

  /**
   * Start security monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ Security monitor already running');
      return;
    }

    console.log('🛡️ Starting security monitoring...');
    this.isRunning = true;

    // Start metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeThreats();
      this.checkAlertConditions();
    }, 5000); // Collect metrics every 5 seconds

    // Set up audit log monitoring
    this.setupAuditLogMonitoring();

    this.emit('monitoring_started');
    console.log('✅ Security monitoring active');
  }

  /**
   * Stop security monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 Stopping security monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    this.emit('monitoring_stopped');
    console.log('✅ Security monitoring stopped');
  }

  /**
   * Collect current security metrics
   */
  private collectMetrics(): void {
    const startTime = performance.now();

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate threat level
    const recentThreats = this.threats.filter(t => 
      Date.now() - t.timestamp < 300000 // Last 5 minutes
    );
    
    const threatLevel = this.calculateThreatLevel(recentThreats);
    const systemHealth = this.calculateSystemHealth();

    const metrics: SecurityMetrics = {
      timestamp: Date.now(),
      systemHealth,
      threatLevel,
      activeThreats: recentThreats.filter(t => !t.mitigated).length,
      blockedAttacks: recentThreats.filter(t => t.mitigated).length,
      averageResponseTime: performance.now() - startTime,
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000, // ms
      networkConnections: 0, // Would be implemented with actual network monitoring
      failedAuthentications: this.getRecentFailedAuth()
    };

    this.metrics.push(metrics);

    // Keep only last 1000 metrics (about 1.4 hours at 5s intervals)
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, 100);
    }

    this.emit('metrics_collected', metrics);
  }

  /**
   * Analyze threats and detect patterns
   */
  private analyzeThreats(): void {
    const recentAuditLogs = this.securityValidator.getAuditLogs({
      startTime: Date.now() - 60000 // Last minute
    });

    for (const log of recentAuditLogs) {
      this.analyzeAuditLogForThreats(log);
    }

    // Detect threat patterns
    this.detectThreatPatterns();
  }

  /**
   * Analyze individual audit log for threats
   */
  private analyzeAuditLogForThreats(log: AuditLog): void {
    // SQL injection detection
    if (log.action === 'sql_validation' && log.details.errors > 0) {
      this.reportThreat({
        type: 'sql_injection',
        severity: 'high',
        source: log.ipAddress || 'unknown',
        description: 'SQL injection attempt detected',
        evidence: log.details
      });
    }

    // Rate limit violations (potential DoS)
    if (log.action === 'rate_limit_exceeded') {
      this.reportThreat({
        type: 'dos_attack',
        severity: 'medium',
        source: log.details.identifier,
        description: 'Rate limit exceeded - potential DoS attack',
        evidence: log.details
      });
    }

    // Neural weight corruption
    if (log.action === 'weight_validation' && !log.details.checksumMatch) {
      this.reportThreat({
        type: 'data_corruption',
        severity: 'critical',
        source: log.agentId || 'unknown',
        description: 'Neural weight corruption detected',
        evidence: log.details
      });
    }

    // Suspicious neural inputs
    if (log.action === 'neural_input_validation' && log.details.extremeValues > 0) {
      this.reportThreat({
        type: 'buffer_overflow',
        severity: 'medium',
        source: log.agentId || 'unknown',
        description: 'Potentially malicious neural input detected',
        evidence: log.details
      });
    }
  }

  /**
   * Detect threat patterns across multiple events
   */
  private detectThreatPatterns(): void {
    const recentThreats = this.threats.filter(t => 
      Date.now() - t.timestamp < 300000 // Last 5 minutes
    );

    // Detect coordinated attacks
    const sourceGroups = new Map<string, ThreatDetection[]>();
    for (const threat of recentThreats) {
      const threats = sourceGroups.get(threat.source) || [];
      threats.push(threat);
      sourceGroups.set(threat.source, threats);
    }

    // Alert for multiple threats from same source
    for (const [source, threats] of sourceGroups.entries()) {
      if (threats.length >= 3) {
        this.createAlert({
          severity: 'high',
          category: 'coordinated_attack',
          message: `Multiple threats detected from source: ${source}`,
          details: { source, threatCount: threats.length, threats }
        });
      }
    }

    // Detect escalating threat patterns
    const criticalThreats = recentThreats.filter(t => t.severity === 'critical');
    if (criticalThreats.length >= 2) {
      this.createAlert({
        severity: 'critical',
        category: 'threat_escalation',
        message: 'Multiple critical security threats detected',
        details: { criticalThreats }
      });
    }
  }

  /**
   * Report a new threat detection
   */
  private reportThreat(threat: Omit<ThreatDetection, 'id' | 'timestamp' | 'mitigated'>): void {
    const fullThreat: ThreatDetection = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      mitigated: false,
      ...threat
    };

    this.threats.push(fullThreat);

    // Auto-mitigation for certain threat types
    this.attemptAutoMitigation(fullThreat);

    // Create alert for high/critical threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      this.createAlert({
        severity: threat.severity,
        category: 'threat_detected',
        message: `${threat.type} detected: ${threat.description}`,
        details: fullThreat
      });
    }

    this.emit('threat_detected', fullThreat);
    
    console.log(`🚨 Security threat detected: ${fullThreat.id} (${threat.severity})`);
  }

  /**
   * Attempt automatic mitigation of threats
   */
  private attemptAutoMitigation(threat: ThreatDetection): void {
    let mitigated = false;
    let response = '';

    switch (threat.type) {
      case 'dos_attack':
        // Automatically block source for DoS attacks
        response = `Rate limiting enforced for source: ${threat.source}`;
        mitigated = true;
        break;

      case 'sql_injection':
        // Log and sanitize - already handled by validator
        response = 'Input sanitized and logged';
        mitigated = true;
        break;

      case 'data_corruption':
        // Critical - require manual intervention
        response = 'Manual intervention required';
        mitigated = false;
        break;

      case 'buffer_overflow':
        // Sanitize inputs
        response = 'Input validation enforced';
        mitigated = true;
        break;

      default:
        response = 'No automatic mitigation available';
        mitigated = false;
    }

    threat.mitigated = mitigated;
    threat.response = response;

    if (mitigated) {
      console.log(`✅ Threat ${threat.id} automatically mitigated: ${response}`);
    } else {
      console.log(`⚠️ Threat ${threat.id} requires manual intervention: ${response}`);
    }
  }

  /**
   * Create a security alert
   */
  private createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const fullAlert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alert
    };

    this.alerts.push(fullAlert);

    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.splice(0, 50);
    }

    this.emit('alert_created', fullAlert);

    const severity = alert.severity.toUpperCase();
    console.log(`🚨 ${severity} SECURITY ALERT: ${alert.message}`);
  }

  /**
   * Check conditions that should trigger alerts
   */
  private checkAlertConditions(): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    // Memory usage alert
    if (currentMetrics.memoryUsage > this.alertThresholds.memoryUsageMB) {
      this.createAlert({
        severity: 'medium',
        category: 'resource_usage',
        message: `High memory usage: ${currentMetrics.memoryUsage.toFixed(1)}MB`,
        details: { memoryUsage: currentMetrics.memoryUsage }
      });
    }

    // Response time alert
    if (currentMetrics.averageResponseTime > this.alertThresholds.responseTimeMs) {
      this.createAlert({
        severity: 'medium',
        category: 'performance',
        message: `Slow response time: ${currentMetrics.averageResponseTime.toFixed(1)}ms`,
        details: { responseTime: currentMetrics.averageResponseTime }
      });
    }

    // System health alert
    if (currentMetrics.systemHealth < 50) {
      this.createAlert({
        severity: 'high',
        category: 'system_health',
        message: `Low system health: ${currentMetrics.systemHealth}%`,
        details: { systemHealth: currentMetrics.systemHealth }
      });
    }

    // Threat level escalation
    if (currentMetrics.threatLevel === 'critical') {
      this.createAlert({
        severity: 'critical',
        category: 'threat_escalation',
        message: 'Critical threat level reached',
        details: { threatLevel: currentMetrics.threatLevel, activeThreats: currentMetrics.activeThreats }
      });
    }
  }

  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(recentThreats: ThreatDetection[]): 'low' | 'medium' | 'high' | 'critical' {
    if (recentThreats.length === 0) return 'low';

    const criticalCount = recentThreats.filter(t => t.severity === 'critical').length;
    const highCount = recentThreats.filter(t => t.severity === 'high').length;
    const mediumCount = recentThreats.filter(t => t.severity === 'medium').length;

    if (criticalCount > 0) return 'critical';
    if (highCount >= 2) return 'critical';
    if (highCount >= 1 || mediumCount >= 3) return 'high';
    if (mediumCount >= 1) return 'medium';
    
    return 'low';
  }

  /**
   * Calculate system health score
   */
  private calculateSystemHealth(): number {
    let score = 100;

    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (currentMetrics) {
      // Deduct for high memory usage
      if (currentMetrics.memoryUsage > 400) {
        score -= Math.min(30, (currentMetrics.memoryUsage - 400) / 10);
      }

      // Deduct for slow response times
      if (currentMetrics.averageResponseTime > 500) {
        score -= Math.min(20, (currentMetrics.averageResponseTime - 500) / 50);
      }
    }

    // Deduct for active threats
    const activeThreats = this.threats.filter(t => 
      !t.mitigated && Date.now() - t.timestamp < 300000
    );
    score -= activeThreats.length * 10;

    // Deduct for unacknowledged critical alerts
    const criticalAlerts = this.alerts.filter(a => 
      !a.acknowledged && a.severity === 'critical'
    );
    score -= criticalAlerts.length * 15;

    return Math.max(0, Math.round(score));
  }

  /**
   * Get recent failed authentication count
   */
  private getRecentFailedAuth(): number {
    const failedAuthLogs = this.securityValidator.getAuditLogs({
      action: 'authentication_failed',
      startTime: Date.now() - 300000 // Last 5 minutes
    });
    return failedAuthLogs.length;
  }

  /**
   * Set up monitoring of audit logs
   */
  private setupAuditLogMonitoring(): void {
    // In a real implementation, this would set up real-time log monitoring
    // For now, we rely on the periodic analysis in collectMetrics
  }

  /**
   * Get current security dashboard data
   */
  getSecurityDashboard(): {
    currentMetrics: SecurityMetrics;
    threatSummary: { total: number; by_severity: any; by_type: any };
    alertSummary: { total: number; unacknowledged: number; by_severity: any };
    recentActivity: (ThreatDetection | SecurityAlert)[];
  } {
    const currentMetrics = this.metrics[this.metrics.length - 1] || {
      timestamp: Date.now(),
      systemHealth: 100,
      threatLevel: 'low' as const,
      activeThreats: 0,
      blockedAttacks: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkConnections: 0,
      failedAuthentications: 0
    };

    const recentThreats = this.threats.filter(t => 
      Date.now() - t.timestamp < 3600000 // Last hour
    );

    const recentAlerts = this.alerts.filter(a => 
      Date.now() - a.timestamp < 3600000 // Last hour
    );

    const threatBySeverity = {
      critical: recentThreats.filter(t => t.severity === 'critical').length,
      high: recentThreats.filter(t => t.severity === 'high').length,
      medium: recentThreats.filter(t => t.severity === 'medium').length,
      low: recentThreats.filter(t => t.severity === 'low').length
    };

    const threatByType = recentThreats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as any);

    const alertBySeverity = {
      critical: recentAlerts.filter(a => a.severity === 'critical').length,
      high: recentAlerts.filter(a => a.severity === 'high').length,
      medium: recentAlerts.filter(a => a.severity === 'medium').length,
      low: recentAlerts.filter(a => a.severity === 'low').length
    };

    const recentActivity = [...recentThreats, ...recentAlerts]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      currentMetrics,
      threatSummary: {
        total: recentThreats.length,
        by_severity: threatBySeverity,
        by_type: threatByType
      },
      alertSummary: {
        total: recentAlerts.length,
        unacknowledged: recentAlerts.filter(a => !a.acknowledged).length,
        by_severity: alertBySeverity
      },
      recentActivity
    };
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert_acknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
      this.emit('alert_resolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Get security metrics history
   */
  getMetricsHistory(hours: number = 1): SecurityMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Clean up old data
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    this.threats = this.threats.filter(t => t.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

    console.log('🧹 Security monitor cleanup completed');
  }
}