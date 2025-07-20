import React, { useState } from 'react'
import { Repository, useSwarm } from '../contexts/SwarmContext'
import '../styles/ProjectList.css'

interface RepositoryListProps {
  repositories: Repository[]
}

const RepositoryList: React.FC<RepositoryListProps> = ({ repositories }) => {
  const { voteForProject, addRepository } = useSwarm()
  const [sortBy, setSortBy] = useState<'name' | 'agents' | 'progress' | 'activity' | 'votes'>('votes')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredAndSortedRepos = repositories
    .filter(repo => 
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'agents':
          return b.activeAgents - a.activeAgents
        case 'progress':
          return (b.completedIssues / b.totalIssues) - (a.completedIssues / a.totalIssues)
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        case 'votes':
          return b.votes - a.votes
        default:
          return 0
      }
    })

  const getProgressPercentage = (repo: Repository): number => {
    return (repo.completedIssues / repo.totalIssues) * 100
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'var(--success-text)'
    if (percentage >= 60) return 'var(--accent-text)'
    if (percentage >= 40) return 'var(--secondary-text)'
    return 'var(--warning-text)'
  }

  const getActivityStatus = (lastActivity: Date): { status: string; color: string } => {
    const now = new Date()
    const diffMs = now.getTime() - lastActivity.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 5) return { status: 'Very Active', color: 'var(--success-text)' }
    if (diffMins < 30) return { status: 'Active', color: 'var(--accent-text)' }
    if (diffMins < 120) return { status: 'Moderate', color: 'var(--secondary-text)' }
    return { status: 'Low Activity', color: 'var(--warning-text)' }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // Extract repository info from GitHub URL
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) {
        alert('Please enter a valid GitHub repository URL')
        return
      }
      
      const [, owner, name] = match
      const cleanName = name.replace(/\.git$/, '')
      
      // TODO: In a real implementation, you would fetch from GitHub API
      // For now, we'll create a mock repository
      const newRepo: Repository = {
        id: `repo_${Date.now()}`,
        name: cleanName,
        owner: owner,
        description: 'Newly added repository from GitHub',
        activeAgents: 0,
        totalIssues: 0,
        completedIssues: 0,
        openPullRequests: 0,
        lastActivity: new Date(),
        techStack: ['JavaScript'], // Default tech stack
        votes: 0,
        userVoted: false
      }
      
      // Add repository to context
      addRepository(newRepo)
      
      setGithubUrl('')
      setShowAddModal(false)
      alert('Project added successfully!')
      
    } catch (error) {
      console.error('Error adding repository:', error)
      alert('Failed to add repository. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="repository-list">
      <div className="list-header">
        <div className="header-left">
          <h2 className="list-title">Active Projects</h2>
          <div className="repo-count">
            {filteredAndSortedRepos.length} of {repositories.length} projects
          </div>
        </div>
        <button 
          className="add-project-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add Project
        </button>
      </div>

      <div className="list-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="votes">Vote Count</option>
            <option value="agents">Active Agents</option>
            <option value="progress">Progress</option>
            <option value="activity">Recent Activity</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="repository-grid">
        {filteredAndSortedRepos.map(repo => {
          const progress = getProgressPercentage(repo)
          const progressColor = getProgressColor(progress)
          const activityStatus = getActivityStatus(repo.lastActivity)
          
          return (
            <div key={repo.id} className="repository-card">
              <div className="repo-header">
                <div className="repo-info">
                  <h3 className="repo-name">{repo.name}</h3>
                  <p className="repo-owner">by {repo.owner}</p>
                </div>
                <div className="repo-status">
                  <span 
                    className="activity-indicator"
                    style={{ color: activityStatus.color }}
                  >
                    {activityStatus.status}
                  </span>
                  <span className="last-activity">
                    {formatTimeAgo(repo.lastActivity)}
                  </span>
                </div>
              </div>

              <div className="repo-description">
                <p>{repo.description}</p>
              </div>

              <div className="voting-section">
                <div className="vote-info">
                  <span className="vote-count">{repo.votes}</span>
                  <span className="vote-label">votes</span>
                </div>
                <button 
                  className={`vote-btn ${repo.userVoted ? 'voted' : ''}`}
                  onClick={() => voteForProject(repo.id)}
                  title={repo.userVoted ? 'Remove your vote' : 'Vote for this project'}
                >
                  {repo.userVoted ? '👍' : '👍'}
                  {repo.userVoted ? ' Voted' : ' Vote'}
                </button>
              </div>

              <div className="tech-stack">
                <div className="tech-label">Tech Stack:</div>
                <div className="tech-tags">
                  {repo.techStack.map(tech => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="repo-metrics">
                <div className="metric-grid">
                  <div className="metric-item">
                    <span className="metric-icon">🤖</span>
                    <div className="metric-content">
                      <span className="metric-value">{repo.activeAgents}</span>
                      <span className="metric-label">Active Agents</span>
                    </div>
                  </div>

                  <div className="metric-item">
                    <span className="metric-icon">📋</span>
                    <div className="metric-content">
                      <span className="metric-value">{repo.totalIssues}</span>
                      <span className="metric-label">Total Issues</span>
                    </div>
                  </div>

                  <div className="metric-item">
                    <span className="metric-icon">✅</span>
                    <div className="metric-content">
                      <span className="metric-value">{repo.completedIssues}</span>
                      <span className="metric-label">Completed</span>
                    </div>
                  </div>

                  <div className="metric-item">
                    <span className="metric-icon">🔄</span>
                    <div className="metric-content">
                      <span className="metric-value">{repo.openPullRequests}</span>
                      <span className="metric-label">Open PRs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">Completion Progress</span>
                  <span 
                    className="progress-percentage"
                    style={{ color: progressColor }}
                  >
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>
              </div>

              <div className="repo-actions">
                <button className="action-btn primary">
                  👁️ View Details
                </button>
                <button className="action-btn secondary">
                  📊 Analytics
                </button>
                <button className="action-btn secondary">
                  🔧 Configure
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAndSortedRepos.length === 0 && (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>
            {searchTerm 
              ? `No projects match "${searchTerm}". Try a different search term.`
              : 'No projects are currently active in the swarm.'
            }
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add GitHub Project</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddProject} className="add-project-form">
              <div className="form-group">
                <label htmlFor="github-url">GitHub Repository URL</label>
                <input
                  id="github-url"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  required
                  disabled={isSubmitting}
                  className="github-input"
                />
                <small className="form-hint">
                  Enter a valid GitHub repository URL (e.g., https://github.com/microsoft/vscode)
                </small>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || !githubUrl.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RepositoryList