/**
 * Performance Regression Testing System for SASI
 * Automated detection and alerting for performance regressions
 */

interface BaselineMetric {
  name: string
  value: number
  timestamp: number
  version: string
  environment: string
}

interface RegressionTest {
  id: string
  name: string
  description: string
  metric: string
  baseline: BaselineMetric
  threshold: number
  enabled: boolean
  lastRun: number
  regressionHistory: RegressionResult[]
}

interface RegressionResult {
  testId: string
  timestamp: number
  currentValue: number
  baselineValue: number
  deviation: number
  deviationPercent: number
  passed: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  environment: string
}

interface PerformanceBaseline {
  version: string
  timestamp: number
  metrics: BaselineMetric[]
  environment: string
  buildHash: string
}

export class PerformanceRegressionTester {
  private baselines: Map<string, PerformanceBaseline> = new Map()
  private regressionTests: Map<string, RegressionTest> = new Map()
  private testResults: Map<string, RegressionResult[]> = new Map()
  private isRunning: boolean = false

  constructor() {
    this.initializeDefaultTests()
  }

  /**
   * Initialize default regression tests
   */
  private initializeDefaultTests(): void {
    const defaultTests: Omit<RegressionTest, 'id' | 'baseline' | 'lastRun' | 'regressionHistory'>[] = [
      {
        name: 'Agent Spawn Performance',
        description: 'Detect regressions in neural agent spawning time',
        metric: 'agent_spawn_time',
        threshold: 15, // 15% regression threshold
        enabled: true
      },
      {
        name: 'Neural Inference Performance',
        description: 'Detect regressions in neural inference latency',
        metric: 'neural_inference_time',
        threshold: 20, // 20% regression threshold
        enabled: true
      },
      {
        name: 'Memory Usage Regression',
        description: 'Detect significant increases in memory usage',
        metric: 'memory_usage_mb',
        threshold: 25, // 25% increase threshold
        enabled: true
      },
      {
        name: 'Cache Hit Ratio Regression',
        description: 'Detect decreases in cache efficiency',
        metric: 'cache_hit_ratio',
        threshold: 10, // 10% decrease threshold
        enabled: true
      },
      {
        name: 'WASM Load Performance',
        description: 'Detect regressions in WASM module loading',
        metric: 'wasm_load_time',
        threshold: 30, // 30% regression threshold
        enabled: true
      },
      {
        name: 'Database Query Performance',
        description: 'Detect regressions in database query times',
        metric: 'database_query_time',
        threshold: 25, // 25% regression threshold
        enabled: true
      }
    ]

    defaultTests.forEach(test => {
      const id = this.generateTestId(test.name)
      const regressionTest: RegressionTest = {
        ...test,
        id,
        baseline: this.createEmptyBaseline(),
        lastRun: 0,
        regressionHistory: []
      }
      this.regressionTests.set(id, regressionTest)
    })

    console.log(`📊 Initialized ${defaultTests.length} regression tests`)
  }

  /**
   * Create baseline from current performance metrics
   */
  async createBaseline(
    metrics: Record<string, number>,
    version: string,
    environment: string = 'production',
    buildHash: string = 'unknown'
  ): Promise<string> {
    const baselineId = `baseline_${version}_${environment}_${Date.now()}`
    const timestamp = Date.now()

    const baselineMetrics: BaselineMetric[] = Object.entries(metrics).map(([name, value]) => ({
      name,
      value,
      timestamp,
      version,
      environment
    }))

    const baseline: PerformanceBaseline = {
      version,
      timestamp,
      metrics: baselineMetrics,
      environment,
      buildHash
    }

    this.baselines.set(baselineId, baseline)

    // Update regression tests with new baselines
    for (const test of this.regressionTests.values()) {
      const metric = baselineMetrics.find(m => m.name === test.metric)
      if (metric) {
        test.baseline = metric
      }
    }

    console.log(`📊 Created performance baseline: ${baselineId}`)
    console.log(`📈 Baseline metrics: ${baselineMetrics.length} metrics captured`)

    return baselineId
  }

  /**
   * Run all regression tests
   */
  async runRegressionTests(
    currentMetrics: Record<string, number>,
    environment: string = 'production'
  ): Promise<RegressionResult[]> {
    if (this.isRunning) {
      console.warn('⚠️ Regression tests already running')
      return []
    }

    this.isRunning = true
    const results: RegressionResult[] = []

    console.log('🔍 Running performance regression tests...')

    try {
      for (const test of this.regressionTests.values()) {
        if (!test.enabled) continue

        const result = await this.runSingleTest(test, currentMetrics, environment)
        if (result) {
          results.push(result)
          this.storeTestResult(result)
        }
      }

      console.log(`✅ Regression tests completed: ${results.length} tests run`)
      
      // Log any regressions found
      const regressions = results.filter(r => !r.passed)
      if (regressions.length > 0) {
        console.warn(`⚠️ ${regressions.length} performance regressions detected`)
        regressions.forEach(reg => {
          const emoji = this.getSeverityEmoji(reg.severity)
          console.warn(`${emoji} ${reg.testId}: ${reg.deviationPercent.toFixed(1)}% regression`)
        })
      }

    } catch (error) {
      console.error('❌ Error running regression tests:', error)
    } finally {
      this.isRunning = false
    }

    return results
  }

  /**
   * Run single regression test
   */
  private async runSingleTest(
    test: RegressionTest,
    currentMetrics: Record<string, number>,
    environment: string
  ): Promise<RegressionResult | null> {
    const currentValue = currentMetrics[test.metric]
    if (currentValue === undefined) {
      console.warn(`⚠️ Metric ${test.metric} not found in current metrics`)
      return null
    }

    if (!test.baseline || test.baseline.value === 0) {
      console.warn(`⚠️ No baseline for test ${test.name}`)
      return null
    }

    const baselineValue = test.baseline.value
    const deviation = currentValue - baselineValue
    const deviationPercent = Math.abs((deviation / baselineValue) * 100)

    // Determine if this is a regression based on metric type
    const isRegression = this.isMetricRegression(test.metric, currentValue, baselineValue, test.threshold)
    
    const result: RegressionResult = {
      testId: test.id,
      timestamp: Date.now(),
      currentValue,
      baselineValue,
      deviation,
      deviationPercent,
      passed: !isRegression,
      severity: this.calculateSeverity(deviationPercent, test.threshold),
      environment
    }

    // Update test
    test.lastRun = Date.now()
    test.regressionHistory.push(result)

    // Keep only last 100 results
    if (test.regressionHistory.length > 100) {
      test.regressionHistory.shift()
    }

    return result
  }

  /**
   * Determine if metric shows regression
   */
  private isMetricRegression(
    metricName: string,
    currentValue: number,
    baselineValue: number,
    threshold: number
  ): boolean {
    const deviationPercent = Math.abs((currentValue - baselineValue) / baselineValue * 100)
    
    if (deviationPercent < threshold) return false

    // For these metrics, higher values are worse
    const higherIsBad = [
      'agent_spawn_time',
      'neural_inference_time',
      'memory_usage_mb',
      'wasm_load_time',
      'database_query_time',
      'network_latency',
      'error_rate_percent'
    ]

    // For these metrics, lower values are worse
    const lowerIsBad = [
      'cache_hit_ratio',
      'agent_efficiency_percent',
      'network_throughput'
    ]

    if (higherIsBad.includes(metricName)) {
      return currentValue > baselineValue
    }

    if (lowerIsBad.includes(metricName)) {
      return currentValue < baselineValue
    }

    // Default: assume higher is worse
    return currentValue > baselineValue
  }

  /**
   * Calculate regression severity
   */
  private calculateSeverity(deviationPercent: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviationPercent >= threshold * 3) return 'critical'
    if (deviationPercent >= threshold * 2) return 'high'
    if (deviationPercent >= threshold * 1.5) return 'medium'
    return 'low'
  }

  /**
   * Store test result
   */
  private storeTestResult(result: RegressionResult): void {
    if (!this.testResults.has(result.testId)) {
      this.testResults.set(result.testId, [])
    }

    const results = this.testResults.get(result.testId)!
    results.push(result)

    // Keep only last 1000 results per test
    if (results.length > 1000) {
      results.shift()
    }
  }

  /**
   * Get regression test report
   */
  getRegressionReport(): any {
    const allResults = Array.from(this.testResults.values()).flat()
    const recentResults = allResults.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
    
    const regressions = recentResults.filter(r => !r.passed)
    const severityCounts = {
      low: regressions.filter(r => r.severity === 'low').length,
      medium: regressions.filter(r => r.severity === 'medium').length,
      high: regressions.filter(r => r.severity === 'high').length,
      critical: regressions.filter(r => r.severity === 'critical').length
    }

    return {
      summary: {
        totalTests: this.regressionTests.size,
        enabledTests: Array.from(this.regressionTests.values()).filter(t => t.enabled).length,
        recentResults: recentResults.length,
        regressions: regressions.length,
        passRate: recentResults.length > 0 ? ((recentResults.length - regressions.length) / recentResults.length) * 100 : 100
      },
      severity: severityCounts,
      tests: Array.from(this.regressionTests.values()).map(test => ({
        id: test.id,
        name: test.name,
        description: test.description,
        metric: test.metric,
        threshold: test.threshold,
        enabled: test.enabled,
        lastRun: test.lastRun,
        baseline: test.baseline,
        recentResults: test.regressionHistory.slice(-10)
      })),
      baselines: Array.from(this.baselines.values()).map(baseline => ({
        version: baseline.version,
        timestamp: baseline.timestamp,
        environment: baseline.environment,
        buildHash: baseline.buildHash,
        metricsCount: baseline.metrics.length
      }))
    }
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(metricName: string, days: number = 7): any {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const allResults = Array.from(this.testResults.values()).flat()
    
    const relevantResults = allResults
      .filter(r => r.timestamp >= cutoff)
      .filter(r => {
        const test = this.regressionTests.get(r.testId)
        return test && test.metric === metricName
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    if (relevantResults.length === 0) {
      return {
        metric: metricName,
        trend: 'stable',
        confidence: 0,
        dataPoints: 0
      }
    }

    // Calculate trend
    const values = relevantResults.map(r => r.currentValue)
    const trend = this.calculateTrend(values)
    
    return {
      metric: metricName,
      trend: trend.direction,
      confidence: trend.confidence,
      dataPoints: values.length,
      latestValue: values[values.length - 1],
      change: values.length > 1 ? values[values.length - 1] - values[0] : 0,
      changePercent: values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0
    }
  }

  /**
   * Calculate trend direction and confidence
   */
  private calculateTrend(values: number[]): { direction: string, confidence: number } {
    if (values.length < 3) {
      return { direction: 'stable', confidence: 0 }
    }

    // Simple linear regression to detect trend
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared for confidence
    const yMean = sumY / n
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const rSquared = 1 - (ssRes / ssTot)

    let direction = 'stable'
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing'
    }

    return {
      direction,
      confidence: Math.max(0, Math.min(100, rSquared * 100))
    }
  }

  /**
   * Enable or disable regression test
   */
  setTestEnabled(testId: string, enabled: boolean): void {
    const test = this.regressionTests.get(testId)
    if (test) {
      test.enabled = enabled
      console.log(`📊 Test ${test.name} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Update test threshold
   */
  updateTestThreshold(testId: string, threshold: number): void {
    const test = this.regressionTests.get(testId)
    if (test) {
      test.threshold = threshold
      console.log(`📊 Test ${test.name} threshold updated to ${threshold}%`)
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '📋'
      case 'low': return 'ℹ️'
      default: return '📊'
    }
  }

  /**
   * Create empty baseline
   */
  private createEmptyBaseline(): BaselineMetric {
    return {
      name: '',
      value: 0,
      timestamp: 0,
      version: '',
      environment: ''
    }
  }

  /**
   * Generate test ID
   */
  private generateTestId(name: string): string {
    return `test_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
  }

  /**
   * Export baselines for persistence
   */
  exportBaselines(): any {
    return {
      baselines: Array.from(this.baselines.entries()),
      tests: Array.from(this.regressionTests.entries()),
      exportTimestamp: Date.now()
    }
  }

  /**
   * Import baselines from persistence
   */
  importBaselines(data: any): void {
    if (data.baselines) {
      this.baselines = new Map(data.baselines)
    }
    if (data.tests) {
      this.regressionTests = new Map(data.tests)
    }
    console.log(`📊 Imported ${this.baselines.size} baselines and ${this.regressionTests.size} tests`)
  }
}

export default PerformanceRegressionTester