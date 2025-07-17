import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNeuralMesh } from '../hooks/useNeuralMesh'
import { NeuralAgent } from '../services/NeuralMeshService'
import { Agent } from '../types/agent'

export { Agent } from '../types/agent'

export interface SwarmStats {
  totalAgents: number
  activeAgents: number
  totalRepositories: number
  tasksCompleted: number
  asiProgress: number
  networkEfficiency: number
  globalContributors: number
  processingUnits: number
  neuralMeshStats?: {
    totalNeurons: number
    totalSynapses: number
    meshConnectivity: number
    neuralActivity: number
    wasmAcceleration: boolean
    averageLatency: number
  }
}

export interface Repository {
  id: string
  name: string
  owner: string
  description: string
  activeAgents: number
  totalIssues: number
  completedIssues: number
  openPullRequests: number
  lastActivity: Date
  techStack: string[]
  votes: number
  userVoted: boolean
}


interface SwarmContextType {
  agents: Agent[]
  repositories: Repository[]
  stats: SwarmStats
  isSwarmActive: boolean
  startSwarm: () => void
  stopSwarm: () => void
  addAgent: (type: Agent['type']) => void
  removeAgent: (id: string) => void
  voteForProject: (repositoryId: string) => void
  addRepository: (repository: Repository) => void
  // Neural mesh integration
  neuralMesh: {
    isConnected: boolean
    isInitializing: boolean
    error: string | null
    metrics: {
      totalNeurons: number
      totalSynapses: number
      averageActivity: number
      networkEfficiency: number
      wasmAcceleration: boolean
    }
    connection: any
    trainMesh: (patterns: any[]) => Promise<boolean>
    getMeshStatus: () => Promise<any>
    clearError: () => void
    reconnect: () => Promise<void>
    toggleNeuralMesh: (enabled: boolean) => void
  }
}

const SwarmContext = createContext<SwarmContextType | undefined>(undefined)

export const useSwarm = () => {
  const context = useContext(SwarmContext)
  if (context === undefined) {
    throw new Error('useSwarm must be used within a SwarmProvider')
  }
  return context
}

interface SwarmProviderProps {
  children: ReactNode
}

export const SwarmProvider: React.FC<SwarmProviderProps> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [stats, setStats] = useState<SwarmStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalRepositories: 0,
    tasksCompleted: 0,
    asiProgress: 0,
    networkEfficiency: 0,
    globalContributors: 0,
    processingUnits: 0
  })
  const [isSwarmActive, setIsSwarmActive] = useState(false)
  const [useNeuralMesh, setUseNeuralMesh] = useState(true)
  
  // Neural mesh integration
  const neuralMeshHook = useNeuralMesh({
    serverUrl: 'ws://localhost:3000',
    enableWasm: true,
    enableRealtime: true,
    debugMode: true
  })

  // Initialize mock data
  useEffect(() => {
    initializeMockData()
  }, [])

  // Update stats when agents/repositories change
  useEffect(() => {
    updateStats()
  }, [agents, repositories, neuralMeshHook.agents, neuralMeshHook.metrics])
  
  // Sync neural mesh agents with regular agents
  useEffect(() => {
    if (useNeuralMesh && neuralMeshHook.agents.length > 0) {
      const combinedAgents = [...agents.filter(a => !a.neuralId), ...neuralMeshHook.agents]
      setAgents(combinedAgents)
    }
  }, [neuralMeshHook.agents, useNeuralMesh])

  // Simulate swarm activity
  useEffect(() => {
    if (!isSwarmActive) return

    const interval = setInterval(() => {
      simulateSwarmActivity()
    }, 2000)

    return () => clearInterval(interval)
  }, [isSwarmActive])

  const initializeMockData = () => {
    // Mock repositories
    const mockRepos: Repository[] = [
      {
        id: 'repo_1',
        name: 'quantum-compiler',
        owner: 'QuantumSoft',
        description: 'Next-generation quantum computing compiler',
        activeAgents: 5,
        totalIssues: 47,
        completedIssues: 32,
        openPullRequests: 3,
        lastActivity: new Date(),
        techStack: ['Rust', 'Python', 'CUDA'],
        votes: 42,
        userVoted: false
      },
      {
        id: 'repo_2',
        name: 'neural-mesh',
        owner: 'DeepMind',
        description: 'Distributed neural network framework',
        activeAgents: 8,
        totalIssues: 73,
        completedIssues: 51,
        openPullRequests: 5,
        lastActivity: new Date(),
        techStack: ['Python', 'TensorFlow', 'C++'],        votes: 28,        userVoted: true
      },
      {
        id: 'repo_3',
        name: 'swarm-intelligence',
        owner: 'MIT-CSAIL',
        description: 'Collective AI decision-making system',
        activeAgents: 12,
        totalIssues: 95,
        completedIssues: 67,
        openPullRequests: 7,
        lastActivity: new Date(),
        techStack: ['Go', 'React', 'PostgreSQL'],        votes: 73,        userVoted: false
      }
    ]

    // Mock agents
    const mockAgents: Agent[] = generateMockAgents(25)

    setRepositories(mockRepos)
    setAgents(mockAgents)
  }

  const generateMockAgents = (count: number): Agent[] => {
    const agentTypes: Agent['type'][] = ['researcher', 'coder', 'tester', 'reviewer', 'debugger']
    const tasks = [
      'Optimizing quantum algorithms',
      'Implementing neural pathways',
      'Testing distributed systems',
      'Reviewing security protocols',
      'Debugging memory leaks',
      'Analyzing performance metrics',
      'Refactoring legacy code',
      'Writing unit tests',
      'Documenting APIs',
      'Optimizing database queries'
    ]

    const owners = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']

    return Array.from({ length: count }, (_, i) => ({
      id: `agent_${i}`,
      name: `${agentTypes[Math.floor(Math.random() * agentTypes.length)].charAt(0).toUpperCase() + agentTypes[Math.floor(Math.random() * agentTypes.length)].slice(1)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      type: agentTypes[Math.floor(Math.random() * agentTypes.length)],
      status: Math.random() > 0.7 ? 'active' : Math.random() > 0.5 ? 'processing' : 'idle',
      currentTask: tasks[Math.floor(Math.random() * tasks.length)],
      repository: repositories[Math.floor(Math.random() * repositories.length)]?.name || 'quantum-compiler',
      branch: `feature/agent-${i}-${Math.random().toString(36).substr(2, 6)}`,
      completedTasks: Math.floor(Math.random() * 50),
      efficiency: Math.random() * 100,
      progress: Math.random(),
      position: {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      },
      owner: owners[Math.floor(Math.random() * owners.length)]
    }))
  }

  const updateStats = () => {
    const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'processing').length
    const totalTasks = agents.reduce((sum, agent) => sum + agent.completedTasks, 0)
    const avgEfficiency = agents.reduce((sum, agent) => sum + agent.efficiency, 0) / agents.length
    
    // Include neural mesh metrics
    const neuralMeshStats = useNeuralMesh ? {
      totalNeurons: neuralMeshHook.metrics.totalNeurons,
      totalSynapses: neuralMeshHook.metrics.totalSynapses,
      meshConnectivity: neuralMeshHook.metrics.networkEfficiency,
      neuralActivity: neuralMeshHook.metrics.averageActivity,
      wasmAcceleration: neuralMeshHook.metrics.wasmAcceleration,
      averageLatency: neuralMeshHook.agents.reduce((sum: number, agent: any) => 
        sum + (agent.realtime?.networkLatency || 0), 0) / (neuralMeshHook.agents.length || 1)
    } : undefined

    setStats({
      totalAgents: agents.length,
      activeAgents,
      totalRepositories: repositories.length,
      tasksCompleted: totalTasks,
      asiProgress: Math.min(95, (totalTasks / 1000) * 100),
      networkEfficiency: useNeuralMesh ? neuralMeshHook.metrics.networkEfficiency : avgEfficiency || 0,
      globalContributors: Math.floor(Math.random() * 5000) + 15000,
      processingUnits: Math.floor(agents.length * 42.5) + Math.floor(Math.random() * 200) + 1200,
      ...(neuralMeshStats && { neuralMeshStats })
    })
  }

  const simulateSwarmActivity = () => {
    setAgents(currentAgents => 
      currentAgents.map(agent => {
        const shouldUpdate = Math.random() > 0.7
        if (!shouldUpdate) return agent

        const newStatus = Math.random() > 0.8 ? 'active' : 
                         Math.random() > 0.6 ? 'processing' : 
                         Math.random() > 0.4 ? 'idle' : 'completed'

        const completedTasks = newStatus === 'completed' ? 
                              agent.completedTasks + 1 : 
                              agent.completedTasks

        return {
          ...agent,
          status: newStatus,
          completedTasks,
          efficiency: Math.max(0, Math.min(100, agent.efficiency + (Math.random() - 0.5) * 10)),
          progress: Math.max(0, Math.min(1, agent.progress + (Math.random() - 0.4) * 0.1)),
          position: {
            x: agent.position.x + (Math.random() - 0.5) * 2,
            y: agent.position.y + (Math.random() - 0.5) * 2,
            z: agent.position.z + (Math.random() - 0.5) * 2
          }
        }
      })
    )
  }

  const startSwarm = () => {
    setIsSwarmActive(true)
  }

  const stopSwarm = () => {
    setIsSwarmActive(false)
  }

  const addAgent = async (type: Agent['type']) => {
    if (useNeuralMesh && neuralMeshHook.isConnected) {
      // Create neural agent through mesh service
      const neuralAgent = await neuralMeshHook.createAgent(type, {
        layer: Math.floor(Math.random() * 6) + 1,
        threshold: 0.5
      })
      
      if (neuralAgent) {
        // Agent will be added automatically via useEffect hook
        return
      }
    }
    
    // Fallback to regular agent creation
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      type,
      status: 'idle',
      currentTask: 'Initializing...',
      repository: repositories[0]?.name || 'quantum-compiler',
      branch: `feature/new-agent-${Math.random().toString(36).substr(2, 6)}`,
      completedTasks: 0,
      efficiency: 50,
      progress: 0,
      position: {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      },
      owner: 'Current User'
    }

    setAgents(current => [...current, newAgent])
  }

  const removeAgent = (id: string) => {
    // Remove from neural mesh if it's a neural agent
    if (useNeuralMesh) {
      neuralMeshHook.removeAgent(id)
    }
    
    setAgents(current => current.filter(agent => agent.id !== id))
  }

  const voteForProject = (repositoryId: string) => {
    setRepositories(current => 
      current.map(repo => 
        repo.id === repositoryId 
          ? { 
              ...repo, 
              votes: repo.userVoted ? repo.votes - 1 : repo.votes + 1,
              userVoted: !repo.userVoted
            }
          : repo
      )
    )
  }

  const addRepository = (repository: Repository) => {
    setRepositories(current => [...current, repository])
  }

  const value: SwarmContextType = {
    agents,
    repositories,
    stats,
    isSwarmActive,
    startSwarm,
    stopSwarm,
    addAgent,
    removeAgent,
    voteForProject,
    addRepository,
    // Neural mesh specific methods
    neuralMesh: {
      isConnected: neuralMeshHook.isConnected,
      isInitializing: neuralMeshHook.isInitializing,
      error: neuralMeshHook.error,
      metrics: neuralMeshHook.metrics,
      connection: neuralMeshHook.connection,
      trainMesh: neuralMeshHook.trainMesh,
      getMeshStatus: neuralMeshHook.getMeshStatus,
      clearError: neuralMeshHook.clearError,
      reconnect: neuralMeshHook.reconnect,
      toggleNeuralMesh: (enabled: boolean) => setUseNeuralMesh(enabled)
    }
  }

  return (
    <SwarmContext.Provider value={value}>
      {children}
    </SwarmContext.Provider>
  )
}