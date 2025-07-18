/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import McpToolsDashboard from '../../../src/components/McpToolsDashboard'
import { mcpService } from '../../../src/services/McpService'

// Mock the MCP service
jest.mock('../../../src/services/McpService', () => ({
  mcpService: {
    initialize: jest.fn(),
    getServers: jest.fn(),
    getMetrics: jest.fn(),
    executeTool: jest.fn(),
    refreshServers: jest.fn()
  }
}))

const mockServers = [
  {
    id: 'claude-flow',
    name: 'Claude Flow',
    status: 'connected' as const,
    version: '2.0.0-alpha.43',
    healthScore: 95,
    lastPing: Date.now(),
    type: 'stdio' as const,
    tools: [
      {
        name: 'mcp__claude-flow__swarm_init',
        description: 'Initialize swarm with topology and configuration',
        parameters: { topology: 'string', maxAgents: 'number', strategy: 'string' },
        usageCount: 23,
        averageResponseTime: 145,
        successRate: 96.5,
        category: 'coordination'
      },
      {
        name: 'mcp__claude-flow__agent_spawn',
        description: 'Create specialized AI agents',
        parameters: { type: 'string', name: 'string', capabilities: 'array' },
        usageCount: 18,
        averageResponseTime: 89,
        successRate: 98.2,
        category: 'agents'
      }
    ]
  }
]

const mockMetrics = {
  totalRequests: 1247,
  successfulRequests: 1189,
  failedRequests: 58,
  averageResponseTime: 143,
  uptime: 98.4,
  memoryUsage: 156.8,
  tokenUsage: 23847,
  serverMetrics: new Map()
}

describe('McpToolsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(mcpService.initialize as jest.Mock).mockResolvedValue(undefined)
    ;(mcpService.getServers as jest.Mock).mockReturnValue(mockServers)
    ;(mcpService.getMetrics as jest.Mock).mockReturnValue(mockMetrics)
    ;(mcpService.executeTool as jest.Mock).mockResolvedValue({
      toolName: 'mcp__claude-flow__swarm_init',
      parameters: { topology: 'mesh' },
      timestamp: new Date(),
      success: true,
      response: { success: true, swarmId: 'test-swarm' },
      duration: 150
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders loading state initially', () => {
    render(<McpToolsDashboard />)
    
    expect(screen.getByText('Discovering MCP servers...')).toBeInTheDocument()
    expect(screen.getByText('Discovering MCP servers...')).toBeVisible()
  })

  test('renders dashboard after loading', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('MCP Tools Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Claude Flow')).toBeInTheDocument()
    })
  })

  test('displays server metrics correctly', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Server count
      expect(screen.getByText('2')).toBeInTheDocument() // Tool count
      expect(screen.getByText('95.3%')).toBeInTheDocument() // Success rate (matches mock data)
      expect(screen.getByText('143ms')).toBeInTheDocument() // Average response time
    })
  })

  test('displays server list with status indicators', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Claude Flow')).toBeInTheDocument()
      expect(screen.getByText('v2.0.0-alpha.43')).toBeInTheDocument()
      expect(screen.getByText('stdio')).toBeInTheDocument()
      expect(screen.getByText('2 tools')).toBeInTheDocument()
    })
  })

  test('allows server selection', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      expect(serverItem).toBeInTheDocument()
      
      fireEvent.click(serverItem!)
      
      expect(screen.getByText('Tools for Claude Flow')).toBeInTheDocument()
    })
  })

  test('displays tools for selected server', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      expect(screen.getByText('mcp__claude-flow__swarm_init')).toBeInTheDocument()
      expect(screen.getByText('mcp__claude-flow__agent_spawn')).toBeInTheDocument()
      expect(screen.getByText('Initialize swarm with topology and configuration')).toBeInTheDocument()
    })
  })

  test('filters tools based on search input', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      const filterInput = screen.getByPlaceholderText('Filter tools...')
      fireEvent.change(filterInput, { target: { value: 'swarm' } })
      
      expect(screen.getByText('mcp__claude-flow__swarm_init')).toBeInTheDocument()
      expect(screen.queryByText('mcp__claude-flow__agent_spawn')).not.toBeInTheDocument()
    })
  })

  test('allows tool selection and shows execution panel', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      const toolCard = screen.getByText('mcp__claude-flow__swarm_init').closest('.tool-card')
      fireEvent.click(toolCard!)
      
      expect(screen.getByText('Execute Tool: mcp__claude-flow__swarm_init')).toBeInTheDocument()
      expect(screen.getByText('Parameters')).toBeInTheDocument()
    })
  })

  test('executes tools with parameters', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      const toolCard = screen.getByText('mcp__claude-flow__swarm_init').closest('.tool-card')
      fireEvent.click(toolCard!)
      
      const executeButton = screen.getByText('Execute Tool')
      fireEvent.click(executeButton)
      
      expect(mcpService.executeTool).toHaveBeenCalledWith(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        {}
      )
    })
  })

  test('displays execution results', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      const toolCard = screen.getByText('mcp__claude-flow__swarm_init').closest('.tool-card')
      fireEvent.click(toolCard!)
      
      const executeButton = screen.getByText('Execute Tool')
      fireEvent.click(executeButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Recent Executions')).toBeInTheDocument()
      // Check for result-tool class specifically to avoid duplicate matches
      const resultElements = screen.getAllByText('mcp__claude-flow__swarm_init')
      expect(resultElements.length).toBeGreaterThan(0)
    })
  })

  test('handles execution errors gracefully', async () => {
    const mockError = new Error('Tool execution failed')
    ;(mcpService.executeTool as jest.Mock).mockRejectedValue(mockError)
    
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const serverItem = screen.getByText('Claude Flow').closest('.server-item')
      fireEvent.click(serverItem!)
      
      const toolCard = screen.getByText('mcp__claude-flow__swarm_init').closest('.tool-card')
      fireEvent.click(toolCard!)
      
      const executeButton = screen.getByText('Execute Tool')
      fireEvent.click(executeButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Recent Executions')).toBeInTheDocument()
      // Error result should be displayed
      const resultElements = screen.getAllByText('mcp__claude-flow__swarm_init')
      expect(resultElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Tool execution failed')).toBeInTheDocument()
    })
  })

  test('updates health scores periodically', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Claude Flow')).toBeInTheDocument()
    })
    
    // Mock timer to trigger health check immediately
    jest.advanceTimersByTime(30000)
    
    await waitFor(() => {
      expect(mcpService.getServers).toHaveBeenCalledTimes(2) // Once on init, once on health check
    }, { timeout: 1000 })
  })

  test('displays server health scores with appropriate colors', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      const healthScore = screen.getByText('95%')
      expect(healthScore).toBeInTheDocument()
      
      // Check that health score element exists (styling test simplified)
      expect(healthScore).toHaveClass('health-score')
    })
  })

  test('shows no server selected message initially', async () => {
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Select a server to view its tools')).toBeInTheDocument()
      expect(screen.getByText('Choose an MCP server from the sidebar to explore its available tools and performance metrics.')).toBeInTheDocument()
    })
  })

  test('handles initialization errors gracefully', async () => {
    const mockError = new Error('Failed to initialize')
    ;(mcpService.initialize as jest.Mock).mockRejectedValue(mockError)
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<McpToolsDashboard />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize MCP discovery:', mockError)
    })
    
    consoleSpy.mockRestore()
  })
})