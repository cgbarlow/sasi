import { jest } from '@jest/globals'
import { mcpService } from '../../src/services/McpService'

describe('MCP Dashboard Integration Tests', () => {
  beforeAll(async () => {
    // Initialize MCP service for integration tests
    await mcpService.initialize()
  })

  afterAll(() => {
    mcpService.destroy()
  })

  describe('MCP Server Discovery', () => {
    test('should discover available MCP servers', async () => {
      const servers = mcpService.getServers()
      
      expect(servers).toBeDefined()
      expect(Array.isArray(servers)).toBe(true)
      expect(servers.length).toBeGreaterThan(0)
      
      // Check for expected servers
      const serverIds = servers.map(s => s.id)
      expect(serverIds).toContain('claude-flow')
      expect(serverIds).toContain('ruv-swarm')
    })

    test('should have valid server configurations', () => {
      const servers = mcpService.getServers()
      
      servers.forEach(server => {
        expect(server.id).toBeDefined()
        expect(server.name).toBeDefined()
        expect(server.version).toBeDefined()
        expect(server.status).toMatch(/^(connected|disconnected|error)$/)
        expect(server.healthScore).toBeGreaterThanOrEqual(0)
        expect(server.healthScore).toBeLessThanOrEqual(100)
        expect(server.type).toMatch(/^(stdio|websocket|sse)$/)
        expect(Array.isArray(server.tools)).toBe(true)
      })
    })
  })

  describe('MCP Tool Discovery', () => {
    test('should discover tools for Claude Flow server', () => {
      const claudeFlowServer = mcpService.getServer('claude-flow')
      
      expect(claudeFlowServer).toBeDefined()
      expect(claudeFlowServer!.tools.length).toBeGreaterThan(0)
      
      const expectedTools = [
        'mcp__claude-flow__swarm_init',
        'mcp__claude-flow__agent_spawn',
        'mcp__claude-flow__task_orchestrate',
        'mcp__claude-flow__neural_status'
      ]
      
      const availableTools = claudeFlowServer!.tools.map(t => t.name)
      expectedTools.forEach(toolName => {
        expect(availableTools).toContain(toolName)
      })
    })

    test('should discover tools for RUV Swarm server', () => {
      const ruvSwarmServer = mcpService.getServer('ruv-swarm')
      
      expect(ruvSwarmServer).toBeDefined()
      expect(ruvSwarmServer!.tools.length).toBeGreaterThan(0)
      
      const expectedTools = [
        'mcp__ruv-swarm__swarm_init',
        'mcp__ruv-swarm__agent_spawn',
        'mcp__ruv-swarm__task_orchestrate',
        'mcp__ruv-swarm__neural_status'
      ]
      
      const availableTools = ruvSwarmServer!.tools.map(t => t.name)
      expectedTools.forEach(toolName => {
        expect(availableTools).toContain(toolName)
      })
    })

    test('should have valid tool configurations', () => {
      const servers = mcpService.getServers()
      
      servers.forEach(server => {
        server.tools.forEach(tool => {
          expect(tool.name).toBeDefined()
          expect(tool.description).toBeDefined()
          expect(tool.parameters).toBeDefined()
          expect(tool.category).toBeDefined()
          expect(tool.usageCount).toBeGreaterThanOrEqual(0)
          expect(tool.averageResponseTime).toBeGreaterThanOrEqual(0)
          expect(tool.successRate).toBeGreaterThanOrEqual(0)
          expect(tool.successRate).toBeLessThanOrEqual(100)
        })
      })
    })
  })

  describe('MCP Tool Execution', () => {
    test('should execute Claude Flow swarm_init tool', async () => {
      const result = await mcpService.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh', maxAgents: 5, strategy: 'balanced' }
      )
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.toolName).toBe('mcp__claude-flow__swarm_init')
      expect(result.parameters).toEqual({ topology: 'mesh', maxAgents: 5, strategy: 'balanced' })
      expect(result.response).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    test('should execute Claude Flow agent_spawn tool', async () => {
      const result = await mcpService.executeTool(
        'claude-flow',
        'mcp__claude-flow__agent_spawn',
        { type: 'researcher', name: 'Test Agent', capabilities: ['analysis', 'research'] }
      )
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.toolName).toBe('mcp__claude-flow__agent_spawn')
      expect(result.response).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
    })

    test('should execute RUV Swarm tools', async () => {
      const result = await mcpService.executeTool(
        'ruv-swarm',
        'mcp__ruv-swarm__swarm_init',
        { topology: 'hierarchical', maxAgents: 8 }
      )
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.toolName).toBe('mcp__ruv-swarm__swarm_init')
      expect(result.response).toBeDefined()
    })

    test('should handle tool execution errors', async () => {
      const result = await mcpService.executeTool(
        'non-existent-server',
        'some-tool',
        {}
      )
      
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Server non-existent-server not found')
    })

    test('should update tool usage statistics after execution', async () => {
      const server = mcpService.getServer('claude-flow')!
      const tool = server.tools.find(t => t.name === 'mcp__claude-flow__neural_status')!
      const initialUsageCount = tool.usageCount
      
      await mcpService.executeTool(
        'claude-flow',
        'mcp__claude-flow__neural_status',
        { modelId: 'test-model' }
      )
      
      const updatedServer = mcpService.getServer('claude-flow')!
      const updatedTool = updatedServer.tools.find(t => t.name === 'mcp__claude-flow__neural_status')!
      
      expect(updatedTool.usageCount).toBe(initialUsageCount + 1)
      expect(updatedTool.lastUsed).toBeDefined()
      expect(updatedTool.lastUsed).toBeInstanceOf(Date)
    })
  })

  describe('MCP Metrics Collection', () => {
    test('should collect and update metrics', async () => {
      const initialMetrics = mcpService.getMetrics()
      
      // Execute a few tools to generate metrics
      await mcpService.executeTool('claude-flow', 'mcp__claude-flow__swarm_init', { topology: 'mesh' })
      await mcpService.executeTool('claude-flow', 'mcp__claude-flow__agent_spawn', { type: 'coder' })
      await mcpService.executeTool('ruv-swarm', 'mcp__ruv-swarm__swarm_init', { topology: 'star' })
      
      const updatedMetrics = mcpService.getMetrics()
      
      expect(updatedMetrics.totalRequests).toBeGreaterThan(initialMetrics.totalRequests)
      expect(updatedMetrics.successfulRequests).toBeGreaterThan(initialMetrics.successfulRequests)
      expect(updatedMetrics.averageResponseTime).toBeGreaterThan(0)
      expect(updatedMetrics.uptime).toBeGreaterThan(0)
    })

    test('should track server-specific metrics', async () => {
      const initialMetrics = mcpService.getMetrics()
      
      await mcpService.executeTool('claude-flow', 'mcp__claude-flow__swarm_init', { topology: 'mesh' })
      
      const updatedMetrics = mcpService.getMetrics()
      const serverMetrics = updatedMetrics.serverMetrics.get('claude-flow')
      
      expect(serverMetrics).toBeDefined()
      expect(serverMetrics!.serverId).toBe('claude-flow')
      expect(serverMetrics!.requestCount).toBeGreaterThan(0)
      expect(serverMetrics!.responseTime).toBeGreaterThan(0)
      expect(serverMetrics!.lastRequest).toBeInstanceOf(Date)
      expect(serverMetrics!.health).toBeGreaterThan(0)
    })
  })

  describe('MCP Server Health Monitoring', () => {
    test('should monitor server health', async () => {
      const servers = mcpService.getServers()
      
      servers.forEach(server => {
        expect(server.healthScore).toBeGreaterThanOrEqual(0)
        expect(server.healthScore).toBeLessThanOrEqual(100)
        expect(server.lastPing).toBeGreaterThan(0)
        expect(server.status).toMatch(/^(connected|disconnected|error)$/)
      })
    })

    test('should update server health over time', async () => {
      const initialServer = mcpService.getServer('claude-flow')!
      const initialPing = initialServer.lastPing
      
      // Wait for health check interval
      await new Promise(resolve => setTimeout(resolve, 35000))
      
      const updatedServer = mcpService.getServer('claude-flow')!
      expect(updatedServer.lastPing).toBeGreaterThan(initialPing)
    })
  })

  describe('MCP Server Types', () => {
    test('should handle different server types correctly', () => {
      const servers = mcpService.getServers()
      
      const stdioServers = servers.filter(s => s.type === 'stdio')
      const websocketServers = servers.filter(s => s.type === 'websocket')
      
      expect(stdioServers.length).toBeGreaterThan(0)
      expect(websocketServers.length).toBeGreaterThanOrEqual(0)
      
      // Claude Flow and RUV Swarm should be stdio
      expect(stdioServers.find(s => s.id === 'claude-flow')).toBeDefined()
      expect(stdioServers.find(s => s.id === 'ruv-swarm')).toBeDefined()
    })

    test('should execute tools for different server types', async () => {
      const servers = mcpService.getServers()
      
      // Test stdio server
      const stdioServer = servers.find(s => s.type === 'stdio')!
      const stdioResult = await mcpService.executeTool(
        stdioServer.id,
        stdioServer.tools[0].name,
        {}
      )
      expect(stdioResult.success).toBe(true)
      
      // Test websocket server if available
      const websocketServer = servers.find(s => s.type === 'websocket')
      if (websocketServer) {
        const websocketResult = await mcpService.executeTool(
          websocketServer.id,
          websocketServer.tools[0].name,
          {}
        )
        expect(websocketResult).toBeDefined()
      }
    })
  })

  describe('MCP Tool Categories', () => {
    test('should categorize tools correctly', () => {
      const servers = mcpService.getServers()
      
      const allTools = servers.flatMap(s => s.tools)
      const categories = [...new Set(allTools.map(t => t.category))]
      
      expect(categories).toContain('coordination')
      expect(categories).toContain('agents')
      expect(categories).toContain('tasks')
      expect(categories).toContain('neural')
      
      // Check that coordination tools exist
      const coordinationTools = allTools.filter(t => t.category === 'coordination')
      expect(coordinationTools.length).toBeGreaterThan(0)
      
      // Check that agent tools exist
      const agentTools = allTools.filter(t => t.category === 'agents')
      expect(agentTools.length).toBeGreaterThan(0)
    })
  })

  describe('MCP Server Refresh', () => {
    test('should refresh server list', async () => {
      const initialServers = mcpService.getServers()
      const refreshedServers = await mcpService.refreshServers()
      
      expect(refreshedServers).toBeDefined()
      expect(refreshedServers.length).toBe(initialServers.length)
      
      // Check that same servers are present
      const initialIds = initialServers.map(s => s.id).sort()
      const refreshedIds = refreshedServers.map(s => s.id).sort()
      expect(refreshedIds).toEqual(initialIds)
    })
  })

  describe('Performance Benchmarks', () => {
    test('should execute tools within reasonable time limits', async () => {
      const startTime = Date.now()
      
      const result = await mcpService.executeTool(
        'claude-flow',
        'mcp__claude-flow__swarm_init',
        { topology: 'mesh' }
      )
      
      const endTime = Date.now()
      const executionTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.duration).toBeLessThan(3000) // Tool execution should be under 3 seconds
    })

    test('should handle concurrent tool executions', async () => {
      const promises = [
        mcpService.executeTool('claude-flow', 'mcp__claude-flow__swarm_init', { topology: 'mesh' }),
        mcpService.executeTool('claude-flow', 'mcp__claude-flow__agent_spawn', { type: 'coder' }),
        mcpService.executeTool('ruv-swarm', 'mcp__ruv-swarm__swarm_init', { topology: 'star' })
      ]
      
      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.duration).toBeGreaterThan(0)
      })
    })
  })
})