// Mock implementation for Neural Mesh Service used in tests
export class MockNeuralMeshService {
  private initialized = false
  private wasmEnabled = true
  private agents: any[] = []
  private connections: any[] = []
  private eventListeners: Map<string, Function[]> = new Map()

  async initialize() {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 10))
    this.initialized = true
    return true
  }

  disconnect() {
    this.initialized = false
    this.eventListeners.clear()
  }

  isWasmEnabled() {
    return this.wasmEnabled
  }

  isInitialized() {
    return this.initialized
  }

  async createNeuralAgent(config: any) {
    const agent = {
      id: `agent-${Date.now()}`,
      type: config.type || 'worker',
      status: 'active',
      ...config
    }
    this.agents.push(agent)
    return agent
  }

  async removeAgent(agentId: string) {
    const index = this.agents.findIndex(a => a.id === agentId)
    if (index >= 0) {
      this.agents.splice(index, 1)
      return true
    }
    return false
  }

  getAgents() {
    return [...this.agents]
  }

  async addNode(nodeConfig: any) {
    return {
      id: `node-${Date.now()}`,
      ...nodeConfig
    }
  }

  async removeNode(nodeId: string) {
    return true
  }

  async createConnection(from: string, to: string, weight = 1) {
    const connection = {
      id: `conn-${Date.now()}`,
      from,
      to,
      weight
    }
    this.connections.push(connection)
    return connection
  }

  async updateConnectionWeight(connectionId: string, weight: number) {
    const connection = this.connections.find(c => c.id === connectionId)
    if (connection) {
      connection.weight = weight
      return true
    }
    return false
  }

  async removeConnection(connectionId: string) {
    const index = this.connections.findIndex(c => c.id === connectionId)
    if (index >= 0) {
      this.connections.splice(index, 1)
      return true
    }
    return false
  }

  async propagateSignal(signal: any) {
    // Mock signal propagation
    return {
      success: true,
      results: signal
    }
  }

  async trainMesh(trainingData: any) {
    // Mock training
    return {
      success: true,
      epochs: trainingData.epochs || 10,
      loss: 0.1
    }
  }

  async optimizeTopology() {
    // Mock optimization
    return {
      success: true,
      improvement: 15
    }
  }

  async saveState() {
    return {
      agents: this.agents,
      connections: this.connections
    }
  }

  async restoreState(state: any) {
    this.agents = state.agents || []
    this.connections = state.connections || []
    return true
  }

  async exportMeshData() {
    return {
      nodes: this.agents.length,
      connections: this.connections.length,
      data: {
        agents: this.agents,
        connections: this.connections
      }
    }
  }

  addEventListener(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  removeEventListener(event: string, listener: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(listener => listener(data))
  }

  getMetrics() {
    return {
      agentCount: this.agents.length,
      connectionCount: this.connections.length,
      performance: 95
    }
  }
}

// Create a singleton instance for consistent behavior
export const mockNeuralMeshService = new MockNeuralMeshService()