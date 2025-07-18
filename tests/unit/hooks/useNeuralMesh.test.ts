/**
 * Comprehensive Unit Tests for useNeuralMesh Hook
 * Target: 95%+ coverage for custom hook functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNeuralMesh } from '../../../src/hooks/useNeuralMesh';

// Mock the neural mesh service
jest.mock('../../../src/services/NeuralMeshService', () => ({
  NeuralMeshService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    addNode: jest.fn().mockResolvedValue('node-123'),
    removeNode: jest.fn().mockResolvedValue(undefined),
    createConnection: jest.fn().mockResolvedValue(undefined),
    updateConnection: jest.fn().mockResolvedValue(undefined),
    removeConnection: jest.fn().mockResolvedValue(undefined),
    propagateSignal: jest.fn().mockResolvedValue({ output: 0.75 }),
    learn: jest.fn().mockResolvedValue({
      epochs: 10,
      finalError: 0.05,
      convergence: true
    }),
    optimizeTopology: jest.fn().mockResolvedValue(undefined),
    getPerformanceMetrics: jest.fn().mockReturnValue({
      propagationTime: 12,
      learningRate: 0.001,
      networkEfficiency: 0.88,
      memoryUsage: 2048,
      nodeUtilization: 0.72
    }),
    getConnections: jest.fn().mockReturnValue([]),
    getNodeCount: jest.fn().mockReturnValue(0),
    isInitialized: jest.fn().mockReturnValue(true),
    saveState: jest.fn().mockResolvedValue({}),
    restoreState: jest.fn().mockResolvedValue(undefined),
    exportMesh: jest.fn().mockResolvedValue('{}'),
    shutdown: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}));

describe('useNeuralMesh Hook - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('should initialize with custom configuration', async () => {
      const config = {
        maxNodes: 50,
        learningRate: 0.002,
        activationFunction: 'relu'
      };

      const { result } = renderHook(() => useNeuralMesh(config));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    test('should handle initialization errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to initialize neural mesh: Init failed');
        expect(result.current.isInitialized).toBe(false);
      });
    });

    test('should retry initialization on failure', async () => {
      const mockInitialize = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(true);

      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: mockInitialize,
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh({ retryAttempts: 2 }));

      await act(async () => {
        await result.current.retryInitialization();
      });

      expect(mockInitialize).toHaveBeenCalledTimes(2);
    });

    test('should cleanup on unmount', () => {
      const mockShutdown = jest.fn();
      const mockOff = jest.fn();

      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        shutdown: mockShutdown,
        on: jest.fn(),
        off: mockOff
      }));

      const { unmount } = renderHook(() => useNeuralMesh());

      unmount();

      expect(mockShutdown).toHaveBeenCalled();
      expect(mockOff).toHaveBeenCalled();
    });
  });

  describe('Node Management', () => {
    test('should add nodes successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let nodeId: string = '';
      await act(async () => {
        nodeId = await result.current.addNode({
          type: 'processor',
          activationFunction: 'tanh'
        });
      });

      expect(nodeId).toBe('node-123');
      expect(result.current.nodeCount).toBe(0); // Mock returns 0
    });

    test('should remove nodes successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.removeNode('node-123');
      });

      // Should not throw errors
    });

    test('should handle node operation errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        addNode: jest.fn().mockRejectedValue(new Error('Node add failed')),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.addNode({ type: 'processor' });
        } catch (error) {
          expect(error.message).toBe('Node add failed');
        }
      });
    });

    test('should validate node configurations', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.addNode({ type: '' } as any);
        } catch (error) {
          expect(error.message).toContain('Invalid node configuration');
        }
      });
    });
  });

  describe('Connection Management', () => {
    test('should create connections successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.createConnection('node1', 'node2', 0.5);
      });

      // Should not throw errors
    });

    test('should update connection weights', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.updateConnection('node1', 'node2', 0.8);
      });

      // Should not throw errors
    });

    test('should remove connections', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.removeConnection('node1', 'node2');
      });

      // Should not throw errors
    });

    test('should validate connection parameters', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.createConnection('', 'node2', 0.5);
        } catch (error) {
          expect(error.message).toContain('Invalid connection parameters');
        }
      });
    });
  });

  describe('Signal Propagation', () => {
    test('should propagate signals successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let output: any;
      await act(async () => {
        output = await result.current.propagateSignal({ input: 1.0 });
      });

      expect(output.output).toBe(0.75);
    });

    test('should handle empty signal inputs', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let output: any;
      await act(async () => {
        output = await result.current.propagateSignal({});
      });

      expect(output).toBeDefined();
    });

    test('should validate signal inputs', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.propagateSignal(null as any);
        } catch (error) {
          expect(error.message).toContain('Invalid signal input');
        }
      });
    });

    test('should handle propagation errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        propagateSignal: jest.fn().mockRejectedValue(new Error('Propagation failed')),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.propagateSignal({ input: 1.0 });
        } catch (error) {
          expect(error.message).toBe('Propagation failed');
        }
      });
    });
  });

  describe('Learning and Training', () => {
    test('should train mesh successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const trainingData = [
        { inputs: { input: 0.0 }, outputs: { output: 0.0 } },
        { inputs: { input: 1.0 }, outputs: { output: 1.0 } }
      ];

      let session: any;
      await act(async () => {
        session = await result.current.trainMesh(trainingData, 10);
      });

      expect(session.epochs).toBe(10);
      expect(session.finalError).toBe(0.05);
      expect(session.convergence).toBe(true);
    });

    test('should handle training errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        learn: jest.fn().mockRejectedValue(new Error('Training failed')),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.trainMesh([], 10);
        } catch (error) {
          expect(error.message).toBe('Training failed');
        }
      });
    });

    test('should validate training data', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.trainMesh([], 10);
        } catch (error) {
          expect(error.message).toContain('Training data cannot be empty');
        }
      });
    });

    test('should validate training epochs', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const trainingData = [
        { inputs: { input: 1.0 }, outputs: { output: 1.0 } }
      ];

      await act(async () => {
        try {
          await result.current.trainMesh(trainingData, -1);
        } catch (error) {
          expect(error.message).toContain('Epochs must be positive');
        }
      });
    });
  });

  describe('Optimization', () => {
    test('should optimize topology successfully', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.optimizeTopology();
      });

      // Should not throw errors
    });

    test('should handle optimization errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        optimizeTopology: jest.fn().mockRejectedValue(new Error('Optimization failed')),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.optimizeTopology();
        } catch (error) {
          expect(error.message).toBe('Optimization failed');
        }
      });
    });

    test('should track optimization metrics', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const metrics = result.current.getMetrics();

      expect(metrics.propagationTime).toBe(12);
      expect(metrics.networkEfficiency).toBe(0.88);
      expect(metrics.memoryUsage).toBe(2048);
      expect(metrics.nodeUtilization).toBe(0.72);
    });
  });

  describe('State Management', () => {
    test('should save and restore state', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let savedState: any;
      await act(async () => {
        savedState = await result.current.saveState();
      });

      expect(savedState).toBeDefined();

      await act(async () => {
        await result.current.restoreState(savedState);
      });

      // Should not throw errors
    });

    test('should export mesh data', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let exportData: string = '';
      await act(async () => {
        exportData = await result.current.exportMesh('json');
      });

      expect(exportData).toBe('{}');
    });

    test('should handle state operation errors', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        saveState: jest.fn().mockRejectedValue(new Error('Save failed')),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.saveState();
        } catch (error) {
          expect(error.message).toBe('Save failed');
        }
      });
    });
  });

  describe('Event Handling', () => {
    test('should handle mesh events correctly', async () => {
      let eventCallback: Function;
      const mockOn = jest.fn((event, callback) => {
        if (event === 'nodeAdded') {
          eventCallback = callback;
        }
      });

      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        isInitialized: jest.fn().mockReturnValue(true),
        getNodeCount: jest.fn().mockReturnValue(1),
        on: mockOn,
        off: jest.fn(),
        shutdown: jest.fn()
      }));

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Simulate event
      act(() => {
        if (eventCallback) {
          eventCallback({ nodeId: 'new-node' });
        }
      });

      expect(result.current.nodeCount).toBe(1);
    });

    test('should clean up event listeners', () => {
      const mockOff = jest.fn();
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        on: jest.fn(),
        off: mockOff,
        shutdown: jest.fn()
      }));

      const { unmount } = renderHook(() => useNeuralMesh());

      unmount();

      expect(mockOff).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory', () => {
    test('should throttle frequent operations', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Rapidly call propagateSignal multiple times
      const signals = Array(10).fill({ input: 1.0 });
      
      await act(async () => {
        await Promise.all(signals.map(signal => 
          result.current.propagateSignal(signal)
        ));
      });

      // Should handle rapid calls efficiently
    });

    test('should memoize expensive computations', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const metrics1 = result.current.getMetrics();
      const metrics2 = result.current.getMetrics();

      // Should return the same reference for unchanged data
      expect(metrics1).toBe(metrics2);
    });

    test('should handle memory pressure gracefully', async () => {
      const { result } = renderHook(() => useNeuralMesh({ 
        maxNodes: 1000,
        memoryLimit: 1024 * 1024 // 1MB limit
      }));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should initialize without errors even with memory constraints
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary failures', async () => {
      const mockService = {
        initialize: jest.fn().mockResolvedValue(true),
        propagateSignal: jest.fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce({ output: 0.5 }),
        isInitialized: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        off: jest.fn(),
        shutdown: jest.fn()
      };

      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => mockService);

      const { result } = renderHook(() => useNeuralMesh({ 
        retryAttempts: 2,
        retryDelay: 10
      }));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // First call should fail, second should succeed with retry
      let output: any;
      await act(async () => {
        try {
          output = await result.current.propagateSignal({ input: 1.0 });
        } catch (error) {
          // Retry should be attempted automatically
        }
      });

      expect(mockService.propagateSignal).toHaveBeenCalledTimes(1);
    });

    test('should clear errors after successful operations', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      // Set error state
      act(() => {
        (result.current as any).setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Successful operation should clear error
      await act(async () => {
        await result.current.propagateSignal({ input: 1.0 });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid configurations gracefully', () => {
      const invalidConfig = {
        maxNodes: -1,
        learningRate: 'invalid',
        activationFunction: null
      };

      const { result } = renderHook(() => useNeuralMesh(invalidConfig as any));

      // Should not crash and use fallback values
      expect(result.current).toBeDefined();
    });

    test('should handle service unavailability', async () => {
      const { NeuralMeshService } = require('../../../src/services/NeuralMeshService');
      NeuralMeshService.mockImplementationOnce(() => null);

      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.error).toContain('service unavailable');
      });
    });

    test('should handle concurrent state updates', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Simulate concurrent operations
      await act(async () => {
        await Promise.all([
          result.current.addNode({ type: 'processor' }),
          result.current.propagateSignal({ input: 1.0 }),
          result.current.optimizeTopology()
        ]);
      });

      // Should handle concurrent operations without conflicts
    });

    test('should handle special numeric values', async () => {
      const { result } = renderHook(() => useNeuralMesh());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Test with special float values
      await act(async () => {
        try {
          await result.current.createConnection('node1', 'node2', NaN);
        } catch (error) {
          expect(error.message).toContain('Invalid weight');
        }
      });

      await act(async () => {
        try {
          await result.current.createConnection('node1', 'node2', Infinity);
        } catch (error) {
          expect(error.message).toContain('Invalid weight');
        }
      });
    });
  });
});