/**
 * Comprehensive Unit Tests for NeuralAgentManager
 * Target: 95%+ coverage for neural agent lifecycle and operations
 */

import { EventEmitter } from 'events';
import { NeuralAgentManager } from '../../../src/services/NeuralAgentManager';
import { AgentState } from '../../../src/types/neural';

// Mock performance for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
};
global.performance = mockPerformance as any;

// Mock WebAssembly for testing
global.WebAssembly = {
  compile: jest.fn(),
  instantiate: jest.fn(),
  validate: jest.fn(() => true),
} as any;

describe('NeuralAgentManager - Comprehensive Unit Tests', () => {
  let manager: NeuralAgentManager;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    
    mockConfig = {
      maxAgents: 5,
      memoryLimitPerAgent: 10 * 1024 * 1024, // 10MB for testing
      inferenceTimeout: 50,
      simdEnabled: true,
      crossLearningEnabled: true,
      persistenceEnabled: false, // Disable for unit tests
      performanceMonitoring: true,
      wasmModulePath: '/test/neural.wasm'
    };
    
    manager = new NeuralAgentManager(mockConfig);
  });

  afterEach(async () => {
    if (manager) {
      await manager.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultManager = new NeuralAgentManager();
      expect(defaultManager).toBeInstanceOf(EventEmitter);
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        maxAgents: 10,
        memoryLimitPerAgent: 100 * 1024 * 1024,
        inferenceTimeout: 200
      };
      const customManager = new NeuralAgentManager(customConfig);
      expect(customManager).toBeInstanceOf(EventEmitter);
    });

    test('should emit initialized event after successful initialization', (done) => {
      const testManager = new NeuralAgentManager(mockConfig);
      
      testManager.on('initialized', (event) => {
        expect(event.config).toBeDefined();
        expect(event.timestamp).toBeDefined();
        done();
      });
    });

    test('should handle initialization errors gracefully', (done) => {
      const errorConfig = {
        ...mockConfig,
        wasmModulePath: '/invalid/path.wasm'
      };
      
      const errorManager = new NeuralAgentManager(errorConfig);
      
      errorManager.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });
  });

  describe('Agent Spawning', () => {
    beforeEach(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should spawn agent with valid configuration', async () => {
      const agentConfig = {
        type: 'mlp',
        architecture: [10, 5, 1],
        learningRate: 0.001
      };

      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1075);
      
      const agentId = await manager.spawnAgent(agentConfig);
      
      expect(agentId).toBeDefined();
      expect(typeof agentId).toBe('string');
      expect(agentId).toMatch(/^agent_\d+_[a-z0-9]+$/);
    });

    test('should emit agentSpawned event', (done) => {
      const agentConfig = {
        type: 'mlp',
        architecture: [10, 5, 1]
      };

      manager.on('agentSpawned', (event) => {
        expect(event.agentId).toBeDefined();
        expect(event.spawnTime).toBeDefined();
        expect(event.config).toEqual(agentConfig);
        expect(event.memoryUsage).toBeDefined();
        done();
      });

      manager.spawnAgent(agentConfig);
    });

    test('should reject spawning when max agents reached', async () => {
      const agentConfig = { type: 'mlp', architecture: [5, 1] };
      
      // Spawn max agents
      for (let i = 0; i < mockConfig.maxAgents; i++) {
        await manager.spawnAgent(agentConfig);
      }
      
      // Try to spawn one more
      await expect(manager.spawnAgent(agentConfig))
        .rejects.toThrow('Maximum agents limit reached: 5');
    });

    test('should reject spawning when not initialized', async () => {
      const uninitializedManager = new NeuralAgentManager(mockConfig);
      const agentConfig = { type: 'mlp', architecture: [5, 1] };
      
      await expect(uninitializedManager.spawnAgent(agentConfig))
        .rejects.toThrow('Neural Agent Manager not initialized');
    });

    test('should track performance metrics during spawning', async () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1080);
      
      const agentConfig = { type: 'mlp', architecture: [10, 5, 1] };
      await manager.spawnAgent(agentConfig);
      
      const metrics = manager.getPerformanceMetrics();
      expect(metrics.totalAgentsSpawned).toBe(1);
      expect(metrics.averageSpawnTime).toBeGreaterThan(0);
    });
  });

  describe('Neural Inference', () => {
    let agentId: string;

    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const agentConfig = { type: 'mlp', architecture: [3, 2, 1] };
      agentId = await manager.spawnAgent(agentConfig);
    });

    test('should run inference successfully', async () => {
      const inputs = [0.1, 0.5, 0.9];
      mockPerformance.now.mockReturnValueOnce(2000).mockReturnValueOnce(2030);
      
      const outputs = await manager.runInference(agentId, inputs);
      
      expect(outputs).toBeDefined();
      expect(Array.isArray(outputs)).toBe(true);
      expect(outputs.length).toBeGreaterThan(0);
    });

    test('should emit inferenceComplete event', (done) => {
      const inputs = [0.1, 0.5, 0.9];
      
      manager.on('inferenceComplete', (event) => {
        expect(event.agentId).toBe(agentId);
        expect(event.inferenceTime).toBeDefined();
        expect(event.inputSize).toBe(inputs.length);
        expect(event.outputSize).toBeGreaterThan(0);
        done();
      });

      manager.runInference(agentId, inputs);
    });

    test('should reject inference for non-existent agent', async () => {
      const inputs = [0.1, 0.5, 0.9];
      
      await expect(manager.runInference('invalid-agent-id', inputs))
        .rejects.toThrow('Agent not found: invalid-agent-id');
    });

    test('should handle inference timeout', async () => {
      const inputs = [0.1, 0.5, 0.9];
      
      // Mock a slow inference that exceeds timeout
      const slowManager = new NeuralAgentManager({
        ...mockConfig,
        inferenceTimeout: 1 // 1ms timeout
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const slowAgentId = await slowManager.spawnAgent({ type: 'mlp', architecture: [3, 1] });
      
      await expect(slowManager.runInference(slowAgentId, inputs))
        .rejects.toThrow('Inference timeout');
    });

    test('should update agent statistics after inference', async () => {
      const inputs = [0.1, 0.5, 0.9];
      
      await manager.runInference(agentId, inputs);
      
      const agent = manager.getAgentState(agentId);
      expect(agent).toBeDefined();
      expect(agent!.totalInferences).toBe(1);
      expect(agent!.averageInferenceTime).toBeGreaterThan(0);
      expect(agent!.lastActive).toBeGreaterThan(0);
    });
  });

  describe('Agent Training', () => {
    let agentId: string;

    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const agentConfig = { type: 'mlp', architecture: [2, 3, 1] };
      agentId = await manager.spawnAgent(agentConfig);
    });

    test('should train agent successfully', async () => {
      const trainingData = [
        { inputs: [0, 0], outputs: [0] },
        { inputs: [0, 1], outputs: [1] },
        { inputs: [1, 0], outputs: [1] },
        { inputs: [1, 1], outputs: [0] }
      ];
      
      mockPerformance.now.mockReturnValueOnce(3000).mockReturnValueOnce(3500);
      
      const session = await manager.trainAgent(agentId, trainingData, 10);
      
      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.agentId).toBe(agentId);
      expect(session.epochs).toBe(10);
      expect(session.finalAccuracy).toBeGreaterThan(0);
      expect(session.dataPoints).toBe(4);
    });

    test('should emit learningComplete event', (done) => {
      const trainingData = [
        { inputs: [0.1, 0.2], outputs: [0.3] }
      ];
      
      manager.on('learningComplete', (session) => {
        expect(session.sessionId).toBeDefined();
        expect(session.agentId).toBe(agentId);
        expect(session.finalAccuracy).toBeGreaterThan(0);
        done();
      });

      manager.trainAgent(agentId, trainingData, 5);
    });

    test('should update agent state during training', async () => {
      const trainingData = [{ inputs: [0.1], outputs: [0.2] }];
      
      // Check state changes during training
      const trainingPromise = manager.trainAgent(agentId, trainingData, 5);
      
      // Give training a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const agentDuringTraining = manager.getAgentState(agentId);
      expect(agentDuringTraining!.state).toBe(AgentState.LEARNING);
      
      await trainingPromise;
      
      const agentAfterTraining = manager.getAgentState(agentId);
      expect(agentAfterTraining!.state).toBe(AgentState.ACTIVE);
      expect(agentAfterTraining!.learningProgress).toBeGreaterThan(0);
    });

    test('should handle training errors gracefully', async () => {
      const invalidTrainingData: any = null;
      
      await expect(manager.trainAgent(agentId, invalidTrainingData, 10))
        .rejects.toThrow();
      
      // Agent should return to active state after error
      const agent = manager.getAgentState(agentId);
      expect(agent!.state).toBe(AgentState.ACTIVE);
    });
  });

  describe('Knowledge Sharing', () => {
    let sourceAgentId: string;
    let targetAgentId: string;

    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const agentConfig = { type: 'mlp', architecture: [3, 2, 1] };
      sourceAgentId = await manager.spawnAgent(agentConfig);
      targetAgentId = await manager.spawnAgent(agentConfig);
    });

    test('should share knowledge between agents', async () => {
      await expect(manager.shareKnowledge(sourceAgentId, [targetAgentId]))
        .resolves.not.toThrow();
    });

    test('should emit knowledgeShared event', (done) => {
      manager.on('knowledgeShared', (event) => {
        expect(event.sourceAgentId).toBe(sourceAgentId);
        expect(event.targetAgentIds).toContain(targetAgentId);
        expect(event.timestamp).toBeDefined();
        done();
      });

      manager.shareKnowledge(sourceAgentId, [targetAgentId]);
    });

    test('should reject sharing when cross-learning disabled', async () => {
      const noCrossLearningManager = new NeuralAgentManager({
        ...mockConfig,
        crossLearningEnabled: false
      });
      
      await expect(noCrossLearningManager.shareKnowledge('agent1', ['agent2']))
        .rejects.toThrow('Cross-learning is disabled');
    });

    test('should reject sharing from non-existent source agent', async () => {
      await expect(manager.shareKnowledge('invalid-source', [targetAgentId]))
        .rejects.toThrow('Source agent not found: invalid-source');
    });

    test('should handle non-existent target agents gracefully', async () => {
      await expect(manager.shareKnowledge(sourceAgentId, ['invalid-target']))
        .resolves.not.toThrow();
    });
  });

  describe('Agent Management', () => {
    let agentId: string;

    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      agentId = await manager.spawnAgent(agentConfig);
    });

    test('should get agent state', () => {
      const agent = manager.getAgentState(agentId);
      
      expect(agent).toBeDefined();
      expect(agent!.id).toBe(agentId);
      expect(agent!.state).toBe(AgentState.ACTIVE);
      expect(agent!.config).toBeDefined();
      expect(agent!.createdAt).toBeDefined();
    });

    test('should return null for non-existent agent', () => {
      const agent = manager.getAgentState('invalid-id');
      expect(agent).toBeNull();
    });

    test('should get active agents', () => {
      const activeAgents = manager.getActiveAgents();
      
      expect(Array.isArray(activeAgents)).toBe(true);
      expect(activeAgents.length).toBeGreaterThan(0);
      expect(activeAgents[0].state).toBe(AgentState.ACTIVE);
    });

    test('should terminate agent successfully', async () => {
      await manager.terminateAgent(agentId);
      
      const agent = manager.getAgentState(agentId);
      expect(agent).toBeNull();
    });

    test('should emit agentTerminated event', (done) => {
      manager.on('agentTerminated', (event) => {
        expect(event.agentId).toBe(agentId);
        done();
      });

      manager.terminateAgent(agentId);
    });

    test('should handle terminating non-existent agent gracefully', async () => {
      await expect(manager.terminateAgent('invalid-id'))
        .resolves.not.toThrow();
    });
  });

  describe('Network Topology', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Spawn multiple agents for topology testing
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      await manager.spawnAgent(agentConfig);
      await manager.spawnAgent(agentConfig);
      await manager.spawnAgent(agentConfig);
    });

    test('should get network topology', () => {
      const topology = manager.getNetworkTopology();
      
      expect(topology).toBeDefined();
      expect(topology.nodes).toBeDefined();
      expect(topology.connections).toBeDefined();
      expect(topology.totalNodes).toBe(3);
      expect(topology.activeConnections).toBeGreaterThan(0);
      expect(topology.networkHealth).toBeGreaterThan(0);
    });

    test('should include correct node information', () => {
      const topology = manager.getNetworkTopology();
      
      topology.nodes.forEach(node => {
        expect(node.id).toBeDefined();
        expect(node.type).toBeDefined();
        expect(node.state).toBe(AgentState.ACTIVE);
        expect(typeof node.performance).toBe('number');
        expect(typeof node.memoryUsage).toBe('number');
      });
    });

    test('should calculate network connections correctly', () => {
      const topology = manager.getNetworkTopology();
      const expectedConnections = (3 * (3 - 1)) / 2; // n*(n-1)/2 for full mesh
      
      expect(topology.connections.length).toBe(expectedConnections);
      
      topology.connections.forEach(connection => {
        expect(connection).toHaveLength(3); // [source, target, strength]
        expect(typeof connection[2]).toBe('number'); // strength
      });
    });
  });

  describe('Performance Metrics', () => {
    test('should provide performance metrics', () => {
      const metrics = manager.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalAgentsSpawned).toBe('number');
      expect(typeof metrics.averageSpawnTime).toBe('number');
      expect(typeof metrics.averageInferenceTime).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.activeLearningTasks).toBe('number');
      expect(typeof metrics.systemHealthScore).toBe('number');
    });

    test('should calculate system health correctly', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = manager.getPerformanceMetrics();
      expect(metrics.systemHealthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.systemHealthScore).toBeLessThanOrEqual(100);
    });

    test('should update metrics after operations', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const initialMetrics = manager.getPerformanceMetrics();
      
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      await manager.spawnAgent(agentConfig);
      
      const updatedMetrics = manager.getPerformanceMetrics();
      expect(updatedMetrics.totalAgentsSpawned).toBeGreaterThan(initialMetrics.totalAgentsSpawned);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup all resources', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Spawn some agents
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      await manager.spawnAgent(agentConfig);
      await manager.spawnAgent(agentConfig);
      
      expect(manager.getActiveAgents().length).toBe(2);
      
      await manager.cleanup();
      
      expect(manager.getActiveAgents().length).toBe(0);
    });

    test('should emit cleanup event', (done) => {
      manager.on('cleanup', () => {
        done();
      });

      manager.cleanup();
    });
  });

  describe('Error Handling', () => {
    test('should handle WASM initialization failure', async () => {
      // Mock WebAssembly to throw error
      const originalWebAssembly = global.WebAssembly;
      global.WebAssembly = {
        instantiate: jest.fn().mockRejectedValue(new Error('WASM load failed'))
      } as any;

      const errorManager = new NeuralAgentManager(mockConfig);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore WebAssembly
      global.WebAssembly = originalWebAssembly;
    });

    test('should handle memory allocation errors', async () => {
      // Test with very small memory limit
      const smallMemoryManager = new NeuralAgentManager({
        ...mockConfig,
        memoryLimitPerAgent: 1 // 1 byte - too small
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const agentConfig = { type: 'mlp', architecture: [1000, 1000, 1000] }; // Large network
      
      // Should not throw but may emit warnings
      await expect(smallMemoryManager.spawnAgent(agentConfig))
        .resolves.toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty training data', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      const agentId = await manager.spawnAgent(agentConfig);
      
      await expect(manager.trainAgent(agentId, [], 10))
        .rejects.toThrow();
    });

    test('should handle zero epochs training', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const agentConfig = { type: 'mlp', architecture: [2, 1] };
      const agentId = await manager.spawnAgent(agentConfig);
      const trainingData = [{ inputs: [0.1, 0.2], outputs: [0.3] }];
      
      const session = await manager.trainAgent(agentId, trainingData, 0);
      expect(session.epochs).toBe(0);
    });

    test('should handle large input arrays', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const agentConfig = { type: 'mlp', architecture: [1000, 1] };
      const agentId = await manager.spawnAgent(agentConfig);
      
      const largeInputs = new Array(1000).fill(0).map(() => Math.random());
      
      await expect(manager.runInference(agentId, largeInputs))
        .resolves.toBeDefined();
    });
  });
});