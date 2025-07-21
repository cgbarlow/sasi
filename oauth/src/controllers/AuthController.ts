/**
 * F1 OAuth Authentication Controller
 * Handles OAuth 2.0 / OpenID Connect endpoints
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { oauthService } from '../services/OAuthService';
import { jwtService } from '../services/JWTService';
import { database } from '../../storage/database';
import { AuthRequest, User, ProviderProfile } from '../../types';
import { config } from '../../config/config';

export class AuthController {
  
  /**
   * GET /auth/authorize - OAuth authorization endpoint
   */
  async authorize(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authRequest = oauthService.parseAuthorizationRequest(req.query);
      
      // If user is not authenticated, redirect to login
      if (!req.user) {
        // Store auth request in session
        req.session.authRequest = authRequest;
        return res.redirect('/auth/login');
      }

      // User is authenticated, generate authorization response
      const authorizationURL = await oauthService.handleAuthorizationRequest(req.user, authRequest);
      res.redirect(authorizationURL);
    } catch (error: any) {
      if (error.error) {
        // OAuth error - redirect with error
        const errorParams = new URLSearchParams({
          error: error.error,
          ...(error.error_description && { error_description: error.error_description }),
          ...(error.state && { state: error.state })
        });
        return res.redirect(`${req.query.redirect_uri}?${errorParams}`);
      }
      next(error);
    }
  }

  /**
   * POST /auth/token - OAuth token endpoint
   */
  async token(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        grant_type,
        code,
        client_id,
        client_secret,
        redirect_uri,
        code_verifier,
        refresh_token
      } = req.body;

      if (!grant_type) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing grant_type parameter'
        });
      }

      if (grant_type === 'authorization_code') {
        if (!code || !client_id || !redirect_uri) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing required parameters for authorization_code grant'
          });
        }

        const tokens = await oauthService.exchangeAuthorizationCode(
          code,
          client_id,
          client_secret,
          redirect_uri,
          code_verifier
        );

        res.json(tokens);
      } else if (grant_type === 'refresh_token') {
        if (!refresh_token) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing refresh_token parameter'
          });
        }

        const tokens = await jwtService.refreshAccessToken(refresh_token);
        if (!tokens) {
          return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid refresh token'
          });
        }

        res.json(tokens);
      } else {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Unsupported grant type'
        });
      }
    } catch (error: any) {
      console.error('Token endpoint error:', error);
      
      if (error.message === 'invalid_grant') {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code or credentials'
        });
      } else if (error.message === 'invalid_client') {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        });
      }
      
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  /**
   * GET /auth/userinfo - OpenID Connect UserInfo endpoint
   */
  async userInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'Invalid or missing access token'
        });
      }

      const userInfo = {
        sub: req.user.id,
        email: req.user.email,
        email_verified: true,
        name: req.user.name,
        picture: req.user.avatar,
        provider: req.user.provider,
        updated_at: Math.floor(req.user.updatedAt.getTime() / 1000)
      };

      res.json(userInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/login - Login page
   */
  login(req: Request, res: Response) {
    const providers = Object.keys(config.providers).filter(
      key => config.providers[key as keyof typeof config.providers].enabled
    );

    res.json({
      message: 'F1 OAuth Login',
      providers: providers.map(provider => ({
        name: provider,
        url: `/auth/${provider}`
      })),
      authRequest: req.session.authRequest
    });
  }

  /**
   * GET /auth/google - Google OAuth initiation
   */
  googleAuth = passport.authenticate('google', {
    scope: config.providers.google.scope
  });

  /**
   * GET /auth/google/callback - Google OAuth callback
   */
  googleCallback = [
    passport.authenticate('google', { failureRedirect: '/auth/error' }),
    this.handleOAuthCallback.bind(this)
  ];

  /**
   * GET /auth/github - GitHub OAuth initiation
   */
  githubAuth = passport.authenticate('github', {
    scope: config.providers.github.scope
  });

  /**
   * GET /auth/github/callback - GitHub OAuth callback
   */
  githubCallback = [
    passport.authenticate('github', { failureRedirect: '/auth/error' }),
    this.handleOAuthCallback.bind(this)
  ];

  /**
   * Handle OAuth provider callback
   */
  private async handleOAuthCallback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.redirect('/auth/error?error=authentication_failed');
      }

      // Update last login time
      await database.updateUserLastLogin(req.user.id);

      // Check if we have a pending auth request
      const authRequest = req.session.authRequest;
      if (authRequest) {
        delete req.session.authRequest;
        
        // Complete OAuth flow
        const authorizationURL = await oauthService.handleAuthorizationRequest(req.user, authRequest);
        return res.redirect(authorizationURL);
      }

      // Default redirect to frontend
      const redirectURL = new URL('/auth/success', config.cors.origin[0]);
      redirectURL.searchParams.set('user', JSON.stringify({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }));

      res.redirect(redirectURL.toString());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/logout - Logout endpoint
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;

      if (token && typeof token === 'string') {
        // Revoke refresh token if provided
        await jwtService.revokeRefreshToken(token);
      }

      req.logout(() => {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
          res.clearCookie('connect.sid');
          res.json({ message: 'Logged out successfully' });
        });
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me - Get current user info
   */
  me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Not authenticated'
      });
    }

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        provider: req.user.provider
      }
    });
  }

  /**
   * GET /auth/error - Authentication error page
   */
  error(req: Request, res: Response) {
    const { error } = req.query;
    res.status(400).json({
      error: error || 'authentication_failed',
      message: 'Authentication failed'
    });
  }

  /**
   * GET /.well-known/openid-configuration - OpenID Connect Discovery
   */
  openidConfiguration(req: Request, res: Response) {
    const baseURL = config.baseURL;
    
    res.json({
      issuer: `${baseURL}/oauth`,
      authorization_endpoint: `${baseURL}/auth/authorize`,
      token_endpoint: `${baseURL}/auth/token`,
      userinfo_endpoint: `${baseURL}/auth/userinfo`,
      jwks_uri: `${baseURL}/.well-known/jwks.json`,
      scopes_supported: ['openid', 'profile', 'email', 'sasi:neural', 'sasi:compute'],
      response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256'],
      code_challenge_methods_supported: ['S256', 'plain'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none']
    });
  }

  /**
   * GET /.well-known/jwks.json - JSON Web Key Set
   */
  jwks(req: Request, res: Response) {
    res.json(jwtService.getJWKS());
  }
}

export const authController = new AuthController();
export default authController;