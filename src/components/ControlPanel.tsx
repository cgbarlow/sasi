import React, { useState } from 'react'
import { useSwarm } from '../contexts/SwarmContext'
import '../styles/ControlPanel.css'

const ControlPanel: React.FC = () => {
  const { addAgent, isSwarmActive, startSwarm, stopSwarm } = useSwarm()
  const [selectedAgentType, setSelectedAgentType] = useState<'researcher' | 'coder' | 'tester' | 'reviewer' | 'debugger'>('coder')

  const handleAddAgent = () => {
    addAgent(selectedAgentType)
  }

  const handleSwarmToggle = () => {
    if (isSwarmActive) {
      stopSwarm()
    } else {
      startSwarm()
    }
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3 className="panel-title">Swarm Control</h3>
      </div>

      <div className="control-section">
        <div className="section-header">
          <h4>System Control</h4>
        </div>
        
        <div className="control-grid">
          <button 
            className={`control-button ${isSwarmActive ? 'stop' : 'start'}`}
            onClick={handleSwarmToggle}
          >
            {isSwarmActive ? '⏸️ Stop Swarm' : '▶️ Start Swarm'}
          </button>
          
          <button className="control-button secondary">
            🔄 Restart System
          </button>
          
          <button className="control-button secondary">
            📊 Export Data
          </button>
          
          <button className="control-button secondary">
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="section-header">
          <h4>Agent Management</h4>
        </div>
        
        <div className="agent-spawn-controls">
          <div className="form-group">
            <label htmlFor="agent-type">Agent Type:</label>
            <select 
              id="agent-type"
              value={selectedAgentType}
              onChange={(e) => setSelectedAgentType(e.target.value as 'researcher' | 'coder' | 'tester' | 'reviewer' | 'debugger')}
              className="agent-type-select"
            >
              <option value="researcher">🔬 Researcher</option>
              <option value="coder">💻 Coder</option>
              <option value="tester">🧪 Tester</option>
              <option value="reviewer">👁️ Reviewer</option>
              <option value="debugger">🐛 Debugger</option>
            </select>
          </div>
          
          <button 
            className="control-button spawn-agent"
            onClick={handleAddAgent}
          >
            🤖 Spawn Agent
          </button>
        </div>
      </div>


      <div className="control-section">
        <div className="section-header">
          <h4>Network Settings</h4>
        </div>
        
        <div className="network-controls">
          <div className="control-row">
            <label>Max Agents:</label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              defaultValue="50"
              className="control-input"
            />
          </div>
          
          <div className="control-row">
            <label>Update Frequency:</label>
            <select className="control-select">
              <option value="1">Real-time</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>
          
          <div className="control-row">
            <label>Auto-Scale:</label>
            <input type="checkbox" defaultChecked className="control-checkbox" />
          </div>
        </div>
      </div>

      <div className="control-section">
        <div className="section-header">
          <h4>Performance</h4>
        </div>
        
        <div className="performance-metrics">
          <div className="metric-item">
            <span className="metric-label">CPU Usage:</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '45%' }}></div>
            </div>
            <span className="metric-value">45%</span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Memory:</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '62%' }}></div>
            </div>
            <span className="metric-value">62%</span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Network:</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '78%' }}></div>
            </div>
            <span className="metric-value">78%</span>
          </div>
        </div>
      </div>

      <div className="control-section">
        <div className="section-header">
          <h4>Quick Actions</h4>
        </div>
        
        <div className="quick-actions">
          <button className="quick-action-btn">
            🎯 Focus Mode
          </button>
          <button className="quick-action-btn">
            🔍 Deep Analysis
          </button>
          <button className="quick-action-btn">
            🚀 Boost Performance
          </button>
          <button className="quick-action-btn">
            📱 Mobile View
          </button>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel