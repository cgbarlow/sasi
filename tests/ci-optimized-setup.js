/**
 * CI Environment Detection and Optimization Setup
 * 
 * Sets up environment variables and detection before any tests run
 */

// Detect CI environment from various sources
const isCI = !!(
  process.env.CI ||
  process.env.CONTINUOUS_INTEGRATION ||
  process.env.BUILD_NUMBER ||
  process.env.GITHUB_ACTIONS ||
  process.env.TRAVIS ||
  process.env.CIRCLECI ||
  process.env.JENKINS_URL ||
  process.env.JEST_WORKER_ID
)

// Force CI mode for performance optimization
if (isCI) {
  process.env.CI = 'true'
  process.env.NODE_ENV = 'test'
  process.env.WASM_ENABLED = 'false'
  process.env.DISABLE_WASM_ACCELERATION = 'true'
  process.env.TEST_ENVIRONMENT = 'ci'
  process.env.DISABLE_PERFORMANCE_MONITORING = 'true'
  process.env.DISABLE_HEALTH_CHECKS = 'true'
  process.env.MINIMAL_LOGGING = 'true'
}

// Memory limits for CI stability
if (isCI && process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS + ' --max-old-space-size=2048'
} else if (isCI) {
  process.env.NODE_OPTIONS = '--max-old-space-size=2048'
}