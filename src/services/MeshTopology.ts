/**
 * Mesh Topology Manager - Network topology optimization and management
 * Handles mesh network structure, routing, and performance optimization
 */

import {
  NetworkTopology,
  PeerInfo,
  Connection,
  NetworkHealth,
  NetworkMetrics,
  FaultDetection,
  RecoveryStrategy,
  NetworkVisualizationData,
  P2PNetworkError,
  NetworkPartition
} from '../types/network';

/**
 * Mesh topology optimization algorithms
 */
export enum TopologyAlgorithm {
  RANDOM = 'random',
  RING = 'ring',
  STAR = 'star',
  FULL_MESH = 'full-mesh',
  SMALL_WORLD = 'small-world',
  SCALE_FREE = 'scale-free',
  ADAPTIVE = 'adaptive'
}

/**
 * Routing strategy for message propagation
 */
export enum RoutingStrategy {
  FLOODING = 'flooding',
  SHORTEST_PATH = 'shortest-path',
  GOSSIP = 'gossip',
  EPIDEMIC = 'epidemic',
  ADAPTIVE = 'adaptive'
}

// NetworkPartition interface imported from types/network.ts

/**
 * Mesh Topology Manager implementation
 */
export class MeshTopology {
  private nodeId: string;
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, Connection> = new Map();
  private topology: NetworkTopology;
  private routingTable: Map<string, string[]> = new Map();
  private partitions: Map<string, NetworkPartition> = new Map();
  private metrics: NetworkMetrics;
  private algorithm: TopologyAlgorithm = TopologyAlgorithm.ADAPTIVE;
  private routingStrategy: RoutingStrategy = RoutingStrategy.ADAPTIVE;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(nodeId: string, initialPeers: PeerInfo[] = []) {
    this.nodeId = nodeId;
    
    // Initialize with peers
    initialPeers.forEach(peer => {
      this.peers.set(peer.id, peer);
    });

    this.topology = {
      nodeId,
      peers: this.peers,
      connections: this.connections,
      meshDensity: 0,
      averageLatency: 0,
      totalNodes: this.peers.size + 1,
      activeConnections: 0,
      networkHealth: 100
    };

    this.metrics = {
      totalNodes: this.topology.totalNodes,
      activeConnections: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      networkThroughput: 0,
      consensusLatency: 0,
      faultTolerance: 0,
      uptime: 0,
      lastUpdated: new Date()
    };

    this.startMonitoring();
  }

  /**
   * Start network monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.detectPartitions();
      this.optimizeTopology();
    }, 10000); // Monitor every 10 seconds
  }

  /**
   * Handle new peer joining the network
   */
  async handlePeerJoin(peer: PeerInfo): Promise<void> {
    console.log(`👥 Peer joining network: ${peer.id}`);
    
    this.peers.set(peer.id, peer);
    this.topology.totalNodes = this.peers.size + 1;
    
    // Update routing table
    await this.updateRoutingTable();
    
    // Optimize topology for new peer
    await this.optimizeTopologyForNewPeer(peer);
    
    // Update metrics
    this.updateMetrics();
  }

  /**
   * Handle peer leaving the network
   */
  async handlePeerLeave(peerId: string): Promise<void> {
    console.log(`👋 Peer leaving network: ${peerId}`);
    
    this.peers.delete(peerId);
    this.connections.delete(peerId);
    this.topology.totalNodes = this.peers.size + 1;
    
    // Remove from routing table
    this.routingTable.delete(peerId);
    
    // Update routing table for remaining peers
    await this.updateRoutingTable();
    
    // Optimize topology after peer removal
    await this.optimizeTopologyAfterPeerLeave(peerId);
    
    // Update metrics
    this.updateMetrics();
  }

  /**
   * Optimize topology for new peer
   */
  private async optimizeTopologyForNewPeer(peer: PeerInfo): Promise<void> {
    switch (this.algorithm) {
      case TopologyAlgorithm.ADAPTIVE:
        await this.adaptiveOptimization(peer);
        break;
      case TopologyAlgorithm.SMALL_WORLD:
        await this.smallWorldOptimization(peer);
        break;
      case TopologyAlgorithm.SCALE_FREE:
        await this.scaleFreeOptimization(peer);
        break;
      default:
        await this.basicOptimization(peer);
    }
  }

  /**
   * Optimize topology after peer leaves
   */
  private async optimizeTopologyAfterPeerLeave(peerId: string): Promise<void> {
    // Check if network is still connected
    const isConnected = await this.verifyNetworkConnectivity();
    
    if (!isConnected) {
      console.warn(`⚠️ Network partition detected after ${peerId} left`);
      await this.handleNetworkPartition();
    }
    
    // Rebalance connections
    await this.rebalanceConnections();
  }

  /**
   * Adaptive topology optimization
   */
  private async adaptiveOptimization(peer: PeerInfo): Promise<void> {
    const optimalConnections = this.calculateOptimalConnections(peer);
    
    for (const targetPeerId of optimalConnections) {
      if (!this.connections.has(targetPeerId)) {
        await this.suggestConnection(peer.id, targetPeerId);
      }
    }
  }

  /**
   * Small world network optimization
   */
  private async smallWorldOptimization(peer: PeerInfo): Promise<void> {
    const localConnections = this.getLocalConnections(peer.id);
    const randomConnections = this.getRandomConnections(peer.id, 2);
    
    const suggestedConnections = [...localConnections, ...randomConnections];
    
    for (const targetPeerId of suggestedConnections) {
      await this.suggestConnection(peer.id, targetPeerId);
    }
  }

  /**
   * Scale-free network optimization
   */
  private async scaleFreeOptimization(peer: PeerInfo): Promise<void> {
    const hubNodes = this.getHubNodes();
    const preferentialAttachment = this.calculatePreferentialAttachment(peer.id);
    
    // Connect to hubs based on preferential attachment
    for (const hubId of hubNodes) {
      const probability = preferentialAttachment.get(hubId) || 0;
      if (Math.random() < probability) {
        await this.suggestConnection(peer.id, hubId);
      }
    }
  }

  /**
   * Basic topology optimization
   */
  private async basicOptimization(peer: PeerInfo): Promise<void> {
    const nearestPeers = this.findNearestPeers(peer.id, 3);
    
    for (const nearestPeer of nearestPeers) {
      await this.suggestConnection(peer.id, nearestPeer.id);
    }
  }

  /**
   * Calculate optimal connections for a peer
   */
  private calculateOptimalConnections(peer: PeerInfo): string[] {
    const connections: string[] = [];
    const targetDegree = Math.min(5, Math.floor(Math.sqrt(this.peers.size)));
    
    // Find peers with good metrics
    const candidatePeers = Array.from(this.peers.values())
      .filter(p => p.id !== peer.id)
      .sort((a, b) => {
        const scoreA = this.calculatePeerScore(a);
        const scoreB = this.calculatePeerScore(b);
        return scoreB - scoreA;
      })
      .slice(0, targetDegree);
    
    connections.push(...candidatePeers.map(p => p.id));
    
    return connections;
  }

  /**
   * Calculate peer score for connection preference
   */
  private calculatePeerScore(peer: PeerInfo): number {
    const latencyScore = 1 / (peer.metadata.networkLatency + 1);
    const cpuScore = 1 - (peer.metadata.cpuUsage / 100);
    const memoryScore = 1 - (peer.metadata.memoryUsage / 100);
    const agentScore = peer.metadata.agentCount * 0.1;
    
    return latencyScore + cpuScore + memoryScore + agentScore;
  }

  /**
   * Get local connections (nearby peers)
   */
  private getLocalConnections(peerId: string): string[] {
    // Simplified: return peers with low latency
    return Array.from(this.peers.values())
      .filter(p => p.id !== peerId && p.metadata.networkLatency < 50)
      .map(p => p.id)
      .slice(0, 3);
  }

  /**
   * Get random connections for small world properties
   */
  private getRandomConnections(peerId: string, count: number): string[] {
    const availablePeers = Array.from(this.peers.keys())
      .filter(id => id !== peerId);
    
    const randomConnections: string[] = [];
    
    for (let i = 0; i < count && availablePeers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availablePeers.length);
      randomConnections.push(availablePeers.splice(randomIndex, 1)[0]);
    }
    
    return randomConnections;
  }

  /**
   * Get hub nodes (highly connected peers)
   */
  private getHubNodes(): string[] {
    const peerConnections = new Map<string, number>();
    
    // Count connections for each peer
    this.connections.forEach((connection, peerId) => {
      peerConnections.set(peerId, (peerConnections.get(peerId) || 0) + 1);
    });
    
    // Return top 20% most connected peers
    const sortedPeers = Array.from(peerConnections.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const hubCount = Math.max(1, Math.floor(sortedPeers.length * 0.2));
    return sortedPeers.slice(0, hubCount).map(([peerId]) => peerId);
  }

  /**
   * Calculate preferential attachment probabilities
   */
  private calculatePreferentialAttachment(peerId: string): Map<string, number> {
    const probabilities = new Map<string, number>();
    const totalConnections = this.connections.size;
    
    if (totalConnections === 0) {
      // Equal probability for all peers
      const equalProb = 1 / this.peers.size;
      this.peers.forEach((_, id) => {
        if (id !== peerId) {
          probabilities.set(id, equalProb);
        }
      });
    } else {
      // Probability proportional to existing connections
      this.connections.forEach((connection, id) => {
        if (id !== peerId) {
          const peerConnections = this.countPeerConnections(id);
          probabilities.set(id, peerConnections / totalConnections);
        }
      });
    }
    
    return probabilities;
  }

  /**
   * Count connections for a specific peer
   */
  private countPeerConnections(peerId: string): number {
    return this.connections.has(peerId) ? 1 : 0;
  }

  /**
   * Find nearest peers based on latency
   */
  private findNearestPeers(peerId: string, count: number): PeerInfo[] {
    return Array.from(this.peers.values())
      .filter(p => p.id !== peerId)
      .sort((a, b) => a.metadata.networkLatency - b.metadata.networkLatency)
      .slice(0, count);
  }

  /**
   * Suggest connection between two peers
   */
  private async suggestConnection(fromPeerId: string, toPeerId: string): Promise<void> {
    console.log(`🔗 Suggesting connection: ${fromPeerId} -> ${toPeerId}`);
    
    // This would typically send a message to the P2P Network Manager
    // to establish the connection
  }

  /**
   * Update routing table for efficient message routing
   */
  private async updateRoutingTable(): Promise<void> {
    console.log('🗺 Updating routing table...');
    
    // Clear existing routes
    this.routingTable.clear();
    
    // Calculate shortest paths using Floyd-Warshall algorithm
    const distances = new Map<string, Map<string, number>>();
    const nextHop = new Map<string, Map<string, string>>();
    
    // Initialize distances
    const allNodes = [this.nodeId, ...Array.from(this.peers.keys())];
    
    allNodes.forEach(nodeA => {
      distances.set(nodeA, new Map());
      nextHop.set(nodeA, new Map());
      
      allNodes.forEach(nodeB => {
        if (nodeA === nodeB) {
          distances.get(nodeA)!.set(nodeB, 0);
        } else if (this.connections.has(nodeB)) {
          const connection = this.connections.get(nodeB)!;
          distances.get(nodeA)!.set(nodeB, connection.latency);
          nextHop.get(nodeA)!.set(nodeB, nodeB);
        } else {
          distances.get(nodeA)!.set(nodeB, Infinity);
        }
      });
    });
    
    // Floyd-Warshall algorithm
    allNodes.forEach(k => {
      allNodes.forEach(i => {
        allNodes.forEach(j => {
          const distIK = distances.get(i)!.get(k)!;
          const distKJ = distances.get(k)!.get(j)!;
          const distIJ = distances.get(i)!.get(j)!;
          
          if (distIK + distKJ < distIJ) {
            distances.get(i)!.set(j, distIK + distKJ);
            nextHop.get(i)!.set(j, nextHop.get(i)!.get(k)!);
          }
        });
      });
    });
    
    // Build routing table
    this.peers.forEach((_, peerId) => {
      const route: string[] = [];
      let current = this.nodeId;
      
      while (current !== peerId) {
        const next = nextHop.get(current)!.get(peerId)!;
        if (next === undefined) break;
        route.push(next);
        current = next;
      }
      
      this.routingTable.set(peerId, route);
    });
  }

  /**
   * Verify network connectivity
   */
  private async verifyNetworkConnectivity(): Promise<boolean> {
    // Use BFS to check if all nodes are reachable
    const visited = new Set<string>();
    const queue = [this.nodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      
      visited.add(current);
      
      // Add connected peers to queue
      this.connections.forEach((connection, peerId) => {
        if (connection.status === 'connected' && !visited.has(peerId)) {
          queue.push(peerId);
        }
      });
    }
    
    return visited.size === this.peers.size + 1;
  }

  /**
   * Handle network partition
   */
  private async handleNetworkPartition(): Promise<void> {
    console.warn('⚠️ Handling network partition...');
    
    const partition: NetworkPartition = {
      id: `partition_${Date.now()}`,
      startTime: new Date(),
      affectedNodes: [],
      partitionType: 'complete',
      severity: 'high',
      recoveryStrategy: {
        type: 'automatic',
        timeout: 60000,
        retryCount: 3,
        fallbackNodes: [],
        escalationThreshold: 5
      },
      resolved: false
    };
    
    this.partitions.set(partition.id, partition);
    
    // Attempt to reconnect to isolated nodes
    await this.attemptPartitionRecovery(partition);
  }

  /**
   * Attempt to recover from network partition
   */
  private async attemptPartitionRecovery(partition: NetworkPartition): Promise<void> {
    console.log(`🔄 Attempting partition recovery: ${partition.id}`);
    
    // Implementation would attempt to reconnect to isolated nodes
    // This is a placeholder for the actual recovery logic
    
    setTimeout(() => {
      partition.resolved = true;
      console.log(`✅ Partition recovered: ${partition.id}`);
    }, partition.recoveryStrategy.timeout);
  }

  /**
   * Rebalance connections after topology changes
   */
  private async rebalanceConnections(): Promise<void> {
    console.log('⚖️ Rebalancing connections...');
    
    // Calculate ideal number of connections per node
    const idealConnections = Math.min(5, Math.floor(Math.sqrt(this.peers.size)));
    
    // Check if rebalancing is needed
    const currentConnections = this.connections.size;
    
    if (currentConnections < idealConnections) {
      // Add more connections
      const candidates = this.findConnectionCandidates(idealConnections - currentConnections);
      for (const candidate of candidates) {
        await this.suggestConnection(this.nodeId, candidate);
      }
    } else if (currentConnections > idealConnections * 1.5) {
      // Remove some connections
      const toRemove = this.findConnectionsToRemove(currentConnections - idealConnections);
      for (const peerId of toRemove) {
        console.log(`🔄 Removing connection to ${peerId}`);
        // Would signal to remove connection
      }
    }
  }

  /**
   * Find connection candidates for rebalancing
   */
  private findConnectionCandidates(count: number): string[] {
    const candidates = Array.from(this.peers.values())
      .filter(peer => !this.connections.has(peer.id))
      .sort((a, b) => this.calculatePeerScore(b) - this.calculatePeerScore(a))
      .slice(0, count)
      .map(peer => peer.id);
    
    return candidates;
  }

  /**
   * Find connections to remove for rebalancing
   */
  private findConnectionsToRemove(count: number): string[] {
    const toRemove = Array.from(this.connections.entries())
      .filter(([_, connection]) => connection.status === 'connected')
      .sort((a, b) => {
        const scoreA = this.calculateConnectionScore(a[1]);
        const scoreB = this.calculateConnectionScore(b[1]);
        return scoreA - scoreB; // Remove worst connections first
      })
      .slice(0, count)
      .map(([peerId]) => peerId);
    
    return toRemove;
  }

  /**
   * Calculate connection score for removal priority
   */
  private calculateConnectionScore(connection: Connection): number {
    const latencyScore = 1 / (connection.latency + 1);
    const activityScore = (Date.now() - connection.lastActivity.getTime()) / 1000 / 60; // Minutes since last activity
    const messageScore = (connection.messagesSent + connection.messagesReceived) / 100;
    
    return latencyScore + messageScore - activityScore;
  }

  /**
   * Detect network partitions
   */
  private detectPartitions(): void {
    // Check for nodes that haven't been seen recently
    const staleThreshold = 60000; // 1 minute
    const currentTime = Date.now();
    
    this.peers.forEach((peer, peerId) => {
      const timeSinceLastSeen = currentTime - peer.metadata.lastSeen.getTime();
      
      if (timeSinceLastSeen > staleThreshold) {
        console.warn(`⚠️ Potential partition detected: ${peerId} not seen for ${timeSinceLastSeen}ms`);
        
        // Check if this is a new partition
        const existingPartition = Array.from(this.partitions.values())
          .find(p => p.affectedNodes.includes(peerId) && !p.resolved);
        
        if (!existingPartition) {
          // Create new partition record
          const partition: NetworkPartition = {
            id: `partition_${Date.now()}`,
            startTime: new Date(),
            affectedNodes: [peerId],
            partitionType: 'partial',
            severity: 'medium',
            recoveryStrategy: {
              type: 'automatic',
              timeout: 30000,
              retryCount: 3,
              fallbackNodes: [],
              escalationThreshold: 3
            },
            resolved: false
          };
          
          this.partitions.set(partition.id, partition);
        }
      }
    });
  }

  /**
   * Update network metrics
   */
  private updateMetrics(): void {
    this.metrics.totalNodes = this.peers.size + 1;
    this.metrics.activeConnections = Array.from(this.connections.values())
      .filter(c => c.status === 'connected').length;
    
    this.metrics.averageLatency = this.calculateAverageLatency();
    this.metrics.networkThroughput = this.calculateNetworkThroughput();
    this.metrics.faultTolerance = this.calculateFaultTolerance();
    this.metrics.lastUpdated = new Date();
    
    // Update topology metrics
    this.topology.totalNodes = this.metrics.totalNodes;
    this.topology.activeConnections = this.metrics.activeConnections;
    this.topology.averageLatency = this.metrics.averageLatency;
    this.topology.meshDensity = this.calculateMeshDensity();
    this.topology.networkHealth = this.calculateNetworkHealth();
  }

  /**
   * Calculate average latency
   */
  private calculateAverageLatency(): number {
    const connections = Array.from(this.connections.values());
    if (connections.length === 0) return 0;
    
    const totalLatency = connections.reduce((sum, conn) => sum + conn.latency, 0);
    return totalLatency / connections.length;
  }

  /**
   * Calculate network throughput
   */
  private calculateNetworkThroughput(): number {
    const connections = Array.from(this.connections.values());
    if (connections.length === 0) return 0;
    
    const totalBandwidth = connections.reduce((sum, conn) => sum + conn.bandwidth, 0);
    return totalBandwidth;
  }

  /**
   * Calculate fault tolerance
   */
  private calculateFaultTolerance(): number {
    const totalNodes = this.metrics.totalNodes;
    if (totalNodes <= 1) return 0;
    
    // Simple calculation: percentage of nodes that can fail while maintaining connectivity
    const criticalNodes = Math.floor(totalNodes / 3);
    return (criticalNodes / totalNodes) * 100;
  }

  /**
   * Calculate mesh density
   */
  private calculateMeshDensity(): number {
    const totalNodes = this.topology.totalNodes;
    const maxConnections = (totalNodes * (totalNodes - 1)) / 2;
    
    if (maxConnections === 0) return 0;
    
    return (this.topology.activeConnections / maxConnections) * 100;
  }

  /**
   * Calculate network health
   */
  private calculateNetworkHealth(): number {
    const connectivityScore = Math.min(100, this.topology.meshDensity * 2);
    const latencyScore = Math.max(0, 100 - this.topology.averageLatency);
    const partitionScore = Math.max(0, 100 - (this.partitions.size * 20));
    
    return (connectivityScore + latencyScore + partitionScore) / 3;
  }

  /**
   * Get network visualization data
   */
  getVisualizationData(): NetworkVisualizationData {
    const nodes = [];
    const edges = [];
    
    // Add self node
    nodes.push({
      id: this.nodeId,
      label: 'Self',
      type: 'self' as const,
      status: 'online' as const,
      position: { x: 0, y: 0 },
      metrics: {
        cpu: 0,
        memory: 0,
        latency: 0,
        agentCount: 0
      }
    });
    
    // Add peer nodes
    this.peers.forEach((peer, peerId) => {
      nodes.push({
        id: peerId,
        label: peerId.substring(0, 8),
        type: 'peer' as const,
        status: this.connections.has(peerId) ? 'online' as const : 'offline' as const,
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        metrics: {
          cpu: peer.metadata.cpuUsage,
          memory: peer.metadata.memoryUsage,
          latency: peer.metadata.networkLatency,
          agentCount: peer.metadata.agentCount
        }
      });
    });
    
    // Add edges
    this.connections.forEach((connection, peerId) => {
      edges.push({
        from: this.nodeId,
        to: peerId,
        type: 'direct' as const,
        strength: connection.status === 'connected' ? 1 : 0.5,
        latency: connection.latency,
        bandwidth: connection.bandwidth
      });
    });
    
    return {
      nodes,
      edges,
      metadata: {
        totalNodes: this.topology.totalNodes,
        totalConnections: this.topology.activeConnections,
        networkHealth: this.topology.networkHealth,
        consensusState: 'active',
        lastUpdate: new Date()
      }
    };
  }

  /**
   * Get network metrics
   */
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
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
        performance: Math.max(0, 100 - this.topology.averageLatency),
        security: 100, // Placeholder
        reliability: this.metrics.faultTolerance
      },
      activeAlerts: [],
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate network recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.topology.meshDensity < 20) {
      recommendations.push('Consider adding more peer connections to improve network resilience');
    }
    
    if (this.topology.averageLatency > 100) {
      recommendations.push('High network latency detected. Consider optimizing routing or peer selection');
    }
    
    if (this.partitions.size > 0) {
      recommendations.push('Active network partitions detected. Review connection stability');
    }
    
    if (this.topology.activeConnections < 3) {
      recommendations.push('Low connection count. Network may be vulnerable to partitions');
    }
    
    return recommendations;
  }

  /**
   * Get topology information
   */
  getTopology(): NetworkTopology {
    return { ...this.topology };
  }

  /**
   * Get routing table
   */
  getRoutingTable(): Map<string, string[]> {
    return new Map(this.routingTable);
  }

  /**
   * Get network partitions
   */
  getPartitions(): NetworkPartition[] {
    return Array.from(this.partitions.values());
  }

  /**
   * Set topology algorithm
   */
  setTopologyAlgorithm(algorithm: TopologyAlgorithm): void {
    this.algorithm = algorithm;
    console.log(`🔄 Topology algorithm changed to: ${algorithm}`);
  }

  /**
   * Set routing strategy
   */
  setRoutingStrategy(strategy: RoutingStrategy): void {
    this.routingStrategy = strategy;
    console.log(`🗺 Routing strategy changed to: ${strategy}`);
  }

  /**
   * Force topology optimization
   */
  async optimizeTopology(): Promise<void> {
    console.log('⚙️ Optimizing network topology...');
    
    // Rebalance connections
    await this.rebalanceConnections();
    
    // Update routing table
    await this.updateRoutingTable();
    
    // Update metrics
    this.updateMetrics();
    
    console.log('✅ Topology optimization complete');
  }

  /**
   * Shutdown topology manager
   */
  shutdown(): void {
    console.log('🔌 Shutting down Mesh Topology Manager...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.peers.clear();
    this.connections.clear();
    this.routingTable.clear();
    this.partitions.clear();
    
    console.log('✅ Mesh Topology Manager shutdown complete');
  }
}

// Export singleton instance
let meshTopologyInstance: MeshTopology | null = null;

export const getMeshTopology = (nodeId: string, initialPeers: PeerInfo[] = []): MeshTopology => {
  if (!meshTopologyInstance) {
    meshTopologyInstance = new MeshTopology(nodeId, initialPeers);
  }
  return meshTopologyInstance;
};

export const resetMeshTopology = (): void => {
  if (meshTopologyInstance) {
    meshTopologyInstance.shutdown();
    meshTopologyInstance = null;
  }
};
