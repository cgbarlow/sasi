/**
 * Performance Dashboard Component
 * Real-time performance monitoring and optimization controls
 */

import React, { useState, useEffect } from 'react'
import usePerformanceMonitoring from '../hooks/usePerformanceMonitoring'
import PerformanceCacheManager from '../performance/PerformanceCacheManager'
import PerformanceMonitoringSystem from '../performance/PerformanceMonitoringSystem'
import MemoryOptimizationManager from '../performance/MemoryOptimizationManager'
import PerformanceRegressionTester from '../performance/PerformanceRegressionTester'
import WASMPerformanceOptimizer from '../performance/WASMPerformanceOptimizer'
import AutomatedBenchmarkSuite from '../performance/AutomatedBenchmarkSuite'
import PerformanceIntegrationSystem from '../performance/PerformanceIntegrationSystem'

interface PerformanceDashboardProps {
  className?: string
}

interface MetricCardProps {
  title: string
  value: number
  unit: string
  target?: number
  status: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, target, status, trend }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#4ade80'
      case 'warning': return '#fbbf24'
      case 'critical': return '#f87171'
      default: return '#6b7280'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      case 'stable': return '→'
      default: return ''
    }
  }

  return (
    <div className="metric-card" style={{ 
      backgroundColor: '#1f2937',
      border: `2px solid ${getStatusColor(status)}`,
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      minWidth: '200px'
    }}>
      <div className="metric-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{ 
          color: '#e5e7eb',
          margin: 0,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {title}
        </h4>
        <span style={{ fontSize: '16px' }}>
          {getTrendIcon(trend)}
        </span>
      </div>
      
      <div className="metric-value" style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        color: getStatusColor(status),
        marginBottom: '4px'
      }}>
        {typeof value === 'number' ? value.toFixed(2) : value}{unit}
      </div>
      
      {target && (
        <div className="metric-target" style={{ 
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Target: {target.toFixed(2)}{unit}
        </div>
      )}
    </div>
  )
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className }) => {
  const {
    metrics,
    config,
    alerts,
    isOptimizing,
    isMonitoring,
    optimizer,
    startMonitoring,
    stopMonitoring,
    runOptimization,
    runBenchmarks,
    updateConfig,
    clearAlerts,
    getPerformanceReport
  } = usePerformanceMonitoring()

  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([])
  const [showBenchmarks, setShowBenchmarks] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showMemoryDetails, setShowMemoryDetails] = useState(false)
  const [showCacheDetails, setShowCacheDetails] = useState(false)
  const [showWASMDetails, setShowWASMDetails] = useState(false)
  const [showRegressionDetails, setShowRegressionDetails] = useState(false)
  const [showBenchmarkDetails, setShowBenchmarkDetails] = useState(false)
  const [advancedSystems, setAdvancedSystems] = useState<{
    cacheManager: PerformanceCacheManager | null
    monitoringSystem: PerformanceMonitoringSystem | null
    memoryManager: MemoryOptimizationManager | null
    regressionTester: PerformanceRegressionTester | null
    wasmOptimizer: WASMPerformanceOptimizer | null
    benchmarkSuite: AutomatedBenchmarkSuite | null
    integrationSystem: PerformanceIntegrationSystem | null
  }>({
    cacheManager: null,
    monitoringSystem: null,
    memoryManager: null,
    regressionTester: null,
    wasmOptimizer: null,
    benchmarkSuite: null,
    integrationSystem: null
  })
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [wasmStats, setWasmStats] = useState<any>(null)
  const [regressionStats, setRegressionStats] = useState<any>(null)
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<any>(null)
  const [performanceReport, setPerformanceReport] = useState<any>(null)

  // Initialize advanced performance systems
  useEffect(() => {
    const initializeAdvancedSystems = async () => {
      try {
        const cacheManager = new PerformanceCacheManager({
          maxSize: 100 * 1024 * 1024, // 100MB
          maxEntries: 1000,
          compressionEnabled: true,
          intelligentEviction: true
        })

        const memoryManager = new MemoryOptimizationManager({
          enablePooling: true,
          enableLeakDetection: true,
          leakThreshold: 10 * 1024 * 1024 // 10MB
        })

        const monitoringSystem = new PerformanceMonitoringSystem(cacheManager)
        monitoringSystem.startMonitoring(5000) // Monitor every 5 seconds

        const regressionTester = new PerformanceRegressionTester()
        const wasmOptimizer = new WASMPerformanceOptimizer()
        const benchmarkSuite = new AutomatedBenchmarkSuite()
        
        // Initialize integration system
        const integrationSystem = new PerformanceIntegrationSystem({
          cache: { maxSize: 100 * 1024 * 1024, maxEntries: 1000, compressionEnabled: true, intelligentEviction: true },
          memory: { enablePooling: true, enableLeakDetection: true, leakThreshold: 10 * 1024 * 1024, gcThreshold: 50 * 1024 * 1024 },
          wasm: { enablePreloading: true, enableStreaming: true, enableSIMD: true, optimizationLevel: 'standard' as const },
          monitoring: { intervalMs: 5000, enableAlerts: true, enableProfiling: true },
          benchmarking: { autoRun: true, intervalHours: 24, enableRegression: true }
        })

        // Set up benchmark suite with performance systems
        benchmarkSuite.setPerformanceSystems({
          cacheManager,
          wasmOptimizer
        })

        // Initialize WASM optimizer
        await wasmOptimizer.initializeOptimizer()

        // Start integration system
        await integrationSystem.start()

        setAdvancedSystems({
          cacheManager,
          monitoringSystem,
          memoryManager,
          regressionTester,
          wasmOptimizer,
          benchmarkSuite,
          integrationSystem
        })

        console.log('🚀 Advanced performance systems initialized')
      } catch (error) {
        console.error('❌ Failed to initialize advanced performance systems:', error)
      }
    }

    initializeAdvancedSystems()

    return () => {
      if (advancedSystems.monitoringSystem) {
        advancedSystems.monitoringSystem.stopMonitoring()
      }
      if (advancedSystems.memoryManager) {
        advancedSystems.memoryManager.shutdown()
      }
      if (advancedSystems.wasmOptimizer) {
        await advancedSystems.wasmOptimizer.cleanup()
      }
      if (advancedSystems.integrationSystem) {
        await advancedSystems.integrationSystem.stop()
      }
    }
  }, [])

  // Update advanced system metrics
  useEffect(() => {
    if (!advancedSystems.integrationSystem) return

    const updateInterval = setInterval(async () => {
      try {
        // Get comprehensive metrics from integration system
        const metrics = await advancedSystems.integrationSystem!.getComprehensiveMetrics()
        setComprehensiveMetrics(metrics)

        // Get individual component metrics
        if (advancedSystems.monitoringSystem) {
          const health = advancedSystems.monitoringSystem.getSystemHealth()
          setSystemHealth(health)
        }

        if (advancedSystems.memoryManager) {
          const memory = advancedSystems.memoryManager.getMemoryStatistics()
          setMemoryStats(memory)
        }

        if (advancedSystems.cacheManager) {
          const cache = advancedSystems.cacheManager.getStatusReport()
          setCacheStats(cache)
        }

        if (advancedSystems.wasmOptimizer) {
          const wasm = advancedSystems.wasmOptimizer.getPerformanceReport()
          setWasmStats(wasm)
        }

        if (advancedSystems.regressionTester) {
          const regression = advancedSystems.regressionTester.getRegressionReport()
          setRegressionStats(regression)
        }

      } catch (error) {
        console.error('Error updating advanced metrics:', error)
      }
    }, 5000)

    return () => clearInterval(updateInterval)
  }, [advancedSystems])

  // Determine metric status
  const getMetricStatus = (value: number, target: number, isLowerBetter: boolean = false) => {
    const ratio = isLowerBetter ? target / value : value / target
    if (ratio >= 1.0) return 'good'
    if (ratio >= 0.8) return 'warning'
    return 'critical'
  }

  // Handle benchmark run
  const handleRunBenchmarks = async () => {
    const results = await runBenchmarks()
    if (results) {
      setBenchmarkResults(results)
      setShowBenchmarks(true)
    }
  }

  // Handle config update
  const handleConfigUpdate = (key: string, value: any) => {
    updateConfig({ [key]: value })
  }

  return (
    <div className={`performance-dashboard ${className}`} style={{
      backgroundColor: '#111827',
      color: '#e5e7eb',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #374151'
    }}>
      {/* Header */}
      <div className="dashboard-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#f3f4f6'
        }}>
          🚀 Performance Dashboard
        </h2>
        
        <div className="dashboard-controls" style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            style={{
              padding: '8px 16px',
              backgroundColor: isMonitoring ? '#dc2626' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isMonitoring ? '⏹️ Stop' : '▶️ Start'} Monitoring
          </button>
          
          <button
            onClick={runOptimization}
            disabled={isOptimizing}
            style={{
              padding: '8px 16px',
              backgroundColor: isOptimizing ? '#6b7280' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isOptimizing ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isOptimizing ? '⏳ Optimizing...' : '⚡ Optimize'}
          </button>
          
          <button
            onClick={handleRunBenchmarks}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0891b2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Benchmark
          </button>
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⚙️ Config
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section" style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f3f4f6' }}>
              🚨 Alerts ({alerts.length})
            </h3>
            <button
              onClick={clearAlerts}
              style={{
                padding: '4px 8px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ 
            maxHeight: '120px',
            overflowY: 'auto',
            backgroundColor: '#1f2937',
            borderRadius: '6px',
            padding: '10px'
          }}>
            {alerts.slice(-5).map((alert, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: index < alerts.length - 1 ? '1px solid #374151' : 'none'
                }}
              >
                <span style={{ 
                  marginRight: '8px',
                  fontSize: '16px'
                }}>
                  {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span style={{ 
                  fontSize: '14px',
                  color: alert.type === 'error' ? '#f87171' : alert.type === 'warning' ? '#fbbf24' : '#60a5fa'
                }}>
                  {alert.message}
                </span>
                <span style={{ 
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <MetricCard
          title="Frame Rate"
          value={metrics.fps}
          unit=" fps"
          target={60}
          status={getMetricStatus(metrics.fps, 60)}
          trend={metrics.fps > 50 ? 'up' : metrics.fps > 30 ? 'stable' : 'down'}
        />
        
        <MetricCard
          title="Frame Time"
          value={metrics.frameTime}
          unit="ms"
          target={config.targetFrameTime}
          status={getMetricStatus(metrics.frameTime, config.targetFrameTime, true)}
          trend={metrics.frameTime < 20 ? 'up' : metrics.frameTime < 40 ? 'stable' : 'down'}
        />
        
        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage / 1024 / 1024}
          unit="MB"
          target={config.maxMemoryPerAgent / 1024 / 1024}
          status={getMetricStatus(metrics.memoryUsage, config.maxMemoryPerAgent * 2, true)}
          trend={metrics.memoryUsage < config.maxMemoryPerAgent ? 'up' : 'down'}
        />
        
        <MetricCard
          title="WASM Load Time"
          value={metrics.wasmLoadTime}
          unit="ms"
          target={500}
          status={getMetricStatus(metrics.wasmLoadTime, 500, true)}
          trend={metrics.wasmLoadTime < 300 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="Neural Inference"
          value={metrics.neuralInferenceTime}
          unit="ms"
          target={100}
          status={getMetricStatus(metrics.neuralInferenceTime, 100, true)}
          trend={metrics.neuralInferenceTime < 50 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="Agent Spawn Time"
          value={metrics.agentSpawnTime}
          unit="ms"
          target={1000}
          status={getMetricStatus(metrics.agentSpawnTime, 1000, true)}
          trend={metrics.agentSpawnTime < 500 ? 'up' : 'down'}
        />
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="system-health-section" style={{
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f3f4f6' }}>
            🏥 System Health
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                {systemHealth.overall === 'healthy' ? '💚' : systemHealth.overall === 'warning' ? '🟡' : '🔴'}
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>Overall</div>
              <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>
                {systemHealth.score.toFixed(0)}/100
              </div>
            </div>
            
            {Object.entries(systemHealth.components).map(([component, status]) => (
              <div key={component} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '❌'}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>
                  {component}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Performance Metrics */}
      <div className="advanced-metrics-section" style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#f3f4f6' }}>
            ⚡ Advanced Performance Metrics
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowMemoryDetails(!showMemoryDetails)}
              style={{
                padding: '4px 8px',
                backgroundColor: showMemoryDetails ? '#7c3aed' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              💾 Memory
            </button>
            <button
              onClick={() => setShowCacheDetails(!showCacheDetails)}
              style={{
                padding: '4px 8px',
                backgroundColor: showCacheDetails ? '#7c3aed' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗄️ Cache
            </button>
            <button
              onClick={() => setShowWASMDetails(!showWASMDetails)}
              style={{
                padding: '4px 8px',
                backgroundColor: showWASMDetails ? '#7c3aed' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ⚡ WASM
            </button>
            <button
              onClick={() => setShowRegressionDetails(!showRegressionDetails)}
              style={{
                padding: '4px 8px',
                backgroundColor: showRegressionDetails ? '#7c3aed' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📈 Regression
            </button>
            <button
              onClick={() => setShowBenchmarkDetails(!showBenchmarkDetails)}
              style={{
                padding: '4px 8px',
                backgroundColor: showBenchmarkDetails ? '#7c3aed' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔍 Benchmarks
            </button>
          </div>
        </div>

        {/* Memory Details */}
        {showMemoryDetails && memoryStats && (
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>
              💾 Memory Management
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {memoryStats.current && (
                <div>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                    Current Usage
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                    {memoryStats.current.heapUsed}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Total: {memoryStats.current.heapTotal}
                  </div>
                </div>
              )}
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Memory Pools
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {memoryStats.pools?.length || 0} Active
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  GC Requests: {memoryStats.gc?.requestCount || 0}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Memory Leaks
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: memoryStats.leaks?.length > 0 ? '#f87171' : '#4ade80' }}>
                  {memoryStats.leaks?.length || 0} Detected
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Growth: {memoryStats.growth}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cache Details */}
        {showCacheDetails && cacheStats && (
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>
              🗄️ Cache Performance
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Hit Ratio
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {((cacheStats.metrics?.hitRatio || 0) * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Target: >80%
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Cache Size
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {((cacheStats.metrics?.totalSize || 0) / 1024 / 1024).toFixed(1)}MB
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Entries: {cacheStats.metrics?.entryCount || 0}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Access Time
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {(cacheStats.metrics?.averageAccessTime || 0).toFixed(2)}ms
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Target: <5ms
                </div>
              </div>
            </div>
            
            {cacheStats.recommendations && cacheStats.recommendations.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                  💡 Recommendations:
                </div>
                {cacheStats.recommendations.map((rec: string, index: number) => (
                  <div key={index} style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '4px' }}>
                    • {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WASM Details */}
        {showWASMDetails && wasmStats && (
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>
              ⚡ WASM Performance
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Loaded Modules
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {wasmStats.loadedModules}/{wasmStats.totalModules}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Cache: {((wasmStats.cacheSize || 0) / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  SIMD Support
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: wasmStats.capabilities?.simdSupported ? '#4ade80' : '#f87171' }}>
                  {wasmStats.capabilities?.simdSupported ? 'Enabled' : 'Disabled'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Streaming: {wasmStats.capabilities?.streamingSupported ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Avg Load Time
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {wasmStats.modules ? 
                    (wasmStats.modules.reduce((sum: number, m: any) => sum + (m.loadTime || 0), 0) / wasmStats.modules.length).toFixed(2) 
                    : '0'}ms
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Target: <100ms
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regression Details */}
        {showRegressionDetails && regressionStats && (
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>
              📈 Performance Regression
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Pass Rate
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {regressionStats.summary?.passRate?.toFixed(1) || 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Tests: {regressionStats.summary?.enabledTests || 0}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Regressions
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: regressionStats.summary?.regressions > 0 ? '#f87171' : '#4ade80' }}>
                  {regressionStats.summary?.regressions || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Critical: {regressionStats.severity?.critical || 0}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Baselines
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {regressionStats.baselines?.length || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Latest trends available
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmark Details */}
        {showBenchmarkDetails && (
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>
              🔍 Benchmark Status
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Benchmark Suites
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  4 Available
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Neural, WASM, Memory, Cache
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  Auto-Run Status
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>
                  Enabled
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Daily execution
                </div>
              </div>
              
              <div>
                <button
                  onClick={async () => {
                    if (advancedSystems.benchmarkSuite) {
                      try {
                        const results = await advancedSystems.benchmarkSuite.runAllBenchmarks()
                        setBenchmarkResults(results)
                        setShowBenchmarks(true)
                      } catch (error) {
                        console.error('Benchmark failed:', error)
                      }
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0891b2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%'
                  }}
                >
                  🚀 Run All Benchmarks
                </button>
              </div>
            </div>
            
            {advancedSystems.integrationSystem && (
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={async () => {
                    try {
                      const report = await advancedSystems.integrationSystem!.generatePerformanceReport()
                      setPerformanceReport(report)
                      console.log('Performance Report:', report)
                    } catch (error) {
                      console.error('Report generation failed:', error)
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%'
                  }}
                >
                  📊 Generate Comprehensive Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="config-panel" style={{
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f3f4f6' }}>
            ⚙️ Configuration
          </h3>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#d1d5db' }}>
                Enable SIMD
              </label>
              <input
                type="checkbox"
                checked={config.enableSIMD}
                onChange={(e) => handleConfigUpdate('enableSIMD', e.target.checked)}
                style={{ margin: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#d1d5db' }}>
                Enable WASM Caching
              </label>
              <input
                type="checkbox"
                checked={config.enableWASMCaching}
                onChange={(e) => handleConfigUpdate('enableWASMCaching', e.target.checked)}
                style={{ margin: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#d1d5db' }}>
                Enable Memory Pooling
              </label>
              <input
                type="checkbox"
                checked={config.enableMemoryPooling}
                onChange={(e) => handleConfigUpdate('enableMemoryPooling', e.target.checked)}
                style={{ margin: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#d1d5db' }}>
                Batch Size
              </label>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => handleConfigUpdate('batchSize', parseInt(e.target.value))}
                style={{ 
                  width: '100%',
                  padding: '4px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#d1d5db' }}>
                Target Frame Time (ms)
              </label>
              <input
                type="number"
                value={config.targetFrameTime}
                onChange={(e) => handleConfigUpdate('targetFrameTime', parseFloat(e.target.value))}
                style={{ 
                  width: '100%',
                  padding: '4px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Results */}
      {showBenchmarks && benchmarkResults.length > 0 && (
        <div className="benchmark-results" style={{
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f3f4f6' }}>
              🔍 Benchmark Results
            </h3>
            <button
              onClick={() => setShowBenchmarks(false)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Hide
            </button>
          </div>
          
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#d1d5db' }}>Test</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#d1d5db' }}>Before</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#d1d5db' }}>After</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#d1d5db' }}>Improvement</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#d1d5db' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkResults.map((result, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '8px', color: '#e5e7eb' }}>{result.testName}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#e5e7eb' }}>
                      {result.beforeMs.toFixed(2)}ms
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#e5e7eb' }}>
                      {result.afterMs.toFixed(2)}ms
                    </td>
                    <td style={{ 
                      padding: '8px',
                      textAlign: 'right',
                      color: result.improvement > 0 ? '#4ade80' : '#f87171'
                    }}>
                      {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="status-footer" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#9ca3af',
        borderTop: '1px solid #374151',
        paddingTop: '10px'
      }}>
        <div>
          Status: {isMonitoring ? '🟢 Monitoring Active' : '🔴 Monitoring Inactive'}
        </div>
        <div>
          Optimizer: {optimizer ? '✅ Ready' : '❌ Not Initialized'}
        </div>
        <div>
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard