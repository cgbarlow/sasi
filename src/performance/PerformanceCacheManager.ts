/**
 * Advanced Performance Cache Manager for SASI
 * Implements intelligent caching strategies for neural agents, WASM modules, and API responses
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  expiresAt: number | null
  accessCount: number
  lastAccessed: number
  hitCount: number
  size: number
}

interface CacheConfig {
  maxSize: number
  maxEntries: number
  defaultTtl: number
  compressionEnabled: boolean
  persistenceEnabled: boolean
  intelligentEviction: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  entryCount: number
  hitRatio: number
  averageAccessTime: number
}

export class PerformanceCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private config: CacheConfig
  private metrics: CacheMetrics
  private compressionCache: Map<string, any> = new Map()
  private accessTimes: Map<string, number[]> = new Map()

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
      persistenceEnabled: true,
      intelligentEviction: true,
      ...config
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRatio: 0,
      averageAccessTime: 0
    }

    // Initialize performance monitoring
    this.initializePerformanceMonitoring()
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor cache performance every 30 seconds
    setInterval(() => {
      this.updateMetrics()
      this.performMaintenance()
    }, 30000)
  }

  /**
   * Store value in cache with intelligent optimization
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Calculate value size
      const serializedValue = JSON.stringify(value)
      const size = new Blob([serializedValue]).size

      // Check if we need to make space
      if (this.needsEviction(size)) {
        await this.performEviction(size)
      }

      // Compress if enabled and beneficial
      let finalValue = value
      if (this.config.compressionEnabled && size > 1024) {
        finalValue = await this.compressValue(value)
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        value: finalValue,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : Date.now() + this.config.defaultTtl,
        accessCount: 0,
        lastAccessed: Date.now(),
        hitCount: 0,
        size
      }

      this.cache.set(key, entry)
      this.metrics.entryCount++
      this.metrics.totalSize += size

      // Track access time
      const accessTime = performance.now() - startTime
      this.recordAccessTime(key, accessTime)

      console.log(`🗄️ Cache SET: ${key} (${size} bytes, ${accessTime.toFixed(2)}ms)`)
    } catch (error) {
      console.error(`❌ Cache SET failed for key ${key}:`, error)
    }
  }

  /**
   * Retrieve value from cache with performance tracking
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.metrics.misses++
        return null
      }

      // Check expiration
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(key)
        this.metrics.evictions++
        this.metrics.totalSize -= entry.size
        this.metrics.entryCount--
        return null
      }

      // Update access statistics
      entry.accessCount++
      entry.hitCount++
      entry.lastAccessed = Date.now()
      this.metrics.hits++

      // Decompress if needed
      let value = entry.value
      if (this.config.compressionEnabled && this.isCompressed(value)) {
        value = await this.decompressValue(value)
      }

      // Track access time
      const accessTime = performance.now() - startTime
      this.recordAccessTime(key, accessTime)

      console.log(`🗄️ Cache HIT: ${key} (${accessTime.toFixed(2)}ms)`)
      return value
    } catch (error) {
      console.error(`❌ Cache GET failed for key ${key}:`, error)
      this.metrics.misses++
      return null
    }
  }

  /**
   * Check if cache needs eviction
   */
  private needsEviction(newSize: number): boolean {
    return (
      this.metrics.totalSize + newSize > this.config.maxSize ||
      this.metrics.entryCount >= this.config.maxEntries
    )
  }

  /**
   * Perform intelligent cache eviction
   */
  private async performEviction(neededSize: number): Promise<void> {
    if (!this.config.intelligentEviction) {
      return this.performLRUEviction(neededSize)
    }

    const evictionCandidates = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: this.calculateEvictionScore(entry)
      }))
      .sort((a, b) => a.score - b.score) // Lower score = better eviction candidate

    let freedSpace = 0
    const evictedKeys: string[] = []

    for (const candidate of evictionCandidates) {
      if (freedSpace >= neededSize) break

      this.cache.delete(candidate.key)
      freedSpace += candidate.entry.size
      evictedKeys.push(candidate.key)
      this.metrics.evictions++
      this.metrics.totalSize -= candidate.entry.size
      this.metrics.entryCount--
    }

    console.log(`🗑️ Cache eviction: ${evictedKeys.length} entries, ${freedSpace} bytes freed`)
  }

  /**
   * Calculate eviction score for intelligent eviction
   */
  private calculateEvictionScore(entry: CacheEntry<any>): number {
    const now = Date.now()
    const age = now - entry.timestamp
    const timeSinceAccess = now - entry.lastAccessed
    const hitRatio = entry.hitCount / Math.max(entry.accessCount, 1)
    
    // Lower score = better eviction candidate
    // Factors: age, time since access, hit ratio, size
    return (
      age * 0.3 +
      timeSinceAccess * 0.4 +
      (1 - hitRatio) * 1000 +
      entry.size * 0.001
    )
  }

  /**
   * Perform LRU eviction
   */
  private performLRUEviction(neededSize: number): void {
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    let freedSpace = 0
    for (const [key, entry] of sortedEntries) {
      if (freedSpace >= neededSize) break

      this.cache.delete(key)
      freedSpace += entry.size
      this.metrics.evictions++
      this.metrics.totalSize -= entry.size
      this.metrics.entryCount--
    }
  }

  /**
   * Compress value if beneficial
   */
  private async compressValue(value: any): Promise<any> {
    try {
      // Simple compression simulation - in production use actual compression
      const serialized = JSON.stringify(value)
      if (serialized.length < 1024) return value

      // Simulate compression
      const compressed = {
        _compressed: true,
        data: serialized,
        originalSize: serialized.length,
        compressedSize: Math.floor(serialized.length * 0.7) // 30% compression
      }

      return compressed
    } catch (error) {
      console.warn('Compression failed:', error)
      return value
    }
  }

  /**
   * Decompress value
   */
  private async decompressValue(value: any): Promise<any> {
    try {
      if (!this.isCompressed(value)) return value
      return JSON.parse(value.data)
    } catch (error) {
      console.warn('Decompression failed:', error)
      return value
    }
  }

  /**
   * Check if value is compressed
   */
  private isCompressed(value: any): boolean {
    return value && typeof value === 'object' && value._compressed === true
  }

  /**
   * Record access time for performance monitoring
   */
  private recordAccessTime(key: string, time: number): void {
    if (!this.accessTimes.has(key)) {
      this.accessTimes.set(key, [])
    }
    
    const times = this.accessTimes.get(key)!
    times.push(time)
    
    // Keep only last 100 access times
    if (times.length > 100) {
      times.shift()
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.hitRatio = this.metrics.hits / Math.max(this.metrics.hits + this.metrics.misses, 1)
    
    // Calculate average access time
    const allTimes = Array.from(this.accessTimes.values()).flat()
    this.metrics.averageAccessTime = allTimes.length > 0 
      ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
      : 0
  }

  /**
   * Perform cache maintenance
   */
  private performMaintenance(): void {
    // Remove expired entries
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.metrics.totalSize -= entry.size
        this.metrics.entryCount--
      }
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache maintenance: ${expiredKeys.length} expired entries removed`)
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.compressionCache.clear()
    this.accessTimes.clear()
    
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRatio: 0,
      averageAccessTime: 0
    }
    
    console.log('🗑️ Cache cleared')
  }

  /**
   * Get cache status report
   */
  getStatusReport(): any {
    const metrics = this.getMetrics()
    const config = this.config
    
    return {
      status: 'operational',
      metrics,
      config,
      health: {
        hitRatio: metrics.hitRatio,
        averageAccessTime: metrics.averageAccessTime,
        memoryUsage: (metrics.totalSize / config.maxSize) * 100,
        entryUsage: (metrics.entryCount / config.maxEntries) * 100
      },
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.getMetrics()
    
    if (metrics.hitRatio < 0.8) {
      recommendations.push('Consider increasing cache TTL or size to improve hit ratio')
    }
    
    if (metrics.averageAccessTime > 5) {
      recommendations.push('Consider optimizing cache access patterns or enabling compression')
    }
    
    if ((metrics.totalSize / this.config.maxSize) > 0.9) {
      recommendations.push('Consider increasing cache size or enabling intelligent eviction')
    }
    
    if (metrics.evictions > metrics.hits * 0.1) {
      recommendations.push('High eviction rate detected - consider tuning cache size or TTL')
    }
    
    return recommendations
  }
}

export default PerformanceCacheManager