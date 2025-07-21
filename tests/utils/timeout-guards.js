/**
 * Timeout Guards and Performance Utilities for CI
 * 
 * Provides timeout protection and performance utilities to prevent test hangs
 */

/**
 * Wraps a promise with a timeout to prevent hanging tests
 */
function withTimeout(promise, timeoutMs = 1000, errorMessage = 'Operation timed out') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  
  return Promise.race([promise, timeoutPromise])
}

/**
 * Creates a fast-resolving promise for CI environments
 */
function fastResolve(value, delayMs = 0) {
  const delay = process.env.CI === 'true' ? 0 : delayMs
  return new Promise(resolve => setTimeout(() => resolve(value), delay))
}

/**
 * Creates a fast-rejecting promise for CI environments
 */
function fastReject(error, delayMs = 0) {
  const delay = process.env.CI === 'true' ? 0 : delayMs
  return new Promise((_, reject) => setTimeout(() => reject(error), delay))
}

/**
 * Performance-optimized mock function creator
 */
function createFastMock(returnValue, isAsync = false) {
  if (isAsync) {
    return jest.fn().mockImplementation(() => fastResolve(returnValue))
  }
  return jest.fn().mockReturnValue(returnValue)
}

/**
 * Batch timeout protection for multiple operations
 */
function withBatchTimeout(promises, timeoutMs = 2000) {
  const batchTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Batch operation timed out')), timeoutMs)
  })
  
  return Promise.race([Promise.all(promises), batchTimeout])
}

/**
 * CI-optimized wait function
 */
function ciWait(ms = 10) {
  const delay = process.env.CI === 'true' ? Math.min(ms, 1) : ms
  return new Promise(resolve => setTimeout(resolve, delay))
}

module.exports = {
  withTimeout,
  fastResolve,
  fastReject,
  createFastMock,
  withBatchTimeout,
  ciWait
}