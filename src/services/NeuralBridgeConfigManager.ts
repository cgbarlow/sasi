/**
 * Neural Bridge Configuration Manager
 * 
 * Manages neural bridge configuration, validation, and optimization
 * for ruv-fann-neural-bridge integration in SASI.
 */

import type { NeuralBridgeConfig } from './NeuralBridgeManager'

export interface ConfigurationTemplate {
  name: string
  description: string
  config: Partial<NeuralBridgeConfig>
  useCase: string
  performanceProfile: 'balanced' | 'speed' | 'memory' | 'quality'
}

export interface ConfigurationValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export class NeuralBridgeConfigManager {
  private static instance: NeuralBridgeConfigManager
  private templates: Map<string, ConfigurationTemplate> = new Map()
  
  private constructor() {
    this.initializeTemplates()
  }
  
  static getInstance(): NeuralBridgeConfigManager {
    if (!NeuralBridgeConfigManager.instance) {
      NeuralBridgeConfigManager.instance = new NeuralBridgeConfigManager()
    }
    return NeuralBridgeConfigManager.instance
  }
  
  /**
   * Initialize configuration templates
   */
  private initializeTemplates(): void {
    // Development template
    this.templates.set('development', {
      name: 'Development',
      description: 'Optimized for development with debugging enabled',
      config: {
        enableDebugging: true,
        logLevel: 'debug',
        enableFallback: true,
        wasmModuleVariant: 'standard',
        simdAcceleration: false,
        performanceCheckInterval: 2000,
        healthCheckInterval: 5000,
        alertThresholds: {
          spawnTime: 20,
          inferenceTime: 100,
          memoryUsage: 15 * 1024 * 1024,
          errorRate: 0.1
        }
      },
      useCase: 'Development and debugging',
      performanceProfile: 'balanced'
    })
    
    // Production template
    this.templates.set('production', {
      name: 'Production',
      description: 'Optimized for production with maximum performance',
      config: {
        enableDebugging: false,
        logLevel: 'warn',
        enableFallback: true,
        wasmModuleVariant: 'simd',
        simdAcceleration: true,
        enableOptimizations: true,
        performanceCheckInterval: 10000,
        healthCheckInterval: 30000,
        alertThresholds: {
          spawnTime: 12,
          inferenceTime: 50,
          memoryUsage: 8 * 1024 * 1024,
          errorRate: 0.02
        }
      },
      useCase: 'Production deployment',
      performanceProfile: 'speed'
    })
    
    // High-performance template
    this.templates.set('high-performance', {
      name: 'High Performance',
      description: 'Maximum performance with SIMD and optimizations',
      config: {
        enableDebugging: false,
        logLevel: 'error',
        enableFallback: false,
        wasmModuleVariant: 'simd',
        simdAcceleration: true,
        enableOptimizations: true,
        maxAgents: 100,
        memoryLimitPerAgent: 5 * 1024 * 1024,
        performanceCheckInterval: 15000,
        healthCheckInterval: 60000,
        alertThresholds: {
          spawnTime: 8,
          inferenceTime: 30,
          memoryUsage: 5 * 1024 * 1024,
          errorRate: 0.01
        }
      },
      useCase: 'High-performance computing',
      performanceProfile: 'speed'
    })
    
    // Memory-optimized template
    this.templates.set('memory-optimized', {
      name: 'Memory Optimized',
      description: 'Optimized for low memory usage',
      config: {
        enableDebugging: false,
        logLevel: 'warn',
        enableFallback: true,
        wasmModuleVariant: 'standard',
        simdAcceleration: false,
        maxAgents: 20,
        memoryLimitPerAgent: 3 * 1024 * 1024,
        performanceCheckInterval: 5000,
        healthCheckInterval: 15000,
        alertThresholds: {
          spawnTime: 25,
          inferenceTime: 80,
          memoryUsage: 3 * 1024 * 1024,
          errorRate: 0.05
        }
      },
      useCase: 'Memory-constrained environments',
      performanceProfile: 'memory'
    })
    
    // Quality-focused template
    this.templates.set('quality-focused', {
      name: 'Quality Focused',
      description: 'Optimized for best neural network quality',
      config: {
        enableDebugging: false,
        logLevel: 'info',
        enableFallback: true,
        wasmModuleVariant: 'neuro-divergent',
        simdAcceleration: true,
        enableOptimizations: true,
        maxAgents: 30,
        memoryLimitPerAgent: 12 * 1024 * 1024,
        inferenceTimeout: 100,
        performanceCheckInterval: 8000,
        healthCheckInterval: 20000,
        alertThresholds: {
          spawnTime: 18,
          inferenceTime: 100,
          memoryUsage: 12 * 1024 * 1024,
          errorRate: 0.001
        }
      },
      useCase: 'High-quality neural processing',
      performanceProfile: 'quality'
    })
  }
  
  /**
   * Get configuration template by name
   */
  getTemplate(name: string): ConfigurationTemplate | null {
    return this.templates.get(name) || null
  }
  
  /**
   * Get all available templates
   */
  getAllTemplates(): ConfigurationTemplate[] {
    return Array.from(this.templates.values())
  }
  
  /**
   * Create custom configuration from template
   */
  createFromTemplate(templateName: string, overrides: Partial<NeuralBridgeConfig> = {}): NeuralBridgeConfig {
    const template = this.getTemplate(templateName)
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }
    
    // Default configuration
    const defaultConfig: NeuralBridgeConfig = {
      enableRuvFann: true,
      wasmModulePath: '/assets/ruv-fann-neural-bridge.wasm',
      simdAcceleration: true,
      enableOptimizations: true,
      enablePerformanceMonitoring: true,
      enableHealthChecks: true,
      maxAgents: 50,
      memoryLimitPerAgent: 10 * 1024 * 1024,
      inferenceTimeout: 50,
      spawnTimeout: 12,
      wasmModuleVariant: 'simd',
      loadTimeoutMs: 100,
      enableFallback: true,
      performanceCheckInterval: 5000,
      healthCheckInterval: 10000,
      alertThresholds: {
        spawnTime: 15,
        inferenceTime: 60,
        memoryUsage: 8 * 1024 * 1024,
        errorRate: 0.05
      },
      enableNeuralBridgeExamples: true,
      enableDocumentation: true,
      enableDebugging: false,
      logLevel: 'info'
    }
    
    // Merge template config with overrides
    return {
      ...defaultConfig,
      ...template.config,
      ...overrides
    }
  }
  
  /**
   * Validate configuration
   */
  validateConfiguration(config: NeuralBridgeConfig): ConfigurationValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    
    // Required fields validation
    if (!config.wasmModulePath) {
      errors.push('wasmModulePath is required')
    }
    
    if (config.maxAgents <= 0) {
      errors.push('maxAgents must be greater than 0')
    }
    
    if (config.memoryLimitPerAgent <= 0) {
      errors.push('memoryLimitPerAgent must be greater than 0')
    }
    
    // Performance validation
    if (config.inferenceTimeout < 10) {
      warnings.push('inferenceTimeout is very low, may cause timeouts')
    }
    
    if (config.spawnTimeout < 5) {
      warnings.push('spawnTimeout is very low, may cause agent spawn failures')
    }
    
    if (config.maxAgents > 100) {
      warnings.push('maxAgents is very high, may cause memory issues')
    }
    
    if (config.memoryLimitPerAgent > 50 * 1024 * 1024) {
      warnings.push('memoryLimitPerAgent is very high, may cause system instability')
    }
    
    // Configuration recommendations
    if (config.simdAcceleration && config.wasmModuleVariant !== 'simd') {
      recommendations.push('Consider using SIMD WASM variant for better performance')
    }
    
    if (!config.enableOptimizations && config.maxAgents > 20) {
      recommendations.push('Enable optimizations for better performance with many agents')
    }
    
    if (config.enableDebugging && config.logLevel === 'error') {
      recommendations.push('Set log level to debug when debugging is enabled')
    }
    
    if (config.performanceCheckInterval < 1000) {
      recommendations.push('Performance check interval is very frequent, may impact performance')
    }
    
    if (config.healthCheckInterval < 5000) {
      recommendations.push('Health check interval is very frequent, may impact performance')
    }
    
    // Alert threshold validation
    if (config.alertThresholds.spawnTime < 5) {
      warnings.push('Spawn time alert threshold is very low')
    }
    
    if (config.alertThresholds.inferenceTime < 10) {
      warnings.push('Inference time alert threshold is very low')
    }
    
    if (config.alertThresholds.errorRate > 0.1) {
      warnings.push('Error rate alert threshold is very high')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    }
  }
  
  /**
   * Optimize configuration based on environment
   */
  optimizeForEnvironment(config: NeuralBridgeConfig, environment: 'development' | 'production' | 'testing'): NeuralBridgeConfig {
    const optimized = { ...config }
    
    switch (environment) {
      case 'development':
        optimized.enableDebugging = true
        optimized.logLevel = 'debug'
        optimized.enableFallback = true
        optimized.performanceCheckInterval = 2000
        optimized.healthCheckInterval = 5000
        optimized.alertThresholds.spawnTime = Math.max(20, optimized.alertThresholds.spawnTime)
        optimized.alertThresholds.inferenceTime = Math.max(100, optimized.alertThresholds.inferenceTime)
        break
        
      case 'production':
        optimized.enableDebugging = false
        optimized.logLevel = 'warn'
        optimized.enableOptimizations = true
        optimized.simdAcceleration = true
        optimized.performanceCheckInterval = 10000
        optimized.healthCheckInterval = 30000
        optimized.alertThresholds.spawnTime = Math.min(12, optimized.alertThresholds.spawnTime)
        optimized.alertThresholds.inferenceTime = Math.min(50, optimized.alertThresholds.inferenceTime)
        break
        
      case 'testing':
        optimized.enableDebugging = false
        optimized.logLevel = 'error'
        optimized.enableFallback = true
        optimized.performanceCheckInterval = 1000
        optimized.healthCheckInterval = 2000
        optimized.maxAgents = Math.min(10, optimized.maxAgents)
        break
    }
    
    return optimized
  }
  
  /**
   * Get configuration recommendations based on usage patterns
   */
  getRecommendations(config: NeuralBridgeConfig, usageStats: {
    averageAgents: number
    averageOperationsPerSecond: number
    averageMemoryUsage: number
    errorRate: number
  }): string[] {
    const recommendations: string[] = []
    
    // Agent count recommendations
    if (usageStats.averageAgents > config.maxAgents * 0.8) {
      recommendations.push('Consider increasing maxAgents to handle peak usage')
    }
    
    if (usageStats.averageAgents < config.maxAgents * 0.2) {
      recommendations.push('Consider decreasing maxAgents to save memory')
    }
    
    // Performance recommendations
    if (usageStats.averageOperationsPerSecond > 1000 && !config.simdAcceleration) {
      recommendations.push('Enable SIMD acceleration for high-throughput workloads')
    }
    
    if (usageStats.averageOperationsPerSecond > 2000 && config.wasmModuleVariant !== 'simd') {
      recommendations.push('Consider using SIMD WASM variant for better performance')
    }
    
    // Memory recommendations
    if (usageStats.averageMemoryUsage > config.memoryLimitPerAgent * 0.9) {
      recommendations.push('Consider increasing memoryLimitPerAgent')
    }
    
    if (usageStats.averageMemoryUsage < config.memoryLimitPerAgent * 0.3) {
      recommendations.push('Consider decreasing memoryLimitPerAgent to save memory')
    }
    
    // Error rate recommendations
    if (usageStats.errorRate > config.alertThresholds.errorRate * 2) {
      recommendations.push('High error rate detected - consider reviewing configuration')
    }
    
    if (usageStats.errorRate > 0.05 && config.enableFallback === false) {
      recommendations.push('Enable fallback mode to improve reliability')
    }
    
    return recommendations
  }
  
  /**
   * Export configuration to JSON
   */
  exportConfiguration(config: NeuralBridgeConfig): string {
    return JSON.stringify(config, null, 2)
  }
  
  /**
   * Import configuration from JSON
   */
  importConfiguration(json: string): NeuralBridgeConfig {
    try {
      const config = JSON.parse(json) as NeuralBridgeConfig
      const validation = this.validateConfiguration(config)
      
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }
      
      return config
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`)
    }
  }
  
  /**
   * Generate configuration documentation
   */
  generateDocumentation(): string {
    const templates = this.getAllTemplates()
    
    let doc = `# Neural Bridge Configuration Guide\n\n`
    
    doc += `## Available Templates\n\n`
    
    templates.forEach(template => {
      doc += `### ${template.name}\n`
      doc += `${template.description}\n\n`
      doc += `- **Use Case**: ${template.useCase}\n`
      doc += `- **Performance Profile**: ${template.performanceProfile}\n`
      doc += `- **Configuration**:\n`
      doc += `\`\`\`json\n${JSON.stringify(template.config, null, 2)}\n\`\`\`\n\n`
    })
    
    doc += `## Configuration Options\n\n`
    
    const configOptions = [
      { name: 'enableRuvFann', description: 'Enable ruv-fann-neural-bridge integration', type: 'boolean' },
      { name: 'wasmModulePath', description: 'Path to WASM module', type: 'string' },
      { name: 'simdAcceleration', description: 'Enable SIMD acceleration', type: 'boolean' },
      { name: 'enableOptimizations', description: 'Enable performance optimizations', type: 'boolean' },
      { name: 'maxAgents', description: 'Maximum number of agents', type: 'number' },
      { name: 'memoryLimitPerAgent', description: 'Memory limit per agent (bytes)', type: 'number' },
      { name: 'inferenceTimeout', description: 'Inference timeout (ms)', type: 'number' },
      { name: 'spawnTimeout', description: 'Agent spawn timeout (ms)', type: 'number' },
      { name: 'wasmModuleVariant', description: 'WASM module variant', type: 'string' },
      { name: 'alertThresholds', description: 'Performance alert thresholds', type: 'object' }
    ]
    
    configOptions.forEach(option => {
      doc += `- **${option.name}** (${option.type}): ${option.description}\n`
    })
    
    doc += `\n## Usage Examples\n\n`
    
    doc += `### Creating from Template\n`
    doc += `\`\`\`typescript\n`
    doc += `const configManager = NeuralBridgeConfigManager.getInstance()\n`
    doc += `const config = configManager.createFromTemplate('production', {\n`
    doc += `  maxAgents: 100,\n`
    doc += `  simdAcceleration: true\n`
    doc += `})\n`
    doc += `\`\`\`\n\n`
    
    doc += `### Validating Configuration\n`
    doc += `\`\`\`typescript\n`
    doc += `const validation = configManager.validateConfiguration(config)\n`
    doc += `if (!validation.valid) {\n`
    doc += `  console.error('Configuration errors:', validation.errors)\n`
    doc += `}\n`
    doc += `\`\`\`\n\n`
    
    return doc
  }
}

export default NeuralBridgeConfigManager