/**
 * F1 OAuth System Configuration
 * Production-ready configuration with security best practices
 */

import dotenv from 'dotenv';
import { OAuthConfig } from '../types';

dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
];

// Validate required environment variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export const config: OAuthConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  baseURL: process.env.BASE_URL || 'http://localhost:3001',
  sessionSecret: process.env.SESSION_SECRET!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  
  database: {
    filename: process.env.DATABASE_URL || './oauth.db',
    migrations: process.env.NODE_ENV !== 'production'
  },
  
  providers: {
    google: {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ['profile', 'email', 'openid'],
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://www.googleapis.com/oauth2/v4/token',
      userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/auth/google/callback`,
      enabled: true
    },
    
    github: {
      name: 'github',
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ['user:email', 'read:user'],
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userInfoURL: 'https://api.github.com/user',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/auth/github/callback`,
      enabled: true
    }
  },
  
  security: {
    enableCSRF: process.env.NODE_ENV === 'production',
    enableRateLimit: true,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    requireHTTPS: process.env.NODE_ENV === 'production',
    secureCookies: process.env.NODE_ENV === 'production'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
};

export default config;