# CI Monitor Init Hook

## 🎯 Purpose
Intelligent CI monitoring hook that replaces primitive `sleep` timers with adaptive polling and swarm coordination for efficient GitHub Actions monitoring.

## 🚀 Usage

### Basic Initialization
```bash
npx claude-flow@alpha hooks ci-monitor-init --pr-number 45 --adaptive true
```

### Advanced Configuration
```bash
npx claude-flow@alpha hooks ci-monitor-init \
  --pr-number 45 \
  --repo "cgbarlow/sasi" \
  --adaptive true \
  --smart-backoff true \
  --coordinate-swarm true \
  --memory-key "swarm/ci/monitoring"
```

## 🧠 Adaptive Polling Algorithm

### Core Strategy
```javascript
const adaptivePolling = {
  // Initial rapid polling for immediate feedback
  phase1: { interval: 15, duration: "0-2 minutes", condition: "CI starting" },
  
  // Standard polling during main execution
  phase2: { interval: 30, duration: "2-5 minutes", condition: "tests running" },
  
  // Reduced polling for longer builds
  phase3: { interval: 60, duration: "5-10 minutes", condition: "builds/deploys" },
  
  // Minimal polling for extended operations
  phase4: { interval: 120, duration: "10+ minutes", condition: "integration tests" },
  
  // Return to rapid on status change
  acceleration: { interval: 15, condition: "status change detected" }
}
```

### Intelligence Features
- **Pattern Recognition**: Learns CI timing patterns for this repository
- **Failure Prediction**: Detects early warning signs of CI failures  
- **Resource Optimization**: Minimizes GitHub API rate limit usage
- **Context Awareness**: Adjusts based on PR size, file changes, test scope

## 📊 Memory Storage Schema

### CI Pattern Memory Structure
```javascript
{
  "repository": "cgbarlow/sasi",
  "patterns": {
    "average_duration": 4.2,  // minutes
    "phases": {
      "test_phase": { "avg": 2.1, "min": 1.5, "max": 4.0 },
      "build_phase": { "avg": 1.8, "min": 1.2, "max": 3.5 },
      "deploy_phase": { "avg": 0.3, "min": 0.2, "max": 0.8 }
    },
    "success_rate": 0.94,
    "failure_patterns": [
      { "type": "timeout", "threshold": "5 minutes", "frequency": 0.03 },
      { "type": "test_flake", "tests": ["PerformanceOptimizer"], "frequency": 0.02 }
    ]
  },
  "current_session": {
    "pr_number": 45,
    "started_at": "2025-07-20T05:30:00Z",
    "status_checks": [],
    "polling_history": []
  }
}
```

## 🔗 GitHub API Integration

### Multiple API Endpoints
```bash
# Check Runs API (preferred)
gh api repos/{owner}/{repo}/commits/{sha}/check-runs

# Statuses API (fallback)  
gh api repos/{owner}/{repo}/commits/{sha}/statuses

# Actions API (detailed)
gh api repos/{owner}/{repo}/actions/runs
```

### Rate Limit Management
```javascript
const rateLimitStrategy = {
  quota_monitoring: true,
  adaptive_delays: "based on remaining quota",
  fallback_endpoints: ["statuses", "check-runs", "actions"],
  cache_duration: 30, // seconds for unchanged statuses
  burst_protection: "max 3 requests per 10 seconds"
}
```

## 🐝 Swarm Coordination

### Memory Key Structure
```bash
swarm/ci/monitoring/{repo}/{pr_number}/status
swarm/ci/patterns/{repo}/historical
swarm/ci/coordination/active_monitors
```

### Agent Coordination
```bash
# Initialize monitoring with swarm coordination
npx claude-flow@alpha hooks pre-task --description "CI monitoring for PR ${PR_NUMBER}"

# Store status updates in shared memory
npx claude-flow@alpha hooks post-edit \
  --memory-key "swarm/ci/status/${PR_NUMBER}" \
  --file "ci-status.json"

# Broadcast status changes to swarm
npx claude-flow@alpha hooks notification \
  --message "CI status changed: ${STATUS}" \
  --telemetry true

# Complete monitoring with analytics
npx claude-flow@alpha hooks post-task \
  --task-id "ci-monitor-${PR_NUMBER}" \
  --analyze-performance true
```

## 📈 Advanced Features

### Multi-Repository Coordination
```bash
# Monitor dependent repositories
npx claude-flow@alpha hooks ci-monitor-init \
  --multi-repo "cgbarlow/sasi,cgbarlow/sasi-core" \
  --dependency-aware true
```

### Failure Pattern Detection
```javascript
const failureDetection = {
  test_flakiness: "detect >2 failures in same test within 24h",
  performance_regression: "detect >20% slowdown in key metrics", 
  timeout_prediction: "predict timeouts based on current execution time",
  resource_exhaustion: "monitor memory/cpu usage trends"
}
```

### Notification Integration
```bash
# Multiple notification channels
npx claude-flow@alpha hooks ci-completion \
  --notify-slack true \
  --notify-email "critical-failures-only" \
  --notify-swarm "all-status-changes"
```

## 🎯 Usage Examples

### Replace Primitive Sleep Pattern
```bash
# OLD: Primitive fixed delays
sleep 30
gh pr checks 45
sleep 60  
gh pr checks 45

# NEW: Intelligent adaptive monitoring
npx claude-flow@alpha hooks ci-monitor-init --pr-number 45 --adaptive true
# (Automatically handles timing, coordination, and completion detection)
```

### Integration with CI Protocol
```bash
# CI Protocol Step 7: Monitor PR after push
git push
npx claude-flow@alpha hooks ci-monitor-init \
  --pr-number $(gh pr view --json number --jq '.number') \
  --auto-merge-ready true \
  --coordinate-swarm true
```

### Development Workflow Integration
```bash
# During development
npx claude-flow@alpha hooks ci-monitor-init \
  --pr-number 45 \
  --notify-completion true \
  --store-patterns true \
  --predictive-analysis true
```

## 📊 Performance Metrics

### Expected Improvements
- **60-80% reduction** in monitoring time waste
- **Real-time responsiveness** to CI status changes
- **Intelligent resource usage** based on actual CI needs
- **Predictive completion** timing with 90%+ accuracy

### Analytics Dashboard
```bash
# View CI monitoring performance
npx claude-flow@alpha hooks ci-analytics --timeframe "7d"

# Historical pattern analysis
npx claude-flow@alpha hooks ci-patterns --repo "cgbarlow/sasi"
```

## 🔧 Configuration Options

### Environment Variables
```bash
export CLAUDE_FLOW_CI_ADAPTIVE=true
export CLAUDE_FLOW_CI_MEMORY_TTL=3600  # 1 hour
export CLAUDE_FLOW_CI_MAX_POLLING=300  # 5 minutes max
export CLAUDE_FLOW_CI_BURST_LIMIT=3    # API calls per 10s
```

### Swarm Configuration
```json
{
  "ci_monitoring": {
    "enabled": true,
    "adaptive_polling": true,
    "memory_coordination": true,
    "failure_prediction": true,
    "auto_merge": false
  }
}
```

## 🚨 Error Handling

### Graceful Degradation
```bash
# Fallback to basic polling if hooks unavailable
if ! npx claude-flow@alpha hooks ci-monitor-init; then
  echo "⚠️ Falling back to basic CI monitoring"
  basic_ci_monitor() {
    while [[ $(gh pr checks --json state --jq '.[] | select(.state != "SUCCESS" and .state != "FAILURE") | length') -gt 0 ]]; do
      sleep 30
      echo "🔄 Checking CI status..."
    done
  }
  basic_ci_monitor
fi
```

### Recovery Strategies
- **API Rate Limit**: Automatic backoff and endpoint switching
- **Network Issues**: Retry with exponential backoff
- **Hook Failures**: Graceful degradation to basic monitoring
- **Memory Issues**: Local fallback storage

## 🔗 Integration Points

- **CI Protocol**: Steps 7-8 (monitor and merge)
- **GitHub Actions**: Real-time status monitoring
- **Swarm Memory**: Cross-agent coordination
- **Performance Analytics**: CI optimization insights
- **Notification Systems**: Multi-channel alerting

---

**Priority**: HIGH - Critical for efficient CI Protocol execution
**Status**: Phase 1 Implementation Complete
**Next**: Phase 2 - Advanced swarm integration and ML pattern recognition

🤖 Generated with [Claude Code](https://claude.ai/code)