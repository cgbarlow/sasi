#!/usr/bin/env node

/**
 * GitHub Issues Creation Script
 * Creates comprehensive GitHub issues for SASI/Synaptic-mesh integration project
 * 
 * Usage:
 *   node create-github-issues.js [--dry-run] [--repo=owner/repo]
 * 
 * Requirements:
 *   - GitHub CLI (gh) installed and authenticated
 *   - Repository access permissions
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const DEFAULT_REPO = 'cgbarlow/sasi';
const ISSUES_FILE = 'github-issues.json';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const repoArg = args.find(arg => arg.startsWith('--repo='));
const repo = repoArg ? repoArg.split('=')[1] : DEFAULT_REPO;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    log('✅ GitHub CLI is installed', 'green');
    return true;
  } catch (error) {
    log('❌ GitHub CLI is not installed. Please install it first:', 'red');
    log('   https://cli.github.com/', 'cyan');
    return false;
  }
}

function checkGitHubAuth() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    log('✅ GitHub CLI is authenticated', 'green');
    return true;
  } catch (error) {
    log('❌ GitHub CLI is not authenticated. Please run:', 'red');
    log('   gh auth login', 'cyan');
    return false;
  }
}

function loadIssuesData() {
  try {
    const issuesPath = path.join(__dirname, ISSUES_FILE);
    const rawData = fs.readFileSync(issuesPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    log(`❌ Error loading issues data from ${ISSUES_FILE}:`, 'red');
    log(`   ${error.message}`, 'red');
    return null;
  }
}

function createGitHubIssue(issue, repo, dryRun = false) {
  const title = issue.title;
  const body = issue.description;
  const labels = issue.labels.join(',');
  
  const command = [
    'gh', 'issue', 'create',
    '--repo', repo,
    '--title', `"${title}"`,
    '--body', `"${body}"`,
    '--label', labels
  ].join(' ');
  
  if (dryRun) {
    log(`[DRY RUN] Would create issue: ${title}`, 'yellow');
    log(`[DRY RUN] Command: ${command}`, 'cyan');
    return { number: 'DRY-RUN', url: 'https://github.com/dry-run' };
  }
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe' 
    });
    
    // Extract issue number and URL from output
    const urlMatch = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
    const issueNumber = urlMatch ? urlMatch[1] : 'unknown';
    const issueUrl = urlMatch ? urlMatch[0] : 'unknown';
    
    log(`✅ Created issue #${issueNumber}: ${title}`, 'green');
    return { number: issueNumber, url: issueUrl };
  } catch (error) {
    log(`❌ Error creating issue "${title}":`, 'red');
    log(`   ${error.message}`, 'red');
    return null;
  }
}

function createLabels(labels, repo, dryRun = false) {
  log(`\\n📋 Creating labels for repository: ${repo}`, 'blue');
  
  const createdLabels = [];
  
  for (const label of labels) {
    const command = [
      'gh', 'label', 'create',
      '--repo', repo,
      '--name', `"${label.name}"`,
      '--description', `"${label.description}"`,
      '--color', label.color
    ].join(' ');
    
    if (dryRun) {
      log(`[DRY RUN] Would create label: ${label.name}`, 'yellow');
      continue;
    }
    
    try {
      execSync(command, { stdio: 'ignore' });
      log(`✅ Created label: ${label.name}`, 'green');
      createdLabels.push(label.name);
    } catch (error) {
      // Label might already exist, which is fine
      if (error.message.includes('already exists')) {
        log(`⚠️  Label already exists: ${label.name}`, 'yellow');
      } else {
        log(`❌ Error creating label "${label.name}": ${error.message}`, 'red');
      }
    }
  }
  
  return createdLabels;
}

function createMilestones(milestones, repo, dryRun = false) {
  log(`\\n🎯 Creating milestones for repository: ${repo}`, 'blue');
  
  const createdMilestones = [];
  
  for (const milestone of milestones) {
    const command = [
      'gh', 'api',
      `repos/${repo}/milestones`,
      '--method', 'POST',
      '--field', `title=${milestone.name}`,
      '--field', `description=${milestone.description}`,
      '--field', `due_on=${milestone.deadline}T23:59:59Z`
    ].join(' ');
    
    if (dryRun) {
      log(`[DRY RUN] Would create milestone: ${milestone.name}`, 'yellow');
      continue;
    }
    
    try {
      execSync(command, { stdio: 'ignore' });
      log(`✅ Created milestone: ${milestone.name}`, 'green');
      createdMilestones.push(milestone.name);
    } catch (error) {
      // Milestone might already exist
      if (error.message.includes('already exists')) {
        log(`⚠️  Milestone already exists: ${milestone.name}`, 'yellow');
      } else {
        log(`❌ Error creating milestone "${milestone.name}": ${error.message}`, 'red');
      }
    }
  }
  
  return createdMilestones;
}

function generateSummaryReport(createdIssues, issuesData) {
  log(`\\n📊 ISSUE CREATION SUMMARY`, 'magenta');
  log(`${'='.repeat(50)}`, 'magenta');
  
  log(`\\n📋 Project: ${issuesData.project_title}`, 'blue');
  log(`📝 Description: ${issuesData.project_description}`, 'blue');
  log(`🔗 Repository: ${repo}`, 'blue');
  
  log(`\\n📈 Statistics:`, 'cyan');
  log(`   Total Issues Created: ${createdIssues.length}`, 'cyan');
  log(`   Success Rate: ${((createdIssues.filter(i => i).length / issuesData.issues.length) * 100).toFixed(1)}%`, 'cyan');
  
  log(`\\n📋 Created Issues:`, 'green');
  createdIssues.forEach((issue, index) => {
    if (issue) {
      const originalIssue = issuesData.issues[index];
      log(`   #${issue.number}: ${originalIssue.title}`, 'green');
      log(`     URL: ${issue.url}`, 'cyan');
      log(`     Priority: ${originalIssue.labels.includes('critical') ? 'Critical' : originalIssue.labels.includes('high-priority') ? 'High' : 'Medium'}`, 'yellow');
      log(`     Estimate: ${originalIssue.estimate}`, 'yellow');
    }
  });
  
  log(`\\n🎯 Next Steps:`, 'magenta');
  log(`   1. Review created issues in GitHub`, 'white');
  log(`   2. Assign team members to issues`, 'white');
  log(`   3. Set up project board for tracking`, 'white');
  log(`   4. Begin development with Issue #1 (Neural Agent Integration)`, 'white');
  log(`   5. Monitor progress using the MCP dashboard`, 'white');
  
  log(`\\n📧 Integration Commands:`, 'cyan');
  log(`   # Initialize swarm for issue tracking`, 'cyan');
  log(`   npx claude-flow@alpha hooks pre-task --description "Starting SASI/Synaptic-mesh integration"`, 'cyan');
  log(`   \\n   # Track issue progress`, 'cyan');
  log(`   npx claude-flow@alpha hooks notify --message "issue-#1-started: Neural Agent Integration"`, 'cyan');
}

function main() {
  log(`🚀 GitHub Issues Creation Script`, 'magenta');
  log(`${'='.repeat(50)}`, 'magenta');
  
  // Check prerequisites
  if (!checkGitHubCLI() || !checkGitHubAuth()) {
    process.exit(1);
  }
  
  // Load issues data
  const issuesData = loadIssuesData();
  if (!issuesData) {
    process.exit(1);
  }
  
  log(`\\n📋 Loaded ${issuesData.issues.length} issues from ${ISSUES_FILE}`, 'blue');
  log(`🎯 Target repository: ${repo}`, 'blue');
  
  if (dryRun) {
    log(`\\n⚠️  DRY RUN MODE - No actual changes will be made`, 'yellow');
  }
  
  // Create labels first
  createLabels(issuesData.labels, repo, dryRun);
  
  // Create milestones
  createMilestones(issuesData.milestones, repo, dryRun);
  
  // Create issues
  log(`\\n📝 Creating GitHub issues...`, 'blue');
  const createdIssues = [];
  
  for (const issue of issuesData.issues) {
    const result = createGitHubIssue(issue, repo, dryRun);
    createdIssues.push(result);
    
    // Small delay to avoid rate limiting
    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate summary report
  generateSummaryReport(createdIssues, issuesData);
  
  log(`\\n✅ Issue creation completed!`, 'green');
}

// Add async support for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { createGitHubIssue, createLabels, createMilestones };