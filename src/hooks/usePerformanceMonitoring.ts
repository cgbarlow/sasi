/**
 * React hook for performance monitoring and optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import PerformanceOptimizer from '../performance/performanceOptimizer'

interface PerformanceMetrics {
  wasmLoadTime: number
  simdOperationTime: number
  memoryUsage: number
  neuralInferenceTime: number
  agentSpawnTime: number
  renderTime: number
  networkLatency: number
  consensusTime: number
  fps: number
  frameTime: number
}

interface PerformanceConfig {
  enableSIMD: boolean
  enableWASMCaching: boolean
  enableMemoryPooling: boolean
  enableGPUAcceleration: boolean
  maxMemoryPerAgent: number
  targetFrameTime: number
  batchSize: number
  monitoringInterval: number
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
  resolved: boolean
}

interface UsePerformanceMonitoringReturn {
  metrics: PerformanceMetrics
  config: PerformanceConfig
  alerts: PerformanceAlert[]
  isOptimizing: boolean
  isMonitoring: boolean
  optimizer: PerformanceOptimizer | null
  startMonitoring: () => void
  stopMonitoring: () => void
  runOptimization: () => Promise<void>
  runBenchmarks: () => Promise<any>
  updateConfig: (newConfig: Partial<PerformanceConfig>) => void
  clearAlerts: () => void
  getPerformanceReport: () => any
}

export function usePerformanceMonitoring(
  initialConfig: Partial<PerformanceConfig> = {}
): UsePerformanceMonitoringReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    wasmLoadTime: 0,
    simdOperationTime: 0,
    memoryUsage: 0,
    neuralInferenceTime: 0,
    agentSpawnTime: 0,
    renderTime: 0,
    networkLatency: 0,
    consensusTime: 0,
    fps: 0,
    frameTime: 0
  })

  const [config, setConfig] = useState<PerformanceConfig>({
    enableSIMD: true,
    enableWASMCaching: true,
    enableMemoryPooling: true,
    enableGPUAcceleration: true,
    maxMemoryPerAgent: 50 * 1024 * 1024, // 50MB
    targetFrameTime: 16.67, // 60fps
    batchSize: 32,
    monitoringInterval: 1000, // 1 second
    ...initialConfig
  })

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [optimizer, setOptimizer] = useState<PerformanceOptimizer | null>(null)

  const monitoringIntervalRef = useRef<NodeJS.Timeout>()
  const frameTimeRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(0)

  // Initialize optimizer
  useEffect(() => {
    const initOptimizer = async () => {
      try {
        const opt = new PerformanceOptimizer(config)
        await opt.initialize()
        setOptimizer(opt)
      } catch (error) {
        console.error('Failed to initialize performance optimizer:', error)
        addAlert('error', 'Failed to initialize performance optimizer')
      }
    }

    initOptimizer()

    return () => {
      if (optimizer) {
        optimizer.cleanup()
      }
    }
  }, [])

  // Update optimizer config when config changes
  useEffect(() => {
    if (optimizer) {
      // Reinitialize optimizer with new config
      optimizer.cleanup()
      const newOptimizer = new PerformanceOptimizer(config)
      newOptimizer.initialize().then(() => {
        setOptimizer(newOptimizer)
      })
    }
  }, [config])

  // Add alert helper
  const addAlert = useCallback((type: 'warning' | 'error' | 'info', message: string) => {
    const alert: PerformanceAlert = {
      type,
      message,
      timestamp: Date.now(),
      resolved: false
    }
    setAlerts(prev => [...prev, alert])
  }, [])

  // Monitor frame time
  useEffect(() => {
    const measureFrameTime = () => {
      const now = performance.now()
      if (lastFrameTimeRef.current) {
        const frameTime = now - lastFrameTimeRef.current
        frameTimeRef.current.push(frameTime)
        
        // Keep only last 60 frames
        if (frameTimeRef.current.length > 60) {
          frameTimeRef.current.shift()
        }
        
        // Calculate FPS and average frame time
        const avgFrameTime = frameTimeRef.current.reduce((sum, time) => sum + time, 0) / frameTimeRef.current.length
        const fps = 1000 / avgFrameTime
        
        setMetrics(prev => ({
          ...prev,
          frameTime: avgFrameTime,
          fps
        }))
        
        // Check for performance issues
        if (avgFrameTime > config.targetFrameTime * 1.5) {
          addAlert('warning', `Frame time exceeding target: ${avgFrameTime.toFixed(2)}ms`)
        }
      }
      lastFrameTimeRef.current = now
      
      if (isMonitoring) {
        requestAnimationFrame(measureFrameTime)
      }
    }

    if (isMonitoring) {
      measureFrameTime()
    }
  }, [isMonitoring, config.targetFrameTime, addAlert])

  // Performance monitoring loop
  useEffect(() => {
    if (!isMonitoring || !optimizer) return

    const collectMetrics = () => {
      try {
        // Get memory usage
        const memoryInfo = (performance as any).memory
        if (memoryInfo) {
          const memoryUsage = memoryInfo.usedJSHeapSize
          setMetrics(prev => ({
            ...prev,
            memoryUsage
          }))
          
          // Check memory usage
          if (memoryUsage > config.maxMemoryPerAgent * 5) {
            addAlert('warning', `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`)
          }
        }

        // Get performance report from optimizer
        const report = optimizer.getPerformanceReport()
        if (report?.current) {
          setMetrics(prev => ({
            ...prev,
            ...report.current
          }))
        }

        // Check for various performance issues
        if (report?.current?.wasmLoadTime > 1000) {
          addAlert('warning', 'WASM modules loading slowly')
        }
        
        if (report?.current?.neuralInferenceTime > 200) {
          addAlert('warning', 'Neural inference time high')
        }
        
        if (report?.current?.agentSpawnTime > 1000) {
          addAlert('warning', 'Agent spawning slow')
        }

      } catch (error) {
        console.error('Error collecting performance metrics:', error)
        addAlert('error', 'Failed to collect performance metrics')
      }
    }

    monitoringIntervalRef.current = setInterval(collectMetrics, config.monitoringInterval)

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
    }
  }, [isMonitoring, optimizer, config.monitoringInterval, config.maxMemoryPerAgent, addAlert])

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!optimizer) {
      addAlert('error', 'Performance optimizer not initialized')
      return
    }
    
    setIsMonitoring(true)
    optimizer.startPerformanceMonitoring()
    addAlert('info', 'Performance monitoring started')
    console.log('📊 Performance monitoring started')
  }, [optimizer, addAlert])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current)
    }
    addAlert('info', 'Performance monitoring stopped')
    console.log('📊 Performance monitoring stopped')
  }, [addAlert])

  // Run optimization
  const runOptimization = useCallback(async () => {
    if (!optimizer) {
      addAlert('error', 'Performance optimizer not initialized')
      return
    }

    setIsOptimizing(true)
    addAlert('info', 'Running performance optimization...')
    
    try {
      await optimizer.initialize()
      addAlert('info', 'Performance optimization completed')
      console.log('🚀 Performance optimization completed')
    } catch (error) {
      console.error('Performance optimization failed:', error)
      addAlert('error', 'Performance optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }, [optimizer, addAlert])

  // Run benchmarks
  const runBenchmarks = useCallback(async () => {
    if (!optimizer) {
      addAlert('error', 'Performance optimizer not initialized')
      return null
    }

    try {
      addAlert('info', 'Running performance benchmarks...')
      const results = await optimizer.runBenchmarks()
      addAlert('info', 'Performance benchmarks completed')
      return results
    } catch (error) {
      console.error('Benchmarks failed:', error)
      addAlert('error', 'Performance benchmarks failed')
      return null
    }
  }, [optimizer, addAlert])

  // Update config
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig
    }))
    addAlert('info', 'Performance configuration updated')
  }, [addAlert])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    if (!optimizer) return null
    return optimizer.getPerformanceReport()
  }, [optimizer])

  return {
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
  }
}

export default usePerformanceMonitoring