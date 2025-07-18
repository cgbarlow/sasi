// SASI-specific test setup
const { JSDOM } = require('jsdom');

// Create a mock DOM environment for SASI React components
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock WebGL context for Three.js tests
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return global.testUtils.createMockWebGLContext();
  }
  return null;
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver for visibility detection
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock SASI-specific APIs
global.sasiAPI = {
  agents: {
    list: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({ id: 'mock-agent' })),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  },
  swarms: {
    list: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({ id: 'mock-swarm' })),
    status: jest.fn(() => Promise.resolve({ active: true }))
  },
  neural: {
    predict: jest.fn(() => Promise.resolve({ prediction: 'mock' })),
    train: jest.fn(() => Promise.resolve({ trained: true }))
  }
};

console.log('🎨 SASI test environment setup complete');