/**
 * Neural Testing Utilities
 * Comprehensive utilities for testing neural agent functionality
 */

import { Agent, NeuralAgent, NeuralMeshConnection } from '../../src/types/agent';
import { NeuralMeshService, SynapticResponse } from '../../src/services/NeuralMeshService';
import { jest } from '@jest/globals';

/**
 * Factory for creating mock neural agents
 */
export class NeuralAgentFactory {
  static createMockAgent(overrides: Partial<Agent> = {}): Agent {
    return {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `TestAgent-${Math.random().toString(36).substr(2, 4)}`,
      type: 'neural',
      status: 'active',
      currentTask: 'Test task execution',
      repository: 'test-repo',
      branch: 'main',
      completedTasks: Math.floor(Math.random() * 10),
      efficiency: Math.floor(Math.random() * 40) + 60,
      progress: Math.random(),
      position: {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      },
      owner: 'Test Suite',
      neuralId: `neuron_${Math.random().toString(36).substr(2, 9)}`,
      meshConnection: {
        connected: true,
        meshId: `mesh_${Math.random().toString(36).substr(2, 9)}`,
        nodeType: 'inter',
        layer: Math.floor(Math.random() * 6) + 1,
        synapses: Math.floor(Math.random() * 50) + 10,
        activation: Math.random(),
        lastSpike: new Date()
      },
      realtime: {
        cpuUsage: Math.random() * 50 + 20,
        memoryUsage: Math.random() * 60 + 30,
        networkLatency: Math.random() * 10 + 1,
        wasmPerformance: 2.8
      },
      ...overrides
    };
  }

  static createMockNeuralAgent(overrides: Partial<NeuralAgent> = {}): NeuralAgent {
    const baseAgent = this.createMockAgent();
    return {
      ...baseAgent,
      type: 'neural',
      neuralProperties: {
        neuronId: `neuron_${Math.random().toString(36).substr(2, 9)}`,
        meshId: `mesh_${Math.random().toString(36).substr(2, 9)}`,
        nodeType: 'inter',
        layer: Math.floor(Math.random() * 6) + 1,
        threshold: 0.5 + (Math.random() - 0.5) * 0.4,
        activation: Math.random(),
        connections: Array.from({ length: 5 }, () => Math.random().toString(36).substr(2, 9)),
        spikeHistory: Array.from({ length: 10 }, () => Math.random()),
        lastSpike: new Date()
      },
      wasmMetrics: {
        executionTime: Math.random() * 50 + 5,
        memoryUsage: Math.random() * 1024 * 1024,
        simdAcceleration: true,
        performanceScore: Math.floor(Math.random() * 20) + 80
      },
      ...overrides
    } as NeuralAgent;
  }

  static createMockMeshConnection(overrides: Partial<NeuralMeshConnection> = {}): NeuralMeshConnection {
    return {
      id: `conn_${Date.now()}`,
      status: 'connected',
      meshId: `mesh_${Math.random().toString(36).substr(2, 9)}`,
      nodeCount: Math.floor(Math.random() * 100) + 50,
      synapseCount: Math.floor(Math.random() * 500) + 200,
      lastActivity: new Date(),
      ...overrides
    };
  }
}

/**
 * Mock Neural Mesh Service for testing
 */
export class MockNeuralMeshService {
  private eventListeners: Map<string, Function[]> = new Map();
  private connection: NeuralMeshConnection | null = null;
  private agents: Map<string, NeuralAgent> = new Map();

  constructor() {
    this.connection = NeuralAgentFactory.createMockMeshConnection();
  }

  // Mock all public methods from NeuralMeshService
  async initialize(): Promise<boolean> {
    this.emit('connected', this.connection);
    return true;
  }

  async createNeuralAgent(type: Agent['type'], config?: any): Promise<NeuralAgent | null> {
    const agent = NeuralAgentFactory.createMockNeuralAgent({ type });
    this.agents.set(agent.id, agent);
    this.emit('agent_created', agent);
    return agent;
  }

  async updateNeuralAgent(agent: NeuralAgent): Promise<NeuralAgent> {
    // Simulate neural activity update
    agent.neuralProperties.activation = Math.random();
    agent.neuralProperties.spikeHistory.push(agent.neuralProperties.activation);
    if (agent.neuralProperties.spikeHistory.length > 10) {
      agent.neuralProperties.spikeHistory.shift();
    }
    
    this.agents.set(agent.id, agent);
    this.emit('agent_updated', agent);
    return agent;
  }

  async getMeshStatus(): Promise<any> {
    return {
      nodeCount: this.connection?.nodeCount || 0,
      synapseCount: this.connection?.synapseCount || 0,
      activity: Math.random(),
      connectivity: Math.random() * 0.5 + 0.3,
      efficiency: Math.random() * 0.3 + 0.7
    };
  }

  async trainMesh(patterns: any[]): Promise<boolean> {
    // Simulate training delay
    await new Promise(resolve => setTimeout(resolve, 10));
    this.emit('mesh_trained', { patterns: patterns.length, accuracy: Math.random() * 0.2 + 0.8 });
    return true;
  }

  getConnectionStatus(): NeuralMeshConnection | null {
    return this.connection;
  }

  isWasmEnabled(): boolean {
    return true;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.status = 'disconnected';
      this.emit('disconnected', this.connection);
    }
    this.eventListeners.clear();
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  once(event: string, callback: Function): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Test utilities
  getAgent(id: string): NeuralAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): NeuralAgent[] {
    return Array.from(this.agents.values());
  }

  clearAgents(): void {
    this.agents.clear();
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Test neural computation performance
   */
  static async testNeuralPerformance(
    service: NeuralMeshService | MockNeuralMeshService,
    iterations: number = 100,
    maxTimeMs: number = 50
  ): Promise<{ averageTime: number; maxTime: number; passed: boolean }> {
    const times: number[] = [];
    const agent = await service.createNeuralAgent('neural');
    
    if (!agent) {
      throw new Error('Failed to create test agent');
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await service.updateNeuralAgent(agent);
      const end = performance.now();
      times.push(end - start);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const passed = maxTime <= maxTimeMs;

    return { averageTime, maxTime, passed };
  }

  /**
   * Test mesh coordination performance
   */
  static async testMeshCoordination(
    service: NeuralMeshService | MockNeuralMeshService,
    agentCount: number = 10,
    maxTimeMs: number = 100
  ): Promise<{ setupTime: number; updateTime: number; passed: boolean }> {
    // Test mesh setup performance
    const setupStart = performance.now();
    const agents: NeuralAgent[] = [];
    
    for (let i = 0; i < agentCount; i++) {
      const agent = await service.createNeuralAgent('neural');
      if (agent) agents.push(agent);
    }
    
    const setupEnd = performance.now();
    const setupTime = setupEnd - setupStart;

    // Test coordination update performance
    const updateStart = performance.now();
    await Promise.all(agents.map(agent => service.updateNeuralAgent(agent)));
    const updateEnd = performance.now();
    const updateTime = updateEnd - updateStart;

    const passed = setupTime <= maxTimeMs && updateTime <= maxTimeMs;

    return { setupTime, updateTime, passed };
  }

  /**
   * Memory leak detection utility
   */
  static createMemoryLeakDetector() {
    const initialMemory = process.memoryUsage();
    let measurements: NodeJS.MemoryUsage[] = [initialMemory];

    return {
      measure: () => {
        measurements.push(process.memoryUsage());
      },
      
      analyze: (threshold: number = 50 * 1024 * 1024): { leaked: boolean; growth: number } => {
        if (measurements.length < 2) {
          return { leaked: false, growth: 0 };
        }
        
        const latest = measurements[measurements.length - 1];
        const growth = latest.heapUsed - initialMemory.heapUsed;
        
        return {
          leaked: growth > threshold,
          growth
        };
      },
      
      reset: () => {
        measurements = [process.memoryUsage()];
      }
    };
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate neural training patterns
   */
  static generateTrainingPatterns(count: number = 100): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      input: Array.from({ length: 10 }, () => Math.random()),
      output: Array.from({ length: 5 }, () => Math.random()),
      weight: Math.random()
    }));
  }

  /**
   * Generate synthetic neural spikes
   */
  static generateSpikeData(duration: number = 1000, frequency: number = 50): number[] {
    const spikes: number[] = [];
    const interval = 1000 / frequency; // ms between spikes
    
    for (let t = 0; t < duration; t += interval) {
      spikes.push(Math.random() > 0.3 ? 1 : 0); // 70% spike probability
    }
    
    return spikes;
  }

  /**
   * Generate mesh topology data
   */
  static generateMeshTopology(nodeCount: number = 50): any {
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      type: ['sensory', 'motor', 'inter', 'pyramidal', 'purkinje'][i % 5],
      layer: Math.floor(i / 10) + 1,
      position: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100
      }
    }));

    const connections: any[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const connectionCount = Math.floor(Math.random() * 8) + 2;
      for (let j = 0; j < connectionCount; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) {
          connections.push({
            from: i,
            to: target,
            weight: Math.random() * 2 - 1,
            delay: Math.random() * 5
          });
        }
      }
    }

    return { nodes, connections };
  }
}

/**
 * Assertion helpers for neural testing
 */
export class NeuralAssertions {
  /**
   * Assert agent has valid neural properties
   */
  static assertValidNeuralAgent(agent: NeuralAgent): void {
    expect(agent).toBeDefined();
    expect(agent.neuralProperties).toBeDefined();
    expect(agent.wasmMetrics).toBeDefined();
    expect(agent.neuralProperties.neuronId).toMatch(/^neuron_/);
    expect(agent.neuralProperties.layer).toBeGreaterThan(0);
    expect(agent.neuralProperties.layer).toBeLessThanOrEqual(6);
    expect(agent.neuralProperties.threshold).toBeGreaterThan(0);
    expect(agent.neuralProperties.threshold).toBeLessThanOrEqual(1);
    expect(agent.wasmMetrics.performanceScore).toBeGreaterThan(0);
    expect(agent.wasmMetrics.performanceScore).toBeLessThanOrEqual(100);
  }

  /**
   * Assert mesh connection is valid
   */
  static assertValidMeshConnection(connection: NeuralMeshConnection): void {
    expect(connection).toBeDefined();
    expect(connection.id).toMatch(/^conn_/);
    expect(connection.status).toMatch(/^(connecting|connected|disconnected|error)$/);
    expect(connection.nodeCount).toBeGreaterThanOrEqual(0);
    expect(connection.synapseCount).toBeGreaterThanOrEqual(0);
    expect(connection.lastActivity).toBeInstanceOf(Date);
  }

  /**
   * Assert performance metrics meet thresholds
   */
  static assertPerformanceThresholds(
    metrics: { averageTime: number; maxTime: number },
    thresholds: { averageMs: number; maxMs: number }
  ): void {
    expect(metrics.averageTime).toBeLessThanOrEqual(thresholds.averageMs);
    expect(metrics.maxTime).toBeLessThanOrEqual(thresholds.maxMs);
  }

  /**
   * Assert no memory leaks
   */
  static assertNoMemoryLeaks(detector: ReturnType<typeof PerformanceTestUtils.createMemoryLeakDetector>): void {
    const analysis = detector.analyze();
    expect(analysis.leaked).toBe(false);
    if (analysis.leaked) {
      console.warn(`Memory leak detected: ${analysis.growth} bytes`);
    }
  }
}

export {
  NeuralAgentFactory,
  MockNeuralMeshService,
  PerformanceTestUtils,
  TestDataGenerator,
  NeuralAssertions
};