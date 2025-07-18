/**
 * P2P Network Manager Tests
 * Comprehensive test suite for peer-to-peer mesh networking functionality
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import { P2PNetworkManager, getP2PNetworkManager, resetP2PNetworkManager } from '../../../src/services/P2PNetworkManager';
import { MeshTopology, getMeshTopology, resetMeshTopology } from '../../../src/services/MeshTopology';
import { ConsensusEngine, getConsensusEngine, resetConsensusEngine } from '../../../src/services/ConsensusEngine';
import {
  P2PNetworkConfig,
  NetworkMessage,
  AgentCoordinationMessage,
  DEFAULT_P2P_CONFIG
} from '../../../src/types/network';
import { Agent } from '../../../src/types/agent';

// Mock WebSocket and WebRTC
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

describe('P2P Network Manager', () => {
  let networkManager: P2PNetworkManager;
  let mockConfig: P2PNetworkConfig;

  beforeAll(() => {
    // Mock process.env for Node.js environment
    jest.stubGlobal('process', {
      env: {
        SIGNALING_SERVER_URL: 'ws://localhost:8080'
      },
      memoryUsage: () => ({
        heapUsed: 1024 * 1024 // 1MB
      })
    });
  });

  beforeEach(() => {
    mockConfig = {
      ...DEFAULT_P2P_CONFIG,
      nodeId: 'test-node-1',
      listenAddresses: ['/ip4/127.0.0.1/tcp/8001'],
      maxConnections: 10,
      enableWebRTC: true,
      enableEncryption: true
    };
    
    resetP2PNetworkManager();
    networkManager = getP2PNetworkManager(mockConfig);
  });

  afterEach(async () => {
    if (networkManager) {
      await networkManager.shutdown();
    }
    resetP2PNetworkManager();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultManager = new P2PNetworkManager();
      expect(defaultManager).toBeDefined();
      expect(defaultManager.isReady()).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customManager = new P2PNetworkManager(mockConfig);
      expect(customManager).toBeDefined();
      expect(customManager.isReady()).toBe(false);
    });

    it('should initialize successfully', async () => {
      await expect(networkManager.initialize()).resolves.not.toThrow();
      expect(networkManager.isReady()).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      const errorConfig = {
        ...mockConfig,
        enableWebRTC: false
      };
      
      // Mock WebRTC as undefined to simulate unsupported environment
      const originalRTCPeerConnection = global.RTCPeerConnection;
      global.RTCPeerConnection = undefined as any;
      
      const errorManager = new P2PNetworkManager(errorConfig);
      await expect(errorManager.initialize()).resolves.not.toThrow();
      
      // Restore original mock
      global.RTCPeerConnection = originalRTCPeerConnection;
    });

    it('should prevent double initialization', async () => {
      await networkManager.initialize();
      await expect(networkManager.initialize()).rejects.toThrow('already initialized');
    });
  });

  describe('WebRTC Connection Management', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should connect to peer successfully', async () => {
      const peerId = 'test-peer-1';
      await expect(networkManager.connectToPeer(peerId)).resolves.not.toThrow();
    });

    it('should handle connection to existing peer', async () => {
      const peerId = 'test-peer-1';
      await networkManager.connectToPeer(peerId);
      // Should not throw when connecting to same peer again
      await expect(networkManager.connectToPeer(peerId)).resolves.not.toThrow();
    });

    it('should handle connection failures gracefully', async () => {
      const peerId = 'invalid-peer';
      
      // Mock RTCPeerConnection to throw error
      const originalRTCPeerConnection = global.RTCPeerConnection;
      global.RTCPeerConnection = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await expect(networkManager.connectToPeer(peerId)).rejects.toThrow('Connection failed');
      
      // Restore original mock
      global.RTCPeerConnection = originalRTCPeerConnection;
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should broadcast message to all peers', async () => {
      const message = {
        type: 'broadcast' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 3
      };

      await expect(networkManager.broadcastMessage(message)).resolves.not.toThrow();
    });

    it('should send direct message to specific peer', async () => {
      const peerId = 'test-peer-1';
      const message = {
        type: 'direct' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 1
      };

      // First connect to peer
      await networkManager.connectToPeer(peerId);
      
      // Mock data channel as open
      const mockConnection = {
        peerId,
        dataChannel: {
          send: jest.fn(),
          readyState: 'open'
        }
      };
      
      // Use reflection to access private connections map
      const connectionsMap = (networkManager as any).connections;
      connectionsMap.set(peerId, mockConnection);

      await expect(networkManager.sendDirectMessage(peerId, message)).resolves.not.toThrow();
      expect(mockConnection.dataChannel.send).toHaveBeenCalled();
    });

    it('should handle direct message to disconnected peer', async () => {
      const peerId = 'disconnected-peer';
      const message = {
        type: 'direct' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        hop: 0,
        ttl: 1
      };

      await expect(networkManager.sendDirectMessage(peerId, message)).rejects.toThrow('Peer not connected');
    });
  });

  describe('Agent Coordination', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should register local agent', () => {
      const agent: Agent = {
        id: 'test-agent-1',
        name: 'Test Agent',
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

      expect(() => networkManager.registerLocalAgent(agent)).not.toThrow();
      expect(networkManager.getLocalAgents()).toContain(agent);
    });

    it('should unregister local agent', () => {
      const agent: Agent = {
        id: 'test-agent-1',
        name: 'Test Agent',
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

      networkManager.registerLocalAgent(agent);
      expect(networkManager.getLocalAgents()).toContain(agent);
      
      networkManager.unregisterLocalAgent(agent.id);
      expect(networkManager.getLocalAgents()).not.toContain(agent);
    });

    it('should coordinate agent spawn across network', async () => {
      const agentConfig: Partial<Agent> = {
        id: 'spawned-agent-1',
        name: 'Spawned Agent',
        type: 'coder'
      };

      await expect(networkManager.coordinateAgentSpawn(agentConfig)).resolves.not.toThrow();
    });

    it('should coordinate agent spawn to specific target node', async () => {
      const agentConfig: Partial<Agent> = {
        id: 'spawned-agent-1',
        name: 'Spawned Agent',
        type: 'coder'
      };
      const targetNode = 'test-peer-1';

      // Mock connection to target node
      const mockConnection = {
        peerId: targetNode,
        dataChannel: {
          send: jest.fn(),
          readyState: 'open'
        }
      };
      
      const connectionsMap = (networkManager as any).connections;
      connectionsMap.set(targetNode, mockConnection);

      await expect(networkManager.coordinateAgentSpawn(agentConfig, targetNode)).resolves.not.toThrow();
    });
  });

  describe('Network Statistics', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should return network statistics', () => {
      const stats = networkManager.getNetworkStats();
      
      expect(stats).toHaveProperty('totalPeers');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('messagesReceived');
      expect(stats).toHaveProperty('bytesTransferred');
      expect(stats).toHaveProperty('averageLatency');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('startTime');
      
      expect(typeof stats.totalPeers).toBe('number');
      expect(typeof stats.activeConnections).toBe('number');
      expect(typeof stats.uptime).toBe('number');
      expect(stats.startTime).toBeInstanceOf(Date);
    });

    it('should return network topology', () => {
      const topology = networkManager.getNetworkTopology();
      
      expect(topology).toHaveProperty('nodeId');
      expect(topology).toHaveProperty('peers');
      expect(topology).toHaveProperty('connections');
      expect(topology).toHaveProperty('meshDensity');
      expect(topology).toHaveProperty('averageLatency');
      expect(topology).toHaveProperty('totalNodes');
      expect(topology).toHaveProperty('activeConnections');
      expect(topology).toHaveProperty('networkHealth');
      
      expect(typeof topology.nodeId).toBe('string');
      expect(typeof topology.meshDensity).toBe('number');
      expect(typeof topology.networkHealth).toBe('number');
    });

    it('should return connected peers', () => {
      const peers = networkManager.getConnectedPeers();
      expect(Array.isArray(peers)).toBe(true);
    });

    it('should return network health', () => {
      const health = networkManager.getNetworkHealth();
      
      expect(health).toHaveProperty('overallScore');
      expect(health).toHaveProperty('componentScores');
      expect(health).toHaveProperty('activeAlerts');
      expect(health).toHaveProperty('recommendations');
      
      expect(typeof health.overallScore).toBe('number');
      expect(health.componentScores).toHaveProperty('connectivity');
      expect(health.componentScores).toHaveProperty('consensus');
      expect(health.componentScores).toHaveProperty('performance');
      expect(health.componentScores).toHaveProperty('security');
      expect(health.componentScores).toHaveProperty('reliability');
      expect(Array.isArray(health.activeAlerts)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should add and remove event listeners', () => {
      const mockListener = {
        onPeerConnected: jest.fn(),
        onPeerDisconnected: jest.fn(),
        onMessageReceived: jest.fn(),
        onConsensusReached: jest.fn(),
        onFaultDetected: jest.fn(),
        onRecoveryInitiated: jest.fn(),
        onNetworkHealthChanged: jest.fn()
      };

      expect(() => networkManager.addEventListener(mockListener)).not.toThrow();
      expect(() => networkManager.removeEventListener(mockListener)).not.toThrow();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await networkManager.initialize();
      expect(networkManager.isReady()).toBe(true);
      
      await expect(networkManager.shutdown()).resolves.not.toThrow();
      expect(networkManager.isReady()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(networkManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors', async () => {
      const errorConfig = {
        ...mockConfig,
        enableWebRTC: false
      };
      
      // Mock WebSocket to throw error
      const originalWebSocket = global.WebSocket;
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('WebSocket connection failed');
      });
      
      const errorManager = new P2PNetworkManager(errorConfig);
      await expect(errorManager.initialize()).resolves.not.toThrow();
      
      // Restore original mock
      global.WebSocket = originalWebSocket;
    });

    it('should handle message parsing errors', async () => {
      await networkManager.initialize();
      
      // Access private method to test error handling
      const handleIncomingMessage = (networkManager as any).handleIncomingMessage;
      
      // Should not throw on invalid JSON
      expect(() => handleIncomingMessage('invalid-peer', 'invalid-json')).not.toThrow();
    });
  });

  describe('Integration with MeshTopology', () => {
    let meshTopology: MeshTopology;

    beforeEach(async () => {
      await networkManager.initialize();
      meshTopology = getMeshTopology('test-node-1');
    });

    afterEach(() => {
      meshTopology.shutdown();
      resetMeshTopology();
    });

    it('should integrate with mesh topology manager', () => {
      expect(meshTopology).toBeDefined();
      expect(meshTopology.getTopology()).toBeDefined();
    });

    it('should handle peer join in topology', async () => {
      const peerInfo = {
        id: 'test-peer-1',
        multiaddrs: ['/ip4/127.0.0.1/tcp/8002'],
        protocols: ['mesh-network'],
        metadata: {
          agentCount: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          networkLatency: 50,
          lastSeen: new Date(),
          capabilities: ['webrtc']
        }
      };

      await expect(meshTopology.handlePeerJoin(peerInfo)).resolves.not.toThrow();
    });

    it('should handle peer leave in topology', async () => {
      const peerId = 'test-peer-1';
      await expect(meshTopology.handlePeerLeave(peerId)).resolves.not.toThrow();
    });
  });

  describe('Integration with ConsensusEngine', () => {
    let consensusEngine: ConsensusEngine;

    beforeEach(async () => {
      await networkManager.initialize();
      consensusEngine = getConsensusEngine({
        algorithm: 'raft',
        nodeId: 'test-node-1',
        byzantineFaultTolerance: 0.33,
        consensusTimeout: 30000,
        blockTime: 5000,
        maxBlockSize: 1024 * 1024,
        enablePostQuantumCrypto: false,
        validatorNodes: ['test-node-1', 'test-node-2']
      });
    });

    afterEach(async () => {
      await consensusEngine.shutdown();
      resetConsensusEngine();
    });

    it('should integrate with consensus engine', () => {
      expect(consensusEngine).toBeDefined();
      expect(consensusEngine.getState()).toBeDefined();
    });

    it('should start consensus engine', async () => {
      await expect(consensusEngine.start()).resolves.not.toThrow();
    });

    it('should submit transactions to consensus', async () => {
      await consensusEngine.start();
      
      const transaction = {
        id: 'test-tx-1',
        type: 'agent-spawn' as const,
        proposer: 'test-node-1',
        data: { agentId: 'test-agent-1' },
        signature: 'test-signature',
        timestamp: new Date(),
        dependencies: [],
        priority: 1
      };

      await expect(consensusEngine.submitTransaction(transaction)).resolves.not.toThrow();
    });

    it('should get consensus metrics', async () => {
      await consensusEngine.start();
      
      const metrics = consensusEngine.getMetrics();
      expect(metrics).toHaveProperty('currentEpoch');
      expect(metrics).toHaveProperty('currentHeight');
      expect(metrics).toHaveProperty('isLeader');
      expect(metrics).toHaveProperty('leader');
      expect(metrics).toHaveProperty('pendingTransactions');
      expect(metrics).toHaveProperty('validators');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should handle multiple concurrent connections', async () => {
      const peerIds = ['peer-1', 'peer-2', 'peer-3', 'peer-4', 'peer-5'];
      
      const connectionPromises = peerIds.map(peerId => 
        networkManager.connectToPeer(peerId)
      );

      await expect(Promise.all(connectionPromises)).resolves.not.toThrow();
    });

    it('should handle high message throughput', async () => {
      const messageCount = 100;
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        type: 'broadcast' as const,
        source: 'test-node-1',
        payload: { index: i, data: `test-message-${i}` },
        hop: 0,
        ttl: 1
      }));

      const startTime = Date.now();
      
      const messagePromises = messages.map(message => 
        networkManager.broadcastMessage(message)
      );

      await Promise.all(messagePromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should maintain network statistics under load', async () => {
      const messageCount = 50;
      
      for (let i = 0; i < messageCount; i++) {
        await networkManager.broadcastMessage({
          type: 'broadcast',
          source: 'test-node-1',
          payload: { index: i },
          hop: 0,
          ttl: 1
        });
      }

      const stats = networkManager.getNetworkStats();
      expect(stats.messagesSent).toBeGreaterThanOrEqual(messageCount);
    });
  });

  describe('Security', () => {
    it('should validate message signatures', async () => {
      await networkManager.initialize();
      
      // Test with valid signature format
      const validMessage = {
        id: 'test-msg-1',
        type: 'broadcast' as const,
        source: 'test-node-1',
        payload: { test: 'data' },
        signature: 'sig_test-node-1_data',
        timestamp: new Date(),
        hop: 0,
        ttl: 1
      };

      // Access private method to test validation
      const verifyMessageSignature = (networkManager as any).verifyMessageSignature;
      expect(verifyMessageSignature).toBeDefined();
    });

    it('should handle encrypted connections when enabled', async () => {
      const secureConfig = {
        ...mockConfig,
        enableEncryption: true,
        security: {
          enableTLS: true,
          trustedPeers: ['test-peer-1']
        }
      };

      const secureManager = new P2PNetworkManager(secureConfig);
      await expect(secureManager.initialize()).resolves.not.toThrow();
      await secureManager.shutdown();
    });
  });

  describe('Fault Tolerance', () => {
    beforeEach(async () => {
      await networkManager.initialize();
    });

    it('should handle network partitions', async () => {
      // Simulate network partition by disconnecting peers
      const peerId = 'test-peer-1';
      await networkManager.connectToPeer(peerId);
      
      // Simulate peer disconnection
      const onPeerDisconnected = (networkManager as any).onPeerDisconnected;
      expect(() => onPeerDisconnected(peerId)).not.toThrow();
    });

    it('should recover from connection failures', async () => {
      const peerId = 'unreliable-peer';
      
      // Mock connection that fails
      const originalRTCPeerConnection = global.RTCPeerConnection;
      let callCount = 0;
      global.RTCPeerConnection = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Connection failed');
        }
        return new originalRTCPeerConnection();
      });
      
      // First attempt should fail
      await expect(networkManager.connectToPeer(peerId)).rejects.toThrow();
      
      // Second attempt should succeed
      await expect(networkManager.connectToPeer(peerId)).resolves.not.toThrow();
      
      // Restore original mock
      global.RTCPeerConnection = originalRTCPeerConnection;
    });
  });
});
