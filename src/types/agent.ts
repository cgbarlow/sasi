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