import React, { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import '../styles/AuthModal.css'

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, mockLogin } = useUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login({ username, password })
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsAuthModalOpen(false)
    setUsername('')
    setPassword('')
    setError('')
  }

  const handleMockLogin = () => {
    mockLogin()
    handleClose()
  }

  if (!isAuthModalOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2 className="auth-title glow-text">Connect to SASI@home</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="auth-body">
          <div className="auth-description">
            <p>
              Authenticate with your Claude Code Max account to join the mega-swarm.
              Your coding agents will contribute to the distributed AI development network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="auth-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="auth-input"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="auth-submit-btn retro-button"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Connect to Swarm'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button 
            className="mock-login-btn retro-button secondary"
            onClick={handleMockLogin}
          >
            Quick Demo Access
          </button>

          <div className="auth-features">
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-text">
                <h4>AI Agent Coordination</h4>
                <p>Your Claude Code agents work collaboratively</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔗</div>
              <div className="feature-text">
                <h4>GitHub Integration</h4>
                <p>Seamless repository and issue management</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h4>Real-time Visualization</h4>
                <p>Monitor swarm intelligence in action</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal