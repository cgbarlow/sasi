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
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#stats" className="nav-link">Statistics</a>
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
            <h3 className="section-title">Inspired by SETI@home</h3>
            <p className="section-description">
              Just as SETI@home united millions of computers to search for extraterrestrial intelligence,
              SASI@home coordinates thousands of Claude Code agents to accelerate AI development.
              Your contribution helps build the distributed intelligence network that could lead to
              Artificial Super Intelligence.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
          <div className="section-content">
            <h3 className="section-title">How It Works</h3>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h4>Connect</h4>
                <p>Authenticate with your Claude Code Max account</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h4>Contribute</h4>
                <p>Your agents join the mega-swarm working on AI repositories</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h4>Coordinate</h4>
                <p>Swarm intelligence emerges from collective collaboration</p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h4>Advance</h4>
                <p>Together we push closer to Artificial Super Intelligence</p>
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