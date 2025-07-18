/**
 * WASM Module Manager - Issue #19
 * 
 * This module provides comprehensive WASM module loading and management
 * with automatic fallback and performance optimization.
 * 
 * Features:
 * - Dynamic WASM module loading
 * - Automatic fallback management
 * - Performance optimization
 * - Module lifecycle management
 * - Resource cleanup
 * - Error handling and recovery
 */

import { WasmPerformanceLayer } from './WasmPerformanceLayer'
import { SIMDAccelerationLayer } from './SIMDAccelerationLayer'

interface WasmModuleConfig {
  preferredModule: 'ruv-swarm' | 'production' | 'fallback'
  enableSIMD: boolean
  memoryLimit: number
  loadTimeout: number
  retryAttempts: number
  enableProfiling: boolean
  enableAutoFallback: boolean
}

interface WasmModuleStatus {
  loaded: boolean
  module: string
  version: string
  capabilities: string[]
  memoryUsage: number
  loadTime: number
  errorCount: number
  lastError?: string
}

interface WasmModuleMetrics {
  loadTime: number
  memoryUsage: number
  operationsPerSecond: number
  errorRate: number
  uptime: number
  performanceScore: number
}

interface WasmModuleInfo {
  name: string
  description: string
  version: string
  capabilities: string[]
  memoryRequirement: number
  loadPriority: number
  available: boolean
}

export class WasmModuleManager {
  private config: WasmModuleConfig
  private performanceLayer: WasmPerformanceLayer
  private simdLayer: SIMDAccelerationLayer
  private moduleStatus: WasmModuleStatus
  private moduleMetrics: WasmModuleMetrics
  private availableModules: Map<string, WasmModuleInfo> = new Map()
  private isInitialized = false
  private startTime = 0
  private performanceHistory: number[] = []
  private errorHistory: string[] = []

  constructor(config: Partial<WasmModuleConfig> = {}) {
    this.config = {
      preferredModule: 'ruv-swarm',
      enableSIMD: true,
      memoryLimit: 50 * 1024 * 1024, // 50MB
      loadTimeout: 10000, // 10 seconds
      retryAttempts: 3,
      enableProfiling: true,
      enableAutoFallback: true,
      ...config
    }
    
    this.performanceLayer = new WasmPerformanceLayer()
    this.simdLayer = new SIMDAccelerationLayer()
    this.moduleStatus = this.initializeModuleStatus()
    this.moduleMetrics = this.initializeModuleMetrics()
    
    this.initializeAvailableModules()
  }

  /**
   * Initialize the WASM module manager
   */
  async initialize(): Promise<boolean> {
    this.startTime = Date.now()
    
    try {
      console.log('🚀 Initializing WASM Module Manager...')
      console.log('⚙️ Configuration:', this.config)
      
      // Initialize SIMD layer first
      if (this.config.enableSIMD) {
        await this.simdLayer.initialize()
      }
      
      // Attempt to load preferred module
      let success = false
      
      if (this.config.preferredModule === 'ruv-swarm') {
        success = await this.loadRuvSwarmModule()
      } else if (this.config.preferredModule === 'production') {
        success = await this.loadProductionModule()
      } else {
        success = await this.loadFallbackModule()
      }
      
      // Auto-fallback if enabled and preferred module failed
      if (!success && this.config.enableAutoFallback) {
        success = await this.attemptAutoFallback()
      }
      
      if (!success) {
        throw new Error('Failed to load any WASM module')
      }
      
      // Initialize performance layer
      await this.performanceLayer.initialize()
      
      // Start performance monitoring
      if (this.config.enableProfiling) {
        this.startPerformanceMonitoring()
      }
      
      this.isInitialized = true
      this.moduleMetrics.loadTime = Date.now() - this.startTime
      
      console.log('✅ WASM Module Manager initialized successfully')
      console.log(`📊 Status: ${this.moduleStatus.module} loaded in ${this.moduleMetrics.loadTime}ms`)
      
      return true
      
    } catch (error) {
      console.error('❌ WASM Module Manager initialization failed:', error)
      this.handleError(error.message)
      return false
    }
  }

  /**
   * Initialize available modules registry
   */
  private initializeAvailableModules(): void {
    this.availableModules.set('ruv-swarm', {
      name: 'ruv-swarm',
      description: 'High-performance neural network swarm orchestration',
      version: '1.0.18',
      capabilities: ['SIMD', 'neural-networks', 'swarm-orchestration', 'memory-pool'],
      memoryRequirement: 16 * 1024 * 1024, // 16MB
      loadPriority: 1,
      available: true
    })
    
    this.availableModules.set('production', {
      name: 'production',
      description: 'Production-ready WASM neural runtime',
      version: '1.0.0',
      capabilities: ['SIMD', 'neural-networks', 'performance-monitoring'],
      memoryRequirement: 8 * 1024 * 1024, // 8MB
      loadPriority: 2,
      available: true
    })
    
    this.availableModules.set('fallback', {
      name: 'fallback',
      description: 'Development fallback WASM bridge',
      version: '1.0.0',
      capabilities: ['neural-networks', 'basic-operations'],
      memoryRequirement: 4 * 1024 * 1024, // 4MB
      loadPriority: 3,
      available: true
    })
  }

  /**
   * Initialize module status
   */
  private initializeModuleStatus(): WasmModuleStatus {
    return {
      loaded: false,
      module: 'none',
      version: '0.0.0',
      capabilities: [],
      memoryUsage: 0,
      loadTime: 0,
      errorCount: 0
    }
  }

  /**
   * Initialize module metrics
   */
  private initializeModuleMetrics(): WasmModuleMetrics {
    return {
      loadTime: 0,
      memoryUsage: 0,
      operationsPerSecond: 0,
      errorRate: 0,
      uptime: 0,
      performanceScore: 0
    }
  }

  /**
   * Load ruv-swarm WASM module
   */
  private async loadRuvSwarmModule(): Promise<boolean> {
    try {
      console.log('🔄 Loading ruv-swarm WASM module...')
      
      const moduleInfo = this.availableModules.get('ruv-swarm')!
      
      // Check memory requirements
      if (moduleInfo.memoryRequirement > this.config.memoryLimit) {
        console.warn(`⚠️ ruv-swarm requires ${moduleInfo.memoryRequirement} bytes, limit is ${this.config.memoryLimit}`)
      }
      
      // Load with timeout
      const loadPromise = this.performanceLayer.initialize()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), this.config.loadTimeout)
      })
      
      await Promise.race([loadPromise, timeoutPromise])
      
      if (this.performanceLayer.isUsingRuvSwarm()) {
        this.updateModuleStatus('ruv-swarm', moduleInfo)
        console.log('✅ ruv-swarm WASM module loaded successfully')
        return true
      }
      
      return false
      
    } catch (error) {
      console.warn('⚠️ Failed to load ruv-swarm WASM module:', error.message)
      this.handleError(error.message)
      return false
    }
  }

  /**
   * Load production WASM module
   */
  private async loadProductionModule(): Promise<boolean> {
    try {
      console.log('🔄 Loading production WASM module...')
      
      const moduleInfo = this.availableModules.get('production')!
      
      // Initialize performance layer (will use production bridge)
      await this.performanceLayer.initialize()
      
      if (this.performanceLayer.isWasmInitialized()) {
        this.updateModuleStatus('production', moduleInfo)
        console.log('✅ Production WASM module loaded successfully')
        return true
      }
      
      return false
      
    } catch (error) {
      console.warn('⚠️ Failed to load production WASM module:', error.message)
      this.handleError(error.message)
      return false
    }
  }

  /**
   * Load fallback WASM module
   */
  private async loadFallbackModule(): Promise<boolean> {
    try {
      console.log('🔄 Loading fallback WASM module...')
      
      const moduleInfo = this.availableModules.get('fallback')!
      
      // Initialize performance layer (will use fallback bridge)
      await this.performanceLayer.initialize()
      
      if (this.performanceLayer.isWasmInitialized()) {
        this.updateModuleStatus('fallback', moduleInfo)
        console.log('✅ Fallback WASM module loaded successfully')
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('❌ Failed to load fallback WASM module:', error.message)
      this.handleError(error.message)
      return false
    }
  }

  /**
   * Attempt automatic fallback
   */
  private async attemptAutoFallback(): Promise<boolean> {
    console.log('🔄 Attempting automatic fallback...')
    
    const fallbackOrder = ['production', 'fallback']
    
    for (const moduleName of fallbackOrder) {
      if (moduleName === this.config.preferredModule) {
        continue // Skip already tried module
      }
      
      console.log(`🔄 Trying ${moduleName} module...`)
      
      let success = false
      
      if (moduleName === 'production') {
        success = await this.loadProductionModule()
      } else if (moduleName === 'fallback') {
        success = await this.loadFallbackModule()
      }
      
      if (success) {
        console.log(`✅ Auto-fallback successful: ${moduleName}`)
        return true
      }
    }
    
    console.error('❌ Auto-fallback failed: no modules available')
    return false
  }

  /**
   * Update module status
   */
  private updateModuleStatus(moduleName: string, moduleInfo: WasmModuleInfo): void {
    this.moduleStatus.loaded = true
    this.moduleStatus.module = moduleName
    this.moduleStatus.version = moduleInfo.version
    this.moduleStatus.capabilities = [...moduleInfo.capabilities]
    this.moduleStatus.memoryUsage = this.performanceLayer.getMemoryUsage()
    this.moduleStatus.loadTime = Date.now() - this.startTime
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const monitoringInterval = setInterval(() => {
      this.updateMetrics()
      this.performanceHistory.push(this.moduleMetrics.performanceScore)
      
      // Keep only last 100 measurements
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift()
      }
      
      // Check for performance degradation
      if (this.performanceHistory.length > 10) {
        const recent = this.performanceHistory.slice(-10)
        const older = this.performanceHistory.slice(-20, -10)
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
          
          if (recentAvg < olderAvg * 0.8) {
            console.warn('⚠️ Performance degradation detected')
          }
        }
      }
      
    }, 5000) // Update every 5 seconds
    
    // Store interval ID for cleanup
    this.monitoringIntervalId = monitoringInterval
  }
  
  private monitoringIntervalId: NodeJS.Timeout | null = null

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const performanceMetrics = this.performanceLayer.getPerformanceMetrics()
    const simdMetrics = this.simdLayer.getPerformanceMetrics()
    
    this.moduleMetrics.memoryUsage = performanceMetrics.memoryUsage
    this.moduleMetrics.operationsPerSecond = performanceMetrics.operationsPerSecond
    this.moduleMetrics.errorRate = performanceMetrics.errorRate || 0
    this.moduleMetrics.uptime = Date.now() - this.startTime
    
    // Calculate performance score (0-100)
    const memoryScore = Math.max(0, 100 - (this.moduleMetrics.memoryUsage / this.config.memoryLimit) * 100)
    const performanceScore = Math.min(100, this.moduleMetrics.operationsPerSecond / 1000)
    const errorScore = Math.max(0, 100 - this.moduleMetrics.errorRate * 100)
    const simdScore = simdMetrics.simdUtilization * 100
    
    this.moduleMetrics.performanceScore = (memoryScore + performanceScore + errorScore + simdScore) / 4
    
    // Update module status
    this.moduleStatus.memoryUsage = this.moduleMetrics.memoryUsage
  }

  /**
   * Handle errors
   */
  private handleError(errorMessage: string): void {
    this.moduleStatus.errorCount++
    this.moduleStatus.lastError = errorMessage
    
    this.errorHistory.push(errorMessage)
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift()
    }
    
    // Update error rate
    this.moduleMetrics.errorRate = this.moduleStatus.errorCount / Math.max(1, this.moduleMetrics.uptime / 1000)
  }

  /**
   * Get module status
   */
  getModuleStatus(): WasmModuleStatus {
    return { ...this.moduleStatus }
  }

  /**
   * Get module metrics
   */
  getModuleMetrics(): WasmModuleMetrics {
    this.updateMetrics()
    return { ...this.moduleMetrics }
  }

  /**
   * Get available modules
   */
  getAvailableModules(): WasmModuleInfo[] {
    return Array.from(this.availableModules.values())
  }

  /**
   * Get performance layer
   */
  getPerformanceLayer(): WasmPerformanceLayer {
    return this.performanceLayer
  }

  /**
   * Get SIMD layer
   */
  getSIMDLayer(): SIMDAccelerationLayer {
    return this.simdLayer
  }

  /**
   * Switch to different module
   */
  async switchModule(moduleName: string): Promise<boolean> {
    if (!this.availableModules.has(moduleName)) {
      console.error(`❌ Module ${moduleName} not available`)
      return false
    }
    
    if (this.moduleStatus.module === moduleName) {
      console.log(`ℹ️ Already using ${moduleName} module`)
      return true
    }
    
    console.log(`🔄 Switching to ${moduleName} module...`)
    
    // Cleanup current module
    await this.cleanup()
    
    // Load new module
    let success = false
    
    if (moduleName === 'ruv-swarm') {
      success = await this.loadRuvSwarmModule()
    } else if (moduleName === 'production') {
      success = await this.loadProductionModule()
    } else if (moduleName === 'fallback') {
      success = await this.loadFallbackModule()
    }
    
    if (success) {
      console.log(`✅ Successfully switched to ${moduleName} module`)
      
      // Restart performance monitoring
      if (this.config.enableProfiling) {
        this.startPerformanceMonitoring()
      }
    }
    
    return success
  }

  /**
   * Run health check
   */
  healthCheck(): {
    status: 'healthy' | 'warning' | 'error'
    module: WasmModuleStatus
    metrics: WasmModuleMetrics
    issues: string[]
  } {
    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    
    if (!this.isInitialized) {
      issues.push('WASM Module Manager not initialized')
      status = 'error'
    }
    
    if (!this.moduleStatus.loaded) {
      issues.push('No WASM module loaded')
      status = 'error'
    }
    
    if (this.moduleMetrics.memoryUsage > this.config.memoryLimit * 0.9) {
      issues.push(`Memory usage ${(this.moduleMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB near limit`)
      status = 'warning'
    }
    
    if (this.moduleMetrics.errorRate > 0.1) {
      issues.push(`Error rate ${(this.moduleMetrics.errorRate * 100).toFixed(1)}% too high`)
      status = 'warning'
    }
    
    if (this.moduleMetrics.performanceScore < 50) {
      issues.push(`Performance score ${this.moduleMetrics.performanceScore.toFixed(1)} below threshold`)
      status = 'warning'
    }
    
    return {
      status,
      module: this.getModuleStatus(),
      metrics: this.getModuleMetrics(),
      issues
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const status = this.getModuleStatus()
    const metrics = this.getModuleMetrics()
    const simdMetrics = this.simdLayer.getPerformanceMetrics()
    
    return `WASM Module Manager Performance Report:

📊 Module Status:
   - Active Module: ${status.module} v${status.version}
   - Load Time: ${status.loadTime}ms
   - Memory Usage: ${(status.memoryUsage / 1024 / 1024).toFixed(2)}MB
   - Capabilities: ${status.capabilities.join(', ')}
   - Error Count: ${status.errorCount}

⚡ Performance Metrics:
   - Operations/sec: ${metrics.operationsPerSecond.toFixed(0)}
   - Performance Score: ${metrics.performanceScore.toFixed(1)}/100
   - Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
   - Uptime: ${(metrics.uptime / 1000).toFixed(0)}s

🔧 SIMD Performance:
   - SIMD Support: ${this.simdLayer.isSIMDSupported() ? '✅' : '❌'}
   - Operations/sec: ${simdMetrics.operationsPerSecond.toFixed(0)}
   - Vectorization: ${(simdMetrics.vectorizationEfficiency * 100).toFixed(1)}%
   - Utilization: ${(simdMetrics.simdUtilization * 100).toFixed(1)}%

💡 Recent Performance: ${this.performanceHistory.slice(-5).map(s => s.toFixed(1)).join(', ')}
`
  }

  /**
   * Export configuration
   */
  exportConfig(): WasmModuleConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WasmModuleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Configuration updated:', this.config)
  }

  /**
   * Check if initialized
   */
  isModuleManagerInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up WASM Module Manager...')
    
    // Stop performance monitoring
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId)
      this.monitoringIntervalId = null
    }
    
    // Cleanup performance layer
    if (this.performanceLayer) {
      this.performanceLayer.cleanup()
    }
    
    // Cleanup SIMD layer
    if (this.simdLayer) {
      this.simdLayer.cleanup()
    }
    
    // Reset status and metrics
    this.moduleStatus = this.initializeModuleStatus()
    this.moduleMetrics = this.initializeModuleMetrics()
    this.performanceHistory = []
    this.errorHistory = []
    this.isInitialized = false
    
    console.log('✅ WASM Module Manager cleanup completed')
  }
}

export default WasmModuleManager