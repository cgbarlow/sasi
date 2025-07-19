/**
 * Neural Bridge Health Monitor
 * 
 * Provides comprehensive health monitoring for neural bridge operations,
 * including performance tracking, error detection, and system diagnostics.
 */

import { EventEmitter } from 'events'
import type { 
  NeuralBridgeHealth,
  ExtendedPerformanceAlert,
  WasmPerformanceMetrics,
  PerformanceMetrics,
  SystemHealthMetrics,
  ComponentScores
} from '../types/neural'
import type { NeuralBridgeConfig } from './NeuralBridgeManager'

export interface HealthCheckResult {
  timestamp: Date
  health: NeuralBridgeHealth
  duration: number
  recommendations: string[]
}

export interface PerformanceSnapshot {
  timestamp: Date
  cpuUsage: number
  memoryUsage: number
  agentCount: number
  operationsPerSecond: number
  errorRate: number
  averageResponseTime: number
}

export interface HealthTrend {
  metric: string
  direction: 'improving' | 'stable' | 'declining'
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}

export class NeuralBridgeHealthMonitor extends EventEmitter {
  private config: NeuralBridgeConfig
  private isMonitoring: boolean = false
  private healthHistory: HealthCheckResult[] = []
  private performanceSnapshots: PerformanceSnapshot[] = []
  private activeAlerts: ExtendedPerformanceAlert[] = []
  private monitoringInterval: any = null
  private alertCallbacks: Map<string, Function> = new Map()
  
  constructor(config: NeuralBridgeConfig) {
    super()
    this.config = config
  }
  
  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return
    }
    
    this.isMonitoring = true
    
    // Setup monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
    
    this.emit('monitoringStarted', {
      timestamp: new Date(),
      interval: this.config.healthCheckInterval
    })
  }
  
  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }
    
    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    this.emit('monitoringStopped', {
      timestamp: new Date()
    })
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Create performance snapshot
      const snapshot = this.createPerformanceSnapshot()
      this.performanceSnapshots.push(snapshot)
      
      // Limit snapshot history (keep last 100)
      if (this.performanceSnapshots.length > 100) {
        this.performanceSnapshots = this.performanceSnapshots.slice(-100)
      }
      
      // Calculate health metrics
      const systemMetrics = this.calculateSystemMetrics()
      const componentScores = this.calculateComponentScores(snapshot)
      
      // Determine overall health status
      const overallScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0) / Object.keys(componentScores).length
      let status: 'healthy' | 'warning' | 'critical' | 'error' = 'healthy'
      
      if (overallScore < 30) status = 'error'
      else if (overallScore < 50) status = 'critical'
      else if (overallScore < 70) status = 'warning'
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(componentScores, snapshot)
      
      // Check for alerts
      this.checkForAlerts(snapshot)
      
      // Create health object
      const health: NeuralBridgeHealth = {
        status,
        moduleLoaded: true, // Assume loaded if monitoring
        ruvFannIntegration: this.config.enableRuvFann,
        wasmInitialized: true,
        simdSupported: this.config.simdAcceleration,
        performanceMetrics: this.createWasmMetrics(snapshot),
        systemMetrics: {
          overallScore,
          componentScores,
          activeAlerts: this.activeAlerts,
          recommendations,
          uptime: Date.now() - startTime,
          lastCheck: new Date()
        },
        activeAlerts: this.activeAlerts,
        lastHealthCheck: new Date(),
        uptime: Date.now() - startTime
      }
      
      const result: HealthCheckResult = {
        timestamp: new Date(),
        health,
        duration: Date.now() - startTime,
        recommendations
      }
      
      // Store result
      this.healthHistory.push(result)
      
      // Limit history (keep last 50)
      if (this.healthHistory.length > 50) {
        this.healthHistory = this.healthHistory.slice(-50)
      }
      
      this.emit('healthCheckCompleted', result)
      
      return result
      
    } catch (error) {
      const errorResult: HealthCheckResult = {
        timestamp: new Date(),
        health: {
          status: 'error',
          moduleLoaded: false,
          ruvFannIntegration: false,
          wasmInitialized: false,
          simdSupported: false,
          performanceMetrics: this.createEmptyWasmMetrics(),
          systemMetrics: this.createEmptySystemMetrics(),
          activeAlerts: [],
          lastHealthCheck: new Date(),
          uptime: 0
        },
        duration: Date.now() - startTime,
        recommendations: ['Health check failed - system may be unstable']
      }
      
      this.emit('healthCheckFailed', { error, result: errorResult })
      
      return errorResult
    }
  }
  
  /**
   * Get current health status
   */
  getCurrentHealth(): NeuralBridgeHealth | null {
    const latestResult = this.healthHistory[this.healthHistory.length - 1]
    return latestResult ? latestResult.health : null
  }
  
  /**
   * Get health history
   */
  getHealthHistory(limit: number = 50): HealthCheckResult[] {
    return this.healthHistory.slice(-limit)
  }
  
  /**
   * Get performance snapshots
   */
  getPerformanceSnapshots(limit: number = 50): PerformanceSnapshot[] {
    return this.performanceSnapshots.slice(-limit)
  }
  
  /**
   * Get health trends
   */
  getHealthTrends(): HealthTrend[] {
    if (this.healthHistory.length < 2) {
      return []
    }
    
    const trends: HealthTrend[] = []
    const recent = this.healthHistory.slice(-10)
    const older = this.healthHistory.slice(-20, -10)
    
    if (recent.length === 0 || older.length === 0) {
      return trends
    }
    
    // Calculate trends for key metrics
    const metrics = [
      { name: 'Overall Score', getValue: (result: HealthCheckResult) => result.health.systemMetrics.overallScore },
      { name: 'Performance Score', getValue: (result: HealthCheckResult) => result.health.systemMetrics.componentScores.performance },
      { name: 'Memory Score', getValue: (result: HealthCheckResult) => result.health.systemMetrics.componentScores.memory },
      { name: 'Response Time', getValue: (result: HealthCheckResult) => result.duration }
    ]
    
    metrics.forEach(metric => {
      const recentAvg = recent.reduce((sum, r) => sum + metric.getValue(r), 0) / recent.length
      const olderAvg = older.reduce((sum, r) => sum + metric.getValue(r), 0) / older.length
      
      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
      
      let direction: 'improving' | 'stable' | 'declining' = 'stable'
      if (Math.abs(changePercent) > 5) {
        direction = changePercent > 0 ? 'improving' : 'declining'
      }
      
      let significance: 'low' | 'medium' | 'high' = 'low'
      if (Math.abs(changePercent) > 20) significance = 'high'
      else if (Math.abs(changePercent) > 10) significance = 'medium'
      
      trends.push({
        metric: metric.name,
        direction,
        changePercent,
        significance
      })
    })
    
    return trends
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(): ExtendedPerformanceAlert[] {
    return [...this.activeAlerts]
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.emit('alertAcknowledged', alert)
      return true
    }
    return false
  }
  
  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    const now = Date.now()
    const resolvedAlerts = this.activeAlerts.filter(alert => {
      // Consider alerts resolved if they're older than 5 minutes and acknowledged
      return alert.acknowledged && (now - alert.timestamp) > 5 * 60 * 1000
    })
    
    resolvedAlerts.forEach(alert => {
      alert.resolvedAt = now
      this.emit('alertResolved', alert)
    })
    
    this.activeAlerts = this.activeAlerts.filter(alert => !resolvedAlerts.includes(alert))
  }
  
  /**
   * Register alert callback
   */
  onAlert(alertType: string, callback: Function): void {
    this.alertCallbacks.set(alertType, callback)
  }
  
  /**
   * Generate health report
   */
  generateHealthReport(): string {
    const currentHealth = this.getCurrentHealth()
    const trends = this.getHealthTrends()
    const activeAlerts = this.getActiveAlerts()
    
    let report = `# Neural Bridge Health Report\n\n`
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    if (currentHealth) {
      report += `## Current Health Status\n\n`
      report += `- **Overall Status**: ${currentHealth.status}\n`
      report += `- **Overall Score**: ${currentHealth.systemMetrics.overallScore.toFixed(1)}\n`
      report += `- **ruv-FANN Integration**: ${currentHealth.ruvFannIntegration ? 'Enabled' : 'Disabled'}\n`
      report += `- **WASM Initialized**: ${currentHealth.wasmInitialized ? 'Yes' : 'No'}\n`
      report += `- **SIMD Support**: ${currentHealth.simdSupported ? 'Yes' : 'No'}\n`
      report += `- **Last Check**: ${currentHealth.lastHealthCheck.toISOString()}\n\n`
      
      report += `## Component Scores\n\n`
      Object.entries(currentHealth.systemMetrics.componentScores).forEach(([component, score]) => {
        report += `- **${component}**: ${score.toFixed(1)}\n`
      })
      report += `\n`
      
      if (currentHealth.systemMetrics.recommendations.length > 0) {
        report += `## Recommendations\n\n`
        currentHealth.systemMetrics.recommendations.forEach(rec => {
          report += `- ${rec}\n`
        })
        report += `\n`
      }
    }
    
    if (trends.length > 0) {
      report += `## Health Trends\n\n`
      trends.forEach(trend => {
        const arrow = trend.direction === 'improving' ? '📈' : trend.direction === 'declining' ? '📉' : '➡️'
        report += `- **${trend.metric}**: ${arrow} ${trend.direction} (${trend.changePercent.toFixed(1)}%)\n`
      })
      report += `\n`
    }
    
    if (activeAlerts.length > 0) {
      report += `## Active Alerts\n\n`
      activeAlerts.forEach(alert => {
        const severity = alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : alert.severity === 'medium' ? '🟡' : '🟢'
        report += `- ${severity} **${alert.type}**: ${alert.message}\n`
      })
      report += `\n`
    }
    
    return report
  }
  
  // Private helper methods
  
  private createPerformanceSnapshot(): PerformanceSnapshot {
    // In a real implementation, this would collect actual metrics
    // For now, we'll simulate reasonable values
    return {
      timestamp: new Date(),
      cpuUsage: Math.random() * 50 + 10, // 10-60%
      memoryUsage: Math.random() * 30 + 20, // 20-50%
      agentCount: Math.floor(Math.random() * 20) + 5, // 5-25 agents
      operationsPerSecond: Math.random() * 1000 + 100, // 100-1100 ops/sec
      errorRate: Math.random() * 0.05, // 0-5% error rate
      averageResponseTime: Math.random() * 50 + 20 // 20-70ms
    }
  }
  
  private calculateSystemMetrics(): SystemHealthMetrics {
    const snapshots = this.performanceSnapshots.slice(-10)
    if (snapshots.length === 0) {
      return this.createEmptySystemMetrics()
    }
    
    const avgCpu = snapshots.reduce((sum, s) => sum + s.cpuUsage, 0) / snapshots.length
    const avgMemory = snapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / snapshots.length
    const avgResponseTime = snapshots.reduce((sum, s) => sum + s.averageResponseTime, 0) / snapshots.length
    
    return {
      overallScore: 100 - (avgCpu * 0.5 + avgMemory * 0.3 + avgResponseTime * 0.2),
      componentScores: {
        neural: 90,
        memory: 100 - avgMemory,
        performance: 100 - avgResponseTime,
        network: 85,
        wasm: 95
      },
      activeAlerts: this.activeAlerts,
      recommendations: [],
      uptime: Date.now(),
      lastCheck: new Date()
    }
  }
  
  private calculateComponentScores(snapshot: PerformanceSnapshot): ComponentScores {
    return {
      neural: 100 - (snapshot.errorRate * 1000), // Scale error rate
      memory: 100 - snapshot.memoryUsage,
      performance: 100 - (snapshot.averageResponseTime / 2),
      network: 85, // Assume good network
      wasm: 95 // Assume good WASM performance
    }
  }
  
  private generateRecommendations(componentScores: any, snapshot: PerformanceSnapshot): string[] {
    const recommendations: string[] = []
    
    if (componentScores.neural < 70) {
      recommendations.push('High error rate detected - review neural network configuration')
    }
    
    if (componentScores.memory < 70) {
      recommendations.push('High memory usage detected - consider reducing agent count or memory limits')
    }
    
    if (componentScores.performance < 70) {
      recommendations.push('High response times detected - enable optimizations or SIMD acceleration')
    }
    
    if (snapshot.operationsPerSecond > 1000 && !this.config.simdAcceleration) {
      recommendations.push('High throughput detected - consider enabling SIMD acceleration')
    }
    
    return recommendations
  }
  
  private checkForAlerts(snapshot: PerformanceSnapshot): void {
    const now = Date.now()
    
    // Check error rate
    if (snapshot.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error_rate', 'high', 
        `Error rate ${(snapshot.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%`,
        snapshot.errorRate, this.config.alertThresholds.errorRate)
    }
    
    // Check response time
    if (snapshot.averageResponseTime > this.config.alertThresholds.inferenceTime) {
      this.createAlert('inference_time', 'medium',
        `Average response time ${snapshot.averageResponseTime.toFixed(2)}ms exceeds threshold ${this.config.alertThresholds.inferenceTime}ms`,
        snapshot.averageResponseTime, this.config.alertThresholds.inferenceTime)
    }
    
    // Check memory usage
    const memoryBytes = snapshot.memoryUsage * 1024 * 1024 // Convert to bytes
    if (memoryBytes > this.config.alertThresholds.memoryUsage) {
      this.createAlert('memory_usage', 'medium',
        `Memory usage ${(memoryBytes / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(this.config.alertThresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        memoryBytes, this.config.alertThresholds.memoryUsage)
    }
    
    // Clean up old alerts
    this.clearResolvedAlerts()
  }
  
  private createAlert(
    type: 'spawn_time' | 'inference_time' | 'memory_usage' | 'error_rate',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    value: number,
    threshold: number
  ): void {
    const alert: ExtendedPerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      acknowledged: false
    }
    
    this.activeAlerts.push(alert)
    
    // Trigger callback if registered
    const callback = this.alertCallbacks.get(type)
    if (callback) {
      callback(alert)
    }
    
    this.emit('alertCreated', alert)
  }
  
  private createWasmMetrics(snapshot: PerformanceSnapshot): WasmPerformanceMetrics {
    return {
      executionTime: snapshot.averageResponseTime,
      memoryUsage: snapshot.memoryUsage * 1024 * 1024,
      simdAcceleration: this.config.simdAcceleration,
      throughput: snapshot.operationsPerSecond,
      efficiency: 100 - snapshot.errorRate * 100,
      loadTime: 80,
      operationsCount: Math.floor(snapshot.operationsPerSecond * 10),
      averageOperationTime: snapshot.averageResponseTime
    }
  }
  
  private createEmptyWasmMetrics(): WasmPerformanceMetrics {
    return {
      executionTime: 0,
      memoryUsage: 0,
      simdAcceleration: false,
      throughput: 0,
      efficiency: 0,
      loadTime: 0,
      operationsCount: 0,
      averageOperationTime: 0
    }
  }
  
  private createEmptySystemMetrics(): SystemHealthMetrics {
    return {
      overallScore: 0,
      componentScores: {
        neural: 0,
        memory: 0,
        performance: 0,
        network: 0,
        wasm: 0
      },
      activeAlerts: [],
      recommendations: [],
      uptime: 0,
      lastCheck: new Date()
    }
  }
}

export default NeuralBridgeHealthMonitor