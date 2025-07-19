/**
 * Network Type Definitions for P2P Mesh Networking
 * Comprehensive TypeScript interfaces for distributed agent coordination
 */

import { Agent } from './agent';

// Core P2P Network Types
export interface PeerInfo {
  id: string;
  multiaddrs: string[];
  protocols: string[];
  metadata: {
    agentCount: number;
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    lastSeen: Date;
    capabilities: string[];
  };
}

export interface Connection {
  peerId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  latency: number;
  bandwidth: number;
  established: Date;
  lastActivity: Date;
  messagesSent: number;
  messagesReceived: number;
}

export interface NetworkMessage {
  id: string;
  type: 'broadcast' | 'direct' | 'consensus' | 'heartbeat' | 'agent-coordination';
  source: string;
  destination?: string;
  timestamp: Date;
  payload: any;
  signature?: string;
  hop: number;
  ttl: number;
}

export interface NetworkTopology {
  nodeId: string;
  peers: Map<string, PeerInfo>;
  connections: Map<string, Connection>;
  meshDensity: number;
  averageLatency: number;
  totalNodes: number;
  activeConnections: number;
  networkHealth: number;
}

// WebRTC-specific types
export interface WebRTCConnection {
  peerId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  state: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signallingState: RTCSignalingState;
  localDescription?: RTCSessionDescription;
  remoteDescription?: RTCSessionDescription;
}

export interface WebRTCSignaling {
  type: 'offer' | 'answer' | 'ice-candidate';
  peerId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

// Consensus Engine Types
export interface ConsensusMessage {
  id: string;
  type: 'proposal' | 'vote' | 'commit' | 'abort';
  epoch: number;
  proposer: string;
  data: any;
  signature: string;
  timestamp: Date;
}

export interface ConsensusState {
  epoch: number;
  leader: string;
  proposals: Map<string, ConsensusMessage>;
  votes: Map<string, Map<string, boolean>>;
  committed: string[];
  pending: string[];
}

export interface DAGNode {
  id: string;
  data: any;
  parents: string[];
  children: string[];
  timestamp: Date;
  signature: string;
  confirmed: boolean;
}

// Network Discovery Types
export interface DiscoveryService {
  type: 'mdns' | 'bootstrap' | 'dht' | 'webrtc-signaling';
  config: any;
  status: 'active' | 'inactive' | 'error';
}

export interface BootstrapNode {
  id: string;
  multiaddr: string;
  protocols: string[];
  weight: number;
  lastSeen: Date;
}

// P2P Network Manager Configuration
export interface P2PNetworkConfig {
  nodeId?: string;
  listenAddresses: string[];
  bootstrapNodes: BootstrapNode[];
  maxConnections: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  messageTimeout: number;
  enableWebRTC: boolean;
  enableEncryption: boolean;
  enableCompression: boolean;
  discoveryServices: DiscoveryService[];
  consensus: {
    enabled: boolean;
    type: 'raft' | 'pbft' | 'qudag' | 'avalanche';
    config: any;
  };
  security: {
    enableTLS: boolean;
    certificatePath?: string;
    keyPath?: string;
    trustedPeers: string[];
  };
}

// Agent Coordination Types
export interface AgentCoordinationMessage {
  type: 'spawn' | 'terminate' | 'task-assign' | 'task-complete' | 'status-update' | 'resource-request';
  agentId: string;
  sourceNode: string;
  targetNode?: string;
  payload: {
    agentConfig?: Partial<Agent>;
    taskData?: any;
    resourceRequirements?: ResourceRequirements;
    status?: AgentStatus;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
}

export interface ResourceRequirements {
  cpu: number;
  memory: number;
  storage: number;
  networkBandwidth: number;
  gpuRequired: boolean;
  wasmSupport: boolean;
}

export interface AgentStatus {
  agentId: string;
  nodeId: string;
  status: 'spawning' | 'active' | 'idle' | 'working' | 'error' | 'terminated';
  currentTask?: string;
  progress: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    networkIO: number;
  };
  lastActivity: Date;
}

// Network Synchronization Types
export interface SyncMessage {
  type: 'state-request' | 'state-response' | 'delta-sync' | 'full-sync';
  nodeId: string;
  timestamp: Date;
  data: any;
  checksum: string;
}

export interface NetworkState {
  nodeId: string;
  timestamp: Date;
  agents: Map<string, AgentStatus>;
  resources: ResourceAvailability;
  topology: NetworkTopology;
  consensus: ConsensusState;
  version: number;
  checksum: string;
}

export interface ResourceAvailability {
  nodeId: string;
  totalCpu: number;
  availableCpu: number;
  totalMemory: number;
  availableMemory: number;
  totalStorage: number;
  availableStorage: number;
  networkBandwidth: number;
  gpuAvailable: boolean;
  wasmSupported: boolean;
}

// Network Metrics and Monitoring
export interface NetworkMetrics {
  totalNodes: number;
  activeConnections: number;
  messagesPerSecond: number;
  averageLatency: number;
  networkThroughput: number;
  consensusLatency: number;
  faultTolerance: number;
  uptime: number;
  lastUpdated: Date;
}

export interface NetworkHealth {
  overallScore: number;
  componentScores: {
    connectivity: number;
    consensus: number;
    performance: number;
    security: number;
    reliability: number;
  };
  activeAlerts: NetworkAlert[];
  recommendations: string[];
}

export interface NetworkAlert {
  id: string;
  type: 'connectivity' | 'performance' | 'security' | 'consensus' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  nodeId?: string;
  timestamp: Date;
  resolved: boolean;
  details?: any;
}

// Fault Tolerance Types
export interface FaultDetection {
  type: 'node-failure' | 'network-partition' | 'byzantine-behavior' | 'performance-degradation';
  affectedNodes: string[];
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryAction: 'reconnect' | 'reroute' | 'isolate' | 'restart';
}

export interface NetworkPartition {
  id: string;
  affectedNodes: string[];
  startTime: Date;
  endTime?: Date;
  partitionType: 'complete' | 'partial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryStrategy: RecoveryStrategy;
  resolved: boolean;
}

export interface RecoveryStrategy {
  type: 'automatic' | 'manual' | 'hybrid';
  timeout: number;
  retryCount: number;
  fallbackNodes: string[];
  escalationThreshold: number;
}

// Event Types
export interface NetworkEvent {
  type: 'peer-connected' | 'peer-disconnected' | 'message-received' | 'consensus-reached' | 'fault-detected' | 'recovery-initiated';
  nodeId: string;
  timestamp: Date;
  data: any;
}

export interface P2PNetworkEventListener {
  onPeerConnected: (peer: PeerInfo) => void;
  onPeerDisconnected: (peerId: string) => void;
  onMessageReceived: (message: NetworkMessage) => void;
  onConsensusReached: (result: any) => void;
  onFaultDetected: (fault: FaultDetection) => void;
  onRecoveryInitiated: (strategy: RecoveryStrategy) => void;
  onNetworkHealthChanged: (health: NetworkHealth) => void;
}

// Export all types
export type NetworkMessageType = NetworkMessage['type'];
export type ConnectionStatus = Connection['status'];
export type ConsensusType = P2PNetworkConfig['consensus']['type'];
export type DiscoveryServiceType = DiscoveryService['type'];
export type AlertSeverity = NetworkAlert['severity'];
export type FaultType = FaultDetection['type'];
export type RecoveryType = RecoveryStrategy['type'];
export type NetworkEventType = NetworkEvent['type'];

// Utility Types
export interface P2PNetworkStats {
  totalPeers: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  averageLatency: number;
  uptime: number;
  startTime: Date;
}

export interface NetworkVisualizationData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'self' | 'peer' | 'bootstrap';
    status: 'online' | 'offline' | 'connecting';
    position: { x: number; y: number };
    metrics: {
      cpu: number;
      memory: number;
      latency: number;
      agentCount: number;
    };
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'direct' | 'relay';
    strength: number;
    latency: number;
    bandwidth: number;
  }>;
  metadata: {
    totalNodes: number;
    totalConnections: number;
    networkHealth: number;
    consensusState: string;
    lastUpdate: Date;
  };
}

// Error Types
export class P2PNetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public nodeId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'P2PNetworkError';
  }
}

export class ConsensusError extends Error {
  constructor(
    message: string,
    public epoch: number,
    public nodeId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConsensusError';
  }
}

export class WebRTCError extends Error {
  constructor(
    message: string,
    public peerId: string,
    public connectionState?: RTCPeerConnectionState,
    public details?: any
  ) {
    super(message);
    this.name = 'WebRTCError';
  }
}

// Configuration Defaults
export const DEFAULT_P2P_CONFIG: P2PNetworkConfig = {
  listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
  bootstrapNodes: [],
  maxConnections: 50,
  connectionTimeout: 30000,
  heartbeatInterval: 10000,
  messageTimeout: 5000,
  enableWebRTC: true,
  enableEncryption: true,
  enableCompression: true,
  discoveryServices: [
    { type: 'mdns', config: {}, status: 'active' },
    { type: 'webrtc-signaling', config: {}, status: 'active' }
  ],
  consensus: {
    enabled: true,
    type: 'raft',
    config: {}
  },
  security: {
    enableTLS: true,
    trustedPeers: []
  }
};
