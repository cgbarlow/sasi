/**
 * P2P Mesh Integration Tests
 * End-to-end tests for P2P mesh networking integration with neural agents
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import { NeuralMeshService } from '../../src/services/NeuralMeshService';
import { P2PNetworkManager, getP2PNetworkManager, resetP2PNetworkManager } from '../../src/services/P2PNetworkManager';
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
  let p2pManager: P2PNetworkManager;
  let secondaryP2PManager: P2PNetworkManager;

  beforeAll(() => {
    // Mock process.env for Node.js environment
    Object.defineProperty(global, 'process', {
      value: {
        env: {
          SIGNALING_SERVER_URL: 'ws://localhost:8080'
        },
        memoryUsage: () => ({
          heapUsed: 1024 * 1024 // 1MB
        }),
        cwd: () => '/test/directory'
      },
      writable: true
    });
  });

  beforeEach(async () => {
    // Reset P2P managers before each test
    resetP2PNetworkManager();
    
    // Create P2P network managers directly
    p2pManager = getP2PNetworkManager({
      nodeId: 'test-node-1',
      maxConnections: 5,
      enableWebRTC: true,
      enableEncryption: true
    });
    
    secondaryP2PManager = new P2PNetworkManager({
      nodeId: 'test-node-2',
      maxConnections: 5,
      enableWebRTC: true,
      enableEncryption: true
    });

    // Create neural mesh services with basic config for testing
    neuralMeshService = new NeuralMeshService({
      transport: 'websocket',
      enableWasm: true,
      enableRealtime: true,
      debugMode: true
    });

    secondaryService = new NeuralMeshService({
      transport: 'websocket',
      enableWasm: true,
      enableRealtime: true,
      debugMode: true
    });
  });

  afterEach(async () => {
    if (neuralMeshService) {
      await neuralMeshService.shutdown();
    }
    if (secondaryService) {
      await secondaryService.shutdown();
    }
    if (p2pManager) {
      await p2pManager.shutdown();
    }
    if (secondaryP2PManager) {
      await secondaryP2PManager.shutdown();
    }
    resetP2PNetworkManager();
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with P2P networking enabled', async () => {
      await expect(neuralMeshService.initialize()).resolves.toBe(true);
      await expect(p2pManager.initialize()).resolves.not.toThrow();
      expect(p2pManager.isReady()).toBe(true);
    });

    it('should initialize multiple services for mesh network', async () => {
      await expect(neuralMeshService.initialize()).resolves.toBe(true);
      await expect(secondaryService.initialize()).resolves.toBe(true);
      await expect(p2pManager.initialize()).resolves.not.toThrow();
      await expect(secondaryP2PManager.initialize()).resolves.not.toThrow();
      
      expect(p2pManager.isReady()).toBe(true);
      expect(secondaryP2PManager.isReady()).toBe(true);
    });

    it('should handle P2P disabled mode', async () => {
      const nonP2PService = new NeuralMeshService({
        transport: 'websocket',
        enableWasm: false,
        debugMode: true
      });
      
      await expect(nonP2PService.initialize()).resolves.toBe(true);
      
      await nonP2PService.shutdown();
    });
  });

  describe('Network Topology', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should get network topology', () => {
      const topology = p2pManager.getNetworkTopology();
      expect(topology).toBeDefined();
      expect(topology.nodeId).toBeDefined();
      expect(topology.totalNodes).toBeGreaterThan(0);
    });

    it('should get network health', () => {
      const health = p2pManager.getNetworkHealth();
      expect(health).toBeDefined();
      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(health.componentScores).toBeDefined();
    });

    it('should get connected peers', () => {
      const peers = p2pManager.getConnectedPeers();
      expect(peers).toBeDefined();
      expect(Array.isArray(peers)).toBe(true);
    });

    it('should get network statistics', () => {
      const stats = p2pManager.getNetworkStats();
      expect(stats).toBeDefined();
      expect(stats.totalPeers).toBeDefined();
      expect(stats.activeConnections).toBeDefined();
    });
  });

  describe('Distributed Agent Management', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should register and manage local agents', async () => {
      const agent: Agent = {
        id: 'test-agent-1',
        name: 'Test Distributed Agent',
        type: 'researcher',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 0,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };

      p2pManager.registerLocalAgent(agent);
      const localAgents = p2pManager.getLocalAgents();
      
      expect(localAgents).toBeDefined();
      expect(localAgents.some(a => a.id === agent.id)).toBe(true);
    });

    it('should coordinate agent spawn across network', async () => {
      const agentConfig: Partial<Agent> = {
        id: 'test-agent-2',
        name: 'Targeted Agent',
        type: 'coder'
      };

      await expect(p2pManager.coordinateAgentSpawn(agentConfig, 'test-node-2')).resolves.not.toThrow();
    });

    it('should unregister local agents', async () => {
      const agent: Agent = {
        id: 'test-agent-3',
        name: 'Listed Agent',
        type: 'tester',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 0,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };

      p2pManager.registerLocalAgent(agent);
      expect(p2pManager.getLocalAgents().some(a => a.id === agent.id)).toBe(true);
      
      p2pManager.unregisterLocalAgent(agent.id);
      expect(p2pManager.getLocalAgents().some(a => a.id === agent.id)).toBe(false);
    });
  });

  describe('Agent Coordination', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await secondaryService.initialize();
      await p2pManager.initialize();
      await secondaryP2PManager.initialize();
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
            type: 'neural'
          }
        },
        priority: 'high'
      };

      // Test agent coordination through P2P manager
      await expect(p2pManager.coordinateAgentSpawn(coordination.payload.agentConfig!)).resolves.not.toThrow();
    });

    it('should handle agent termination coordination', async () => {
      // Create and register an agent
      const agent: Agent = {
        id: 'termination-test-agent',
        name: 'Termination Test Agent',
        type: 'worker',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 0,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };

      p2pManager.registerLocalAgent(agent);
      expect(p2pManager.getLocalAgents().some(a => a.id === agent.id)).toBe(true);
      
      // Simulate termination
      p2pManager.unregisterLocalAgent(agent.id);
      expect(p2pManager.getLocalAgents().some(a => a.id === agent.id)).toBe(false);
    });

    it('should handle task assignment coordination', async () => {
      const agentConfig: Partial<Agent> = {
        id: 'task-assignment-agent',
        name: 'Task Assignment Agent',
        type: 'researcher'
      };

      await expect(p2pManager.coordinateAgentSpawn(agentConfig)).resolves.not.toThrow();
    });

    it('should handle agent status updates', async () => {
      const agent: Agent = {
        id: 'status-update-agent',
        name: 'Status Update Agent',
        type: 'coder',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 75,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };

      p2pManager.registerLocalAgent(agent);
      const agents = p2pManager.getLocalAgents();
      const registeredAgent = agents.find(a => a.id === agent.id);
      
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent?.progress).toBe(75);
    });

    it('should handle resource management', async () => {
      const stats = p2pManager.getNetworkStats();
      expect(stats).toBeDefined();
      expect(stats.totalPeers).toBeGreaterThanOrEqual(0);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Message Routing', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should broadcast messages to network', async () => {
      const message = {
        type: 'broadcast' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 3
      };

      await expect(p2pManager.broadcastMessage(message)).resolves.not.toThrow();
    });

    it('should track message statistics', async () => {
      const message = {
        type: 'broadcast' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 1
      };

      const initialStats = p2pManager.getNetworkStats();
      await p2pManager.broadcastMessage(message);
      const finalStats = p2pManager.getNetworkStats();
      
      // Stats should be maintained (even if no actual messages sent due to no connections)
      expect(finalStats).toBeDefined();
      expect(finalStats.messagesSent).toBeGreaterThanOrEqual(initialStats.messagesSent);
    });

    it('should handle peer connections', async () => {
      const peerId = 'test-peer-1';
      await expect(p2pManager.connectToPeer(peerId)).resolves.not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should track performance metrics', () => {
      const stats = p2pManager.getNetworkStats();
      expect(stats).toBeDefined();
      expect(stats.totalPeers).toBeDefined();
      expect(stats.activeConnections).toBeDefined();
      expect(stats.messagesSent).toBeDefined();
      expect(stats.messagesReceived).toBeDefined();
      expect(stats.uptime).toBeDefined();
    });

    it('should calculate network health metrics', () => {
      const health = p2pManager.getNetworkHealth();
      expect(health).toBeDefined();
      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(health.overallScore).toBeLessThanOrEqual(100);
      expect(health.componentScores).toBeDefined();
      expect(health.activeAlerts).toBeDefined();
      expect(health.recommendations).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should handle event listeners', () => {
      const mockListener = {
        onPeerConnected: jest.fn(),
        onPeerDisconnected: jest.fn(),
        onMessageReceived: jest.fn(),
        onConsensusReached: jest.fn(),
        onFaultDetected: jest.fn(),
        onRecoveryInitiated: jest.fn(),
        onNetworkHealthChanged: jest.fn()
      };

      expect(() => p2pManager.addEventListener(mockListener)).not.toThrow();
      expect(() => p2pManager.removeEventListener(mockListener)).not.toThrow();
    });

    it('should track agent operations', async () => {
      const agent: Agent = {
        id: 'event-test-agent',
        name: 'Event Test Agent',
        type: 'tester',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 0,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };

      const initialAgentCount = p2pManager.getLocalAgents().length;
      p2pManager.registerLocalAgent(agent);
      const finalAgentCount = p2pManager.getLocalAgents().length;
      
      expect(finalAgentCount).toBe(initialAgentCount + 1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
    });

    it('should handle connection errors gracefully', async () => {
      const invalidPeerId = 'invalid-peer';
      
      // Mock RTCPeerConnection to throw error for this test
      const originalRTCPeerConnection = global.RTCPeerConnection;
      global.RTCPeerConnection = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await expect(p2pManager.connectToPeer(invalidPeerId)).rejects.toThrow();
      
      // Restore original mock
      global.RTCPeerConnection = originalRTCPeerConnection;
    });

    it('should handle invalid agent configurations', () => {
      // Test with undefined agent
      expect(() => p2pManager.registerLocalAgent(undefined as any)).toThrow();
    });

    it('should handle message failures gracefully', async () => {
      const peerId = 'disconnected-peer';
      const message = {
        type: 'direct' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 1
      };

      // Should throw error when trying to send to non-connected peer
      await expect(p2pManager.sendDirectMessage(peerId, message)).rejects.toThrow();
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await neuralMeshService.initialize();
      await p2pManager.initialize();
      
      // Register some agents
      const agent: Agent = {
        id: 'cleanup-test-agent-1',
        name: 'Cleanup Test Agent 1',
        type: 'worker',
        status: 'active',
        currentTask: 'test task',
        repository: 'test-repo',
        branch: 'main',
        completedTasks: 0,
        efficiency: 100,
        progress: 0,
        position: { x: 0, y: 0, z: 0 },
        owner: 'test-owner',
        neuralId: 'neural-1'
      };
      
      p2pManager.registerLocalAgent(agent);
      expect(p2pManager.getLocalAgents().length).toBeGreaterThan(0);
      
      // Should shutdown without throwing
      await expect(neuralMeshService.shutdown()).resolves.not.toThrow();
      await expect(p2pManager.shutdown()).resolves.not.toThrow();
      
      // Should be cleaned up
      expect(p2pManager.isReady()).toBe(false);
    });
  });


});
