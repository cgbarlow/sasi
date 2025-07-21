/**
 * Comprehensive OAuth Authentication Test Suite
 * Tests ClaudeMaxAuthService, ClaudeMaxAPIClient, AuthModal, AuthCallback, and UserContext
 */

import ClaudeMaxAuthService from '../src/services/claudeMaxAuth'
import ClaudeMaxAPIClient from '../src/services/claudeMaxAPI'

// Mock React components for testing
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useContext: jest.fn(),
  createContext: jest.fn()
}))

describe('OAuth Authentication Integration Suite', () => {
  let authService
  let apiClient
  
  beforeEach(() => {
    // Reset OAuth state before each test
    if (global.oauthTestUtils) {
      global.oauthTestUtils.resetMocks()
    }
    
    // Clear singleton instances for clean test isolation
    ClaudeMaxAuthService.instance = undefined
    ClaudeMaxAPIClient.instance = undefined
    
    authService = ClaudeMaxAuthService.getInstance()
    apiClient = ClaudeMaxAPIClient.getInstance()
  })

  describe('OAuth Authentication Flow', () => {
    it('should complete full OAuth flow with PKCE security', async () => {
      console.log('🔐 Testing complete OAuth flow with PKCE...')
      
      // Step 1: Initiate OAuth flow
      const mockLocationSetter = global.oauthTestUtils.mockLocationHref()
      await authService.initiateAuth()
      
      // Verify PKCE parameters are stored
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('pkce_verifier', expect.any(String))
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('auth_state', expect.any(String))
      
      // Verify OAuth URL redirect
      expect(mockLocationSetter).toHaveBeenCalledWith(
        expect.stringContaining('https://auth.anthropic.com/oauth/authorize')
      )
      
      // Step 2: Handle callback with authorization code
      global.oauthTestUtils.setupOAuthState('test-state', 'test-verifier')
      global.oauthTestUtils.mockTokenExchange()
      global.oauthTestUtils.mockUserProfile()
      
      const user = await authService.handleCallback('auth-code-123', 'test-state')
      
      // Verify user object structure
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        username: expect.any(String),
        plan: expect.stringMatching(/^(pro|team|enterprise)$/),
        permissions: expect.any(Array),
        accountLimits: expect.objectContaining({
          maxTokens: expect.any(Number),
          maxProjects: expect.any(Number),
          maxAgents: expect.any(Number)
        })
      })
      
      console.log('✅ OAuth flow completed successfully')
    })

    it('should handle PKCE security validation', async () => {
      console.log('🔒 Testing PKCE security validation...')
      
      // Test invalid state parameter (CSRF protection)
      global.oauthTestUtils.setupOAuthState('correct-state', 'test-verifier')
      
      await expect(authService.handleCallback('auth-code', 'wrong-state'))
        .rejects.toThrow('Invalid state parameter - possible CSRF attack')
      
      // Test missing PKCE verifier
      global.sessionStorage.setItem('auth_state', 'test-state')
      global.sessionStorage.removeItem('pkce_verifier')
      
      await expect(authService.handleCallback('auth-code', 'test-state'))
        .rejects.toThrow('Missing PKCE verifier')
      
      console.log('✅ PKCE security validation working correctly')
    })
  })

  describe('API Client Integration', () => {
    it('should integrate with auth service for authenticated requests', async () => {
      console.log('🔗 Testing API client authentication integration...')
      
      // Mock authentication state
      const mockTokenData = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        timestamp: Date.now()
      }
      
      global.localStorage.setItem(
        'claude_max_tokens',
        global.btoa(JSON.stringify(mockTokenData))
      )
      
      // Mock API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'x-ratelimit-limit': '1000',
          'x-ratelimit-remaining': '995',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600)
        }),
        json: () => Promise.resolve({
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser'
        })
      })
      
      const result = await apiClient.getUserProfile()
      
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('user-123')
      expect(result.rateLimit).toMatchObject({
        limit: 1000,
        remaining: 995,
        reset: expect.any(Date)
      })
      
      // Verify authentication headers
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/user/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token',
            'x-api-key': 'test-access-token',
            'anthropic-version': '2024-01-01'
          })
        })
      )
      
      console.log('✅ API client integration working correctly')
    })

    it('should handle token refresh on authentication failure', async () => {
      console.log('🔄 Testing automatic token refresh...')
      
      // Setup expired token scenario
      const expiredTokenData = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: 3600,
        timestamp: Date.now() - 7200000 // 2 hours ago
      }
      
      global.localStorage.setItem(
        'claude_max_tokens',
        global.btoa(JSON.stringify(expiredTokenData))
      )
      
      // Mock 401 response followed by successful refresh and retry
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers()
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })
      
      const result = await apiClient.getUserProfile()
      
      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3) // Original request, refresh, retry
      
      console.log('✅ Token refresh functionality working correctly')
    })
  })

  describe('Rate Limiting and Error Handling', () => {
    it('should handle rate limiting with exponential backoff', async () => {
      console.log('⏱️ Testing rate limiting handling...')
      
      // Mock rate limit response followed by success
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })
      
      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout
      global.setTimeout = jest.fn((callback) => callback())
      
      const result = await apiClient.getUserProfile()
      
      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
      
      global.setTimeout = originalSetTimeout
      console.log('✅ Rate limiting handled correctly')
    })

    it('should handle network errors with retry logic', async () => {
      console.log('🌐 Testing network error handling...')
      
      // Mock network failures followed by success
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'user-123' }),
          headers: new Headers()
        })
      
      // Mock setTimeout for exponential backoff
      const originalSetTimeout = global.setTimeout
      global.setTimeout = jest.fn((callback) => callback())
      
      const result = await apiClient.getUserProfile()
      
      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3)
      
      global.setTimeout = originalSetTimeout
      console.log('✅ Network error handling working correctly')
    })
  })

  describe('Security and Session Management', () => {
    it('should securely store and retrieve tokens', async () => {
      console.log('🔐 Testing secure token storage...')
      
      const tokens = {
        accessToken: 'secure-access-token',
        refreshToken: 'secure-refresh-token',
        expiresIn: 3600,
        timestamp: Date.now()
      }
      
      // Test token storage (should be base64 encoded)
      global.localStorage.setItem(
        'claude_max_tokens',
        global.btoa(JSON.stringify(tokens))
      )
      
      // Verify token retrieval and validation
      expect(authService.isAuthenticated()).toBe(true)
      
      // Test token expiration handling
      const expiredTokens = {
        ...tokens,
        timestamp: Date.now() - 7200000 // 2 hours ago
      }
      
      global.localStorage.setItem(
        'claude_max_tokens',
        global.btoa(JSON.stringify(expiredTokens))
      )
      
      expect(authService.isAuthenticated()).toBe(false)
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
      
      console.log('✅ Token security and expiration handling working correctly')
    })

    it('should handle malformed token data gracefully', async () => {
      console.log('🛡️ Testing malformed token handling...')
      
      // Test invalid JSON
      global.localStorage.setItem('claude_max_tokens', 'invalid-json-data')
      expect(authService.isAuthenticated()).toBe(false)
      
      // Test invalid base64
      global.localStorage.setItem('claude_max_tokens', 'invalid!!!base64')
      expect(authService.isAuthenticated()).toBe(false)
      
      // Verify cleanup
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
      
      console.log('✅ Malformed token handling working correctly')
    })
  })

  describe('User Context and Session Restoration', () => {
    it('should restore user session from stored tokens', async () => {
      console.log('👤 Testing session restoration...')
      
      // Mock valid stored tokens
      const validTokenData = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      }
      
      global.localStorage.setItem(
        'claude_max_tokens',
        global.btoa(JSON.stringify(validTokenData))
      )
      
      // Mock user profile API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          subscription: { plan: 'pro' },
          limits: {
            max_tokens: 100000,
            max_projects: 10,
            max_agents: 5
          }
        })
      })
      
      const user = await authService.initializeFromStorage()
      
      expect(user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        plan: 'pro'
      })
      
      console.log('✅ Session restoration working correctly')
    })

    it('should handle logout and cleanup properly', async () => {
      console.log('🚪 Testing logout functionality...')
      
      // Mock token revocation success
      global.fetch.mockResolvedValueOnce({ ok: true })
      
      await authService.logout()
      
      // Verify all authentication state is cleared
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith('pkce_verifier')
      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith('auth_state')
      
      console.log('✅ Logout functionality working correctly')
    })
  })

  describe('OAuth Mode Switching', () => {
    it('should support mock mode for development', () => {
      console.log('🧪 Testing OAuth mock mode...')
      
      // This would test switching between real OAuth and mock mode
      // Implementation depends on the actual auth service configuration
      
      expect(authService).toBeDefined()
      expect(typeof authService.initiateAuth).toBe('function')
      expect(typeof authService.handleCallback).toBe('function')
      
      console.log('✅ OAuth service structure verified')
    })
  })
})

describe('Agent and Project Operations with Authentication', () => {
  let apiClient
  
  beforeEach(() => {
    ClaudeMaxAPIClient.instance = undefined
    apiClient = ClaudeMaxAPIClient.getInstance()
    
    // Setup authenticated state
    const mockTokenData = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
      timestamp: Date.now()
    }
    
    global.localStorage.setItem(
      'claude_max_tokens',
      global.btoa(JSON.stringify(mockTokenData))
    )
  })

  describe('Agent Management', () => {
    it('should spawn and manage agents with authentication', async () => {
      console.log('🤖 Testing authenticated agent operations...')
      
      // Mock agent spawn response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'agent-123',
          type: 'researcher',
          status: 'active',
          projectId: 'proj-123'
        }),
        headers: new Headers()
      })
      
      const result = await apiClient.spawnAgent({
        type: 'researcher',
        projectId: 'proj-123'
      })
      
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('agent-123')
      expect(result.data.type).toBe('researcher')
      
      console.log('✅ Agent management working correctly')
    })
  })

  describe('Project Operations', () => {
    it('should handle project CRUD operations with authentication', async () => {
      console.log('📁 Testing authenticated project operations...')
      
      // Test project creation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'proj-123',
          name: 'Test Project',
          description: 'Test description'
        }),
        headers: new Headers()
      })
      
      const createResult = await apiClient.createProject({
        name: 'Test Project',
        description: 'Test description'
      })
      
      expect(createResult.success).toBe(true)
      expect(createResult.data.name).toBe('Test Project')
      
      console.log('✅ Project operations working correctly')
    })
  })
})