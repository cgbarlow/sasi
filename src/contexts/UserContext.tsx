import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import ClaudeMaxAuthService, { ClaudeMaxUser } from '../services/claudeMaxAuth'

interface User {
  id: string
  username: string
  email: string
  avatarUrl: string
  claudeMaxPlan: boolean
  joinedAt: Date
  contributionScore: number
  activeAgents: number
  // Extended Claude Max properties
  plan?: 'pro' | 'team' | 'enterprise'
  organizationId?: string
  permissions?: string[]
  accountLimits?: {
    maxTokens: number
    maxProjects: number
    maxAgents: number
  }
}

interface UserContextType {
  user: User | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  login: (credentials: { username: string; password: string }) => Promise<void>
  loginWithClaudeMax: () => Promise<void>
  setAuthenticatedUser: (claudeMaxUser: ClaudeMaxUser) => void
  logout: () => void
  mockLogin: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const authService = ClaudeMaxAuthService.getInstance()

  const isAuthenticated = user !== null

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const claudeMaxUser = await authService.initializeFromStorage()
        if (claudeMaxUser) {
          setAuthenticatedUser(claudeMaxUser)
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
      }
    }
    
    initializeAuth()
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    // Mock authentication - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate successful login
    const mockUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      username: credentials.username,
      email: `${credentials.username}@example.com`,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${credentials.username}`,
      claudeMaxPlan: true,
      joinedAt: new Date(),
      contributionScore: Math.floor(Math.random() * 10000),
      activeAgents: Math.floor(Math.random() * 5) + 1
    }
    
    setUser(mockUser)
    setIsAuthModalOpen(false)
  }

  const loginWithClaudeMax = async () => {
    try {
      await authService.initiateAuth()
    } catch (error) {
      console.error('Claude Max login failed:', error)
      throw error
    }
  }

  const setAuthenticatedUser = (claudeMaxUser: ClaudeMaxUser) => {
    const user: User = {
      id: claudeMaxUser.id,
      username: claudeMaxUser.username,
      email: claudeMaxUser.email,
      avatarUrl: claudeMaxUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${claudeMaxUser.username}`,
      claudeMaxPlan: true,
      joinedAt: new Date(),
      contributionScore: Math.floor(Math.random() * 10000), // TODO: Get from API
      activeAgents: claudeMaxUser.accountLimits.maxAgents,
      // Extended Claude Max properties
      plan: claudeMaxUser.plan,
      organizationId: claudeMaxUser.organizationId,
      permissions: claudeMaxUser.permissions,
      accountLimits: claudeMaxUser.accountLimits
    }
    setUser(user)
    setIsAuthModalOpen(false)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const mockLogin = () => {
    // Quick mock login for demo purposes
    const mockUser: User = {
      id: 'demo_user',
      username: 'CodeSwarmLeader',
      email: 'demo@sasi-home.org',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CodeSwarmLeader',
      claudeMaxPlan: true,
      joinedAt: new Date('2024-01-15'),
      contributionScore: 47829,
      activeAgents: 3
    }
    
    setUser(mockUser)
    setIsAuthModalOpen(false)
  }

  const value: UserContextType = {
    user,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    loginWithClaudeMax,
    setAuthenticatedUser,
    logout,
    mockLogin
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}