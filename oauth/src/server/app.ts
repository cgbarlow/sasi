/**
 * F1 OAuth Server Application
 * Production-ready Express server with OAuth 2.0 / OpenID Connect
 */

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from '../../config/config';
import { authController } from '../controllers/AuthController';
import { authenticateToken, corsMiddleware, createRateLimiter } from '../middleware/auth';
import '../config/passport'; // Initialize passport strategies

// Create Express app
const app = express();

// Trust proxy (important for production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate limiting
if (config.security.enableRateLimit) {
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindow,
    max: config.security.rateLimitMax,
    message: {
      error: 'rate_limit_exceeded',
      error_description: 'Too many requests from this IP'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  // More restrictive rate limiting for auth endpoints
  const authLimiter = createRateLimiter(15 * 60 * 1000, 20); // 20 requests per 15 minutes
  app.use('/auth', authLimiter);
}

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.security.secureCookies,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: config.security.secureCookies ? 'none' : 'lax'
  },
  name: 'f1oauth.sid'
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'F1 OAuth Service'
  });
});

// OpenID Connect Discovery endpoints
app.get('/.well-known/openid-configuration', authController.openidConfiguration.bind(authController));
app.get('/.well-known/jwks.json', authController.jwks.bind(authController));

// OAuth 2.0 / OpenID Connect endpoints
app.get('/auth/authorize', authController.authorize.bind(authController));
app.post('/auth/token', authController.token.bind(authController));
app.get('/auth/userinfo', authenticateToken, authController.userInfo.bind(authController));

// Authentication flow endpoints
app.get('/auth/login', authController.login.bind(authController));
app.get('/auth/logout', authController.logout.bind(authController));
app.get('/auth/me', authenticateToken, authController.me.bind(authController));
app.get('/auth/error', authController.error.bind(authController));

// OAuth provider routes
app.get('/auth/google', authController.googleAuth);
app.get('/auth/google/callback', authController.googleCallback);

app.get('/auth/github', authController.githubAuth);
app.get('/auth/github/callback', authController.githubCallback);

// SASI Integration endpoints (protected)
app.get('/api/sasi/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    neural_permissions: req.user?.metadata?.neuralPermissions || [],
    compute_quota: req.user?.metadata?.computeQuota || 0,
    synaptic_connections: req.user?.metadata?.synapticConnections || []
  });
});

app.post('/api/sasi/neural/connect', authenticateToken, (req, res) => {
  // Neural network connection endpoint
  res.json({
    message: 'Neural connection established',
    node_id: `neural_${req.user?.id}_${Date.now()}`,
    status: 'connected'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  // OAuth-specific errors
  if (err.error) {
    return res.status(400).json({
      error: err.error,
      error_description: err.error_description || err.message,
      ...(err.state && { state: err.state })
    });
  }
  
  // Generic errors
  res.status(500).json({
    error: 'server_error',
    error_description: 'Internal server error'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found'
  });
});

export default app;