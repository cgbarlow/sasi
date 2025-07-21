/**
 * F1 OAuth Authentication Middleware
 * JWT token validation and request authentication
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/JWTService';
import { database } from '../../storage/database';
import { AuthRequest, JWTPayload } from '../../types';

/**
 * JWT Bearer token authentication middleware
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const payload = await jwtService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Invalid or expired access token'
      });
    }

    // Find user
    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'User not found or inactive'
      });
    }

    // Attach user and token payload to request
    req.user = user;
    req.tokenPayload = payload;
    
    next();
  } catch (error) {
    console.error('Token authentication error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during authentication'
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await jwtService.verifyAccessToken(token);
      
      if (payload) {
        const user = await findUserById(payload.sub);
        if (user && user.isActive) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't fail the request
    console.error('Optional auth error:', error);
    next();
  }
}

/**
 * Require specific scope for API access
 */
export function requireScope(requiredScope: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tokenPayload) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Access token required'
      });
    }

    const tokenScopes = req.tokenPayload.scope || [];
    if (!tokenScopes.includes(requiredScope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required scope: ${requiredScope}`
      });
    }

    next();
  };
}

/**
 * Require multiple scopes (all must be present)
 */
export function requireScopes(requiredScopes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tokenPayload) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Access token required'
      });
    }

    const tokenScopes = req.tokenPayload.scope || [];
    const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
    
    if (missingScopes.length > 0) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Missing required scopes: ${missingScopes.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Check if user is authenticated (session-based)
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }
  next();
}

/**
 * Admin role check (for SASI management)
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }

  const userMetadata = req.user.metadata || {};
  if (!userMetadata.isAdmin) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Admin privileges required'
    });
  }

  next();
}

/**
 * Rate limiting for OAuth endpoints
 */
export function createRateLimiter(windowMs: number, max: number) {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter((time: number) => time > windowStart);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        error_description: 'Too many requests',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
}

/**
 * CORS middleware for OAuth endpoints
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-domain.com',
    ...process.env.CORS_ORIGIN?.split(',') || []
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

/**
 * Helper function to find user by ID
 */
async function findUserById(id: string) {
  const row = await database.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    provider: row.provider,
    providerId: row.provider_id,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    metadata: JSON.parse(row.metadata || '{}')
  };
}