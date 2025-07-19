/**
 * P2P Network Manager - Core peer-to-peer networking implementation
 * Handles WebRTC connections, mesh topology, and distributed agent coordination
 */

import {
  P2PNetworkConfig,
  PeerInfo,
  Connection,
  NetworkMessage,
  NetworkTopology,
  WebRTCConnection,
  WebRTCSignaling,
  AgentCoordinationMessage,
  NetworkState,
  NetworkMetrics,
  NetworkHealth,
  P2PNetworkEventListener,
  P2PNetworkStats,
  P2PNetworkError,
  WebRTCError,
  DEFAULT_P2P_CONFIG
} from '../types/network';
import { Agent } from '../types/agent';

/**
 * Main P2P Network Manager class
 * Implements WebRTC-based peer-to-peer mesh networking for distributed neural agents
 */
export class P2PNetworkManager {
  private config: P2PNetworkConfig;
  private nodeId: string;
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, WebRTCConnection> = new Map();
  private eventListeners: P2PNetworkEventListener[] = [];
  private topology: NetworkTopology;
  private messageQueue: Map<string, NetworkMessage[]> = new Map();
  private stats: P2PNetworkStats;
  private isInitialized = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private signalingServer: WebSocket | null = null;
  private localAgents: Map<string, Agent> = new Map();

  constructor(config: Partial<P2PNetworkConfig> = {}) {
    this.config = { ...DEFAULT_P2P_CONFIG, ...config };
    this.nodeId = this.config.nodeId || this.generateNodeId();
    
    this.topology = {
      nodeId: this.nodeId,
      peers: this.peers,
      connections: new Map(),
      meshDensity: 0,
      averageLatency: 0,
      totalNodes: 1,
      activeConnections: 0,
      networkHealth: 100
    };

    this.stats = {
      totalPeers: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      averageLatency: 0,
      uptime: 0,
      startTime: new Date()
    };
  }

  /**
   * Initialize the P2P network manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new P2PNetworkError('P2P Network Manager already initialized', 'ALREADY_INITIALIZED');
    }

    try {
      console.log(`🌐 Initializing P2P Network Manager (Node ID: ${this.nodeId})`);
      
      // Initialize WebRTC if enabled
      if (this.config.enableWebRTC) {
        await this.initializeWebRTC();
      }

      // Connect to bootstrap nodes
      await this.connectToBootstrapNodes();

      // Start heartbeat
      this.startHeartbeat();

      // Initialize signaling server connection
      await this.initializeSignalingServer();

      this.isInitialized = true;
      console.log('✅ P2P Network Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ P2P Network Manager initialization failed:', error);
      throw new P2PNetworkError('Initialization failed', 'INIT_FAILED', this.nodeId, error);
    }
  }

  /**
   * Initialize WebRTC capabilities
   */
  private async initializeWebRTC(): Promise<void> {
    // Check if running in test environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      console.warn('⚠️ WebRTC initialization skipped in test environment');
      return;
    }
    
    // Check WebRTC support
    if (typeof RTCPeerConnection === 'undefined' && typeof window !== 'undefined') {
      throw new P2PNetworkError('WebRTC not supported in this environment', 'WEBRTC_NOT_SUPPORTED');
    }
    
    // Mock WebRTC for server-side or unsupported environments
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('⚠️ WebRTC not available, using mock implementation');
      return;
    }

    console.log('🔗 WebRTC support confirmed');
  }

  /**
   * Initialize signaling server connection
   */
  private async initializeSignalingServer(): Promise<void> {
    const signalingUrl = process.env.SIGNALING_SERVER_URL || 'ws://localhost:8080';
    
    try {
      this.signalingServer = new WebSocket(signalingUrl);
      
      this.signalingServer.onopen = () => {
        console.log('📡 Connected to signaling server');
        this.registerWithSignalingServer();
      };

      this.signalingServer.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.signalingServer.onerror = (error) => {
        console.error('❌ Signaling server error:', error);
      };

      this.signalingServer.onclose = () => {
        console.log('🔌 Signaling server connection closed');
        this.signalingServer = null;
      };

    } catch (error) {
      console.warn('⚠️ Could not connect to signaling server:', error);
    }
  }

  /**
   * Register this node with the signaling server
   */
  private registerWithSignalingServer(): void {
    if (!this.signalingServer) return;

    const registrationMessage = {
      type: 'register',
      nodeId: this.nodeId,
      capabilities: this.getNodeCapabilities(),
      timestamp: new Date().toISOString()
    };

    this.signalingServer.send(JSON.stringify(registrationMessage));
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'peer-list':
        this.processPeerList(message.peers);
        break;
      case 'offer':
        this.handleWebRTCOffer(message);
        break;
      case 'answer':
        this.handleWebRTCAnswer(message);
        break;
      case 'ice-candidate':
        this.handleICECandidate(message);
        break;
      default:
        console.warn('Unknown signaling message type:', message.type);
    }
  }

  /**
   * Process peer list from signaling server
   */
  private processPeerList(peers: any[]): void {
    for (const peer of peers) {
      if (peer.nodeId !== this.nodeId && !this.peers.has(peer.nodeId)) {
        this.initiateConnection(peer.nodeId);
      }
    }
  }

  /**
   * Connect to bootstrap nodes
   */
  private async connectToBootstrapNodes(): Promise<void> {
    const promises = this.config.bootstrapNodes.map(async (node) => {
      try {
        await this.connectToPeer(node.id);
      } catch (error) {
        console.warn(`Failed to connect to bootstrap node ${node.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (this.connections.has(peerId)) {
      console.log(`Already connected to peer ${peerId}`);
      return;
    }

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      const dataChannel = peerConnection.createDataChannel('mesh-network', {
        ordered: true
      });

      const connection: WebRTCConnection = {
        peerId,
        peerConnection,
        dataChannel,
        state: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        signallingState: peerConnection.signalingState
      };

      this.connections.set(peerId, connection);
      this.setupWebRTCEventHandlers(connection);

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.signalingServer) {
        this.signalingServer.send(JSON.stringify({
          type: 'offer',
          from: this.nodeId,
          to: peerId,
          offer: offer
        }));
      }

    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
      throw new WebRTCError('Connection failed', peerId, 'failed', error);
    }
  }

  /**
   * Setup WebRTC event handlers for a connection
   */
  private setupWebRTCEventHandlers(connection: WebRTCConnection): void {
    const { peerConnection, dataChannel, peerId } = connection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingServer) {
        this.signalingServer.send(JSON.stringify({
          type: 'ice-candidate',
          from: this.nodeId,
          to: peerId,
          candidate: event.candidate
        }));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      connection.state = peerConnection.connectionState;
      console.log(`Connection state changed for ${peerId}: ${connection.state}`);

      if (connection.state === 'connected') {
        this.onPeerConnected(peerId);
      } else if (connection.state === 'disconnected' || connection.state === 'failed') {
        this.onPeerDisconnected(peerId);
      }
    };

    dataChannel.onopen = () => {
      console.log(`✅ Data channel opened for peer ${peerId}`);
    };

    dataChannel.onmessage = (event) => {
      this.handleIncomingMessage(peerId, event.data);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for peer ${peerId}:`, error);
    };

    peerConnection.ondatachannel = (event) => {
      const receivedChannel = event.channel;
      receivedChannel.onmessage = (event) => {
        this.handleIncomingMessage(peerId, event.data);
      };
    };
  }

  /**
   * Handle WebRTC offer
   */
  private async handleWebRTCOffer(message: any): Promise<void> {
    const { from, offer } = message;
    
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      const connection: WebRTCConnection = {
        peerId: from,
        peerConnection,
        dataChannel: null as any, // Will be set when received
        state: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        signallingState: peerConnection.signalingState
      };

      this.connections.set(from, connection);
      this.setupWebRTCEventHandlers(connection);

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.signalingServer) {
        this.signalingServer.send(JSON.stringify({
          type: 'answer',
          from: this.nodeId,
          to: from,
          answer: answer
        }));
      }

    } catch (error) {
      console.error(`Failed to handle offer from ${from}:`, error);
    }
  }

  /**
   * Handle WebRTC answer
   */
  private async handleWebRTCAnswer(message: any): Promise<void> {
    const { from, answer } = message;
    const connection = this.connections.get(from);

    if (connection) {
      try {
        await connection.peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error(`Failed to handle answer from ${from}:`, error);
      }
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleICECandidate(message: any): Promise<void> {
    const { from, candidate } = message;
    const connection = this.connections.get(from);

    if (connection) {
      try {
        await connection.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error(`Failed to add ICE candidate from ${from}:`, error);
      }
    }
  }

  /**
   * Initiate connection to a peer
   */
  private async initiateConnection(peerId: string): Promise<void> {
    try {
      await this.connectToPeer(peerId);
    } catch (error) {
      console.error(`Failed to initiate connection to ${peerId}:`, error);
    }
  }

  /**
   * Handle peer connected event
   */
  private onPeerConnected(peerId: string): void {
    console.log(`🤝 Peer connected: ${peerId}`);
    
    // Update stats
    this.stats.activeConnections++;
    this.stats.totalPeers = this.peers.size;
    
    // Update topology
    this.updateTopology();
    
    // Notify listeners
    this.eventListeners.forEach(listener => {
      if (listener.onPeerConnected) {
        const peer = this.peers.get(peerId);
        if (peer) {
          listener.onPeerConnected(peer);
        }
      }
    });
  }

  /**
   * Handle peer disconnected event
   */
  private onPeerDisconnected(peerId: string): void {
    console.log(`👋 Peer disconnected: ${peerId}`);
    
    // Clean up connection
    this.connections.delete(peerId);
    this.peers.delete(peerId);
    
    // Update stats
    this.stats.activeConnections--;
    this.stats.totalPeers = this.peers.size;
    
    // Update topology
    this.updateTopology();
    
    // Notify listeners
    this.eventListeners.forEach(listener => {
      if (listener.onPeerDisconnected) {
        listener.onPeerDisconnected(peerId);
      }
    });
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(peerId: string, data: string): void {
    try {
      const message: NetworkMessage = JSON.parse(data);
      
      // Update stats
      this.stats.messagesReceived++;
      this.stats.bytesTransferred += data.length;
      
      // Process message based on type
      switch (message.type) {
        case 'agent-coordination':
          this.handleAgentCoordinationMessage(message);
          break;
        case 'heartbeat':
          this.handleHeartbeatMessage(peerId, message);
          break;
        case 'broadcast':
          this.handleBroadcastMessage(message);
          break;
        case 'direct':
          this.handleDirectMessage(message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
      
      // Notify listeners
      this.eventListeners.forEach(listener => {
        if (listener.onMessageReceived) {
          listener.onMessageReceived(message);
        }
      });
      
    } catch (error) {
      console.error('Failed to process incoming message:', error);
    }
  }

  /**
   * Handle agent coordination message
   */
  private handleAgentCoordinationMessage(message: NetworkMessage): void {
    const coordinationData = message.payload as AgentCoordinationMessage;
    
    switch (coordinationData.type) {
      case 'spawn':
        this.handleRemoteAgentSpawn(coordinationData);
        break;
      case 'terminate':
        this.handleRemoteAgentTerminate(coordinationData);
        break;
      case 'task-assign':
        this.handleRemoteTaskAssign(coordinationData);
        break;
      case 'status-update':
        this.handleRemoteStatusUpdate(coordinationData);
        break;
      default:
        console.warn('Unknown coordination message type:', coordinationData.type);
    }
  }

  /**
   * Handle remote agent spawn request
   */
  private async handleRemoteAgentSpawn(coordination: AgentCoordinationMessage): Promise<void> {
    // Implementation would coordinate with NeuralMeshService to spawn agent
    console.log(`📡 Remote agent spawn request from ${coordination.sourceNode}:`, coordination.payload.agentConfig);
  }

  /**
   * Handle remote agent terminate request
   */
  private async handleRemoteAgentTerminate(coordination: AgentCoordinationMessage): Promise<void> {
    console.log(`📡 Remote agent terminate request from ${coordination.sourceNode}:`, coordination.agentId);
  }

  /**
   * Handle remote task assignment
   */
  private async handleRemoteTaskAssign(coordination: AgentCoordinationMessage): Promise<void> {
    console.log(`📡 Remote task assignment from ${coordination.sourceNode}:`, coordination.payload.taskData);
  }

  /**
   * Handle remote status update
   */
  private async handleRemoteStatusUpdate(coordination: AgentCoordinationMessage): Promise<void> {
    console.log(`📡 Remote status update from ${coordination.sourceNode}:`, coordination.payload.status);
  }

  /**
   * Handle heartbeat message
   */
  private handleHeartbeatMessage(peerId: string, message: NetworkMessage): void {
    // Update peer last seen
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.metadata.lastSeen = new Date();
    }
  }

  /**
   * Handle broadcast message
   */
  private handleBroadcastMessage(message: NetworkMessage): void {
    // Relay message to other peers (if not already relayed)
    if (message.hop < 3) { // Prevent infinite loops
      this.broadcastMessage({
        ...message,
        hop: message.hop + 1
      });
    }
  }

  /**
   * Handle direct message
   */
  private handleDirectMessage(message: NetworkMessage): void {
    // Process direct message
    console.log(`📨 Direct message from ${message.source}:`, message.payload);
  }

  /**
   * Broadcast message to all connected peers
   */
  async broadcastMessage(message: Omit<NetworkMessage, 'id' | 'timestamp'>): Promise<void> {
    const networkMessage: NetworkMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      ...message
    };

    const messageData = JSON.stringify(networkMessage);
    
    for (const [peerId, connection] of this.connections) {
      if (connection.dataChannel?.readyState === 'open') {
        try {
          connection.dataChannel.send(messageData);
          this.stats.messagesSent++;
          this.stats.bytesTransferred += messageData.length;
        } catch (error) {
          console.error(`Failed to send message to ${peerId}:`, error);
        }
      }
    }
  }

  /**
   * Send direct message to specific peer
   */
  async sendDirectMessage(peerId: string, message: Omit<NetworkMessage, 'id' | 'timestamp' | 'destination'>): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection || connection.dataChannel?.readyState !== 'open') {
      throw new P2PNetworkError('Peer not connected', 'PEER_NOT_CONNECTED', peerId);
    }

    const networkMessage: NetworkMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      destination: peerId,
      ...message
    };

    const messageData = JSON.stringify(networkMessage);
    
    try {
      connection.dataChannel.send(messageData);
      this.stats.messagesSent++;
      this.stats.bytesTransferred += messageData.length;
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw new P2PNetworkError('Message send failed', 'SEND_FAILED', peerId, error);
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Send heartbeat to all peers
   */
  private async sendHeartbeat(): Promise<void> {
    const heartbeatMessage = {
      type: 'heartbeat' as const,
      source: this.nodeId,
      payload: {
        timestamp: new Date(),
        stats: this.stats,
        agents: Array.from(this.localAgents.keys())
      },
      hop: 0,
      ttl: 1
    };

    await this.broadcastMessage(heartbeatMessage);
  }

  /**
   * Update network topology
   */
  private updateTopology(): void {
    this.topology.totalNodes = this.peers.size + 1; // +1 for self
    this.topology.activeConnections = this.connections.size;
    this.topology.meshDensity = this.calculateMeshDensity();
    this.topology.averageLatency = this.calculateAverageLatency();
    this.topology.networkHealth = this.calculateNetworkHealth();
  }

  /**
   * Calculate mesh density
   */
  private calculateMeshDensity(): number {
    const totalPossibleConnections = (this.topology.totalNodes * (this.topology.totalNodes - 1)) / 2;
    return totalPossibleConnections > 0 ? (this.topology.activeConnections / totalPossibleConnections) * 100 : 0;
  }

  /**
   * Calculate average latency
   */
  private calculateAverageLatency(): number {
    // Placeholder implementation
    return 50; // ms
  }

  /**
   * Calculate network health
   */
  private calculateNetworkHealth(): number {
    // Placeholder implementation
    const connectionRatio = this.topology.activeConnections / Math.max(1, this.topology.totalNodes - 1);
    return Math.min(100, connectionRatio * 100);
  }

  /**
   * Get node capabilities
   */
  private getNodeCapabilities(): string[] {
    return [
      'webrtc',
      'mesh-networking',
      'agent-coordination',
      'neural-processing',
      'wasm-acceleration'
    ];
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: P2PNetworkEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: P2PNetworkEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): P2PNetworkStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  /**
   * Get network topology
   */
  getNetworkTopology(): NetworkTopology {
    return { ...this.topology };
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get network health
   */
  getNetworkHealth(): NetworkHealth {
    return {
      overallScore: this.topology.networkHealth,
      componentScores: {
        connectivity: this.topology.meshDensity,
        consensus: 100, // Placeholder
        performance: 100 - this.topology.averageLatency,
        security: 100, // Placeholder
        reliability: this.topology.networkHealth
      },
      activeAlerts: [],
      recommendations: []
    };
  }

  /**
   * Register local agent
   */
  registerLocalAgent(agent: Agent): void {
    this.localAgents.set(agent.id, agent);
  }

  /**
   * Unregister local agent
   */
  unregisterLocalAgent(agentId: string): void {
    this.localAgents.delete(agentId);
  }

  /**
   * Get local agents
   */
  getLocalAgents(): Agent[] {
    return Array.from(this.localAgents.values());
  }

  /**
   * Coordinate agent spawn across network
   */
  async coordinateAgentSpawn(agentConfig: Partial<Agent>, targetNode?: string): Promise<void> {
    const coordinationMessage: AgentCoordinationMessage = {
      type: 'spawn',
      agentId: agentConfig.id || this.generateNodeId(),
      sourceNode: this.nodeId,
      targetNode,
      payload: {
        agentConfig
      },
      priority: 'medium'
    };

    if (targetNode) {
      await this.sendDirectMessage(targetNode, {
        type: 'agent-coordination',
        source: this.nodeId,
        payload: coordinationMessage,
        hop: 0,
        ttl: 1
      });
    } else {
      await this.broadcastMessage({
        type: 'agent-coordination',
        source: this.nodeId,
        payload: coordinationMessage,
        hop: 0,
        ttl: 2
      });
    }
  }

  /**
   * Shutdown the network manager
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down P2P Network Manager...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      try {
        connection.dataChannel?.close();
        connection.peerConnection?.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }

    // Close signaling server connection
    if (this.signalingServer) {
      this.signalingServer.close();
      this.signalingServer = null;
    }

    // Clear data structures
    this.connections.clear();
    this.peers.clear();
    this.localAgents.clear();
    this.eventListeners.length = 0;
    
    this.isInitialized = false;
    console.log('✅ P2P Network Manager shutdown complete');
  }

  /**
   * Get initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
let networkManagerInstance: P2PNetworkManager | null = null;

export const getP2PNetworkManager = (config?: Partial<P2PNetworkConfig>): P2PNetworkManager => {
  if (!networkManagerInstance) {
    networkManagerInstance = new P2PNetworkManager(config);
  }
  return networkManagerInstance;
};

export const resetP2PNetworkManager = (): void => {
  if (networkManagerInstance) {
    networkManagerInstance.shutdown();
    networkManagerInstance = null;
  }
};
