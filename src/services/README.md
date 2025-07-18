# Neural Agent Manager Integration

This directory contains the production-ready neural agent management system that replaces SASI's mock agents with real neural capabilities powered by ruv-FANN WASM backend.

## 🧠 Overview

The Neural Agent Manager provides:

- **Real Neural Networks**: WASM-accelerated neural networks via ruv-FANN
- **SQLite Persistence**: Agent state and performance data storage
- **Performance Monitoring**: Integration with synaptic-mesh performance suite
- **Memory Management**: <50MB per agent with automatic cleanup
- **Cross-Agent Learning**: Knowledge transfer between neural agents
- **Seamless Integration**: Drop-in replacement for SwarmContext mock functions

## 📁 File Structure

```
sasi/src/services/
├── NeuralAgentManager.ts       # Core neural agent management
├── SwarmContextIntegration.ts  # Integration layer for SwarmContext
├── NeuralContextAdapter.ts     # Drop-in replacement functions
├── PerformanceIntegration.ts   # Performance monitoring bridge
└── README.md                   # This documentation
```

```
sasi/src/types/
└── neural.ts                   # Neural-specific type definitions
```

## 🚀 Quick Integration

### Option 1: Minimal Changes to SwarmContext

Replace the mock functions in `SwarmContext.tsx`:

```typescript
// Import neural adapters
import {
  initializeNeuralData,
  generateNeuralAgents,
  simulateNeuralActivity,
  addNeuralAgent,
  removeNeuralAgent,
  getEnhancedStats
} from '../services/NeuralContextAdapter'

// In SwarmProvider component:
useEffect(() => {
  // Replace initializeMockData() with:
  initializeNeuralData(mockRepositories)
}, [])

// Replace generateMockAgents() with:
const agents = generateNeuralAgents(25)

// Replace simulateSwarmActivity() with:
useEffect(() => {
  if (!isSwarmActive) return
  
  const interval = setInterval(async () => {
    const updatedAgents = await simulateNeuralActivity()
    setAgents(updatedAgents)
  }, 2000)
  
  return () => clearInterval(interval)
}, [isSwarmActive])

// Replace addAgent() with:
const addAgent = async (type: Agent['type']) => {
  const newAgent = await addNeuralAgent(type)
  if (newAgent) {
    setAgents(current => [...current, newAgent])
  }
}

// Replace removeAgent() with:
const removeAgent = async (id: string) => {
  const success = await removeNeuralAgent(id)
  if (success) {
    setAgents(current => current.filter(agent => agent.id !== id))
  }
}

// Enhanced stats with neural metrics:
const stats = getEnhancedStats(baseStats)
```

### Option 2: Full Integration with Performance Monitoring

```typescript
import NeuralAgentManager from '../services/NeuralAgentManager'
import PerformanceIntegration from '../services/PerformanceIntegration'

// In SwarmProvider:
const [neuralManager] = useState(() => new NeuralAgentManager({
  maxAgents: 25,
  enablePerformanceMonitoring: true,
  enableCrossLearning: true
}))

const [performanceMonitor] = useState(() => new PerformanceIntegration({
  enableRealTimeMonitoring: true,
  enableBottleneckDetection: true,
  dashboardEnabled: true
}))

useEffect(() => {
  const initializeNeuralSystem = async () => {
    await neuralManager.initialize()
    await performanceMonitor.initialize()
    
    const agents = await neuralManager.spawnNeuralAgents(25, repositories)
    setAgents(agents)
  }
  
  initializeNeuralSystem()
}, [])
```

## 🎯 Key Features

### 1. Real Neural Networks

- **WASM Backend**: ruv-FANN integration with SIMD optimization
- **Multiple Architectures**: MLP, LSTM, CNN, Transformer support
- **Real-time Inference**: <100ms target inference time
- **Memory Efficient**: <50MB per agent memory usage

### 2. Agent State Persistence

- **SQLite Database**: Persistent agent state across sessions
- **Automatic Backup**: Event logging and state snapshots
- **Fast Recovery**: Quick agent restoration on restart

### 3. Performance Monitoring

- **Real-time Metrics**: CPU, memory, inference time tracking
- **Alert System**: Configurable performance thresholds
- **Bottleneck Detection**: Automatic performance issue identification
- **Dashboard Integration**: Compatible with synaptic-mesh dashboard

### 4. Cross-Agent Learning

- **Knowledge Transfer**: Weight sharing between compatible agents
- **Gradient Sharing**: Distributed learning protocols
- **Meta-Learning**: Transfer learning across domains

## 📊 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Agent Spawn Time | <100ms | ✅ Real-time |
| Inference Time | <100ms | ✅ Per-operation |
| Memory per Agent | <50MB | ✅ Continuous |
| WASM Operations | <10ms | ✅ SIMD-optimized |
| System Health | >80% | ✅ Composite score |

## 🔧 Configuration

### Neural Agent Manager

```typescript
new NeuralAgentManager({
  maxAgents: 25,                      // Maximum concurrent agents
  defaultMemoryLimit: 50 * 1024 * 1024, // 50MB per agent
  defaultInferenceTimeout: 100,       // 100ms timeout
  enableSQLitePersistence: true,      // Enable database
  enablePerformanceMonitoring: true, // Enable metrics
  enableCrossLearning: true,          // Enable knowledge transfer
  enableRealtimeSync: true            // Enable mesh sync
})
```

### Performance Integration

```typescript
new PerformanceIntegration({
  enableRealTimeMonitoring: true,
  enableBottleneckDetection: true,
  enablePredictiveAnalysis: false,    // Requires ML model
  enableAutoOptimization: false,      // Manual optimization
  alertThresholds: {
    inferenceTime: 100,              // ms
    memoryUsage: 50,                 // MB
    cpuUsage: 80,                    // %
    accuracy: 0.85,                  // 85%
    errorRate: 0.05                  // 5%
  },
  updateInterval: 1000,              // 1 second
  historyRetention: 24               // 24 hours
})
```

## 🗄️ Database Schema

The system automatically creates these SQLite tables:

### `neural_agents`
```sql
CREATE TABLE neural_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  neural_config TEXT NOT NULL,    -- JSON
  position TEXT NOT NULL,         -- JSON
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### `neural_events`
```sql
CREATE TABLE neural_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,       -- JSON
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES neural_agents (id)
);
```

## 🔄 Migration Path

### Phase 1: Drop-in Replacement (Current)
- Use `NeuralContextAdapter.ts` for minimal changes
- Maintains existing SwarmContext structure
- Gradual neural feature enablement

### Phase 2: Enhanced Integration
- Direct use of `NeuralAgentManager` and `PerformanceIntegration`
- Full performance monitoring dashboard
- Advanced neural features (cross-learning, optimization)

### Phase 3: Full Neural Mesh
- Integration with synaptic-mesh MCP server
- Distributed neural processing
- Advanced AI coordination protocols

## 🛠️ Development

### Adding New Neural Features

1. **Extend Neural Types**: Add to `types/neural.ts`
2. **Implement in Manager**: Update `NeuralAgentManager.ts`
3. **Add Performance Tracking**: Update `PerformanceIntegration.ts`
4. **Update Adapter**: Expose in `NeuralContextAdapter.ts`

### Performance Optimization

1. **Monitor Metrics**: Use performance dashboard
2. **Identify Bottlenecks**: Check alert system
3. **Optimize Architecture**: Adjust neural network sizes
4. **Tune Parameters**: Modify inference timeouts and memory limits

### Debugging

1. **Enable Debug Mode**: Set `debugMode: true` in config
2. **Check Console Logs**: Neural operations are logged
3. **Monitor Database**: Check SQLite for persistence issues
4. **Performance Dashboard**: Use real-time monitoring

## 🔗 Integration Points

### With Existing SASI Components

- **SwarmContext**: Direct replacement functions
- **useNeuralMesh**: Enhanced with real neural capabilities
- **PerformanceDashboard**: Real metrics integration
- **Agent Types**: Compatible with existing interfaces

### With Synaptic-Mesh

- **Performance Suite**: Direct integration
- **WASM Modules**: ruv-FANN backend
- **Neural Architecture**: Real network implementations
- **MCP Server**: Future distributed processing

## 📈 Monitoring & Alerts

### Performance Metrics
- Agent spawn times
- Inference latencies
- Memory usage patterns
- CPU utilization
- WASM operation performance

### Alert Types
- Performance threshold exceeded
- Memory pressure warnings
- Inference timeout alerts
- Accuracy degradation
- System health issues

### Dashboard Features
- Real-time performance graphs
- Agent status overview
- Alert management
- Historical trend analysis
- System health scoring

## 🧪 Testing

### Unit Tests
```bash
npm test src/services/NeuralAgentManager.test.ts
npm test src/services/PerformanceIntegration.test.ts
```

### Integration Tests
```bash
npm test src/services/integration.test.ts
```

### Performance Tests
```bash
npm run test:performance
```

## 🚀 Deployment

### Production Configuration

```typescript
// Optimized for production
const neuralManager = new NeuralAgentManager({
  maxAgents: 50,                    // Higher agent count
  enablePerformanceMonitoring: true,
  enableCrossLearning: true,
  enableRealtimeSync: true,
  wasmModulePath: '/opt/wasm-modules' // Production WASM path
})

const performanceMonitor = new PerformanceIntegration({
  enableRealTimeMonitoring: true,
  enableBottleneckDetection: true,
  enablePredictiveAnalysis: true,   // Enable ML prediction
  enableAutoOptimization: true,     // Enable safe auto-optimization
  alertThresholds: {
    inferenceTime: 50,             // Stricter 50ms target
    memoryUsage: 40,               // 40MB limit
    cpuUsage: 70,                  // 70% CPU limit
    accuracy: 0.90,                // 90% accuracy target
    errorRate: 0.02                // 2% error rate limit
  }
})
```

### Environment Variables

```bash
# Database configuration
NEURAL_DB_PATH=/var/lib/neural/agents.db
NEURAL_LOG_LEVEL=info

# Performance monitoring
PERFORMANCE_DASHBOARD_PORT=8080
PERFORMANCE_UPDATE_INTERVAL=500

# WASM configuration
WASM_MODULE_PATH=/opt/wasm-modules
WASM_SIMD_ENABLED=true
```

## 📞 Support

For issues and questions:

1. **Performance Issues**: Check dashboard and alerts
2. **Memory Problems**: Review agent memory usage
3. **Integration Issues**: Verify adapter configuration
4. **WASM Problems**: Check browser SIMD support

## 🔄 Version History

- **v1.0.0**: Initial neural agent manager implementation
- **v1.1.0**: Performance monitoring integration
- **v1.2.0**: Cross-agent learning protocols
- **v1.3.0**: Enhanced WASM optimization (Current)

## 📋 TODO

- [ ] Distributed neural mesh processing
- [ ] Advanced meta-learning algorithms
- [ ] GPU acceleration support
- [ ] Real-time collaboration protocols
- [ ] Advanced optimization strategies