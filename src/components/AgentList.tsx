import React, { useState } from 'react'
import { Agent } from '../contexts/SwarmContext'
import '../styles/AgentList.css'

interface AgentListProps {
  agents: Agent[]
}

const AgentList: React.FC<AgentListProps> = ({ agents }) => {
  const [sortBy, setSortBy] = useState<'type' | 'status' | 'efficiency' | 'tasks'>('efficiency')
  const [filterType, setFilterType] = useState<Agent['type'] | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<Agent['status'] | 'all'>('all')

  const filteredAndSortedAgents = agents
    .filter(agent => 
      (filterType === 'all' || agent.type === filterType) &&
      (filterStatus === 'all' || agent.status === filterStatus)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'type':
          return a.type.localeCompare(b.type)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'efficiency':
          return b.efficiency - a.efficiency
        case 'tasks':
          return b.completedTasks - a.completedTasks
        default:
          return 0
      }
    })

  const getStatusIcon = (status: Agent['status']): string => {
    switch (status) {
      case 'active': return '🟢'
      case 'processing': return '🟡'
      case 'idle': return '⚪'
      case 'completed': return '🔵'
      default: return '⚫'
    }
  }

  const getTypeIcon = (type: Agent['type']): string => {
    switch (type) {
      case 'researcher': return '🔬'
      case 'coder': return '💻'
      case 'tester': return '🧪'
      case 'reviewer': return '👁️'
      case 'debugger': return '🐛'
      default: return '🤖'
    }
  }

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 80) return 'var(--success-text)'
    if (efficiency >= 60) return 'var(--accent-text)'
    if (efficiency >= 40) return 'var(--secondary-text)'
    return 'var(--warning-text)'
  }

  return (
    <div className="agent-list">
      <div className="list-header">
        <h2 className="list-title">Active Agents</h2>
        <div className="agent-count">
          {filteredAndSortedAgents.length} of {agents.length} agents
        </div>
      </div>

      <div className="list-controls">
        <div className="filter-group">
          <label>Filter by Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as Agent['type'] | 'all')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="researcher">Researcher</option>
            <option value="coder">Coder</option>
            <option value="tester">Tester</option>
            <option value="reviewer">Reviewer</option>
            <option value="debugger">Debugger</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as Agent['status'] | 'all')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="processing">Processing</option>
            <option value="idle">Idle</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'type' | 'status' | 'efficiency' | 'tasks')}
            className="filter-select"
          >
            <option value="efficiency">Efficiency</option>
            <option value="tasks">Completed Tasks</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="agent-grid">
        {filteredAndSortedAgents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="agent-header">
              <div className="agent-type">
                <span className="type-icon">{getTypeIcon(agent.type)}</span>
                <span className="type-name">{agent.type}</span>
              </div>
              <div className="agent-status">
                <span className="status-icon">{getStatusIcon(agent.status)}</span>
                <span className="status-name">{agent.status}</span>
              </div>
            </div>

            <div className="agent-info">
              <div className="info-item">
                <span className="info-label">Owner:</span>
                <span className="info-value">{agent.owner}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Repository:</span>
                <span className="info-value">{agent.repository}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Branch:</span>
                <span className="info-value">{agent.branch}</span>
              </div>
            </div>

            <div className="agent-task">
              <span className="task-label">Current Task:</span>
              <p className="task-description">{agent.currentTask}</p>
            </div>

            <div className="agent-metrics">
              <div className="metric">
                <span className="metric-label">Efficiency</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ 
                      width: `${agent.efficiency}%`,
                      backgroundColor: getEfficiencyColor(agent.efficiency)
                    }}
                  />
                </div>
                <span 
                  className="metric-value"
                  style={{ color: getEfficiencyColor(agent.efficiency) }}
                >
                  {agent.efficiency.toFixed(1)}%
                </span>
              </div>

              <div className="metric">
                <span className="metric-label">Completed Tasks</span>
                <span className="metric-number">{agent.completedTasks}</span>
              </div>
            </div>

            <div className="agent-actions">
              <button className="action-btn monitor">
                📊 Monitor
              </button>
              <button className="action-btn pause">
                ⏸️ Pause
              </button>
              <button className="action-btn details">
                ℹ️ Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedAgents.length === 0 && (
        <div className="empty-state">
          <h3>No agents found</h3>
          <p>Try adjusting your filters or spawn new agents.</p>
        </div>
      )}
    </div>
  )
}

export default AgentList