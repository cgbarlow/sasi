import React from 'react'
import { SwarmStats } from '../contexts/SwarmContext'
import '../styles/StatsPanel.css'

interface StatsPanelProps {
  stats: SwarmStats
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 80) return 'var(--success-text)'
    if (efficiency >= 60) return 'var(--accent-text)'
    return 'var(--warning-text)'
  }

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'var(--success-text)'
    if (progress >= 50) return 'var(--accent-text)'
    return 'var(--primary-text)'
  }

  return (
    <div className="stats-panel">
      <div className="panel-header">
        <h3 className="panel-title">Swarm Statistics</h3>
        <div className="live-indicator">
          <span className="status-indicator status-active"></span>
          <span className="live-text">LIVE</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalAgents)}</div>
            <div className="stat-label">Total Agents</div>
            <div className="stat-sublabel">
              {stats.activeAgents} active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.globalContributors)}</div>
            <div className="stat-label">Contributors</div>
            <div className="stat-sublabel">
              Worldwide network
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.tasksCompleted)}</div>
            <div className="stat-label">Tasks Completed</div>
            <div className="stat-sublabel">
              All time total
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRepositories}</div>
            <div className="stat-label">Repositories</div>
            <div className="stat-sublabel">
              Active projects
            </div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <h4>ASI Progress</h4>
          <span 
            className="progress-value"
            style={{ color: getProgressColor(stats.asiProgress) }}
          >
            {stats.asiProgress.toFixed(2)}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${stats.asiProgress}%`,
              backgroundColor: getProgressColor(stats.asiProgress)
            }}
          />
        </div>
        <div className="progress-milestones">
          <div className="milestone">
            <div className="milestone-marker" style={{ left: '25%' }}></div>
            <div className="milestone-label">Foundation</div>
          </div>
          <div className="milestone">
            <div className="milestone-marker" style={{ left: '50%' }}></div>
            <div className="milestone-label">Integration</div>
          </div>
          <div className="milestone">
            <div className="milestone-marker" style={{ left: '75%' }}></div>
            <div className="milestone-label">Optimization</div>
          </div>
          <div className="milestone">
            <div className="milestone-marker" style={{ left: '100%' }}></div>
            <div className="milestone-label">ASI</div>
          </div>
        </div>
      </div>

      <div className="efficiency-section">
        <div className="efficiency-header">
          <h4>Network Efficiency</h4>
          <span 
            className="efficiency-value"
            style={{ color: getEfficiencyColor(stats.networkEfficiency) }}
          >
            {stats.networkEfficiency.toFixed(1)}%
          </span>
        </div>
        <div className="efficiency-chart">
          <div className="efficiency-bars">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="efficiency-bar"
                style={{
                  height: `${Math.random() * 100}%`,
                  backgroundColor: i < (stats.networkEfficiency / 10) ? 
                    getEfficiencyColor(stats.networkEfficiency) : 
                    'var(--border-color)',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="real-time-section">
        <h4>Real-time Activity</h4>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🔬</div>
            <div className="activity-text">
              <span className="activity-type">Research</span>
              <span className="activity-desc">Analyzing quantum algorithms</span>
            </div>
            <div className="activity-time">2s ago</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">💻</div>
            <div className="activity-text">
              <span className="activity-type">Code</span>
              <span className="activity-desc">Implementing neural pathways</span>
            </div>
            <div className="activity-time">5s ago</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🧪</div>
            <div className="activity-text">
              <span className="activity-type">Test</span>
              <span className="activity-desc">Validating swarm behavior</span>
            </div>
            <div className="activity-time">12s ago</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🔍</div>
            <div className="activity-text">
              <span className="activity-type">Review</span>
              <span className="activity-desc">Security audit complete</span>
            </div>
            <div className="activity-time">1m ago</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel