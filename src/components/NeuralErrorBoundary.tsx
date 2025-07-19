/**
 * Neural Error Boundary Component
 * 
 * Provides error handling and fault tolerance for neural mesh integration,
 * with automatic recovery and fallback mechanisms.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRecovering: boolean
}

export class NeuralErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error details
    console.error('Neural Mesh Error:', error)
    console.error('Error Info:', errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Attempt automatic recovery
    this.attemptRecovery()
  }

  private attemptRecovery = () => {
    const { retryCount } = this.state

    if (retryCount < this.maxRetries) {
      this.setState({ isRecovering: true })

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000
      
      this.retryTimer = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: retryCount + 1,
          isRecovering: false
        })
      }, delay)
    }
  }

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    })
  }

  private handleResetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    })
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
  }

  render() {
    const { hasError, error, errorInfo, isRecovering, retryCount } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // If recovering, show recovery message
      if (isRecovering) {
        return (
          <div className="neural-error-recovery">
            <div className="recovery-animation">
              <div className="neural-pulse"></div>
              <div className="neural-pulse"></div>
              <div className="neural-pulse"></div>
            </div>
            <h3>Neural Mesh Recovering...</h3>
            <p>Attempting to restore neural connections (Retry {retryCount}/{this.maxRetries})</p>
          </div>
        )
      }

      // Custom fallback component
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div className="neural-error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" className="neural-error-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            
            <h2>Neural Mesh Error</h2>
            <p className="error-message">
              The neural mesh encountered an unexpected error and needs to be reinitialized.
            </p>
            
            <div className="error-details">
              <details>
                <summary>Technical Details</summary>
                <div className="error-info">
                  <h4>Error:</h4>
                  <pre>{error?.message}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{error?.stack}</pre>
                  
                  {errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            </div>
            
            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={this.handleManualRetry}
                disabled={retryCount >= this.maxRetries}
              >
                {retryCount >= this.maxRetries ? 'Max Retries Reached' : 'Retry Connection'}
              </button>
              
              <button 
                className="reset-button"
                onClick={this.handleResetError}
              >
                Reset Neural Mesh
              </button>
            </div>
            
            <div className="recovery-suggestions">
              <h4>Recovery Suggestions:</h4>
              <ul>
                <li>Check if the Synaptic MCP server is running</li>
                <li>Verify WebGL is enabled in your browser</li>
                <li>Ensure WASM is supported in your environment</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for additional errors</li>
              </ul>
            </div>
            
            <div className="retry-info">
              <p>
                Retry attempts: {retryCount}/{this.maxRetries}
              </p>
              
              {retryCount < this.maxRetries && (
                <div className="auto-retry-countdown">
                  <p>Automatic retry in {Math.pow(2, retryCount)} seconds...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

/**
 * Higher-order component for neural error handling
 */
export const withNeuralErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  return (props: P) => (
    <NeuralErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </NeuralErrorBoundary>
  )
}

/**
 * Hook for error reporting
 */
export const useNeuralErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    console.error(`Neural Mesh Error${context ? ` [${context}]` : ''}:`, error)
    
    // Here you could add error reporting to external services
    // Example: Sentry, LogRocket, or custom analytics
    
    // For now, we'll just log it
    if (typeof window !== 'undefined' && window.console) {
      window.console.group('Neural Mesh Error Report')
      window.console.error('Error:', error)
      window.console.error('Context:', context)
      window.console.error('Timestamp:', new Date().toISOString())
      window.console.error('User Agent:', navigator.userAgent)
      window.console.error('URL:', window.location.href)
      window.console.groupEnd()
    }
  }

  return { reportError }
}