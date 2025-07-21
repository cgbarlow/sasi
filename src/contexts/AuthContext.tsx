/**
 * F1 OAuth React Authentication Context
 * Integrates with F1 OAuth service for SASI neural architecture
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types for authentication context
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: string;
  neuralPermissions?: string[];
  computeQuota?: number;
  synapticConnections?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  login: (provider?: string) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  
  // SASI Integration methods
  connectNeural: () => Promise<{ nodeId: string; status: string } | null>;
  getSASIProfile: () => Promise<any>;
  
  // Token management
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
}

// OAuth configuration
const OAUTH_CONFIG = {
  baseURL: process.env.REACT_APP_OAUTH_BASE_URL || 'http://localhost:3001',
  clientId: process.env.REACT_APP_OAUTH_CLIENT_ID || 'sasi-frontend',
  redirectURI: process.env.REACT_APP_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  scopes: ['openid', 'profile', 'email', 'sasi:neural', 'sasi:compute']
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Token storage keys
const TOKEN_STORAGE_KEY = 'f1_oauth_tokens';
const USER_STORAGE_KEY = 'f1_oauth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens and user from localStorage on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Auto-refresh tokens when they're close to expiring
  useEffect(() => {
    if (tokens && !isTokenExpired()) {
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // 5 minutes before expiry, minimum 1 minute
      
      const timeoutId = setTimeout(() => {
        refreshAuth();
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    }
  }, [tokens]);

  /**
   * Load stored authentication data
   */
  const loadStoredAuth = useCallback(() => {
    try {
      const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        // Check if tokens are expired
        if (parsedTokens.expiresAt > Date.now()) {
          setTokens(parsedTokens);
          setUser(parsedUser);
        } else {
          // Try to refresh expired tokens
          refreshAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store authentication data
   */
  const storeAuth = useCallback((newTokens: AuthTokens, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setTokens(newTokens);
    setUser(newUser);
  }, []);

  /**
   * Clear authentication data
   */
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setTokens(null);
    setUser(null);
  }, []);

  /**
   * Initiate OAuth login flow
   */
  const login = useCallback((provider: string = 'google') => {
    // Generate state for CSRF protection
    const state = generateRandomString();
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const authURL = new URL(`${OAUTH_CONFIG.baseURL}/auth/authorize`);
    authURL.searchParams.set('response_type', 'code');
    authURL.searchParams.set('client_id', OAUTH_CONFIG.clientId);
    authURL.searchParams.set('redirect_uri', OAUTH_CONFIG.redirectURI);
    authURL.searchParams.set('scope', OAUTH_CONFIG.scopes.join(' '));
    authURL.searchParams.set('state', state);

    // Add provider-specific parameters
    if (provider !== 'oauth') {
      // For direct provider login, redirect to provider endpoint
      window.location.href = `${OAUTH_CONFIG.baseURL}/auth/${provider}?return_to=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
    } else {
      // For standard OAuth flow
      window.location.href = authURL.toString();
    }
  }, []);

  /**
   * Handle OAuth callback (call this from your callback component)
   */
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      sessionStorage.removeItem('oauth_state');

      // Exchange code for tokens
      const response = await fetch(`${OAUTH_CONFIG.baseURL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: OAUTH_CONFIG.clientId,
          redirect_uri: OAUTH_CONFIG.redirectURI,
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const tokenData = await response.json();
      
      // Create tokens object
      const newTokens: AuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: 'Bearer'
      };

      // Fetch user info
      const userResponse = await fetch(`${OAUTH_CONFIG.baseURL}/auth/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userResponse.json();
      
      // Get SASI-specific profile data
      const sasiProfile = await getSASIProfileInternal(tokenData.access_token);
      
      const newUser: AuthUser = {
        id: userData.sub,
        name: userData.name,
        email: userData.email,
        avatar: userData.picture,
        provider: userData.provider,
        ...sasiProfile
      };

      storeAuth(newTokens, newUser);
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      clearAuth();
      return false;
    }
  }, [storeAuth, clearAuth]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      if (tokens?.refreshToken) {
        // Revoke tokens on server
        await fetch(`${OAUTH_CONFIG.baseURL}/auth/logout?token=${encodeURIComponent(tokens.refreshToken)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  }, [tokens, clearAuth]);

  /**
   * Refresh access token
   */
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${OAUTH_CONFIG.baseURL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: OAUTH_CONFIG.clientId,
        }),
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const tokenData = await response.json();
      
      const newTokens: AuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: 'Bearer'
      };

      setTokens(newTokens);
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return false;
    }
  }, [tokens, clearAuth]);

  /**
   * Connect to SASI neural network
   */
  const connectNeural = useCallback(async () => {
    if (!tokens?.accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${OAUTH_CONFIG.baseURL}/api/sasi/neural/connect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Neural connection failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Neural connection error:', error);
      return null;
    }
  }, [tokens]);

  /**
   * Get SASI profile data
   */
  const getSASIProfile = useCallback(async () => {
    if (!tokens?.accessToken) {
      return null;
    }

    return await getSASIProfileInternal(tokens.accessToken);
  }, [tokens]);

  /**
   * Internal helper for fetching SASI profile
   */
  const getSASIProfileInternal = async (accessToken: string) => {
    try {
      const response = await fetch(`${OAUTH_CONFIG.baseURL}/api/sasi/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('SASI profile fetch error:', error);
    }
    return {};
  };

  /**
   * Get current access token
   */
  const getAccessToken = useCallback(() => {
    if (tokens && !isTokenExpired()) {
      return tokens.accessToken;
    }
    return null;
  }, [tokens]);

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback(() => {
    if (!tokens) return true;
    return Date.now() >= tokens.expiresAt;
  }, [tokens]);

  // Context value
  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens && !isTokenExpired(),
    login,
    logout,
    refreshAuth,
    connectNeural,
    getSASIProfile,
    getAccessToken,
    isTokenExpired
  };

  // Expose handleCallback for use in callback component
  (value as any).handleCallback = handleCallback;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Utility function to generate random string
 */
function generateRandomString(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}