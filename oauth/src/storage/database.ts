/**
 * Database Service - SQLite Data Layer
 * Handles all database operations for OAuth service
 */

import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { 
  User, 
  DatabaseUser, 
  DatabaseSession,
  NeuralPermissions,
  ComputeQuota,
  UserProfile
} from '../../types'
import { config } from '../config/config'
import { logger } from '../utils/logger'

export class DatabaseService {
  private db: sqlite3.Database | null = null

  constructor() {
    this.initDatabase()
  }

  /**
   * Initialize SQLite database connection
   */
  private async initDatabase(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(config.database.path)
      await fs.mkdir(dbDir, { recursive: true })

      this.db = new sqlite3.Database(config.database.path)
      
      // Enable foreign keys and WAL mode for better performance
      await this.runQuery('PRAGMA foreign_keys = ON')
      await this.runQuery('PRAGMA journal_mode = WAL')
      await this.runQuery('PRAGMA synchronous = NORMAL')
      await this.runQuery('PRAGMA cache_size = 1000')
      await this.runQuery('PRAGMA temp_store = memory')

      // Run migrations
      await this.runMigrations()

      logger.info('Database initialized successfully')
    } catch (error) {
      logger.error('Database initialization failed:', error)
      throw new Error('Database initialization failed')
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    try {
      // Users table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          provider_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          neural_permissions TEXT NOT NULL,
          compute_quota TEXT NOT NULL,
          profile TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login TEXT,
          UNIQUE(provider_id, provider)
        )
      `)

      // Refresh tokens table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          last_used TEXT,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `)

      // Sessions table for additional security tracking
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_data TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `)

      // Neural connections table for SASI integration
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS synaptic_connections (
          id TEXT PRIMARY KEY,
          source_user_id TEXT NOT NULL,
          target_user_id TEXT NOT NULL,
          connection_type TEXT NOT NULL,
          strength REAL NOT NULL DEFAULT 0.5,
          status TEXT NOT NULL DEFAULT 'pending',
          permissions TEXT NOT NULL,
          created_at TEXT NOT NULL,
          last_activity TEXT,
          FOREIGN KEY (source_user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(source_user_id, target_user_id)
        )
      `)

      // Create indexes for performance
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider_id, provider)')
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)')
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)')
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)')
      await this.runQuery('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)')

      logger.info('Database migrations completed')
    } catch (error) {
      logger.error('Database migrations failed:', error)
      throw error
    }
  }

  /**
   * Create new user
   */
  async createUser(user: User): Promise<void> {
    try {
      const dbUser: DatabaseUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        provider_id: user.providerId,
        provider: user.provider,
        neural_permissions: JSON.stringify(user.neuralPermissions),
        compute_quota: JSON.stringify(user.computeQuota),
        profile: JSON.stringify(user.profile),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        last_login: user.lastLogin?.toISOString() || null
      }

      await this.runQuery(`
        INSERT INTO users (
          id, email, name, avatar, provider_id, provider,
          neural_permissions, compute_quota, profile,
          created_at, updated_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dbUser.id, dbUser.email, dbUser.name, dbUser.avatar,
        dbUser.provider_id, dbUser.provider, dbUser.neural_permissions,
        dbUser.compute_quota, dbUser.profile, dbUser.created_at,
        dbUser.updated_at, dbUser.last_login
      ])

      logger.debug(`Created user in database: ${user.id}`)
    } catch (error) {
      logger.error('Failed to create user in database:', error)
      throw error
    }
  }

  /**
   * Update existing user
   */
  async updateUser(user: User): Promise<void> {
    try {
      await this.runQuery(`
        UPDATE users SET
          name = ?, avatar = ?, neural_permissions = ?,
          compute_quota = ?, profile = ?, updated_at = ?, last_login = ?
        WHERE id = ?
      `, [
        user.name, user.avatar || null,
        JSON.stringify(user.neuralPermissions),
        JSON.stringify(user.computeQuota),
        JSON.stringify(user.profile),
        user.updatedAt.toISOString(),
        user.lastLogin?.toISOString() || null,
        user.id
      ])

      logger.debug(`Updated user in database: ${user.id}`)
    } catch (error) {
      logger.error('Failed to update user in database:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const row = await this.getQuery<DatabaseUser>(
        'SELECT * FROM users WHERE id = ?', [id]
      )

      return row ? this.convertDatabaseUserToUser(row) : null
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
      const row = await this.getQuery<DatabaseUser>(
        'SELECT * FROM users WHERE email = ?', [email]
      )

      return row ? this.convertDatabaseUserToUser(row) : null
    } catch (error) {
      logger.error('Failed to get user by email:', error)
      return null
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateUserLastLogin(userId: string, loginTime: Date): Promise<void> {
    try {
      await this.runQuery(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [loginTime.toISOString(), userId]
      )
    } catch (error) {
      logger.error('Failed to update user last login:', error)
      throw error
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(tokenId: string, userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await this.runQuery(`
        INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [tokenId, userId, token, expiresAt.toISOString(), new Date().toISOString()])

      logger.debug(`Stored refresh token: ${tokenId}`)
    } catch (error) {
      logger.error('Failed to store refresh token:', error)
      throw error
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(tokenId: string): Promise<DatabaseSession | null> {
    try {
      const row = await this.getQuery<DatabaseSession>(
        'SELECT * FROM refresh_tokens WHERE id = ?', [tokenId]
      )

      return row || null
    } catch (error) {
      logger.error('Failed to get refresh token:', error)
      return null
    }
  }

  /**
   * Update refresh token last used timestamp
   */
  async updateRefreshTokenUsed(tokenId: string): Promise<void> {
    try {
      await this.runQuery(
        'UPDATE refresh_tokens SET last_used = ? WHERE id = ?',
        [new Date().toISOString(), tokenId]
      )
    } catch (error) {
      logger.error('Failed to update refresh token used timestamp:', error)
      throw error
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await this.runQuery('DELETE FROM refresh_tokens WHERE id = ?', [tokenId])
      logger.debug(`Revoked refresh token: ${tokenId}`)
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error)
      throw error
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await this.runQuery('DELETE FROM refresh_tokens WHERE user_id = ?', [userId])
      logger.debug(`Revoked all tokens for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error)
      throw error
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.runQuery(
        'DELETE FROM refresh_tokens WHERE expires_at < ?',
        [new Date().toISOString()]
      )

      return result.changes || 0
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error)
      return 0
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      this.db = null
      logger.info('Database connection closed')
    }
  }

  /**
   * Run query with parameters
   */
  private async runQuery(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(this)
        }
      })
    })
  }

  /**
   * Get single row query
   */
  private async getQuery<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as T || null)
        }
      })
    })
  }

  /**
   * Get multiple rows query
   */
  private async allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T[])
        }
      })
    })
  }

  /**
   * Convert database user to application user
   */
  private convertDatabaseUserToUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar || undefined,
      providerId: dbUser.provider_id,
      provider: dbUser.provider as any,
      neuralPermissions: JSON.parse(dbUser.neural_permissions) as NeuralPermissions,
      computeQuota: JSON.parse(dbUser.compute_quota) as ComputeQuota,
      profile: JSON.parse(dbUser.profile) as UserProfile,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      lastLogin: dbUser.last_login ? new Date(dbUser.last_login) : undefined
    }
  }
}