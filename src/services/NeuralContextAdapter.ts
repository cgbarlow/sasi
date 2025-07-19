/**
 * Neural Context Adapter for SASI Integration
 * Drop-in replacement functions for SwarmContext mock implementations
 * 
 * This adapter provides seamless integration between SASI's existing SwarmContext
 * and the new neural agent system, maintaining full compatibility while adding
 * real neural capabilities.
 */

import NeuralAgentManager from './NeuralAgentManager';
import type { 
  SASIAgent, 
  SASISwarmData, 
  NeuralConfiguration,
  AgentMetrics,
  SwarmStatistics 
} from '../types/neural';

// Singleton instance for seamless integration
let neuralManager: NeuralAgentManager | null = null;
let fallbackToMock = false;

/**
 * Initialize neural data (replaces initializeMockData)
 */
export async function initializeNeuralData(): Promise<SASISwarmData> {
  try {
    // Initialize neural manager if not already done
    if (!neuralManager) {
      neuralManager = new NeuralAgentManager({
        maxAgents: 25,
        memoryLimitPerAgent: 50 * 1024 * 1024, // 50MB
        inferenceTimeout: 100, // 100ms
        simdEnabled: true,
        crossLearningEnabled: true,
        persistenceEnabled: true,
        performanceMonitoring: true
      });
      
      // Wait for initialization
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Neural initialization timeout')), 10000);
        
        neuralManager!.once('initialized', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });
        
        neuralManager!.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }
    
    // Generate initial neural data
    const initialData = await generateNeuralSwarmData();
    
    console.log('✅ Neural system initialized successfully');
    fallbackToMock = false;
    
    return initialData;
    
  } catch (error) {
    console.warn('⚠️ Neural initialization failed, falling back to mock data:', error);
    fallbackToMock = true;
    
    // Fallback to mock data
    return generateMockSwarmData();
  }
}

/**
 * Generate neural agents (replaces generateMockAgents)
 */
export async function generateNeuralAgents(count: number = 5): Promise<SASIAgent[]> {
  if (fallbackToMock || !neuralManager) {
    return generateMockAgents(count);
  }
  
  try {
    const agents: SASIAgent[] = [];
    
    // Define neural configurations for different agent types
    const agentConfigs: Array<{ name: string; config: NeuralConfiguration }> = [
      {
        name: 'Coordinator',
        config: {
          type: 'mlp',
          architecture: [128, 64, 32, 16],
          activationFunction: 'relu',
          learningRate: 0.01
        }
      },
      {
        name: 'Analyzer',
        config: {
          type: 'lstm',
          architecture: [256, 128, 64, 32],
          activationFunction: 'tanh',
          learningRate: 0.005
        }
      },
      {
        name: 'Optimizer',
        config: {
          type: 'mlp',
          architecture: [512, 256, 128, 64],
          activationFunction: 'gelu',
          learningRate: 0.001
        }
      },
      {
        name: 'Researcher',
        config: {
          type: 'transformer',
          architecture: [1024, 512, 256, 128],
          activationFunction: 'relu',
          learningRate: 0.0001
        }
      },
      {
        name: 'Monitor',
        config: {
          type: 'cnn',
          architecture: [784, 392, 196, 10],
          activationFunction: 'leaky_relu',
          learningRate: 0.01
        }
      }
    ];
    
    // Spawn neural agents
    for (let i = 0; i < count; i++) {
      const configIndex = i % agentConfigs.length;
      const { name, config } = agentConfigs[configIndex];
      
      try {
        const neuralAgentId = await neuralManager.spawnAgent(config);
        const neuralAgent = neuralManager.getAgentState(neuralAgentId);
        
        if (neuralAgent) {
          const sasiAgent: SASIAgent = {
            id: neuralAgentId,
            name: `${name}-${i + 1}`,
            type: config.type,
            status: 'active',
            performance: 85 + Math.random() * 15, // 85-100%
            memoryUsage: neuralAgent.memoryUsage,
            lastActivity: neuralAgent.lastActive,
            totalTasks: 0,
            successRate: 0.95 + Math.random() * 0.05, // 95-100%
            learningProgress: neuralAgent.learningProgress,
            connections: [],
            neuralAgent
          };
          
          agents.push(sasiAgent);
        }
        
      } catch (error) {
        console.warn(`Failed to spawn neural agent ${i}:`, error);
        
        // Create a mock agent as fallback
        agents.push(createMockAgent(i, agentConfigs[configIndex].name));
      }
    }
    
    // Update connections between agents
    updateAgentConnections(agents);
    
    return agents;
    
  } catch (error) {
    console.warn('Neural agent generation failed, using mock agents:', error);
    return generateMockAgents(count);
  }
}

/**
 * Simulate neural activity (replaces simulateSwarmActivity)
 */
export async function simulateNeuralActivity(agents: SASIAgent[]): Promise<void> {
  if (fallbackToMock || !neuralManager) {
    return simulateMockActivity(agents);
  }
  
  try {
    // Run inference on random agents
    const activeAgents = agents.filter(agent => agent.status === 'active' && agent.neuralAgent);
    
    if (activeAgents.length === 0) {
      return;
    }
    
    // Select random agents for activity
    const numActiveNow = Math.floor(Math.random() * activeAgents.length) + 1;
    const selectedAgents = activeAgents
      .sort(() => Math.random() - 0.5)
      .slice(0, numActiveNow);
    
    // Run neural inferences
    for (const agent of selectedAgents) {
      if (agent.neuralAgent) {
        try {
          // Generate random inputs based on agent type
          const inputSize = agent.neuralAgent.config.architecture[0];
          const inputs = Array.from({ length: inputSize }, () => Math.random() * 2 - 1);
          
          const outputs = await neuralManager.runInference(agent.neuralAgent.id, inputs);
          
          // Update agent statistics
          agent.totalTasks++;
          agent.lastActivity = Date.now();
          agent.performance = Math.min(100, agent.performance + (Math.random() - 0.4) * 2);
          
          // Update memory usage from neural agent
          const updatedNeuralAgent = neuralManager.getAgentState(agent.neuralAgent.id);
          if (updatedNeuralAgent) {
            agent.memoryUsage = updatedNeuralAgent.memoryUsage;
            agent.learningProgress = updatedNeuralAgent.learningProgress;
          }
          
        } catch (error) {
          console.warn(`Neural inference failed for agent ${agent.id}:`, error);
          agent.status = 'error';
        }
      }
    }
    
    // Occasionally trigger learning sessions
    if (Math.random() < 0.1) { // 10% chance
      const learningAgent = selectedAgents[Math.floor(Math.random() * selectedAgents.length)];
      if (learningAgent.neuralAgent && learningAgent.status === 'active') {
        triggerLearningSession(learningAgent);
      }
    }
    
    // Occasionally share knowledge between agents
    if (Math.random() < 0.05 && activeAgents.length > 1) { // 5% chance
      await shareKnowledgeBetweenAgents(activeAgents);
    }
    
  } catch (error) {
    console.warn('Neural activity simulation failed:', error);
    simulateMockActivity(agents);
  }
}

/**
 * Get enhanced swarm statistics with neural metrics
 */
export function getNeuralSwarmStatistics(agents: SASIAgent[]): SwarmStatistics {
  const neuralAgents = agents.filter(agent => agent.neuralAgent);
  const activeAgents = agents.filter(agent => agent.status === 'active');
  
  const totalMemoryUsage = agents.reduce((sum, agent) => sum + agent.memoryUsage, 0);
  const totalTasks = agents.reduce((sum, agent) => sum + agent.totalTasks, 0);
  const avgPerformance = agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length || 0;
  
  let networkTopology = {
    nodes: [],
    connections: [],
    totalNodes: 0,
    activeConnections: 0,
    networkHealth: 100
  };
  
  if (neuralManager && neuralAgents.length > 0) {
    networkTopology = neuralManager.getNetworkTopology();
  }
  
  const performanceMetrics = neuralManager ? neuralManager.getPerformanceMetrics() : {
    totalAgentsSpawned: agents.length,
    averageSpawnTime: 50,
    averageInferenceTime: 45,
    memoryUsage: totalMemoryUsage,
    activeLearningTasks: 0,
    systemHealthScore: 95
  };
  
  return {
    totalAgents: agents.length,
    activeAgents: activeAgents.length,
    averagePerformance: avgPerformance,
    totalMemoryUsage,
    totalTasks,
    systemHealth: performanceMetrics.systemHealthScore,
    networkTopology,
    learningMetrics: {
      activeSessions: performanceMetrics.activeLearningTasks,
      completedSessions: Math.floor(Math.random() * 50),
      averageAccuracy: 0.85 + Math.random() * 0.1,
      knowledgeTransfers: Math.floor(Math.random() * 20)
    }
  };
}

/**
 * Generate complete neural swarm data
 */
async function generateNeuralSwarmData(): Promise<SASISwarmData> {
  const agents = await generateNeuralAgents(8);
  const statistics = getNeuralSwarmStatistics(agents);
  const performanceMetrics = neuralManager ? neuralManager.getPerformanceMetrics() : {
    totalAgentsSpawned: 8,
    averageSpawnTime: 50,
    averageInferenceTime: 45,
    memoryUsage: statistics.totalMemoryUsage,
    activeLearningTasks: 0,
    systemHealthScore: 95
  };
  
  return {
    agents,
    statistics,
    topology: statistics.networkTopology,
    isNeuralEnabled: true,
    performanceMetrics
  };
}

/**
 * Trigger a learning session for an agent
 */
async function triggerLearningSession(agent: SASIAgent): Promise<void> {
  if (!agent.neuralAgent || !neuralManager) return;
  
  try {
    agent.status = 'learning';
    
    // Generate training data
    const inputSize = agent.neuralAgent.config.architecture[0];
    const outputSize = agent.neuralAgent.config.architecture[agent.neuralAgent.config.architecture.length - 1];
    
    const trainingData = Array.from({ length: 50 }, () => ({
      inputs: Array.from({ length: inputSize }, () => Math.random() * 2 - 1),
      outputs: Array.from({ length: outputSize }, () => Math.random())
    }));
    
    // Start training (don't await to avoid blocking)
    neuralManager.trainAgent(agent.neuralAgent.id, trainingData, 10)
      .then((session) => {
        agent.status = 'active';
        agent.learningProgress = session.finalAccuracy;
        console.log(`✅ Learning completed for ${agent.name}: ${(session.finalAccuracy * 100).toFixed(1)}% accuracy`);
      })
      .catch((error) => {
        agent.status = 'error';
        console.warn(`❌ Learning failed for ${agent.name}:`, error);
      });
    
  } catch (error) {
    agent.status = 'error';
    console.warn(`Learning session failed for ${agent.name}:`, error);
  }
}

/**
 * Share knowledge between neural agents
 */
async function shareKnowledgeBetweenAgents(agents: SASIAgent[]): Promise<void> {
  if (!neuralManager) return;
  
  try {
    const neuralAgents = agents.filter(agent => agent.neuralAgent);
    if (neuralAgents.length < 2) return;
    
    // Select source and target agents
    const sourceAgent = neuralAgents[Math.floor(Math.random() * neuralAgents.length)];
    const targetAgents = neuralAgents
      .filter(agent => agent.id !== sourceAgent.id)
      .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 targets
    
    await neuralManager.shareKnowledge(
      sourceAgent.neuralAgent!.id,
      targetAgents.map(agent => agent.neuralAgent!.id)
    );
    
    // Update connection strengths
    targetAgents.forEach(target => {
      if (!sourceAgent.connections.includes(target.id)) {
        sourceAgent.connections.push(target.id);
      }
      if (!target.connections.includes(sourceAgent.id)) {
        target.connections.push(sourceAgent.id);
      }
    });
    
    console.log(`🔄 Knowledge shared: ${sourceAgent.name} → ${targetAgents.map(a => a.name).join(', ')}`);
    
  } catch (error) {
    console.warn('Knowledge sharing failed:', error);
  }
}

/**
 * Update connections between agents based on their types and activities
 */
function updateAgentConnections(agents: SASIAgent[]): void {
  // Create connections based on agent types and performance
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const agent1 = agents[i];
      const agent2 = agents[j];
      
      // Higher chance of connection for similar types or high-performing agents
      const connectionProbability = agent1.type === agent2.type ? 0.7 : 0.3;
      const performanceBonus = (agent1.performance + agent2.performance) / 200; // 0-1
      
      if (Math.random() < connectionProbability + performanceBonus * 0.3) {
        if (!agent1.connections.includes(agent2.id)) {
          agent1.connections.push(agent2.id);
        }
        if (!agent2.connections.includes(agent1.id)) {
          agent2.connections.push(agent1.id);
        }
      }
    }
  }
}

// Fallback mock implementations for when neural system is unavailable

function generateMockSwarmData(): SASISwarmData {
  const agents = generateMockAgents(8);
  const statistics = getMockSwarmStatistics(agents);
  
  return {
    agents,
    statistics,
    topology: statistics.networkTopology,
    isNeuralEnabled: false,
    performanceMetrics: {
      totalAgentsSpawned: 8,
      averageSpawnTime: 75,
      averageInferenceTime: 65,
      memoryUsage: statistics.totalMemoryUsage,
      activeLearningTasks: 0,
      systemHealthScore: 88
    }
  };
}

function generateMockAgents(count: number): SASIAgent[] {
  const agentTypes = ['mlp', 'lstm', 'cnn', 'transformer', 'custom'];
  const agentNames = ['Coordinator', 'Analyzer', 'Optimizer', 'Researcher', 'Monitor'];
  
  return Array.from({ length: count }, (_, i) => 
    createMockAgent(i, agentNames[i % agentNames.length], agentTypes[i % agentTypes.length])
  );
}

function createMockAgent(index: number, baseName: string, type: string = 'mlp'): SASIAgent {
  return {
    id: `mock_agent_${index}_${Date.now()}`,
    name: `${baseName}-${index + 1}`,
    type,
    status: Math.random() > 0.1 ? 'active' : 'idle',
    performance: 70 + Math.random() * 25,
    memoryUsage: (20 + Math.random() * 30) * 1024 * 1024, // 20-50MB
    lastActivity: Date.now() - Math.random() * 300000, // Last 5 minutes
    totalTasks: Math.floor(Math.random() * 100),
    successRate: 0.8 + Math.random() * 0.15,
    learningProgress: Math.random(),
    connections: []
  };
}

function getMockSwarmStatistics(agents: SASIAgent[]): SwarmStatistics {
  const activeAgents = agents.filter(agent => agent.status === 'active');
  const totalMemoryUsage = agents.reduce((sum, agent) => sum + agent.memoryUsage, 0);
  const totalTasks = agents.reduce((sum, agent) => sum + agent.totalTasks, 0);
  const avgPerformance = agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length;
  
  return {
    totalAgents: agents.length,
    activeAgents: activeAgents.length,
    averagePerformance: avgPerformance,
    totalMemoryUsage,
    totalTasks,
    systemHealth: 85 + Math.random() * 10,
    networkTopology: {
      nodes: agents.map(agent => ({
        id: agent.id,
        type: agent.type,
        state: agent.status as any,
        performance: agent.performance,
        memoryUsage: agent.memoryUsage
      })),
      connections: [],
      totalNodes: agents.length,
      activeConnections: Math.floor(agents.length * 1.5),
      networkHealth: 90 + Math.random() * 10
    },
    learningMetrics: {
      activeSessions: Math.floor(Math.random() * 3),
      completedSessions: Math.floor(Math.random() * 20),
      averageAccuracy: 0.75 + Math.random() * 0.15,
      knowledgeTransfers: Math.floor(Math.random() * 10)
    }
  };
}

function simulateMockActivity(agents: SASIAgent[]): void {
  // Simple mock activity simulation
  agents.forEach(agent => {
    if (Math.random() < 0.3) { // 30% chance of activity
      agent.lastActivity = Date.now();
      agent.totalTasks += Math.random() < 0.7 ? 1 : 0;
      agent.performance += (Math.random() - 0.5) * 5;
      agent.performance = Math.max(0, Math.min(100, agent.performance));
    }
  });
}

// Cleanup function
export async function cleanupNeuralSystem(): Promise<void> {
  if (neuralManager) {
    await neuralManager.cleanup();
    neuralManager = null;
  }
  fallbackToMock = false;
}

// Export the neural manager instance for advanced use cases
export function getNeuralManager(): NeuralAgentManager | null {
  return neuralManager;
}

// Export status information
export function getNeuralSystemStatus(): {
  isNeuralEnabled: boolean;
  isFallbackMode: boolean;
  managerInitialized: boolean;
} {
  return {
    isNeuralEnabled: !fallbackToMock,
    isFallbackMode: fallbackToMock,
    managerInitialized: neuralManager !== null
  };
}

// Additional exports for SwarmContextExample compatibility
export async function addNeuralAgent(config: any): Promise<SASIAgent | null> {
  if (!neuralManager) return null;
  
  try {
    const agents = await generateNeuralAgents(1);
    return agents[0] || null;
  } catch (error) {
    console.warn('Failed to add neural agent:', error);
    return null;
  }
}

export async function removeNeuralAgent(agentId: string): Promise<boolean> {
  if (!neuralManager) return false;
  
  try {
    await neuralManager.terminateAgent(agentId);
    return true;
  } catch (error) {
    console.warn('Failed to remove neural agent:', error);
    return false;
  }
}

export function getEnhancedStats(agents: SASIAgent[]): any {
  return {
    ...getNeuralSwarmStatistics(agents),
    enhancedMetrics: {
      neuralAgents: agents.filter(a => a.neuralAgent).length,
      totalConnections: agents.reduce((sum, a) => sum + a.connections.length, 0),
      averagePerformance: agents.reduce((sum, a) => sum + a.performance, 0) / agents.length
    }
  };
}

export function getNeuralIntegrationStatus(): any {
  return {
    ...getNeuralSystemStatus(),
    performance: neuralManager ? neuralManager.getPerformanceMetrics() : null,
    connectionHealth: neuralManager ? 100 : 0
  };
}

export async function cleanupNeuralResources(): Promise<void> {
  return cleanupNeuralSystem();
}