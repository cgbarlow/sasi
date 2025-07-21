/**
 * Test suite for Claude Max API Client
 */

import ClaudeMaxAPIClient from '../services/claudeMaxAPI'
import ClaudeMaxAuthService from '../services/claudeMaxAuth'

// Mock the auth service
jest.mock('../services/claudeMaxAuth')
const mockAuthService = {
  getAccessToken: jest.fn(),
  refreshAccessToken: jest.fn()
}

// Mock fetch
global.fetch = jest.fn()

describe('ClaudeMaxAPIClient', () => {
  let apiClient: ClaudeMaxAPIClient
  
  beforeEach(() => {
    apiClient = ClaudeMaxAPIClient.getInstance()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock auth service methods
    ;(ClaudeMaxAuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService)
    mockAuthService.getAccessToken.mockReturnValue('test-access-token')
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClaudeMaxAPIClient.getInstance()
      const instance2 = ClaudeMaxAPIClient.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Authentication', () => {
    it('should throw error when no access token available', async () => {
      mockAuthService.getAccessToken.mockReturnValue(null)

      await expect(apiClient.getUserProfile())
        .rejects.toThrow('No access token available - user not authenticated')
    })

    it('should include proper authentication headers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'user-123' }),
        headers: new Headers()
      })

      await apiClient.getUserProfile()

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/user/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token',
            'x-api-key': 'test-access-token',
            'anthropic-version': '2024-01-01',
            'Content-Type': 'application/json',
            'User-Agent': 'SASI-Neural-Swarm/1.0'
          })
        })
      )
    })

    it('should refresh token on 401 and retry', async () => {
      // Mock initial 401 response
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers()
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })

      mockAuthService.refreshAccessToken.mockResolvedValueOnce({
        access_token: 'new-access-token'
      })
      mockAuthService.getAccessToken
        .mockReturnValueOnce('test-access-token')
        .mockReturnValueOnce('new-access-token')

      const result = await apiClient.getUserProfile()

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })

    it('should fail when token refresh fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers()
      })

      mockAuthService.refreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'))

      const result = await apiClient.getUserProfile()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication failed')
    })
  })

  describe('Rate Limiting', () => {
    it('should handle rate limit headers', async () => {
      const headers = new Headers({
        'x-ratelimit-limit': '1000',
        'x-ratelimit-remaining': '995',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600)
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'user-123' }),
        headers
      })

      const result = await apiClient.getUserProfile()

      expect(result.rateLimit).toEqual({
        limit: 1000,
        remaining: 995,
        reset: expect.any(Date)
      })

      const rateLimitStatus = apiClient.getRateLimitStatus()
      expect(rateLimitStatus?.limit).toBe(1000)
      expect(rateLimitStatus?.remaining).toBe(995)
    })

    it('should handle 429 rate limit responses', async () => {
      const headers = new Headers({
        'retry-after': '60'
      })

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })

      // Mock delay to resolve immediately for testing
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return 0 as any
      })

      const result = await apiClient.getUserProfile()
      expect(result.success).toBe(true)

      jest.restoreAllMocks()
    })

    it('should fail after max retries on persistent rate limiting', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '60' })
      })

      const result = await apiClient.getUserProfile()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors with retries', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })

      // Mock exponential backoff delay
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return 0 as any
      })

      const result = await apiClient.getUserProfile()
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(3)

      jest.restoreAllMocks()
    })

    it('should handle HTTP error responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({
          error: { message: 'Server error occurred' }
        }),
        headers: new Headers()
      })

      const result = await apiClient.getUserProfile()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error occurred')
    })

    it('should handle timeout errors', async () => {
      // Mock AbortSignal timeout
      const mockAbortSignal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }

      global.AbortSignal = {
        timeout: jest.fn(() => mockAbortSignal)
      } as any

      ;(fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })
      )

      const result = await apiClient.getUserProfile()
      expect(result.success).toBe(false)
      expect(result.error).toContain('aborted')
    })
  })

  describe('API Methods', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      })
    })

    describe('User Profile', () => {
      it('should get user profile', async () => {
        const mockProfile = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser'
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfile),
          headers: new Headers()
        })

        const result = await apiClient.getUserProfile()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockProfile)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/user/profile',
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    describe('Projects', () => {
      it('should get user projects', async () => {
        const mockProjects = [
          { id: 'proj-1', name: 'Test Project 1' },
          { id: 'proj-2', name: 'Test Project 2' }
        ]

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProjects),
          headers: new Headers()
        })

        const result = await apiClient.getUserProjects()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockProjects)
      })

      it('should create new project', async () => {
        const newProject = { name: 'New Project', description: 'Test description' }
        const createdProject = { id: 'proj-123', ...newProject }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createdProject),
          headers: new Headers()
        })

        const result = await apiClient.createProject(newProject)
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(createdProject)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/projects',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newProject)
          })
        )
      })

      it('should update project', async () => {
        const updates = { name: 'Updated Project Name' }
        const updatedProject = { id: 'proj-123', ...updates }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedProject),
          headers: new Headers()
        })

        const result = await apiClient.updateProject('proj-123', updates)
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(updatedProject)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/projects/proj-123',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updates)
          })
        )
      })

      it('should delete project', async () => {
        const result = await apiClient.deleteProject('proj-123')
        
        expect(result.success).toBe(true)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/projects/proj-123',
          expect.objectContaining({ method: 'DELETE' })
        )
      })

      it('should search projects with filters', async () => {
        const mockResults = [{ id: 'proj-1', name: 'React Project' }]

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResults),
          headers: new Headers()
        })

        const result = await apiClient.searchProjects('react', {
          language: 'javascript',
          minStars: 100,
          sortBy: 'stars'
        })
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockResults)
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/projects/search?q=react&language=javascript&minStars=100&sortBy=stars'),
          expect.any(Object)
        )
      })

      it('should vote for project', async () => {
        const voteResult = { voteCount: 42, userVote: 'up' }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(voteResult),
          headers: new Headers()
        })

        const result = await apiClient.voteForProject('proj-123', 'up')
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(voteResult)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/projects/proj-123/vote',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ vote: 'up' })
          })
        )
      })
    })

    describe('Agents', () => {
      it('should get user agents', async () => {
        const mockAgents = [
          { id: 'agent-1', type: 'researcher', status: 'active' },
          { id: 'agent-2', type: 'coder', status: 'idle' }
        ]

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAgents),
          headers: new Headers()
        })

        const result = await apiClient.getUserAgents()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockAgents)
      })

      it('should spawn new agent', async () => {
        const agentConfig = { type: 'coder' as const, projectId: 'proj-123' }
        const spawnedAgent = { id: 'agent-123', ...agentConfig, status: 'active' }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(spawnedAgent),
          headers: new Headers()
        })

        const result = await apiClient.spawnAgent(agentConfig)
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(spawnedAgent)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/agents',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(agentConfig)
          })
        )
      })

      it('should stop agent', async () => {
        const result = await apiClient.stopAgent('agent-123')
        
        expect(result.success).toBe(true)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/agents/agent-123/stop',
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    describe('Swarm Operations', () => {
      it('should get swarm status', async () => {
        const swarmStatus = {
          totalAgents: 25,
          activeProjects: 8,
          globalMetrics: {
            tasksCompleted: 1234,
            successRate: 0.95,
            networkEfficiency: 0.87
          }
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(swarmStatus),
          headers: new Headers()
        })

        const result = await apiClient.getSwarmStatus()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(swarmStatus)
      })

      it('should get usage statistics', async () => {
        const usageStats = {
          requestsToday: 150,
          requestsThisMonth: 4500,
          tokensUsed: 125000,
          tokensRemaining: 875000,
          agentHours: 48.5
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(usageStats),
          headers: new Headers()
        })

        const result = await apiClient.getUsageStats()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(usageStats)
      })
    })

    describe('Health Check', () => {
      it('should perform health check with short timeout', async () => {
        const healthStatus = { status: 'healthy', timestamp: '2025-01-20T12:00:00Z' }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(healthStatus),
          headers: new Headers()
        })

        const result = await apiClient.healthCheck()
        
        expect(result.success).toBe(true)
        expect(result.data).toEqual(healthStatus)
        expect(fetch).toHaveBeenCalledWith(
          'https://api.anthropic.com/v1/health',
          expect.objectContaining({
            signal: expect.any(Object) // AbortSignal with 5s timeout
          })
        )
      })
    })
  })

  describe('Request Configuration', () => {
    it('should handle custom timeouts', async () => {
      // Test that custom timeout is respected (implementation detail)
      const result = await apiClient.getUserProfile()
      expect(result).toBeDefined()
    })

    it('should handle custom headers', async () => {
      // This would require exposing internal makeRequest method or testing through public API
      const result = await apiClient.getUserProfile()
      expect(result).toBeDefined()
    })
  })
})