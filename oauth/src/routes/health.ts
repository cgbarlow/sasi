/**
 * Health Check Routes
 * System health monitoring endpoints
 */

import { Router } from 'express'
import { config, isDevelopment } from '../config/config'
import { logger } from '../utils/logger'
import { DatabaseService } from '../storage/database'
import { HealthStatus, HealthCheck } from '../../types'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

/**
 * Main health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now()
    const checks: HealthCheck[] = []

    // Database health check
    try {
      const db = new DatabaseService()
      const dbStart = Date.now()
      await db.getUserById('health-check') // This will return null but tests connection
      await db.close()
      
      checks.push({
        name: 'database',
        status: 'pass',
        responseTime: Date.now() - dbStart
      })
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'fail',
        error: (error as Error).message
      })
    }

    // File system health check
    try {
      const fsStart = Date.now()
      await fs.access(path.dirname(config.database.path))
      
      checks.push({
        name: 'filesystem',
        status: 'pass',
        responseTime: Date.now() - fsStart
      })
    } catch (error) {
      checks.push({
        name: 'filesystem',
        status: 'fail',
        error: (error as Error).message
      })
    }

    // Memory health check
    try {
      const memUsage = process.memoryUsage()
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
      }

      const memoryStatus = memUsageMB.heapUsed > 500 ? 'warn' : 'pass' // Warn if using > 500MB heap
      
      checks.push({
        name: 'memory',
        status: memoryStatus,
        details: memUsageMB,
        responseTime: Date.now() - startTime
      })
    } catch (error) {
      checks.push({
        name: 'memory',
        status: 'fail',
        error: (error as Error).message
      })
    }

    // Disk space health check (development only)
    if (isDevelopment) {
      try {
        const stats = await fs.stat(config.database.path).catch(() => null)
        checks.push({
          name: 'disk_space',
          status: 'pass',
          details: {
            database_exists: !!stats,
            database_size: stats ? `${Math.round(stats.size / 1024)} KB` : 'N/A'
          }
        })
      } catch (error) {
        checks.push({
          name: 'disk_space',
          status: 'warn',
          error: (error as Error).message
        })
      }
    }

    // Determine overall health status
    const hasFailure = checks.some(check => check.status === 'fail')
    const hasWarning = checks.some(check => check.status === 'warn')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasFailure) {
      overallStatus = 'unhealthy'
    } else if (hasWarning) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks
    }

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

    res.status(statusCode).json(healthStatus)

    logger.debug(`Health check completed: ${overallStatus} (${Date.now() - startTime}ms)`)

  } catch (error) {
    logger.error('Health check error:', error)
    
    const errorHealthStatus: HealthStatus = {
      status: 'unhealthy',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: [{
        name: 'health_check',
        status: 'fail',
        error: (error as Error).message
      }]
    }

    res.status(503).json(errorHealthStatus)
  }
})

/**
 * Detailed system info endpoint (development only)
 */
if (isDevelopment) {
  router.get('/system', async (req, res) => {
    try {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()

      const systemInfo = {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
          heap_total: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
          heap_used: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024 * 100) / 100} MB`
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        environment: {
          node_env: config.nodeEnv,
          port: config.port,
          database_path: config.database.path
        },
        timestamp: new Date().toISOString()
      }

      res.json({
        success: true,
        data: systemInfo,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('System info error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'SYSTEM_INFO_ERROR',
          message: 'Failed to retrieve system information'
        },
        timestamp: new Date().toISOString()
      })
    }
  })
}

/**
 * Liveness probe (simple endpoint for container orchestration)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  })
})

/**
 * Readiness probe (checks if service is ready to accept requests)
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick database connectivity check
    const db = new DatabaseService()
    await db.getUserById('readiness-check')
    await db.close()

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Readiness check failed:', error)
    res.status(503).json({
      status: 'not_ready',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    })
  }
})

export { router as healthRoutes }