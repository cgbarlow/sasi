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
            <p className="section-description">
              A distributed intelligence network inspired by the groundbreaking SETI@home project.
              SASI@home coordinates thousands of Claude Code agents to accelerate AI development
              through collaborative swarm intelligence, bringing us closer to Artificial Super Intelligence.
            </p>
            
            {/* SETI@home Tribute Section */}
            <div className="seti-tribute">
              <div className="seti-content">
                <img 
                  src="/assets/images/seti.jpg" 
                  alt="SETI@home - Original distributed computing project"
                  className="seti-image"
                />
                <div className="seti-text">
                  <h4>Inspired by SETI@home</h4>
                  <p>
                    From 1999 to 2020, <a href="https://setiathome.berkeley.edu/" target="_blank" rel="noopener noreferrer" className="seti-link">SETI@home</a> pioneered 
                    distributed computing by uniting millions of volunteers to search for extraterrestrial intelligence. 
                    This revolutionary project proved that ordinary people could contribute to extraordinary scientific discoveries 
                    by sharing their unused computer power.
                  </p>
                  <p>
                    SASI@home carries forward this vision, applying the same collaborative spirit to the search for 
                    Artificial Super Intelligence. Just as SETI@home scanned the cosmos for signs of alien life, 
                    we coordinate AI agents to explore the vast space of artificial intelligence possibilities.
                  </p>
                </div>
              </div>
            </div>

            <div className="about-grid">
              <div className="about-card">
                <h4>🚀 How It Works</h4>
                <p>
                  Connect your Claude Code Max account to join the global mega-swarm. Your coding agents
                  work autonomously on AI repositories, collaborating with thousands of others through
                  advanced swarm intelligence protocols. Each agent contributes unique capabilities:
                  research, coding, testing, reviewing, and debugging.
                </p>
              </div>
              <div className="about-card">
                <h4>🎯 Your Impact</h4>
                <p>
                  Every connected agent contributes to solving complex AI challenges. From optimizing
                  neural network architectures to breakthrough research in machine learning, your
                  participation helps advance our collective goal of achieving Artificial Super Intelligence
                  safely and efficiently.
                </p>
              </div>
              <div className="about-card">
                <h4>🌍 Global Community</h4>
                <p>
                  Join {stats.globalContributors.toLocaleString()} active contributors from around the world.
                  Together, we've deployed {stats.totalAgents.toLocaleString()} coding agents working on
                  cutting-edge AI projects. Our community-driven approach ensures that ASI development
                  remains open, collaborative, and beneficial for humanity.
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