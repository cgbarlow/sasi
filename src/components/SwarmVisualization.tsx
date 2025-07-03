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
  const spectrumRef = useRef<{ spectrumGroup: THREE.Group; bars: THREE.Mesh[]; freqBins: number; timeBins: number } | null>(null)
  const [selectedAgent] = useState<Agent | null>(null)
  const [cameraMode, setCameraMode] = useState<'orbit' | 'follow' | 'free'>('orbit')
  const [webglError, setWebglError] = useState<string | null>(null)

  // Create classic SETI@home style 3D frequency spectrum waterfall
  const createSpectrumVisualization = (scene: THREE.Scene) => {
    const freqBins = 80    // Frequency bins
    const timeBins = 60    // Time samples
    const maxHeight = 25   // Maximum bar height
    
    const bars: THREE.Mesh[] = []
    const spectrumGroup = new THREE.Group()
    
    // Create spectrum bars (classic SETI@home waterfall style)
    for (let t = 0; t < timeBins; t++) {
      for (let f = 0; f < freqBins; f++) {
        // Create simulated signal data with realistic patterns
        const baseNoise = Math.random() * 0.1
        const freq = f / freqBins
        const time = t / timeBins
        
        // Add some realistic signal patterns
        let signal = baseNoise
        signal += Math.sin(freq * Math.PI * 8 + time * 4) * 0.15  // Carrier signals
        signal += Math.sin(freq * Math.PI * 20 + time * 8) * 0.1  // Higher frequency components
        signal += Math.random() < 0.005 ? Math.random() * 0.8 : 0  // Occasional strong signals
        
        const intensity = Math.max(0, signal)
        const height = intensity * maxHeight
        
        // Create individual spectrum bar
        const barGeometry = new THREE.BoxGeometry(1.5, height, 1.5)
        
        // Classic SETI@home rainbow color mapping
        const getSpectrumColor = (intensity: number): [number, number, number] => {
          const normalized = Math.min(1, intensity * 3) // Boost contrast
          
          if (normalized < 0.16) {
            // Deep blue to blue
            return [0, 0, 0.3 + normalized * 4.25]
          } else if (normalized < 0.33) {
            // Blue to cyan
            return [0, (normalized - 0.16) * 6, 1]
          } else if (normalized < 0.5) {
            // Cyan to green
            return [0, 1, 1 - (normalized - 0.33) * 6]
          } else if (normalized < 0.66) {
            // Green to yellow
            return [(normalized - 0.5) * 6, 1, 0]
          } else if (normalized < 0.83) {
            // Yellow to orange/red
            return [1, 1 - (normalized - 0.66) * 3, 0]
          } else {
            // Orange to bright red
            return [1, 0.2 - (normalized - 0.83) * 1.2, 0]
          }
        }
        
        const [r, g, b] = getSpectrumColor(intensity)
        const barMaterial = new THREE.MeshBasicMaterial({ 
          color: new THREE.Color(r, g, b),
          transparent: true,
          opacity: 0.8
        })
        
        const bar = new THREE.Mesh(barGeometry, barMaterial)
        
        // Position the bar
        const x = (f - freqBins/2) * 2
        const z = (t - timeBins/2) * 2
        bar.position.set(x, height/2, z)
        
        bars.push(bar)
        spectrumGroup.add(bar)
      }
    }
    
    scene.add(spectrumGroup)
    
    // Add axes and labels
    const axesGroup = new THREE.Group()
    
    // Frequency axis (X)
    const freqAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-freqBins, 0, timeBins),
      new THREE.Vector3(freqBins, 0, timeBins)
    ])
    const freqAxis = new THREE.Line(freqAxisGeometry, new THREE.LineBasicMaterial({ color: 0x444444 }))
    axesGroup.add(freqAxis)
    
    // Time axis (Z)
    const timeAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-freqBins, 0, -timeBins),
      new THREE.Vector3(-freqBins, 0, timeBins)
    ])
    const timeAxis = new THREE.Line(timeAxisGeometry, new THREE.LineBasicMaterial({ color: 0x444444 }))
    axesGroup.add(timeAxis)
    
    scene.add(axesGroup)
    
    return { spectrumGroup, bars, freqBins, timeBins }
  }

  // Create subtle starfield background (classic SETI@home style)
  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({
      color: 0x4488cc,
      size: 0.8,
      transparent: true,
      opacity: 0.4
    })

    const starVertices = []
    for (let i = 0; i < 800; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 1000
      const z = (Math.random() - 0.5) * 2000
      starVertices.push(x, y, z)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    try {
      const mount = mountRef.current
      
      // Clear any existing error
      setWebglError(null)
      
      // Create Three.js scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000510)
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
      
      // Create Three.js renderer (try WebGL, fallback gracefully)
      let renderer: THREE.WebGLRenderer | null = null
      
      try {
        renderer = new THREE.WebGLRenderer({ 
          antialias: false,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false
        })
        
        console.log('✅ WebGL renderer created successfully')
        
        // Test if WebGL context is actually working
        const gl = renderer.getContext()
        if (!gl) {
          throw new Error('WebGL context not available')
        }
        
        console.log('✅ WebGL context verified working')
      } catch (webglError) {
        console.warn('WebGL renderer creation failed:', webglError)
        
        // Instead of throwing, let's continue with fallback
        renderer = null
        setWebglError(`WebGL initialization failed: ${webglError}`)
      }
      
      // If WebGL failed, show fallback and return early
      if (!renderer) {
        console.log('ℹ️ Using fallback visualization interface')
        return
      }

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

      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
      scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0x00ff88, 0.8)
      directionalLight.position.set(50, 50, 50)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      // Create starfield background
      createStarfield(scene)

      // Create classic SETI@home spectrum visualization
      const spectrum = createSpectrumVisualization(scene)
      spectrumRef.current = spectrum

      // Set initial camera position (classic SETI@home perspective)
      camera.position.set(120, 80, 120)
      camera.lookAt(0, 10, 0)

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
          spherical.theta -= deltaX * 0.005  // Slower rotation
          spherical.phi += deltaY * 0.005    // Slower rotation
          spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
          camera.position.setFromSpherical(spherical)
          camera.lookAt(0, 10, 0)  // Look at center of spectrum
        }
        
        mouseX = event.clientX
        mouseY = event.clientY
      }

      const handleMouseUp = () => {
        mouseDown = false
      }

      const handleWheel = (event: WheelEvent) => {
        if (!camera) return
        event.preventDefault()
        
        // Simple zoom approach - move camera closer/farther along its current direction
        const zoomSpeed = 5
        const direction = new THREE.Vector3()
        camera.getWorldDirection(direction)
        
        // Move camera forward/backward
        if (event.deltaY > 0) {
          camera.position.add(direction.multiplyScalar(zoomSpeed))
        } else {
          camera.position.add(direction.multiplyScalar(-zoomSpeed))
        }
        
        // Keep camera within reasonable bounds
        const distance = camera.position.length()
        if (distance > 400) {
          camera.position.normalize().multiplyScalar(400)
        } else if (distance < 30) {
          camera.position.normalize().multiplyScalar(30)
        }
      }

      mount.addEventListener('mousedown', handleMouseDown)
      mount.addEventListener('mousemove', handleMouseMove)
      mount.addEventListener('mouseup', handleMouseUp)
      mount.addEventListener('wheel', handleWheel)

      // Start animation loop
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate)
        
        // Animate spectrum visualization (classic SETI@home style waterfall)
        if (spectrumRef.current) {
          const { bars, freqBins, timeBins } = spectrumRef.current
          const time = Date.now() * 0.001
          
          // Update each spectrum bar
          let barIndex = 0
          for (let t = 0; t < timeBins; t++) {
            for (let f = 0; f < freqBins; f++) {
              const bar = bars[barIndex]
              if (!bar) continue
              
              // Create animated signal data 
              const freq = f / freqBins
              const timeOffset = t / timeBins
              
              const baseNoise = Math.random() * 0.05
              let signal = baseNoise
              
              // Add multiple signal components for realistic spectrum
              signal += Math.sin(freq * Math.PI * 6 + time * 3 + timeOffset) * 0.12
              signal += Math.sin(freq * Math.PI * 15 + time * 5 + timeOffset * 2) * 0.08
              signal += Math.sin(freq * Math.PI * 40 + time * 7 + timeOffset * 3) * 0.05
              
              // Add occasional strong signals (like detecting AI activity)
              const strongSignalChance = Math.sin(time * 0.5 + f * 0.1 + t * 0.05)
              if (strongSignalChance > 0.95) {
                signal += (strongSignalChance - 0.95) * 15 // Strong detection
              }
              
              const intensity = Math.max(0, signal)
              const maxHeight = 25
              const height = intensity * maxHeight
              
              // Update bar height and color
              bar.scale.y = height / 5 + 0.1 // Prevent zero height
              bar.position.y = (height / 5 + 0.1) * 2.5 // Adjust position for scaling
              
              // Classic SETI@home rainbow color mapping
              const getSpectrumColor = (intensity: number): [number, number, number] => {
                const normalized = Math.min(1, intensity * 4) // Boost contrast for animation
                
                if (normalized < 0.16) {
                  return [0, 0, 0.3 + normalized * 4.25] // Deep blue to blue
                } else if (normalized < 0.33) {
                  return [0, (normalized - 0.16) * 6, 1] // Blue to cyan
                } else if (normalized < 0.5) {
                  return [0, 1, 1 - (normalized - 0.33) * 6] // Cyan to green
                } else if (normalized < 0.66) {
                  return [(normalized - 0.5) * 6, 1, 0] // Green to yellow
                } else if (normalized < 0.83) {
                  return [1, 1 - (normalized - 0.66) * 3, 0] // Yellow to orange
                } else {
                  return [1, 0.3 - (normalized - 0.83) * 1.5, 0] // Orange to red
                }
              }
              
              const [r, g, b] = getSpectrumColor(intensity)
              ;(bar.material as THREE.MeshBasicMaterial).color.setRGB(r, g, b)
              
              barIndex++
            }
          }
        }
        
        // Only render the spectrum - no agent meshes
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
    } catch (error) {
      console.error('WebGL initialization failed:', error)
      setWebglError(error instanceof Error ? error.message : 'WebGL not supported')
    }
  }, [])

  // SASI@home focuses purely on spectrum analysis - no 3D agent objects

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
      >
        {webglError && (
          <div className="webgl-fallback">
            <div className="fallback-content">
              <div className="seti-header">
                <h3>SASI@home</h3>
                <p>Search for Artificial Super Intelligence</p>
              </div>
              
              <div className="analysis-panels">
                <div className="data-panel">
                  <h4>Data Analysis</h4>
                  <div className="spectrum-bars">
                    {Array.from({length: 20}, (_, i) => (
                      <div key={i} className="spectrum-bar" style={{
                        height: `${Math.random() * 80 + 20}%`,
                        backgroundColor: `hsl(${240 - Math.random() * 120}, 70%, 60%)`
                      }}></div>
                    ))}
                  </div>
                  <p>Computing agent neural patterns...</p>
                </div>
                
                <div className="info-panel-fallback">
                  <h4>Agent Activity</h4>
                  <p>Active Agents: {agents.length}</p>
                  <p>Processing Units: {Math.floor(Math.random() * 1000) + 500}</p>
                  <p>Network Status: {isActive ? 'ACTIVE' : 'STANDBY'}</p>
                  <p>ASI Progress: {(Math.random() * 100).toFixed(2)}%</p>
                </div>
              </div>
              
              <div className="fallback-note">
                <p>⚠️ 3D visualization requires WebGL support</p>
                <p>Displaying fallback analysis interface</p>
              </div>
            </div>
          </div>
        )}
      </div>
      

      <div className="visualization-info">
        {/* Classic SETI@home style floating panels */}
        <div className="seti-panel data-analysis">
          <h3>Data Analysis</h3>
          <div className="seti-data-line">
            <span>Doppler drift rate:</span>
            <span className="data-value">20.6443 Hz/sec</span>
          </div>
          <div className="seti-data-line">
            <span>Resolution:</span>
            <span className="data-value">0.238 Hz</span>
          </div>
          <div className="seti-data-line">
            <span>Best Gaussian power:</span>
            <span className="data-value">128.11</span>
          </div>
          <div className="seti-data-line">
            <span>Overall:</span>
            <span className="data-value highlight">73.955% done</span>
          </div>
        </div>
        
        <div className="seti-panel agent-info">
          <h3>Agent Activity</h3>
          <div className="seti-data-line">
            <span>Active Agents:</span>
            <span className="data-value">{agents.length}</span>
          </div>
          <div className="seti-data-line">
            <span>Processing Units:</span>
            <span className="data-value">{Math.floor(Math.random() * 500) + 1200}</span>
          </div>
          <div className="seti-data-line">
            <span>Network Status:</span>
            <span className="data-value success">{isActive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
          <div className="seti-data-line">
            <span>ASI Progress:</span>
            <span className="data-value highlight">{(Math.random() * 25 + 70).toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="seti-panel legend">
          <h3>Signal Legend</h3>
          <div className="spectrum-legend">
            <div className="legend-item">
              <div className="legend-color spectrum-red"></div>
              <span>Strong Signal</span>
            </div>
            <div className="legend-item">
              <div className="legend-color spectrum-yellow"></div>
              <span>Medium Signal</span>
            </div>
            <div className="legend-item">
              <div className="legend-color spectrum-green"></div>
              <span>Weak Signal</span>
            </div>
            <div className="legend-item">
              <div className="legend-color spectrum-blue"></div>
              <span>Background</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwarmVisualization