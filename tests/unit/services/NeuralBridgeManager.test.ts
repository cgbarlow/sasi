/**
 * Neural Bridge Manager Tests
 * 
 * Comprehensive tests for enhanced neural bridge functionality
 */

import { jest } from '@jest/globals'
import { NeuralBridgeManager } from '../../../src/services/NeuralBridgeManager'
import { NeuralBridgeConfigManager } from '../../../src/services/NeuralBridgeConfigManager'
import { NeuralBridgeHealthMonitor } from '../../../src/services/NeuralBridgeHealthMonitor'
import type { NeuralConfiguration } from '../../../src/types/neural'

// Mock dependencies
jest.mock('../../../src/utils/ProductionWasmBridge')
jest.mock('../../../src/services/NeuralAgentManager')
jest.mock('../../../src/services/NeuralMeshService')

describe('NeuralBridgeManager', () => {
  let neuralBridge: NeuralBridgeManager
  let mockConfig: any
  
  beforeEach(() => {
    mockConfig = {
      enableRuvFann: true,
      simdAcceleration: true,
      enableOptimizations: true,
      enablePerformanceMonitoring: true,
      enableHealthChecks: true,
      maxAgents: 10,
      memoryLimitPerAgent: 5 * 1024 * 1024,
      inferenceTimeout: 50,
      spawnTimeout: 12,
      logLevel: 'info' as const
    }
    
    neuralBridge = new NeuralBridgeManager(mockConfig)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('initialization', () => {
    test('should initialize with default configuration', () => {
      const bridge = new NeuralBridgeManager()
      expect(bridge).toBeDefined()
    })
    
    test('should initialize with custom configuration', () => {
      const customConfig = {
        enableRuvFann: false,
        maxAgents: 5,
        logLevel: 'debug' as const
      }
      
      const bridge = new NeuralBridgeManager(customConfig)
      expect(bridge).toBeDefined()
      
      const config = bridge.getConfiguration()
      expect(config.enableRuvFann).toBe(false)
      expect(config.maxAgents).toBe(5)
      expect(config.logLevel).toBe('debug')
    })
    
    test('should emit initialized event on successful initialization', async () => {
      const initializePromise = new Promise<void>((resolve) => {
        neuralBridge.on('initialized', () => {
          resolve()
        })
      })
      
      await neuralBridge.initialize()
      await initializePromise
    })
    
    test('should handle initialization failure gracefully', async () => {
      // Mock WASM bridge initialization failure
      const mockWasmBridge = neuralBridge as any
      mockWasmBridge.wasmBridge = {
        initialize: jest.fn().mockResolvedValue(false)
      }
      
      const result = await neuralBridge.initialize()
      expect(result).toBe(false)
    })
  })
  
  describe('agent management', () => {
    beforeEach(async () => {
      await neuralBridge.initialize()
    })
    
    test('should create neural agent with ruv-fann integration', async () => {
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [10, 8, 1],
        activationFunction: 'relu',
        simdOptimized: true
      }
      
      const agent = await neuralBridge.createAgent(config)
      
      expect(agent).toBeDefined()
      expect(agent.id).toBeDefined()
      expect(agent.config.type).toBe('mlp')
      expect(agent.config.simdOptimized).toBe(true)
    })
    
    test('should track agent creation performance', async () => {
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [5, 3, 1]
      }
      
      const startTime = Date.now()
      const agent = await neuralBridge.createAgent(config)
      const endTime = Date.now()
      
      const spawnTime = endTime - startTime
      expect(spawnTime).toBeLessThan(100) // Should be fast in tests
    })
    
    test('should emit agentCreated event', async () => {
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [3, 2, 1]
      }
      
      const eventPromise = new Promise<void>((resolve) => {
        neuralBridge.on('agentCreated', (event) => {
          expect(event.agentId).toBeDefined()
          expect(event.spawnTime).toBeDefined()
          expect(event.config).toEqual(config)
          resolve()
        })
      })
      
      await neuralBridge.createAgent(config)
      await eventPromise
    })
    
    test('should handle agent creation failure', async () => {
      const invalidConfig = {} as NeuralConfiguration
      
      await expect(neuralBridge.createAgent(invalidConfig)).rejects.toThrow()
    })
  })
  
  describe('neural inference', () => {
    let agentId: string
    
    beforeEach(async () => {
      await neuralBridge.initialize()
      
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [3, 2, 1]
      }
      
      const agent = await neuralBridge.createAgent(config)
      agentId = agent.id
    })
    
    test('should run inference with performance monitoring', async () => {
      const inputs = [1, 2, 3]
      
      const startTime = Date.now()
      const outputs = await neuralBridge.runInference(agentId, inputs)
      const endTime = Date.now()
      
      expect(outputs).toBeDefined()
      expect(Array.isArray(outputs)).toBe(true)
      expect(outputs.length).toBeGreaterThan(0)
      
      const inferenceTime = endTime - startTime
      expect(inferenceTime).toBeLessThan(100) // Should be fast in tests
    })
    
    test('should emit inferenceCompleted event', async () => {
      const inputs = [1, 2, 3]
      
      const eventPromise = new Promise<void>((resolve) => {
        neuralBridge.on('inferenceCompleted', (event) => {
          expect(event.agentId).toBe(agentId)
          expect(event.inferenceTime).toBeDefined()
          expect(event.inputSize).toBe(inputs.length)
          expect(event.outputSize).toBeGreaterThan(0)
          resolve()
        })
      })
      
      await neuralBridge.runInference(agentId, inputs)
      await eventPromise
    })
    
    test('should handle inference with invalid agent ID', async () => {
      const inputs = [1, 2, 3]
      
      await expect(neuralBridge.runInference('invalid-id', inputs)).rejects.toThrow()
    })
    
    test('should handle inference timeout', async () => {
      const inputs = [1, 2, 3]
      
      // Mock a slow inference
      const mockAgentManager = (neuralBridge as any).agentManager
      mockAgentManager.runInference = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([0.5]), 100) // Longer than timeout
        })
      })
      
      await expect(neuralBridge.runInference(agentId, inputs)).rejects.toThrow()
    })
  })
  
  describe('status and health monitoring', () => {
    beforeEach(async () => {
      await neuralBridge.initialize()
    })
    
    test('should get neural bridge status', () => {
      const status = neuralBridge.getStatus()
      
      expect(status).toBeDefined()
      expect(status.initialized).toBe(true)
      expect(status.ruvFannLoaded).toBe(true)
      expect(status.wasmModuleLoaded).toBe(true)
      expect(status.activeAgents).toBeDefined()
      expect(status.totalOperations).toBeDefined()
      expect(status.configuration).toBeDefined()
    })
    
    test('should get current health status', () => {
      const health = neuralBridge.getHealth()
      
      expect(health).toBeDefined()
      expect(health.status).toBeDefined()
      expect(health.moduleLoaded).toBeDefined()
      expect(health.ruvFannIntegration).toBeDefined()
      expect(health.wasmInitialized).toBeDefined()
      expect(health.performanceMetrics).toBeDefined()
    })
    
    test('should perform health check', async () => {
      const health = await neuralBridge.performHealthCheck()
      
      expect(health).toBeDefined()
      expect(health.status).toBeDefined()
      expect(health.systemMetrics).toBeDefined()
      expect(health.systemMetrics.overallScore).toBeGreaterThanOrEqual(0)
      expect(health.systemMetrics.componentScores).toBeDefined()
    })
    
    test('should emit healthCheckCompleted event', async () => {
      const eventPromise = new Promise<void>((resolve) => {
        neuralBridge.on('healthCheckCompleted', (event) => {
          expect(event.health).toBeDefined()
          expect(event.duration).toBeDefined()
          expect(event.timestamp).toBeDefined()
          resolve()
        })
      })
      
      await neuralBridge.performHealthCheck()
      await eventPromise
    })
  })
  
  describe('configuration management', () => {
    test('should get configuration', () => {
      const config = neuralBridge.getConfiguration()
      
      expect(config).toBeDefined()
      expect(config.enableRuvFann).toBe(true)
      expect(config.simdAcceleration).toBe(true)
      expect(config.maxAgents).toBe(10)
    })
    
    test('should update configuration', () => {
      const newConfig = {
        maxAgents: 20,
        enableOptimizations: false,
        logLevel: 'debug' as const
      }
      
      neuralBridge.updateConfiguration(newConfig)
      
      const config = neuralBridge.getConfiguration()
      expect(config.maxAgents).toBe(20)
      expect(config.enableOptimizations).toBe(false)
      expect(config.logLevel).toBe('debug')
    })
    
    test('should emit configurationUpdated event', () => {
      const eventPromise = new Promise<void>((resolve) => {
        neuralBridge.on('configurationUpdated', (event) => {
          expect(event.oldConfig).toBeDefined()
          expect(event.newConfig).toBeDefined()
          expect(event.timestamp).toBeDefined()
          resolve()
        })
      })
      
      neuralBridge.updateConfiguration({ maxAgents: 15 })
      return eventPromise
    })
  })
  
  describe('examples and documentation', () => {
    test('should provide neural bridge examples', () => {
      const examples = neuralBridge.getNeuralBridgeExamples()
      
      expect(examples).toBeDefined()
      expect(Array.isArray(examples)).toBe(true)
      expect(examples.length).toBeGreaterThan(0)
      
      examples.forEach(example => {
        expect(example.name).toBeDefined()
        expect(example.description).toBeDefined()
        expect(example.code).toBeDefined()
      })
    })
    
    test('should return empty examples when disabled', () => {
      const bridge = new NeuralBridgeManager({
        enableNeuralBridgeExamples: false
      })
      
      const examples = bridge.getNeuralBridgeExamples()
      expect(examples).toEqual([])
    })
  })
  
  describe('performance and alerts', () => {
    beforeEach(async () => {
      await neuralBridge.initialize()
    })
    
    test('should track performance metrics', async () => {
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [3, 2, 1]
      }
      
      // Create multiple agents to generate performance data
      for (let i = 0; i < 3; i++) {
        await neuralBridge.createAgent(config)
      }
      
      const status = neuralBridge.getStatus()
      expect(status.totalOperations).toBeGreaterThan(0)
      expect(status.averagePerformance).toBeGreaterThanOrEqual(0)
    })
    
    test('should create alert for slow agent spawn', async () => {
      // Mock slow agent spawn
      const mockAgentManager = (neuralBridge as any).agentManager
      mockAgentManager.spawnAgent = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({
            id: 'slow-agent',
            config: { type: 'mlp', architecture: [3, 2, 1] },
            network: {},
            state: 'active',
            createdAt: Date.now(),
            lastActive: Date.now(),
            memoryUsage: 1024 * 1024,
            totalInferences: 0,
            averageInferenceTime: 0,
            learningProgress: 0,
            connectionStrength: 1.0
          }), 20) // Longer than spawnTimeout
        })
      })
      
      const alertPromise = new Promise<void>((resolve) => {
        neuralBridge.on('alertCreated', (alert) => {
          expect(alert.type).toBe('spawn_time')
          expect(alert.severity).toBe('warning')
          resolve()
        })
      })
      
      const config: NeuralConfiguration = {
        type: 'mlp',
        architecture: [3, 2, 1]
      }
      
      await neuralBridge.createAgent(config)
      await alertPromise
    })
  })
  
  describe('cleanup', () => {
    test('should cleanup resources', async () => {
      await neuralBridge.initialize()
      
      const cleanupPromise = new Promise<void>((resolve) => {
        neuralBridge.on('cleanup', () => {
          resolve()
        })
      })
      
      await neuralBridge.cleanup()
      await cleanupPromise
    })
  })
})

describe('NeuralBridgeConfigManager', () => {
  let configManager: NeuralBridgeConfigManager
  
  beforeEach(() => {
    configManager = NeuralBridgeConfigManager.getInstance()
  })
  
  describe('templates', () => {
    test('should provide predefined templates', () => {
      const templates = configManager.getAllTemplates()
      
      expect(templates).toBeDefined()
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
      
      // Check for expected templates
      const templateNames = templates.map(t => t.name)
      expect(templateNames).toContain('Development')
      expect(templateNames).toContain('Production')
      expect(templateNames).toContain('High Performance')
    })
    
    test('should get template by name', () => {
      const template = configManager.getTemplate('production')
      
      expect(template).toBeDefined()
      expect(template?.name).toBe('Production')
      expect(template?.performanceProfile).toBe('speed')
    })
    
    test('should return null for non-existent template', () => {
      const template = configManager.getTemplate('non-existent')
      expect(template).toBeNull()
    })
  })
  
  describe('configuration creation', () => {
    test('should create configuration from template', () => {
      const config = configManager.createFromTemplate('production')
      
      expect(config).toBeDefined()
      expect(config.enableRuvFann).toBe(true)
      expect(config.simdAcceleration).toBe(true)
      expect(config.enableOptimizations).toBe(true)
    })
    
    test('should create configuration with overrides', () => {
      const config = configManager.createFromTemplate('production', {
        maxAgents: 100,
        enableDebugging: true
      })
      
      expect(config.maxAgents).toBe(100)
      expect(config.enableDebugging).toBe(true)
    })
    
    test('should throw error for invalid template', () => {
      expect(() => {
        configManager.createFromTemplate('invalid-template')
      }).toThrow()
    })
  })
  
  describe('configuration validation', () => {
    test('should validate valid configuration', () => {
      const config = configManager.createFromTemplate('production')
      const validation = configManager.validateConfiguration(config)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
    
    test('should detect configuration errors', () => {
      const invalidConfig = configManager.createFromTemplate('production')
      invalidConfig.maxAgents = 0
      invalidConfig.wasmModulePath = ''
      
      const validation = configManager.validateConfiguration(invalidConfig)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
    
    test('should provide configuration warnings', () => {
      const config = configManager.createFromTemplate('production')
      config.inferenceTimeout = 5 // Very low timeout
      
      const validation = configManager.validateConfiguration(config)
      
      expect(validation.warnings.length).toBeGreaterThan(0)
    })
  })
  
  describe('optimization', () => {
    test('should optimize for development environment', () => {
      const baseConfig = configManager.createFromTemplate('production')
      const optimized = configManager.optimizeForEnvironment(baseConfig, 'development')
      
      expect(optimized.enableDebugging).toBe(true)
      expect(optimized.logLevel).toBe('debug')
    })
    
    test('should optimize for production environment', () => {
      const baseConfig = configManager.createFromTemplate('development')
      const optimized = configManager.optimizeForEnvironment(baseConfig, 'production')
      
      expect(optimized.enableDebugging).toBe(false)
      expect(optimized.logLevel).toBe('warn')
      expect(optimized.enableOptimizations).toBe(true)
    })
  })
  
  describe('documentation', () => {
    test('should generate configuration documentation', () => {
      const doc = configManager.generateDocumentation()
      
      expect(doc).toBeDefined()
      expect(typeof doc).toBe('string')
      expect(doc.length).toBeGreaterThan(0)
      expect(doc).toContain('Neural Bridge Configuration Guide')
    })
  })
})

describe('NeuralBridgeHealthMonitor', () => {
  let healthMonitor: NeuralBridgeHealthMonitor
  let mockConfig: any
  
  beforeEach(() => {
    mockConfig = {
      enableRuvFann: true,
      healthCheckInterval: 1000,
      alertThresholds: {
        spawnTime: 15,
        inferenceTime: 60,
        memoryUsage: 8 * 1024 * 1024,
        errorRate: 0.05
      }
    }
    
    healthMonitor = new NeuralBridgeHealthMonitor(mockConfig)
  })
  
  describe('monitoring', () => {
    test('should start monitoring', () => {
      const eventPromise = new Promise<void>((resolve) => {
        healthMonitor.on('monitoringStarted', () => {
          resolve()
        })
      })
      
      healthMonitor.startMonitoring()
      
      return eventPromise
    })
    
    test('should stop monitoring', () => {
      healthMonitor.startMonitoring()
      
      const eventPromise = new Promise<void>((resolve) => {
        healthMonitor.on('monitoringStopped', () => {
          resolve()
        })
      })
      
      healthMonitor.stopMonitoring()
      
      return eventPromise
    })
  })
  
  describe('health checks', () => {
    test('should perform health check', async () => {
      const result = await healthMonitor.performHealthCheck()
      
      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.health).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.recommendations).toBeDefined()
    })
    
    test('should emit healthCheckCompleted event', async () => {
      const eventPromise = new Promise<void>((resolve) => {
        healthMonitor.on('healthCheckCompleted', (result) => {
          expect(result.health).toBeDefined()
          resolve()
        })
      })
      
      await healthMonitor.performHealthCheck()
      await eventPromise
    })
  })
  
  describe('health trends', () => {
    test('should calculate health trends', async () => {
      // Perform multiple health checks to generate trend data
      for (let i = 0; i < 5; i++) {
        await healthMonitor.performHealthCheck()
      }
      
      const trends = healthMonitor.getHealthTrends()
      
      expect(trends).toBeDefined()
      expect(Array.isArray(trends)).toBe(true)
    })
  })
  
  describe('alerts', () => {
    test('should create and track alerts', async () => {
      const alertPromise = new Promise<void>((resolve) => {
        healthMonitor.on('alertCreated', (alert) => {
          expect(alert.id).toBeDefined()
          expect(alert.type).toBeDefined()
          expect(alert.severity).toBeDefined()
          resolve()
        })
      })
      
      await healthMonitor.performHealthCheck()
      
      // Force an alert by simulating high error rate
      const mockSnapshot = {
        timestamp: new Date(),
        errorRate: 0.1, // Above threshold
        averageResponseTime: 30,
        memoryUsage: 20,
        cpuUsage: 30,
        agentCount: 5,
        operationsPerSecond: 100
      }
      
      // Access private method for testing
      const checkMethod = (healthMonitor as any).checkForAlerts
      if (checkMethod) {
        checkMethod.call(healthMonitor, mockSnapshot)
      }
      
      await alertPromise
    })
    
    test('should acknowledge alerts', async () => {
      await healthMonitor.performHealthCheck()
      
      const alerts = healthMonitor.getActiveAlerts()
      if (alerts.length > 0) {
        const alertId = alerts[0].id
        const acknowledged = healthMonitor.acknowledgeAlert(alertId)
        
        expect(acknowledged).toBe(true)
        
        const updatedAlerts = healthMonitor.getActiveAlerts()
        const alert = updatedAlerts.find(a => a.id === alertId)
        expect(alert?.acknowledged).toBe(true)
      }
    })
  })
  
  describe('health reporting', () => {
    test('should generate health report', async () => {
      await healthMonitor.performHealthCheck()
      
      const report = healthMonitor.generateHealthReport()
      
      expect(report).toBeDefined()
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      expect(report).toContain('Neural Bridge Health Report')
    })
  })
})

describe('Integration Tests', () => {
  test('should integrate all neural bridge components', async () => {
    // Create configuration
    const configManager = NeuralBridgeConfigManager.getInstance()
    const config = configManager.createFromTemplate('development')
    
    // Create neural bridge
    const neuralBridge = new NeuralBridgeManager(config)
    
    // Create health monitor
    const healthMonitor = new NeuralBridgeHealthMonitor(config)
    
    // Initialize neural bridge
    await neuralBridge.initialize()
    
    // Create an agent
    const agentConfig: NeuralConfiguration = {
      type: 'mlp',
      architecture: [3, 2, 1]
    }
    
    const agent = await neuralBridge.createAgent(agentConfig)
    expect(agent).toBeDefined()
    
    // Run inference
    const outputs = await neuralBridge.runInference(agent.id, [1, 2, 3])
    expect(outputs).toBeDefined()
    
    // Check health
    const healthResult = await healthMonitor.performHealthCheck()
    expect(healthResult.health.status).toBeDefined()
    
    // Get status
    const status = neuralBridge.getStatus()
    expect(status.activeAgents).toBeGreaterThan(0)
    expect(status.totalOperations).toBeGreaterThan(0)
    
    // Cleanup
    await neuralBridge.cleanup()
  })
})