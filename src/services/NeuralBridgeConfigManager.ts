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
        enableOptimizations: true,
        maxAgents: 10,
        memoryLimitPerAgent: 2 * 1024 * 1024,
        performanceCheckInterval: 5000,
        healthCheckInterval: 15000,
        alertThresholds: {
          spawnTime: 15,
          inferenceTime: 80,
          memoryUsage: 3 * 1024 * 1024,
          errorRate: 0.05
        }
      },
      useCase: 'Memory-constrained environments',
      performanceProfile: 'memory'
    })
  }
  
  /**
   * Get all available templates
   */
  getAllTemplates(): ConfigurationTemplate[] {
    return Array.from(this.templates.values())
  }
  
  /**
   * Get template by name
   */
  getTemplate(name: string): ConfigurationTemplate | null {
    return this.templates.get(name.toLowerCase()) || null
  }
  
  /**
   * Create configuration from template
   */
  createFromTemplate(templateName: string, overrides: Partial<NeuralBridgeConfig> = {}): NeuralBridgeConfig {
    const template = this.getTemplate(templateName)
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }
    
    // Merge template config with overrides
    const config: NeuralBridgeConfig = {
      // Default values
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
      logLevel: 'info',
      
      // Apply template config
      ...template.config,
      
      // Apply overrides
      ...overrides
    }
    
    return config
  }
  
  /**
   * Validate configuration
   */
  validateConfiguration(config: NeuralBridgeConfig): ConfigurationValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    
    // Validate required fields
    if (!config.wasmModulePath) {
      errors.push('wasmModulePath is required')
    }
    
    if (config.maxAgents <= 0) {
      errors.push('maxAgents must be greater than 0')
    }
    
    if (config.memoryLimitPerAgent <= 0) {
      errors.push('memoryLimitPerAgent must be greater than 0')
    }
    
    if (config.inferenceTimeout <= 0) {
      errors.push('inferenceTimeout must be greater than 0')
    }
    
    if (config.spawnTimeout <= 0) {
      errors.push('spawnTimeout must be greater than 0')
    }
    
    // Check for warnings
    if (config.inferenceTimeout < 10) {
      warnings.push('Very low inference timeout may cause frequent timeouts')
    }
    
    if (config.spawnTimeout < 5) {
      warnings.push('Very low spawn timeout may cause frequent timeouts')
    }
    
    if (config.maxAgents > 100) {
      warnings.push('High agent count may impact performance')
    }
    
    if (config.memoryLimitPerAgent > 50 * 1024 * 1024) {
      warnings.push('High memory limit per agent may cause memory pressure')
    }
    
    // Generate recommendations
    if (!config.simdAcceleration && config.wasmModuleVariant === 'simd') {
      recommendations.push('Enable SIMD acceleration for better performance with SIMD variant')
    }
    
    if (config.enableDebugging && config.logLevel === 'error') {
      recommendations.push('Consider using debug or info log level when debugging is enabled')
    }
    
    if (config.performanceCheckInterval < 1000) {
      recommendations.push('Consider increasing performance check interval to reduce overhead')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    }
  }
  
  /**
   * Optimize configuration for specific environment
   */
  optimizeForEnvironment(baseConfig: NeuralBridgeConfig, environment: 'development' | 'production' | 'testing'): NeuralBridgeConfig {
    const optimizations: Partial<NeuralBridgeConfig> = {}
    
    switch (environment) {
      case 'development':
        optimizations.enableDebugging = true
        optimizations.logLevel = 'debug'
        optimizations.enableFallback = true
        optimizations.performanceCheckInterval = 2000
        optimizations.healthCheckInterval = 5000
        break
        
      case 'production':
        optimizations.enableDebugging = false
        optimizations.logLevel = 'warn'
        optimizations.enableOptimizations = true
        optimizations.simdAcceleration = true
        optimizations.wasmModuleVariant = 'simd'
        optimizations.performanceCheckInterval = 10000
        optimizations.healthCheckInterval = 30000
        break
        
      case 'testing':
        optimizations.enableDebugging = false
        optimizations.logLevel = 'error'
        optimizations.enablePerformanceMonitoring = false
        optimizations.enableHealthChecks = false
        optimizations.maxAgents = 5
        optimizations.inferenceTimeout = 100
        optimizations.spawnTimeout = 20
        break
    }
    
    return { ...baseConfig, ...optimizations }
  }
  
  /**
   * Generate configuration documentation
   */
  generateDocumentation(): string {
    const templates = this.getAllTemplates()
    
    let doc = `# Neural Bridge Configuration Guide

## Available Templates

`
    
    templates.forEach(template => {
      doc += `### ${template.name}
- **Description**: ${template.description}
- **Use Case**: ${template.useCase}
- **Performance Profile**: ${template.performanceProfile}

`
    })
    
    doc += `## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| enableRuvFann | boolean | Enable ruv-fann integration | true |
| wasmModulePath | string | Path to WASM module | /assets/ruv-fann-neural-bridge.wasm |
| simdAcceleration | boolean | Enable SIMD acceleration | true |
| enableOptimizations | boolean | Enable performance optimizations | true |
| maxAgents | number | Maximum number of agents | 50 |
| memoryLimitPerAgent | number | Memory limit per agent (bytes) | 10MB |
| inferenceTimeout | number | Inference timeout (ms) | 50 |
| spawnTimeout | number | Agent spawn timeout (ms) | 12 |
| logLevel | string | Logging level | info |

## Usage Examples

\`\`\`typescript
// Create from template
const config = configManager.createFromTemplate('production', {
  maxAgents: 100,
  enableDebugging: false
})

// Validate configuration
const validation = configManager.validateConfiguration(config)
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
}

// Optimize for environment
const optimized = configManager.optimizeForEnvironment(config, 'production')
\`\`\`
`
    
    return doc
  }
}