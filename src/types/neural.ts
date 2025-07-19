/**
 * Neural Agent Type Definitions for SASI Integration
 * Comprehensive TypeScript interfaces for neural agent system
 */

export enum AgentState {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  LEARNING = 'learning',
  IDLE = 'idle',
  TERMINATING = 'terminating',
  ERROR = 'error'
}

export interface NeuralConfiguration {
  type: 'mlp' | 'lstm' | 'cnn' | 'transformer' | 'custom';
  architecture: number[]; // Layer sizes [input, hidden1, hidden2, ..., output]
  activationFunction?: 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu' | 'gelu';
  learningRate?: number;
  momentum?: number;
  regularization?: {
    type: 'l1' | 'l2' | 'dropout';
    value: number;
  };
  simdOptimized?: boolean;
  customConfig?: Record<string, any>;
}

export interface NeuralAgent {
  id: string;
  config: NeuralConfiguration;
  network: any; // WASM network instance
  state: AgentState;
  createdAt: number;
  lastActive: number;
  memoryUsage: number; // bytes
  totalInferences: number;
  averageInferenceTime: number; // ms
  learningProgress: number; // 0-1
  connectionStrength: number; // 0-1
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  totalAgentsSpawned: number;
  averageSpawnTime: number; // ms
  averageInferenceTime: number; // ms
  memoryUsage: number; // bytes
  activeLearningTasks: number;
  systemHealthScore: number; // 0-100
}

export interface LearningSession {
  sessionId: string;
  agentId: string;
  startTime: number;
  duration: number;
  epochs: number;
  finalAccuracy: number;
  dataPoints: number;
  convergenceEpoch: number;
}

export interface NetworkTopology {
  nodes: Array<{
    id: string;
    type: string;
    state: AgentState;
    performance: number;
    memoryUsage: number;
  }>;
  connections: Array<[string, string, number]>; // [from, to, strength]
  totalNodes: number;
  activeConnections: number;
  networkHealth: number; // 0-100
}

export interface AgentMetrics {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'learning' | 'error';
  performance: number;
  memoryUsage: number;
  lastActivity: number;
  totalTasks: number;
  successRate: number;
  learningProgress: number;
  connections: string[];
}

export interface SwarmStatistics {
  totalAgents: number;
  activeAgents: number;
  averagePerformance: number;
  totalMemoryUsage: number;
  totalTasks: number;
  systemHealth: number;
  networkTopology: NetworkTopology;
  learningMetrics: {
    activeSessions: number;
    completedSessions: number;
    averageAccuracy: number;
    knowledgeTransfers: number;
  };
}

// SASI Integration Types

export interface SASIAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'learning' | 'error';
  performance: number;
  memoryUsage: number;
  lastActivity: number;
  totalTasks: number;
  successRate: number;
  learningProgress: number;
  connections: string[];
  neuralAgent?: NeuralAgent; // Optional neural backing
}

export interface SASISwarmData {
  agents: SASIAgent[];
  statistics: SwarmStatistics;
  topology: NetworkTopology;
  isNeuralEnabled: boolean;
  performanceMetrics: PerformanceMetrics;
}

// Performance Integration Types

export interface PerformanceTarget {
  agentSpawnTime: number; // ms
  inferenceTime: number; // ms  
  memoryPerAgent: number; // bytes
  wasmOperationTime: number; // ms
}

export interface PerformanceAlert {
  type: 'spawn_time' | 'inference_time' | 'memory_usage' | 'system_health' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  agentId?: string;
}

export interface PerformanceReport {
  timestamp: number;
  targets: PerformanceTarget;
  current: {
    averageSpawnTime: number;
    averageInferenceTime: number;
    memoryUsage: number;
    wasmOperationTime: number;
  };
  alerts: PerformanceAlert[];
  healthScore: number;
  recommendations: string[];
}

// WASM Integration Types

export interface WASMModule {
  createNeuralNetwork(config: NeuralConfiguration): Promise<any>;
  runInference(network: any, inputs: number[]): Promise<number[]>;
  trainNetwork(network: any, data: TrainingData[], epochs: number): Promise<TrainingResult>;
  serializeWeights(network: any): Promise<ArrayBuffer>;
  deserializeWeights(network: any, weights: ArrayBuffer, influence?: number): Promise<void>;
  getMemoryUsage(): number;
  enableSIMD: boolean;
  destroyNetwork?(network: any): void;
}

export interface TrainingData {
  inputs: number[];
  outputs: number[];
}

export interface TrainingResult {
  accuracy: number;
  loss: number;
  convergenceEpoch?: number;
  trainingTime: number;
}

// Database Types

export interface AgentStateRecord {
  agentId: string;
  state: AgentState;
  config: NeuralConfiguration;
  createdAt: number;
  lastActive: number;
  metadata: string; // JSON
}

export interface WeightsRecord {
  agentId: string;
  weights: ArrayBuffer;
  savedAt: number;
  checksum: string;
}

export interface LearningRecord {
  sessionId: string;
  agentId: string;
  startTime: number;
  duration: number;
  accuracy: number;
  metadata: string; // JSON
}

// Event Types

export interface AgentEventData {
  agentId: string;
  timestamp: number;
  [key: string]: any;
}

export interface AgentSpawnedEvent extends AgentEventData {
  spawnTime: number;
  config: NeuralConfiguration;
  memoryUsage: number;
}

export interface InferenceCompleteEvent extends AgentEventData {
  inferenceTime: number;
  inputSize: number;
  outputSize: number;
}

export interface LearningCompleteEvent extends AgentEventData {
  sessionId: string;
  duration: number;
  finalAccuracy: number;
  epochs: number;
}

export interface AgentTerminatedEvent extends AgentEventData {
  reason?: string;
}

export interface KnowledgeSharedEvent extends AgentEventData {
  sourceAgentId: string;
  targetAgentIds: string[];
}

// Configuration Types

export interface NeuralSystemConfig {
  manager: {
    maxAgents: number;
    memoryLimitPerAgent: number;
    inferenceTimeout: number;
    simdEnabled: boolean;
    crossLearningEnabled: boolean;
    persistenceEnabled: boolean;
    performanceMonitoring: boolean;
  };
  performance: {
    targets: PerformanceTarget;
    alertThresholds: Record<string, number>;
    monitoringInterval: number;
  };
  wasm: {
    modulePath: string;
    simdVariant: boolean;
    memorySize: number;
  };
  database: {
    enabled: boolean;
    path: string;
    backupInterval: number;
  };
}

// Utility Types

export type AgentID = string;
export type NetworkID = string;
export type SessionID = string;

export interface PartialNeuralAgent extends Partial<NeuralAgent> {
  id: string;
}

export interface PartialSASIAgent extends Partial<SASIAgent> {
  id: string;
  name: string;
}

// Error Types

export class NeuralAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NeuralAgentError';
  }
}

export class WASMError extends Error {
  constructor(
    message: string,
    public operation: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WASMError';
  }
}

export class PerformanceError extends Error {
  constructor(
    message: string,
    public metric: string,
    public value: number,
    public threshold: number
  ) {
    super(message);
    this.name = 'PerformanceError';
  }
}

// WASM Performance Metrics Type (exported for compatibility)
export interface WasmPerformanceMetrics {
  executionTime: number
  memoryUsage: number
  simdAcceleration: boolean
  throughput: number
  efficiency: number
  loadTime?: number
  operationsCount?: number
  averageOperationTime?: number
}

// Neural Bridge Health Type (exported for monitoring services)
export interface NeuralBridgeHealth {
  status: 'healthy' | 'warning' | 'critical' | 'error'
  moduleLoaded: boolean
  ruvFannIntegration: boolean
  wasmInitialized: boolean
  simdSupported: boolean
  performanceMetrics: WasmPerformanceMetrics
  systemMetrics: SystemHealthMetrics
  activeAlerts: ExtendedPerformanceAlert[]
  lastHealthCheck: Date
  uptime: number
}

// Additional missing types for PerformanceIntegration

export interface NeuralPerformanceSnapshot {
  timestamp: number;
  agentId: string;
  spawnTime: number;
  inferenceTime: number;
  memoryUsage: number;
  systemHealth: number;
  cpuUsage: number;
  neuralActivity: number;
  totalNeurons: number;
  totalSynapses: number;
  meshConnectivity: number;
  wasmAcceleration: boolean;
  accuracy?: number;
  performance?: number;
  latency?: number;
  memory?: number;
}

export interface ComponentScores {
  neural: number;
  memory: number;
  performance: number;
  network: number;
  wasm: number;
}

export interface SystemHealthMetrics {
  overallScore: number;
  componentScores: ComponentScores;
  activeAlerts: any[];
  recommendations: string[];
  uptime: number;
  lastCheck: Date;
}

// Extended PerformanceAlert interface with missing properties
export interface ExtendedPerformanceAlert extends PerformanceAlert {
  id: string;
  acknowledged: boolean;
  resolvedAt?: number;
  details?: any;
}

// Enhanced NeuralAgent interface with required properties
export interface EnhancedNeuralAgent extends NeuralAgent {
  neuralProperties: {
    neuronId: string;
    meshId: string;
    nodeType: 'sensory' | 'motor' | 'inter' | 'pyramidal' | 'purkinje';
    layer: number;
    threshold: number;
    activation: number;
    connections: string[];
    spikeHistory: number[];
    lastSpike?: Date;
  };
  type: 'researcher' | 'coder' | 'tester' | 'reviewer' | 'debugger' | 'neural' | 'synaptic' | 'worker';
  capabilities: string[];
  realtime?: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
  };
}

// Extended PerformanceMetrics interface
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  totalAgents: number;
  activeAgents: number;
  systemHealth: number;
  totalNeurons: number;
  totalSynapses: number;
  meshConnectivity: number;
  neuralActivity: number;
  wasmAcceleration: boolean;
  avgInferenceTime?: number; // Alternative to averageInferenceTime
}

// NeuralAgentManagerConfig interface
export interface NeuralAgentManagerConfig {
  maxAgents: number;
  memoryLimitPerAgent: number;
  performanceMonitoring: boolean;
  simdEnabled: boolean;
  crossLearningEnabled: boolean;
  persistenceEnabled: boolean;
  inferenceTimeout: number;
}

// Timer type for Node.js compatibility
export type NodeTimer = ReturnType<typeof setTimeout>;

// Types are already exported above as interfaces and classes;