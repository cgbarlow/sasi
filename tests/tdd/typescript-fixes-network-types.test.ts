/**
 * TDD Tests for TypeScript Fixes - Network Types
 * Testing NetworkPartition interface compatibility and network type exports
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  NetworkPartition,
  NetworkTopology,
  PeerInfo,
  Connection,
  NetworkMessage,
  NetworkHealth,
  NetworkMetrics,
  FaultDetection,
  RecoveryStrategy,
  NetworkVisualizationData,
  P2PNetworkError,
  ConsensusError,
  WebRTCError,
  DEFAULT_P2P_CONFIG,
  P2PNetworkConfig
} from '../../src/types/network';
import { MeshTopology, TopologyAlgorithm, RoutingStrategy } from '../../src/services/MeshTopology';

describe('Network Types TypeScript Compatibility', () => {
  let meshTopology: MeshTopology;
  let mockPeerInfo: PeerInfo;
  let mockConnection: Connection;
  let mockNetworkPartition: NetworkPartition;

  beforeEach(() => {
    // Setup mock PeerInfo
    mockPeerInfo = {
      id: 'test-peer-001',
      multiaddrs: ['/ip4/127.0.0.1/tcp/8080'],
      protocols: ['test-protocol'],
      metadata: {
        agentCount: 5,
        cpuUsage: 45.5,
        memoryUsage: 67.2,
        networkLatency: 25,
        lastSeen: new Date(),
        capabilities: ['inference', 'training']
      }
    };

    // Setup mock Connection
    mockConnection = {
      peerId: 'test-peer-001',
      status: 'connected',
      latency: 25,
      bandwidth: 1000,
      established: new Date(),
      lastActivity: new Date(),
      messagesSent: 150,
      messagesReceived: 200
    };

    // Setup mock NetworkPartition
    mockNetworkPartition = {
      id: 'partition-001',
      affectedNodes: ['node1', 'node2'],
      startTime: new Date(),
      endTime: undefined,
      partitionType: 'partial',
      severity: 'medium',
      recoveryStrategy: {
        type: 'automatic',
        timeout: 30000,
        retryCount: 3,
        fallbackNodes: ['fallback1'],
        escalationThreshold: 5
      },
      resolved: false
    };

    // Initialize MeshTopology
    meshTopology = new MeshTopology('test-node', [mockPeerInfo]);
  });

  afterEach(() => {
    meshTopology.shutdown();
  });

  describe('NetworkPartition Interface Compatibility', () => {
    it('should create NetworkPartition with all required properties', () => {
      expect(mockNetworkPartition.id).toBe('partition-001');
      expect(mockNetworkPartition.affectedNodes).toEqual(['node1', 'node2']);
      expect(mockNetworkPartition.startTime).toBeInstanceOf(Date);
      expect(mockNetworkPartition.partitionType).toBe('partial');
      expect(mockNetworkPartition.severity).toBe('medium');
      expect(mockNetworkPartition.resolved).toBe(false);
    });

    it('should have valid RecoveryStrategy properties', () => {
      const strategy = mockNetworkPartition.recoveryStrategy;
      expect(strategy.type).toBe('automatic');
      expect(strategy.timeout).toBe(30000);
      expect(strategy.retryCount).toBe(3);
      expect(strategy.fallbackNodes).toEqual(['fallback1']);
      expect(strategy.escalationThreshold).toBe(5);
    });

    it('should support different partition types', () => {
      const completePartition: NetworkPartition = {
        ...mockNetworkPartition,
        partitionType: 'complete',
        severity: 'critical'
      };

      expect(completePartition.partitionType).toBe('complete');
      expect(completePartition.severity).toBe('critical');
    });

    it('should support different recovery strategy types', () => {
      const manualStrategy: RecoveryStrategy = {
        type: 'manual',
        timeout: 60000,
        retryCount: 1,
        fallbackNodes: [],
        escalationThreshold: 10
      };

      const hybridPartition: NetworkPartition = {
        ...mockNetworkPartition,
        recoveryStrategy: manualStrategy
      };

      expect(hybridPartition.recoveryStrategy.type).toBe('manual');
    });
  });

  describe('MeshTopology Integration with NetworkPartition', () => {
    it('should handle NetworkPartition creation in MeshTopology', async () => {
      // Test that MeshTopology can work with NetworkPartition interface
      const partitions = meshTopology.getPartitions();
      expect(Array.isArray(partitions)).toBe(true);
      expect(partitions.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide valid NetworkTopology data', () => {
      const topology = meshTopology.getTopology();
      
      expect(topology.nodeId).toBe('test-node');
      expect(topology.peers).toBeInstanceOf(Map);
      expect(topology.connections).toBeInstanceOf(Map);
      expect(typeof topology.meshDensity).toBe('number');
      expect(typeof topology.averageLatency).toBe('number');
      expect(typeof topology.totalNodes).toBe('number');
      expect(typeof topology.activeConnections).toBe('number');
      expect(typeof topology.networkHealth).toBe('number');
    });

    it('should return valid NetworkMetrics', () => {
      const metrics = meshTopology.getMetrics();
      
      expect(typeof metrics.totalNodes).toBe('number');
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.messagesPerSecond).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.networkThroughput).toBe('number');
      expect(typeof metrics.consensusLatency).toBe('number');
      expect(typeof metrics.faultTolerance).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return valid NetworkHealth information', () => {
      const health = meshTopology.getNetworkHealth();
      
      expect(typeof health.overallScore).toBe('number');
      expect(health.componentScores).toBeDefined();
      expect(typeof health.componentScores.connectivity).toBe('number');
      expect(typeof health.componentScores.consensus).toBe('number');
      expect(typeof health.componentScores.performance).toBe('number');
      expect(typeof health.componentScores.security).toBe('number');
      expect(typeof health.componentScores.reliability).toBe('number');
      expect(Array.isArray(health.activeAlerts)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });
  });

  describe('Network Type Exports', () => {
    it('should export all required network types', () => {
      // Test that all network types are properly exported
      expect(typeof DEFAULT_P2P_CONFIG).toBe('object');
      expect(DEFAULT_P2P_CONFIG.maxConnections).toBe(50);
      expect(DEFAULT_P2P_CONFIG.enableWebRTC).toBe(true);
      expect(DEFAULT_P2P_CONFIG.enableEncryption).toBe(true);
    });

    it('should create valid NetworkMessage', () => {
      const message: NetworkMessage = {
        id: 'msg-001',
        type: 'broadcast',
        source: 'node1',
        destination: 'node2',
        timestamp: new Date(),
        payload: { data: 'test' },
        signature: 'test-signature',
        hop: 1,
        ttl: 10
      };

      expect(message.id).toBe('msg-001');
      expect(message.type).toBe('broadcast');
      expect(message.source).toBe('node1');
      expect(message.destination).toBe('node2');
      expect(message.payload).toEqual({ data: 'test' });
    });

    it('should create valid P2PNetworkConfig', () => {
      const config: P2PNetworkConfig = {
        ...DEFAULT_P2P_CONFIG,
        nodeId: 'test-node',
        maxConnections: 100
      };

      expect(config.nodeId).toBe('test-node');
      expect(config.maxConnections).toBe(100);
      expect(config.enableWebRTC).toBe(true);
      expect(config.consensus.enabled).toBe(true);
    });
  });

  describe('Error Types', () => {
    it('should create P2PNetworkError with proper properties', () => {
      const error = new P2PNetworkError(
        'Test network error',
        'NETWORK_ERROR',
        'test-node',
        { additional: 'data' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('P2PNetworkError');
      expect(error.message).toBe('Test network error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.nodeId).toBe('test-node');
      expect(error.details).toEqual({ additional: 'data' });
    });

    it('should create ConsensusError with proper properties', () => {
      const error = new ConsensusError(
        'Consensus failed',
        123,
        'test-node',
        { epoch: 123 }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConsensusError');
      expect(error.message).toBe('Consensus failed');
      expect(error.epoch).toBe(123);
      expect(error.nodeId).toBe('test-node');
    });

    it('should create WebRTCError with proper properties', () => {
      const error = new WebRTCError(
        'WebRTC connection failed',
        'peer-123',
        'failed',
        { reason: 'timeout' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WebRTCError');
      expect(error.message).toBe('WebRTC connection failed');
      expect(error.peerId).toBe('peer-123');
      expect(error.connectionState).toBe('failed');
    });
  });

  describe('TopologyAlgorithm and RoutingStrategy Enums', () => {
    it('should support all topology algorithms', () => {
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.ADAPTIVE);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.SMALL_WORLD);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.SCALE_FREE);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.FULL_MESH);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.RING);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.STAR);
      meshTopology.setTopologyAlgorithm(TopologyAlgorithm.RANDOM);
      
      // If we get here without errors, the enums are working
      expect(true).toBe(true);
    });

    it('should support all routing strategies', () => {
      meshTopology.setRoutingStrategy(RoutingStrategy.ADAPTIVE);
      meshTopology.setRoutingStrategy(RoutingStrategy.SHORTEST_PATH);
      meshTopology.setRoutingStrategy(RoutingStrategy.FLOODING);
      meshTopology.setRoutingStrategy(RoutingStrategy.GOSSIP);
      meshTopology.setRoutingStrategy(RoutingStrategy.EPIDEMIC);
      
      // If we get here without errors, the enums are working
      expect(true).toBe(true);
    });
  });

  describe('NetworkVisualizationData Interface', () => {
    it('should return valid visualization data', () => {
      const vizData = meshTopology.getVisualizationData();
      
      expect(Array.isArray(vizData.nodes)).toBe(true);
      expect(Array.isArray(vizData.edges)).toBe(true);
      expect(vizData.metadata).toBeDefined();
      expect(typeof vizData.metadata.totalNodes).toBe('number');
      expect(typeof vizData.metadata.totalConnections).toBe('number');
      expect(typeof vizData.metadata.networkHealth).toBe('number');
      expect(typeof vizData.metadata.consensusState).toBe('string');
      expect(vizData.metadata.lastUpdate).toBeInstanceOf(Date);
    });

    it('should have properly structured nodes', () => {
      const vizData = meshTopology.getVisualizationData();
      
      if (vizData.nodes.length > 0) {
        const node = vizData.nodes[0];
        expect(typeof node.id).toBe('string');
        expect(typeof node.label).toBe('string');
        expect(['self', 'peer', 'bootstrap'].includes(node.type)).toBe(true);
        expect(['online', 'offline', 'connecting'].includes(node.status)).toBe(true);
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(typeof node.metrics.cpu).toBe('number');
        expect(typeof node.metrics.memory).toBe('number');
        expect(typeof node.metrics.latency).toBe('number');
        expect(typeof node.metrics.agentCount).toBe('number');
      }
    });
  });

  describe('Async Operations', () => {
    it('should handle peer join operations', async () => {
      const newPeer: PeerInfo = {
        id: 'new-peer-002',
        multiaddrs: ['/ip4/192.168.1.100/tcp/8081'],
        protocols: ['test-protocol-2'],
        metadata: {
          agentCount: 3,
          cpuUsage: 30,
          memoryUsage: 50,
          networkLatency: 15,
          lastSeen: new Date(),
          capabilities: ['analysis']
        }
      };

      await expect(meshTopology.handlePeerJoin(newPeer)).resolves.not.toThrow();
      
      const topology = meshTopology.getTopology();
      expect(topology.peers.has('new-peer-002')).toBe(true);
    });

    it('should handle peer leave operations', async () => {
      await expect(meshTopology.handlePeerLeave('test-peer-001')).resolves.not.toThrow();
      
      const topology = meshTopology.getTopology();
      expect(topology.peers.has('test-peer-001')).toBe(false);
    });

    it('should handle topology optimization', async () => {
      await expect(meshTopology.optimizeTopology()).resolves.not.toThrow();
      
      const metrics = meshTopology.getMetrics();
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Type Safety and Compatibility', () => {
    it('should maintain type safety across all network interfaces', () => {
      // This test ensures that all interfaces are properly typed and compatible
      const faultDetection: FaultDetection = {
        type: 'network-partition',
        affectedNodes: ['node1', 'node2'],
        detectedAt: new Date(),
        severity: 'high',
        recoveryAction: 'reroute'
      };

      expect(faultDetection.type).toBe('network-partition');
      expect(faultDetection.severity).toBe('high');
      expect(faultDetection.recoveryAction).toBe('reroute');
    });

    it('should work with Map-based topology data structures', () => {
      const topology = meshTopology.getTopology();
      
      // Test that Maps are properly typed and functional
      expect(topology.peers instanceof Map).toBe(true);
      expect(topology.connections instanceof Map).toBe(true);
      
      // Test Map operations
      topology.peers.forEach((peer, id) => {
        expect(typeof id).toBe('string');
        expect(peer.id).toBe(id);
        expect(Array.isArray(peer.multiaddrs)).toBe(true);
        expect(Array.isArray(peer.protocols)).toBe(true);
      });
    });
  });
});