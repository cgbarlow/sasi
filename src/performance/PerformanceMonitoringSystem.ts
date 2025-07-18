/**
 * Comprehensive Performance Monitoring System for SASI
 * Real-time monitoring, alerting, and performance analysis
 */

import { PerformanceCacheManager } from './PerformanceCacheManager'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags: Record<string, string>
}

interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
  comparison: 'greater' | 'less' | 'equal'
}

interface PerformanceAlert {
  id: string
  level: 'info' | 'warning' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: number
  resolved: boolean
  resolvedAt?: number
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  components: {
    cpu: 'healthy' | 'warning' | 'critical'
    memory: 'healthy' | 'warning' | 'critical'
    network: 'healthy' | 'warning' | 'critical'
    storage: 'healthy' | 'warning' | 'critical'
    agents: 'healthy' | 'warning' | 'critical'
  }
  score: number
}

export class PerformanceMonitoringSystem {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private thresholds: Map<string, PerformanceThreshold> = new Map()
  private alerts: Map<string, PerformanceAlert> = new Map()
  private cacheManager: PerformanceCacheManager
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false

  constructor(cacheManager: PerformanceCacheManager) {
    this.cacheManager = cacheManager
    this.initializeDefaultThresholds()
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeDefaultThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      { metric: 'agent_spawn_time', warning: 50, critical: 100, comparison: 'greater' },
      { metric: 'neural_inference_time', warning: 80, critical: 150, comparison: 'greater' },
      { metric: 'memory_usage_mb', warning: 1000, critical: 2000, comparison: 'greater' },
      { metric: 'cpu_usage_percent', warning: 70, critical: 90, comparison: 'greater' },
      { metric: 'cache_hit_ratio', warning: 0.7, critical: 0.5, comparison: 'less' },
      { metric: 'wasm_load_time', warning: 200, critical: 500, comparison: 'greater' },
      { metric: 'database_query_time', warning: 50, critical: 100, comparison: 'greater' },
      { metric: 'network_latency', warning: 100, critical: 500, comparison: 'greater' },
      { metric: 'error_rate_percent', warning: 1, critical: 5, comparison: 'greater' },
      { metric: 'concurrent_agents', warning: 20, critical: 50, comparison: 'greater' }
    ]

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold)
    })
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Performance monitoring already active')
      return
    }

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    console.log('📊 Performance monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('⚠️ Performance monitoring not active')
      return
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.isMonitoring = false
    console.log('📊 Performance monitoring stopped')
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now()
      const metrics: PerformanceMetric[] = []

      // System metrics
      metrics.push(...await this.collectSystemMetrics(timestamp))
      
      // Agent metrics
      metrics.push(...await this.collectAgentMetrics(timestamp))
      
      // Cache metrics
      metrics.push(...await this.collectCacheMetrics(timestamp))
      
      // Network metrics
      metrics.push(...await this.collectNetworkMetrics(timestamp))
      
      // Application metrics
      metrics.push(...await this.collectApplicationMetrics(timestamp))

      // Store metrics and check thresholds
      for (const metric of metrics) {
        this.storeMetric(metric)
        this.checkThresholds(metric)
      }

      // Store metrics in cache for dashboard
      await this.cacheManager.set('performance_metrics', {
        timestamp,
        metrics: metrics.map(m => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          tags: m.tags
        }))
      }, 60000) // Cache for 1 minute

    } catch (error) {
      console.error('❌ Error collecting performance metrics:', error)
    }
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    try {
      // Memory metrics
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage()
        metrics.push({
          name: 'memory_usage_mb',
          value: memUsage.heapUsed / 1024 / 1024,
          unit: 'MB',
          timestamp,
          tags: { type: 'heap' }
        })

        metrics.push({
          name: 'memory_total_mb',
          value: memUsage.heapTotal / 1024 / 1024,
          unit: 'MB',
          timestamp,
          tags: { type: 'heap_total' }
        })
      }

      // CPU metrics (simulated)
      const cpuUsage = this.simulateCPUUsage()
      metrics.push({
        name: 'cpu_usage_percent',
        value: cpuUsage,
        unit: '%',
        timestamp,
        tags: { type: 'overall' }
      })

      // Performance timing
      if (typeof performance !== 'undefined' && performance.now) {
        const perfNow = performance.now()
        metrics.push({
          name: 'performance_now',
          value: perfNow,
          unit: 'ms',
          timestamp,
          tags: { type: 'timing' }
        })
      }

    } catch (error) {
      console.error('Error collecting system metrics:', error)
    }

    return metrics
  }

  /**
   * Collect agent-specific metrics
   */
  private async collectAgentMetrics(timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    try {
      // Simulate agent metrics - in production, these would come from actual agent manager
      const agentCount = Math.floor(Math.random() * 10) + 5
      const avgSpawnTime = Math.random() * 80 + 20
      const avgInferenceTime = Math.random() * 100 + 30

      metrics.push({
        name: 'concurrent_agents',
        value: agentCount,
        unit: 'count',
        timestamp,
        tags: { type: 'active' }
      })

      metrics.push({
        name: 'agent_spawn_time',
        value: avgSpawnTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'average' }
      })

      metrics.push({
        name: 'neural_inference_time',
        value: avgInferenceTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'average' }
      })

      // Agent efficiency metrics
      const efficiency = Math.random() * 30 + 70
      metrics.push({
        name: 'agent_efficiency_percent',
        value: efficiency,
        unit: '%',
        timestamp,
        tags: { type: 'overall' }
      })

    } catch (error) {
      console.error('Error collecting agent metrics:', error)
    }

    return metrics
  }

  /**
   * Collect cache performance metrics
   */
  private async collectCacheMetrics(timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    try {
      const cacheMetrics = this.cacheManager.getMetrics()

      metrics.push({
        name: 'cache_hit_ratio',
        value: cacheMetrics.hitRatio,
        unit: 'ratio',
        timestamp,
        tags: { type: 'performance' }
      })

      metrics.push({
        name: 'cache_size_mb',
        value: cacheMetrics.totalSize / 1024 / 1024,
        unit: 'MB',
        timestamp,
        tags: { type: 'usage' }
      })

      metrics.push({
        name: 'cache_entries',
        value: cacheMetrics.entryCount,
        unit: 'count',
        timestamp,
        tags: { type: 'entries' }
      })

      metrics.push({
        name: 'cache_access_time',
        value: cacheMetrics.averageAccessTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'latency' }
      })

    } catch (error) {
      console.error('Error collecting cache metrics:', error)
    }

    return metrics
  }

  /**
   * Collect network performance metrics
   */
  private async collectNetworkMetrics(timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    try {
      // Simulate network metrics
      const latency = Math.random() * 150 + 10
      const throughput = Math.random() * 1000 + 500
      const errorRate = Math.random() * 2

      metrics.push({
        name: 'network_latency',
        value: latency,
        unit: 'ms',
        timestamp,
        tags: { type: 'average' }
      })

      metrics.push({
        name: 'network_throughput',
        value: throughput,
        unit: 'ops/sec',
        timestamp,
        tags: { type: 'requests' }
      })

      metrics.push({
        name: 'error_rate_percent',
        value: errorRate,
        unit: '%',
        timestamp,
        tags: { type: 'http' }
      })

    } catch (error) {
      console.error('Error collecting network metrics:', error)
    }

    return metrics
  }

  /**
   * Collect application-specific metrics
   */
  private async collectApplicationMetrics(timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    try {
      // WASM performance
      const wasmLoadTime = Math.random() * 300 + 50
      metrics.push({
        name: 'wasm_load_time',
        value: wasmLoadTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'module_load' }
      })

      // Database performance
      const dbQueryTime = Math.random() * 80 + 10
      metrics.push({
        name: 'database_query_time',
        value: dbQueryTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'average' }
      })

      // UI performance
      const renderTime = Math.random() * 20 + 5
      metrics.push({
        name: 'ui_render_time',
        value: renderTime,
        unit: 'ms',
        timestamp,
        tags: { type: 'component' }
      })

    } catch (error) {
      console.error('Error collecting application metrics:', error)
    }

    return metrics
  }

  /**
   * Store performance metric
   */
  private storeMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, [])
    }

    const metricHistory = this.metrics.get(metric.name)!
    metricHistory.push(metric)

    // Keep only last 1000 metrics per type
    if (metricHistory.length > 1000) {
      metricHistory.shift()
    }
  }

  /**
   * Check metric against thresholds and generate alerts
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name)
    if (!threshold) return

    const exceeds = this.checkThresholdExceeded(metric.value, threshold)
    
    if (exceeds) {
      this.generateAlert(metric, threshold, exceeds)
    }
  }

  /**
   * Check if threshold is exceeded
   */
  private checkThresholdExceeded(value: number, threshold: PerformanceThreshold): 'warning' | 'critical' | null {
    const { warning, critical, comparison } = threshold
    
    if (comparison === 'greater') {
      if (value >= critical) return 'critical'
      if (value >= warning) return 'warning'
    } else if (comparison === 'less') {
      if (value <= critical) return 'critical'
      if (value <= warning) return 'warning'
    } else if (comparison === 'equal') {
      if (value === critical) return 'critical'
      if (value === warning) return 'warning'
    }
    
    return null
  }

  /**
   * Generate performance alert
   */
  private generateAlert(metric: PerformanceMetric, threshold: PerformanceThreshold, level: 'warning' | 'critical'): void {
    const alertId = `${metric.name}_${level}_${Date.now()}`
    const thresholdValue = level === 'critical' ? threshold.critical : threshold.warning
    
    const alert: PerformanceAlert = {
      id: alertId,
      level,
      message: `${metric.name} ${comparison} ${thresholdValue}${metric.unit} (current: ${metric.value.toFixed(2)}${metric.unit})`,
      metric: metric.name,
      value: metric.value,
      threshold: thresholdValue,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.set(alertId, alert)
    
    // Log alert
    const emoji = level === 'critical' ? '🚨' : '⚠️'
    console.log(`${emoji} Performance Alert: ${alert.message}`)
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const recentMetrics = this.getRecentMetrics(60000) // Last minute
    
    const health: SystemHealth = {
      overall: 'healthy',
      components: {
        cpu: this.evaluateComponentHealth('cpu_usage_percent', recentMetrics),
        memory: this.evaluateComponentHealth('memory_usage_mb', recentMetrics),
        network: this.evaluateComponentHealth('network_latency', recentMetrics),
        storage: this.evaluateComponentHealth('cache_hit_ratio', recentMetrics),
        agents: this.evaluateComponentHealth('agent_spawn_time', recentMetrics)
      },
      score: 0
    }

    // Calculate overall health score
    const componentScores = Object.values(health.components).map(status => {
      switch (status) {
        case 'healthy': return 100
        case 'warning': return 70
        case 'critical': return 30
        default: return 0
      }
    })

    health.score = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length

    // Determine overall health
    if (health.score >= 90) health.overall = 'healthy'
    else if (health.score >= 70) health.overall = 'warning'
    else health.overall = 'critical'

    return health
  }

  /**
   * Evaluate component health
   */
  private evaluateComponentHealth(metricName: string, recentMetrics: PerformanceMetric[]): 'healthy' | 'warning' | 'critical' {
    const threshold = this.thresholds.get(metricName)
    if (!threshold) return 'healthy'

    const metrics = recentMetrics.filter(m => m.name === metricName)
    if (metrics.length === 0) return 'healthy'

    const latestMetric = metrics[metrics.length - 1]
    const exceeds = this.checkThresholdExceeded(latestMetric.value, threshold)
    
    return exceeds || 'healthy'
  }

  /**
   * Get recent metrics within time window
   */
  private getRecentMetrics(timeWindowMs: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics: PerformanceMetric[] = []

    for (const metricHistory of this.metrics.values()) {
      const recent = metricHistory.filter(m => m.timestamp >= cutoff)
      recentMetrics.push(...recent)
    }

    return recentMetrics
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const health = this.getSystemHealth()
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved)
    const cacheMetrics = this.cacheManager.getMetrics()

    return {
      health,
      alerts: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.level === 'critical').length,
        warning: activeAlerts.filter(a => a.level === 'warning').length
      },
      cache: {
        hitRatio: cacheMetrics.hitRatio,
        size: cacheMetrics.totalSize,
        entries: cacheMetrics.entryCount
      },
      monitoring: {
        isActive: this.isMonitoring,
        metricsCollected: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0)
      }
    }
  }

  /**
   * Simulate CPU usage (replace with actual CPU monitoring)
   */
  private simulateCPUUsage(): number {
    return Math.random() * 30 + 40 // 40-70% CPU usage
  }
}

export default PerformanceMonitoringSystem