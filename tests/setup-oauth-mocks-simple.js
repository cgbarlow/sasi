/**
 * Simplified OAuth DOM Mocking Setup for Jest
 * Minimal approach that avoids window.location redefinition issues
 */

// Only add OAuth utilities without trying to redefine existing objects
global.oauthTestUtils = {
  /**
   * Mock successful OAuth token exchange
   */
  mockTokenExchange: (tokens = {}) => {
    const defaultTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: ['profile', 'projects']
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...defaultTokens, ...tokens })
    });
  },
  
  /**
   * Mock OAuth token exchange failure
   */
  mockTokenExchangeFailure: (error = {}) => {
    const defaultError = {
      error: 'invalid_grant',
      error_description: 'Authorization code is invalid'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ ...defaultError, ...error })
    });
  },
  
  /**
   * Mock user profile API response
   */
  mockUserProfile: (profile = {}) => {
    const defaultProfile = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      subscription: { plan: 'pro' },
      limits: {
        max_tokens: 100000,
        max_projects: 10,
        max_agents: 5
      }
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...defaultProfile, ...profile })
    });
  },
  
  /**
   * Setup sessionStorage with OAuth state
   */
  setupOAuthState: (state = 'test-state', verifier = 'test-verifier') => {
    global.sessionStorage.setItem('auth_state', state);
    global.sessionStorage.setItem('pkce_verifier', verifier);
  },
  
  /**
   * Clear OAuth state from sessionStorage
   */
  clearOAuthState: () => {
    global.sessionStorage.removeItem('auth_state');
    global.sessionStorage.removeItem('pkce_verifier');
  },
  
  /**
   * Mock safe window.location.href assignment
   */
  mockLocationHref: () => {
    const mockSetter = jest.fn();
    
    try {
      // Try to safely override href setter
      Object.defineProperty(window.location, 'href', {
        set: mockSetter,
        get: () => window.location._href || 'http://localhost:3000/',
        configurable: true
      });
    } catch (error) {
      // If that fails, create a spy on the existing setter
      const originalHref = window.location.href;
      Object.defineProperty(window.location, '_mockHref', {
        value: mockSetter,
        writable: true,
        configurable: true
      });
      
      // Return a function that tracks calls
      return jest.fn().mockImplementation((url) => {
        mockSetter(url);
        // Don't actually navigate in tests
        return undefined;
      });
    }
    
    return mockSetter;
  },
  
  /**
   * Reset all OAuth mocks
   */
  resetMocks: () => {
    jest.clearAllMocks();
    global.sessionStorage.clear();
    global.localStorage.clear();
    
    // Reset crypto mock to generate new values
    if (global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });
    }
  }
};

console.log('🔐 Simplified OAuth test utilities loaded');