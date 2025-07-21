/**
 * Memory Optimization Manager for SASI
 * Advanced memory management, leak detection, and optimization
 */

// WeakRef polyfill for environments that don't support it
declare const WeakRef: any;
interface WeakRefConstructor {
  new <T extends object>(target: T): WeakRef<T>;
}
interface WeakRef<T extends object> {
  deref(): T | undefined;
}

interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss: number
}

interface MemoryLeak {
  id: string
  detected: number
  component: string
  growthRate: number
  severity: 'low' | 'medium' | 'high'
  description: string
}

interface MemoryPool {
  name: string
  size: number
  used: number
  buffers: ArrayBuffer[]
  allocation: number
  deallocations: number
}

interface MemoryOptimizationConfig {
  enablePooling: boolean
  enableLeakDetection: boolean
  enableCompression: boolean
  poolSizes: number[]
  leakThreshold: number
  snapshotInterval: number
}

export class MemoryOptimizationManager {
  private config: MemoryOptimizationConfig
  private memorySnapshots: MemorySnapshot[] = []
  private memoryPools: Map<string, MemoryPool> = new Map()
  private detectedLeaks: Map<string, MemoryLeak> = new Map()
  private gcRequestCount: number = 0
  private monitoringInterval: NodeJS.Timeout | null = null
  private weakReferences: WeakMap<object, string> = new WeakMap()
  private objectTracker: Map<string, Set<WeakRef<object>>> = new Map()

  constructor(config: Partial<MemoryOptimizationConfig> = {}) {
    this.config = {
      enablePooling: true,
      enableLeakDetection: true,
      enableCompression: true,
      poolSizes: [1024, 4096, 16384, 65536, 262144, 1048576, 4194304],
      leakThreshold: 10 * 1024 * 1024, // 10MB growth threshold
      snapshotInterval: 30000, // 30 seconds
      ...config
    }

    this.initializeMemoryPools()
    this.startMemoryMonitoring()
  }

  /**
   * Initialize memory pools for efficient allocation
   */
  private initializeMemoryPools(): void {
    if (!this.config.enablePooling) return

    for (const size of this.config.poolSizes) {
      const pool: MemoryPool = {
        name: `pool_${size}`,
        size,
        used: 0,
        buffers: [],
        allocation: 0,
        deallocations: 0
      }

      // Pre-allocate some buffers
      const preAllocCount = Math.min(10, Math.floor(1000000 / size))
      for (let i = 0; i < preAllocCount; i++) {
        pool.buffers.push(new ArrayBuffer(size))
      }

      this.memoryPools.set(pool.name, pool)
    }

    console.log(`💾 Memory pools initialized: ${this.config.poolSizes.length} pools`)
  }

  /**
   * Start memory monitoring and leak detection
   */
  private startMemoryMonitoring(): void {
    if (this.monitoringInterval) return

    this.monitoringInterval = setInterval(() => {
      this.takeMemorySnapshot()
      this.detectMemoryLeaks()
      this.optimizeMemoryUsage()
    }, this.config.snapshotInterval)

    console.log('📊 Memory monitoring started')
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('📊 Memory monitoring stopped')
    }
  }

  /**
   * Allocate memory from pool
   */
  allocateMemory(size: number, category: string = 'default'): ArrayBuffer | null {
    if (!this.config.enablePooling) {
      return new ArrayBuffer(size)
    }

    // Find best fitting pool
    const bestPool = this.findBestPool(size)
    if (!bestPool) {
      console.warn(`⚠️ No suitable memory pool for size ${size}`)
      return new ArrayBuffer(size)
    }

    const pool = this.memoryPools.get(bestPool)!
    
    // Get buffer from pool or create new one
    let buffer: ArrayBuffer
    if (pool.buffers.length > 0) {
      buffer = pool.buffers.pop()!
    } else {
      buffer = new ArrayBuffer(pool.size)
    }

    pool.used += pool.size
    pool.allocation++

    // Track allocation
    this.trackAllocation(buffer, category)

    return buffer
  }

  /**
   * Deallocate memory back to pool
   */
  deallocateMemory(buffer: ArrayBuffer, category: string = 'default'): void {
    if (!this.config.enablePooling) return

    const size = buffer.byteLength
    const bestPool = this.findBestPool(size)
    if (!bestPool) return

    const pool = this.memoryPools.get(bestPool)!
    
    // Return buffer to pool if not full
    if (pool.buffers.length < 20) {
      pool.buffers.push(buffer)
    }

    pool.used -= pool.size
    pool.deallocations++

    // Untrack allocation
    this.untrackAllocation(buffer, category)
  }

  /**
   * Find best memory pool for size
   */
  private findBestPool(size: number): string | null {
    for (const poolSize of this.config.poolSizes) {
      if (poolSize >= size) {
        return `pool_${poolSize}`
      }
    }
    return null
  }

  /**
   * Track memory allocation
   */
  private trackAllocation(buffer: ArrayBuffer, category: string): void {
    const id = this.generateAllocationId()
    this.weakReferences.set(buffer, id)
    
    if (!this.objectTracker.has(category)) {
      this.objectTracker.set(category, new Set())
    }
    
    this.objectTracker.get(category)!.add(new WeakRef(buffer))
  }

  /**
   * Untrack memory allocation
   */
  private untrackAllocation(buffer: ArrayBuffer, category: string): void {
    this.weakReferences.delete(buffer)
    
    if (this.objectTracker.has(category)) {
      const refs = this.objectTracker.get(category)!
      // Remove weak references to deallocated buffer
      let found = false
      refs.forEach(ref => {
        if (!found && ref.deref() === buffer) {
          refs.delete(ref)
          found = true
        }
      })
    }
  }

  /**
   * Take memory snapshot
   */
  private takeMemorySnapshot(): void {
    let snapshot: MemorySnapshot

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      snapshot = {
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers,
        rss: usage.rss
      }
    } else {
      // Browser environment simulation
      snapshot = {
        timestamp: Date.now(),
        heapUsed: this.estimateHeapUsed(),
        heapTotal: this.estimateHeapTotal(),
        external: 0,
        arrayBuffers: 0,
        rss: 0
      }
    }

    this.memorySnapshots.push(snapshot)

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift()
    }
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(): void {
    if (!this.config.enableLeakDetection || this.memorySnapshots.length < 10) return

    const recent = this.memorySnapshots.slice(-10)
    const growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed
    const timespan = recent[recent.length - 1].timestamp - recent[0].timestamp
    const growthRate = growth / (timespan / 1000) // bytes per second

    if (growth > this.config.leakThreshold) {
      const leakId = `leak_${Date.now()}`
      const leak: MemoryLeak = {
        id: leakId,
        detected: Date.now(),
        component: 'general',
        growthRate,
        severity: this.calculateLeakSeverity(growth),
        description: `Memory growth of ${this.formatBytes(growth)} detected over ${timespan / 1000}s`
      }

      this.detectedLeaks.set(leakId, leak)
      
      const emoji = leak.severity === 'high' ? '🚨' : leak.severity === 'medium' ? '⚠️' : '📋'
      console.log(`${emoji} Memory leak detected: ${leak.description}`)
    }
  }

  /**
   * Calculate leak severity
   */
  private calculateLeakSeverity(growth: number): 'low' | 'medium' | 'high' {
    if (growth > 50 * 1024 * 1024) return 'high'    // 50MB
    if (growth > 20 * 1024 * 1024) return 'medium'  // 20MB
    return 'low'
  }

  /**
   * Optimize memory usage
   */
  private optimizeMemoryUsage(): void {
    // Clean up weak references
    this.cleanupWeakReferences()
    
    // Request garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
      this.gcRequestCount++
    }
    
    // Optimize memory pools
    this.optimizeMemoryPools()
  }

  /**
   * Clean up weak references
   */
  private cleanupWeakReferences(): void {
    this.objectTracker.forEach((refs, category) => {
      const toDelete: WeakRef<object>[] = []
      
      refs.forEach(ref => {
        if (ref.deref() === undefined) {
          toDelete.push(ref)
        }
      })
      
      toDelete.forEach(ref => refs.delete(ref))
    })
  }

  /**
   * Optimize memory pools
   */
  private optimizeMemoryPools(): void {
    this.memoryPools.forEach((pool, name) => {
      // If pool is over-allocated, reduce buffer count
      if (pool.buffers.length > 20) {
        pool.buffers.splice(15, pool.buffers.length - 15)
      }
      
      // If pool is under-utilized, pre-allocate some buffers
      if (pool.buffers.length < 5 && pool.allocation > pool.deallocations) {
        for (let i = 0; i < 5; i++) {
          pool.buffers.push(new ArrayBuffer(pool.size))
        }
      }
    })
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
      this.gcRequestCount++
      console.log('🗑️ Garbage collection forced')
    } else {
      console.warn('⚠️ Garbage collection not available')
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStatistics(): any {
    const latest = this.memorySnapshots[this.memorySnapshots.length - 1]
    const first = this.memorySnapshots[0]
    const growth = latest && first ? latest.heapUsed - first.heapUsed : 0

    return {
      current: latest ? {
        heapUsed: this.formatBytes(latest.heapUsed),
        heapTotal: this.formatBytes(latest.heapTotal),
        external: this.formatBytes(latest.external),
        rss: this.formatBytes(latest.rss)
      } : null,
      growth: this.formatBytes(growth),
      pools: Array.from(this.memoryPools.values()).map(pool => ({
        name: pool.name,
        size: this.formatBytes(pool.size),
        used: this.formatBytes(pool.used),
        buffers: pool.buffers.length,
        allocations: pool.allocation,
        deallocations: pool.deallocations
      })),
      leaks: Array.from(this.detectedLeaks.values()).map(leak => ({
        id: leak.id,
        severity: leak.severity,
        description: leak.description,
        detected: new Date(leak.detected).toISOString()
      })),
      gc: {
        requestCount: this.gcRequestCount,
        available: typeof global !== 'undefined' && !!global.gc
      }
    }
  }

  /**
   * Get memory health score
   */
  getMemoryHealthScore(): number {
    if (this.memorySnapshots.length < 2) return 100

    const latest = this.memorySnapshots[this.memorySnapshots.length - 1]
    const previous = this.memorySnapshots[this.memorySnapshots.length - 2]
    
    let score = 100
    
    // Penalize for memory growth
    const growth = latest.heapUsed - previous.heapUsed
    if (growth > 0) {
      score -= Math.min(30, (growth / (10 * 1024 * 1024)) * 10)
    }
    
    // Penalize for high memory usage
    const usageRatio = latest.heapUsed / latest.heapTotal
    if (usageRatio > 0.8) {
      score -= (usageRatio - 0.8) * 50
    }
    
    // Penalize for detected leaks
    const activeLeaks = Array.from(this.detectedLeaks.values()).filter(
      leak => Date.now() - leak.detected < 300000 // 5 minutes
    )
    
    score -= activeLeaks.length * 20
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate allocation ID
   */
  private generateAllocationId(): string {
    return `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimate heap usage in browser
   */
  private estimateHeapUsed(): number {
    // Rough estimation based on object tracker
    let estimated = 0
    this.objectTracker.forEach(refs => {
      estimated += refs.size * 1024 // Estimate 1KB per tracked object
    })
    return estimated
  }

  /**
   * Estimate heap total in browser
   */
  private estimateHeapTotal(): number {
    return this.estimateHeapUsed() * 2 // Simple estimation
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getMemoryStatistics()
    const healthScore = this.getMemoryHealthScore()
    
    if (healthScore < 70) {
      recommendations.push('Memory health is degraded - consider running garbage collection')
    }
    
    if (this.detectedLeaks.size > 0) {
      recommendations.push('Memory leaks detected - investigate recent allocations')
    }
    
    if (this.memorySnapshots.length > 0) {
      const latest = this.memorySnapshots[this.memorySnapshots.length - 1]
      const usageRatio = latest.heapUsed / latest.heapTotal
      
      if (usageRatio > 0.8) {
        recommendations.push('High memory usage - consider optimizing data structures')
      }
    }
    
    // Check pool efficiency
    this.memoryPools.forEach(pool => {
      const efficiency = pool.deallocations / Math.max(pool.allocation, 1)
      if (efficiency < 0.8) {
        recommendations.push(`Pool ${pool.name} has low deallocation rate - possible memory leak`)
      }
    })
    
    return recommendations
  }

  /**
   * Clean up and shutdown
   */
  shutdown(): void {
    this.stopMemoryMonitoring()
    this.memoryPools.clear()
    this.detectedLeaks.clear()
    this.memorySnapshots.length = 0
    console.log('💾 Memory optimization manager shutdown')
  }
}

export default MemoryOptimizationManager