# SASI@home - Search for Artificial Super Intelligence

![SASI@home Logo](public/assets/images/sasi-logo.png)

A beautiful mockup inspired by the original SETI@home, reimagined for the age of Artificial Intelligence. SASI@home visualizes the concept of distributed AI development through coordinated swarm intelligence, where thousands of Claude Code Max agents collaborate across GitHub repositories to advance toward Artificial Super Intelligence.

## 🌟 Features

### 🎨 SETI@home Inspired Design
- Retro-futuristic aesthetic with glowing green terminals
- Classic SETI@home color scheme and typography
- Nostalgic screensaver-like visualizations
- Modern responsive design for all devices

### 🤖 Mock Claude Code Max Integration
- Simulated authentication with Claude Code Max accounts
- User profiles with contribution scores and agent counts
- Quick demo access for immediate exploration

### 🌐 Real-time WebGL Visualization
- Stunning 3D visualization using Three.js
- Interactive orbital camera controls
- Real-time agent activity with particle effects
- Color-coded agent types and status indicators
- Smooth animations and transitions

### 📊 Comprehensive Dashboard
- **Swarm View**: 3D visualization of all active agents
- **Agents View**: Detailed list with filtering and sorting
- **Repositories View**: GitHub project status and metrics
- Live statistics and performance monitoring

### 🔧 Agent Management
- Spawn new agents of different types (Researcher, Coder, Tester, Reviewer, Debugger)
- Monitor agent efficiency and task completion
- Real-time activity tracking
- Swarm coordination controls

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sasi

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## 🎮 Demo Usage

### 1. Landing Page
- View the SASI@home vision and statistics
- Click "Quick Demo" for instant access
- Or use "Connect Claude Code Max" for the full authentication flow

### 2. Authentication
- Enter any username/password for mock authentication
- Or use the "Quick Demo Access" button
- Experience the simulated Claude Code Max login process

### 3. Dashboard Navigation
- **Swarm View**: Watch 25+ agents in real-time 3D space
- Use mouse to rotate and zoom the visualization
- **Agents View**: Filter agents by type, status, or efficiency
- **Repositories View**: Browse active GitHub projects

### 4. Interactive Controls
- Start/stop the swarm from the header controls
- Spawn new agents using the control panel
- Adjust visualization settings
- Monitor performance metrics

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Three.js** for WebGL 3D visualization
- **Vite** for fast development and building
- **React Router** for navigation
- **React Context** for state management

### Key Components
- `SwarmVisualization`: Three.js 3D visualization engine
- `UserContext`: Authentication and user state
- `SwarmContext`: Agent and repository simulation
- `Dashboard`: Main application interface
- `AuthModal`: Mock authentication system

### Data Simulation
- 25+ mock AI agents with different types and behaviors
- 3+ sample GitHub repositories with realistic metrics
- Real-time activity simulation with randomized patterns
- Progressive ASI development metrics

## 🎨 Design Philosophy

SASI@home captures the nostalgic essence of SETI@home while presenting a modern vision for AI development:

- **Retro-Futuristic**: Green-on-black terminal aesthetics with modern UX
- **Scientific**: Data-driven visualizations and precise metrics
- **Collaborative**: Emphasis on swarm intelligence and collective progress
- **Inspiring**: Showcasing the potential of coordinated AI development

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Customize the application
VITE_APP_TITLE="SASI@home"
VITE_API_BASE_URL="http://localhost:3000"
```

### Customization
- Edit `src/styles/globals.css` for theme colors
- Modify `src/contexts/SwarmContext.tsx` for simulation parameters
- Update `src/components/SwarmVisualization.tsx` for 3D rendering options

## 📱 Responsive Design

SASI@home is fully responsive and works on:
- 🖥️ Desktop computers (1920x1080+)
- 💻 Laptops (1366x768+)
- 📱 Tablets (768x1024)
- 📱 Mobile phones (375x667+)

## 🎯 Demonstration Scenarios

### Scenario 1: First-time Visitor
1. Land on homepage → See global statistics
2. Click "Quick Demo" → Instant access
3. Explore swarm visualization → Real-time agent activity
4. Browse agent list → Filter by efficiency
5. Check repository progress → Monitor ASI development

### Scenario 2: Power User
1. Use "Connect Claude Code Max" → Full auth flow
2. Access dashboard → Monitor personal agents
3. Spawn new agents → Customize swarm composition
4. Adjust visualization → Orbital camera controls
5. Export metrics → Performance analysis

### Scenario 3: Mobile Experience
1. Responsive landing page → Touch-optimized
2. Mobile dashboard → Swipe navigation
3. Touch visualization → Pinch to zoom
4. Collapsible panels → Efficient screen usage

## 🚀 Future Enhancements

This mockup demonstrates the core concept. Future versions could include:
- Real Claude Code Max API integration
- Actual GitHub repository connections
- Live agent deployment and management
- Advanced swarm coordination algorithms
- Multi-user collaboration features
- ASI progress milestone tracking

## 🏆 Technical Achievements

- ✅ **Modern React**: Hooks, Context, TypeScript
- ✅ **3D Graphics**: Three.js WebGL rendering
- ✅ **Performance**: Optimized for 60fps animation
- ✅ **Responsive**: Mobile-first design approach
- ✅ **Accessibility**: Semantic HTML and ARIA labels
- ✅ **Type Safety**: Full TypeScript coverage

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by the original **SETI@home** project
- Built with **Claude Code** assistance
- Powered by **Three.js** and **React**
- Design influenced by retro terminal aesthetics

---

*"Just as SETI@home united millions to search the cosmos, SASI@home envisions uniting AI agents to build the future."*
