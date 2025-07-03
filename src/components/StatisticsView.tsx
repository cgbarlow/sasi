import React from 'react'
import { SwarmStats, Agent } from '../contexts/SwarmContext'
import '../styles/StatisticsView.css'

interface StatisticsViewProps {
  stats: SwarmStats
  agents: Agent[]
  isActive: boolean
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ stats, agents, isActive }) => {
  // Calculate additional statistics
  const agentsByType = agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const agentsByStatus = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const averageEfficiency = agents.length > 0 
    ? agents.reduce((sum, agent) => sum + agent.efficiency, 0) / agents.length 
    : 0

  const totalTasksCompleted = agents.reduce((sum, agent) => sum + agent.completedTasks, 0)

  return (
    <div className="statistics-view">
      <div className="statistics-header">
        <h1 className="statistics-title">SASI@home Statistics</h1>
        <div className="status-indicator">
          <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'SWARM ACTIVE' : 'SWARM INACTIVE'}
          </span>
        </div>
      </div>

      <div className="statistics-grid">
        {/* Overall Stats */}
        <div className="stat-section overview">
          <h2>Overview</h2>
          <div className="stat-cards">
            <div className="stat-card primary">
              <div className="stat-icon">🤖</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalAgents}</div>
                <div className="stat-label">Total Agents</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.tasksCompleted}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-value">{averageEfficiency.toFixed(1)}%</div>
                <div className="stat-label">Avg Efficiency</div>
              </div>
            </div>
            
            <div className="stat-card info">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.processingUnits}</div>
                <div className="stat-label">Processing Units</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Types Distribution */}
        <div className="stat-section agent-types">
          <h2>Agent Types</h2>
          <div className="agent-type-grid">
            {Object.entries(agentsByType).map(([type, count]) => (
              <div key={type} className="agent-type-card">
                <div className="agent-type-header">
                  <div className={`agent-type-icon ${type}`}>
                    {type === 'researcher' && '🔬'}
                    {type === 'coder' && '💻'}
                    {type === 'tester' && '🧪'}
                    {type === 'reviewer' && '👁️'}
                    {type === 'debugger' && '🐛'}
                  </div>
                  <div className="agent-type-name">{type}</div>
                </div>
                <div className="agent-type-count">{count}</div>
                <div className="agent-type-percentage">
                  {((count / agents.length) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="stat-section status-distribution">
          <h2>Agent Status</h2>
          <div className="status-bars">
            {Object.entries(agentsByStatus).map(([status, count]) => (
              <div key={status} className="status-bar-container">
                <div className="status-bar-header">
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-fill ${status}`}
                    style={{ width: `${(count / agents.length) * 100}%` }}
                  ></div>
                </div>
                <div className="status-percentage">
                  {((count / agents.length) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="stat-section performance">
          <h2>Performance Metrics</h2>
          <div className="performance-grid">
            <div className="performance-metric">
              <h3>Network Efficiency</h3>
              <div className="metric-display">
                <div className="metric-value">{stats.networkEfficiency.toFixed(1)}%</div>
                <div className="metric-bar">
                  <div 
                    className="metric-fill efficiency"
                    style={{ width: `${stats.networkEfficiency}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="performance-metric">
              <h3>ASI Progress</h3>
              <div className="metric-display">
                <div className="metric-value">{stats.asiProgress.toFixed(1)}%</div>
                <div className="metric-bar">
                  <div 
                    className="metric-fill progress"
                    style={{ width: `${stats.asiProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="performance-metric">
              <h3>Total Tasks</h3>
              <div className="metric-display">
                <div className="metric-value">{totalTasksCompleted}</div>
                <div className="metric-subtitle">across all agents</div>
              </div>
            </div>
            
            <div className="performance-metric">
              <h3>Global Contributors</h3>
              <div className="metric-display">
                <div className="metric-value">{stats.globalContributors.toLocaleString()}</div>
                <div className="metric-subtitle">worldwide</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="stat-section activity">
          <h2>Real-time Activity</h2>
          <div className="activity-feed">
            {agents.filter(agent => agent.status === 'active').slice(0, 8).map(agent => (
              <div key={agent.id} className="activity-item">
                <div className={`activity-indicator ${agent.type}`}></div>
                <div className="activity-details">
                  <div className="activity-agent">{agent.name}</div>
                  <div className="activity-task">{agent.currentTask}</div>
                  <div className="activity-repo">{agent.repository}</div>
                </div>
                <div className="activity-progress">
                  <div className="progress-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="circle"
                        strokeDasharray={`${agent.progress * 100}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" className="percentage">{Math.round(agent.progress * 100)}%</text>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsView