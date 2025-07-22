/**
 * F1 OAuth Service Types
 * Comprehensive TypeScript definitions for SASI OAuth integration
 */

import { Request } from 'express'

// User Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  providerId: string
  provider: OAuthProvider
  neuralPermissions: NeuralPermissions
  computeQuota: ComputeQuota
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

export interface UserProfile {
  displayName: string
  bio?: string
  location?: string
  website?: string
  preferences: UserPreferences
  neuralSettings: NeuralSettings
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: boolean
  analyticsOptIn: boolean
}

export interface NeuralSettings {
  enableSynapticMesh: boolean
  defaultNetworkTopology: 'mesh' | 'hierarchical' | 'ring' | 'star'
  maxConcurrentConnections: number
  preferredAgentTypes: string[]
}

// OAuth Types
export type OAuthProvider = 'google' | 'github' | 'custom'

export interface OAuthProfile {
  id: string
  email: string
  name: string
  avatar?: string
  provider: OAuthProvider
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}

// JWT Types
export interface JWTPayload {
  sub: string // User ID
  email: string
  name: string
  provider: OAuthProvider
  permissions: string[]
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  sub: string
  tokenId: string
  iat: number
  exp: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

// Neural Integration Types
export interface NeuralPermissions {
  canCreateNetworks: boolean
  canTrainModels: boolean
  canAccessSharedNetworks: boolean
  canManageConnections: boolean
  maxNetworkSize: number
  allowedOperations: NeuralOperation[]
}

export type NeuralOperation = 
  | 'inference'
  | 'training'
  | 'optimization'
  | 'deployment'
  | 'monitoring'
  | 'analysis'

export interface ComputeQuota {
  dailyInferences: number
  usedInferences: number
  maxConcurrentJobs: number
  activeJobs: number
  computeUnits: number
  usedComputeUnits: number
  resetDate: Date
}

export interface SynapticConnection {
  id: string
  sourceUserId: string
  targetUserId: string
  connectionType: 'collaboration' | 'sharing' | 'mentoring'
  strength: number // 0-1
  status: 'active' | 'pending' | 'inactive'
  permissions: ConnectionPermissions
  createdAt: Date
  lastActivity: Date
}

export interface ConnectionPermissions {
  canShareModels: boolean
  canViewTraining: boolean
  canCollaborate: boolean
  canMentor: boolean
}

// Database Types
export interface DatabaseUser {
  id: string
  email: string
  name: string
  avatar: string | null
  provider_id: string
  provider: string
  neural_permissions: string // JSON
  compute_quota: string // JSON
  profile: string // JSON
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface DatabaseSession {
  id: string
  user_id: string
  refresh_token: string
  expires_at: string
  created_at: string
  last_used: string | null
  ip_address: string | null
  user_agent: string | null
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: User
}

export interface OAuthCallbackRequest extends Request {
  user?: OAuthProfile
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
}

export interface ProfileResponse {
  user: User
  connections: SynapticConnection[]
  quotaStatus: ComputeQuota
}

// Configuration Types
export interface AppConfig {
  port: number
  nodeEnv: 'development' | 'production' | 'test'
  frontendUrl: string
  jwt: JWTConfig
  session: SessionConfig
  oauth: OAuthProviders
  database: DatabaseConfig
  security: SecurityConfig
}

export interface JWTConfig {
  secret: string
  refreshSecret: string
  expiresIn: string
  refreshExpiresIn: string
  issuer: string
  audience: string
}

export interface SessionConfig {
  secret: string
  maxAge: number
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
}

export interface OAuthProviders {
  google: OAuthConfig
  github: OAuthConfig
  custom?: OAuthConfig[]
}

export interface DatabaseConfig {
  path: string
  backupPath: string
  maxConnections: number
  backupInterval: number
}

export interface SecurityConfig {
  rateLimitWindowMs: number
  rateLimitMax: number
  corsOrigin: string | string[]
  enableCSRF: boolean
  enableHelmet: boolean
}

// Service Types
export interface IOAuthService {
  authenticateUser(profile: OAuthProfile): Promise<User>
  createUser(profile: OAuthProfile): Promise<User>
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<User>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  updateLastLogin(userId: string): Promise<void>
}

export interface IJWTService {
  generateTokens(user: User): Promise<TokenPair>
  verifyAccessToken(token: string): Promise<JWTPayload>
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>
  refreshTokens(refreshToken: string): Promise<TokenPair>
  revokeRefreshToken(tokenId: string): Promise<void>
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: number
  timestamp: string
  checks: HealthCheck[]
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  error?: string
  details?: any
}