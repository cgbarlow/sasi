import { jest } from '@jest/globals'
import { mcpService, McpService } from '../../../src/services/McpService'

describe('McpService', () => {
  let service: McpService

  beforeEach(() => {
    // Create a new instance for each test
    service = new McpService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (service && typeof service.destroy === 'function') {
      service.destroy()
    }
  })

  describe('initialization', () => {
    test('initializes successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow()
    })

    test('discovers MCP servers on initialization', async () => {
      await service.initialize()
      
      const servers = service.getServers()
      expect(servers).toHaveLength(3) // Claude Flow, RUV Swarm, and GitHub Integration
      
      const claudeFlow = servers.find(s => s.id === 'claude-flow')
      expect(claudeFlow).toBeDefined()
      expect(claudeFlow!.name).toBe('Claude Flow')
      expect(claudeFlow!.status).toBe('connected')
      expect(claudeFlow!.tools.length).toBeGreaterThan(0)
    })

    test('starts health monitoring on initialization', async () => {
      await service.initialize()
      
      const initialHealthScore = service.getServer('claude-flow')?.healthScore
      
      // Wait for health check interval
      await new Promise(resolve => setTimeout(resolve, 35000))
      
      const updatedHealthScore = service.getServer('claude-flow')?.healthScore
      
      // Health score should be updated (may be same value but lastPing should be different)
      expect(service.getServer('claude-flow')?.lastPing).toBeGreaterThan(Date.now() - 35000)
    })
  })

  describe('server management', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('returns all servers', () => {
      const servers = service.getServers()
      expect(servers).toHaveLength(3)
      expect(servers.map(s => s.id)).toContain('claude-flow')
      expect(servers.map(s => s.id)).toContain('ruv-swarm')
      expect(servers.map(s => s.id)).toContain('github-integration')
    })

    test('returns specific server by id', () => {
      const server = service.getServer('claude-flow')
      expect(server).toBeDefined()
      expect(server!.id).toBe('claude-flow')
      expect(server!.name).toBe('Claude Flow')
    })

    test('returns undefined for non-existent server', () => {
      const server = service.getServer('non-existent')
      expect(server).toBeUndefined()
    })

    test('refreshes servers', async () => {
      const initialServers = service.getServers()
      const refreshedServers = await service.refreshServers()
      
      expect(refreshedServers).toHaveLength(initialServers.length)
      expect(refreshedServers.map(s => s.id)).toEqual(initialServers.map(s => s.id))
    })
  })

  describe('tool execution', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('executes tool successfully', async () => {
      const result = await service.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh', maxAgents: 5 }
      )
      
      expect(result.success).toBe(true)
      expect(result.toolName).toBe('mcp__claude-flow__swarm_init')
      expect(result.parameters).toEqual({ topology: 'mesh', maxAgents: 5 })
      expect(result.response).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
    })

    test('handles tool execution errors', async () => {
      await expect(
        service.executeTool('non-existent-server', 'some-tool', {})
      ).rejects.toThrow('Server non-existent-server not found')
    })

    test('handles non-existent tool errors', async () => {
      await expect(
        service.executeTool('claude-flow', 'non-existent-tool', {})
      ).rejects.toThrow('Tool non-existent-tool not found on server claude-flow')
    })

    test('updates tool usage statistics', async () => {
      const initialServer = service.getServer('claude-flow')!
      const initialTool = initialServer.tools.find(t => t.name === 'mcp__claude-flow__swarm_init')!
      const initialUsageCount = initialTool.usageCount
      
      await service.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh' }
      )
      
      const updatedServer = service.getServer('claude-flow')!
      const updatedTool = updatedServer.tools.find(t => t.name === 'mcp__claude-flow__swarm_init')!
      
      expect(updatedTool.usageCount).toBe(initialUsageCount + 1)
      expect(updatedTool.lastUsed).toBeDefined()
    })

    test('updates metrics after tool execution', async () => {
      const initialMetrics = service.getMetrics()
      
      await service.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh' }
      )
      
      const updatedMetrics = service.getMetrics()
      
      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1)
      expect(updatedMetrics.successfulRequests).toBe(initialMetrics.successfulRequests + 1)
    })
  })

  describe('metrics collection', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('returns metrics object', () => {
      const metrics = service.getMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics.totalRequests).toBeDefined()
      expect(metrics.successfulRequests).toBeDefined()
      expect(metrics.failedRequests).toBeDefined()
      expect(metrics.averageResponseTime).toBeDefined()
      expect(metrics.uptime).toBeDefined()
      expect(metrics.memoryUsage).toBeDefined()
      expect(metrics.tokenUsage).toBeDefined()
      expect(metrics.serverMetrics).toBeDefined()
    })

    test('updates metrics over time', async () => {
      const initialMetrics = service.getMetrics()
      
      // Wait for metrics update interval
      await new Promise(resolve => setTimeout(resolve, 6000))
      
      const updatedMetrics = service.getMetrics()
      
      expect(updatedMetrics.uptime).toBeGreaterThan(initialMetrics.uptime)
    })
  })

  describe('health monitoring', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('performs health checks periodically', async () => {
      const initialServer = service.getServer('claude-flow')!
      const initialPing = initialServer.lastPing
      
      // Wait for health check interval
      await new Promise(resolve => setTimeout(resolve, 35000))
      
      const updatedServer = service.getServer('claude-flow')!
      expect(updatedServer.lastPing).toBeGreaterThan(initialPing)
    })

    test('maintains server health scores', async () => {
      const server = service.getServer('claude-flow')!
      expect(server.healthScore).toBeGreaterThan(0)
      expect(server.healthScore).toBeLessThanOrEqual(100)
    })
  })

  describe('server types', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    test('handles stdio server type', async () => {
      const claudeFlow = service.getServer('claude-flow')!
      expect(claudeFlow.type).toBe('stdio')
      
      const result = await service.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh' }
      )
      
      expect(result.success).toBe(true)
    })

    test('handles websocket server type', async () => {
      // GitHub integration server should be websocket type
      const servers = service.getServers()
      const githubServer = servers.find(s => s.type === 'websocket')
      
      if (githubServer) {
        expect(githubServer.type).toBe('websocket')
        
        const result = await service.executeTool(
          githubServer.id,
          githubServer.tools[0].name,
          {}
        )
        
        expect(result).toBeDefined()
      }
    })
  })

  describe('error handling', () => {
    test('handles initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock a method to throw an error
      const mockService = new McpService()
      mockService.discoverServers = jest.fn().mockRejectedValue(new Error('Discovery failed'))
      
      await expect(mockService.initialize()).rejects.toThrow('Discovery failed')
      
      consoleSpy.mockRestore()
    })

    test('handles server detection errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      await service.initialize()
      
      // Service should still initialize even if some servers fail to detect
      const servers = service.getServers()
      expect(servers).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })

  describe('cleanup', () => {
    test('destroys service properly', async () => {
      await service.initialize()
      
      const servers = service.getServers()
      expect(servers.length).toBeGreaterThan(0)
      
      service.destroy()
      
      const serversAfterDestroy = service.getServers()
      expect(serversAfterDestroy).toHaveLength(0)
    })
  })
})