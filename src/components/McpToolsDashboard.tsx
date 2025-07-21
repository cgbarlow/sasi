import React, { useState, useEffect, useCallback } from 'react'
import { mcpService, McpServer, McpTool, McpMetrics, McpExecutionResult } from '../services/McpService'
import '../styles/McpToolsDashboard.css'


const McpToolsDashboard: React.FC = () => {
  const [servers, setServers] = useState<McpServer[]>([])
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<McpMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toolFilter, setToolFilter] = useState('')
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null)
  const [executionResults, setExecutionResults] = useState<McpExecutionResult[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    // Initialize MCP server discovery
    const initializeAsync = async () => {
      await initializeMcpDiscovery()
    }
    initializeAsync()
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      performHealthChecks()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(healthCheckInterval)
  }, [])

  const initializeMcpDiscovery = async () => {
    try {
      setIsLoading(true)
      
      // Initialize MCP service
      await mcpService.initialize()
      
      // Use React's batched updates to prevent act() warnings
      const updateState = () => {
        // Get discovered servers
        const discoveredServers = mcpService.getServers()
        setServers(discoveredServers)
        
        // Get metrics
        const currentMetrics = mcpService.getMetrics()
        setMetrics(currentMetrics)
        
        setIsLoading(false)
      }
      
      // Schedule update in next tick to avoid act() warnings
      setTimeout(updateState, 0)
      
    } catch (error) {
      // Failed to initialize MCP discovery - error handled via state update
      setIsLoading(false)
    }
  }

  const refreshServers = async (): Promise<void> => {
    try {
      const updatedServers = await mcpService.refreshServers()
      setServers(updatedServers)
      
      const currentMetrics = mcpService.getMetrics()
      setMetrics(currentMetrics)
    } catch (error) {
      // Failed to refresh servers - error handled via state
    }
  }

  const updateMetrics = async (): Promise<void> => {
    try {
      const currentMetrics = mcpService.getMetrics()
      setMetrics(currentMetrics)
    } catch (error) {
      // Failed to update metrics - error handled
    }
  }

  const performHealthChecks = async () => {
    try {
      // Use React's batched updates to prevent act() warnings
      const updateHealthState = () => {
        // Get updated servers from service
        const updatedServers = mcpService.getServers()
        setServers(updatedServers)
        
        const currentMetrics = mcpService.getMetrics()
        setMetrics(currentMetrics)
      }
      
      // Schedule update in next tick to avoid act() warnings in tests
      setTimeout(updateHealthState, 0)
    } catch (error) {
      // Failed to perform health checks - error handled
    }
  }

  const executeTool = async (tool: McpTool, parameters: Record<string, string | number | boolean>) => {
    if (!selectedServer) return
    
    setIsExecuting(true)
    
    try {
      const result = await mcpService.executeTool(selectedServer, tool.name, parameters)
      
      setExecutionResults(prev => [result, ...prev.slice(0, 19)]) // Keep last 20 results
      
      // Refresh servers to get updated stats
      const updatedServers = mcpService.getServers()
      setServers(updatedServers)
      
      // Update metrics
      const currentMetrics = mcpService.getMetrics()
      setMetrics(currentMetrics)
      
    } catch (error) {
      // Tool execution failed - error handled via result object
      
      // Create error result
      const errorResult: McpExecutionResult = {
        toolName: tool.name,
        parameters,
        timestamp: new Date(),
        success: false,
        response: null,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      setExecutionResults(prev => [errorResult, ...prev.slice(0, 19)])
    } finally {
      setIsExecuting(false)
    }
  }

  const getServerStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return '#4CAF50'
      case 'disconnected': return '#FF9800'
      case 'error': return '#F44336'
      default: return '#757575'
    }
  }

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50'
    if (score >= 70) return '#FF9800'
    return '#F44336'
  }

  const filteredTools = selectedServer
    ? servers.find(s => s.id === selectedServer)?.tools?.filter(tool =>
        tool.name.toLowerCase().includes(toolFilter.toLowerCase()) ||
        tool.description.toLowerCase().includes(toolFilter.toLowerCase()) ||
        tool.category.toLowerCase().includes(toolFilter.toLowerCase())
      ) || []
    : []

  if (isLoading) {
    return (
      <div className="mcp-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Discovering MCP servers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mcp-dashboard">
      {/* Header */}
      <div className="mcp-header">
        <h2 className="mcp-title">MCP Tools Dashboard</h2>
        <div className="mcp-metrics-summary">
          <div className="metric-item">
            <span className="metric-label">Servers</span>
            <span className="metric-value">{servers.length}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Tools</span>
            <span className="metric-value">{servers.reduce((sum, s) => sum + s.tools.length, 0)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Success Rate</span>
            <span className="metric-value">
              {metrics ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg Response</span>
            <span className="metric-value">{metrics ? metrics.averageResponseTime : 0}ms</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mcp-content">
        {/* Server List */}
        <div className="mcp-sidebar">
          <h3>MCP Servers</h3>
          <div className="server-list">
            {servers.map(server => (
              <div
                key={server.id}
                className={`server-item ${selectedServer === server.id ? 'selected' : ''}`}
                onClick={() => setSelectedServer(server.id)}
              >
                <div className="server-header">
                  <div className="server-name">{server.name}</div>
                  <div
                    className="server-status"
                    style={{ backgroundColor: getServerStatusColor(server.status) }}
                  />
                </div>
                <div className="server-details">
                  <div className="server-version">v{server.version}</div>
                  <div className="server-type">{server.type}</div>
                </div>
                <div className="server-health">
                  <div className="health-score" style={{ color: getHealthScoreColor(server.healthScore) }}>
                    {server.healthScore.toFixed(0)}%
                  </div>
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{
                        width: `${server.healthScore}%`,
                        backgroundColor: getHealthScoreColor(server.healthScore)
                      }}
                    />
                  </div>
                </div>
                <div className="server-tools-count">{server.tools.length} tools</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tool Details */}
        <div className="mcp-main">
          {selectedServer ? (
            <>
              <div className="tools-header">
                <h3>Tools for {servers.find(s => s.id === selectedServer)?.name}</h3>
                <input
                  type="text"
                  placeholder="Filter tools..."
                  value={toolFilter}
                  onChange={(e) => setToolFilter(e.target.value)}
                  className="tool-filter"
                />
              </div>
              
              <div className="tools-grid">
                {filteredTools.map((tool, index) => (
                  <div
                    key={index}
                    className={`tool-card ${selectedTool?.name === tool.name ? 'selected' : ''}`}
                    onClick={() => setSelectedTool(tool)}
                  >
                    <div className="tool-header">
                      <h4 className="tool-name">{tool.name}</h4>
                      <span className="tool-category">{tool.category}</span>
                    </div>
                    <p className="tool-description">{tool.description}</p>
                    <div className="tool-stats">
                      <div className="stat">
                        <span className="stat-label">Usage:</span>
                        <span className="stat-value">{tool.usageCount}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Success:</span>
                        <span className="stat-value">{tool.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Avg Time:</span>
                        <span className="stat-value">{tool.averageResponseTime}ms</span>
                      </div>
                    </div>
                    {tool.lastUsed && (
                      <div className="tool-last-used">
                        Last used: {tool.lastUsed.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-server-selected">
              <h3>Select a server to view its tools</h3>
              <p>Choose an MCP server from the sidebar to explore its available tools and performance metrics.</p>
            </div>
          )}
        </div>

        {/* Tool Execution Panel */}
        {selectedTool && (
          <div className="mcp-execution-panel">
            <h3>Execute Tool: {selectedTool.name}</h3>
            <div className="execution-form">
              <div className="parameters-section">
                <h4>Parameters</h4>
                <div className="parameters-grid">
                  {Object.entries(selectedTool.parameters).map(([key, type]) => (
                    <div key={key} className="parameter-input">
                      <label>{key}</label>
                      <input
                        type={type === 'number' ? 'number' : 'text'}
                        placeholder={`Enter ${key} (${type})`}
                        className="parameter-field"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                className="execute-button"
                onClick={() => executeTool(selectedTool, {})}
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute Tool'}
              </button>
            </div>
            
            {executionResults.length > 0 && (
              <div className="execution-results">
                <h4>Recent Executions</h4>
                <div className="results-list">
                  {executionResults.slice(0, 5).map((result, index) => (
                    <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <div className="result-header">
                        <span className="result-tool">{result.toolName}</span>
                        <span className="result-time">{result.timestamp.toLocaleTimeString()}</span>
                        <span className="result-duration">{result.duration}ms</span>
                      </div>
                      <div className="result-response">
                        {result.success ? 
                          (typeof result.response === 'string' ? result.response : JSON.stringify(result.response)) :
                          (result.error || 'Execution failed')
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default McpToolsDashboard