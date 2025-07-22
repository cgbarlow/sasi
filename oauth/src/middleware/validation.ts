/**
 * Request Validation Middleware
 * Input validation and sanitization
 */

import { Request, Response, NextFunction } from 'express'
import { body, validationResult, query, param } from 'express-validator'
import { logger } from '../utils/logger'
import { ApiResponse } from '../../types'

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array())
    
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array()
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
    return
  }

  next()
}

/**
 * Refresh token validation
 */
export const validateRefreshToken = [
  body('refresh_token')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Refresh token must be at least 10 characters'),
  handleValidationErrors
]

/**
 * Profile update validation
 */
export const validateProfileUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be 1-100 characters')
    .trim()
    .escape(),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters')
    .trim(),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  
  body('preferences.language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be 2-5 characters'),
  
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  
  body('neuralSettings.enableSynapticMesh')
    .optional()
    .isBoolean()
    .withMessage('EnableSynapticMesh must be a boolean'),
  
  body('neuralSettings.defaultNetworkTopology')
    .optional()
    .isIn(['mesh', 'hierarchical', 'ring', 'star'])
    .withMessage('Network topology must be mesh, hierarchical, ring, or star'),
  
  body('neuralSettings.maxConcurrentConnections')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max concurrent connections must be 1-100'),
  
  handleValidationErrors
]

/**
 * Neural permissions validation
 */
export const validateNeuralPermissions = [
  body('canCreateNetworks')
    .optional()
    .isBoolean()
    .withMessage('canCreateNetworks must be a boolean'),
  
  body('canTrainModels')
    .optional()
    .isBoolean()
    .withMessage('canTrainModels must be a boolean'),
  
  body('canAccessSharedNetworks')
    .optional()
    .isBoolean()
    .withMessage('canAccessSharedNetworks must be a boolean'),
  
  body('canManageConnections')
    .optional()
    .isBoolean()
    .withMessage('canManageConnections must be a boolean'),
  
  body('maxNetworkSize')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max network size must be 1-10000'),
  
  body('allowedOperations')
    .optional()
    .isArray()
    .withMessage('Allowed operations must be an array'),
  
  body('allowedOperations.*')
    .optional()
    .isIn(['inference', 'training', 'optimization', 'deployment', 'monitoring', 'analysis'])
    .withMessage('Invalid operation type'),
  
  handleValidationErrors
]

/**
 * Quota usage validation
 */
export const validateQuotaUsage = [
  body('inferencesUsed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Inferences used must be a non-negative integer'),
  
  body('computeUnitsUsed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Compute units used must be a non-negative integer'),
  
  handleValidationErrors
]

/**
 * Connection creation validation
 */
export const validateConnectionCreation = [
  body('targetUserId')
    .isUUID()
    .withMessage('Target user ID must be a valid UUID'),
  
  body('connectionType')
    .isIn(['collaboration', 'sharing', 'mentoring'])
    .withMessage('Connection type must be collaboration, sharing, or mentoring'),
  
  handleValidationErrors
]

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  
  handleValidationErrors
]

/**
 * User ID parameter validation
 */
export const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  handleValidationErrors
]

/**
 * Email validation
 */
export const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
]

/**
 * Generic sanitization middleware
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove any potential XSS attempts from string fields
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<[^>]*>/g, '')
                .trim()
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key])
        }
      }
      return sanitized
    }
    
    return obj
  }

  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  
  next()
}

/**
 * Rate limiting validation (for custom rate limits)
 */
export const validateRateLimit = (
  maxRequests: number,
  windowMs: number,
  message?: string
) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown'
    const now = Date.now()
    
    const clientData = requestCounts.get(clientId)
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize count
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      })
      next()
      return
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || `Too many requests. Limit: ${maxRequests} per ${windowMs}ms`,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        },
        timestamp: new Date().toISOString()
      } as ApiResponse)
      return
    }
    
    clientData.count++
    next()
  }
}