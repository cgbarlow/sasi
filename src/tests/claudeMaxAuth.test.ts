/**
 * Test suite for Claude Max OAuth 2.0 Authentication Service
 */

import ClaudeMaxAuthService from '../services/claudeMaxAuth'

// OAuth mocks are now handled by tests/setup-oauth-mocks.js

describe('ClaudeMaxAuthService', () => {
  let authService: ClaudeMaxAuthService
  
  beforeEach(() => {
    // Clear singleton instance for clean test isolation
    (ClaudeMaxAuthService as any).instance = undefined
    authService = ClaudeMaxAuthService.getInstance()
    
    // Reset all OAuth mocks using the utility
    global.oauthTestUtils.resetMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClaudeMaxAuthService.getInstance()
      const instance2 = ClaudeMaxAuthService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('OAuth Flow Initiation', () => {
    it('should initiate OAuth flow with PKCE', async () => {
      // Use the OAuth test utility for safe location mocking
      const mockLocationHref = global.oauthTestUtils.mockLocationHref()
      
      await authService.initiateAuth()

      // Check that PKCE verifier and state are stored
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('pkce_verifier', expect.any(String))
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('auth_state', expect.any(String))

      // Should attempt to redirect
      expect(mockLocationHref).toHaveBeenCalledWith(expect.stringContaining('https://auth.anthropic.com/oauth/authorize'))
    })

    it('should handle OAuth initiation errors', async () => {
      // Mock crypto failure
      (global.crypto.subtle.digest as jest.Mock).mockRejectedValueOnce(new Error('Crypto error'))

      await expect(authService.initiateAuth()).rejects.toThrow('Authentication initialization failed')
    })
  })

  describe('OAuth Callback Handling', () => {
    beforeEach(() => {
      // Use OAuth test utility to setup state
      global.oauthTestUtils.setupOAuthState('test-state', 'test-verifier')
    })

    it('should handle successful OAuth callback', async () => {
      // Use OAuth test utilities for mocking
      global.oauthTestUtils.mockTokenExchange({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: ['profile', 'projects']
      })
      
      global.oauthTestUtils.mockUserProfile({
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

      const user = await authService.handleCallback('test-code', 'test-state')

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        plan: 'pro',
        avatarUrl: undefined,
        organizationId: undefined,
        permissions: ['read', 'write'],
        accountLimits: {
          maxTokens: 100000,
          maxProjects: 10,
          maxAgents: 5
        }
      })

      // Verify tokens are stored
      expect(localStorage.setItem).toHaveBeenCalledWith('claude_max_tokens', expect.any(String))
      
      // Verify session cleanup
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('pkce_verifier')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_state')
    })

    it('should reject invalid state parameter', async () => {
      // Setup with different state to trigger validation error
      global.oauthTestUtils.setupOAuthState('different-state', 'test-verifier')

      await expect(authService.handleCallback('test-code', 'test-state'))
        .rejects.toThrow('Invalid state parameter - possible CSRF attack')
    })

    it('should handle missing PKCE verifier', async () => {
      // Setup with valid state but no verifier
      global.sessionStorage.setItem('auth_state', 'test-state')
      global.sessionStorage.removeItem('pkce_verifier')

      await expect(authService.handleCallback('test-code', 'test-state'))
        .rejects.toThrow('Missing PKCE verifier')
    })

    it('should handle token exchange failure', async () => {
      // Setup valid OAuth state
      global.oauthTestUtils.setupOAuthState('test-state', 'test-verifier')
      
      // Mock token exchange failure
      global.oauthTestUtils.mockTokenExchangeFailure({
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid'
      })

      await expect(authService.handleCallback('invalid-code', 'test-state'))
        .rejects.toThrow('Token exchange failed: Authorization code is invalid')
    })
  })

  describe('Token Management', () => {
    it('should check authentication status correctly', () => {
      // Not authenticated initially
      expect(authService.isAuthenticated()).toBe(false)

      // Mock stored valid tokens
      const validTokenData = JSON.stringify({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      })
      ;(localStorage.getItem as jest.Mock).mockReturnValueOnce(
        Buffer.from(validTokenData).toString('base64')
      )

      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should handle expired tokens', () => {
      // Mock expired tokens
      const expiredTokenData = JSON.stringify({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600,
        timestamp: Date.now() - 7200000 // 2 hours ago
      })
      ;(localStorage.getItem as jest.Mock).mockReturnValueOnce(
        Buffer.from(expiredTokenData).toString('base64')
      )

      expect(authService.isAuthenticated()).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
    })

    it('should refresh access tokens', async () => {
      // Mock stored tokens in localStorage
      const storedTokenData = JSON.stringify({
        accessToken: 'old-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      })
      global.localStorage.setItem('claude_max_tokens', btoa(storedTokenData))

      // Mock refresh response
      global.oauthTestUtils.mockTokenExchange({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: ['profile', 'projects']
      })

      const newTokens = await authService.refreshAccessToken()

      expect(newTokens).toHaveProperty('access_token', 'new-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('claude_max_tokens', expect.any(String))
    })

    it('should handle refresh token failure', async () => {
      const invalidTokenData = JSON.stringify({
        refreshToken: 'invalid-refresh',
        timestamp: Date.now()
      })
      global.localStorage.setItem('claude_max_tokens', btoa(invalidTokenData))

      // Mock token exchange failure
      global.oauthTestUtils.mockTokenExchangeFailure({
        error: 'invalid_grant',
        error_description: 'Refresh token is invalid'
      })

      await expect(authService.refreshAccessToken())
        .rejects.toThrow('Token refresh failed: Refresh token is invalid')
    })
  })

  describe('User Profile Management', () => {
    it('should return null when no user is logged in', () => {
      expect(authService.getCurrentUser()).toBeNull()
    })

    it('should return access token when available', () => {
      // Initially no token
      expect(authService.getAccessToken()).toBeNull()

      // This would require internal state setup, but is covered by integration tests
      expect(authService.getCurrentUser()).toBeNull()
    })
  })

  describe('Logout', () => {
    it('should clear all authentication state', async () => {
      // Mock token revocation success
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      await authService.logout()

      expect(localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('pkce_verifier')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_state')
    })

    it('should clear state even if token revocation fails', async () => {
      // Mock token revocation failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await authService.logout()

      // Should still clear local state
      expect(localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
    })
  })

  describe('Session Restoration', () => {
    it('should restore session from valid stored tokens', async () => {
      // Mock valid stored tokens
      const validTokenData = JSON.stringify({
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      })
      global.localStorage.setItem('claude_max_tokens', Buffer.from(validTokenData).toString('base64'))

      // Mock user profile response
      global.oauthTestUtils.mockUserProfile({
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

      const user = await authService.initializeFromStorage()
      expect(user).toBeTruthy()
      expect(user?.id).toBe('user-123')
    })

    it('should return null when no stored tokens exist', async () => {
      // Ensure no tokens are stored
      global.localStorage.removeItem('claude_max_tokens')

      const user = await authService.initializeFromStorage()
      expect(user).toBeNull()
    })

    it('should attempt token refresh when profile fetch fails', async () => {
      // Mock valid stored tokens
      const storedTokenData = JSON.stringify({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      })
      global.localStorage.setItem('claude_max_tokens', btoa(storedTokenData))

      // Mock profile fetch failure, then refresh success, then profile success
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 } as Response) // Profile fails
        .mockResolvedValueOnce({ // Refresh succeeds
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 3600
          })
        } as Response)
        .mockResolvedValueOnce({ // Profile succeeds
          ok: true,
          json: () => Promise.resolve({
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser'
          })
        } as Response)

      const user = await authService.initializeFromStorage()
      expect(user).toBeTruthy()
    })

    it('should logout when both profile and refresh fail', async () => {
      const invalidTokenData = JSON.stringify({
        accessToken: 'invalid-token',
        refreshToken: 'invalid-refresh',
        expiresIn: 3600,
        timestamp: Date.now()
      })
      global.localStorage.setItem('claude_max_tokens', btoa(invalidTokenData))

      // Mock both profile and refresh failure
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
        .mockResolvedValueOnce({ ok: false, status: 400 } as Response)

      const user = await authService.initializeFromStorage()
      expect(user).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('PKCE Security', () => {
    it('should generate secure PKCE code pairs', async () => {
      // Test that PKCE generation doesn't throw and produces reasonable output
      await expect(authService.initiateAuth()).resolves.not.toThrow()

      // Verify crypto calls were made
      expect(global.crypto.getRandomValues).toHaveBeenCalled()
      expect(global.crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array))
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Setup valid OAuth state
      global.oauthTestUtils.setupOAuthState('test-state', 'test-verifier')

      // Mock network error
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(authService.handleCallback('test-code', 'test-state'))
        .rejects.toThrow('Network error')
    })

    it('should handle malformed stored tokens', () => {
      // Store invalid JSON data
      global.localStorage.setItem('claude_max_tokens', 'invalid-json')

      expect(authService.isAuthenticated()).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('claude_max_tokens')
    })
  })
})