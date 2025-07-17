/**
 * Performance Dashboard Component
 * Real-time performance monitoring and optimization controls
 */

import React, { useState, useEffect } from 'react'
import usePerformanceMonitoring from '../hooks/usePerformanceMonitoring'

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