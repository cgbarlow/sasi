// Global test setup for SASI/Synaptic-mesh integration
const { jest } = require('@jest/globals');
const path = require('path');

// Increase timeout for all tests
jest.setTimeout(60000);

// Mock WebGL context for browser-based tests
global.WebGLRenderingContext = class MockWebGLRenderingContext {};
global.WebGL2RenderingContext = class MockWebGL2RenderingContext {};

// Mock Three.js for unit tests
jest.mock('three', () => ({
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn()
  })),
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn()
  })),
  PerspectiveCamera: jest.fn(),
  Vector3: jest.fn(),
  Mesh: jest.fn(),
  BoxGeometry: jest.fn(),
  MeshBasicMaterial: jest.fn()
}));

// Mock React Three Fiber for SASI tests
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => children,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: {},
    scene: {},
    gl: {}
  }))
}));

// Mock WebSocket for real-time tests
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }
  
  send(data) {
    // Mock send implementation
  }
  
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
};

// Mock claude-flow hooks
jest.mock('claude-flow', () => ({
  hooks: {
    preTask: jest.fn(),
    postEdit: jest.fn(),
    notification: jest.fn(),
    postTask: jest.fn()
  },
  memory: {
    store: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn()
  },
  swarm: {
    init: jest.fn(),
    spawn: jest.fn(),
    orchestrate: jest.fn(),
    status: jest.fn()
  }
}));

// Mock ruv-swarm for integration tests
jest.mock('ruv-swarm', () => ({
  SwarmManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    spawn: jest.fn(),
    orchestrate: jest.fn(),
    status: jest.fn(),
    destroy: jest.fn()
  })),
  Agent: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
    coordinate: jest.fn(),
    learn: jest.fn()
  }))
}));

// Mock WASM modules
jest.mock('../../synaptic-mesh/src/rs/neural-mesh/pkg', () => ({
  init: jest.fn(),
  NeuralMesh: jest.fn().mockImplementation(() => ({
    process: jest.fn(),
    train: jest.fn(),
    predict: jest.fn()
  }))
}));

// Mock crypto for DAA tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
    }
  }
});

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => [])
};

// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('mock response')
  })
);

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Test utilities
global.testUtils = {
  waitFor: async (condition, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  mockAgent: (type = 'default') => ({
    id: `mock-agent-${Math.random().toString(36).substr(2, 9)}`,
    type,
    status: 'active',
    execute: jest.fn(),
    coordinate: jest.fn(),
    learn: jest.fn()
  }),
  
  mockSwarm: (agentCount = 3) => ({
    id: `mock-swarm-${Math.random().toString(36).substr(2, 9)}`,
    agents: Array.from({ length: agentCount }, (_, i) => 
      global.testUtils.mockAgent(`agent-${i}`)
    ),
    status: 'active',
    topology: 'mesh'
  }),
  
  createMockWebGLContext: () => ({
    canvas: document.createElement('canvas'),
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getParameter: jest.fn(),
    getExtension: jest.fn(),
    createShader: jest.fn(),
    createProgram: jest.fn(),
    useProgram: jest.fn(),
    clear: jest.fn(),
    drawArrays: jest.fn()
  })
};

// Custom matchers
expect.extend({
  toBeValidAgent(received) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.type === 'string' &&
      typeof received.execute === 'function';
    
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be a valid agent`
        : `Expected ${received} to be a valid agent with id, type, and execute method`
    };
  },
  
  toBeValidSwarm(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      Array.isArray(received.agents) &&
      typeof received.status === 'string';
    
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid swarm`
        : `Expected ${received} to be a valid swarm with id, agents array, and status`
    };
  }
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup function
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Test setup complete - SASI/Synaptic-mesh integration testing environment ready');