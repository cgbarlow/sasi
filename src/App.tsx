import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import AuthModal from './components/AuthModal'
import { UserProvider } from './contexts/UserContext'
import { SwarmProvider } from './contexts/SwarmContext'

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="sasi-logo">
            <span className="sasi-text">SASI@home</span>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
          <p className="loading-message">Initializing mega-swarm coordination system...</p>
        </div>
      </div>
    )
  }

  return (
    <UserProvider>
      <SwarmProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
            <AuthModal />
          </div>
        </Router>
      </SwarmProvider>
    </UserProvider>
  )
}

export default App