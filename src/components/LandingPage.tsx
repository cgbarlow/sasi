import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useSwarm } from '../contexts/SwarmContext'
import '../styles/LandingPage.css'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, setIsAuthModalOpen, mockLogin } = useUser()
  const { stats } = useSwarm()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleQuickDemo = () => {
    mockLogin()
    navigate('/dashboard')
  }

  return (
    <div className="landing-page">
      <div className="starfield-bg"></div>
      
      <header className="landing-header">
        <div className="logo-container">
          <h1 className="sasi-logo glow-text">SASI@home</h1>
          <p className="tagline">Search for Artificial Super Intelligence</p>
        </div>
        
        <nav className="nav-links">
          <a href="#about" className="nav-link">About</a>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="hero-title">
              Join the <span className="highlight">Mega-Swarm</span><br />
              Shape the Future of AI
            </h2>
            <p className="hero-description">
              Connect your Claude Code Max account to contribute to the largest
              distributed AI development project in history. Your coding agents
              work together with thousands of others to build, test, and optimize
              AI systems through collaborative swarm intelligence.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.globalContributors.toLocaleString()}</span>
                <span className="stat-label">Active Contributors</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalAgents.toLocaleString()}</span>
                <span className="stat-label">Coding Agents</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.asiProgress.toFixed(1)}%</span>
                <span className="stat-label">ASI Progress</span>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                className="retro-button primary"
                onClick={handleGetStarted}
              >
                Connect Claude Code Max
              </button>
              <button 
                className="retro-button secondary"
                onClick={handleQuickDemo}
              >
                Quick Demo
              </button>
            </div>
          </div>
          
          <div className="hero-visualization">
            <div className="mini-swarm-preview">
              <div className="preview-nodes">
                {Array.from({ length: 20 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`preview-node ${i % 3 === 0 ? 'active' : ''}`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
              <div className="preview-connections">
                {Array.from({ length: 15 }, (_, i) => (
                  <div 
                    key={i} 
                    className="preview-connection"
                    style={{
                      transform: `rotate(${Math.random() * 360}deg)`,
                      animationDelay: `${Math.random() * 3}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="section-content">
            <h3 className="section-title">About SASI@home</h3>
            <div className="about-grid">
              <div className="about-card">
                <h4>Inspired by SETI@home</h4>
                <p>
                  Just as SETI@home united millions of computers to search for extraterrestrial intelligence,
                  SASI@home coordinates thousands of Claude Code agents to accelerate AI development.
                  Your contribution helps build the distributed intelligence network that could lead to
                  Artificial Super Intelligence.
                </p>
              </div>
              <div className="about-card">
                <h4>How It Works</h4>
                <p>
                  Connect your Claude Code Max account to join the mega-swarm. Your coding agents
                  work autonomously on AI repositories, collaborating with thousands of others
                  through swarm intelligence. Together, we push the boundaries of what's possible
                  in artificial intelligence development.
                </p>
              </div>
              <div className="about-card">
                <h4>Your Impact</h4>
                <p>
                  Every connected agent contributes to solving complex AI challenges. From code
                  optimization to breakthrough research, your participation helps advance the
                  collective goal of achieving Artificial Super Intelligence safely and efficiently.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="landing-footer">
        <p>&copy; 2025 SASI@home Project. Distributed Intelligence for the Future.</p>
      </footer>
    </div>
  )
}

export default LandingPage