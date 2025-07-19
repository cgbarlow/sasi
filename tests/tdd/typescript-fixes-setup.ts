/**
 * Setup file for TypeScript Fixes TDD Tests
 * Global test configuration and utilities
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Setup global mocks
beforeAll(() => {
  // Mock console methods for cleaner test output
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  // Mock timers for deterministic testing
  jest.useFakeTimers();
  
  // Mock crypto for Node.js compatibility
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(2, 15)
    }
  });
  
  // Mock localStorage for browser compatibility
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(() => null),
      removeItem: jest.fn(() => null),
      clear: jest.fn(() => null)
    }
  });
  
  // Mock fetch for API testing
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })
  ) as jest.Mock;
});

// Cleanup after all tests
afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  
  // Restore timers
  jest.useRealTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Setup before each test
beforeEach(() => {
  // Clear mock calls but keep implementations
  jest.clearAllMocks();
  
  // Reset fake timers
  jest.clearAllTimers();
  
  // Set consistent fake time
  jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
});

// Cleanup after each test
afterEach(() => {
  // Clean up any hanging promises
  jest.clearAllTimers();
  
  // Reset modules to prevent cross-test pollution
  jest.resetModules();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidNetworkPartition(): R;
      toBeValidNeuralAgent(): R;
      toBeValidPerformanceMetrics(): R;
    }
  }
}

// Custom Jest matchers for TypeScript fixes
expect.extend({
  toBeValidNetworkPartition(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      Array.isArray(received.affectedNodes) &&
      received.startTime instanceof Date &&
      ['partial', 'complete'].includes(received.partitionType) &&
      ['low', 'medium', 'high', 'critical'].includes(received.severity) &&
      typeof received.resolved === 'boolean' &&
      received.recoveryStrategy &&
      ['automatic', 'manual', 'hybrid'].includes(received.recoveryStrategy.type);

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid NetworkPartition`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid NetworkPartition`,
        pass: false
      };
    }
  },

  toBeValidNeuralAgent(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      received.config &&
      ['mlp', 'lstm', 'cnn', 'transformer', 'custom'].includes(received.config.type) &&
      Array.isArray(received.config.architecture) &&
      ['initializing', 'active', 'learning', 'idle', 'terminating', 'error'].includes(received.state) &&
      typeof received.createdAt === 'number' &&
      typeof received.lastActive === 'number' &&
      typeof received.memoryUsage === 'number' &&
      typeof received.totalInferences === 'number' &&
      typeof received.averageInferenceTime === 'number' &&
      typeof received.learningProgress === 'number' &&
      typeof received.connectionStrength === 'number';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid NeuralAgent`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid NeuralAgent`,
        pass: false
      };
    }
  },

  toBeValidPerformanceMetrics(received) {
    const pass = received &&
      typeof received.totalAgentsSpawned === 'number' &&
      typeof received.averageSpawnTime === 'number' &&
      typeof received.averageInferenceTime === 'number' &&
      typeof received.memoryUsage === 'number' &&
      typeof received.activeLearningTasks === 'number' &&
      typeof received.systemHealthScore === 'number' &&
      received.systemHealthScore >= 0 &&
      received.systemHealthScore <= 100;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid PerformanceMetrics`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid PerformanceMetrics`,
        pass: false
      };
    }
  }
});

// Test utilities
export const createMockNetworkPartition = (overrides = {}) => ({
  id: 'test-partition-001',
  affectedNodes: ['node-001', 'node-002'],
  startTime: new Date(),
  partitionType: 'partial' as const,
  severity: 'medium' as const,
  recoveryStrategy: {
    type: 'automatic' as const,
    timeout: 30000,
    retryCount: 3,
    fallbackNodes: ['fallback-001'],
    escalationThreshold: 5
  },
  resolved: false,
  ...overrides
});

export const createMockNeuralAgent = (overrides = {}) => ({
  id: 'test-agent-001',
  config: {
    type: 'mlp' as const,
    architecture: [784, 128, 10],
    activationFunction: 'relu' as const,
    learningRate: 0.001
  },
  network: null,
  state: 'active' as const,
  createdAt: Date.now(),
  lastActive: Date.now(),
  memoryUsage: 1024 * 1024,
  totalInferences: 100,
  averageInferenceTime: 25,
  learningProgress: 0.75,
  connectionStrength: 0.85,
  ...overrides
});

export const createMockPeerInfo = (overrides = {}) => ({
  id: 'test-peer-001',
  multiaddrs: ['/ip4/127.0.0.1/tcp/8080'],
  protocols: ['test-protocol'],
  metadata: {
    agentCount: 5,
    cpuUsage: 45,
    memoryUsage: 60,
    networkLatency: 25,
    lastSeen: new Date(),
    capabilities: ['inference', 'training']
  },
  ...overrides
});

export const waitForAsync = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};

// Type guards for testing
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const isValidTimestamp = (timestamp: number): boolean => {
  return typeof timestamp === 'number' && timestamp > 0 && timestamp <= Date.now();
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Error testing utilities
export const expectToThrowAsync = async (fn: () => Promise<any>, errorType?: any) => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error of type ${errorType.name}, got ${error.constructor.name}`);
    }
    return error;
  }
};

// Performance testing utilities
export const measureExecutionTime = async (fn: () => Promise<any> | any): Promise<{ result: any, duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

// Memory testing utilities
export const measureMemoryUsage = (): number => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
};

// Logging utilities for debugging tests
export const debugLog = (message: string, data?: any) => {
  if (process.env.TEST_DEBUG === 'true') {
    originalConsoleLog(`[TEST DEBUG] ${message}`, data || '');
  }
};

export const testInfo = (message: string) => {
  if (process.env.TEST_VERBOSE === 'true') {
    originalConsoleLog(`[TEST INFO] ${message}`);
  }
};

// Export for use in tests
export {
  jest,
  originalConsoleLog,
  originalConsoleWarn,
  originalConsoleError
};