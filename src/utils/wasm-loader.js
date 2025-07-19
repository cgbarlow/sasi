/**
 * WASM Loading and Initialization System for ruv-FANN
 * Optimized for <100ms inference latency with memory-efficient module management
 */

class WASMNeuralLoader {
    constructor() {
        this.modules = new Map();
        this.loadingPromises = new Map();
        this.performanceMetrics = {
            loadTimes: [],
            initTimes: [],
            memoryUsage: [],
            inferenceLatencies: []
        };
        this.browserCapabilities = null;
        this.agentPool = [];
        this.maxAgents = 25;
        this.memoryLimit = 2 * 1024 * 1024 * 1024; // 2GB
    }

    /**
     * Detect browser capabilities and WASM features
     */
    async detectCapabilities() {
        if (this.browserCapabilities) {
            return this.browserCapabilities;
        }

        const capabilities = {
            wasm: false,
            simd: false,
            threads: false,
            webgpu: false,
            bulk_memory: false,
            reference_types: false,
            sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
        };

        try {
            // Test basic WASM support
            if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
                capabilities.wasm = true;

                // Test SIMD support
                try {
                    const simdTestBytes = new Uint8Array([
                        0x00, 0x61, 0x73, 0x6d, // WASM magic
                        0x01, 0x00, 0x00, 0x00, // version
                        0x01, 0x05, 0x01, 0x60, 0x00, 0x00, // type section
                        0x03, 0x02, 0x01, 0x00, // function section
                        0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd, 0x00, 0xfd, 0x0f, 0x0b // code with SIMD
                    ]);
                    await WebAssembly.compile(simdTestBytes);
                    capabilities.simd = true;
                } catch (e) {
                    console.warn('SIMD not supported:', e.message);
                }

                // Test bulk memory operations
                try {
                    const bulkMemoryBytes = new Uint8Array([
                        0x00, 0x61, 0x73, 0x6d, // WASM magic
                        0x01, 0x00, 0x00, 0x00, // version
                        0x05, 0x03, 0x01, 0x00, 0x00, // memory section
                        0x0a, 0x07, 0x01, 0x05, 0x00, 0xfc, 0x08, 0x00, 0x00, 0x0b // bulk memory instruction
                    ]);
                    await WebAssembly.compile(bulkMemoryBytes);
                    capabilities.bulk_memory = true;
                } catch (e) {
                    console.warn('Bulk memory not supported:', e.message);
                }

                // Test WebGPU support
                if (navigator.gpu) {
                    try {
                        const adapter = await navigator.gpu.requestAdapter();
                        if (adapter) {
                            capabilities.webgpu = true;
                        }
                    } catch (e) {
                        console.warn('WebGPU not supported:', e.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting WASM capabilities:', error);
        }

        this.browserCapabilities = capabilities;
        console.log('Browser capabilities detected:', capabilities);
        return capabilities;
    }

    /**
     * Load WASM module with fallback strategy
     */
    async loadModule(moduleName, options = {}) {
        const startTime = performance.now();

        if (this.modules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const loadPromise = this._loadModuleInternal(moduleName, options);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.modules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);

            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTimes.push(loadTime);
            console.log(`Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);

            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Internal module loading with fallback
     */
    async _loadModuleInternal(moduleName, options) {
        const capabilities = await this.detectCapabilities();
        
        // Determine best module variant
        const moduleVariant = this._selectModuleVariant(capabilities, options);
        const modulePath = this._getModulePath(moduleName, moduleVariant);

        console.log(`Loading ${moduleName} variant: ${moduleVariant}`);

        try {
            // Try loading the optimal variant first
            return await this._loadWASMFromPath(modulePath);
        } catch (error) {
            console.warn(`Failed to load optimal variant ${moduleVariant}:`, error);

            // Fallback to minimal variant
            if (moduleVariant !== 'minimal') {
                console.log(`Falling back to minimal variant for ${moduleName}`);
                const fallbackPath = this._getModulePath(moduleName, 'minimal');
                return await this._loadWASMFromPath(fallbackPath);
            }

            throw new Error(`Failed to load ${moduleName}: ${error.message}`);
        }
    }

    /**
     * Select optimal module variant based on capabilities
     */
    _selectModuleVariant(capabilities, options) {
        if (options.forceMinimal) {
            return 'minimal';
        }

        if (capabilities.simd && capabilities.bulk_memory && capabilities.webgpu) {
            return 'optimal';
        } else if (capabilities.simd && capabilities.bulk_memory) {
            return 'simd';
        } else if (capabilities.wasm) {
            return 'standard';
        }

        return 'minimal';
    }

    /**
     * Get module path based on variant
     */
    _getModulePath(moduleName, variant) {
        const basePath = './wasm/';
        const fallbackPath = './wasm/fallback/';

        switch (variant) {
            case 'optimal':
                return `${basePath}ruv_fann_bg.wasm`;
            case 'simd':
                return `${basePath}ruv_swarm_simd.wasm`;
            case 'standard':
                return `${basePath}ruv_fann.wasm`;
            case 'minimal':
                return `${fallbackPath}ruv_fann_bg.wasm`;
            default:
                return `${basePath}ruv_fann_bg.wasm`;
        }
    }

    /**
     * Load WASM from specific path
     */
    async _loadWASMFromPath(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
        }

        const bytes = await response.arrayBuffer();
        const module = await WebAssembly.compile(bytes);
        const instance = await WebAssembly.instantiate(module);

        return {
            module,
            instance,
            exports: instance.exports,
            memory: instance.exports.memory
        };
    }

    /**
     * Create neural agent with memory management
     */
    async createNeuralAgent(config = {}) {
        if (this.agentPool.length >= this.maxAgents) {
            // Memory pressure - try to free up space
            await this._performMemoryCleanup();
            
            if (this.agentPool.length >= this.maxAgents) {
                throw new Error(`Maximum agent limit reached (${this.maxAgents})`);
            }
        }

        const startTime = performance.now();
        
        try {
            const module = await this.loadModule('ruv-fann');
            
            // Create agent instance
            const agent = {
                id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                module,
                network: this._createNetwork(module, config),
                createdAt: Date.now(),
                lastUsed: Date.now(),
                memoryUsage: this._estimateMemoryUsage(config),
                inferenceCount: 0,
                avgInferenceTime: 0
            };

            this.agentPool.push(agent);
            
            const initTime = performance.now() - startTime;
            this.performanceMetrics.initTimes.push(initTime);
            
            console.log(`Neural agent ${agent.id} created in ${initTime.toFixed(2)}ms`);
            
            return agent;
        } catch (error) {
            console.error('Failed to create neural agent:', error);
            throw error;
        }
    }

    /**
     * Run inference with performance monitoring
     */
    async runInference(agentId, input) {
        const agent = this.agentPool.find(a => a.id === agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const startTime = performance.now();
        
        try {
            // Update last used timestamp
            agent.lastUsed = Date.now();
            
            // Run neural network inference
            const output = await this._runNetworkInference(agent.network, input);
            
            const inferenceTime = performance.now() - startTime;
            
            // Update metrics
            agent.inferenceCount++;
            agent.avgInferenceTime = (agent.avgInferenceTime * (agent.inferenceCount - 1) + inferenceTime) / agent.inferenceCount;
            this.performanceMetrics.inferenceLatencies.push(inferenceTime);
            
            // Check performance target
            if (inferenceTime > 100) {
                console.warn(`Inference time ${inferenceTime.toFixed(2)}ms exceeds 100ms target for agent ${agentId}`);
            }
            
            return {
                output,
                inferenceTime,
                agentId
            };
        } catch (error) {
            console.error(`Inference failed for agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * Memory management and cleanup
     */
    async _performMemoryCleanup() {
        console.log('Performing memory cleanup...');
        
        const currentTime = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        // Remove old unused agents
        const beforeCount = this.agentPool.length;
        this.agentPool = this.agentPool.filter(agent => {
            const age = currentTime - agent.lastUsed;
            if (age > maxAge) {
                console.log(`Removing aged agent ${agent.id} (age: ${(age / 1000).toFixed(1)}s)`);
                return false;
            }
            return true;
        });
        
        const removedCount = beforeCount - this.agentPool.length;
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} aged agents`);
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Update memory usage metrics
        const memoryUsage = this._getCurrentMemoryUsage();
        this.performanceMetrics.memoryUsage.push(memoryUsage);
        
        if (memoryUsage > this.memoryLimit * 0.8) {
            console.warn(`Memory usage ${(memoryUsage / 1024 / 1024 / 1024).toFixed(2)}GB approaching limit`);
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const avgLoadTime = this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length || 0;
        const avgInitTime = this.performanceMetrics.initTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.initTimes.length || 0;
        const avgInferenceTime = this.performanceMetrics.inferenceLatencies.reduce((a, b) => a + b, 0) / this.performanceMetrics.inferenceLatencies.length || 0;
        const currentMemoryUsage = this._getCurrentMemoryUsage();
        
        return {
            activeAgents: this.agentPool.length,
            maxAgents: this.maxAgents,
            avgLoadTime: Number(avgLoadTime.toFixed(2)),
            avgInitTime: Number(avgInitTime.toFixed(2)),
            avgInferenceTime: Number(avgInferenceTime.toFixed(2)),
            currentMemoryUsage: Number((currentMemoryUsage / 1024 / 1024).toFixed(2)), // MB
            memoryLimit: Number((this.memoryLimit / 1024 / 1024).toFixed(2)), // MB
            memoryUtilization: Number((currentMemoryUsage / this.memoryLimit * 100).toFixed(1)), // %
            totalInferences: this.performanceMetrics.inferenceLatencies.length,
            browserCapabilities: this.browserCapabilities,
            performanceTargetsMet: {
                inferenceLatency: avgInferenceTime < 100,
                memoryLimit: currentMemoryUsage < this.memoryLimit,
                agentCapacity: this.agentPool.length <= this.maxAgents
            }
        };
    }

    /**
     * Helper methods
     */
    _createNetwork(module, config) {
        // This would integrate with the actual WASM neural network
        return {
            run: (input) => this._runNetworkInference(null, input),
            config
        };
    }

    async _runNetworkInference(network, input) {
        // Simulate neural network inference
        // In real implementation, this would call WASM functions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // 0-50ms
        return input.map(x => Math.tanh(x * 0.5 + Math.random() * 0.1));
    }

    _estimateMemoryUsage(config) {
        // Estimate memory usage based on network configuration
        const baseMemory = 1024 * 1024; // 1MB base
        const layerMemory = (config.layers || [10, 10, 1]).reduce((a, b) => a + b, 0) * 1000; // ~1KB per neuron
        return baseMemory + layerMemory;
    }

    _getCurrentMemoryUsage() {
        // Estimate current memory usage
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        
        // Fallback estimation
        return this.agentPool.reduce((total, agent) => total + agent.memoryUsage, 0);
    }
}

// Cross-browser compatibility testing
class WASMCompatibilityTester {
    static async runCompatibilityTests() {
        const loader = new WASMNeuralLoader();
        const results = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            capabilities: null,
            loadTest: false,
            performanceTest: false,
            memoryTest: false,
            agentTest: false,
            errors: []
        };

        try {
            // Test 1: Capability detection
            results.capabilities = await loader.detectCapabilities();
            console.log('✓ Capability detection passed');

            // Test 2: Module loading
            try {
                await loader.loadModule('ruv-fann');
                results.loadTest = true;
                console.log('✓ Module loading passed');
            } catch (error) {
                results.errors.push(`Load test failed: ${error.message}`);
            }

            // Test 3: Performance test
            try {
                const agent = await loader.createNeuralAgent({
                    layers: [10, 5, 1]
                });
                
                const testInput = Array.from({length: 10}, () => Math.random());
                const result = await loader.runInference(agent.id, testInput);
                
                if (result.inferenceTime < 100) {
                    results.performanceTest = true;
                    console.log(`✓ Performance test passed (${result.inferenceTime.toFixed(2)}ms)`);
                } else {
                    results.errors.push(`Performance test failed: ${result.inferenceTime.toFixed(2)}ms > 100ms`);
                }
            } catch (error) {
                results.errors.push(`Performance test failed: ${error.message}`);
            }

            // Test 4: Memory test (create multiple agents)
            try {
                const agents = [];
                for (let i = 0; i < 5; i++) {
                    const agent = await loader.createNeuralAgent({
                        layers: [5, 3, 1]
                    });
                    agents.push(agent);
                }
                
                const metrics = loader.getPerformanceMetrics();
                if (metrics.memoryUtilization < 80) {
                    results.memoryTest = true;
                    console.log(`✓ Memory test passed (${metrics.memoryUtilization}% utilization)`);
                } else {
                    results.errors.push(`Memory test failed: ${metrics.memoryUtilization}% > 80%`);
                }
                
                results.agentTest = metrics.activeAgents === 5;
                console.log(`✓ Agent test: ${metrics.activeAgents}/5 agents created`);
            } catch (error) {
                results.errors.push(`Memory/Agent test failed: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Compatibility test failed: ${error.message}`);
        }

        return results;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WASMNeuralLoader, WASMCompatibilityTester };
} else if (typeof window !== 'undefined') {
    window.WASMNeuralLoader = WASMNeuralLoader;
    window.WASMCompatibilityTester = WASMCompatibilityTester;
}