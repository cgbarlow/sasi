/**
 * OAuth Callback Handler Component
 * Handles the redirect from Claude Max OAuth authorization
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import ClaudeMaxAuthService from '../services/claudeMaxAuth'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuthenticatedUser } = useUser()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`)
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter')
        }

        setStatus('processing')

        // Exchange code for tokens and get user profile
        const authService = ClaudeMaxAuthService.getInstance()
        const user = await authService.handleCallback(code, state)

        // Update user context
        setAuthenticatedUser(user)
        setStatus('success')

        // Redirect to dashboard after brief success message
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)

      } catch (err) {
        console.error('Authentication callback failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')

        // Redirect to home after error display
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, setAuthenticatedUser])

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        {status === 'processing' && (
          <div className="auth-processing">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
            </div>
            <h2 className="glow-text">Connecting to Claude Max</h2>
            <p>Validating your authentication...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="auth-success">
            <div className="success-icon">✅</div>
            <h2 className="glow-text">Authentication Successful!</h2>
            <p>Welcome to the SASI swarm. Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-error">
            <div className="error-icon">❌</div>
            <h2 className="glow-text">Authentication Failed</h2>
            <p className="error-message">{error}</p>
            <p>Redirecting you back to the homepage...</p>
          </div>
        )}
      </div>

      <style>{`
        .auth-callback-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0f1c 0%, #1a2332 100%);
          color: #00ff00;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .auth-callback-content {
          text-align: center;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }

        .loading-spinner {
          margin: 0 auto 2rem;
          width: 60px;
          height: 60px;
          position: relative;
        }

        .spinner-ring {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(0, 255, 0, 0.1);
          border-top: 3px solid #00ff00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .glow-text {
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .success-icon,
        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-message {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 107, 107, 0.3);
          margin: 1rem 0;
          font-family: monospace;
        }

        p {
          color: #b0b8c0;
          line-height: 1.5;
        }

        .auth-processing p,
        .auth-success p {
          color: #00cc88;
        }
      `}</style>
    </div>
  )
}

export default AuthCallback