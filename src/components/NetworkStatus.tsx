/**
 * Network Status Component - P2P Network visualization and monitoring
 * Displays real-time network topology, peer connections, and consensus state
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  NetworkTopology,
  PeerInfo,
  NetworkHealth,
  NetworkMetrics,
  NetworkVisualizationData,
  P2PNetworkStats,
  ConsensusState,
  NetworkPartition
} from '../types/network';
import { getP2PNetworkManager } from '../services/P2PNetworkManager';
import { getMeshTopology } from '../services/MeshTopology';
import { getConsensusEngine, ConsensusAlgorithm } from '../services/ConsensusEngine';

// Chart.js imports for visualizations
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface NetworkStatusProps {
  className?: string;
  onNetworkHealthChange?: (health: NetworkHealth) => void;
  onTopologyChange?: (topology: NetworkTopology) => void;
}

interface NetworkStatusState {
  isConnected: boolean;
  networkHealth: NetworkHealth;
  topology: NetworkTopology;
  metrics: NetworkMetrics;
  stats: P2PNetworkStats;
  consensusState: ConsensusState;
  peers: PeerInfo[];
  partitions: NetworkPartition[];
  visualizationData: NetworkVisualizationData;
  selectedPeer: PeerInfo | null;
  viewMode: 'overview' | 'topology' | 'consensus' | 'metrics';
  autoRefresh: boolean;
  refreshInterval: number;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({
  className = '',
  onNetworkHealthChange,
  onTopologyChange
}) => {
  const [state, setState] = useState<NetworkStatusState>({
    isConnected: false,
    networkHealth: {
      overallScore: 0,
      componentScores: {
        connectivity: 0,
        consensus: 0,
        performance: 0,
        security: 0,
        reliability: 0
      },
      activeAlerts: [],
      recommendations: []
    },
    topology: {
      nodeId: '',
      peers: new Map(),
      connections: new Map(),
      meshDensity: 0,
      averageLatency: 0,
      totalNodes: 0,
      activeConnections: 0,
      networkHealth: 0
    },
    metrics: {
      totalNodes: 0,
      activeConnections: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      networkThroughput: 0,
      consensusLatency: 0,
      faultTolerance: 0,
      uptime: 0,
      lastUpdated: new Date()
    },
    stats: {
      totalPeers: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      averageLatency: 0,
      uptime: 0,
      startTime: new Date()
    },
    consensusState: {
      epoch: 0,
      leader: '',
      proposals: new Map(),
      votes: new Map(),
      committed: [],
      pending: []
    },
    peers: [],
    partitions: [],
    visualizationData: {
      nodes: [],
      edges: [],
      metadata: {
        totalNodes: 0,
        totalConnections: 0,
        networkHealth: 0,
        consensusState: 'inactive',
        lastUpdate: new Date()
      }
    },
    selectedPeer: null,
    viewMode: 'overview',
    autoRefresh: true,
    refreshInterval: 5000
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize network managers
  const networkManager = getP2PNetworkManager();
  const meshTopology = getMeshTopology('current-node');
  const consensusEngine = getConsensusEngine({
    algorithm: 'raft' as ConsensusAlgorithm,
    nodeId: 'current-node',
    byzantineFaultTolerance: 0.33,
    consensusTimeout: 30000,
    blockTime: 5000,
    maxBlockSize: 1024 * 1024,
    enablePostQuantumCrypto: false,
    validatorNodes: ['current-node']
  });

  // Update network data
  const updateNetworkData = useCallback(async () => {
    try {
      const [health, topology, metrics, stats, consensusState, peers, partitions, visualizationData] = await Promise.all([
        meshTopology.getNetworkHealth(),
        meshTopology.getTopology(),
        meshTopology.getMetrics(),
        networkManager.getNetworkStats(),
        consensusEngine.getState(),
        networkManager.getConnectedPeers(),
        meshTopology.getPartitions(),
        meshTopology.getVisualizationData()
      ]);

      setState(prev => ({
        ...prev,
        isConnected: networkManager.isReady(),
        networkHealth: health,
        topology,
        metrics,
        stats,
        consensusState,
        peers,
        partitions,
        visualizationData
      }));

      // Notify parent components
      if (onNetworkHealthChange) {
        onNetworkHealthChange(health);
      }
      if (onTopologyChange) {
        onTopologyChange(topology);
      }

    } catch (error) {
      console.error('Failed to update network data:', error);
    }
  }, [networkManager, meshTopology, consensusEngine, onNetworkHealthChange, onTopologyChange]);

  // Setup auto-refresh
  useEffect(() => {
    if (state.autoRefresh) {
      refreshIntervalRef.current = setInterval(updateNetworkData, state.refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.autoRefresh, state.refreshInterval, updateNetworkData]);

  // Initial data load
  useEffect(() => {
    updateNetworkData();
  }, [updateNetworkData]);

  // Handle peer selection
  const handlePeerSelect = (peer: PeerInfo) => {
    setState(prev => ({
      ...prev,
      selectedPeer: peer
    }));
  };

  // Handle view mode change
  const handleViewModeChange = (mode: NetworkStatusState['viewMode']) => {
    setState(prev => ({
      ...prev,
      viewMode: mode
    }));
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setState(prev => ({
      ...prev,
      autoRefresh: !prev.autoRefresh
    }));
  };

  // Manual refresh
  const handleManualRefresh = () => {
    updateNetworkData();
  };

  // Render network overview
  const renderOverview = () => {
    const healthColor = state.networkHealth.overallScore > 80 ? 'green' : 
                       state.networkHealth.overallScore > 60 ? 'yellow' : 'red';

    return (
      <div className="network-overview">
        <div className="network-status-grid">
          <div className="status-card">
            <h3>Network Health</h3>
            <div className={`health-score ${healthColor}`}>
              {state.networkHealth.overallScore.toFixed(1)}%
            </div>
            <div className="health-components">
              <div className="health-component">
                <span>Connectivity</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${state.networkHealth.componentScores.connectivity}%` }}
                  />
                </div>
              </div>
              <div className="health-component">
                <span>Consensus</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${state.networkHealth.componentScores.consensus}%` }}
                  />
                </div>
              </div>
              <div className="health-component">
                <span>Performance</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${state.networkHealth.componentScores.performance}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="status-card">
            <h3>Network Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Nodes</span>
                <span className="stat-value">{state.topology.totalNodes}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Connections</span>
                <span className="stat-value">{state.topology.activeConnections}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mesh Density</span>
                <span className="stat-value">{state.topology.meshDensity.toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Latency</span>
                <span className="stat-value">{state.topology.averageLatency.toFixed(0)}ms</span>
              </div>
            </div>
          </div>

          <div className="status-card">
            <h3>Consensus State</h3>
            <div className="consensus-info">
              <div className="consensus-item">
                <span className="consensus-label">Epoch</span>
                <span className="consensus-value">{state.consensusState.epoch}</span>
              </div>
              <div className="consensus-item">
                <span className="consensus-label">Leader</span>
                <span className="consensus-value">{state.consensusState.leader || 'None'}</span>
              </div>
              <div className="consensus-item">
                <span className="consensus-label">Pending</span>
                <span className="consensus-value">{state.consensusState.pending.length}</span>
              </div>
              <div className="consensus-item">
                <span className="consensus-label">Committed</span>
                <span className="consensus-value">{state.consensusState.committed.length}</span>
              </div>
            </div>
          </div>

          <div className="status-card">
            <h3>Traffic Stats</h3>
            <div className="traffic-info">
              <div className="traffic-item">
                <span className="traffic-label">Messages Sent</span>
                <span className="traffic-value">{state.stats.messagesSent.toLocaleString()}</span>
              </div>
              <div className="traffic-item">
                <span className="traffic-label">Messages Received</span>
                <span className="traffic-value">{state.stats.messagesReceived.toLocaleString()}</span>
              </div>
              <div className="traffic-item">
                <span className="traffic-label">Bytes Transferred</span>
                <span className="traffic-value">{(state.stats.bytesTransferred / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="traffic-item">
                <span className="traffic-label">Uptime</span>
                <span className="traffic-value">{Math.floor(state.stats.uptime / 1000 / 60)} min</span>
              </div>
            </div>
          </div>
        </div>

        {state.networkHealth.activeAlerts.length > 0 && (
          <div className="network-alerts">
            <h3>Active Alerts</h3>
            <div className="alerts-list">
              {state.networkHealth.activeAlerts.map(alert => (
                <div key={alert.id} className={`alert alert-${alert.severity}`}>
                  <span className="alert-type">{alert.type}</span>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-timestamp">{alert.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.networkHealth.recommendations.length > 0 && (
          <div className="network-recommendations">
            <h3>Recommendations</h3>
            <ul className="recommendations-list">
              {state.networkHealth.recommendations.map((rec, index) => (
                <li key={index} className="recommendation">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render network topology visualization
  const renderTopology = () => {
    return (
      <div className="network-topology">
        <div className="topology-header">
          <h3>Network Topology</h3>
          <div className="topology-controls">
            <button onClick={() => meshTopology.optimizeTopology()}>
              Optimize Topology
            </button>
          </div>
        </div>
        
        <div className="topology-visualization">
          <svg width="100%" height="400" className="topology-svg">
            {/* Render network nodes */}
            {state.visualizationData.nodes.map(node => (
              <g key={node.id}>
                <circle
                  cx={node.position.x * 8 + 50}
                  cy={node.position.y * 4 + 50}
                  r={node.type === 'self' ? 15 : 10}
                  fill={node.status === 'online' ? '#22C55E' : '#EF4444'}
                  stroke={node.type === 'self' ? '#1F2937' : '#6B7280'}
                  strokeWidth={node.type === 'self' ? 3 : 1}
                  className="network-node"
                  onClick={() => {
                    const peer = state.peers.find(p => p.id === node.id);
                    if (peer) handlePeerSelect(peer);
                  }}
                />
                <text
                  x={node.position.x * 8 + 50}
                  y={node.position.y * 4 + 70}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                >
                  {node.label}
                </text>
              </g>
            ))}
            
            {/* Render network edges */}
            {state.visualizationData.edges.map((edge, index) => {
              const fromNode = state.visualizationData.nodes.find(n => n.id === edge.from);
              const toNode = state.visualizationData.nodes.find(n => n.id === edge.to);
              
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={index}
                  x1={fromNode.position.x * 8 + 50}
                  y1={fromNode.position.y * 4 + 50}
                  x2={toNode.position.x * 8 + 50}
                  y2={toNode.position.y * 4 + 50}
                  stroke={edge.type === 'direct' ? '#3B82F6' : '#9CA3AF'}
                  strokeWidth={edge.strength * 2}
                  opacity={0.7}
                  className="network-edge"
                />
              );
            })}
          </svg>
        </div>

        <div className="topology-stats">
          <div className="stat-group">
            <h4>Topology Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span>Mesh Density</span>
                <span>{state.topology.meshDensity.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span>Average Latency</span>
                <span>{state.topology.averageLatency.toFixed(0)}ms</span>
              </div>
              <div className="metric-item">
                <span>Network Health</span>
                <span>{state.topology.networkHealth.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render consensus information
  const renderConsensus = () => {
    return (
      <div className="network-consensus">
        <div className="consensus-header">
          <h3>Consensus State</h3>
          <div className="consensus-status">
            <span className={`status-indicator ${state.consensusState.leader ? 'active' : 'inactive'}`}>
              {state.consensusState.leader ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="consensus-details">
          <div className="consensus-info-grid">
            <div className="info-card">
              <h4>Current State</h4>
              <div className="state-details">
                <div className="state-item">
                  <span>Epoch</span>
                  <span>{state.consensusState.epoch}</span>
                </div>
                <div className="state-item">
                  <span>Leader</span>
                  <span>{state.consensusState.leader || 'None'}</span>
                </div>
                <div className="state-item">
                  <span>Proposals</span>
                  <span>{state.consensusState.proposals.size}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h4>Transaction Queue</h4>
              <div className="queue-stats">
                <div className="queue-item">
                  <span>Pending</span>
                  <span>{state.consensusState.pending.length}</span>
                </div>
                <div className="queue-item">
                  <span>Committed</span>
                  <span>{state.consensusState.committed.length}</span>
                </div>
              </div>
            </div>
          </div>

          {state.consensusState.pending.length > 0 && (
            <div className="pending-proposals">
              <h4>Pending Proposals</h4>
              <div className="proposals-list">
                {state.consensusState.pending.slice(0, 5).map(proposalId => (
                  <div key={proposalId} className="proposal-item">
                    <span className="proposal-id">{proposalId}</span>
                    <span className="proposal-votes">
                      {state.consensusState.votes.get(proposalId)?.size || 0} votes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render network metrics charts
  const renderMetrics = () => {
    const latencyData = {
      labels: ['Last 10 min', 'Last 5 min', 'Current'],
      datasets: [
        {
          label: 'Average Latency (ms)',
          data: [state.metrics.averageLatency + 10, state.metrics.averageLatency + 5, state.metrics.averageLatency],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    };

    const throughputData = {
      labels: ['Messages/sec', 'Bytes/sec'],
      datasets: [
        {
          label: 'Network Throughput',
          data: [state.metrics.messagesPerSecond, state.metrics.networkThroughput / 1024],
          backgroundColor: ['#10B981', '#F59E0B'],
          borderColor: ['#059669', '#D97706'],
          borderWidth: 1
        }
      ]
    };

    return (
      <div className="network-metrics">
        <div className="metrics-header">
          <h3>Network Metrics</h3>
          <div className="metrics-controls">
            <button onClick={handleManualRefresh}>Refresh</button>
          </div>
        </div>

        <div className="metrics-charts">
          <div className="chart-container">
            <h4>Latency Trend</h4>
            <Line data={latencyData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>

          <div className="chart-container">
            <h4>Throughput</h4>
            <Bar data={throughputData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="metrics-table">
          <h4>Detailed Metrics</h4>
          <table className="metrics-data-table">
            <tbody>
              <tr>
                <td>Total Nodes</td>
                <td>{state.metrics.totalNodes}</td>
              </tr>
              <tr>
                <td>Active Connections</td>
                <td>{state.metrics.activeConnections}</td>
              </tr>
              <tr>
                <td>Messages/Second</td>
                <td>{state.metrics.messagesPerSecond.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Network Throughput</td>
                <td>{(state.metrics.networkThroughput / 1024).toFixed(2)} KB/s</td>
              </tr>
              <tr>
                <td>Consensus Latency</td>
                <td>{state.metrics.consensusLatency.toFixed(0)}ms</td>
              </tr>
              <tr>
                <td>Fault Tolerance</td>
                <td>{state.metrics.faultTolerance.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`network-status ${className}`}>
      <div className="network-status-header">
        <div className="status-info">
          <h2>P2P Network Status</h2>
          <div className={`connection-status ${state.isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-indicator" />
            <span>{state.isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="view-controls">
          <div className="view-tabs">
            <button 
              className={state.viewMode === 'overview' ? 'active' : ''}
              onClick={() => handleViewModeChange('overview')}
            >
              Overview
            </button>
            <button 
              className={state.viewMode === 'topology' ? 'active' : ''}
              onClick={() => handleViewModeChange('topology')}
            >
              Topology
            </button>
            <button 
              className={state.viewMode === 'consensus' ? 'active' : ''}
              onClick={() => handleViewModeChange('consensus')}
            >
              Consensus
            </button>
            <button 
              className={state.viewMode === 'metrics' ? 'active' : ''}
              onClick={() => handleViewModeChange('metrics')}
            >
              Metrics
            </button>
          </div>
          
          <div className="refresh-controls">
            <button 
              className={`auto-refresh ${state.autoRefresh ? 'active' : ''}`}
              onClick={toggleAutoRefresh}
            >
              Auto Refresh
            </button>
            <button onClick={handleManualRefresh}>
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      <div className="network-status-content">
        {state.viewMode === 'overview' && renderOverview()}
        {state.viewMode === 'topology' && renderTopology()}
        {state.viewMode === 'consensus' && renderConsensus()}
        {state.viewMode === 'metrics' && renderMetrics()}
      </div>

      {state.selectedPeer && (
        <div className="peer-details-modal">
          <div className="modal-backdrop" onClick={() => setState(prev => ({ ...prev, selectedPeer: null }))} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Peer Details</h3>
              <button onClick={() => setState(prev => ({ ...prev, selectedPeer: null }))}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="peer-info">
                <div className="peer-field">
                  <span>ID:</span>
                  <span>{state.selectedPeer.id}</span>
                </div>
                <div className="peer-field">
                  <span>Protocols:</span>
                  <span>{state.selectedPeer.protocols.join(', ')}</span>
                </div>
                <div className="peer-field">
                  <span>CPU Usage:</span>
                  <span>{state.selectedPeer.metadata.cpuUsage}%</span>
                </div>
                <div className="peer-field">
                  <span>Memory Usage:</span>
                  <span>{state.selectedPeer.metadata.memoryUsage}%</span>
                </div>
                <div className="peer-field">
                  <span>Network Latency:</span>
                  <span>{state.selectedPeer.metadata.networkLatency}ms</span>
                </div>
                <div className="peer-field">
                  <span>Agent Count:</span>
                  <span>{state.selectedPeer.metadata.agentCount}</span>
                </div>
                <div className="peer-field">
                  <span>Last Seen:</span>
                  <span>{state.selectedPeer.metadata.lastSeen.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;
