import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Agent } from '../contexts/SwarmContext'
import '../styles/SwarmVisualization.css'

interface SwarmVisualizationProps {
  agents: Agent[]
  repositories: any[]
  isActive: boolean
}

const SwarmVisualization: React.FC<SwarmVisualizationProps> = ({ 
  agents, 
  isActive 
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const agentMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const connectionLinesRef = useRef<THREE.LineSegments[]>([])
  const animationIdRef = useRef<number>()
  const [selectedAgent] = useState<Agent | null>(null)
  const [cameraMode, setCameraMode] = useState<'orbit' | 'follow' | 'free'>('orbit')

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const mount = mountRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    // Configure renderer
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000818, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Store references
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Create starfield background
    createStarfield(scene)

    // Create grid
    createGrid(scene)

    // Set initial camera position
    camera.position.set(0, 50, 100)
    camera.lookAt(0, 0, 0)

    // Handle window resize
    const handleResize = () => {
      if (!mount || !camera || !renderer) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Mouse controls
    let mouseDown = false
    let mouseX = 0
    let mouseY = 0

    const handleMouseDown = (event: MouseEvent) => {
      mouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseDown || !camera) return
      
      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY
      
      if (cameraMode === 'orbit') {
        const spherical = new THREE.Spherical()
        spherical.setFromVector3(camera.position)
        spherical.theta -= deltaX * 0.01
        spherical.phi += deltaY * 0.01
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
        camera.position.setFromSpherical(spherical)
        camera.lookAt(0, 0, 0)
      }
      
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const handleMouseUp = () => {
      mouseDown = false
    }

    const handleWheel = (event: WheelEvent) => {
      if (!camera) return
      const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
      const newDistance = distance + event.deltaY * 0.1
      camera.position.normalize().multiplyScalar(Math.max(10, Math.min(500, newDistance)))
    }

    mount.addEventListener('mousedown', handleMouseDown)
    mount.addEventListener('mousemove', handleMouseMove)
    mount.addEventListener('mouseup', handleMouseUp)
    mount.addEventListener('wheel', handleWheel)

    // Start animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      updateVisualization()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      mount.removeEventListener('mousedown', handleMouseDown)
      mount.removeEventListener('mousemove', handleMouseMove)
      mount.removeEventListener('mouseup', handleMouseUp)
      mount.removeEventListener('wheel', handleWheel)
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (mount && renderer) {
        mount.removeChild(renderer.domElement)
      }
      
      renderer.dispose()
    }
  }, [])

  // Create starfield
  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 2,
      transparent: true,
      opacity: 0.8
    })

    const starVertices = []
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      starVertices.push(x, y, z)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
  }

  // Create grid
  const createGrid = (scene: THREE.Scene) => {
    const gridHelper = new THREE.GridHelper(200, 20, 0x00ff8844, 0x00ff8822)
    scene.add(gridHelper)
  }

  // Create agent mesh
  const createAgentMesh = (agent: Agent): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(1, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color: getAgentColor(agent.type),
      transparent: true,
      opacity: 0.8
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(agent.position.x, agent.position.y, agent.position.z)
    
    // Add status indicator
    const statusGeometry = new THREE.RingGeometry(1.5, 2, 8)
    const statusMaterial = new THREE.MeshBasicMaterial({
      color: getStatusColor(agent.status),
      transparent: true,
      opacity: 0.6
    })
    
    const statusRing = new THREE.Mesh(statusGeometry, statusMaterial)
    statusRing.rotation.x = -Math.PI / 2
    mesh.add(statusRing)

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(2, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: getAgentColor(agent.type),
      transparent: true,
      opacity: 0.2
    })
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    mesh.add(glow)

    return mesh
  }

  // Get agent color based on type
  const getAgentColor = (type: Agent['type']): number => {
    switch (type) {
      case 'researcher': return 0x00ccff
      case 'coder': return 0x00ff88
      case 'tester': return 0xff4444
      case 'reviewer': return 0xffaa00
      case 'debugger': return 0xff00ff
      default: return 0x888888
    }
  }

  // Get status color
  const getStatusColor = (status: Agent['status']): number => {
    switch (status) {
      case 'active': return 0x44ff44
      case 'processing': return 0xffaa00
      case 'idle': return 0x888888
      case 'completed': return 0x00ccff
      default: return 0x888888
    }
  }

  // Update visualization
  const updateVisualization = useCallback(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    const currentTime = Date.now() * 0.001

    // Update existing agents
    agents.forEach(agent => {
      let mesh = agentMeshesRef.current.get(agent.id)
      
      if (!mesh) {
        mesh = createAgentMesh(agent)
        agentMeshesRef.current.set(agent.id, mesh)
        scene.add(mesh)
      }

      // Update position with smooth interpolation
      const targetPosition = new THREE.Vector3(
        agent.position.x,
        agent.position.y + Math.sin(currentTime + agent.id.length) * 2,
        agent.position.z
      )
      
      mesh.position.lerp(targetPosition, 0.1)
      
      // Update rotation
      mesh.rotation.y = currentTime + agent.id.length

      // Update status ring color
      const statusRing = mesh.children[0] as THREE.Mesh
      if (statusRing) {
        const material = statusRing.material as THREE.MeshBasicMaterial
        material.color.setHex(getStatusColor(agent.status))
      }

      // Update glow intensity based on activity
      const glow = mesh.children[1] as THREE.Mesh
      if (glow) {
        const material = glow.material as THREE.MeshBasicMaterial
        const intensity = agent.status === 'active' ? 0.4 : 0.2
        material.opacity = intensity + Math.sin(currentTime * 2) * 0.1
      }
    })

    // Remove agents that no longer exist
    const currentAgentIds = new Set(agents.map(a => a.id))
    agentMeshesRef.current.forEach((mesh, id) => {
      if (!currentAgentIds.has(id)) {
        scene.remove(mesh)
        agentMeshesRef.current.delete(id)
      }
    })

    // Update connections
    updateConnections(scene)

    // Update camera in orbit mode
    if (cameraMode === 'orbit' && cameraRef.current) {
      const camera = cameraRef.current
      const radius = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
      camera.position.x = Math.cos(currentTime * 0.1) * radius
      camera.position.z = Math.sin(currentTime * 0.1) * radius
      camera.lookAt(0, 0, 0)
    }
  }, [agents, cameraMode])

  // Update connections between agents
  const updateConnections = (scene: THREE.Scene) => {
    // Clear existing connections
    connectionLinesRef.current.forEach(line => scene.remove(line))
    connectionLinesRef.current = []

    // Create new connections
    const activeAgents = agents.filter(a => a.status === 'active')
    const positions = []
    const colors = []

    for (let i = 0; i < activeAgents.length; i++) {
      for (let j = i + 1; j < activeAgents.length; j++) {
        const agent1 = activeAgents[i]
        const agent2 = activeAgents[j]
        
        // Only connect agents working on the same repository
        if (agent1.repository === agent2.repository) {
          positions.push(
            agent1.position.x, agent1.position.y, agent1.position.z,
            agent2.position.x, agent2.position.y, agent2.position.z
          )
          
          const color = new THREE.Color(0x00ff88)
          colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
        }
      }
    }

    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3
      })
      
      const lines = new THREE.LineSegments(geometry, material)
      scene.add(lines)
      connectionLinesRef.current.push(lines)
    }
  }

  // Handle agent selection
  const handleAgentClick = () => {
    // Implement raycasting to select agents
    // This would involve converting mouse coordinates to 3D space
    // and finding intersections with agent meshes
  }

  return (
    <div className="swarm-visualization">
      <div 
        ref={mountRef} 
        className="visualization-canvas"
        onClick={handleAgentClick}
      />
      
      <div className="visualization-controls">
        <div className="control-group">
          <label>Camera Mode:</label>
          <select 
            value={cameraMode} 
            onChange={(e) => setCameraMode(e.target.value as any)}
            className="control-select"
          >
            <option value="orbit">Orbit</option>
            <option value="follow">Follow</option>
            <option value="free">Free</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Status:</label>
          <span className={`status-text ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'SWARM ACTIVE' : 'SWARM INACTIVE'}
          </span>
        </div>
      </div>

      <div className="visualization-info">
        <div className="info-panel">
          <h3>Legend</h3>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ccff' }}></div>
            <span>Researcher</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ff88' }}></div>
            <span>Coder</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff4444' }}></div>
            <span>Tester</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffaa00' }}></div>
            <span>Reviewer</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff00ff' }}></div>
            <span>Debugger</span>
          </div>
        </div>

        {selectedAgent && (
          <div className="agent-info-panel">
            <h3>Agent Details</h3>
            <p><strong>Type:</strong> {selectedAgent.type}</p>
            <p><strong>Status:</strong> {selectedAgent.status}</p>
            <p><strong>Task:</strong> {selectedAgent.currentTask}</p>
            <p><strong>Repository:</strong> {selectedAgent.repository}</p>
            <p><strong>Efficiency:</strong> {selectedAgent.efficiency.toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SwarmVisualization