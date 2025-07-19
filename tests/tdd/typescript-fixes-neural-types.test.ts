/**
 * TDD Tests for TypeScript Fixes - Neural Types
 * Testing neural types, interfaces, and missing exports
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  AgentState,
  NeuralConfiguration,
  NeuralAgent,
  PerformanceMetrics,
  LearningSession,
  NetworkTopology,
  AgentMetrics,
  SwarmStatistics,
  SASIAgent,
  SASISwarmData,
  PerformanceTarget,
  PerformanceAlert,
  PerformanceReport,
  WASMModule,
  TrainingData,
  TrainingResult,
  AgentStateRecord,
  WeightsRecord,
  LearningRecord,
  AgentEventData,
  AgentSpawnedEvent,
  InferenceCompleteEvent,
  LearningCompleteEvent,
  AgentTerminatedEvent,
  KnowledgeSharedEvent,
  NeuralSystemConfig,
  NeuralAgentError,
  WASMError,
  PerformanceError,
  NeuralPerformanceSnapshot,
  SystemHealthMetrics,
  ExtendedPerformanceAlert,
  EnhancedNeuralAgent,
  ExtendedPerformanceMetrics,
  NeuralAgentManagerConfig,
  NodeTimer
} from '../../src/types/neural';

describe('Neural Types TypeScript Compatibility', () => {
  let mockNeuralAgent: NeuralAgent;
  let mockSASIAgent: SASIAgent;
  let mockNeuralConfig: NeuralConfiguration;
  let mockWASMModule: WASMModule;

  beforeEach(() => {
    // Setup mock NeuralConfiguration
    mockNeuralConfig = {
      type: 'mlp',
      architecture: [784, 128, 64, 10],
      activationFunction: 'relu',
      learningRate: 0.001,
      momentum: 0.9,
      regularization: {
        type: 'l2',
        value: 0.01
      },
      simdOptimized: true,
      customConfig: {
        batchSize: 32,
        epochs: 100
      }
    };

    // Setup mock NeuralAgent
    mockNeuralAgent = {
      id: 'agent-001',
      config: mockNeuralConfig,
      network: null, // WASM network instance placeholder
      state: AgentState.ACTIVE,
      createdAt: Date.now(),
      lastActive: Date.now(),
      memoryUsage: 1024 * 1024, // 1MB
      totalInferences: 150,
      averageInferenceTime: 25.5,
      learningProgress: 0.75,
      connectionStrength: 0.85,
      metadata: {
        version: '1.0.0',
        creator: 'test-system'
      }
    };

    // Setup mock SASIAgent
    mockSASIAgent = {
      id: 'sasi-agent-001',
      name: 'Test SASI Agent',
      type: 'researcher',
      status: 'active',
      performance: 0.85,
      memoryUsage: 512 * 1024,
      lastActivity: Date.now(),
      totalTasks: 42,
      successRate: 0.95,
      learningProgress: 0.68,
      connections: ['agent-002', 'agent-003'],
      neuralAgent: mockNeuralAgent
    };

    // Setup mock WASM Module
    mockWASMModule = {
      createNeuralNetwork: async (config: NeuralConfiguration) => ({ id: 'network-001' }),
      runInference: async (network: any, inputs: number[]) => [0.1, 0.2, 0.7],
      trainNetwork: async (network: any, data: TrainingData[], epochs: number) => ({
        accuracy: 0.92,
        loss: 0.08,
        convergenceEpoch: 45,
        trainingTime: 1500
      }),
      serializeWeights: async (network: any) => new ArrayBuffer(1024),
      deserializeWeights: async (network: any, weights: ArrayBuffer, influence?: number) => {},
      getMemoryUsage: () => 2048 * 1024,
      enableSIMD: true,
      destroyNetwork: (network: any) => {}
    };
  });

  describe('AgentState Enum', () => {
    it('should support all agent states', () => {
      expect(AgentState.INITIALIZING).toBe('initializing');
      expect(AgentState.ACTIVE).toBe('active');
      expect(AgentState.LEARNING).toBe('learning');
      expect(AgentState.IDLE).toBe('idle');
      expect(AgentState.TERMINATING).toBe('terminating');
      expect(AgentState.ERROR).toBe('error');
    });

    it('should allow agent state transitions', () => {
      mockNeuralAgent.state = AgentState.INITIALIZING;
      expect(mockNeuralAgent.state).toBe(AgentState.INITIALIZING);

      mockNeuralAgent.state = AgentState.ACTIVE;
      expect(mockNeuralAgent.state).toBe(AgentState.ACTIVE);

      mockNeuralAgent.state = AgentState.LEARNING;
      expect(mockNeuralAgent.state).toBe(AgentState.LEARNING);
    });
  });

  describe('NeuralConfiguration Interface', () => {
    it('should create valid neural configuration', () => {
      expect(mockNeuralConfig.type).toBe('mlp');
      expect(mockNeuralConfig.architecture).toEqual([784, 128, 64, 10]);
      expect(mockNeuralConfig.activationFunction).toBe('relu');
      expect(mockNeuralConfig.learningRate).toBe(0.001);
      expect(mockNeuralConfig.simdOptimized).toBe(true);
    });

    it('should support different network types', () => {
      const lstmConfig: NeuralConfiguration = {
        type: 'lstm',
        architecture: [100, 50, 25],
        activationFunction: 'tanh',
        learningRate: 0.01
      };

      expect(lstmConfig.type).toBe('lstm');
      expect(lstmConfig.activationFunction).toBe('tanh');
    });

    it('should support regularization options', () => {
      const l1Config: NeuralConfiguration = {
        type: 'cnn',
        architecture: [784, 128, 10],
        regularization: {
          type: 'l1',
          value: 0.001
        }
      };

      const dropoutConfig: NeuralConfiguration = {
        type: 'transformer',
        architecture: [512, 256, 128],
        regularization: {
          type: 'dropout',
          value: 0.2
        }
      };

      expect(l1Config.regularization?.type).toBe('l1');
      expect(dropoutConfig.regularization?.type).toBe('dropout');
    });
  });

  describe('NeuralAgent Interface', () => {
    it('should create valid neural agent', () => {
      expect(mockNeuralAgent.id).toBe('agent-001');
      expect(mockNeuralAgent.config.type).toBe('mlp');
      expect(mockNeuralAgent.state).toBe(AgentState.ACTIVE);
      expect(typeof mockNeuralAgent.createdAt).toBe('number');
      expect(typeof mockNeuralAgent.lastActive).toBe('number');
      expect(typeof mockNeuralAgent.memoryUsage).toBe('number');
      expect(typeof mockNeuralAgent.totalInferences).toBe('number');
      expect(typeof mockNeuralAgent.averageInferenceTime).toBe('number');
      expect(typeof mockNeuralAgent.learningProgress).toBe('number');
      expect(typeof mockNeuralAgent.connectionStrength).toBe('number');
    });

    it('should support optional metadata', () => {
      expect(mockNeuralAgent.metadata).toBeDefined();
      expect(mockNeuralAgent.metadata?.version).toBe('1.0.0');
      expect(mockNeuralAgent.metadata?.creator).toBe('test-system');
    });

    it('should handle performance metrics', () => {
      const metrics: PerformanceMetrics = {
        totalAgentsSpawned: 10,
        averageSpawnTime: 150,
        averageInferenceTime: 25.5,
        memoryUsage: 5 * 1024 * 1024,
        activeLearningTasks: 3,
        systemHealthScore: 85
      };

      expect(metrics.totalAgentsSpawned).toBe(10);
      expect(metrics.averageSpawnTime).toBe(150);
      expect(metrics.systemHealthScore).toBe(85);
    });
  });

  describe('Learning and Training Interfaces', () => {
    it('should create valid learning session', () => {
      const session: LearningSession = {
        sessionId: 'session-001',
        agentId: 'agent-001',
        startTime: Date.now(),
        duration: 3600000, // 1 hour
        epochs: 50,
        finalAccuracy: 0.92,
        dataPoints: 10000,
        convergenceEpoch: 35
      };

      expect(session.sessionId).toBe('session-001');
      expect(session.agentId).toBe('agent-001');
      expect(typeof session.startTime).toBe('number');
      expect(session.finalAccuracy).toBe(0.92);
    });

    it('should handle training data and results', () => {
      const trainingData: TrainingData = {
        inputs: [0.1, 0.2, 0.3, 0.4],
        outputs: [0.8, 0.9]
      };

      const trainingResult: TrainingResult = {
        accuracy: 0.95,
        loss: 0.05,
        convergenceEpoch: 42,
        trainingTime: 2000
      };

      expect(trainingData.inputs.length).toBe(4);
      expect(trainingData.outputs.length).toBe(2);
      expect(trainingResult.accuracy).toBe(0.95);
      expect(trainingResult.convergenceEpoch).toBe(42);
    });
  });

  describe('SASI Integration Types', () => {
    it('should create valid SASI agent', () => {
      expect(mockSASIAgent.id).toBe('sasi-agent-001');
      expect(mockSASIAgent.name).toBe('Test SASI Agent');
      expect(mockSASIAgent.type).toBe('researcher');
      expect(mockSASIAgent.status).toBe('active');
      expect(mockSASIAgent.performance).toBe(0.85);
      expect(mockSASIAgent.successRate).toBe(0.95);
      expect(Array.isArray(mockSASIAgent.connections)).toBe(true);
      expect(mockSASIAgent.neuralAgent).toBeDefined();
    });

    it('should create valid SASI swarm data', () => {
      const networkTopology: NetworkTopology = {
        nodes: [
          {
            id: 'node-001',
            type: 'neural',
            state: AgentState.ACTIVE,
            performance: 0.85,
            memoryUsage: 1024 * 1024
          }
        ],
        connections: [['node-001', 'node-002', 0.8]],
        totalNodes: 5,
        activeConnections: 8,
        networkHealth: 90
      };

      const swarmStats: SwarmStatistics = {
        totalAgents: 10,
        activeAgents: 8,
        averagePerformance: 0.82,
        totalMemoryUsage: 10 * 1024 * 1024,
        totalTasks: 150,
        systemHealth: 88,
        networkTopology,
        learningMetrics: {
          activeSessions: 3,
          completedSessions: 45,
          averageAccuracy: 0.89,
          knowledgeTransfers: 12
        }
      };

      const sasiSwarmData: SASISwarmData = {
        agents: [mockSASIAgent],
        statistics: swarmStats,
        topology: networkTopology,
        isNeuralEnabled: true,
        performanceMetrics: {
          totalAgentsSpawned: 10,
          averageSpawnTime: 150,
          averageInferenceTime: 25,
          memoryUsage: 10 * 1024 * 1024,
          activeLearningTasks: 3,
          systemHealthScore: 88
        }
      };

      expect(sasiSwarmData.agents.length).toBe(1);
      expect(sasiSwarmData.isNeuralEnabled).toBe(true);
      expect(sasiSwarmData.statistics.totalAgents).toBe(10);
    });
  });

  describe('Performance and Monitoring Types', () => {
    it('should create valid performance targets', () => {
      const targets: PerformanceTarget = {
        agentSpawnTime: 100,
        inferenceTime: 20,
        memoryPerAgent: 2 * 1024 * 1024,
        wasmOperationTime: 5
      };

      expect(targets.agentSpawnTime).toBe(100);
      expect(targets.inferenceTime).toBe(20);
      expect(targets.memoryPerAgent).toBe(2 * 1024 * 1024);
      expect(targets.wasmOperationTime).toBe(5);
    });

    it('should create valid performance alerts', () => {
      const alert: PerformanceAlert = {
        type: 'memory_usage',
        severity: 'high',
        message: 'Memory usage exceeded threshold',
        value: 8 * 1024 * 1024,
        threshold: 6 * 1024 * 1024,
        timestamp: Date.now(),
        agentId: 'agent-001'
      };

      expect(alert.type).toBe('memory_usage');
      expect(alert.severity).toBe('high');
      expect(alert.value).toBeGreaterThan(alert.threshold);
    });

    it('should create valid performance report', () => {
      const targets: PerformanceTarget = {
        agentSpawnTime: 100,
        inferenceTime: 20,
        memoryPerAgent: 2 * 1024 * 1024,
        wasmOperationTime: 5
      };

      const report: PerformanceReport = {
        timestamp: Date.now(),
        targets,
        current: {
          averageSpawnTime: 120,
          averageInferenceTime: 25,
          memoryUsage: 8 * 1024 * 1024,
          wasmOperationTime: 7
        },
        alerts: [],
        healthScore: 78,
        recommendations: [
          'Optimize memory usage',
          'Improve inference performance'
        ]
      };

      expect(report.current.averageSpawnTime).toBeGreaterThan(targets.agentSpawnTime);
      expect(report.healthScore).toBe(78);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('WASM Integration Types', () => {
    it('should support WASM module operations', async () => {
      const network = await mockWASMModule.createNeuralNetwork(mockNeuralConfig);
      expect(network).toBeDefined();

      const inputs = [0.1, 0.2, 0.3];
      const outputs = await mockWASMModule.runInference(network, inputs);
      expect(Array.isArray(outputs)).toBe(true);
      expect(outputs.length).toBe(3);

      const trainingData: TrainingData[] = [
        { inputs: [0.1, 0.2], outputs: [0.8] },
        { inputs: [0.3, 0.4], outputs: [0.9] }
      ];
      
      const result = await mockWASMModule.trainNetwork(network, trainingData, 10);
      expect(result.accuracy).toBe(0.92);
      expect(result.loss).toBe(0.08);

      const weights = await mockWASMModule.serializeWeights(network);
      expect(weights).toBeInstanceOf(ArrayBuffer);

      await mockWASMModule.deserializeWeights(network, weights, 0.5);
      
      const memoryUsage = mockWASMModule.getMemoryUsage();
      expect(typeof memoryUsage).toBe('number');

      expect(mockWASMModule.enableSIMD).toBe(true);
    });
  });

  describe('Event System Types', () => {
    it('should create valid agent events', () => {
      const spawnEvent: AgentSpawnedEvent = {
        agentId: 'agent-001',
        timestamp: Date.now(),
        spawnTime: 150,
        config: mockNeuralConfig,
        memoryUsage: 1024 * 1024
      };

      const inferenceEvent: InferenceCompleteEvent = {
        agentId: 'agent-001',
        timestamp: Date.now(),
        inferenceTime: 25,
        inputSize: 784,
        outputSize: 10
      };

      const learningEvent: LearningCompleteEvent = {
        agentId: 'agent-001',
        timestamp: Date.now(),
        sessionId: 'session-001',
        duration: 3600000,
        finalAccuracy: 0.92,
        epochs: 50
      };

      const terminatedEvent: AgentTerminatedEvent = {
        agentId: 'agent-001',
        timestamp: Date.now(),
        reason: 'User requested shutdown'
      };

      const knowledgeEvent: KnowledgeSharedEvent = {
        agentId: 'agent-002',
        timestamp: Date.now(),
        sourceAgentId: 'agent-001',
        targetAgentIds: ['agent-003', 'agent-004']
      };

      expect(spawnEvent.spawnTime).toBe(150);
      expect(inferenceEvent.inferenceTime).toBe(25);
      expect(learningEvent.finalAccuracy).toBe(0.92);
      expect(terminatedEvent.reason).toBe('User requested shutdown');
      expect(knowledgeEvent.targetAgentIds.length).toBe(2);
    });
  });

  describe('Configuration Types', () => {
    it('should create valid neural system config', () => {
      const config: NeuralSystemConfig = {
        manager: {
          maxAgents: 50,
          memoryLimitPerAgent: 5 * 1024 * 1024,
          inferenceTimeout: 30000,
          simdEnabled: true,
          crossLearningEnabled: true,
          persistenceEnabled: true,
          performanceMonitoring: true
        },
        performance: {
          targets: {
            agentSpawnTime: 100,
            inferenceTime: 20,
            memoryPerAgent: 2 * 1024 * 1024,
            wasmOperationTime: 5
          },
          alertThresholds: {
            memory: 0.8,
            cpu: 0.9,
            latency: 100
          },
          monitoringInterval: 5000
        },
        wasm: {
          modulePath: '/wasm/neural.wasm',
          simdVariant: true,
          memorySize: 64 * 1024 * 1024
        },
        database: {
          enabled: true,
          path: './neural.db',
          backupInterval: 3600000
        }
      };

      expect(config.manager.maxAgents).toBe(50);
      expect(config.performance.targets.inferenceTime).toBe(20);
      expect(config.wasm.simdVariant).toBe(true);
      expect(config.database.enabled).toBe(true);
    });
  });

  describe('Error Types', () => {
    it('should create neural agent errors', () => {
      const error = new NeuralAgentError(
        'Agent initialization failed',
        'INIT_ERROR',
        'agent-001',
        { config: mockNeuralConfig }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NeuralAgentError');
      expect(error.message).toBe('Agent initialization failed');
      expect(error.code).toBe('INIT_ERROR');
      expect(error.agentId).toBe('agent-001');
      expect(error.details.config).toBe(mockNeuralConfig);
    });

    it('should create WASM errors', () => {
      const error = new WASMError(
        'Failed to load WASM module',
        'load_module',
        { path: '/wasm/neural.wasm' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WASMError');
      expect(error.operation).toBe('load_module');
    });

    it('should create performance errors', () => {
      const error = new PerformanceError(
        'Memory threshold exceeded',
        'memory_usage',
        8 * 1024 * 1024,
        6 * 1024 * 1024
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PerformanceError');
      expect(error.metric).toBe('memory_usage');
      expect(error.value).toBeGreaterThan(error.threshold);
    });
  });

  describe('Extended Neural Types', () => {
    it('should create valid neural performance snapshot', () => {
      const snapshot: NeuralPerformanceSnapshot = {
        timestamp: Date.now(),
        agentId: 'agent-001',
        spawnTime: 150,
        inferenceTime: 25,
        memoryUsage: 2 * 1024 * 1024,
        systemHealth: 85,
        cpuUsage: 45,
        neuralActivity: 0.78,
        totalNeurons: 1024,
        totalSynapses: 2048,
        meshConnectivity: 0.65,
        wasmAcceleration: true,
        accuracy: 0.92,
        performance: 0.88,
        latency: 15,
        memory: 1.8 * 1024 * 1024
      };

      expect(snapshot.agentId).toBe('agent-001');
      expect(snapshot.wasmAcceleration).toBe(true);
      expect(snapshot.accuracy).toBe(0.92);
    });

    it('should create valid system health metrics', () => {
      const health: SystemHealthMetrics = {
        overallScore: 85,
        componentScores: {
          neural: 88,
          memory: 82,
          performance: 90,
          network: 85,
          wasm: 92
        },
        activeAlerts: [],
        recommendations: [
          'Optimize memory allocation',
          'Consider load balancing'
        ],
        uptime: 3600000,
        lastCheck: new Date()
      };

      expect(health.overallScore).toBe(85);
      expect(health.componentScores.wasm).toBe(92);
      expect(health.lastCheck).toBeInstanceOf(Date);
    });

    it('should create enhanced neural agent', () => {
      const enhanced: EnhancedNeuralAgent = {
        ...mockNeuralAgent,
        neuralProperties: {
          neuronId: 'neuron-001',
          meshId: 'mesh-001',
          nodeType: 'pyramidal',
          layer: 2,
          threshold: 0.5,
          activation: 0.7,
          connections: ['neuron-002', 'neuron-003'],
          spikeHistory: [0.1, 0.3, 0.8, 0.2],
          lastSpike: new Date()
        },
        type: 'neural',
        capabilities: ['inference', 'learning', 'adaptation'],
        realtime: {
          cpuUsage: 45,
          memoryUsage: 2 * 1024 * 1024,
          networkLatency: 15
        }
      };

      expect(enhanced.neuralProperties.nodeType).toBe('pyramidal');
      expect(enhanced.type).toBe('neural');
      expect(enhanced.capabilities.includes('learning')).toBe(true);
    });
  });

  describe('Type Utility and Compatibility', () => {
    it('should support utility type operations', () => {
      type AgentID = string;
      type NetworkID = string;
      type SessionID = string;

      const agentId: AgentID = 'agent-001';
      const networkId: NetworkID = 'network-001';
      const sessionId: SessionID = 'session-001';

      expect(typeof agentId).toBe('string');
      expect(typeof networkId).toBe('string');
      expect(typeof sessionId).toBe('string');
    });

    it('should support NodeTimer type for compatibility', () => {
      const timer: NodeTimer = setTimeout(() => {}, 1000);
      expect(typeof timer).toBe('object');
      clearTimeout(timer);
    });

    it('should support neural agent manager config', () => {
      const config: NeuralAgentManagerConfig = {
        maxAgents: 20,
        memoryLimitPerAgent: 4 * 1024 * 1024,
        performanceMonitoring: true,
        simdEnabled: true,
        crossLearningEnabled: true,
        persistenceEnabled: true,
        inferenceTimeout: 25000
      };

      expect(config.maxAgents).toBe(20);
      expect(config.simdEnabled).toBe(true);
    });
  });
});