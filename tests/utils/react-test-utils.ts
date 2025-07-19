/**
 * React Testing Utilities
 * Provides helpers for testing React components without act() warnings
 */

import { act } from '@testing-library/react';

/**
 * Wrapper for async operations that might cause React state updates
 */
export const actAsync = async (fn: () => Promise<void>): Promise<void> => {
  await act(async () => {
    await fn();
  });
};

/**
 * Wrapper for synchronous operations that might cause React state updates
 */
export const actSync = (fn: () => void): void => {
  act(() => {
    fn();
  });
};

/**
 * Wait for component to stabilize (useful for useEffect operations)
 */
export const waitForStable = async (timeout: number = 100): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, timeout));
  });
};

/**
 * Mock function factory for async operations
 */
export const createAsyncMock = <T extends any[], R>(
  implementation: (...args: T) => Promise<R>
) => {
  return jest.fn(async (...args: T): Promise<R> => {
    let result: R;
    await act(async () => {
      result = await implementation(...args);
    });
    return result!;
  });
};

/**
 * Mock component factory that handles state updates properly
 */
export const createMockComponent = (name: string) => {
  return jest.fn().mockImplementation(({ children, ...props }) => {
    // Mock component that doesn't trigger act warnings
    return `<${name} ${Object.keys(props).map(k => `${k}="${props[k]}"`).join(' ')}>${children || ''}</${name}>`;
  });
};

export default {
  actAsync,
  actSync,
  waitForStable,
  createAsyncMock,
  createMockComponent
};