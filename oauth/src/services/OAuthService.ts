/**
 * OAuth Service - User Authentication and Profile Management
 * Handles OAuth authentication flow and user profile management
 */

import { 
  User, 
  OAuthProfile, 
  UserProfile, 
  IOAuthService,
  NeuralPermissions,
  ComputeQuota,
  UserPreferences,
  NeuralSettings
} from '../../types'
import { DatabaseService } from '../storage/database'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

export class OAuthService implements IOAuthService {
  private db: DatabaseService

  constructor() {
    this.db = new DatabaseService()
  }

  /**
   * Authenticate user via OAuth profile
   * Creates new user if not exists, otherwise updates profile
   */
  async authenticateUser(profile: OAuthProfile): Promise<User> {
    try {
      logger.info(`Authenticating user via ${profile.provider}: ${profile.email}`)

      // Check if user exists
      let existingUser = await this.getUserByEmail(profile.email)

      if (existingUser) {
        // Update existing user profile and last login
        await this.updateLastLogin(existingUser.id)
        
        // Update profile data if changed
        if (existingUser.name !== profile.name || existingUser.avatar !== profile.avatar) {
          existingUser = await this.updateUserFromProfile(existingUser.id, profile)
        }

        logger.info(`User authenticated successfully: ${existingUser.id}`)
        return existingUser
      } else {
        // Create new user
        const newUser = await this.createUser(profile)
        logger.info(`New user created: ${newUser.id}`)
        return newUser
      }
    } catch (error) {
      logger.error('User authentication failed:', error)
      throw new Error('Authentication failed')
    }
  }

  /**
   * Create new user from OAuth profile
   */
  async createUser(profile: OAuthProfile): Promise<User> {
    try {
      const userId = uuidv4()
      const now = new Date()

      // Default neural permissions for new users
      const defaultNeuralPermissions: NeuralPermissions = {
        canCreateNetworks: true,
        canTrainModels: false, // Requires verification
        canAccessSharedNetworks: true,
        canManageConnections: true,
        maxNetworkSize: 100,
        allowedOperations: ['inference', 'monitoring']
      }

      // Default compute quota for new users
      const defaultComputeQuota: ComputeQuota = {
        dailyInferences: 1000,
        usedInferences: 0,
        maxConcurrentJobs: 3,
        activeJobs: 0,
        computeUnits: 500,
        usedComputeUnits: 0,
        resetDate: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      }

      // Default user preferences
      const defaultPreferences: UserPreferences = {
        theme: 'auto',
        language: 'en',
        notifications: true,
        analyticsOptIn: false
      }

      // Default neural settings
      const defaultNeuralSettings: NeuralSettings = {
        enableSynapticMesh: true,
        defaultNetworkTopology: 'mesh',
        maxConcurrentConnections: 10,
        preferredAgentTypes: ['researcher', 'analyst']
      }

      const userProfile: UserProfile = {
        displayName: profile.name,
        bio: undefined,
        location: undefined,
        website: undefined,
        preferences: defaultPreferences,
        neuralSettings: defaultNeuralSettings
      }

      const user: User = {
        id: userId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        providerId: profile.id,
        provider: profile.provider,
        neuralPermissions: defaultNeuralPermissions,
        computeQuota: defaultComputeQuota,
        profile: userProfile,
        createdAt: now,
        updatedAt: now,
        lastLogin: now
      }

      // Store in database
      await this.db.createUser(user)

      logger.info(`Created new user: ${userId} (${profile.email})`)
      return user
    } catch (error) {
      logger.error('Failed to create user:', error)
      throw new Error('User creation failed')
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileUpdate: Partial<UserProfile>): Promise<User> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Merge profile updates
      const updatedProfile: UserProfile = {
        ...user.profile,
        ...profileUpdate,
        preferences: {
          ...user.profile.preferences,
          ...(profileUpdate.preferences || {})
        },
        neuralSettings: {
          ...user.profile.neuralSettings,
          ...(profileUpdate.neuralSettings || {})
        }
      }

      const updatedUser: User = {
        ...user,
        profile: updatedProfile,
        updatedAt: new Date()
      }

      await this.db.updateUser(updatedUser)

      logger.info(`Updated user profile: ${userId}`)
      return updatedUser
    } catch (error) {
      logger.error('Failed to update user profile:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.db.getUserById(id)
    } catch (error) {
      logger.error('Failed to get user by ID:', error)
      return null
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.db.getUserByEmail(email)
    } catch (error) {
      logger.error('Failed to get user by email:', error)
      return null
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.db.updateUserLastLogin(userId, new Date())
      logger.debug(`Updated last login for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to update last login:', error)
      throw error
    }
  }

  /**
   * Update compute quota for user
   */
  async updateComputeQuota(userId: string, quotaUpdate: Partial<ComputeQuota>): Promise<User> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const updatedQuota: ComputeQuota = {
        ...user.computeQuota,
        ...quotaUpdate
      }

      const updatedUser: User = {
        ...user,
        computeQuota: updatedQuota,
        updatedAt: new Date()
      }

      await this.db.updateUser(updatedUser)

      logger.info(`Updated compute quota for user: ${userId}`)
      return updatedUser
    } catch (error) {
      logger.error('Failed to update compute quota:', error)
      throw error
    }
  }

  /**
   * Update neural permissions for user
   */
  async updateNeuralPermissions(userId: string, permissionsUpdate: Partial<NeuralPermissions>): Promise<User> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const updatedPermissions: NeuralPermissions = {
        ...user.neuralPermissions,
        ...permissionsUpdate,
        allowedOperations: permissionsUpdate.allowedOperations || user.neuralPermissions.allowedOperations
      }

      const updatedUser: User = {
        ...user,
        neuralPermissions: updatedPermissions,
        updatedAt: new Date()
      }

      await this.db.updateUser(updatedUser)

      logger.info(`Updated neural permissions for user: ${userId}`)
      return updatedUser
    } catch (error) {
      logger.error('Failed to update neural permissions:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{ totalInferences: number; networksCreated: number; connectionsCount: number }> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      return {
        totalInferences: user.computeQuota.usedInferences,
        networksCreated: 0, // TODO: Implement network counting
        connectionsCount: 0  // TODO: Implement connection counting
      }
    } catch (error) {
      logger.error('Failed to get user stats:', error)
      throw error
    }
  }

  /**
   * Reset daily quota for user
   */
  async resetDailyQuota(userId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const resetQuota: ComputeQuota = {
        ...user.computeQuota,
        usedInferences: 0,
        usedComputeUnits: 0,
        resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }

      await this.updateComputeQuota(userId, resetQuota)

      logger.info(`Reset daily quota for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to reset daily quota:', error)
      throw error
    }
  }

  /**
   * Update user from OAuth profile (private helper)
   */
  private async updateUserFromProfile(userId: string, profile: OAuthProfile): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser: User = {
      ...user,
      name: profile.name,
      avatar: profile.avatar,
      updatedAt: new Date()
    }

    await this.db.updateUser(updatedUser)
    return updatedUser
  }
}