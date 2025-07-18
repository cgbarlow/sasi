export interface Agent {
  id: string
  name: string
  type: 'researcher' | 'coder' | 'tester' | 'reviewer' | 'debugger' | 'neural' | 'synaptic'
  status: 'active' | 'idle' | 'processing' | 'completed' | 'neural_sync'
  currentTask: string
  repository: string
  branch: string
  completedTasks: number
  efficiency: number
  progress: number
  position: { x: number; y: number; z: number }
  owner: string
  neuralId?: string
  meshConnection?: {
    connected: boolean
    meshId: string
    nodeType: string
    layer: number
    synapses: number
    activation: number
    lastSpike: Date
  }
  realtime?: {
    cpuUsage: number
    memoryUsage: number
    networkLatency: number
    wasmPerformance: number
  }
}

// Phase 2A Persistence Types

export type AgentType = 'researcher' | 'coder' | 'analyst' | 'optimizer' | 'coordinator';

export type CognitivePattern = 'convergent' | 'divergent' | 'lateral' | 'systems' | 'critical' | 'adaptive';

export type AgentState = 'spawning' | 'active' | 'idle' | 'learning' | 'persisted' | 'terminating' | 'terminated' | 'error';

export interface AgentConfig {
  id: string;
  type: AgentType;
  cognitivePattern: CognitivePattern;
  networkLayers: number[];
  learningRate?: number;
  momentum?: number;
  status: AgentState;
  createdAt: number;
  lastActive: number;
  memoryUsageMB?: number;
  performanceScore?: number;
  spawnTimeMs?: number | null;
  configJson?: string;
  metadataJson?: string;
}

export interface AgentMetric {
  id?: number;
  agentId: string;
  metricType: 'spawn_time' | 'inference_time' | 'memory_usage' | 'cpu_usage' | 'accuracy' | 'throughput';
  value: number;
  unit: 'ms' | 'mb' | 'percent' | 'count' | 'requests_per_second';
  recordedAt: number;
  context?: Record<string, any>;
}

export interface AgentMemoryEntry {
  id?: number;
  agentId: string;
  memoryType: 'episodic' | 'semantic' | 'procedural' | 'working';
  key: string;
  valueData: Buffer;
  importanceScore?: number;
  accessCount?: number;
  createdAt: number;
  lastAccessed: number;
  ttlExpires?: number | null;
}

export interface SessionState {
  id: string;
  swarmTopology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  activeAgents: string[];
  coordinationState: Buffer;
  createdAt: number;
  lastCheckpoint: number;
  isActive: boolean;
}

export interface NeuralWeightRecord {
  agentId: string;
  layerIndex: number;
  weightData: Buffer;
  biasData: Buffer;
  updatedAt: number;
  checksum: string;
  compressionType: 'gzip' | 'lz4' | 'none';
}

export interface DatabaseConnectionConfig {
  path: string;
  timeout: number;
  maxConnections: number;
  busyTimeout: number;
  cacheSize: number;
  mmapSize: number;
  walMode: boolean;
  synchronous: 'OFF' | 'NORMAL' | 'FULL';
}

export interface PerformanceThresholds {
  agentSpawnTime: number; // ms
  inferenceTime: number; // ms
  memoryPerAgent: number; // bytes
  databaseOperationTime: number; // ms
  recoveryTime: number; // ms
}

export interface BatchOperation<T> {
  operation: 'insert' | 'update' | 'delete';
  data: T;
  priority?: 'high' | 'medium' | 'low';
}