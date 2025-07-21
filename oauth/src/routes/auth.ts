/**
 * Authentication Routes
 * Express routes for OAuth 2.0 authentication flow
 */

import { Router } from 'express'
import passport from 'passport'
import { OAuthService } from '../services/OAuthService'
import { JWTService } from '../services/JWTService'
import { authMiddleware } from '../middleware/auth'
import { validateRefreshToken } from '../middleware/validation'
import { logger, logAuth } from '../utils/logger'
import { config } from '../config/config'
import { ApiResponse, AuthResponse } from '../../types'

const router = Router()
const oauthService = new OAuthService()
const jwtService = new JWTService()

/**
 * Google OAuth - Initiate authentication
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))

/**
 * Google OAuth - Handle callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.frontendUrl}/auth/error?message=Authentication failed`)
      }

      // Generate JWT tokens
      const tokens = await jwtService.generateTokens(req.user as any)
      
      logAuth('google_login_success', (req.user as any).id)

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: config.session.secure,
        sameSite: config.session.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      // Redirect to frontend with access token
      const redirectUrl = new URL(`${config.frontendUrl}/auth/callback`)
      redirectUrl.searchParams.set('token', tokens.accessToken)
      redirectUrl.searchParams.set('expires_in', tokens.expiresIn.toString())

      res.redirect(redirectUrl.toString())
    } catch (error) {
      logger.error('Google OAuth callback error:', error)
      res.redirect(`${config.frontendUrl}/auth/error?message=Authentication failed`)
    }
  }
)

/**
 * GitHub OAuth - Initiate authentication
 */
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}))

/**
 * GitHub OAuth - Handle callback
 */
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.frontendUrl}/auth/error?message=Authentication failed`)
      }

      // Generate JWT tokens
      const tokens = await jwtService.generateTokens(req.user as any)
      
      logAuth('github_login_success', (req.user as any).id)

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: config.session.secure,
        sameSite: config.session.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      // Redirect to frontend with access token
      const redirectUrl = new URL(`${config.frontendUrl}/auth/callback`)
      redirectUrl.searchParams.set('token', tokens.accessToken)
      redirectUrl.searchParams.set('expires_in', tokens.expiresIn.toString())

      res.redirect(redirectUrl.toString())
    } catch (error) {
      logger.error('GitHub OAuth callback error:', error)
      res.redirect(`${config.frontendUrl}/auth/error?message=Authentication failed`)
    }
  }
)

/**
 * Refresh JWT tokens
 */
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse)
    }

    // Refresh tokens
    const newTokens = await jwtService.refreshTokens(refreshToken)

    logAuth('token_refresh_success')

    // Update refresh token cookie
    res.cookie('refresh_token', newTokens.refreshToken, {
      httpOnly: true,
      secure: config.session.secure,
      sameSite: config.session.sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      success: true,
      data: {
        access_token: newTokens.accessToken,
        expires_in: newTokens.expiresIn,
        token_type: newTokens.tokenType
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Token refresh error:', error)
    
    // Clear refresh token cookie on error
    res.clearCookie('refresh_token')
    
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid or expired refresh token'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Get user profile (protected)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    logAuth('profile_access', user.id)

    const response: AuthResponse = {
      user,
      tokens: {
        accessToken: req.headers.authorization?.replace('Bearer ', '') || '',
        refreshToken: '', // Don't expose refresh token
        expiresIn: 0,
        tokenType: 'Bearer'
      }
    }

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Profile access error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ACCESS_ERROR',
        message: 'Failed to retrieve user profile'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Update user profile (protected)
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user!
    const profileUpdates = req.body

    // Validate and sanitize profile updates
    const allowedFields = ['displayName', 'bio', 'location', 'website', 'preferences', 'neuralSettings']
    const sanitizedUpdates = Object.keys(profileUpdates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = profileUpdates[key]
        return obj
      }, {} as any)

    // Update user profile
    const updatedUser = await oauthService.updateUserProfile(user.id, sanitizedUpdates)

    logAuth('profile_update', user.id)

    res.json({
      success: true,
      data: { user: updatedUser },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_ERROR',
        message: 'Failed to update user profile'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Logout user
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = req.user!
    const refreshToken = req.cookies.refresh_token

    if (refreshToken) {
      try {
        // Verify and revoke refresh token
        const payload = await jwtService.verifyRefreshToken(refreshToken)
        await jwtService.revokeRefreshToken(payload.tokenId)
      } catch (error) {
        // Token might already be invalid, continue with logout
        logger.warn('Error revoking refresh token during logout:', error)
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refresh_token')

    logAuth('logout_success', user.id)

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout user'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Revoke all user tokens (logout from all devices)
 */
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    const user = req.user!

    // Revoke all refresh tokens for user
    await jwtService.revokeAllUserTokens(user.id)

    // Clear refresh token cookie
    res.clearCookie('refresh_token')

    logAuth('logout_all_success', user.id)

    res.json({
      success: true,
      data: { message: 'Logged out from all devices' },
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    logger.error('Logout all error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ALL_ERROR',
        message: 'Failed to logout from all devices'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }
})

/**
 * Get user authentication status
 */
router.get('/status', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: true,
      userId: req.user!.id,
      provider: req.user!.provider
    },
    timestamp: new Date().toISOString()
  } as ApiResponse)
})

export { router as authRoutes }