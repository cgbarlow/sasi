/**
 * JWT Service - Production Ready Token Management
 * Handles JWT access tokens and refresh tokens with rotation
 */

import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { 
  User, 
  JWTPayload, 
  RefreshTokenPayload, 
  TokenPair,
  IJWTService 
} from '../../types'
import { config } from '../config/config'
import { DatabaseService } from '../storage/database'
import { logger } from '../utils/logger'

export class JWTService implements IJWTService {
  private db: DatabaseService

  constructor() {
    this.db = new DatabaseService()
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokens(user: User): Promise<TokenPair> {
    try {
      // Create access token payload
      const accessPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        permissions: this.extractPermissions(user)
      }

      // Generate access token
      const accessToken = jwt.sign(accessPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      })

      // Generate refresh token
      const tokenId = uuidv4()
      const refreshPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        tokenId
      }

      const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      })

      // Store refresh token in database
      const expiresAt = new Date()
      expiresAt.setTime(expiresAt.getTime() + this.parseExpirationToMs(config.jwt.refreshExpiresIn))

      await this.db.storeRefreshToken(tokenId, user.id, refreshToken, expiresAt)

      // Calculate expiration time in seconds
      const expiresIn = this.parseExpirationToMs(config.jwt.expiresIn) / 1000

      logger.info(`Generated token pair for user: ${user.id}`)

      return {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer'
      }
    } catch (error) {
      logger.error('Failed to generate tokens:', error)
      throw new Error('Token generation failed')
    }
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }) as JWTPayload

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token')
      }
      throw new Error('Token verification failed')
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }) as RefreshTokenPayload

      // Verify token exists in database and is not revoked
      const storedToken = await this.db.getRefreshToken(payload.tokenId)
      if (!storedToken) {
        throw new Error('Refresh token not found or revoked')
      }

      if (new Date() > new Date(storedToken.expires_at)) {
        await this.db.revokeRefreshToken(payload.tokenId)
        throw new Error('Refresh token expired')
      }

      // Update last used timestamp
      await this.db.updateRefreshTokenUsed(payload.tokenId)

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token')
      }
      throw error
    }
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = await this.verifyRefreshToken(refreshToken)
      
      // Get user
      const user = await this.db.getUserById(payload.sub)
      if (!user) {
        throw new Error('User not found')
      }

      // Revoke old refresh token
      await this.db.revokeRefreshToken(payload.tokenId)

      // Generate new token pair
      const newTokens = await this.generateTokens(user)

      logger.info(`Refreshed tokens for user: ${user.id}`)
      return newTokens

    } catch (error) {
      logger.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await this.db.revokeRefreshToken(tokenId)
      logger.info(`Revoked refresh token: ${tokenId}`)
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error)
      throw error
    }
  }

  /**
   * Revoke all user refresh tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await this.db.revokeAllUserTokens(userId)
      logger.info(`Revoked all tokens for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error)
      throw error
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount = await this.db.cleanupExpiredTokens()
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired tokens`)
      }
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error)
    }
  }

  /**
   * Extract permissions from user object
   */
  private extractPermissions(user: User): string[] {
    const permissions: string[] = []
    
    if (user.neuralPermissions.canCreateNetworks) {
      permissions.push('neural:create')
    }
    if (user.neuralPermissions.canTrainModels) {
      permissions.push('neural:train')
    }
    if (user.neuralPermissions.canAccessSharedNetworks) {
      permissions.push('neural:shared')
    }
    if (user.neuralPermissions.canManageConnections) {
      permissions.push('connections:manage')
    }

    // Add operation-specific permissions
    user.neuralPermissions.allowedOperations.forEach(op => {
      permissions.push(`neural:${op}`)
    })

    return permissions
  }

  /**
   * Parse expiration string to milliseconds
   */
  private parseExpirationToMs(expiration: string): number {
    const unit = expiration.slice(-1)
    const value = parseInt(expiration.slice(0, -1))

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: throw new Error(`Invalid expiration format: ${expiration}`)
    }
  }
}