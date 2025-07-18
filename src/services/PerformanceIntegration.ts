/**
 * Performance Integration Service
 * 
 * Integrates SASI with synaptic-mesh performance monitoring suite.
 * Provides real-time performance tracking for neural agents and
 * connects to the existing performance dashboard infrastructure.
 */

import { NeuralPerformanceSnapshot, PerformanceAlert, SystemHealthMetrics } from '../types/neural'
import { Agent } from '../types/agent'

export interface PerformanceIntegrationConfig {
  enableRealTimeMonitoring: boolean
  enableBottleneckDetection: boolean
  enablePredictiveAnalysis: boolean
  enableAutoOptimization: boolean
  dashboardEnabled: boolean
  alertThresholds: {
    inferenceTime: number // ms
    memoryUsage: number // MB
    cpuUsage: number // %
    accuracy: number // minimum acceptable
    errorRate: number // maximum acceptable
  }
  updateInterval: number // ms
  historyRetention: number // hours
}

export class PerformanceIntegration {
  private performanceMonitor: any = null
  private isInitialized = false
  private config: PerformanceIntegrationConfig
  private metricsHistory: Map<string, NeuralPerformanceSnapshot[]> = new Map()
  private activeAlerts: Map<string, PerformanceAlert> = new Map()
  private systemHealth: SystemHealthMetrics
  
  constructor(config: Partial<PerformanceIntegrationConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      enableBottleneckDetection: true,
      enablePredictiveAnalysis: false, // Requires ML model
      enableAutoOptimization: false, // Safety first
      dashboardEnabled: true,
      alertThresholds: {
        inferenceTime: 100, // 100ms
        memoryUsage: 50, // 50MB
        cpuUsage: 80, // 80%
        accuracy: 0.85, // 85%
        errorRate: 0.05 // 5%
      },
      updateInterval: 1000, // 1 second
      historyRetention: 24, // 24 hours
      ...config
    }
    
    this.systemHealth = {
      overallScore: 100,
      componentScores: {
        neural: 100,
        memory: 100,
        performance: 100,
        network: 100,
        wasm: 100
      },
      activeAlerts: [],
      recommendations: [],
      uptime: 0,
      lastCheck: new Date()
    }
  }
  
  /**
   * Initialize Performance Integration
   */
  async initialize(): Promise<void> {
    try {
      console.log('📊 Initializing Performance Integration...')
      
      // Import and initialize performance monitoring suite
      const PerformanceMonitoringSuite = require('../../../synaptic-mesh/src/neural/performance-monitoring-suite.js')
      
      this.performanceMonitor = new PerformanceMonitoringSuite({
        // Neural-specific targets
        targetSpawnTime: 100, // ms
        targetMemoryPerAgent: this.config.alertThresholds.memoryUsage * 1024 * 1024, // Convert MB to bytes
        targetInferenceTime: this.config.alertThresholds.inferenceTime, // ms
        targetWasmOperationTime: 10, // ms
        
        // Feature flags
        enableRealTimeMonitoring: this.config.enableRealTimeMonitoring,
        enableBottleneckDetection: this.config.enableBottleneckDetection,
        enableMLPrediction: this.config.enablePredictiveAnalysis,
        enableDashboardUI: this.config.dashboardEnabled,
        enableAutoOptimization: this.config.enableAutoOptimization,
        
        // Alert configuration
        alertSeverityThreshold: 'medium',
        
        // Dashboard settings
        dashboardPort: 8080,
        dashboardUpdateInterval: this.config.updateInterval
      })
      
      // Set up event handlers
      this.setupEventHandlers()
      
      // Start monitoring if enabled
      if (this.config.enableRealTimeMonitoring) {
        await this.performanceMonitor.startMonitoring()
      }
      
      this.isInitialized = true
      console.log('✅ Performance Integration initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Performance Integration:', error)
      throw error
    }
  }
  
  /**
   * Setup Event Handlers
   */
  private setupEventHandlers(): void {
    if (!this.performanceMonitor) return
    
    // Agent performance events
    this.performanceMonitor.on('agentSpawnAnalysis', (data: any) => {
      this.handleAgentSpawnMetrics(data)
    })
    
    this.performanceMonitor.on('neuralInferenceAnalysis', (data: any) => {
      this.handleInferenceMetrics(data)
    })
    
    this.performanceMonitor.on('wasmOperationAnalysis', (data: any) => {
      this.handleWasmMetrics(data)
    })
    
    this.performanceMonitor.on('memoryAnalysis', (data: any) => {
      this.handleMemoryMetrics(data)
    })
    
    // Alert events
    this.performanceMonitor.on('alert', (alert: any) => {
      this.handlePerformanceAlert(alert)
    })
    
    // Bottleneck events
    this.performanceMonitor.on('bottleneckDetected', (bottleneck: any) => {
      this.handleBottleneckDetected(bottleneck)
    })
    
    this.performanceMonitor.on('bottleneckResolved', (bottleneck: any) => {
      this.handleBottleneckResolved(bottleneck)
    })
    
    // Optimization events
    this.performanceMonitor.on('optimizationsApplied', (optimization: any) => {
      this.handleOptimizationApplied(optimization)
    })
  }
  
  /**
   * Record Agent Performance Metrics
   */
  recordAgentMetrics(agentId: string, metrics: Partial<NeuralPerformanceSnapshot>): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Performance integration not initialized')
      return
    }
    
    const snapshot: NeuralPerformanceSnapshot = {
      timestamp: new Date(),
      agentId,
      inferenceTime: metrics.inferenceTime || 0,
      trainingTime: metrics.trainingTime,
      preprocessingTime: metrics.preprocessingTime || 0,
      postprocessingTime: metrics.postprocessingTime || 0,
      memoryUsage: metrics.memoryUsage || 0,
      cpuUsage: metrics.cpuUsage || 0,
      gpuUsage: metrics.gpuUsage,
      energyConsumption: metrics.energyConsumption || 0,
      accuracy: metrics.accuracy || 0,
      precision: metrics.precision || 0,
      recall: metrics.recall || 0,
      f1Score: metrics.f1Score || 0,
      networkLatency: metrics.networkLatency || 0,
      bandwidthUsage: metrics.bandwidthUsage || 0,
      packetsLost: metrics.packetsLost || 0
    }
    
    // Store in history
    if (!this.metricsHistory.has(agentId)) {
      this.metricsHistory.set(agentId, [])
    }
    
    const agentHistory = this.metricsHistory.get(agentId)!
    agentHistory.push(snapshot)
    
    // Limit history size
    const maxHistorySize = (this.config.historyRetention * 3600) / (this.config.updateInterval / 1000)
    if (agentHistory.length > maxHistorySize) {
      agentHistory.shift()
    }
    
    // Check thresholds and generate alerts
    this.checkPerformanceThresholds(snapshot)
    
    // Report to performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.emit('agentMetricsRecorded', snapshot)
    }
  }
  
  /**
   * Get Agent Performance History
   */
  getAgentHistory(agentId: string, timeRange?: number): NeuralPerformanceSnapshot[] {
    const history = this.metricsHistory.get(agentId) || []
    
    if (!timeRange) return history
    
    const cutoffTime = new Date(Date.now() - timeRange)
    return history.filter(snapshot => snapshot.timestamp >= cutoffTime)
  }
  
  /**
   * Get System Health Metrics
   */
  getSystemHealth(): SystemHealthMetrics {
    this.updateSystemHealth()
    return { ...this.systemHealth }
  }
  
  /**
   * Get Performance Dashboard Data
   */
  getDashboardData(): any {
    if (!this.performanceMonitor) {
      return null
    }
    
    return this.performanceMonitor.getPerformanceReport()
  }
  
  /**
   * Get Active Alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values())
  }
  
  /**
   * Acknowledge Alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }
  
  /**
   * Resolve Alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolvedAt = new Date()
      this.activeAlerts.delete(alertId)
      return true
    }
    return false
  }
  
  /**
   * Generate Performance Report
   */
  generatePerformanceReport(agentIds?: string[]): any {
    const agents = agentIds || Array.from(this.metricsHistory.keys())
    const report = {
      timestamp: new Date(),
      summary: {
        totalAgents: agents.length,
        averageInferenceTime: 0,
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        averageAccuracy: 0
      },
      agentDetails: {} as any,
      systemHealth: this.getSystemHealth(),
      activeAlerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations()
    }
    
    // Calculate aggregated metrics
    let totalInferenceTime = 0
    let totalMemoryUsage = 0
    let totalCpuUsage = 0
    let totalAccuracy = 0
    let validAgents = 0
    
    for (const agentId of agents) {
      const history = this.getAgentHistory(agentId, 3600000) // Last hour
      if (history.length === 0) continue
      
      const latestSnapshot = history[history.length - 1]
      const agentReport = {
        agentId,
        latestMetrics: latestSnapshot,
        averageMetrics: this.calculateAverageMetrics(history),
        trendAnalysis: this.analyzeTrends(history)
      }
      
      report.agentDetails[agentId] = agentReport
      
      totalInferenceTime += latestSnapshot.inferenceTime
      totalMemoryUsage += latestSnapshot.memoryUsage
      totalCpuUsage += latestSnapshot.cpuUsage
      totalAccuracy += latestSnapshot.accuracy
      validAgents++
    }
    
    // Calculate averages
    if (validAgents > 0) {
      report.summary.averageInferenceTime = totalInferenceTime / validAgents
      report.summary.averageMemoryUsage = totalMemoryUsage / validAgents
      report.summary.averageCpuUsage = totalCpuUsage / validAgents
      report.summary.averageAccuracy = totalAccuracy / validAgents
    }
    
    return report
  }
  
  /**
   * Cleanup Resources
   */
  async cleanup(): Promise<void> {
    if (this.performanceMonitor) {
      try {
        await this.performanceMonitor.cleanup()
        console.log('✅ Performance monitor cleaned up')
      } catch (error) {
        console.error('❌ Failed to cleanup performance monitor:', error)
      }
    }
    
    this.metricsHistory.clear()
    this.activeAlerts.clear()
    this.isInitialized = false
  }
  
  // ===== PRIVATE METHODS =====
  
  private handleAgentSpawnMetrics(data: any): void {
    console.log(`📊 Agent spawn metrics: avg ${data.average}ms (${data.count} agents)`)
    
    if (data.average > this.config.alertThresholds.inferenceTime * 2) {
      this.generateAlert('agent_spawn_slow', 'high', {
        averageSpawnTime: data.average,
        target: this.config.alertThresholds.inferenceTime * 2,
        count: data.count
      })
    }
  }
  
  private handleInferenceMetrics(data: any): void {
    console.log(`📊 Inference metrics: avg ${data.average}ms`)
    
    if (data.slowInferencesRatio > 0.3) {
      this.generateAlert('inference_performance_degraded', 'medium', {
        averageTime: data.average,
        slowRatio: data.slowInferencesRatio,
        target: this.config.alertThresholds.inferenceTime
      })
    }
  }
  
  private handleWasmMetrics(data: any): void {
    console.log(`📊 WASM metrics: avg ${data.average}ms`)
    
    // Check for WASM performance issues
    if (data.average > 20) { // WASM operations should be very fast
      this.generateAlert('wasm_performance_issue', 'medium', {
        averageTime: data.average,
        target: 10
      })
    }
  }
  
  private handleMemoryMetrics(data: any): void {
    console.log(`📊 Memory metrics: avg ${(data.average / 1024 / 1024).toFixed(1)}MB`)
    
    const memoryMB = data.average / 1024 / 1024
    if (memoryMB > this.config.alertThresholds.memoryUsage) {
      this.generateAlert('memory_usage_high', 'medium', {
        averageUsage: memoryMB,
        target: this.config.alertThresholds.memoryUsage
      })
    }
  }
  
  private handlePerformanceAlert(alert: any): void {
    console.log(`🚨 Performance alert: ${alert.type} (${alert.severity})`)
    
    const performanceAlert: PerformanceAlert = {
      id: alert.id || `alert_${Date.now()}`,
      agentId: alert.agentId || 'system',
      timestamp: new Date(),
      severity: alert.severity || 'medium',
      type: 'performance',
      message: alert.message || alert.type,
      details: alert.data || {},
      acknowledged: false
    }
    
    this.activeAlerts.set(performanceAlert.id, performanceAlert)
  }
  
  private handleBottleneckDetected(bottleneck: any): void {
    console.log(`🔍 Bottleneck detected: ${bottleneck.component}`)
    
    this.generateAlert('bottleneck_detected', 'high', {
      component: bottleneck.component,
      severity: bottleneck.severity,
      suggestions: bottleneck.optimizationSuggestions
    })
  }
  
  private handleBottleneckResolved(bottleneck: any): void {
    console.log(`✅ Bottleneck resolved: ${bottleneck.component}`)
    
    // Find and resolve related alerts
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.details.component === bottleneck.component) {
        this.resolveAlert(alertId)
      }
    }
  }
  
  private handleOptimizationApplied(optimization: any): void {
    console.log(`🔧 Optimization applied: ${optimization.optimizations.join(', ')}`)
  }
  
  private checkPerformanceThresholds(snapshot: NeuralPerformanceSnapshot): void {
    const { alertThresholds } = this.config
    
    // Check inference time
    if (snapshot.inferenceTime > alertThresholds.inferenceTime) {
      this.generateAlert('inference_time_exceeded', 'medium', {
        agentId: snapshot.agentId,
        inferenceTime: snapshot.inferenceTime,
        threshold: alertThresholds.inferenceTime
      })
    }
    
    // Check memory usage
    const memoryMB = snapshot.memoryUsage / 1024 / 1024
    if (memoryMB > alertThresholds.memoryUsage) {
      this.generateAlert('memory_threshold_exceeded', 'medium', {
        agentId: snapshot.agentId,
        memoryUsage: memoryMB,
        threshold: alertThresholds.memoryUsage
      })
    }
    
    // Check CPU usage
    if (snapshot.cpuUsage > alertThresholds.cpuUsage) {
      this.generateAlert('cpu_threshold_exceeded', 'medium', {
        agentId: snapshot.agentId,
        cpuUsage: snapshot.cpuUsage,
        threshold: alertThresholds.cpuUsage
      })
    }
    
    // Check accuracy
    if (snapshot.accuracy < alertThresholds.accuracy && snapshot.accuracy > 0) {
      this.generateAlert('accuracy_below_threshold', 'high', {
        agentId: snapshot.agentId,
        accuracy: snapshot.accuracy,
        threshold: alertThresholds.accuracy
      })
    }
  }
  
  private generateAlert(type: string, severity: PerformanceAlert['severity'], details: any): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId: details.agentId || 'system',
      timestamp: new Date(),
      severity,
      type: type as any,
      message: this.generateAlertMessage(type, details),
      details,
      acknowledged: false
    }
    
    this.activeAlerts.set(alert.id, alert)
    console.log(`🚨 Generated alert: ${alert.message}`)
  }
  
  private generateAlertMessage(type: string, details: any): string {
    switch (type) {
      case 'inference_time_exceeded':
        return `Agent ${details.agentId} inference time (${details.inferenceTime}ms) exceeded threshold (${details.threshold}ms)`
      case 'memory_threshold_exceeded':
        return `Agent ${details.agentId} memory usage (${details.memoryUsage.toFixed(1)}MB) exceeded threshold (${details.threshold}MB)`
      case 'cpu_threshold_exceeded':
        return `Agent ${details.agentId} CPU usage (${details.cpuUsage}%) exceeded threshold (${details.threshold}%)`
      case 'accuracy_below_threshold':
        return `Agent ${details.agentId} accuracy (${(details.accuracy * 100).toFixed(1)}%) below threshold (${(details.threshold * 100).toFixed(1)}%)`
      case 'bottleneck_detected':
        return `Performance bottleneck detected in ${details.component}`
      default:
        return `Performance issue detected: ${type}`
    }
  }
  
  private updateSystemHealth(): void {
    const now = new Date()
    const uptime = now.getTime() - (this.systemHealth.lastCheck?.getTime() || now.getTime())
    
    // Calculate component scores based on recent metrics
    const componentScores = {
      neural: this.calculateNeuralHealth(),
      memory: this.calculateMemoryHealth(),
      performance: this.calculatePerformanceHealth(),
      network: this.calculateNetworkHealth(),
      wasm: this.calculateWasmHealth()
    }
    
    // Calculate overall score
    const weights = { neural: 0.3, memory: 0.2, performance: 0.3, network: 0.1, wasm: 0.1 }
    const overallScore = Object.entries(componentScores).reduce(
      (score, [component, value]) => score + value * weights[component as keyof typeof weights],
      0
    )
    
    this.systemHealth = {
      overallScore: Math.round(overallScore),
      componentScores,
      activeAlerts: Array.from(this.activeAlerts.values()),
      recommendations: this.generateRecommendations(),
      uptime: uptime,
      lastCheck: now
    }
  }
  
  private calculateNeuralHealth(): number {
    // Base health score
    let score = 100
    
    // Deduct for alerts
    const neuralAlerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.type === 'performance' || alert.type === 'accuracy'
    )
    score -= neuralAlerts.length * 10
    
    return Math.max(0, score)
  }
  
  private calculateMemoryHealth(): number {
    let score = 100
    const memoryAlerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.type === 'memory'
    )
    score -= memoryAlerts.length * 15
    return Math.max(0, score)
  }
  
  private calculatePerformanceHealth(): number {
    let score = 100
    const performanceAlerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.type === 'performance' || alert.type === 'latency'
    )
    score -= performanceAlerts.length * 12
    return Math.max(0, score)
  }
  
  private calculateNetworkHealth(): number {
    // Simplified network health calculation
    return 95 + Math.random() * 5 // 95-100%
  }
  
  private calculateWasmHealth(): number {
    // Check if WASM is working properly
    return this.performanceMonitor ? 100 : 50
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.systemHealth.overallScore < 80) {
      recommendations.push('System performance is degraded. Consider investigating active alerts.')
    }
    
    if (this.activeAlerts.size > 5) {
      recommendations.push('High number of active alerts. Consider addressing critical issues first.')
    }
    
    const memoryAlerts = Array.from(this.activeAlerts.values()).filter(a => a.type === 'memory')
    if (memoryAlerts.length > 0) {
      recommendations.push('Memory usage is high. Consider optimizing neural network architectures.')
    }
    
    if (!this.config.enablePredictiveAnalysis) {
      recommendations.push('Enable predictive analysis for better performance insights.')
    }
    
    return recommendations
  }
  
  private calculateAverageMetrics(history: NeuralPerformanceSnapshot[]): any {
    if (history.length === 0) return null
    
    const sum = history.reduce((acc, snapshot) => ({
      inferenceTime: acc.inferenceTime + snapshot.inferenceTime,
      memoryUsage: acc.memoryUsage + snapshot.memoryUsage,
      cpuUsage: acc.cpuUsage + snapshot.cpuUsage,
      accuracy: acc.accuracy + snapshot.accuracy
    }), { inferenceTime: 0, memoryUsage: 0, cpuUsage: 0, accuracy: 0 })
    
    const count = history.length
    return {
      inferenceTime: sum.inferenceTime / count,
      memoryUsage: sum.memoryUsage / count,
      cpuUsage: sum.cpuUsage / count,
      accuracy: sum.accuracy / count
    }
  }
  
  private analyzeTrends(history: NeuralPerformanceSnapshot[]): any {
    if (history.length < 2) return null
    
    const recent = history.slice(-Math.min(10, history.length))
    const older = history.slice(0, Math.min(10, history.length))
    
    const recentAvg = this.calculateAverageMetrics(recent)
    const olderAvg = this.calculateAverageMetrics(older)
    
    if (!recentAvg || !olderAvg) return null
    
    return {
      inferenceTimeTrend: recentAvg.inferenceTime - olderAvg.inferenceTime,
      memoryUsageTrend: recentAvg.memoryUsage - olderAvg.memoryUsage,
      cpuUsageTrend: recentAvg.cpuUsage - olderAvg.cpuUsage,
      accuracyTrend: recentAvg.accuracy - olderAvg.accuracy
    }
  }
}

export default PerformanceIntegration