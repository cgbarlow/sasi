/**
 * Neural Integration Routes
 * Express routes for SASI neural network integration
 */

import { Router } from 'express'
import { OAuthService } from '../services/OAuthService'
import { authMiddleware } from '../middleware/auth'
import { logger } from '../utils/logger'
import { ApiResponse } from '../../types'

const router = Router()
const oauthService = new OAuthService()

/**
 * Get user neural permissions
 */
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    res.json({
      success: true,
      data: {
        permissions: user.neuralPermissions,
        userId: user.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Neural permissions error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'NEURAL_PERMISSIONS_ERROR',
        message: 'Failed to retrieve neural permissions'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Update user neural permissions (admin only)
 */
router.put('/permissions', authMiddleware, async (req, res) => {
  try {
    const user = req.user!
    const permissionsUpdate = req.body

    // TODO: Add admin permission check
    // For now, users can update their own basic permissions
    const allowedUpdates = [
      'enableSynapticMesh',
      'defaultNetworkTopology', 
      'maxConcurrentConnections',
      'preferredAgentTypes'
    ]

    const filteredUpdates = Object.keys(permissionsUpdate)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = permissionsUpdate[key]
        return obj
      }, {} as any)

    const updatedUser = await oauthService.updateNeuralPermissions(user.id, filteredUpdates)

    res.json({
      success: true,
      data: {
        permissions: updatedUser.neuralPermissions,
        userId: updatedUser.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Neural permissions update error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'NEURAL_PERMISSIONS_UPDATE_ERROR',
        message: 'Failed to update neural permissions'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Get user compute quota
 */
router.get('/quota', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    res.json({
      success: true,
      data: {
        quota: user.computeQuota,
        userId: user.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Compute quota error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPUTE_QUOTA_ERROR',
        message: 'Failed to retrieve compute quota'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Update user compute quota usage
 */
router.post('/quota/usage', authMiddleware, async (req, res) => {
  try {
    const user = req.user!
    const { inferencesUsed, computeUnitsUsed } = req.body

    if (typeof inferencesUsed !== 'number' && typeof computeUnitsUsed !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTA_USAGE',
          message: 'At least one usage metric must be provided'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse)
    }

    const quotaUpdate: any = {}
    
    if (typeof inferencesUsed === 'number') {
      quotaUpdate.usedInferences = Math.max(0, user.computeQuota.usedInferences + inferencesUsed)
    }
    
    if (typeof computeUnitsUsed === 'number') {
      quotaUpdate.usedComputeUnits = Math.max(0, user.computeQuota.usedComputeUnits + computeUnitsUsed)
    }

    const updatedUser = await oauthService.updateComputeQuota(user.id, quotaUpdate)

    res.json({
      success: true,
      data: {
        quota: updatedUser.computeQuota,
        userId: updatedUser.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Compute quota update error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPUTE_QUOTA_UPDATE_ERROR',
        message: 'Failed to update compute quota'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Reset daily quota (called by cron job or admin)
 */
router.post('/quota/reset', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    // TODO: Add admin permission check or cron job authentication
    
    await oauthService.resetDailyQuota(user.id)

    const updatedUser = await oauthService.getUserById(user.id)

    res.json({
      success: true,
      data: {
        quota: updatedUser!.computeQuota,
        userId: updatedUser!.id,
        message: 'Daily quota reset successfully'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Quota reset error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'QUOTA_RESET_ERROR',
        message: 'Failed to reset daily quota'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Get user neural statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    const stats = await oauthService.getUserStats(user.id)

    res.json({
      success: true,
      data: {
        stats,
        userId: user.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Neural stats error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'NEURAL_STATS_ERROR',
        message: 'Failed to retrieve neural statistics'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Get synaptic connections (placeholder - to be implemented)
 */
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    // TODO: Implement synaptic connections retrieval
    const connections: any[] = []

    res.json({
      success: true,
      data: {
        connections,
        count: connections.length,
        userId: user.id
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Synaptic connections error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNAPTIC_CONNECTIONS_ERROR',
        message: 'Failed to retrieve synaptic connections'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Create synaptic connection (placeholder - to be implemented)
 */
router.post('/connections', authMiddleware, async (req, res) => {
  try {
    const user = req.user!
    const { targetUserId, connectionType } = req.body

    if (!targetUserId || !connectionType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONNECTION_REQUEST',
          message: 'Target user ID and connection type are required'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse)
    }

    // TODO: Implement synaptic connection creation
    const connection = {
      id: 'placeholder',
      sourceUserId: user.id,
      targetUserId,
      connectionType,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    res.json({
      success: true,
      data: {
        connection,
        message: 'Connection request created'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Connection creation error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTION_CREATION_ERROR',
        message: 'Failed to create synaptic connection'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

export { router as neuralRoutes }