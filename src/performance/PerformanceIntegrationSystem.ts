/**
 * Performance Integration System for SASI
 * Orchestrates all performance optimization components
 */

import PerformanceCacheManager from './PerformanceCacheManager'
import PerformanceMonitoringSystem from './PerformanceMonitoringSystem'
import MemoryOptimizationManager from './MemoryOptimizationManager'
import PerformanceRegressionTester from './PerformanceRegressionTester'
import WASMPerformanceOptimizer from './WASMPerformanceOptimizer'
import AutomatedBenchmarkSuite from './AutomatedBenchmarkSuite'

interface PerformanceSystemConfig {
  cache: {
    maxSize: number
    maxEntries: number
    compressionEnabled: boolean
    intelligentEviction: boolean
  }
  memory: {
    enablePooling: boolean
    enableLeakDetection: boolean
    leakThreshold: number
    gcThreshold: number
  }
  wasm: {
    enablePreloading: boolean
    enableStreaming: boolean
    enableSIMD: boolean
    optimizationLevel: 'basic' | 'standard' | 'aggressive'
  }
  monitoring: {
    intervalMs: number
    enableAlerts: boolean
    enableProfiling: boolean
  }
  benchmarking: {
    autoRun: boolean
    intervalHours: number
    enableRegression: boolean
  }
}

interface IntegratedPerformanceMetrics {
  system: {
    overall: number
    cpu: number
    memory: number
    network: number
  }
  cache: {
    hitRatio: number
    accessTime: number
    size: number
    efficiency: number
  }
  memory: {
    usage: number
    leaks: number
    poolEfficiency: number
    gcImpact: number
  }
  wasm: {
    loadTime: number
    executionTime: number
    simdUtilization: number
    optimization: number
  }
  neural: {
    agentSpawnTime: number
    inferenceTime: number
    throughput: number
    accuracy: number
  }
  timestamp: number
}

interface PerformanceReport {
  id: string
  timestamp: number
  duration: number
  metrics: IntegratedPerformanceMetrics
  recommendations: string[]
  alerts: any[]
  regressions: any[]
  benchmarks: any[]
  summary: {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    status: 'excellent' | 'good' | 'warning' | 'critical'
    improvements: string[]
  }
}

export class PerformanceIntegrationSystem {
  private cacheManager: PerformanceCacheManager
  private monitoringSystem: PerformanceMonitoringSystem
  private memoryManager: MemoryOptimizationManager
  private regressionTester: PerformanceRegressionTester
  private wasmOptimizer: WASMPerformanceOptimizer
  private benchmarkSuite: AutomatedBenchmarkSuite
  
  private config: PerformanceSystemConfig
  private isInitialized: boolean = false
  private isRunning: boolean = false
  private performanceHistory: IntegratedPerformanceMetrics[] = []
  private lastReport: PerformanceReport | null = null

  constructor(config: Partial<PerformanceSystemConfig> = {}) {
    this.config = {
      cache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxEntries: 1000,
        compressionEnabled: true,
        intelligentEviction: true,
        ...config.cache
      },
      memory: {
        enablePooling: true,
        enableLeakDetection: true,
        leakThreshold: 10 * 1024 * 1024, // 10MB
        gcThreshold: 50 * 1024 * 1024, // 50MB
        ...config.memory
      },
      wasm: {
        enablePreloading: true,
        enableStreaming: true,
        enableSIMD: true,
        optimizationLevel: 'standard',
        ...config.wasm
      },
      monitoring: {
        intervalMs: 5000, // 5 seconds
        enableAlerts: true,
        enableProfiling: true,
        ...config.monitoring
      },
      benchmarking: {
        autoRun: true,
        intervalHours: 24, // Daily
        enableRegression: true,
        ...config.benchmarking
      }
    }

    this.initializeComponents()
  }

  /**
   * Initialize all performance components
   */
  private initializeComponents(): void {
    console.log('🚀 Initializing Integrated Performance System...')

    // Initialize cache manager
    this.cacheManager = new PerformanceCacheManager(this.config.cache)

    // Initialize memory manager  
    this.memoryManager = new MemoryOptimizationManager(this.config.memory)

    // Initialize monitoring system
    this.monitoringSystem = new PerformanceMonitoringSystem(this.cacheManager)

    // Initialize regression tester
    this.regressionTester = new PerformanceRegressionTester()

    // Initialize WASM optimizer
    this.wasmOptimizer = new WASMPerformanceOptimizer(this.config.wasm)

    // Initialize benchmark suite
    this.benchmarkSuite = new AutomatedBenchmarkSuite()

    console.log('✅ Performance components initialized')
  }

  /**
   * Start the integrated performance system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Performance system already running')
      return
    }

    console.log('🚀 Starting Integrated Performance System...')

    try {
      // Initialize WASM optimizer
      await this.wasmOptimizer.initializeOptimizer()

      // Start monitoring
      if (this.config.monitoring.enableAlerts) {
        this.monitoringSystem.startMonitoring(this.config.monitoring.intervalMs)
      }

      // Setup benchmark suite with performance systems
      this.benchmarkSuite.setPerformanceSystems({
        cacheManager: this.cacheManager,
        wasmOptimizer: this.wasmOptimizer
      })

      // Setup automated benchmarking
      if (this.config.benchmarking.autoRun) {
        this.setupAutomatedBenchmarking()
      }

      // Setup performance data collection
      this.setupPerformanceCollection()

      this.isRunning = true
      this.isInitialized = true

      console.log('✅ Integrated Performance System started')

    } catch (error) {
      console.error('❌ Failed to start performance system:', error)
      throw error
    }
  }

  /**
   * Stop the integrated performance system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Performance system not running')
      return
    }

    console.log('🛑 Stopping Integrated Performance System...')

    try {
      // Stop monitoring
      this.monitoringSystem.stopMonitoring()

      // Cleanup memory manager
      this.memoryManager.shutdown()

      // Cleanup WASM optimizer
      await this.wasmOptimizer.cleanup()

      this.isRunning = false

      console.log('✅ Integrated Performance System stopped')

    } catch (error) {
      console.error('❌ Error stopping performance system:', error)
      throw error
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getComprehensiveMetrics(): Promise<IntegratedPerformanceMetrics> {
    const timestamp = Date.now()

    // Get system health from monitoring
    const systemHealth = this.monitoringSystem.getSystemHealth()
    
    // Get cache metrics
    const cacheStatus = this.cacheManager.getStatusReport()
    
    // Get memory metrics
    const memoryStats = this.memoryManager.getMemoryStatistics()
    
    // Get WASM metrics
    const wasmReport = this.wasmOptimizer.getPerformanceReport()

    // Calculate integrated metrics
    const metrics: IntegratedPerformanceMetrics = {
      system: {
        overall: systemHealth.score || 0,
        cpu: systemHealth.components?.cpu === 'healthy' ? 90 : 
             systemHealth.components?.cpu === 'warning' ? 70 : 50,
        memory: systemHealth.components?.memory === 'healthy' ? 90 :
                systemHealth.components?.memory === 'warning' ? 70 : 50,
        network: systemHealth.components?.network === 'healthy' ? 90 :
                 systemHealth.components?.network === 'warning' ? 70 : 50
      },
      cache: {
        hitRatio: (cacheStatus.metrics?.hitRatio || 0) * 100,
        accessTime: cacheStatus.metrics?.averageAccessTime || 0,
        size: (cacheStatus.metrics?.totalSize || 0) / 1024 / 1024, // MB
        efficiency: this.calculateCacheEfficiency(cacheStatus)
      },
      memory: {
        usage: (memoryStats.current?.heapUsed || 0) / 1024 / 1024, // MB
        leaks: memoryStats.leaks?.length || 0,
        poolEfficiency: this.calculatePoolEfficiency(memoryStats),
        gcImpact: memoryStats.gc?.impact || 0
      },
      wasm: {
        loadTime: this.calculateAverageWASMLoadTime(wasmReport),
        executionTime: this.calculateAverageWASMExecutionTime(wasmReport),
        simdUtilization: this.calculateSIMDUtilization(wasmReport),
        optimization: this.calculateWASMOptimization(wasmReport)
      },
      neural: {
        agentSpawnTime: 0, // Will be updated by neural bridge integration
        inferenceTime: 0, // Will be updated by neural bridge integration
        throughput: 0, // Will be updated by neural bridge integration
        accuracy: 0 // Will be updated by neural bridge integration
      },
      timestamp
    }

    // Store metrics history
    this.performanceHistory.push(metrics)
    
    // Keep only last 1000 entries
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift()
    }

    return metrics
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const startTime = performance.now()
    const reportId = `perf-report-${Date.now()}`

    console.log('📊 Generating comprehensive performance report...')

    try {
      // Get current metrics
      const metrics = await this.getComprehensiveMetrics()

      // Get active alerts
      const alerts = this.monitoringSystem.getActiveAlerts()

      // Run regression tests
      let regressions: any[] = []
      if (this.config.benchmarking.enableRegression) {
        const currentMetrics = this.convertToRegressionMetrics(metrics)
        regressions = await this.regressionTester.runRegressionTests(currentMetrics)
      }

      // Run benchmarks
      let benchmarks: any[] = []
      if (this.config.benchmarking.autoRun) {
        try {
          const benchmarkReports = await this.benchmarkSuite.runAllBenchmarks()
          benchmarks = benchmarkReports
        } catch (error) {
          console.warn('⚠️ Benchmark execution failed:', error)
        }
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, alerts, regressions)

      // Calculate summary
      const summary = this.calculatePerformanceSummary(metrics, alerts, regressions)

      const endTime = performance.now()
      const duration = endTime - startTime

      const report: PerformanceReport = {
        id: reportId,
        timestamp: Date.now(),
        duration,
        metrics,
        recommendations,
        alerts,
        regressions,
        benchmarks,
        summary
      }

      this.lastReport = report

      console.log(`✅ Performance report generated in ${duration.toFixed(2)}ms`)
      console.log(`📈 Overall Score: ${summary.score.toFixed(1)}/100 (${summary.grade})`)

      return report

    } catch (error) {
      console.error('❌ Failed to generate performance report:', error)
      throw error
    }
  }

  /**
   * Setup automated benchmarking
   */
  private setupAutomatedBenchmarking(): void {
    const intervalMs = this.config.benchmarking.intervalHours * 60 * 60 * 1000

    setInterval(async () => {
      try {
        console.log('🔄 Running automated benchmarks...')
        await this.benchmarkSuite.runAllBenchmarks()
        console.log('✅ Automated benchmarks completed')
      } catch (error) {
        console.error('❌ Automated benchmark failed:', error)
      }
    }, intervalMs)

    console.log(`📅 Automated benchmarking scheduled every ${this.config.benchmarking.intervalHours} hours`)
  }

  /**
   * Setup performance data collection
   */
  private setupPerformanceCollection(): void {
    setInterval(async () => {
      try {
        await this.getComprehensiveMetrics()
      } catch (error) {
        console.error('Error collecting performance metrics:', error)
      }
    }, this.config.monitoring.intervalMs)
  }

  /**
   * Calculate cache efficiency
   */
  private calculateCacheEfficiency(cacheStatus: any): number {
    const hitRatio = cacheStatus.metrics?.hitRatio || 0
    const accessTime = cacheStatus.metrics?.averageAccessTime || 0
    const targetAccessTime = 5 // 5ms target

    const hitScore = hitRatio * 50 // 50% weight for hit ratio
    const speedScore = Math.max(0, 50 - (accessTime / targetAccessTime) * 50) // 50% weight for speed

    return hitScore + speedScore
  }

  /**
   * Calculate pool efficiency
   */
  private calculatePoolEfficiency(memoryStats: any): number {
    const poolCount = memoryStats.pools?.length || 0
    const leakCount = memoryStats.leaks?.length || 0
    const gcRequests = memoryStats.gc?.requestCount || 0

    // Higher pool count and lower leaks/GC = better efficiency
    return Math.max(0, 100 - (leakCount * 10) - (gcRequests * 2) + (poolCount * 5))
  }

  /**
   * Calculate average WASM load time
   */
  private calculateAverageWASMLoadTime(wasmReport: any): number {
    const modules = wasmReport.modules || []
    const loadTimes = modules.map((m: any) => m.loadTime).filter((t: number) => t > 0)
    return loadTimes.length > 0 ? loadTimes.reduce((a: number, b: number) => a + b, 0) / loadTimes.length : 0
  }

  /**
   * Calculate average WASM execution time
   */
  private calculateAverageWASMExecutionTime(wasmReport: any): number {
    const modules = wasmReport.modules || []
    const executionTimes = modules.map((m: any) => m.metrics?.averageCallTime || 0).filter((t: number) => t > 0)
    return executionTimes.length > 0 ? executionTimes.reduce((a: number, b: number) => a + b, 0) / executionTimes.length : 0
  }

  /**
   * Calculate SIMD utilization
   */
  private calculateSIMDUtilization(wasmReport: any): number {
    const modules = wasmReport.modules || []
    const simdModules = modules.filter((m: any) => m.variant === 'simd')
    const totalModules = modules.length

    return totalModules > 0 ? (simdModules.length / totalModules) * 100 : 0
  }

  /**
   * Calculate WASM optimization level
   */
  private calculateWASMOptimization(wasmReport: any): number {
    const instantiated = wasmReport.instantiatedModules || 0
    const total = wasmReport.totalModules || 0
    const cacheSize = wasmReport.cacheSize || 0
    const maxCache = wasmReport.maxCacheSize || 1

    const instantiationScore = total > 0 ? (instantiated / total) * 50 : 0
    const cacheScore = (cacheSize / maxCache) * 50

    return instantiationScore + cacheScore
  }

  /**
   * Convert metrics for regression testing
   */
  private convertToRegressionMetrics(metrics: IntegratedPerformanceMetrics): Record<string, number> {
    return {
      agent_spawn_time: metrics.neural.agentSpawnTime,
      neural_inference_time: metrics.neural.inferenceTime,
      memory_usage_mb: metrics.memory.usage,
      cache_hit_ratio: metrics.cache.hitRatio,
      wasm_load_time: metrics.wasm.loadTime,
      database_query_time: 10, // Placeholder
      cache_access_time: metrics.cache.accessTime,
      system_cpu_usage: 100 - metrics.system.cpu,
      system_memory_usage: metrics.system.memory
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metrics: IntegratedPerformanceMetrics,
    alerts: any[],
    regressions: any[]
  ): string[] {
    const recommendations: string[] = []

    // Cache recommendations
    if (metrics.cache.hitRatio < 80) {
      recommendations.push('Improve cache hit ratio by optimizing cache keys and TTL settings')
    }
    if (metrics.cache.accessTime > 10) {
      recommendations.push('Optimize cache access time - consider enabling compression or reducing cache size')
    }

    // Memory recommendations
    if (metrics.memory.leaks > 0) {
      recommendations.push(`Fix ${metrics.memory.leaks} detected memory leaks`)
    }
    if (metrics.memory.usage > 100) {
      recommendations.push('High memory usage detected - consider enabling memory pooling or increasing GC frequency')
    }

    // WASM recommendations
    if (metrics.wasm.simdUtilization < 50) {
      recommendations.push('Enable SIMD optimizations for better WASM performance')
    }
    if (metrics.wasm.loadTime > 100) {
      recommendations.push('Implement WASM streaming compilation to reduce load times')
    }

    // Alert-based recommendations
    if (alerts.length > 0) {
      recommendations.push(`Address ${alerts.length} active performance alerts`)
    }

    // Regression-based recommendations
    if (regressions.length > 0) {
      recommendations.push(`Investigate ${regressions.length} performance regressions`)
    }

    // System recommendations
    if (metrics.system.overall < 80) {
      recommendations.push('Overall system performance below target - run comprehensive optimization')
    }

    return recommendations
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(
    metrics: IntegratedPerformanceMetrics,
    alerts: any[],
    regressions: any[]
  ): PerformanceReport['summary'] {
    // Calculate overall score
    const weights = {
      system: 0.3,
      cache: 0.2,
      memory: 0.2,
      wasm: 0.15,
      neural: 0.15
    }

    const score = (
      metrics.system.overall * weights.system +
      metrics.cache.efficiency * weights.cache +
      (100 - metrics.memory.leaks * 10) * weights.memory +
      metrics.wasm.optimization * weights.wasm +
      Math.max(0, 100 - metrics.neural.agentSpawnTime) * weights.neural
    )

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (score >= 90) grade = 'A'
    else if (score >= 80) grade = 'B'
    else if (score >= 70) grade = 'C'
    else if (score >= 60) grade = 'D'
    else grade = 'F'

    // Determine status
    let status: 'excellent' | 'good' | 'warning' | 'critical'
    if (alerts.length === 0 && regressions.length === 0 && score >= 85) {
      status = 'excellent'
    } else if (alerts.length <= 2 && regressions.length <= 1 && score >= 70) {
      status = 'good'
    } else if (alerts.length <= 5 && regressions.length <= 3 && score >= 50) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    // Generate improvements
    const improvements = [
      'Enable all SIMD optimizations',
      'Implement advanced caching strategies',
      'Optimize memory usage patterns',
      'Use WASM streaming compilation',
      'Implement performance monitoring alerts'
    ]

    return {
      score,
      grade,
      status,
      improvements
    }
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit: number = 100): IntegratedPerformanceMetrics[] {
    return this.performanceHistory.slice(-limit)
  }

  /**
   * Get last performance report
   */
  getLastReport(): PerformanceReport | null {
    return this.lastReport
  }

  /**
   * Get system status
   */
  getSystemStatus(): any {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      config: this.config,
      components: {
        cache: !!this.cacheManager,
        memory: !!this.memoryManager,
        monitoring: !!this.monitoringSystem,
        regression: !!this.regressionTester,
        wasm: !!this.wasmOptimizer,
        benchmark: !!this.benchmarkSuite
      },
      lastReport: this.lastReport?.timestamp || null,
      historyCount: this.performanceHistory.length
    }
  }
}

export default PerformanceIntegrationSystem