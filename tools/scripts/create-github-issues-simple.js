#!/usr/bin/env node

/**
 * Fixed GitHub Issues Creation Script
 * Creates GitHub issues with proper shell escaping
 */

const fs = require('fs');
const { spawn } = require('child_process');
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
  return new Promise((resolve, reject) => {
    const title = issue.title;
    const body = issue.description + `\n\n---\n**Labels**: ${issue.labels.join(', ')}\n**Milestone**: ${issue.milestone}\n**Estimate**: ${issue.estimate}`;
    
    if (dryRun) {
      log(`[DRY RUN] Would create issue: ${title}`, 'yellow');
      resolve({ number: 'DRY-RUN', url: 'https://github.com/dry-run' });
      return;
    }
    
    // Use spawn to properly handle escaping
    const child = spawn('gh', [
      'issue', 'create',
      '--repo', repo,
      '--title', title,
      '--body', body
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        // Extract issue number and URL from output
        const urlMatch = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
        const issueNumber = urlMatch ? urlMatch[1] : 'unknown';
        const issueUrl = urlMatch ? urlMatch[0] : 'unknown';
        
        log(`✅ Created issue #${issueNumber}: ${title}`, 'green');
        resolve({ number: issueNumber, url: issueUrl });
      } else {
        log(`❌ Error creating issue "${title}":`, 'red');
        log(`   ${errorOutput}`, 'red');
        resolve(null);
      }
    });
  });
}

function generateSummaryReport(createdIssues, issuesData) {
  log(`\n📊 ISSUE CREATION SUMMARY`, 'magenta');
  log(`${'='.repeat(50)}`, 'magenta');
  
  log(`\n📋 Project: ${issuesData.project_title}`, 'blue');
  log(`🔗 Repository: ${repo}`, 'blue');
  
  const successCount = createdIssues.filter(i => i).length;
  log(`\n📈 Statistics:`, 'cyan');
  log(`   Total Issues Created: ${successCount}`, 'cyan');
  log(`   Success Rate: ${((successCount / issuesData.issues.length) * 100).toFixed(1)}%`, 'cyan');
  
  log(`\n📋 Created Issues:`, 'green');
  createdIssues.forEach((issue, index) => {
    if (issue) {
      const originalIssue = issuesData.issues[index];
      log(`   #${issue.number}: ${originalIssue.title}`, 'green');
      log(`     URL: ${issue.url}`, 'cyan');
      log(`     Estimate: ${originalIssue.estimate}`, 'yellow');
    }
  });
  
  log(`\n🎯 Next Steps:`, 'magenta');
  log(`   1. Review created issues in GitHub: https://github.com/${repo}/issues`, 'white');
  log(`   2. Begin development with the critical issues first`, 'white');
  log(`   3. Use the synaptic-mesh branch for all development`, 'white');
}

async function main() {
  log(`🚀 Fixed GitHub Issues Creation Script`, 'magenta');
  log(`${'='.repeat(50)}`, 'magenta');
  
  // Load issues data
  const issuesData = loadIssuesData();
  if (!issuesData) {
    process.exit(1);
  }
  
  log(`\n📋 Loaded ${issuesData.issues.length} issues from ${ISSUES_FILE}`, 'blue');
  log(`🎯 Target repository: ${repo}`, 'blue');
  
  if (dryRun) {
    log(`\n⚠️  DRY RUN MODE - No actual changes will be made`, 'yellow');
  }
  
  // Create issues
  log(`\n📝 Creating GitHub issues...`, 'blue');
  const createdIssues = [];
  
  for (const issue of issuesData.issues) {
    const result = await createGitHubIssue(issue, repo, dryRun);
    createdIssues.push(result);
    
    // Small delay to avoid rate limiting
    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate summary report
  generateSummaryReport(createdIssues, issuesData);
  
  log(`\n✅ Issue creation completed!`, 'green');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}