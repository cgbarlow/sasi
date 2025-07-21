/**
 * Comprehensive mocks for SwarmContext testing
 * Prevents infinite re-render loops and provides stable test environment
 */

// Mock SwarmContextIntegration to prevent async initialization issues
// Use 'mock' prefix for Jest variable scoping requirements
const mockSwarmContextIntegration = jest.fn().mockImplementation(() => ({
  initializeNeuralData: jest.fn().mockImplementation(async () => {
    // Simulate brief initialization time
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
      agents: [],
      metrics: {
        systemHealthScore: 100,
        totalAgentsSpawned: 0,
        averageSpawnTime: 45,
        averageInferenceTime: 25,
        memoryUsage: 1024,
        activeLearningTasks: 0
      }
    };
  }),
  
  simulateNeuralActivity: jest.fn().mockImplementation(async () => {
    // Return empty array to prevent agent updates that cause re-renders
    return [];
  }),
  
  getEnhancedStats: jest.fn().mockImplementation((baseStats) => {
    // Return stats without modifications to prevent loops
    return {
      ...baseStats,
      enhanced: true,
      timestamp: Date.now()
    };
  }),
  
  cleanup: jest.fn().mockResolvedValue(undefined)
}));

// Mock NeuralAgentManager with stable responses
const mockNeuralAgentManager = jest.fn().mockImplementation(() => ({
  initialize: jest.fn().mockResolvedValue(true),
  
  spawnAgent: jest.fn().mockImplementation(async (config) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }),
  
  getActiveAgents: jest.fn().mockReturnValue([]),
  
  getPerformanceMetrics: jest.fn().mockReturnValue({
    totalAgentsSpawned: 0,
    averageSpawnTime: 45,
    averageInferenceTime: 25,
    memoryUsage: 1024,
    activeLearningTasks: 0,
    systemHealthScore: 100
  }),
  
  terminateAgent: jest.fn().mockResolvedValue(undefined),
  
  runInference: jest.fn().mockImplementation(async (agentId, input) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return input.map(() => Math.random());
  }),
  
  trainAgent: jest.fn().mockImplementation(async (agentId, data, epochs) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      sessionId: `session-${Date.now()}`,
      agentId,
      finalAccuracy: 0.85,
      epochs
    };
  }),
  
  shareKnowledge: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
}));

// Mock NeuralMeshService with stable responses
const mockNeuralMeshService = jest.fn().mockImplementation(() => ({
  initialize: jest.fn().mockResolvedValue(true),
  
  addNode: jest.fn().mockImplementation(async (config) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return `node-${Date.now()}`;
  }),
  
  createConnection: jest.fn().mockResolvedValue(undefined),
  
  propagateSignal: jest.fn().mockImplementation(async (signal) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return { output: 0.5 }; // Stable output
  }),
  
  getPerformanceMetrics: jest.fn().mockReturnValue({
    propagationTime: 15,
    learningRate: 0.001,
    networkEfficiency: 0.85,
    memoryUsage: 1024,
    nodeUtilization: 0.75
  }),
  
  shutdown: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
}));

// Mock useNeuralMesh hook to prevent infinite updates
const mockUseNeuralMesh = jest.fn().mockReturnValue({
  agents: [], // Empty to prevent agent updates
  metrics: {
    networkEfficiency: 0.85,
    wasmAcceleration: 1.2,
    processingNodes: 0
  },
  spawnAgent: jest.fn().mockResolvedValue('neural-agent-123'),
  terminateAgent: jest.fn().mockResolvedValue(undefined),
  isInitialized: true,
  error: null
});

// Apply mocks with proper variable scoping
jest.mock('../../src/services/SwarmContextIntegration', () => ({
  SwarmContextIntegration: mockSwarmContextIntegration
}), { virtual: true });

jest.mock('../../src/services/NeuralAgentManager', () => ({
  NeuralAgentManager: mockNeuralAgentManager
}), { virtual: true });

jest.mock('../../src/services/NeuralMeshService', () => ({
  NeuralMeshService: mockNeuralMeshService
}), { virtual: true });

// useNeuralMesh is mocked in setup.js to ensure proper loading order

// Prevent timer-based updates during tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

console.log('🧪 SwarmContext mocks loaded - Stable test environment ready');