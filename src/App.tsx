import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import { SwarmProvider } from './contexts/SwarmContext'

// Lazy load components for better performance
const LandingPage = React.lazy(() => import('./components/LandingPage'))
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const AuthCallback = React.lazy(() => import('./components/AuthCallback'))

// Loading component
const LoadingSpinner: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 100%)',
    color: '#00ff00',
    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
  }}>
    <div style={{
      border: '3px solid rgba(0, 255, 0, 0.1)',
      borderTop: '3px solid #00ff00',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

function App() {
  return (
    <UserProvider>
      <SwarmProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* Fallback route */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </SwarmProvider>
    </UserProvider>
  )
}

export default App