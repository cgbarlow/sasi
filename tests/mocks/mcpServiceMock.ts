/**
 * Mock MCP Service for Testing
 * Prevents act() warnings and object rendering errors
 */

export const mockMcpService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  
  getServers: jest.fn().mockReturnValue([
    {
      id: 'test-server-1',
      name: 'Test Server 1',
      version: '1.0.0',
      type: 'test',
      status: 'connected',
      healthScore: 95,
      tools: [
        {
          name: 'test-tool',
          description: 'A test tool',
          category: 'testing',
          parameters: { input: 'string' },
          usageCount: 10,
          successRate: 98.5,
          averageResponseTime: 45,
          lastUsed: new Date()
        }
      ]
    }
  ]),
  
  getMetrics: jest.fn().mockReturnValue({
    totalRequests: 100,
    successfulRequests: 95,
    averageResponseTime: 150,
    uptime: 3600000
  }),
  
  refreshServers: jest.fn().mockResolvedValue([]),
  
  executeTool: jest.fn().mockResolvedValue({
    toolName: 'test-tool',
    parameters: {},
    timestamp: new Date(),
    success: true,
    response: 'Test response',
    duration: 50,
    error: null
  })
};

// Mock the entire service module
jest.mock('../../src/services/McpService', () => ({
  mcpService: mockMcpService,
  McpServer: {},
  McpTool: {},
  McpMetrics: {},
  McpExecutionResult: {}
}));

export default mockMcpService;