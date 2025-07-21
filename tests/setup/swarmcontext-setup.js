/**
 * Enhanced setup specifically for SwarmContext tests
 * Handles React context, async operations, and neural service mocks
 */

// Enhanced React testing utilities
import { configure } from '@testing-library/react';

// Configure React Testing Library for better async handling
configure({
  // Increase timeout for async operations
  asyncUtilTimeout: 10000,
  // Better error messages
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    error.stack = null;
    return error;
  }
});

// Global test timeout adjustment for SwarmContext
jest.setTimeout(15000);

// Enhanced error handling for React context
const originalError = console.error;
console.error = (...args) => {
  // Filter out known React testing warnings that are not actionable
  const message = args[0];
  if (typeof message === 'string') {
    // Ignore React context warnings in tests
    if (message.includes('Warning: ReactDOM.render') ||
        message.includes('Warning: componentWillReceiveProps') ||
        message.includes('act(...)')) {
      return;
    }
  }
  originalError.apply(console, args);
};

// SwarmContext specific test utilities
global.swarmTestUtils = {
  // Wait for SwarmContext initialization
  waitForSwarmInit: async (result, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (result.current && result.current.isInitialized) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`SwarmContext did not initialize within ${timeout}ms`);
  },
  
  // Create mock agent configuration
  createMockAgentConfig: (type = 'researcher', overrides = {}) => ({
    type,
    cognitivePattern: 'divergent',
    capabilities: ['analysis', 'research'],
    ...overrides
  }),
  
  // Create mock neural data
  createMockNeuralData: () => ({
    agents: [],
    metrics: {
      totalAgentsSpawned: 0,
      averageSpawnTime: 45,
      averageInferenceTime: 25,
      memoryUsage: 1024,
      activeLearningTasks: 0,
      systemHealthScore: 100
    }
  }),
  
  // Simulate async neural operations
  simulateAsyncOperation: async (duration = 50) => {
    await new Promise(resolve => setTimeout(resolve, duration));
  }
};

// Mock performance observer for neural metrics
global.PerformanceObserver = class MockPerformanceObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
};

// Enhanced cleanup for each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Reset any global state
  if (global.swarmTestUtils) {
    // Reset test utilities state if needed
  }
});

console.log('🧪 SwarmContext test setup complete - Enhanced React context testing ready');