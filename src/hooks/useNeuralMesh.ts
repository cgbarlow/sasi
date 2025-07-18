/**
 * React Hook for Neural Mesh Integration
 * 
 * Provides React components with access to the neural mesh service,
 * real-time agent updates, and WASM-accelerated computations.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { NeuralMeshService, NeuralAgent, NeuralMeshConnection } from '../services/NeuralMeshService'
import { Agent } from '../types/agent'

export interface UseNeuralMeshProps {
  serverUrl?: string
  enableWasm?: boolean
  enableRealtime?: boolean
  debugMode?: boolean
}

export interface NeuralMeshState {
  connection: NeuralMeshConnection | null
  agents: NeuralAgent[]
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
}

export const useNeuralMesh = (props: UseNeuralMeshProps = {}) => {
  const [state, setState] = useState<NeuralMeshState>({
    connection: null,
    agents: [],
    isConnected: false,
    isInitializing: false,
    error: null,
    metrics: {
      totalNeurons: 0,
      totalSynapses: 0,
      averageActivity: 0,
      networkEfficiency: 0,
      wasmAcceleration: false
    }
  })

  const serviceRef = useRef<NeuralMeshService | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize neural mesh service
  useEffect(() => {
    const config = {
      serverUrl: props.serverUrl || 'ws://localhost:3000',
      transport: 'websocket' as const,
      enableWasm: props.enableWasm !== false,
      enableRealtime: props.enableRealtime !== false,
      debugMode: props.debugMode || false
    }

    serviceRef.current = new NeuralMeshService(config)
    
    // Set up event listeners
    const service = serviceRef.current
    
    service.on('connected', (connection: NeuralMeshConnection) => {
      setState(prev => ({
        ...prev,
        connection,
        isConnected: true,
        isInitializing: false,
        error: null
      }))
    })

    service.on('disconnected', (connection: NeuralMeshConnection) => {
      setState(prev => ({
        ...prev,
        connection,
        isConnected: false,
        error: 'Disconnected from neural mesh'
      }))
      
      // Attempt to reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        initializeService()
      }, 3000)
    })

    service.on('error', (error: Error) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        isInitializing: false
      }))
    })

    service.on('agent_created', (agent: NeuralAgent) => {
      setState(prev => ({
        ...prev,
        agents: [...prev.agents, agent]
      }))
    })

    service.on('agent_updated', (agent: NeuralAgent) => {
      setState(prev => ({
        ...prev,
        agents: prev.agents.map(a => a.id === agent.id ? agent : a)
      }))
    })

    service.on('status_update', (status: any) => {
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          totalNeurons: status.metrics?.total_neurons || 0,
          totalSynapses: status.metrics?.total_synapses || 0,
          averageActivity: status.metrics?.activity_level || 0,
          networkEfficiency: status.metrics?.efficiency_score || 0,
          wasmAcceleration: service.isWasmEnabled()
        }
      }))
    })

    service.on('mesh_trained', (results: any) => {
      if (props.debugMode) {
        console.log('🧠 Neural mesh training completed:', results)
      }
    })

    // Initialize the service
    const initializeService = async () => {
      setState(prev => ({ ...prev, isInitializing: true, error: null }))
      
      try {
        await service.initialize()
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error.message,
          isInitializing: false
        }))
      }
    }

    initializeService()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (service && typeof service.disconnect === 'function') {
        service.disconnect()
      }
    }
  }, [props.serverUrl, props.enableWasm, props.enableRealtime, props.debugMode])

  // Create a new neural agent
  const createAgent = useCallback(async (type: Agent['type'], config?: any): Promise<NeuralAgent | null> => {
    if (!serviceRef.current) return null
    
    try {
      const agent = await serviceRef.current.createNeuralAgent({ type, ...config })
      return agent
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message
      }))
      return null
    }
  }, [])

  // Update an existing agent
  const updateAgent = useCallback(async (agent: NeuralAgent): Promise<NeuralAgent | null> => {
    if (!serviceRef.current) return null
    
    try {
      const updatedAgent = await serviceRef.current.updateNeuralAgent(agent.id, agent)
      return updatedAgent
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message
      }))
      return null
    }
  }, [])

  // Remove an agent
  const removeAgent = useCallback((agentId: string): void => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.filter(agent => agent.id !== agentId)
    }))
  }, [])

  // Train the neural mesh
  const trainMesh = useCallback(async (patterns: any[]): Promise<boolean> => {
    if (!serviceRef.current) return false
    
    try {
      const success = await serviceRef.current.trainMesh(patterns)
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message
      }))
      return false
    }
  }, [])

  // Get mesh status
  const getMeshStatus = useCallback(async (): Promise<any> => {
    if (!serviceRef.current) return null
    
    try {
      const status = await serviceRef.current.getMeshStatus()
      return status
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message
      }))
      return null
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Manually reconnect
  const reconnect = useCallback(async () => {
    if (!serviceRef.current) return
    
    setState(prev => ({ ...prev, isInitializing: true, error: null }))
    
    try {
      await serviceRef.current.initialize()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isInitializing: false
      }))
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    createAgent,
    updateAgent,
    removeAgent,
    trainMesh,
    getMeshStatus,
    clearError,
    reconnect,
    
    // Computed values
    neuralAgentCount: state.agents.length,
    activeNeuralAgents: state.agents.filter(a => a.status === 'active' || a.status === 'processing').length,
    isWasmEnabled: (serviceRef.current && typeof serviceRef.current.isWasmEnabled === 'function') ? serviceRef.current.isWasmEnabled() : false,
    
    // Service reference (for advanced usage)
    service: serviceRef.current
  }
}