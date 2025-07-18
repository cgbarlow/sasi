/**
 * P2P Mesh Integration Tests
 * End-to-end tests for P2P mesh networking integration with neural agents
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { NeuralMeshService } from '../../src/services/NeuralMeshService';
import { P2PNetworkManager } from '../../src/services/P2PNetworkManager';
import { MeshTopology } from '../../src/services/MeshTopology';
import { ConsensusEngine } from '../../src/services/ConsensusEngine';
import { Agent } from '../../src/types/agent';
import { AgentCoordinationMessage } from '../../src/types/network';

// Mock WebRTC and WebSocket for testing  
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({}),
  createAnswer: jest.fn().mockResolvedValue({}),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  close: jest.fn(),
  createDataChannel: jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    readyState: 'open'
  }),
  connectionState: 'connected',
  iceConnectionState: 'connected',
  signalingState: 'stable',
  onicecandidate: null,
  onconnectionstatechange: null,
  ondatachannel: null
}));

describe('P2P Mesh Integration', () => {
  let neuralMeshService: NeuralMeshService;
  let secondaryService: NeuralMeshService;

  beforeAll(() => {
    // Mock process.env for Node.js environment
    vi.stubGlobal('process', {
      env: {
        SIGNALING_SERVER_URL: 'ws://localhost:8080'
      },
      memoryUsage: () => ({
        heapUsed: 1024 * 1024 // 1MB
      })
    });
  });

  beforeEach(async () => {
    // Create primary neural mesh service with P2P enabled
    neuralMeshService = new NeuralMeshService({
      enableP2P: true,
      enableConsensus: true,
      debugMode: true,
      maxNetworkNodes: 10,
      p2pConfig: {
        nodeId: 'test-node-1',
        maxConnections: 5,
        enableWebRTC: true,
        enableEncryption: true
      }
    });

    // Create secondary service to simulate peer network
    secondaryService = new NeuralMeshService({
      enableP2P: true,
      enableConsensus: true,
      debugMode: true,
      maxNetworkNodes: 10,
      p2pConfig: {
        nodeId: 'test-node-2',
        maxConnections: 5,
        enableWebRTC: true,
        enableEncryption: true
      }
    });
  });

  afterEach(async () => {
    if (neuralMeshService) {
      await neuralMeshService.shutdown();
    }
    if (secondaryService) {
      await secondaryService.shutdown();
    }
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with P2P networking enabled', async () => {
      await expect(neuralMeshService.initialize()).resolves.toBe(true);
      expect(neuralMeshService.isP2PEnabled()).toBe(true);
      expect(neuralMeshService.isConsensusEnabled()).toBe(true);
    });

    it('should initialize multiple services for mesh network', async () => {
      await expect(neuralMeshService.initialize()).resolves.toBe(true);
      await expect(secondaryService.initialize()).resolves.toBe(true);
      
      expect(neuralMeshService.isP2PEnabled()).toBe(true);
      expect(secondaryService.isP2PEnabled()).toBe(true);
    });

    it('should handle P2P disabled mode', async () => {
      const nonP2PService = new NeuralMeshService({
        enableP2P: false,
        debugMode: true
      });
      
      await expect(nonP2PService.initialize()).resolves.toBe(true);
      expect(nonP2PService.isP2PEnabled()).toBe(false);
      expect(nonP2PService.isConsensusEnabled()).toBe(false);
      
      await nonP2PService.shutdown();
    });
  });

  describe('Network Topology', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should get network topology', () => {
      const topology = neuralMeshService.getNetworkTopology();
      expect(topology).toBeDefined();
      expect(topology?.nodeId).toBeDefined();
      expect(topology?.totalNodes).toBeGreaterThan(0);
    });

    it('should get network health', () => {
      const health = neuralMeshService.getNetworkHealth();
      expect(health).toBeDefined();
      expect(health?.overallScore).toBeGreaterThanOrEqual(0);
      expect(health?.componentScores).toBeDefined();
    });

    it('should optimize network topology', async () => {
      await expect(neuralMeshService.optimizeNetworkTopology()).resolves.not.toThrow();
    });

    it('should get network visualization data', () => {
      const visualization = neuralMeshService.getNetworkVisualization();
      expect(visualization).toBeDefined();
      expect(visualization?.nodes).toBeDefined();
      expect(visualization?.edges).toBeDefined();
    });
  });

  describe('Distributed Agent Management', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should spawn distributed agent', async () => {
      const agentConfig = {
        id: 'test-agent-1',
        name: 'Test Distributed Agent',
        type: 'researcher' as const,
        capabilities: ['research', 'analysis']
      };

      const agent = await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBe(agentConfig.id);
      expect(agent.name).toBe(agentConfig.name);
      expect(agent.type).toBe(agentConfig.type);
      expect(agent.capabilities).toContain('p2p-distributed');
    });

    it('should spawn distributed agent on specific target node', async () => {
      const agentConfig = {
        id: 'test-agent-2',
        name: 'Targeted Agent',
        type: 'coder' as const
      };

      const agent = await neuralMeshService.spawnDistributedAgent(agentConfig, 'test-node-2');
      
      expect(agent).toBeDefined();
      expect(agent.id).toBe(agentConfig.id);
      expect(agent.capabilities).toContain('p2p-distributed');
    });

    it('should get distributed agents', async () => {
      const agentConfig = {
        id: 'test-agent-3',
        name: 'Listed Agent',
        type: 'tester' as const
      };

      await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      const distributedAgents = neuralMeshService.getDistributedAgents();
      expect(distributedAgents).toBeDefined();
      expect(distributedAgents.length).toBeGreaterThan(0);
      expect(distributedAgents.some(agent => agent.id === agentConfig.id)).toBe(true);
    });
  });

  describe('Agent Coordination', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await secondaryService.initialize();
    });

    it('should handle agent coordination messages', async () => {
      const coordination: AgentCoordinationMessage = {
        type: 'spawn',
        agentId: 'remote-agent-1',
        sourceNode: 'test-node-2',
        payload: {
          agentConfig: {
            id: 'remote-agent-1',
            name: 'Remote Agent',
            type: 'neural',
            capabilities: ['remote-processing']
          }
        },
        priority: 'high'
      };

      // Simulate receiving coordination message
      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });

    it('should handle agent termination coordination', async () => {
      // First spawn an agent
      const agentConfig = {
        id: 'termination-test-agent',
        name: 'Termination Test Agent',
        type: 'worker' as const
      };

      await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      // Then simulate termination coordination
      const coordination: AgentCoordinationMessage = {
        type: 'terminate',
        agentId: 'termination-test-agent',
        sourceNode: 'test-node-2',
        payload: {},
        priority: 'medium'
      };

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });

    it('should handle task assignment coordination', async () => {
      // First spawn an agent
      const agentConfig = {
        id: 'task-assignment-agent',
        name: 'Task Assignment Agent',
        type: 'researcher' as const
      };

      await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      // Then simulate task assignment
      const coordination: AgentCoordinationMessage = {
        type: 'task-assign',
        agentId: 'task-assignment-agent',
        sourceNode: 'test-node-2',
        payload: {
          taskData: {
            description: 'Analyze network topology',
            priority: 'high',
            deadline: new Date(Date.now() + 3600000) // 1 hour
          }
        },
        priority: 'high'
      };

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });

    it('should handle status update coordination', async () => {
      // First spawn an agent
      const agentConfig = {
        id: 'status-update-agent',
        name: 'Status Update Agent',
        type: 'coder' as const
      };

      await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      // Then simulate status update
      const coordination: AgentCoordinationMessage = {
        type: 'status-update',
        agentId: 'status-update-agent',
        sourceNode: 'test-node-2',
        payload: {
          status: {
            agentId: 'status-update-agent',
            nodeId: 'test-node-2',
            status: 'active',
            progress: 75,
            resourceUsage: {
              cpu: 45,
              memory: 60,
              networkIO: 25
            },
            lastActivity: new Date()
          }
        },
        priority: 'low'
      };

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });

    it('should handle resource request coordination', async () => {
      const coordination: AgentCoordinationMessage = {
        type: 'resource-request',
        agentId: 'resource-requester',
        sourceNode: 'test-node-2',
        payload: {
          resourceRequirements: {
            cpu: 2,
            memory: 4096,
            storage: 1024,
            networkBandwidth: 100,
            gpuRequired: false,
            wasmSupport: true
          }
        },
        priority: 'medium'
      };

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });
  });

  describe('Neural Network Synchronization', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should broadcast neural inference across network', async () => {
      const inputData = new Float32Array([1.0, 2.0, 3.0, 4.0]);
      const modelId = 'test-model-1';

      const result = await neuralMeshService.broadcastNeuralInference(inputData, modelId);
      
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should sync neural weights across network', async () => {
      const agentId = 'sync-test-agent';
      const weights = new ArrayBuffer(1024); // 1KB of weights
      
      // Fill weights with test data
      const view = new Uint8Array(weights);
      for (let i = 0; i < view.length; i++) {
        view[i] = i % 256;
      }

      await expect(neuralMeshService.syncNeuralWeights(agentId, weights)).resolves.not.toThrow();
    });

    it('should handle neural sync messages', async () => {
      const syncData = {
        type: 'weight-sync',
        agentId: 'sync-agent-1',
        weights: Array.from(new Uint8Array([1, 2, 3, 4, 5])),
        timestamp: Date.now(),
        nodeId: 'test-node-2'
      };

      const handleNeuralSync = (neuralMeshService as any).handleNeuralSync;
      expect(() => handleNeuralSync.call(neuralMeshService, syncData)).not.toThrow();
    });
  });

  describe('Consensus Integration', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should get consensus state', () => {
      const consensusState = neuralMeshService.getConsensusState();
      expect(consensusState).toBeDefined();
      expect(consensusState?.epoch).toBeDefined();
    });

    it('should handle consensus messages', async () => {
      const consensusData = {
        id: 'test-consensus-1',
        type: 'proposal',
        epoch: 1,
        proposer: 'test-node-2',
        data: { test: 'data' },
        signature: 'test-signature',
        timestamp: new Date()
      };

      const handleConsensusMessage = (neuralMeshService as any).handleConsensusMessage;
      expect(() => handleConsensusMessage.call(neuralMeshService, consensusData)).not.toThrow();
    });
  });

  describe('Performance and Statistics', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should get P2P network statistics', () => {
      const stats = neuralMeshService.getP2PStats();
      expect(stats).toBeDefined();
      expect(stats?.totalPeers).toBeDefined();
      expect(stats?.activeConnections).toBeDefined();
      expect(stats?.messagesSent).toBeDefined();
      expect(stats?.messagesReceived).toBeDefined();
    });

    it('should track distributed agent performance', async () => {
      const agentConfig = {
        id: 'performance-test-agent',
        name: 'Performance Test Agent',
        type: 'neural' as const,
        capabilities: ['performance-testing']
      };

      const startTime = Date.now();
      const agent = await neuralMeshService.spawnDistributedAgent(agentConfig);
      const endTime = Date.now();
      
      expect(agent).toBeDefined();
      expect(agent.wasmMetrics).toBeDefined();
      expect(agent.wasmMetrics.executionTime).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle high throughput agent operations', async () => {
      const agentPromises = [];
      const agentCount = 10;
      
      for (let i = 0; i < agentCount; i++) {
        agentPromises.push(
          neuralMeshService.spawnDistributedAgent({
            id: `throughput-agent-${i}`,
            name: `Throughput Agent ${i}`,
            type: 'worker' as const
          })
        );
      }

      const agents = await Promise.all(agentPromises);
      
      expect(agents).toHaveLength(agentCount);
      expect(agents.every(agent => agent.capabilities.includes('p2p-distributed'))).toBe(true);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should emit events for distributed agent operations', async () => {
      const events: any[] = [];
      
      neuralMeshService.on('agent-spawned', (data) => {
        events.push({ type: 'agent-spawned', data });
      });
      
      neuralMeshService.on('peer-connected', (data) => {
        events.push({ type: 'peer-connected', data });
      });
      
      neuralMeshService.on('network-health-changed', (data) => {
        events.push({ type: 'network-health-changed', data });
      });

      const agentConfig = {
        id: 'event-test-agent',
        name: 'Event Test Agent',
        type: 'tester' as const
      };

      await neuralMeshService.spawnDistributedAgent(agentConfig);
      
      // Should have emitted agent-spawned event
      expect(events.some(e => e.type === 'agent-spawned')).toBe(true);
    });

    it('should handle consensus events', async () => {
      const consensusEvents: any[] = [];
      
      neuralMeshService.on('consensus-reached', (data) => {
        consensusEvents.push({ type: 'consensus-reached', data });
      });

      // Simulate consensus event
      const emit = (neuralMeshService as any).emit;
      emit.call(neuralMeshService, 'consensus-reached', { result: 'test-consensus' });
      
      expect(consensusEvents).toHaveLength(1);
      expect(consensusEvents[0].data.result).toBe('test-consensus');
    });

    it('should handle fault detection events', async () => {
      const faultEvents: any[] = [];
      
      neuralMeshService.on('fault-detected', (data) => {
        faultEvents.push({ type: 'fault-detected', data });
      });

      // Simulate fault detection
      const emit = (neuralMeshService as any).emit;
      emit.call(neuralMeshService, 'fault-detected', { 
        type: 'node-failure',
        affectedNodes: ['test-node-2'],
        severity: 'high'
      });
      
      expect(faultEvents).toHaveLength(1);
      expect(faultEvents[0].data.type).toBe('node-failure');
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should handle P2P network failures gracefully', async () => {
      // Simulate network failure by shutting down P2P manager
      const p2pManager = (neuralMeshService as any).p2pManager;
      if (p2pManager) {
        await p2pManager.shutdown();
      }

      // Should still be able to spawn agents locally
      const agentConfig = {
        id: 'resilience-test-agent',
        name: 'Resilience Test Agent',
        type: 'neural' as const
      };

      const agent = await neuralMeshService.spawnDistributedAgent(agentConfig);
      expect(agent).toBeDefined();
    });

    it('should handle invalid coordination messages', async () => {
      const invalidCoordination = {
        type: 'invalid-type',
        agentId: 'invalid-agent',
        sourceNode: 'invalid-node',
        payload: {},
        priority: 'high'
      } as any;

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, invalidCoordination)).resolves.not.toThrow();
    });

    it('should handle resource unavailability', async () => {
      const coordination: AgentCoordinationMessage = {
        type: 'resource-request',
        agentId: 'resource-unavailable-test',
        sourceNode: 'test-node-2',
        payload: {
          resourceRequirements: {
            cpu: 1000, // Unreasonably high
            memory: 1024 * 1024, // 1TB
            storage: 1024 * 1024 * 1024, // 1PB
            networkBandwidth: 10000,
            gpuRequired: true,
            wasmSupport: true
          }
        },
        priority: 'high'
      };

      const handleAgentCoordination = (neuralMeshService as any).handleAgentCoordination;
      await expect(handleAgentCoordination.call(neuralMeshService, coordination)).resolves.not.toThrow();
    });
  });

  describe('Integration with Existing Features', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
    });

    it('should integrate with existing neural mesh features', async () => {
      // Test that existing features still work with P2P enabled
      const agentConfig = {
        id: 'integration-test-agent',
        name: 'Integration Test Agent',
        type: 'neural' as const,
        neuralProperties: {
          neuronId: 'test-neuron-1',
          meshId: 'test-mesh',
          nodeType: 'inter' as const,
          layer: 2,
          threshold: 0.7,
          activation: 0.5,
          connections: [],
          spikeHistory: []
        }
      };

      const agent = await neuralMeshService.createNeuralAgent(agentConfig);
      expect(agent).toBeDefined();
      expect(agent.neuralProperties.neuronId).toBe('test-neuron-1');
      expect(agent.neuralProperties.nodeType).toBe('inter');
    });

    it('should maintain WASM acceleration compatibility', async () => {
      expect(neuralMeshService.isWasmEnabled()).toBe(true);
      
      const inputData = new Float32Array([1.0, 2.0, 3.0, 4.0]);
      const result = await neuralMeshService.processInference(inputData);
      
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should maintain connection status reporting', () => {
      const connection = neuralMeshService.getConnectionStatus();
      expect(connection).toBeDefined();
      expect(connection?.status).toBe('connected');
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await neuralMeshService.initialize();
      
      // Spawn some agents
      await neuralMeshService.spawnDistributedAgent({
        id: 'cleanup-test-agent-1',
        name: 'Cleanup Test Agent 1',
        type: 'worker' as const
      });
      
      await neuralMeshService.spawnDistributedAgent({
        id: 'cleanup-test-agent-2',
        name: 'Cleanup Test Agent 2',
        type: 'researcher' as const
      });
      
      // Should shutdown without throwing
      await expect(neuralMeshService.shutdown()).resolves.not.toThrow();
      
      // Should clean up properly
      expect(neuralMeshService.getDistributedAgents()).toHaveLength(0);
      expect(neuralMeshService.isP2PEnabled()).toBe(false);
    });

    it('should handle shutdown with active P2P connections', async () => {
      await neuralMeshService.initialize();
      await secondaryService.initialize();
      
      // Simulate some P2P activity
      await neuralMeshService.spawnDistributedAgent({
        id: 'shutdown-test-agent',
        name: 'Shutdown Test Agent',
        type: 'coder' as const
      });
      
      // Both should shutdown gracefully
      await expect(neuralMeshService.shutdown()).resolves.not.toThrow();
      await expect(secondaryService.shutdown()).resolves.not.toThrow();
    });
  });
});
