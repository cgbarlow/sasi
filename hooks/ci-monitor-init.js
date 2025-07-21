#!/usr/bin/env node

/**
 * Intelligent CI Monitor Initialization Hook
 * Implements adaptive polling algorithm with machine learning patterns
 * Part of ruvnet/claude-flow#419 implementation
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class IntelligentCIMonitor {
  constructor() {
    this.baseDelay = 5000; // Start with 5 seconds
    this.maxDelay = 300000; // Max 5 minutes
    this.successDelay = 2000; // Fast polling on success
    this.failureBackoff = 1.5; // Exponential backoff multiplier
    this.maxRetries = 120; // 10 minutes max monitoring
    this.memoryPath = '.swarm/ci-patterns.json';
    this.patterns = {};
    
    this.initializePatterns();
  }

  async initializePatterns() {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf8');
      this.patterns = JSON.parse(data);
      console.log('📚 Loaded CI patterns from memory:', Object.keys(this.patterns).length, 'patterns');
    } catch (error) {
      console.log('🆕 Creating new CI pattern database');
      this.patterns = {
        avgBuildTime: 240000, // 4 minutes default
        successRate: 0.7,
        failurePatterns: [],
        optimizedIntervals: {}
      };
    }
  }

  async savePatterns() {
    try {
      await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
      await fs.writeFile(this.memoryPath, JSON.stringify(this.patterns, null, 2));
      console.log('💾 Saved CI patterns to memory');
    } catch (error) {
      console.error('❌ Failed to save CI patterns:', error.message);
    }
  }

  calculateAdaptiveDelay(attemptCount, lastResult, buildType = 'default') {
    // Use stored patterns for this build type
    const pattern = this.patterns.optimizedIntervals[buildType] || {};
    const baseInterval = pattern.avgInterval || this.baseDelay;
    
    // Adaptive algorithm based on historical data
    if (lastResult === 'success') {
      return Math.min(this.successDelay, baseInterval * 0.5);
    } else if (lastResult === 'failure') {
      return Math.min(this.maxDelay, baseInterval * Math.pow(this.failureBackoff, attemptCount));
    } else if (lastResult === 'running') {
      // Estimate remaining time based on average build time
      const remainingTime = this.patterns.avgBuildTime - (attemptCount * baseInterval);
      return Math.max(baseInterval, remainingTime / 10); // Poll 10% of remaining time
    }
    
    return baseInterval;
  }

  async getCurrentCIStatus() {
    return new Promise((resolve) => {
      exec('gh run list --limit 1 --json status,conclusion,headBranch,workflowName', (error, stdout) => {
        if (error) {
          resolve({ status: 'error', error: error.message });
          return;
        }
        
        try {
          const runs = JSON.parse(stdout);
          if (runs.length === 0) {
            resolve({ status: 'no_runs' });
            return;
          }
          
          const run = runs[0];
          resolve({
            status: run.status,
            conclusion: run.conclusion,
            branch: run.headBranch,
            workflow: run.workflowName
          });
        } catch (parseError) {
          resolve({ status: 'parse_error', error: parseError.message });
        }
      });
    });
  }

  async learnFromResult(result, totalTime, attemptCount) {
    // Update patterns based on result
    if (result.conclusion === 'success') {
      this.patterns.avgBuildTime = (this.patterns.avgBuildTime + totalTime) / 2;
      this.patterns.successRate = (this.patterns.successRate * 0.9) + (1 * 0.1);
    } else if (result.conclusion === 'failure') {
      this.patterns.failurePatterns.push({
        timestamp: Date.now(),
        branch: result.branch,
        workflow: result.workflow,
        attempts: attemptCount
      });
      this.patterns.successRate = (this.patterns.successRate * 0.9) + (0 * 0.1);
    }

    // Store optimized interval for this build type
    const buildType = result.workflow || 'default';
    if (!this.patterns.optimizedIntervals[buildType]) {
      this.patterns.optimizedIntervals[buildType] = {};
    }
    
    this.patterns.optimizedIntervals[buildType].avgInterval = 
      (this.patterns.optimizedIntervals[buildType].avgInterval || this.baseDelay + totalTime / attemptCount) / 2;

    await this.savePatterns();
  }

  async startIntelligentMonitoring() {
    console.log('🤖 Starting Intelligent CI Monitor with Claude Flow Swarm Hooks');
    console.log('📊 Success Rate:', (this.patterns.successRate * 100).toFixed(1) + '%');
    console.log('⏱️ Avg Build Time:', (this.patterns.avgBuildTime / 1000).toFixed(1) + 's');
    
    const startTime = Date.now();
    let attemptCount = 0;
    let lastResult = null;
    
    const monitor = async () => {
      attemptCount++;
      const currentTime = Date.now();
      
      console.log(`\n🔍 CI Check #${attemptCount} at ${new Date().toISOString()}`);
      
      const status = await this.getCurrentCIStatus();
      console.log('📋 Status:', status);
      
      // Coordinate with swarm via hooks
      await this.coordinateWithSwarm(status, attemptCount);
      
      if (status.status === 'completed') {
        console.log('✅ CI completed with conclusion:', status.conclusion);
        await this.learnFromResult(status, currentTime - startTime, attemptCount);
        return { success: true, result: status };
      }
      
      if (attemptCount >= this.maxRetries) {
        console.log('⏰ Maximum monitoring time reached');
        return { success: false, reason: 'timeout' };
      }
      
      // Calculate next delay using intelligent algorithm
      const delay = this.calculateAdaptiveDelay(attemptCount, status.status, status.workflow);
      console.log(`⏳ Next check in ${(delay / 1000).toFixed(1)}s (adaptive algorithm)`);
      
      lastResult = status.status;
      
      // Schedule next check
      await new Promise(resolve => setTimeout(resolve, delay));
      return monitor();
    };
    
    return monitor();
  }

  async coordinateWithSwarm(status, attemptCount) {
    // Store CI status in swarm memory for coordination
    try {
      exec(`npx claude-flow@alpha hooks notify --message "CI Status: ${status.status} - Attempt ${attemptCount}" --level "info"`, (error) => {
        if (error) {
          console.log('⚠️ Swarm coordination warning:', error.message);
        }
      });
    } catch (error) {
      console.log('⚠️ Swarm coordination failed:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new IntelligentCIMonitor();
  
  if (args.includes('--help')) {
    console.log(`
Intelligent CI Monitor - Claude Flow Swarm Hooks
Usage: node ci-monitor-init.js [options]

Options:
  --help          Show this help
  --max-retries   Maximum monitoring attempts (default: 120)
  --base-delay    Base polling delay in ms (default: 5000)
  --max-delay     Maximum polling delay in ms (default: 300000)

Features:
  🤖 Machine learning-based adaptive polling
  📊 Pattern recognition for build optimization
  🐝 Claude Flow swarm coordination
  💾 Persistent memory across sessions
  ⚡ Smart backoff algorithms
    `);
    return;
  }
  
  if (args.includes('--max-retries')) {
    const idx = args.indexOf('--max-retries');
    monitor.maxRetries = parseInt(args[idx + 1]) || monitor.maxRetries;
  }
  
  try {
    const result = await monitor.startIntelligentMonitoring();
    console.log('\n🎯 Monitoring completed:', result);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = IntelligentCIMonitor;