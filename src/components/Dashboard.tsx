import React, { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { useSwarm } from '../contexts/SwarmContext'
import SwarmVisualization from './SwarmVisualization'
import StatisticsView from './StatisticsView'
import ControlPanel from './ControlPanel'
import AgentList from './AgentList'
import RepositoryList from './RepositoryList'
import '../styles/Dashboard.css'

const Dashboard: React.FC = () => {
  const { user, logout } = useUser()
  const { stats, agents, repositories, isSwarmActive, startSwarm, stopSwarm } = useSwarm()
  const [selectedView, setSelectedView] = useState<'swarm' | 'statistics' | 'agents' | 'projects'>('swarm')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Auto-start swarm when dashboard loads
    if (!isSwarmActive) {
      startSwarm()
    }
  }, [isSwarmActive, startSwarm])

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleSwarmToggle = () => {
    if (isSwarmActive) {
      stopSwarm()
    } else {
      startSwarm()
    }
  }

  if (!user) {
    return (
      <div className="dashboard-error">
        <h2>Access Denied</h2>
        <p>Please authenticate to access the dashboard.</p>
      </div>
    )
  }

  return (
    <div className={`dashboard ${isFullscreen ? 'fullscreen' : ''}`}>
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title glow-text">SASI@home</h1>
          <div className="user-info">
            <img src={user.avatarUrl} alt={user.username} className="user-avatar" />
            <span className="username">{user.username}</span>
            <div className="user-stats">
              <span className="contribution-score">
                {user.contributionScore.toLocaleString()} pts
              </span>
              <span className="active-agents">
                {user.activeAgents} agents
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="view-selector">
            <button 
              className={`view-btn ${selectedView === 'swarm' ? 'active' : ''}`}
              onClick={() => setSelectedView('swarm')}
            >
              Swarm View
            </button>
            <button 
              className={`view-btn ${selectedView === 'agents' ? 'active' : ''}`}
              onClick={() => setSelectedView('agents')}
            >
              Agents
            </button>
            <button 
              className={`view-btn ${selectedView === 'projects' ? 'active' : ''}`}
              onClick={() => setSelectedView('projects')}
            >
              Projects
            </button>
            <button 
              className={`view-btn ${selectedView === 'statistics' ? 'active' : ''}`}
              onClick={() => setSelectedView('statistics')}
            >
              Statistics
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="control-btn"
            onClick={handleFullscreenToggle}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </button>
          <button 
            className={`control-btn swarm-toggle ${isSwarmActive ? 'active' : ''}`}
            onClick={handleSwarmToggle}
            title={isSwarmActive ? 'Stop Swarm' : 'Start Swarm'}
          >
            {isSwarmActive ? '⏸️' : '▶️'}
          </button>
          <button 
            className="control-btn logout-btn"
            onClick={logout}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {selectedView !== 'statistics' && (
          <aside className="sidebar">
            <ControlPanel />
          </aside>
        )}

        <main className={`main-content ${selectedView === 'statistics' ? 'full-width' : ''}`}>
          {selectedView === 'swarm' && (
            <div className="visualization-container">
              <SwarmVisualization 
                agents={agents}
                repositories={repositories}
                isActive={isSwarmActive}
              />
            </div>
          )}
          
          {selectedView === 'statistics' && (
            <div className="content-panel">
              <StatisticsView 
                stats={stats}
                agents={agents}
                isActive={isSwarmActive}
              />
            </div>
          )}
          
          {selectedView === 'agents' && (
            <div className="content-panel">
              <AgentList agents={agents} />
            </div>
          )}
          
          {selectedView === 'projects' && (
            <div className="content-panel">
              <RepositoryList repositories={repositories} />
            </div>
          )}
        </main>
      </div>

      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="stat-item">
            <span className="stat-label">Network Status:</span>
            <span className={`status-indicator ${isSwarmActive ? 'status-active' : 'status-inactive'}`}></span>
            <span className="stat-value">{isSwarmActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ASI Progress:</span>
            <span className="stat-value">{stats.asiProgress.toFixed(2)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Global Contributors:</span>
            <span className="stat-value">{stats.globalContributors.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Network Efficiency:</span>
            <span className="stat-value">{stats.networkEfficiency.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="footer-info">
          <span>SASI@home v1.0.0 | Distributed Intelligence Network</span>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard