/**
 * Neural Mesh Visualization Component
 * 
 * Enhanced Three.js visualization that displays real-time neural mesh data
 * from the Synaptic MCP server, including neural activity, synaptic connections,
 * and WASM performance metrics.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Agent } from '../types/agent'
import { NeuralAgent } from '../services/NeuralMeshService'
import '../styles/SwarmVisualization.css'

interface NeuralMeshVisualizationProps {
  agents: Agent[]
  neuralAgents: NeuralAgent[]
  isActive: boolean
  meshMetrics: {
    totalNeurons: number
    totalSynapses: number
    averageActivity: number
    networkEfficiency: number
    wasmAcceleration: boolean
  }
  onAgentClick?: (agent: Agent) => void
}

interface NeuralNode {
  id: string
  position: THREE.Vector3
  mesh: THREE.Mesh
  connections: THREE.Line[]
  activity: number
  type: 'sensory' | 'motor' | 'inter' | 'pyramidal' | 'purkinje'
  layer: number
}

interface SynapticConnection {
  id: string
  source: string
  target: string
  line: THREE.Line
  weight: number
  activity: number
}

export const NeuralMeshVisualization: React.FC<NeuralMeshVisualizationProps> = ({
  agents,
  neuralAgents,
  isActive,
  meshMetrics,
  onAgentClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationIdRef = useRef<number>()
  const [webglError, setWebglError] = useState<string | null>(null)
  const [visualizationMode, setVisualizationMode] = useState<'neural' | 'activity' | 'connections'>('neural')
  
  // Neural mesh state
  const neuralNodesRef = useRef<Map<string, NeuralNode>>(new Map())
  const connectionsRef = useRef<Map<string, SynapticConnection>>(new Map())
  const activityWaveRef = useRef<THREE.Points>()
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())

  // Initialize Three.js scene with neural mesh setup
  useEffect(() => {
    if (!mountRef.current) return

    try {
      const mount = mountRef.current
      setWebglError(null)

      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000510)
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
      camera.position.set(0, 50, 100)
      camera.lookAt(0, 0, 0)
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      })
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      mount.appendChild(renderer.domElement)
      
      // Store references
      sceneRef.current = scene
      rendererRef.current = renderer
      cameraRef.current = camera
      
      // Add lighting
      setupLighting(scene)
      
      // Create neural mesh base structure
      createNeuralMeshBase(scene)
      
      // Add mouse interaction
      setupMouseInteraction(mount, camera, scene)
      
      // Start animation loop
      startAnimationLoop()
      
      // Handle window resize
      const handleResize = () => {
        if (!mount || !camera || !renderer) return
        
        camera.aspect = mount.clientWidth / mount.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(mount.clientWidth, mount.clientHeight)
      }
      
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        cleanup()
      }
    } catch (error) {
      console.error('Neural mesh visualization initialization failed:', error)
      setWebglError(error.message)
    }
  }, [])

  // Update neural agents visualization
  useEffect(() => {
    if (!sceneRef.current || !neuralAgents) return
    
    updateNeuralNodes()
    updateConnections()
    updateActivityVisualization()
  }, [neuralAgents, meshMetrics])

  // Setup lighting for neural mesh
  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // Neural activity glow light
    const neuralGlow = new THREE.PointLight(0x00ffff, 0.5, 200)
    neuralGlow.position.set(0, 20, 0)
    scene.add(neuralGlow)
  }

  // Create base neural mesh structure
  const createNeuralMeshBase = (scene: THREE.Scene) => {
    // Create neural mesh grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x0088ff, 0x004488)
    gridHelper.position.y = -10
    scene.add(gridHelper)
    
    // Create layer indicators
    for (let layer = 1; layer <= 6; layer++) {
      const layerGeometry = new THREE.RingGeometry(layer * 15, layer * 15 + 1, 32)
      const layerMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(layer / 6, 0.7, 0.3),
        transparent: true,
        opacity: 0.2
      })
      const layerRing = new THREE.Mesh(layerGeometry, layerMaterial)
      layerRing.rotation.x = -Math.PI / 2
      layerRing.position.y = layer * 5
      scene.add(layerRing)
    }
  }

  // Update neural nodes based on neural agents
  const updateNeuralNodes = () => {
    if (!sceneRef.current) return
    
    const scene = sceneRef.current
    const currentNodes = neuralNodesRef.current
    
    // Remove nodes that no longer exist
    for (const [nodeId, node] of currentNodes.entries()) {
      if (!neuralAgents.find(agent => agent.neuralProperties.neuronId === nodeId)) {
        scene.remove(node.mesh)
        node.connections.forEach(conn => scene.remove(conn))
        currentNodes.delete(nodeId)
      }
    }
    
    // Add or update nodes
    neuralAgents.forEach(agent => {
      const nodeId = agent.neuralProperties.neuronId
      let node = currentNodes.get(nodeId)
      
      if (!node) {
        // Create new neural node
        node = createNeuralNode(agent)
        currentNodes.set(nodeId, node)
        scene.add(node.mesh)
      } else {
        // Update existing node
        updateNeuralNode(node, agent)
      }
    })
  }

  // Create a neural node mesh
  const createNeuralNode = (agent: NeuralAgent): NeuralNode => {
    const neuralProps = agent.neuralProperties
    
    // Determine node size based on type and activity
    const baseSize = getNodeSize(neuralProps.nodeType)
    const size = baseSize * (1 + neuralProps.activation * 0.5)
    
    // Create node geometry
    const geometry = getNodeGeometry(neuralProps.nodeType, size)
    
    // Create node material
    const material = new THREE.MeshPhongMaterial({
      color: getNodeColor(neuralProps.nodeType, neuralProps.activation),
      transparent: true,
      opacity: 0.8 + neuralProps.activation * 0.2,
      emissive: new THREE.Color().setHSL(neuralProps.activation, 0.5, 0.1)
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    
    // Position based on layer and random spread
    const angle = Math.random() * Math.PI * 2
    const radius = neuralProps.layer * 15 + (Math.random() - 0.5) * 10
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      neuralProps.layer * 5 + (Math.random() - 0.5) * 3,
      Math.sin(angle) * radius
    )
    
    mesh.position.copy(position)
    mesh.userData = { agent, nodeType: 'neural' }
    
    return {
      id: neuralProps.neuronId,
      position,
      mesh,
      connections: [],
      activity: neuralProps.activation,
      type: neuralProps.nodeType,
      layer: neuralProps.layer
    }
  }

  // Update neural node appearance
  const updateNeuralNode = (node: NeuralNode, agent: NeuralAgent) => {
    const neuralProps = agent.neuralProperties
    
    // Update activity
    node.activity = neuralProps.activation
    
    // Update material
    const material = node.mesh.material as THREE.MeshPhongMaterial
    material.color = getNodeColor(neuralProps.nodeType, neuralProps.activation)
    material.opacity = 0.8 + neuralProps.activation * 0.2
    material.emissive = new THREE.Color().setHSL(neuralProps.activation, 0.5, 0.1)
    
    // Update scale based on activity
    const scale = 1 + neuralProps.activation * 0.3
    node.mesh.scale.setScalar(scale)
    
    // Add spike animation
    if (neuralProps.lastSpike && Date.now() - neuralProps.lastSpike.getTime() < 1000) {
      const spikeIntensity = 1 - (Date.now() - neuralProps.lastSpike.getTime()) / 1000
      material.emissive.setHSL(0.6, 1, spikeIntensity * 0.5)
    }
  }

  // Update synaptic connections
  const updateConnections = () => {
    if (!sceneRef.current) return
    
    const scene = sceneRef.current
    const currentConnections = connectionsRef.current
    const nodes = neuralNodesRef.current
    
    // Clear existing connections
    currentConnections.forEach(conn => {
      scene.remove(conn.line)
    })
    currentConnections.clear()
    
    // Create new connections based on neural agents
    neuralAgents.forEach(agent => {
      const sourceNode = nodes.get(agent.neuralProperties.neuronId)
      if (!sourceNode) return
      
      agent.neuralProperties.connections.forEach(targetId => {
        const targetNode = nodes.get(targetId)
        if (!targetNode) return
        
        const connection = createSynapticConnection(sourceNode, targetNode)
        currentConnections.set(connection.id, connection)
        scene.add(connection.line)
      })
    })
  }

  // Create synaptic connection
  const createSynapticConnection = (source: NeuralNode, target: NeuralNode): SynapticConnection => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      source.position,
      target.position
    ])
    
    const material = new THREE.LineBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.3
    })
    
    const line = new THREE.Line(geometry, material)
    
    return {
      id: `${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      line,
      weight: 1.0,
      activity: 0
    }
  }

  // Update activity visualization
  const updateActivityVisualization = () => {
    if (!sceneRef.current || visualizationMode !== 'activity') return
    
    const scene = sceneRef.current
    
    // Remove existing activity wave
    if (activityWaveRef.current) {
      scene.remove(activityWaveRef.current)
    }
    
    // Create activity wave visualization
    const particles = []
    const colors = []
    
    neuralAgents.forEach(agent => {
      const pos = agent.position
      const activity = agent.neuralProperties.activation
      
      // Create particles for active neurons
      if (activity > 0.1) {
        for (let i = 0; i < Math.floor(activity * 10); i++) {
          particles.push(
            pos.x + (Math.random() - 0.5) * 10,
            pos.y + (Math.random() - 0.5) * 10,
            pos.z + (Math.random() - 0.5) * 10
          )
          
          const color = new THREE.Color().setHSL(activity, 0.8, 0.6)
          colors.push(color.r, color.g, color.b)
        }
      }
    })
    
    if (particles.length > 0) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      
      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      })
      
      activityWaveRef.current = new THREE.Points(geometry, material)
      scene.add(activityWaveRef.current)
    }
  }

  // Mouse interaction setup
  const setupMouseInteraction = (mount: HTMLDivElement, camera: THREE.PerspectiveCamera, scene: THREE.Scene) => {
    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    
    const onMouseClick = (event: MouseEvent) => {
      if (!raycasterRef.current) return
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)
      
      if (intersects.length > 0) {
        const intersected = intersects[0].object
        if (intersected.userData && intersected.userData.agent) {
          onAgentClick?.(intersected.userData.agent)
        }
      }
    }
    
    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('click', onMouseClick)
  }

  // Animation loop
  const startAnimationLoop = () => {
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      
      // Update neural activity animations
      updateNeuralAnimations()
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      
      animationIdRef.current = requestAnimationFrame(animate)
    }
    
    animate()
  }

  // Update neural animations
  const updateNeuralAnimations = () => {
    const time = Date.now() * 0.001
    
    // Animate neural nodes
    neuralNodesRef.current.forEach(node => {
      // Breathing animation based on activity
      const breathe = 1 + Math.sin(time * 2 + node.activity * 10) * 0.1 * node.activity
      node.mesh.scale.setScalar(breathe)
      
      // Rotation based on type
      if (node.type === 'pyramidal') {
        node.mesh.rotation.y += 0.01
      }
    })
    
    // Animate connections
    connectionsRef.current.forEach(connection => {
      const material = connection.line.material as THREE.LineBasicMaterial
      material.opacity = 0.3 + Math.sin(time * 3) * 0.1
    })
  }

  // Utility functions
  const getNodeSize = (type: string): number => {
    const sizes = {
      'sensory': 1.5,
      'motor': 1.8,
      'inter': 1.0,
      'pyramidal': 2.0,
      'purkinje': 2.5
    }
    return sizes[type] || 1.0
  }

  const getNodeGeometry = (type: string, size: number): THREE.BufferGeometry => {
    switch (type) {
      case 'pyramidal':
        return new THREE.ConeGeometry(size, size * 2, 8)
      case 'purkinje':
        return new THREE.SphereGeometry(size, 16, 16)
      case 'sensory':
        return new THREE.OctahedronGeometry(size)
      case 'motor':
        return new THREE.BoxGeometry(size, size, size)
      default:
        return new THREE.SphereGeometry(size, 8, 8)
    }
  }

  const getNodeColor = (type: string, activity: number): THREE.Color => {
    const baseColors = {
      'sensory': 0x00ff00,
      'motor': 0xff0000,
      'inter': 0x0000ff,
      'pyramidal': 0xffff00,
      'purkinje': 0xff00ff
    }
    
    const baseColor = new THREE.Color(baseColors[type] || 0x888888)
    const activityColor = new THREE.Color(0xffffff)
    
    return baseColor.lerp(activityColor, activity * 0.5)
  }

  // Cleanup
  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    
    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement)
      rendererRef.current.dispose()
    }
    
    // Clear neural state
    neuralNodesRef.current.clear()
    connectionsRef.current.clear()
  }

  // Render component
  return (
    <div className="swarm-visualization">
      <div className="neural-controls">
        <div className="neural-stats">
          <span>Neurons: {meshMetrics.totalNeurons}</span>
          <span>Synapses: {meshMetrics.totalSynapses}</span>
          <span>Activity: {(meshMetrics.averageActivity * 100).toFixed(1)}%</span>
          <span>Efficiency: {(meshMetrics.networkEfficiency * 100).toFixed(1)}%</span>
          {meshMetrics.wasmAcceleration && <span className="wasm-badge">WASM</span>}
        </div>
        
        <div className="visualization-modes">
          <button 
            className={visualizationMode === 'neural' ? 'active' : ''}
            onClick={() => setVisualizationMode('neural')}
          >
            Neural Nodes
          </button>
          <button 
            className={visualizationMode === 'activity' ? 'active' : ''}
            onClick={() => setVisualizationMode('activity')}
          >
            Activity Wave
          </button>
          <button 
            className={visualizationMode === 'connections' ? 'active' : ''}
            onClick={() => setVisualizationMode('connections')}
          >
            Connections
          </button>
        </div>
      </div>
      
      <div ref={mountRef} className="visualization-container">
        {webglError && (
          <div className="webgl-error">
            <h3>WebGL Error</h3>
            <p>{webglError}</p>
            <p>Neural mesh visualization requires WebGL support.</p>
          </div>
        )}
      </div>
    </div>
  )
}