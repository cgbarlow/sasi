/**
 * Winston Logger Configuration
 * Centralized logging for OAuth service
 */

import winston from 'winston'
import path from 'path'
import { logLevel, isDevelopment, isProduction } from '../config/config'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

winston.addColors(colors)

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Define transports
const transports: winston.transport[] = []

// Console transport (always enabled in development)
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat
    })
  )
}

// File transports for production
if (isProduction) {
  // Ensure logs directory exists
  const logsDir = path.resolve(process.cwd(), 'logs')
  
  transports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: productionFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    
    // Console for production (JSON format)
    new winston.transports.Console({
      format: productionFormat
    })
  )
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  levels,
  format: isProduction ? productionFormat : developmentFormat,
  transports,
  exitOnError: false
})

// Create stream for HTTP logging middleware (Morgan)
logger.stream = {
  write: (message: string) => {
    logger.http(message.substring(0, message.lastIndexOf('\n')))
  }
} as any

// Helper methods for structured logging
export const logRequest = (req: any, res: any, responseTime?: number) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  })
}

export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    context
  })
}

export const logAuth = (action: string, userId?: string, details?: any) => {
  logger.info(`Auth: ${action}`, {
    userId,
    ...details
  })
}

export const logDatabase = (operation: string, table?: string, details?: any) => {
  logger.debug(`DB: ${operation}`, {
    table,
    ...details
  })
}

export const logSecurity = (event: string, details?: any) => {
  logger.warn(`Security: ${event}`, details)
}

// Export default logger
export default logger