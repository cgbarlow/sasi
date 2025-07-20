#!/usr/bin/env node

/**
 * Smart CI Status Watcher with Backoff Algorithm
 * Real-time CI monitoring with swarm coordination
 * Part of ruvnet/claude-flow#419 implementation
 */

const { exec } = require('child_process');
const EventEmitter = require('events');
const fs = require('fs').promises;

class SmartCIWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      initialDelay: options.initialDelay || 2000,
      maxDelay: options.maxDelay || 120000,
      backoffMultiplier: options.backoffMultiplier || 1.4,
      successSpeedUp: options.successSpeedUp || 0.7,
      maxWatchTime: options.maxWatchTime || 600000, // 10 minutes
      swarmCoordination: options.swarmCoordination !== false,
      verboseLogging: options.verboseLogging !== false,
      ...options
    };
    
    this.currentDelay = this.options.initialDelay;
    this.watchStartTime = null;
    this.lastStatus = null;
    this.statusChangeCount = 0;
    this.runId = null;
    this.isWatching = false;
  }

  async getCurrentRunDetails() {
    return new Promise((resolve) => {
      exec('gh run list --limit 1 --json id,status,conclusion,headBranch,workflowName,createdAt,url', (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        
        try {
          const runs = JSON.parse(stdout);
          if (runs.length === 0) {
            resolve({ noRuns: true });
            return;
          }
          
          resolve(runs[0]);
        } catch (parseError) {
          resolve({ error: parseError.message, parseError: true });
        }
      });
    });
  }

  async getRunLogs(runId) {
    return new Promise((resolve) => {
      exec(`gh run view ${runId} --log`, { maxBuffer: 1024 * 1024 }, (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        resolve({ logs: stdout });
      });
    });
  }

  calculateNextDelay(statusChanged, wasSuccessful = false) {
    if (statusChanged) {
      this.statusChangeCount++;
    }
    
    if (wasSuccessful || statusChanged) {
      // Speed up on progress or success
      this.currentDelay = Math.max(
        this.options.initialDelay,
        this.currentDelay * this.options.successSpeedUp
      );
    } else {
      // Slow down when no changes
      this.currentDelay = Math.min(
        this.options.maxDelay,
        this.currentDelay * this.options.backoffMultiplier
      );
    }
    
    return this.currentDelay;
  }

  async notifySwarm(event, data) {
    if (!this.options.swarmCoordination) return;
    
    try {
      const message = JSON.stringify({ event, data, timestamp: Date.now() });
      exec(`npx claude-flow@alpha hooks notify --message "CI-Watch: ${event}" --level "info"`, (error) => {
        if (error && this.options.verboseLogging) {
          console.log('⚠️ Swarm notification failed:', error.message);
        }
      });
    } catch (error) {
      if (this.options.verboseLogging) {
        console.log('⚠️ Swarm coordination error:', error.message);
      }
    }
  }

  async analyzeStatusChange(oldStatus, newStatus) {
    const analysis = {
      statusChanged: oldStatus?.status !== newStatus?.status,
      conclusionChanged: oldStatus?.conclusion !== newStatus?.conclusion,
      isProgressing: false,
      isCompleted: newStatus?.status === 'completed',
      isSuccess: newStatus?.conclusion === 'success',
      isFailure: newStatus?.conclusion === 'failure',
      duration: this.watchStartTime ? Date.now() - this.watchStartTime : 0
    };
    
    // Detect progress patterns
    if (analysis.statusChanged || analysis.conclusionChanged) {
      analysis.isProgressing = true;
    }
    
    return analysis;
  }

  async watchCI() {
    if (this.isWatching) {
      throw new Error('CI watch already in progress');
    }
    
    this.isWatching = true;
    this.watchStartTime = Date.now();
    
    console.log('👁️ Starting Smart CI Status Watcher');
    console.log('⚙️ Options:', {
      initialDelay: this.options.initialDelay + 'ms',
      maxDelay: this.options.maxDelay + 'ms',
      backoffMultiplier: this.options.backoffMultiplier,
      maxWatchTime: (this.options.maxWatchTime / 1000) + 's'
    });
    
    try {
      await this.notifySwarm('watch_started', { options: this.options });
      
      const result = await this.watchLoop();
      
      await this.notifySwarm('watch_completed', { 
        result, 
        duration: Date.now() - this.watchStartTime,
        statusChanges: this.statusChangeCount 
      });
      
      return result;
    } finally {
      this.isWatching = false;
    }
  }

  async watchLoop() {
    let iterationCount = 0;
    
    while (true) {
      iterationCount++;
      const currentTime = Date.now();
      const elapsed = currentTime - this.watchStartTime;
      
      // Check timeout
      if (elapsed > this.options.maxWatchTime) {
        const timeoutResult = {
          status: 'timeout',
          elapsed,
          iterations: iterationCount,
          statusChanges: this.statusChangeCount
        };
        
        console.log('⏰ Watch timeout reached');
        this.emit('timeout', timeoutResult);
        return timeoutResult;
      }
      
      // Get current CI status
      const currentRun = await this.getCurrentRunDetails();
      
      if (currentRun.error) {
        console.log('❌ Error fetching CI status:', currentRun.error);
        await this.sleep(this.currentDelay);
        continue;
      }
      
      if (currentRun.noRuns) {
        console.log('📭 No CI runs found');
        await this.sleep(this.currentDelay);
        continue;
      }
      
      // Analyze status changes
      const analysis = await this.analyzeStatusChange(this.lastStatus, currentRun);
      
      // Log current status
      if (this.options.verboseLogging || analysis.statusChanged) {
        console.log(`\n🔍 CI Status Check #${iterationCount} (${(elapsed / 1000).toFixed(1)}s elapsed)`);
        console.log('📊 Status:', currentRun.status, currentRun.conclusion || '(pending)');
        console.log('🌿 Branch:', currentRun.headBranch);
        console.log('⚡ Workflow:', currentRun.workflowName);
        
        if (analysis.statusChanged) {
          console.log('🔄 Status changed!');
        }
      }
      
      // Emit events
      this.emit('status', currentRun, analysis);
      
      if (analysis.statusChanged) {
        this.emit('statusChange', this.lastStatus, currentRun, analysis);
      }
      
      // Check if completed
      if (analysis.isCompleted) {
        const completionResult = {
          status: 'completed',
          conclusion: currentRun.conclusion,
          success: analysis.isSuccess,
          run: currentRun,
          elapsed,
          iterations: iterationCount,
          statusChanges: this.statusChangeCount
        };
        
        console.log(`\n✅ CI Completed: ${currentRun.conclusion}`);
        console.log(`⏱️ Total time: ${(elapsed / 1000).toFixed(1)}s`);
        console.log(`🔄 Status changes: ${this.statusChangeCount}`);
        
        this.emit('completed', completionResult);
        return completionResult;
      }
      
      // Calculate next delay
      const nextDelay = this.calculateNextDelay(analysis.statusChanged, analysis.isProgressing);
      
      if (this.options.verboseLogging) {
        console.log(`⏳ Next check in ${(nextDelay / 1000).toFixed(1)}s`);
      }
      
      // Update last status
      this.lastStatus = { ...currentRun };
      
      // Wait before next check
      await this.sleep(nextDelay);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isWatching = false;
    this.emit('stopped');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Smart CI Status Watcher - Claude Flow Swarm Hooks
Usage: node ci-status-watch.js [options]

Options:
  --help                Show this help
  --initial-delay       Initial polling delay in ms (default: 2000)
  --max-delay          Maximum polling delay in ms (default: 120000)
  --backoff-multiplier Backoff multiplier (default: 1.4)
  --max-watch-time     Maximum watch time in ms (default: 600000)
  --no-swarm           Disable swarm coordination
  --quiet              Reduce logging verbosity

Features:
  👁️ Real-time CI status monitoring
  📈 Smart backoff algorithm
  🐝 Claude Flow swarm coordination
  🔄 Status change detection
  ⚡ Performance optimization
    `);
    return;
  }
  
  const options = {};
  
  if (args.includes('--initial-delay')) {
    const idx = args.indexOf('--initial-delay');
    options.initialDelay = parseInt(args[idx + 1]) || 2000;
  }
  
  if (args.includes('--max-delay')) {
    const idx = args.indexOf('--max-delay');
    options.maxDelay = parseInt(args[idx + 1]) || 120000;
  }
  
  if (args.includes('--backoff-multiplier')) {
    const idx = args.indexOf('--backoff-multiplier');
    options.backoffMultiplier = parseFloat(args[idx + 1]) || 1.4;
  }
  
  if (args.includes('--max-watch-time')) {
    const idx = args.indexOf('--max-watch-time');
    options.maxWatchTime = parseInt(args[idx + 1]) || 600000;
  }
  
  if (args.includes('--no-swarm')) {
    options.swarmCoordination = false;
  }
  
  if (args.includes('--quiet')) {
    options.verboseLogging = false;
  }
  
  const watcher = new SmartCIWatcher(options);
  
  // Set up event handlers
  watcher.on('completed', (result) => {
    console.log('\n🎯 Watch completed:', result.conclusion);
    process.exit(result.success ? 0 : 1);
  });
  
  watcher.on('timeout', (result) => {
    console.log('\n⏰ Watch timed out');
    process.exit(1);
  });
  
  watcher.on('statusChange', (oldStatus, newStatus, analysis) => {
    console.log('🔄 Status change detected:', oldStatus?.status, '->', newStatus?.status);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Gracefully stopping CI watcher...');
    watcher.stop();
    process.exit(0);
  });
  
  try {
    await watcher.watchCI();
  } catch (error) {
    console.error('❌ Watch failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SmartCIWatcher;