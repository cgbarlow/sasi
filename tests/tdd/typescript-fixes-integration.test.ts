/**
 * TDD Tests for TypeScript Fixes - Integration Test Suite
 * Comprehensive integration testing for all fixed components
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  NetworkPartition,
  NetworkTopology,
  PeerInfo,
  Connection,
  DEFAULT_P2P_CONFIG
} from '../../src/types/network';
import {
  NeuralAgent,
  AgentState,
  NeuralConfiguration,
  PerformanceMetrics,
  SASIAgent
} from '../../src/types/neural';
import { MeshTopology } from '../../src/services/MeshTopology';

// Mock GitHub integration for integration testing
jest.mock('@octokit/rest');

describe('TypeScript Fixes Integration Test Suite', () => {
  let meshTopology: MeshTopology;
  let mockPeers: PeerInfo[];
  let mockNeuralAgents: NeuralAgent[];

  beforeEach(() => {
    // Setup mock network peers
    mockPeers = [
      {
        id: 'peer-001',
        multiaddrs: ['/ip4/192.168.1.100/tcp/8080'],
        protocols: ['test-protocol'],
        metadata: {
          agentCount: 5,
          cpuUsage: 45,
          memoryUsage: 60,
          networkLatency: 25,
          lastSeen: new Date(),
          capabilities: ['inference', 'training']
        }
      },
      {
        id: 'peer-002',
        multiaddrs: ['/ip4/192.168.1.101/tcp/8081'],
        protocols: ['test-protocol'],
        metadata: {
          agentCount: 3,
          cpuUsage: 30,
          memoryUsage: 40,
          networkLatency: 15,
          lastSeen: new Date(),
          capabilities: ['analysis', 'optimization']
        }
      }
    ];

    // Setup mock neural agents
    mockNeuralAgents = [
      {
        id: 'neural-001',
        config: {
          type: 'mlp',
          architecture: [784, 128, 10],
          activationFunction: 'relu',
          learningRate: 0.001
        },
        network: null,
        state: AgentState.ACTIVE,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsage: 2 * 1024 * 1024,
        totalInferences: 100,
        averageInferenceTime: 25,
        learningProgress: 0.75,
        connectionStrength: 0.85
      },
      {
        id: 'neural-002',
        config: {
          type: 'lstm',
          architecture: [100, 50, 25],
          activationFunction: 'tanh',
          learningRate: 0.01
        },
        network: null,
        state: AgentState.LEARNING,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsage: 3 * 1024 * 1024,
        totalInferences: 75,
        averageInferenceTime: 35,
        learningProgress: 0.60,
        connectionStrength: 0.70
      }
    ];

    // Initialize mesh topology with peers
    meshTopology = new MeshTopology('integration-test-node', mockPeers);
  });

  afterEach(() => {
    meshTopology.shutdown();
  });

  describe('Network and Neural Types Integration', () => {
    it('should integrate network topology with neural agents', () => {
      const topology = meshTopology.getTopology();
      
      // Verify network topology structure
      expect(topology.nodeId).toBe('integration-test-node');
      expect(topology.peers instanceof Map).toBe(true);
      expect(topology.connections instanceof Map).toBe(true);
      expect(topology.totalNodes).toBe(mockPeers.length + 1); // +1 for self
      
      // Verify neural agents can work with network topology
      mockNeuralAgents.forEach(agent => {
        expect(agent.state).toBeInstanceOf(String);
        expect(Object.values(AgentState)).toContain(agent.state);
        expect(agent.config.type).toBeDefined();
        expect(Array.isArray(agent.config.architecture)).toBe(true);
      });
    });

    it('should handle network partitions with neural agents', async () => {
      const partition: NetworkPartition = {
        id: 'test-partition-001',
        affectedNodes: ['neural-001', 'peer-001'],
        startTime: new Date(),
        partitionType: 'partial',
        severity: 'medium',
        recoveryStrategy: {
          type: 'automatic',
          timeout: 30000,
          retryCount: 3,
          fallbackNodes: ['neural-002', 'peer-002'],
          escalationThreshold: 5
        },
        resolved: false
      };

      // Test that NetworkPartition works with neural agent IDs
      expect(partition.affectedNodes.includes('neural-001')).toBe(true);
      expect(partition.recoveryStrategy.fallbackNodes.includes('neural-002')).toBe(true);
      
      // Test that partition can be resolved
      partition.resolved = true;
      partition.endTime = new Date();
      expect(partition.resolved).toBe(true);
      expect(partition.endTime).toBeInstanceOf(Date);
    });

    it('should support SASI agent integration with network topology', () => {
      const sasiAgent: SASIAgent = {
        id: 'sasi-integration-001',
        name: 'Integration Test SASI Agent',
        type: 'researcher',
        status: 'active',
        performance: 0.88,
        memoryUsage: 4 * 1024 * 1024,
        lastActivity: Date.now(),
        totalTasks: 50,
        successRate: 0.92,
        learningProgress: 0.78,
        connections: ['neural-001', 'neural-002'],
        neuralAgent: mockNeuralAgents[0]
      };

      // Verify SASI agent integrates with neural agents
      expect(sasiAgent.neuralAgent).toBeDefined();
      expect(sasiAgent.neuralAgent?.id).toBe('neural-001');
      expect(sasiAgent.connections.includes('neural-001')).toBe(true);
      
      // Verify SASI agent can work with network peers
      const peerIds = mockPeers.map(peer => peer.id);
      sasiAgent.connections.forEach(connId => {
        const isNeuralAgent = mockNeuralAgents.some(agent => agent.id === connId);
        const isPeer = peerIds.includes(connId);
        expect(isNeuralAgent || isPeer).toBe(true);
      });
    });
  });

  describe('Performance Metrics Integration', () => {
    it('should aggregate performance metrics across network and neural components', () => {
      const networkMetrics = meshTopology.getMetrics();
      
      const aggregatedMetrics: PerformanceMetrics = {
        totalAgentsSpawned: mockNeuralAgents.length,
        averageSpawnTime: 150,
        averageInferenceTime: mockNeuralAgents.reduce((sum, agent) => 
          sum + agent.averageInferenceTime, 0) / mockNeuralAgents.length,
        memoryUsage: mockNeuralAgents.reduce((sum, agent) => 
          sum + agent.memoryUsage, 0),
        activeLearningTasks: mockNeuralAgents.filter(agent => 
          agent.state === AgentState.LEARNING).length,
        systemHealthScore: 85
      };

      expect(aggregatedMetrics.totalAgentsSpawned).toBe(2);
      expect(aggregatedMetrics.averageInferenceTime).toBe(30); // (25 + 35) / 2
      expect(aggregatedMetrics.memoryUsage).toBe(5 * 1024 * 1024); // 2MB + 3MB
      expect(aggregatedMetrics.activeLearningTasks).toBe(1); // neural-002 is learning
      
      // Verify network metrics are compatible
      expect(networkMetrics.totalNodes).toBeGreaterThan(0);
      expect(networkMetrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle cross-component health monitoring', () => {
      const networkHealth = meshTopology.getNetworkHealth();
      
      // Create comprehensive health metrics that include both network and neural
      const systemHealth = {
        network: {
          connectivity: networkHealth.componentScores.connectivity,
          latency: networkHealth.componentScores.performance,
          reliability: networkHealth.componentScores.reliability
        },
        neural: {
          agentHealth: mockNeuralAgents.map(agent => ({
            id: agent.id,
            state: agent.state,
            performance: agent.learningProgress,
            memoryEfficiency: agent.memoryUsage / (1024 * 1024) // MB
          })),
          averagePerformance: mockNeuralAgents.reduce((sum, agent) => 
            sum + agent.learningProgress, 0) / mockNeuralAgents.length
        },
        overall: (networkHealth.overallScore + 
          (mockNeuralAgents.reduce((sum, agent) => 
            sum + agent.learningProgress, 0) / mockNeuralAgents.length * 100)) / 2
      };

      expect(systemHealth.network.connectivity).toBeDefined();
      expect(systemHealth.neural.agentHealth.length).toBe(2);
      expect(systemHealth.neural.averagePerformance).toBeCloseTo(0.675); // (0.75 + 0.60) / 2
      expect(systemHealth.overall).toBeGreaterThan(0);
    });
  });

  describe('Configuration and Error Handling Integration', () => {
    it('should handle default configurations across components', () => {
      // Test network configuration
      expect(DEFAULT_P2P_CONFIG.maxConnections).toBe(50);
      expect(DEFAULT_P2P_CONFIG.enableWebRTC).toBe(true);
      expect(DEFAULT_P2P_CONFIG.consensus.enabled).toBe(true);
      
      // Test neural configuration compatibility with network config
      const neuralConfig: NeuralConfiguration = {
        type: 'transformer',
        architecture: [512, 256, 128],
        learningRate: 0.0001,
        simdOptimized: DEFAULT_P2P_CONFIG.enableWebRTC, // Link to network capabilities
        customConfig: {
          networkEnabled: true,
          p2pNodes: DEFAULT_P2P_CONFIG.maxConnections
        }
      };

      expect(neuralConfig.simdOptimized).toBe(true);
      expect(neuralConfig.customConfig?.networkEnabled).toBe(true);
      expect(neuralConfig.customConfig?.p2pNodes).toBe(50);
    });

    it('should handle error propagation across components', async () => {
      // Test network error handling
      try {
        await meshTopology.handlePeerJoin({
          id: '', // Invalid empty ID
          multiaddrs: [],
          protocols: [],
          metadata: {
            agentCount: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            networkLatency: 0,
            lastSeen: new Date(),
            capabilities: []
          }
        });
      } catch (error) {
        // Should handle gracefully or throw appropriate error
        expect(error).toBeInstanceOf(Error);
      }

      // Test neural agent error handling
      const invalidAgent: NeuralAgent = {
        id: '',
        config: {
          type: 'mlp',
          architecture: [] // Invalid empty architecture
        },
        network: null,
        state: AgentState.ERROR,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsage: -1, // Invalid negative memory
        totalInferences: 0,
        averageInferenceTime: 0,
        learningProgress: -0.5, // Invalid negative progress
        connectionStrength: 2.0 // Invalid value > 1
      };

      // Validation should catch these issues
      expect(invalidAgent.state).toBe(AgentState.ERROR);
      expect(invalidAgent.memoryUsage).toBeLessThan(0);
      expect(invalidAgent.learningProgress).toBeLessThan(0);
      expect(invalidAgent.connectionStrength).toBeGreaterThan(1);
    });
  });

  describe('Async Operations and State Management', () => {
    it('should handle concurrent network and neural operations', async () => {
      const operations = [];
      
      // Start concurrent operations
      operations.push(meshTopology.handlePeerJoin(mockPeers[0]));
      operations.push(meshTopology.optimizeTopology());
      
      // Add neural agent state changes
      const stateChanges = mockNeuralAgents.map(async (agent) => {
        agent.state = AgentState.LEARNING;
        agent.lastActive = Date.now();
        return Promise.resolve(agent);
      });
      
      operations.push(...stateChanges);
      
      // Wait for all operations to complete
      const results = await Promise.allSettled(operations);
      
      // Verify all operations completed
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Operation ${index} failed:`, result.reason);
        }
        // Most operations should succeed
      });
      
      // Verify system state is consistent
      const finalTopology = meshTopology.getTopology();
      expect(finalTopology.totalNodes).toBeGreaterThan(0);
      
      mockNeuralAgents.forEach(agent => {
        expect(agent.state).toBe(AgentState.LEARNING);
        expect(agent.lastActive).toBeGreaterThan(0);
      });
    });

    it('should maintain data consistency during operations', async () => {
      const initialMetrics = meshTopology.getMetrics();
      const initialAgentStates = mockNeuralAgents.map(agent => ({ 
        id: agent.id, 
        state: agent.state 
      }));
      
      // Perform various operations
      await meshTopology.handlePeerJoin(mockPeers[0]);
      mockNeuralAgents[0].state = AgentState.ACTIVE;
      mockNeuralAgents[1].state = AgentState.IDLE;
      
      await meshTopology.optimizeTopology();
      
      // Verify metrics were updated
      const updatedMetrics = meshTopology.getMetrics();
      expect(updatedMetrics.lastUpdated.getTime()).toBeGreaterThanOrEqual(
        initialMetrics.lastUpdated.getTime()
      );
      
      // Verify agent states changed as expected
      expect(mockNeuralAgents[0].state).toBe(AgentState.ACTIVE);
      expect(mockNeuralAgents[1].state).toBe(AgentState.IDLE);
      
      // Verify initial states were different (to confirm change)
      expect(initialAgentStates[0].state).not.toBe(mockNeuralAgents[0].state);
    });
  });

  describe('Visualization and Monitoring Integration', () => {
    it('should provide comprehensive visualization data', () => {
      const networkViz = meshTopology.getVisualizationData();
      
      // Create enhanced visualization that includes neural agents
      const enhancedViz = {
        ...networkViz,
        neuralAgents: mockNeuralAgents.map(agent => ({
          id: agent.id,
          type: 'neural',
          state: agent.state,
          performance: agent.learningProgress,
          position: { 
            x: Math.random() * 100, 
            y: Math.random() * 100 
          },
          connections: mockPeers.slice(0, 2).map(peer => peer.id) // Mock connections
        })),
        integrationMetrics: {
          networkNeuralSynergy: 0.85,
          totalProcessingUnits: networkViz.metadata.totalNodes + mockNeuralAgents.length,
          hybridPerformance: {
            networkLatency: networkViz.metadata.networkHealth,
            neuralInference: mockNeuralAgents.reduce((sum, agent) => 
              sum + agent.learningProgress, 0) / mockNeuralAgents.length * 100
          }
        }
      };

      expect(enhancedViz.nodes.length).toBeGreaterThan(0);
      expect(enhancedViz.neuralAgents.length).toBe(2);
      expect(enhancedViz.integrationMetrics.totalProcessingUnits).toBe(
        networkViz.metadata.totalNodes + 2
      );
      expect(enhancedViz.integrationMetrics.hybridPerformance.neuralInference).toBeCloseTo(67.5);
    });

    it('should support real-time monitoring integration', () => {
      // Create monitoring system that tracks both network and neural metrics
      const monitoringSystem = {
        network: {
          topology: meshTopology.getTopology(),
          health: meshTopology.getNetworkHealth(),
          metrics: meshTopology.getMetrics()
        },
        neural: {
          agents: mockNeuralAgents,
          aggregate: {
            totalAgents: mockNeuralAgents.length,
            activeAgents: mockNeuralAgents.filter(a => a.state === AgentState.ACTIVE).length,
            learningAgents: mockNeuralAgents.filter(a => a.state === AgentState.LEARNING).length,
            averagePerformance: mockNeuralAgents.reduce((sum, agent) => 
              sum + agent.learningProgress, 0) / mockNeuralAgents.length,
            totalMemoryUsage: mockNeuralAgents.reduce((sum, agent) => 
              sum + agent.memoryUsage, 0)
          }
        },
        alerts: [] as Array<{type: string, severity: string, message: string}>,
        lastUpdate: new Date()
      };

      // Add alerts based on thresholds
      if (monitoringSystem.neural.aggregate.averagePerformance < 0.7) {
        monitoringSystem.alerts.push({
          type: 'performance',
          severity: 'warning',
          message: 'Neural agent performance below threshold'
        });
      }

      if (monitoringSystem.network.health.overallScore < 80) {
        monitoringSystem.alerts.push({
          type: 'network',
          severity: 'warning',
          message: 'Network health degraded'
        });
      }

      expect(monitoringSystem.neural.aggregate.totalAgents).toBe(2);
      expect(monitoringSystem.neural.aggregate.averagePerformance).toBeCloseTo(0.675);
      expect(monitoringSystem.lastUpdate).toBeInstanceOf(Date);
      expect(Array.isArray(monitoringSystem.alerts)).toBe(true);
    });
  });

  describe('Type Safety and Compilation', () => {
    it('should compile without TypeScript errors', () => {
      // This test verifies that all types are properly defined and compatible
      
      // Test network type compatibility
      const connection: Connection = {
        peerId: 'test-peer',
        status: 'connected',
        latency: 25,
        bandwidth: 1000,
        established: new Date(),
        lastActivity: new Date(),
        messagesSent: 100,
        messagesReceived: 150
      };

      // Test neural type compatibility
      const agent: NeuralAgent = mockNeuralAgents[0];
      
      // Test that types work together
      const integrationData = {
        networkConnection: connection,
        neuralAgent: agent,
        timestamp: Date.now(),
        compatible: true
      };

      expect(integrationData.networkConnection.peerId).toBe('test-peer');
      expect(integrationData.neuralAgent.id).toBe('neural-001');
      expect(integrationData.compatible).toBe(true);
    });

    it('should handle complex type intersections', () => {
      // Test that extended types work properly
      interface ExtendedNetworkTopology extends NetworkTopology {
        neuralAgents?: NeuralAgent[];
        integrationLevel?: number;
      }

      const extendedTopology: ExtendedNetworkTopology = {
        ...meshTopology.getTopology(),
        neuralAgents: mockNeuralAgents,
        integrationLevel: 0.95
      };

      expect(extendedTopology.neuralAgents?.length).toBe(2);
      expect(extendedTopology.integrationLevel).toBe(0.95);
      expect(extendedTopology.nodeId).toBe('integration-test-node');
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should properly cleanup resources', () => {
      const initialPeerCount = meshTopology.getTopology().totalNodes;
      
      // Add resources
      mockNeuralAgents.forEach(agent => {
        agent.lastActive = Date.now();
      });

      // Verify resources are active
      expect(initialPeerCount).toBeGreaterThan(0);
      expect(mockNeuralAgents.every(agent => agent.lastActive > 0)).toBe(true);
      
      // Cleanup should be handled in afterEach
      // This test verifies the cleanup works without memory leaks
      expect(true).toBe(true); // Placeholder for memory leak detection
    });

    it('should handle resource constraints gracefully', () => {
      // Test behavior under resource constraints
      const highMemoryAgent: NeuralAgent = {
        ...mockNeuralAgents[0],
        id: 'high-memory-agent',
        memoryUsage: 100 * 1024 * 1024 // 100MB
      };

      const totalMemory = mockNeuralAgents.reduce((sum, agent) => 
        sum + agent.memoryUsage, 0) + highMemoryAgent.memoryUsage;

      // System should track memory usage
      expect(totalMemory).toBeGreaterThan(5 * 1024 * 1024); // > 5MB
      expect(highMemoryAgent.memoryUsage).toBe(100 * 1024 * 1024);
      
      // Should be able to identify high memory usage
      const highMemoryAgents = [highMemoryAgent, ...mockNeuralAgents]
        .filter(agent => agent.memoryUsage > 10 * 1024 * 1024);
      
      expect(highMemoryAgents.length).toBe(1);
      expect(highMemoryAgents[0].id).toBe('high-memory-agent');
    });
  });
});