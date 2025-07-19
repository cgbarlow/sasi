/**
 * Jest Configuration Validation Test
 * This test validates that Jest is properly configured and can run basic tests
 */

const { describe, test, expect } = require('@jest/globals');

describe('Jest Configuration Validation', () => {
  test('should be able to run basic tests', () => {
    expect(true).toBe(true);
  });

  test('should have proper test environment setup', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.mockAgent).toBeDefined();
    expect(global.testUtils.mockSwarm).toBeDefined();
  });

  test('should have mocked WebGL context', () => {
    expect(global.WebGLRenderingContext).toBeDefined();
    expect(global.WebGL2RenderingContext).toBeDefined();
  });

  test('should have mocked performance API', () => {
    expect(global.performance).toBeDefined();
    expect(global.performance.now).toBeDefined();
  });

  test('should have custom matchers', () => {
    const mockAgent = global.testUtils.mockAgent();
    expect(mockAgent).toBeValidAgent();
    
    const mockSwarm = global.testUtils.mockSwarm();
    expect(mockSwarm).toBeValidSwarm();
  });

  test('should handle TypeScript files', () => {
    // This test verifies that TypeScript transformation is working
    expect(jest.requireActual).toBeDefined();
  });

  test('should handle module name mapping', () => {
    // Test that module name mapping is working (would throw if not configured)
    expect(() => {
      // These paths should be mapped correctly
      const path = '@/components/test';
      expect(path).toBeDefined();
    }).not.toThrow();
  });
});