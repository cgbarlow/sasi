/**
 * F1 OAuth Server - Main Entry Point
 * Production-ready Express server with OAuth 2.0 authentication
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import passport from 'passport'
import { config, isDevelopment, isProduction } from '../config/config'
import { logger, logRequest } from '../utils/logger'
import { authRoutes } from '../routes/auth'
import { neuralRoutes } from '../routes/neural'
import { healthRoutes } from '../routes/health'
import { setupPassport } from '../config/passport'
import path from 'path'
import fs from 'fs/promises'

// Initialize Express app
const app = express()

/**
 * Security Middleware
 */
if (config.security.enableHelmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }))
}

/**
 * CORS Configuration
 */
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health'
  }
})
app.use(limiter)

/**
 * Request Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

/**
 * Session Configuration
 */
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.session.secure,
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: config.session.sameSite
  },
  name: 'sasi.oauth.sid'
}))

/**
 * Passport Authentication
 */
setupPassport()
app.use(passport.initialize())
app.use(passport.session())

/**
 * Request Logging
 */
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logRequest(req, res, duration)
  })
  next()
})

/**
 * API Routes
 */
app.use('/auth', authRoutes)
app.use('/neural', neuralRoutes)
app.use('/health', healthRoutes)

/**
 * OpenID Connect Discovery Endpoints
 */
app.get('/.well-known/openid-configuration', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  res.json({
    issuer: config.jwt.issuer,
    authorization_endpoint: `${baseUrl}/auth/google`,
    token_endpoint: `${baseUrl}/auth/token`,
    userinfo_endpoint: `${baseUrl}/auth/profile`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    claims_supported: ['sub', 'email', 'name', 'provider', 'permissions']
  })
})

app.get('/.well-known/jwks.json', (req, res) => {
  // In a real implementation, you'd return actual JWK sets
  // For now, return empty set since we're using HMAC
  res.json({
    keys: []
  })
})

/**
 * Static file serving for development
 */
if (isDevelopment) {
  app.get('/docs', (req, res) => {
    res.send(`
      <html>
        <head><title>F1 OAuth API Documentation</title></head>
        <body>
          <h1>F1 OAuth Service API</h1>
          <h2>Authentication Endpoints</h2>
          <ul>
            <li><a href="/auth/google">GET /auth/google</a> - Google OAuth</li>
            <li><a href="/auth/github">GET /auth/github</a> - GitHub OAuth</li>
            <li>POST /auth/refresh - Refresh JWT token</li>
            <li>POST /auth/logout - Logout user</li>
            <li>GET /auth/profile - Get user profile</li>
          </ul>
          <h2>Neural Integration</h2>
          <ul>
            <li>GET /neural/permissions - Get neural permissions</li>
            <li>POST /neural/quota - Update compute quota</li>
            <li>GET /neural/connections - List synaptic connections</li>
          </ul>
          <h2>System</h2>
          <ul>
            <li><a href="/health">GET /health</a> - Health check</li>
            <li><a href="/.well-known/openid-configuration">GET /.well-known/openid-configuration</a> - OIDC Discovery</li>
          </ul>
        </body>
      </html>
    `)
  })
}

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'SASI F1 OAuth Service',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    documentation: isDevelopment ? '/docs' : undefined
  })
})

/**
 * 404 Handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

/**
 * Global Error Handler
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error)

  // Don't leak error details in production
  const message = isProduction ? 'Internal Server Error' : error.message
  const stack = isDevelopment ? error.stack : undefined

  res.status(error.status || 500).json({
    error: 'Server Error',
    message,
    stack,
    timestamp: new Date().toISOString()
  })
})

/**
 * Server Startup
 */
async function startServer() {
  try {
    // Ensure required directories exist
    await fs.mkdir(path.dirname(config.database.path), { recursive: true })
    await fs.mkdir(config.database.backupPath, { recursive: true })
    
    if (isProduction) {
      await fs.mkdir('./logs', { recursive: true })
    }

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 F1 OAuth Server running on port ${config.port}`)
      logger.info(`📝 Environment: ${config.nodeEnv}`)
      logger.info(`🔒 Security: CORS, Rate Limiting, Helmet enabled`)
      logger.info(`🗄️  Database: ${config.database.path}`)
      
      if (isDevelopment) {
        logger.info(`📖 API Documentation: http://localhost:${config.port}/docs`)
        logger.info(`🔍 Health Check: http://localhost:${config.port}/health`)
      }
      
      logger.info(`✅ F1 OAuth Service ready for SASI neural authentication`)
    })

    // Graceful shutdown
    const shutdown = () => {
      logger.info('🔄 Shutting down F1 OAuth Server...')
      server.close(() => {
        logger.info('✅ Server shutdown complete')
        process.exit(0)
      })
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
if (require.main === module) {
  startServer()
}

export { app }
export default app