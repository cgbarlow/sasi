/**
 * Unit Tests for Neural Type Definitions and Validation
 * Target: 95%+ coverage for type guards and validation functions
 */

import { 
  AgentState, 
  NeuralConfiguration, 
  isValidAgentState,
  isValidNeuralConfiguration,
  validateNetworkArchitecture,
  normalizeActivationFunction
} from '../../../src/types/neural';

describe('Neural Types - Comprehensive Tests', () => {
  describe('AgentState Enum', () => {
    test('should include all required states', () => {
      expect(AgentState.INITIALIZING).toBe('initializing');
      expect(AgentState.ACTIVE).toBe('active');
      expect(AgentState.IDLE).toBe('idle');
      expect(AgentState.LEARNING).toBe('learning');
      expect(AgentState.TERMINATING).toBe('terminating');
      expect(AgentState.ERROR).toBe('error');
    });

    test('should validate agent states correctly', () => {
      expect(isValidAgentState('active')).toBe(true);
      expect(isValidAgentState('learning')).toBe(true);
      expect(isValidAgentState('invalid')).toBe(false);
      expect(isValidAgentState('')).toBe(false);
      expect(isValidAgentState(null)).toBe(false);
      expect(isValidAgentState(undefined)).toBe(false);
    });
  });

  describe('NeuralConfiguration Validation', () => {
    test('should validate valid neural configurations', () => {
      const validConfig: NeuralConfiguration = {
        type: 'mlp',
        architecture: [10, 5, 1],
        activationFunction: 'tanh',
        learningRate: 0.001,
        batchSize: 32,
        epochs: 100
      };

      expect(isValidNeuralConfiguration(validConfig)).toBe(true);
    });

    test('should reject invalid neural configurations', () => {
      // Missing required fields
      expect(isValidNeuralConfiguration({})).toBe(false);
      expect(isValidNeuralConfiguration(null)).toBe(false);
      expect(isValidNeuralConfiguration(undefined)).toBe(false);

      // Invalid type
      expect(isValidNeuralConfiguration({
        type: '',
        architecture: [10, 1]
      })).toBe(false);

      // Invalid architecture
      expect(isValidNeuralConfiguration({
        type: 'mlp',
        architecture: []
      })).toBe(false);

      expect(isValidNeuralConfiguration({
        type: 'mlp',
        architecture: [-1, 5, 1]
      })).toBe(false);

      // Invalid learning rate
      expect(isValidNeuralConfiguration({
        type: 'mlp',
        architecture: [10, 1],
        learningRate: -0.1
      })).toBe(false);

      expect(isValidNeuralConfiguration({
        type: 'mlp',
        architecture: [10, 1],
        learningRate: 2.0
      })).toBe(false);
    });

    test('should validate network architectures', () => {
      expect(validateNetworkArchitecture([10, 5, 1])).toBe(true);
      expect(validateNetworkArchitecture([1])).toBe(true);
      expect(validateNetworkArchitecture([784, 128, 64, 10])).toBe(true);

      // Invalid architectures
      expect(validateNetworkArchitecture([])).toBe(false);
      expect(validateNetworkArchitecture([0, 5, 1])).toBe(false);
      expect(validateNetworkArchitecture([10, -1, 1])).toBe(false);
      expect(validateNetworkArchitecture([10, 5.5, 1])).toBe(false);
      expect(validateNetworkArchitecture(null)).toBe(false);
      expect(validateNetworkArchitecture(undefined)).toBe(false);
    });

    test('should normalize activation functions', () => {
      expect(normalizeActivationFunction('tanh')).toBe('tanh');
      expect(normalizeActivationFunction('relu')).toBe('relu');
      expect(normalizeActivationFunction('sigmoid')).toBe('sigmoid');
      expect(normalizeActivationFunction('linear')).toBe('linear');

      // Case normalization
      expect(normalizeActivationFunction('TANH')).toBe('tanh');
      expect(normalizeActivationFunction('ReLU')).toBe('relu');
      expect(normalizeActivationFunction('Sigmoid')).toBe('sigmoid');

      // Invalid functions should return default
      expect(normalizeActivationFunction('invalid')).toBe('tanh');
      expect(normalizeActivationFunction('')).toBe('tanh');
      expect(normalizeActivationFunction(null)).toBe('tanh');
      expect(normalizeActivationFunction(undefined)).toBe('tanh');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle edge case network architectures', () => {
      // Very large networks
      const largeArch = new Array(1000).fill(10);
      expect(validateNetworkArchitecture(largeArch)).toBe(true);

      // Single neuron networks
      expect(validateNetworkArchitecture([1])).toBe(true);

      // Very wide networks
      expect(validateNetworkArchitecture([10000, 1])).toBe(true);
    });

    test('should handle special numeric values', () => {
      expect(validateNetworkArchitecture([Infinity, 5, 1])).toBe(false);
      expect(validateNetworkArchitecture([NaN, 5, 1])).toBe(false);
      expect(validateNetworkArchitecture([10, Number.MAX_VALUE, 1])).toBe(true);
    });

    test('should validate complex neural configurations', () => {
      const complexConfig = {
        type: 'lstm',
        architecture: [784, 256, 128, 10],
        activationFunction: 'relu',
        learningRate: 0.001,
        batchSize: 64,
        epochs: 200,
        dropoutRate: 0.2,
        regularization: 'l2',
        optimizer: 'adam',
        lossFunction: 'crossentropy'
      };

      expect(isValidNeuralConfiguration(complexConfig)).toBe(true);
    });

    test('should handle mixed type inputs', () => {
      const mixedConfig = {
        type: 123, // Should be string
        architecture: "10,5,1", // Should be array
        learningRate: "0.001" // Should be number
      };

      expect(isValidNeuralConfiguration(mixedConfig as any)).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    test('should validate large configurations efficiently', () => {
      const largeConfig = {
        type: 'cnn',
        architecture: new Array(1000).fill(128),
        activationFunction: 'relu',
        learningRate: 0.001
      };

      const startTime = performance.now();
      const isValid = isValidNeuralConfiguration(largeConfig);
      const endTime = performance.now();

      expect(isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should handle repeated validations efficiently', () => {
      const config = {
        type: 'mlp',
        architecture: [10, 5, 1],
        activationFunction: 'tanh'
      };

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        isValidNeuralConfiguration(config);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle 1000 validations in < 100ms
    });
  });

  describe('Type Guards', () => {
    test('should correctly identify valid neural agents', () => {
      const validAgent = {
        id: 'agent-123',
        config: {
          type: 'mlp',
          architecture: [10, 5, 1]
        },
        state: AgentState.ACTIVE,
        createdAt: Date.now(),
        lastActive: Date.now(),
        memoryUsage: 1024,
        totalInferences: 0,
        averageInferenceTime: 0,
        learningProgress: 0,
        connectionStrength: 1.0
      };

      // Test would require implementing isValidNeuralAgent function
      // For now, testing the components we have
      expect(isValidAgentState(validAgent.state)).toBe(true);
      expect(isValidNeuralConfiguration(validAgent.config)).toBe(true);
    });

    test('should handle circular references gracefully', () => {
      const circularConfig: any = {
        type: 'mlp',
        architecture: [10, 5, 1]
      };
      circularConfig.self = circularConfig;

      // Should not cause infinite recursion
      expect(() => isValidNeuralConfiguration(circularConfig)).not.toThrow();
    });

    test('should validate nested configuration objects', () => {
      const nestedConfig = {
        type: 'transformer',
        architecture: [512, 256, 128],
        activationFunction: 'gelu',
        attention: {
          heads: 8,
          dimensions: 64,
          dropout: 0.1
        },
        layers: {
          encoder: 6,
          decoder: 6,
          feedForward: 2048
        }
      };

      expect(isValidNeuralConfiguration(nestedConfig)).toBe(true);
    });
  });

  describe('Custom Type Extensions', () => {
    test('should handle custom network types', () => {
      const customConfig = {
        type: 'custom_gan',
        architecture: [100, 256, 512, 784],
        activationFunction: 'leaky_relu',
        discriminator: {
          architecture: [784, 512, 256, 1],
          activationFunction: 'sigmoid'
        }
      };

      expect(isValidNeuralConfiguration(customConfig)).toBe(true);
    });

    test('should validate experimental activation functions', () => {
      expect(normalizeActivationFunction('swish')).toBe('tanh'); // Falls back to default
      expect(normalizeActivationFunction('mish')).toBe('tanh'); // Falls back to default
      expect(normalizeActivationFunction('gelu')).toBe('tanh'); // Falls back to default
    });

    test('should handle dynamic architecture definitions', () => {
      const dynamicArch = [
        Math.floor(Math.random() * 100) + 1,
        Math.floor(Math.random() * 50) + 1,
        Math.floor(Math.random() * 10) + 1
      ];

      expect(validateNetworkArchitecture(dynamicArch)).toBe(true);
    });
  });
});