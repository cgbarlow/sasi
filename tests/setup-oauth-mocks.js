/**
 * OAuth DOM Mocking Setup for Jest
 * Fixes OAuth authentication test issues with window.location, crypto, localStorage, and JSDOM
 */

// Enhanced window.location mock with proper JSDOM compatibility
const mockLocation = {
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/',
  
  // Support for href assignment without JSDOM navigation errors
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  
  toString: function() {
    return this.href;
  }
};

// Create a safe location setter that doesn't trigger JSDOM navigation
Object.defineProperty(mockLocation, 'href', {
  get: function() {
    return this._href || 'http://localhost:3000/';
  },
  set: function(value) {
    this._href = value;
    // Fire a mock navigation event instead of actual navigation
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('mock-navigation'));
    }
  },
  configurable: true,
  enumerable: true
});

// Mock window object with safe location handling
if (typeof window === 'undefined') {
  global.window = {
    location: mockLocation,
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: {
      createElement: jest.fn(() => ({})),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    },
    navigator: {
      userAgent: 'jest'
    },
    history: {
      pushState: jest.fn(),
      replaceState: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      go: jest.fn()
    }
  };
} else {
  // If window exists (JSDOM), check if location is configurable before replacing
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'location');
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true
      });
    } else {
      // Fallback: modify existing location properties
      const originalLocation = window.location;
      Object.assign(originalLocation, mockLocation);
    }
  } catch (error) {
    console.warn('⚠️ Could not redefine window.location, using fallback approach');
    // Create a new location-like object as a fallback
    window.mockLocation = mockLocation;
  }
}

// Enhanced crypto mock with proper PKCE support
const mockCrypto = {
  getRandomValues: jest.fn((array) => {
    // Fill array with deterministic but random-looking values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
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
    verify: jest.fn(() => Promise.resolve(true)),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  },
  
  // Add randomUUID for completeness
  randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

// Add TextEncoder and TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  Object.defineProperty(global, 'TextEncoder', {
    value: TextEncoder,
    writable: true,
    configurable: true
  });
  Object.defineProperty(global, 'TextDecoder', {
    value: TextDecoder,
    writable: true,
    configurable: true
  });
}

// Enhanced localStorage mock with proper error handling
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

// Apply storage mocks
const localStorageMock = createStorageMock('localStorage');
const sessionStorageMock = createStorageMock('sessionStorage');

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true
});

// Ensure window objects also use the same mocks
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true
  });
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });
}

// Enhanced btoa/atob mocks with error handling
global.btoa = jest.fn((str) => {
  try {
    return Buffer.from(String(str), 'binary').toString('base64');
  } catch (error) {
    throw new Error('Failed to encode string');
  }
});

global.atob = jest.fn((str) => {
  try {
    return Buffer.from(String(str), 'base64').toString('binary');
  } catch (error) {
    throw new Error('Failed to decode string');
  }
});

// Enhanced TextEncoder/TextDecoder with proper UTF-8 support
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

// Mock URLSearchParams for OAuth callback parameter handling
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
    
    getAll(name) {
      const value = this.params.get(name);
      return value ? value.split(',') : [];
    }
    
    has(name) {
      return this.params.has(name);
    }
    
    set(name, value) {
      this.params.set(name, String(value));
    }
    
    sort() {
      const sorted = new Map([...this.params.entries()].sort());
      this.params = sorted;
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

// Mock fetch for OAuth token exchange and API calls
const mockFetch = jest.fn((url, options) => {
  // Default successful response
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    json: jest.fn(() => Promise.resolve({})),
    text: jest.fn(() => Promise.resolve('')),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0)))
  };
  
  return Promise.resolve(mockResponse);
});

global.fetch = mockFetch;

// OAuth test utilities
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
   * Mock safe window.location.href assignment
   */
  mockLocationHref: () => {
    // Try to use existing location._hrefSetter if available from setup
    if (window.location._hrefSetter) {
      return window.location._hrefSetter;
    }
    
    // Check if href property is configurable
    const descriptor = Object.getOwnPropertyDescriptor(window.location, 'href');
    if (descriptor && !descriptor.configurable) {
      // If not configurable, return a mock function and track href sets differently
      const mockSetter = jest.fn();
      window.location._mockHrefSetter = mockSetter;
      return mockSetter;
    }
    
    try {
      // Try to create a new setter
      const mockSetter = jest.fn();
      Object.defineProperty(window.location, 'href', {
        set: mockSetter,
        get: () => window.location._href || 'http://localhost:3000/',
        configurable: true
      });
      window.location._hrefSetter = mockSetter;
      return mockSetter;
    } catch (error) {
      // Fallback to a simple mock function
      const mockSetter = jest.fn();
      window.location._mockHrefSetter = mockSetter;
      return mockSetter;
    }
  },
  
  /**
   * Reset all OAuth mocks
   */
  resetMocks: () => {
    jest.clearAllMocks();
    global.sessionStorage.clear();
    global.localStorage.clear();
    
    // Reset crypto mock to generate new values
    global.crypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });
  }
};

// Performance mock for OAuth timing tests
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

console.log('🔐 OAuth DOM mocking setup complete - secure authentication testing environment ready');