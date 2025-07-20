import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import '../styles/AuthModal.css'

const AuthModal: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthModalOpen, setIsAuthModalOpen, login, loginWithClaudeMax, mockLogin } = useUser()
  const [username, setUsername] = useState('demo@claudemax.ai')
  const [password, setPassword] = useState('SwarIntelligence2025!')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'mock' | 'oauth'>('oauth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (authMode === 'oauth') {
        await loginWithClaudeMax()
        // OAuth flow will redirect, so no need to navigate here
      } else {
        await login({ username, password })
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
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
    navigate('/dashboard')
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
              Authenticate with your Claude Max account to join the mega-swarm.
              Your coding agents will contribute to the distributed AI development network.
            </p>
          </div>

          <div className="auth-mode-selector">
            <button
              type="button"
              className={`mode-btn ${authMode === 'oauth' ? 'active' : ''}`}
              onClick={() => setAuthMode('oauth')}
            >
              🔐 Claude Max OAuth
            </button>
            <button
              type="button"
              className={`mode-btn ${authMode === 'mock' ? 'active' : ''}`}
              onClick={() => setAuthMode('mock')}
            >
              🎭 Demo Mode
            </button>
          </div>

          {authMode === 'oauth' ? (
            <div className="oauth-auth">
              <p className="oauth-description">
                Secure OAuth 2.0 authentication with your Claude Max account.
                You'll be redirected to Claude Max to authorize this application.
              </p>
              
              {error && <div className="error-message">{error}</div>}

              <button 
                onClick={handleSubmit}
                className="auth-submit-btn retro-button"
                disabled={isLoading}
              >
                {isLoading ? 'Redirecting...' : '🚀 Connect with Claude Max'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="demo-credentials-notice">
                <p><strong>Demo Credentials:</strong> The following are pre-filled for demonstration purposes</p>
              </div>

              <div className="form-group">
                <label htmlFor="username">Claude Max Email</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="auth-input demo-input"
                  readOnly={authMode === 'mock'}
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
                  className="auth-input demo-input"
                  readOnly={authMode === 'mock'}
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
          )}

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button 
            className="mock-login-btn retro-button secondary"
            onClick={handleMockLogin}
          >
            Quick Demo Access
          </button>

          <style>{`
            .auth-mode-selector {
              display: flex;
              gap: 0.5rem;
              margin-bottom: 1.5rem;
              background: rgba(0, 20, 40, 0.8);
              border-radius: 8px;
              padding: 0.25rem;
            }

            .mode-btn {
              flex: 1;
              padding: 0.75rem 1rem;
              background: transparent;
              border: none;
              color: #00cc88;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              font-family: inherit;
              font-size: 0.9rem;
            }

            .mode-btn:hover {
              background: rgba(0, 204, 136, 0.1);
            }

            .mode-btn.active {
              background: rgba(0, 204, 136, 0.2);
              color: #00ff00;
              box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
            }

            .oauth-auth {
              text-align: center;
              padding: 1rem 0;
            }

            .oauth-description {
              color: #b0b8c0;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            }
          `}</style>

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