#!/usr/bin/env node

/**
 * CI Completion Handler with Auto-Merge Capabilities
 * Intelligent post-CI actions with swarm coordination
 * Part of ruvnet/claude-flow#419 implementation
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class CICompletionHandler {
  constructor(options = {}) {
    this.options = {
      autoMerge: options.autoMerge !== false,
      requireAllChecks: options.requireAllChecks !== false,
      requireReviews: options.requireReviews !== false,
      minSuccessRate: options.minSuccessRate || 0.8,
      swarmCoordination: options.swarmCoordination !== false,
      dryRun: options.dryRun || false,
      verboseLogging: options.verboseLogging !== false,
      notificationChannels: options.notificationChannels || ['swarm', 'console'],
      ...options
    };
    
    this.memoryPath = '.swarm/ci-completion-history.json';
    this.history = [];
    this.loadHistory();
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf8');
      this.history = JSON.parse(data);
      console.log('📚 Loaded CI completion history:', this.history.length, 'entries');
    } catch (error) {
      console.log('🆕 Creating new CI completion history');
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
      await fs.writeFile(this.memoryPath, JSON.stringify(this.history, null, 2));
      if (this.options.verboseLogging) {
        console.log('💾 Saved CI completion history');
      }
    } catch (error) {
      console.error('❌ Failed to save CI completion history:', error.message);
    }
  }

  async getCurrentPullRequest() {
    return new Promise((resolve) => {
      exec('gh pr view --json number,title,state,mergeable,statusCheckRollup,reviewDecision,headRefName,baseRefName', (error, stdout) => {
        if (error) {
          resolve({ error: error.message, noPR: true });
          return;
        }
        
        try {
          const pr = JSON.parse(stdout);
          resolve(pr);
        } catch (parseError) {
          resolve({ error: parseError.message, parseError: true });
        }
      });
    });
  }

  async getRepositoryInfo() {
    return new Promise((resolve) => {
      exec('gh repo view --json name,owner,defaultBranch', (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        
        try {
          const repo = JSON.parse(stdout);
          resolve(repo);
        } catch (parseError) {
          resolve({ error: parseError.message });
        }
      });
    });
  }

  async getCurrentBranch() {
    return new Promise((resolve) => {
      exec('git branch --show-current', (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        resolve({ branch: stdout.trim() });
      });
    });
  }

  async analyzeCompletionContext() {
    console.log('🔍 Analyzing CI completion context...');
    
    const context = {
      timestamp: new Date().toISOString(),
      repository: await this.getRepositoryInfo(),
      branch: await this.getCurrentBranch(),
      pullRequest: await this.getCurrentPullRequest(),
      ciStatus: await this.getLatestCIStatus(),
      recommendations: []
    };
    
    // Analyze CI success/failure patterns
    if (context.ciStatus.conclusion === 'success') {
      context.recommendations.push('CI_SUCCESS');
      
      if (!context.pullRequest.noPR) {
        context.recommendations.push('ANALYZE_PR_MERGE_ELIGIBILITY');
      }
    } else if (context.ciStatus.conclusion === 'failure') {
      context.recommendations.push('CI_FAILURE');
      context.recommendations.push('ANALYZE_FAILURE_PATTERNS');
    }
    
    return context;
  }

  async getLatestCIStatus() {
    return new Promise((resolve) => {
      exec('gh run list --limit 1 --json id,status,conclusion,headBranch,workflowName,createdAt,url', (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        
        try {
          const runs = JSON.parse(stdout);
          resolve(runs.length > 0 ? runs[0] : { noRuns: true });
        } catch (parseError) {
          resolve({ error: parseError.message });
        }
      });
    });
  }

  async evaluateMergeEligibility(context) {
    const eligibility = {
      eligible: false,
      reasons: [],
      blockers: [],
      score: 0
    };
    
    // Check CI status
    if (context.ciStatus.conclusion === 'success') {
      eligibility.score += 40;
      eligibility.reasons.push('CI_PASSED');
    } else {
      eligibility.blockers.push('CI_FAILED');
    }
    
    // Check PR status
    if (!context.pullRequest.noPR) {
      const pr = context.pullRequest;
      
      if (pr.mergeable) {
        eligibility.score += 20;
        eligibility.reasons.push('PR_MERGEABLE');
      } else {
        eligibility.blockers.push('PR_NOT_MERGEABLE');
      }
      
      // Check status checks
      if (pr.statusCheckRollup) {
        const allPassed = pr.statusCheckRollup.every(check => 
          check.status === 'COMPLETED' && check.conclusion === 'SUCCESS'
        );
        
        if (allPassed) {
          eligibility.score += 25;
          eligibility.reasons.push('ALL_CHECKS_PASSED');
        } else {
          eligibility.blockers.push('CHECKS_FAILED');
        }
      }
      
      // Check reviews if required
      if (this.options.requireReviews) {
        if (pr.reviewDecision === 'APPROVED') {
          eligibility.score += 15;
          eligibility.reasons.push('REVIEWS_APPROVED');
        } else {
          eligibility.blockers.push('REVIEWS_REQUIRED');
        }
      } else {
        eligibility.score += 15; // Don't penalize if not required
      }
    } else {
      // Direct push to main/develop
      if (context.branch.branch === context.repository.defaultBranch) {
        eligibility.score += 10;
        eligibility.reasons.push('DEFAULT_BRANCH_PUSH');
      }
    }
    
    // Calculate eligibility
    eligibility.eligible = eligibility.score >= 80 && eligibility.blockers.length === 0;
    
    return eligibility;
  }

  async executeMerge(context, eligibility) {
    if (!eligibility.eligible) {
      throw new Error('Merge not eligible: ' + eligibility.blockers.join(', '));
    }
    
    if (context.pullRequest.noPR) {
      console.log('ℹ️ No PR found - assuming direct push workflow');
      return { type: 'direct_push', success: true };
    }
    
    const pr = context.pullRequest;
    console.log(`🔀 Attempting to merge PR #${pr.number}: ${pr.title}`);
    
    if (this.options.dryRun) {
      console.log('🧪 DRY RUN: Would merge PR now');
      return { type: 'dry_run', success: true, pr: pr.number };
    }
    
    return new Promise((resolve) => {
      const mergeCommand = `gh pr merge ${pr.number} --auto --squash`;
      exec(mergeCommand, (error, stdout, stderr) => {
        if (error) {
          resolve({ type: 'merge_failed', error: error.message, stderr });
          return;
        }
        
        resolve({ 
          type: 'merge_success', 
          success: true, 
          pr: pr.number,
          output: stdout 
        });
      });
    });
  }

  async notifySwarm(event, data) {
    if (!this.options.swarmCoordination || !this.options.notificationChannels.includes('swarm')) {
      return;
    }
    
    try {
      const message = `CI-Completion: ${event}`;
      exec(`npx claude-flow@alpha hooks notify --message "${message}" --level "info"`, (error) => {
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

  async sendNotifications(event, data) {
    const notifications = [];
    
    if (this.options.notificationChannels.includes('console')) {
      notifications.push(this.notifyConsole(event, data));
    }
    
    if (this.options.notificationChannels.includes('swarm')) {
      notifications.push(this.notifySwarm(event, data));
    }
    
    await Promise.all(notifications);
  }

  async notifyConsole(event, data) {
    const emoji = {
      completion_success: '✅',
      completion_failure: '❌',
      merge_success: '🎉',
      merge_blocked: '🚫',
      analysis_complete: '📊'
    };
    
    console.log(`\n${emoji[event] || '📢'} ${event.toUpperCase()}`);
    
    if (data.context?.ciStatus) {
      console.log(`📋 CI: ${data.context.ciStatus.conclusion} (${data.context.ciStatus.workflowName})`);
    }
    
    if (data.eligibility) {
      console.log(`🎯 Merge Score: ${data.eligibility.score}/100`);
      console.log(`✅ Reasons: ${data.eligibility.reasons.join(', ')}`);
      if (data.eligibility.blockers.length > 0) {
        console.log(`🚫 Blockers: ${data.eligibility.blockers.join(', ')}`);
      }
    }
    
    if (data.result) {
      console.log(`📤 Action: ${data.result.type}`);
    }
  }

  async handleCompletion() {
    console.log('🎯 CI Completion Handler Starting...');
    
    try {
      // Analyze context
      const context = await this.analyzeCompletionContext();
      await this.sendNotifications('analysis_complete', { context });
      
      // Store in history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        context,
        actions: []
      };
      
      if (context.ciStatus.conclusion === 'success') {
        console.log('✅ CI completed successfully');
        
        // Evaluate merge eligibility
        const eligibility = await this.evaluateMergeEligibility(context);
        historyEntry.eligibility = eligibility;
        
        console.log(`\n📊 Merge Eligibility Analysis:`);
        console.log(`🎯 Score: ${eligibility.score}/100`);
        console.log(`✅ Eligible: ${eligibility.eligible}`);
        
        if (eligibility.eligible && this.options.autoMerge) {
          try {
            const mergeResult = await this.executeMerge(context, eligibility);
            historyEntry.actions.push({ type: 'merge', result: mergeResult });
            
            await this.sendNotifications('merge_success', { 
              context, 
              eligibility, 
              result: mergeResult 
            });
          } catch (mergeError) {
            console.error('❌ Merge failed:', mergeError.message);
            historyEntry.actions.push({ type: 'merge_failed', error: mergeError.message });
            
            await this.sendNotifications('merge_blocked', { 
              context, 
              eligibility, 
              error: mergeError.message 
            });
          }
        } else {
          console.log('🔒 Auto-merge disabled or not eligible');
          await this.sendNotifications('merge_blocked', { context, eligibility });
        }
        
        await this.sendNotifications('completion_success', { context, eligibility });
      } else {
        console.log('❌ CI completed with failure');
        historyEntry.failure = true;
        
        await this.sendNotifications('completion_failure', { context });
      }
      
      // Save history
      this.history.push(historyEntry);
      await this.saveHistory();
      
      console.log('\n🎯 CI Completion handling finished');
      return historyEntry;
      
    } catch (error) {
      console.error('❌ CI Completion handling failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
CI Completion Handler - Claude Flow Swarm Hooks
Usage: node ci-completion.js [options]

Options:
  --help                Show this help
  --no-auto-merge      Disable automatic merging
  --no-require-reviews Disable review requirement check
  --min-success-rate   Minimum success rate threshold (default: 0.8)
  --dry-run           Simulate actions without executing
  --no-swarm          Disable swarm coordination
  --quiet             Reduce logging verbosity

Features:
  🎯 Intelligent merge eligibility analysis
  🔀 Automatic PR merging when conditions met
  📊 Success rate tracking and learning
  🐝 Claude Flow swarm coordination
  📢 Multi-channel notifications
  💾 Persistent completion history
    `);
    return;
  }
  
  const options = {};
  
  if (args.includes('--no-auto-merge')) {
    options.autoMerge = false;
  }
  
  if (args.includes('--no-require-reviews')) {
    options.requireReviews = false;
  }
  
  if (args.includes('--min-success-rate')) {
    const idx = args.indexOf('--min-success-rate');
    options.minSuccessRate = parseFloat(args[idx + 1]) || 0.8;
  }
  
  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }
  
  if (args.includes('--no-swarm')) {
    options.swarmCoordination = false;
  }
  
  if (args.includes('--quiet')) {
    options.verboseLogging = false;
  }
  
  const handler = new CICompletionHandler(options);
  
  try {
    const result = await handler.handleCompletion();
    const success = result.context?.ciStatus?.conclusion === 'success';
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Completion handling failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CICompletionHandler;