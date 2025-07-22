/**
 * Application Configuration
 * Centralized configuration management for OAuth service
 */

import dotenv from 'dotenv'
import path from 'path'
import { AppConfig, OAuthConfig } from '../../types'

// Load environment variables
dotenv.config()

/**
 * Get required environment variable or throw error
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

/**
 * Get optional environment variable with default
 */
function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

/**
 * Get number environment variable
 */
function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (!value) return defaultValue
  const num = parseInt(value, 10)
  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a valid number`)
  }
  return num
}

/**
 * Get boolean environment variable
 */
function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

// Google OAuth configuration
const googleOAuth: OAuthConfig = {
  clientId: getEnvVar('GOOGLE_CLIENT_ID', ''),
  clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', ''),
  redirectUri: `${getOptionalEnvVar('FRONTEND_URL', 'http://localhost:3000')}/auth/google/callback`,
  scope: ['profile', 'email']
}

// GitHub OAuth configuration  
const githubOAuth: OAuthConfig = {
  clientId: getEnvVar('GITHUB_CLIENT_ID', ''),
  clientSecret: getEnvVar('GITHUB_CLIENT_SECRET', ''),
  redirectUri: `${getOptionalEnvVar('FRONTEND_URL', 'http://localhost:3000')}/auth/github/callback`,
  scope: ['user:email', 'read:user']
}

// Application configuration
export const config: AppConfig = {
  // Server settings
  port: getEnvNumber('PORT', 3001),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  frontendUrl: getOptionalEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // JWT configuration
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'dev-secret-key-change-in-production'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    expiresIn: getOptionalEnvVar('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn: getOptionalEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: getOptionalEnvVar('JWT_ISSUER', 'sasi-f1-oauth'),
    audience: getOptionalEnvVar('JWT_AUDIENCE', 'sasi-neural-platform')
  },

  // Session configuration
  session: {
    secret: getEnvVar('SESSION_SECRET', 'dev-session-secret-change-in-production'),
    maxAge: getEnvNumber('SESSION_MAX_AGE', 24 * 60 * 60 * 1000), // 24 hours
    secure: getEnvBoolean('SESSION_SECURE', config?.nodeEnv === 'production'),
    sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax'
  },

  // OAuth providers
  oauth: {
    google: googleOAuth,
    github: githubOAuth
  },

  // Database configuration
  database: {
    path: getOptionalEnvVar('DATABASE_PATH', './storage/auth.db'),
    backupPath: getOptionalEnvVar('DATABASE_BACKUP_PATH', './storage/backups'),
    maxConnections: getEnvNumber('DATABASE_MAX_CONNECTIONS', 10),
    backupInterval: getEnvNumber('DATABASE_BACKUP_INTERVAL', 6 * 60 * 60 * 1000) // 6 hours
  },

  // Security configuration
  security: {
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100), // requests per window
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [config?.frontendUrl || 'http://localhost:3000'],
    enableCSRF: getEnvBoolean('ENABLE_CSRF', config?.nodeEnv === 'production'),
    enableHelmet: getEnvBoolean('ENABLE_HELMET', true)
  }
}

// Validate critical configuration
if (config.nodeEnv === 'production') {
  // In production, ensure secrets are not defaults
  if (config.jwt.secret === 'dev-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be set in production')
  }
  if (config.jwt.refreshSecret === 'dev-refresh-secret-change-in-production') {
    throw new Error('JWT_REFRESH_SECRET must be set in production')
  }
  if (config.session.secret === 'dev-session-secret-change-in-production') {
    throw new Error('SESSION_SECRET must be set in production')
  }
  
  // Ensure OAuth providers are configured
  if (!config.oauth.google.clientId && !config.oauth.github.clientId) {
    throw new Error('At least one OAuth provider must be configured in production')
  }
}

// Export individual configurations for convenience
export const jwtConfig = config.jwt
export const sessionConfig = config.session
export const oauthConfig = config.oauth
export const databaseConfig = config.database
export const securityConfig = config.security

// Environment helpers
export const isDevelopment = config.nodeEnv === 'development'
export const isProduction = config.nodeEnv === 'production'
export const isTest = config.nodeEnv === 'test'

// Logging configuration
export const logLevel = getOptionalEnvVar('LOG_LEVEL', isDevelopment ? 'debug' : 'info')