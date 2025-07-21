// Global test setup for SASI/Synaptic-mesh integration
const path = require('path');

// Ensure NODE_ENV is set to test for consistent behavior
process.env.NODE_ENV = 'test';

// Ensure WASM is disabled in CI/test environment for consistent behavior
process.env.CI = 'true';
process.env.WASM_ENABLED = 'false';
process.env.DISABLE_WASM_ACCELERATION = 'true';
process.env.NO_WASM = 'true';

// Import Jest DOM matchers for React component testing
require('@testing-library/jest-dom');

// Configure React Testing Library for better async handling
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'; // We'll handle cleanup manually for better control

// Set global timeout for all tests - aligned with jest.config.js
jest.setTimeout(30000);

// Global test configuration
global.expect = expect;

// Console colors for better test output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Enhanced console.log for tests
const originalLog = console.log;
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('✅')) {
    originalLog(colors.green + args[0] + colors.reset, ...args.slice(1));
  } else if (args[0] && typeof args[0] === 'string' && args[0].startsWith('❌')) {
    originalLog(colors.red + args[0] + colors.reset, ...args.slice(1));
  } else if (args[0] && typeof args[0] === 'string' && args[0].startsWith('🚀')) {
    originalLog(colors.cyan + args[0] + colors.reset, ...args.slice(1));
  } else {
    originalLog(...args);
  }
};

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

// Enhanced React Context support for SwarmContext tests
global.React = require('react');
global.ReactDOM = require('react-dom');

// Fix React context issues in testing environment
const originalCreateContext = global.React.createContext;
global.React.createContext = function(defaultValue) {
  const context = originalCreateContext(defaultValue);
  // Ensure _context property is available for testing
  if (context && !context._context) {
    context._context = context;
  }
  return context;
};

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

// Mock RTCPeerConnection for P2P tests
global.RTCPeerConnection = class MockRTCPeerConnection {
  constructor(config) {
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.iceGatheringState = 'new';
    this.signalingState = 'stable';
    this.onicecandidate = null;
    this.oniceconnectionstatechange = null;
    this.ondatachannel = null;
    this.onconnectionstatechange = null;
  }
  
  createDataChannel(label, options) {
    return {
      label,
      readyState: 'open',
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null
    };
  }
  
  async createOffer() {
    return { type: 'offer', sdp: 'mock-sdp' };
  }
  
  async createAnswer() {
    return { type: 'answer', sdp: 'mock-sdp' };
  }
  
  async setLocalDescription(desc) {
    this.localDescription = desc;
  }
  
  async setRemoteDescription(desc) {
    this.remoteDescription = desc;
  }
  
  async addIceCandidate(candidate) {
    // Mock ICE candidate handling
  }
  
  close() {
    this.connectionState = 'closed';
    if (this.onconnectionstatechange) {
      this.onconnectionstatechange();
    }
  }
};

// Mock comprehensive P2P Network components
jest.mock('../src/services/P2PNetworkManager', () => ({
  P2PNetworkManager: jest.fn().mockImplementation(() => ({
    isInitialized: false,
    peers: new Map(),
    signalingServer: {
      close: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    },
    
    async initialize() {
      this.isInitialized = true;
      return true;
    },
    
    async connectToPeer(peerId) {
      // Mock successful connection for normal peers
      if (peerId === 'unreliable-peer') {
        throw new Error('Connection failed');
      }
      return {
        id: peerId,
        status: 'connected',
        dataChannel: {
          send: jest.fn(),
          close: jest.fn()
        }
      };
    },
    
    async disconnectFromPeer(peerId) {
      this.peers.delete(peerId);
    },
    
    async shutdown() {
      this.peers.clear();
      this.isInitialized = false;
      if (this.signalingServer && this.signalingServer.close) {
        this.signalingServer.close();
      }
    },
    
    getPeerInfo: jest.fn(() => ({ status: 'connected' })),
    listPeers: jest.fn(() => []),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  })),
  
  WebRTCError: jest.fn().mockImplementation((message, peerId, state, cause) => {
    const error = new Error(message);
    error.peerId = peerId;
    error.state = state;
    error.cause = cause;
    return error;
  })
}), { virtual: true });

// Mock claude-flow hooks (conditional mock)
try {
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
} catch (e) {
  // claude-flow not available in this environment
}

// Mock ruv-swarm for integration tests (conditional mock)
try {
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
} catch (e) {
  // ruv-swarm not available in this environment
}

// Mock useNeuralMesh hook BEFORE importing SwarmContext - Complete structure
jest.mock('../src/hooks/useNeuralMesh', () => ({
  useNeuralMesh: jest.fn().mockReturnValue({
    isConnected: false,
    isInitializing: false,
    error: null,
    metrics: {
      totalNeurons: 0,
      totalSynapses: 0,
      averageActivity: 0,
      networkEfficiency: 85,
      wasmAcceleration: false
    },
    connection: null,
    agents: [],
    createAgent: jest.fn().mockResolvedValue(null),
    removeAgent: jest.fn(),
    trainMesh: jest.fn().mockResolvedValue({ convergence: true }),
    getMeshStatus: jest.fn().mockResolvedValue({}),
    clearError: jest.fn(),
    reconnect: jest.fn().mockResolvedValue(undefined)
  })
}), { virtual: true });

// Load SwarmContext specific mocks to prevent infinite re-render loops
require('./mocks/SwarmContextMocks.js');

// Enhanced mock for SwarmContext neural services (fallback if not loaded above)
jest.mock('../../src/services/NeuralAgentManager', () => ({
  NeuralAgentManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    spawnAgent: jest.fn().mockImplementation(async (config) => {
      // Simulate realistic spawn time
      await new Promise(resolve => setTimeout(resolve, 50));
      return `agent-${Date.now()}`;
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
      // Simulate inference time
      await new Promise(resolve => setTimeout(resolve, 25));
      return input.map(() => Math.random());
    }),
    trainAgent: jest.fn().mockImplementation(async (agentId, data, epochs) => {
      // Simulate training time
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        sessionId: `session-${Date.now()}`,
        agentId,
        finalAccuracy: 0.85 + Math.random() * 0.1,
        epochs
      };
    }),
    shareKnowledge: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}), { virtual: true });

jest.mock('../../src/services/NeuralMeshService', () => ({
  NeuralMeshService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    addNode: jest.fn().mockImplementation(async (config) => {
      await new Promise(resolve => setTimeout(resolve, 30));
      return `node-${Date.now()}`;
    }),
    createConnection: jest.fn().mockResolvedValue(undefined),
    propagateSignal: jest.fn().mockImplementation(async (signal) => {
      await new Promise(resolve => setTimeout(resolve, 15));
      return { output: Math.random() };
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
  }))
}), { virtual: true });

jest.mock('../../src/services/SwarmContextIntegration', () => ({
  SwarmContextIntegration: jest.fn().mockImplementation(() => ({
    initializeNeuralData: jest.fn().mockResolvedValue({
      agents: [],
      metrics: {
        systemHealthScore: 100,
        totalAgentsSpawned: 0
      }
    }),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}), { virtual: true });

// Mock WASM modules (conditional mock)
try {
  jest.mock('../../synaptic-mesh/src/rs/neural-mesh/pkg', () => ({
    init: jest.fn().mockRejectedValue(new Error('WASM disabled in CI environment')),
    NeuralMesh: jest.fn().mockImplementation(() => ({
      process: jest.fn().mockRejectedValue(new Error('WASM disabled in CI environment')),
      train: jest.fn().mockRejectedValue(new Error('WASM disabled in CI environment')),
      predict: jest.fn().mockRejectedValue(new Error('WASM disabled in CI environment'))
    }))
  }));
} catch (e) {
  // WASM module not available in this environment
}

// Mock ProductionWasmBridge to respect CI environment
jest.mock('../src/utils/ProductionWasmBridge', () => ({
  ProductionWasmBridge: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockImplementation(() => {
      // Check CI environment flags before attempting WASM initialization
      if (process.env.CI === 'true' || 
          process.env.WASM_ENABLED === 'false' || 
          process.env.DISABLE_WASM_ACCELERATION === 'true' ||
          process.env.NODE_ENV === 'test') {
        console.log('🚫 WASM initialization bypassed in CI/test environment');
        return Promise.resolve(false); // Return false to indicate WASM not initialized
      }
      return Promise.resolve(true);
    }),
    isWasmInitialized: jest.fn().mockImplementation(() => {
      // Never return true in CI environment
      return !(process.env.CI === 'true' || 
               process.env.WASM_ENABLED === 'false' || 
               process.env.DISABLE_WASM_ACCELERATION === 'true' ||
               process.env.NODE_ENV === 'test');
    }),
    isSIMDSupported: jest.fn().mockReturnValue(false), // No SIMD in CI
    getSpeedupFactor: jest.fn().mockReturnValue(1.0), // No speedup without WASM
    healthCheck: jest.fn().mockReturnValue({
      status: 'error', // Error status when WASM disabled
      metrics: {
        executionTime: 0,
        memoryUsage: 0,
        simdAcceleration: false,
        throughput: 0,
        efficiency: 0,
        loadTime: 0,
        operationsCount: 0,
        averageOperationTime: 0
      },
      issues: ['WASM disabled in CI environment']
    }),
    getPerformanceMetrics: jest.fn().mockReturnValue({
      executionTime: 0,
      memoryUsage: 0,
      simdAcceleration: false,
      throughput: 0,
      efficiency: 0,
      loadTime: 0,
      operationsCount: 0,
      averageOperationTime: 0
    }),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}), { virtual: true });

// Enhanced crypto mock for OAuth/PKCE tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: jest.fn((algorithm, data) => {
        // Mock SHA-256 digest for PKCE challenge
        if (algorithm === 'SHA-256') {
          // Return a mock 32-byte ArrayBuffer
          const buffer = new ArrayBuffer(32);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < 32; i++) {
            view[i] = Math.floor(Math.random() * 256);
          }
          return Promise.resolve(buffer);
        }
        return Promise.resolve(new ArrayBuffer(32));
      }),
      importKey: jest.fn(() => Promise.resolve({})),
      exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
      sign: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
      verify: jest.fn(() => Promise.resolve(true))
    },
    randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
  }
});

// Enhanced btoa/atob with proper error handling
if (!global.btoa) {
  global.btoa = jest.fn((str) => {
    try {
      return Buffer.from(String(str), 'binary').toString('base64');
    } catch (error) {
      throw new Error('Failed to encode string');
    }
  });
}

if (!global.atob) {
  global.atob = jest.fn((str) => {
    try {
      return Buffer.from(String(str), 'base64').toString('binary');
    } catch (error) {
      throw new Error('Failed to decode string');
    }
  });
}

// Mock TextEncoder/TextDecoder for OAuth PKCE
if (!global.TextEncoder) {
  global.TextEncoder = class TextEncoder {
    constructor() {
      this.encoding = 'utf-8';
    }
    
    encode(input) {
      // Convert string to UTF-8 bytes
      const utf8 = unescape(encodeURIComponent(String(input || '')));
      const bytes = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        bytes[i] = utf8.charCodeAt(i);
      }
      return bytes;
    }
    
    encodeInto(source, destination) {
      const encoded = this.encode(source);
      const length = Math.min(encoded.length, destination.length);
      destination.set(encoded.subarray(0, length));
      return {
        read: source.length,
        written: length
      };
    }
  };
}

if (!global.TextDecoder) {
  global.TextDecoder = class TextDecoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding.toLowerCase();
      this.fatal = false;
      this.ignoreBOM = false;
    }
    
    decode(input) {
      if (!input) return '';
      
      // Convert bytes to UTF-8 string
      const bytes = new Uint8Array(input);
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      
      try {
        return decodeURIComponent(escape(str));
      } catch (error) {
        if (this.fatal) {
          throw new TypeError('Failed to decode UTF-8');
        }
        return str;
      }
    }
  };
}

// Mock URLSearchParams for OAuth callback parameters
if (!global.URLSearchParams) {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      
      if (typeof init === 'string') {
        // Parse query string
        if (init.startsWith('?')) {
          init = init.substring(1);
        }
        if (init) {
          init.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
              this.params.set(
                decodeURIComponent(key),
                decodeURIComponent(value || '')
              );
            }
          });
        }
      } else if (init && typeof init === 'object') {
        // Parse object or Map
        const entries = init instanceof Map ? init.entries() : Object.entries(init);
        for (const [key, value] of entries) {
          this.params.set(String(key), String(value));
        }
      }
    }
    
    append(name, value) {
      const existing = this.params.get(name);
      if (existing) {
        this.params.set(name, existing + ',' + String(value));
      } else {
        this.params.set(name, String(value));
      }
    }
    
    delete(name) {
      this.params.delete(name);
    }
    
    get(name) {
      return this.params.get(name) || null;
    }
    
    has(name) {
      return this.params.has(name);
    }
    
    set(name, value) {
      this.params.set(name, String(value));
    }
    
    toString() {
      const pairs = [];
      for (const [key, value] of this.params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return pairs.join('&');
    }
    
    entries() {
      return this.params.entries();
    }
    
    keys() {
      return this.params.keys();
    }
    
    values() {
      return this.params.values();
    }
    
    [Symbol.iterator]() {
      return this.params.entries();
    }
  };
}

// Mock URL constructor for OAuth URL building
if (!global.URL) {
  global.URL = class URL {
    constructor(url, base) {
      if (base) {
        // Simple base URL resolution
        if (!url.startsWith('http')) {
          url = base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
        }
      }
      
      const parts = url.match(/^(https?:)\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
      if (!parts) {
        throw new TypeError('Invalid URL');
      }
      
      this.protocol = parts[1];
      this.host = parts[2];
      this.pathname = parts[3] || '/';
      this.search = parts[4] || '';
      this.hash = parts[5] || '';
      this.href = url;
      
      const hostParts = this.host.split(':');
      this.hostname = hostParts[0];
      this.port = hostParts[1] || '';
      
      this.origin = `${this.protocol}//${this.host}`;
      this.searchParams = new URLSearchParams(this.search);
    }
    
    toString() {
      // Rebuild URL from components
      const search = this.searchParams.toString();
      return `${this.protocol}//${this.host}${this.pathname}${search ? '?' + search : ''}${this.hash}`;
    }
  };
}

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

// Enhanced localStorage mock with proper storage behavior for OAuth tests
const createStorageMock = (name) => {
  const storage = new Map();
  
  return {
    getItem: jest.fn((key) => {
      try {
        return storage.get(key) || null;
      } catch (error) {
        console.warn(`${name}.getItem error:`, error);
        return null;
      }
    }),
    
    setItem: jest.fn((key, value) => {
      try {
        storage.set(key, String(value));
      } catch (error) {
        console.warn(`${name}.setItem error:`, error);
        throw new Error(`${name} is not available`);
      }
    }),
    
    removeItem: jest.fn((key) => {
      try {
        storage.delete(key);
      } catch (error) {
        console.warn(`${name}.removeItem error:`, error);
      }
    }),
    
    clear: jest.fn(() => {
      try {
        storage.clear();
      } catch (error) {
        console.warn(`${name}.clear error:`, error);
      }
    }),
    
    get length() {
      return storage.size;
    },
    
    key: jest.fn((index) => {
      const keys = Array.from(storage.keys());
      return keys[index] || null;
    })
  };
};

// Apply enhanced storage mocks
global.localStorage = createStorageMock('localStorage');
global.sessionStorage = createStorageMock('sessionStorage');

// Test utilities including OAuth helpers
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

// OAuth test utilities for authentication testing
global.oauthTestUtils = {
  /**
   * Mock successful OAuth token exchange
   */
  mockTokenExchange: (tokens = {}) => {
    const defaultTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: ['profile', 'projects']
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...defaultTokens, ...tokens })
    });
  },
  
  /**
   * Mock OAuth token exchange failure
   */
  mockTokenExchangeFailure: (error = {}) => {
    const defaultError = {
      error: 'invalid_grant',
      error_description: 'Authorization code is invalid'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ ...defaultError, ...error })
    });
  },
  
  /**
   * Mock user profile API response
   */
  mockUserProfile: (profile = {}) => {
    const defaultProfile = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      subscription: { plan: 'pro' },
      limits: {
        max_tokens: 100000,
        max_projects: 10,
        max_agents: 5
      }
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...defaultProfile, ...profile })
    });
  },
  
  /**
   * Setup sessionStorage with OAuth state
   */
  setupOAuthState: (state = 'test-state', verifier = 'test-verifier') => {
    global.sessionStorage.setItem('auth_state', state);
    global.sessionStorage.setItem('pkce_verifier', verifier);
  },
  
  /**
   * Clear OAuth state from sessionStorage
   */
  clearOAuthState: () => {
    global.sessionStorage.removeItem('auth_state');
    global.sessionStorage.removeItem('pkce_verifier');
  },
  
  /**
   * Mock safe window.location.href assignment for OAuth redirect tests
   */
  mockLocationHref: () => {
    const mockSetter = jest.fn();
    
    try {
      // Override href setter to prevent JSDOM navigation errors
      Object.defineProperty(window.location, 'href', {
        set: mockSetter,
        get: () => window.location._href || 'http://localhost:3000/',
        configurable: true
      });
    } catch (error) {
      // If defineProperty fails, create a tracking function
      window.location._mockLocationSetter = mockSetter;
      return jest.fn().mockImplementation((url) => {
        mockSetter(url);
        // Prevent actual navigation in tests
        return undefined;
      });
    }
    
    return mockSetter;
  },
  
  /**
   * Reset all OAuth mocks for clean test isolation
   */
  resetMocks: () => {
    jest.clearAllMocks();
    global.sessionStorage.clear();
    global.localStorage.clear();
    
    // Reset crypto mock to generate new values
    if (global.crypto && global.crypto.getRandomValues) {
      global.crypto.getRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });
    }
  }
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
