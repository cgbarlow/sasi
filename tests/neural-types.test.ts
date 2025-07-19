/**
 * TDD Tests for Neural Types
 * Testing the exported neural interfaces and their usage
 */

import {
  NeuralBridgeHealth,
  WasmPerformanceMetrics,
  ComponentScores,
  PerformanceAlert,
  SystemHealthMetrics,
  ExtendedPerformanceAlert
} from '../src/types/neural'

describe('Neural Types TDD Tests', () => {
  describe('WasmPerformanceMetrics', () => {
    it('should validate required properties exist', () => {
      const metrics: WasmPerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 50,
        simdAcceleration: true,
        throughput: 80,
        efficiency: 95
      }
      
      expect(metrics.executionTime).toBe(100)
      expect(metrics.memoryUsage).toBe(50)
      expect(metrics.simdAcceleration).toBe(true)
      expect(metrics.throughput).toBe(80)
      expect(metrics.efficiency).toBe(95)
    })

    it('should support optional properties', () => {
      const metrics: WasmPerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 50,
        simdAcceleration: true,
        throughput: 80,
        efficiency: 95,
        loadTime: 30,
        operationsCount: 1000,
        averageOperationTime: 5
      }
      
      expect(metrics.loadTime).toBe(30)
      expect(metrics.operationsCount).toBe(1000)
      expect(metrics.averageOperationTime).toBe(5)
    })
  })

  describe('ComponentScores', () => {
    it('should have all required component scores', () => {
      const scores: ComponentScores = {
        neural: 95,
        memory: 85,
        performance: 90,
        network: 88,
        wasm: 92
      }
      
      expect(typeof scores.neural).toBe('number')
      expect(typeof scores.memory).toBe('number')
      expect(typeof scores.performance).toBe('number')
      expect(typeof scores.network).toBe('number')
      expect(typeof scores.wasm).toBe('number')
    })
  })

  describe('NeuralBridgeHealth', () => {
    it('should validate complete health object', () => {
      const componentScores: ComponentScores = {
        neural: 95,
        memory: 85, 
        performance: 90,
        network: 88,
        wasm: 92
      }

      const systemMetrics: SystemHealthMetrics = {
        overallScore: 90,
        componentScores,
        activeAlerts: [],
        recommendations: ['Monitor memory usage'],
        uptime: 3600000,
        lastCheck: new Date()
      }

      const wasmMetrics: WasmPerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 50,
        simdAcceleration: true,
        throughput: 80,
        efficiency: 95
      }

      const health: NeuralBridgeHealth = {
        status: 'healthy',
        moduleLoaded: true,
        ruvFannIntegration: true,
        wasmInitialized: true,
        simdSupported: true,
        performanceMetrics: wasmMetrics,
        systemMetrics,
        activeAlerts: [],
        lastHealthCheck: new Date(),
        uptime: 3600000
      }
      
      expect(health.status).toBe('healthy')
      expect(health.moduleLoaded).toBe(true)
      expect(health.performanceMetrics).toEqual(wasmMetrics)
      expect(health.systemMetrics).toEqual(systemMetrics)
    })

    it('should support all status types', () => {
      const validStatuses: Array<NeuralBridgeHealth['status']> = [
        'healthy', 'warning', 'critical', 'error'
      ]
      
      validStatuses.forEach(status => {
        expect(['healthy', 'warning', 'critical', 'error']).toContain(status)
      })
    })
  })

  describe('PerformanceAlert', () => {
    it('should support error_rate alert type', () => {
      const alert: PerformanceAlert = {
        type: 'error_rate',
        severity: 'warning',
        message: 'Error rate exceeds threshold',
        value: 15,
        threshold: 10,
        timestamp: Date.now()
      }
      
      expect(alert.type).toBe('error_rate')
      expect(alert.severity).toBe('warning')
    })

    it('should support all alert types and severities', () => {
      const alertTypes: Array<PerformanceAlert['type']> = [
        'spawn_time', 'inference_time', 'memory_usage', 'system_health', 'error_rate'
      ]
      
      const severities: Array<PerformanceAlert['severity']> = [
        'low', 'medium', 'high', 'critical', 'warning'
      ]
      
      alertTypes.forEach(type => {
        severities.forEach(severity => {
          const alert: PerformanceAlert = {
            type,
            severity,
            message: `Test alert for ${type}`,
            value: 100,
            threshold: 80,
            timestamp: Date.now()
          }
          
          expect(alert.type).toBe(type)
          expect(alert.severity).toBe(severity)
        })
      })
    })
  })

  describe('ExtendedPerformanceAlert', () => {
    it('should extend PerformanceAlert with additional properties', () => {
      const extendedAlert: ExtendedPerformanceAlert = {
        id: 'alert_123',
        type: 'memory_usage',
        severity: 'high',
        message: 'Memory usage is high',
        value: 90,
        threshold: 80,
        timestamp: Date.now(),
        acknowledged: false,
        resolvedAt: Date.now() + 1000,
        details: { source: 'neural-monitor' }
      }
      
      expect(extendedAlert.id).toBe('alert_123')
      expect(extendedAlert.acknowledged).toBe(false)
      expect(typeof extendedAlert.resolvedAt).toBe('number')
      expect(extendedAlert.details).toEqual({ source: 'neural-monitor' })
    })
  })

  describe('Type Integration Tests', () => {
    it('should work together in service scenarios', () => {
      // Test scenario: Health monitoring service receives metrics and creates health status
      const wasmMetrics: WasmPerformanceMetrics = {
        executionTime: 150,
        memoryUsage: 75,
        simdAcceleration: true,
        throughput: 60,
        efficiency: 85,
        loadTime: 40,
        operationsCount: 500,
        averageOperationTime: 8
      }

      const componentScores: ComponentScores = {
        neural: 80,
        memory: 70,
        performance: 75,
        network: 85,
        wasm: 90
      }

      const alert: ExtendedPerformanceAlert = {
        id: 'perf_001',
        type: 'inference_time',
        severity: 'medium',
        message: 'Inference time elevated',
        value: wasmMetrics.averageOperationTime || 0,
        threshold: 5,
        timestamp: Date.now(),
        acknowledged: false
      }

      const systemMetrics: SystemHealthMetrics = {
        overallScore: 80,
        componentScores,
        activeAlerts: [alert],
        recommendations: ['Consider optimization'],
        uptime: 7200000,
        lastCheck: new Date()
      }

      const health: NeuralBridgeHealth = {
        status: 'warning',
        moduleLoaded: true,
        ruvFannIntegration: true,
        wasmInitialized: true,
        simdSupported: true,
        performanceMetrics: wasmMetrics,
        systemMetrics,
        activeAlerts: [alert],
        lastHealthCheck: new Date(),
        uptime: 7200000
      }

      // Verify integration works
      expect(health.performanceMetrics.averageOperationTime).toBe(8)
      expect(health.systemMetrics.componentScores.neural).toBe(80)
      expect(health.activeAlerts[0].type).toBe('inference_time')
      expect(health.status).toBe('warning')
    })
  })
})