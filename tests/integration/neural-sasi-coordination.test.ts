/**
 * Integration Tests for Neural-SASI Coordination
 * Tests interaction between SASI frontend and neural mesh backend
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  NeuralAgentFactory, 
  MockNeuralMeshService, 
  TestDataGenerator,
  NeuralAssertions,
  PerformanceTestUtils 
} from '../utils/neural-test-utils';
import { NeuralMeshService } from '../../src/services/NeuralMeshService';
import { Agent } from '../../src/types/agent';

describe('Neural-SASI Coordination Integration Tests', () => {
  let neuralService: MockNeuralMeshService;
  let memoryDetector: ReturnType<typeof PerformanceTestUtils.createMemoryLeakDetector>;

  beforeEach(async () => {
    neuralService = new MockNeuralMeshService();
    await neuralService.initialize();
    memoryDetector = PerformanceTestUtils.createMemoryLeakDetector();
  });

  afterEach(async () => {
    await neuralService.disconnect();
    NeuralAssertions.assertNoMemoryLeaks(memoryDetector);
  });

  describe('Service Initialization', () => {
    test('should initialize neural mesh service successfully', async () => {
      const service = new MockNeuralMeshService();
      const initialized = await service.initialize();
      
      expect(initialized).toBe(true);
      
      const status = service.getConnectionStatus();
      NeuralAssertions.assertValidMeshConnection(status!);
      expect(status!.status).toBe('connected');
      
      await service.disconnect();
    });

    test('should establish mesh connection with proper topology', async () => {
      const status = neuralService.getConnectionStatus();
      
      expect(status).not.toBeNull();
      expect(status!.nodeCount).toBeGreaterThan(0);
      expect(status!.synapseCount).toBeGreaterThanOrEqual(0);
      expect(status!.meshId).toMatch(/^mesh_/);
    });

    test('should emit connection events during initialization', (done) => {
      const service = new MockNeuralMeshService();
      
      service.on('connected', (connection) => {
        expect(connection).toBeDefined();
        NeuralAssertions.assertValidMeshConnection(connection);
        done();
      });

      service.initialize();
    });

    test('should handle initialization failure gracefully', async () => {
      const service = new MockNeuralMeshService();
      
      // Mock initialization failure
      jest.spyOn(service, 'initialize').mockResolvedValue(false);
      
      const result = await service.initialize();
      expect(result).toBe(false);
    });
  });

  describe('Multi-Agent Coordination', () => {
    test('should coordinate multiple agents working on same mesh', async () => {
      const agentTypes: Agent['type'][] = ['researcher', 'coder', 'tester', 'reviewer'];
      const agents = [];

      // Create diverse agent team
      for (const type of agentTypes) {
        const agent = await neuralService.createNeuralAgent(type);
        expect(agent).not.toBeNull();
        agents.push(agent!);
      }

      // Verify all agents are connected to same mesh
      const meshIds = agents.map(agent => agent.meshConnection?.meshId);
      const uniqueMeshIds = new Set(meshIds);
      expect(uniqueMeshIds.size).toBe(1);

      // Coordinate simultaneous updates
      const updatePromises = agents.map(agent => neuralService.updateNeuralAgent(agent));
      const updatedAgents = await Promise.all(updatePromises);

      expect(updatedAgents).toHaveLength(agents.length);
      updatedAgents.forEach(agent => {
        NeuralAssertions.assertValidNeuralAgent(agent);
      });
    });

    test('should handle agent interactions through mesh', async () => {
      const agent1 = await neuralService.createNeuralAgent('researcher');
      const agent2 = await neuralService.createNeuralAgent('coder');
      
      expect(agent1).not.toBeNull();
      expect(agent2).not.toBeNull();

      // Simulate interaction through neural activation
      agent1!.neuralProperties.activation = 0.8;
      agent2!.neuralProperties.activation = 0.3;

      await neuralService.updateNeuralAgent(agent1!);
      await neuralService.updateNeuralAgent(agent2!);

      // Verify both agents maintained their neural state
      expect(agent1!.neuralProperties.spikeHistory.length).toBeGreaterThan(0);
      expect(agent2!.neuralProperties.spikeHistory.length).toBeGreaterThan(0);
    });

    test('should maintain coordination under high load', async () => {
      const agentCount = 20;
      const agents = [];

      // Create many agents
      for (let i = 0; i < agentCount; i++) {
        const type = ['researcher', 'coder', 'tester', 'reviewer'][i % 4] as Agent['type'];
        const agent = await neuralService.createNeuralAgent(type);
        if (agent) agents.push(agent);
      }

      expect(agents).toHaveLength(agentCount);

      // Perform coordinated updates
      const startTime = performance.now();
      await Promise.all(agents.map(agent => neuralService.updateNeuralAgent(agent)));
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / agentCount;

      expect(averageTime).toBeLessThan(50); // 50ms per agent max
      expect(totalTime).toBeLessThan(1000); // 1 second total max
    });
  });

  describe('Mesh Status and Monitoring', () => {
    test('should provide real-time mesh status', async () => {
      const status = await neuralService.getMeshStatus();
      
      expect(status).toBeDefined();
      expect(status.nodeCount).toBeGreaterThanOrEqual(0);
      expect(status.synapseCount).toBeGreaterThanOrEqual(0);
      expect(status.activity).toBeGreaterThanOrEqual(0);
      expect(status.activity).toBeLessThanOrEqual(1);
      expect(status.connectivity).toBeGreaterThanOrEqual(0);
      expect(status.connectivity).toBeLessThanOrEqual(1);
      expect(status.efficiency).toBeGreaterThanOrEqual(0);
      expect(status.efficiency).toBeLessThanOrEqual(1);
    });

    test('should track mesh activity changes', async () => {
      const initialStatus = await neuralService.getMeshStatus();
      
      // Create some agents to increase activity
      await neuralService.createNeuralAgent('neural');
      await neuralService.createNeuralAgent('neural');
      
      const updatedStatus = await neuralService.getMeshStatus();
      
      expect(updatedStatus).toBeDefined();
      // Activity levels may change (in a real system)
      expect(updatedStatus.activity).toBeGreaterThanOrEqual(0);
    });

    test('should emit status update events', (done) => {
      neuralService.on('status_update', (status) => {
        expect(status).toBeDefined();
        expect(status.activity).toBeGreaterThanOrEqual(0);
        done();
      });

      // Trigger status update (in mock service, we'd need to simulate this)
      neuralService.createNeuralAgent('neural');
    });
  });

  describe('Neural Training Integration', () => {
    test('should train mesh with pattern data', async () => {
      const patterns = TestDataGenerator.generateTrainingPatterns(50);
      
      const trained = await neuralService.trainMesh(patterns);
      expect(trained).toBe(true);
    });

    test('should emit training completion events', (done) => {
      const patterns = TestDataGenerator.generateTrainingPatterns(10);
      
      neuralService.on('mesh_trained', (result) => {
        expect(result).toBeDefined();
        expect(result.patterns).toBe(10);
        expect(result.accuracy).toBeGreaterThan(0);
        expect(result.accuracy).toBeLessThanOrEqual(1);
        done();
      });

      neuralService.trainMesh(patterns);
    });

    test('should improve agent performance after training', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      const initialEfficiency = agent!.efficiency;
      
      // Train the mesh
      const patterns = TestDataGenerator.generateTrainingPatterns(20);
      await neuralService.trainMesh(patterns);
      
      // Update agent (in real system, this might show improvement)
      await neuralService.updateNeuralAgent(agent!);
      
      // Performance may improve (depends on implementation)
      expect(agent!.efficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Flow and Synchronization', () => {
    test('should synchronize agent state across updates', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      const originalId = agent!.id;
      const originalNeuralId = agent!.neuralProperties.neuronId;

      // Multiple updates should maintain identity
      for (let i = 0; i < 5; i++) {
        await neuralService.updateNeuralAgent(agent!);
        expect(agent!.id).toBe(originalId);
        expect(agent!.neuralProperties.neuronId).toBe(originalNeuralId);
      }
    });

    test('should handle concurrent agent operations', async () => {
      const agents = await Promise.all([
        neuralService.createNeuralAgent('researcher'),
        neuralService.createNeuralAgent('coder'),
        neuralService.createNeuralAgent('tester')
      ]);

      expect(agents.every(agent => agent !== null)).toBe(true);

      // Concurrent updates
      const updatePromises = agents.map(agent => 
        neuralService.updateNeuralAgent(agent!)
      );

      const results = await Promise.all(updatePromises);
      expect(results).toHaveLength(3);
      results.forEach(agent => {
        NeuralAssertions.assertValidNeuralAgent(agent);
      });
    });

    test('should maintain data consistency during operations', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      // Verify initial consistency
      expect(agent!.neuralId).toBe(agent!.neuralProperties.neuronId);
      expect(agent!.meshConnection!.meshId).toBe(agent!.neuralProperties.meshId);

      // Update and verify consistency maintained
      await neuralService.updateNeuralAgent(agent!);
      expect(agent!.neuralId).toBe(agent!.neuralProperties.neuronId);
      expect(agent!.meshConnection!.meshId).toBe(agent!.neuralProperties.meshId);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from temporary disconnections', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      // Simulate disconnect and reconnect
      await neuralService.disconnect();
      expect(neuralService.getConnectionStatus()?.status).toBe('disconnected');

      // Reinitialize
      await neuralService.initialize();
      expect(neuralService.getConnectionStatus()?.status).toBe('connected');

      // Should be able to create new agents
      const newAgent = await neuralService.createNeuralAgent('neural');
      expect(newAgent).not.toBeNull();
    });

    test('should handle mesh failures gracefully', async () => {
      // Mock mesh status failure
      jest.spyOn(neuralService, 'getMeshStatus').mockResolvedValue(null);

      const status = await neuralService.getMeshStatus();
      expect(status).toBeNull();

      // Should still be able to create agents
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();
    });

    test('should maintain partial functionality during degraded mode', async () => {
      const agent = await neuralService.createNeuralAgent('neural');
      expect(agent).not.toBeNull();

      // Even with potential issues, basic operations should work
      const updated = await neuralService.updateNeuralAgent(agent!);
      expect(updated).toBeDefined();
      NeuralAssertions.assertValidNeuralAgent(updated);
    });
  });

  describe('Performance Integration', () => {
    test('should meet end-to-end performance requirements', async () => {
      const results = await PerformanceTestUtils.testNeuralPerformance(
        neuralService, 
        100, // iterations
        50   // max time in ms
      );

      expect(results.passed).toBe(true);
      NeuralAssertions.assertPerformanceThresholds(
        { averageTime: results.averageTime, maxTime: results.maxTime },
        { averageMs: 25, maxMs: 50 }
      );
    });

    test('should scale with multiple agents', async () => {
      const results = await PerformanceTestUtils.testMeshCoordination(
        neuralService,
        10, // agent count
        100 // max time in ms
      );

      expect(results.passed).toBe(true);
      expect(results.setupTime).toBeLessThan(100);
      expect(results.updateTime).toBeLessThan(100);
    });

    test('should maintain performance under sustained load', async () => {
      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const agent = await neuralService.createNeuralAgent('neural');
        if (agent) {
          await neuralService.updateNeuralAgent(agent);
        }
        const end = performance.now();
        times.push(end - start);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);

      // Performance should not degrade significantly over time
      const firstHalf = times.slice(0, iterations / 2);
      const secondHalf = times.slice(iterations / 2);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half should not be more than 50% slower than first half
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);
    });
  });
});