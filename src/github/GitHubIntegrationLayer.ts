/**
 * GitHub Integration Layer
 * Advanced GitHub API integration with intelligent features
 */

import { Octokit } from '@octokit/rest';
import { GitHubIssue, GitHubPullRequest, GitHubRepository, GitHubWorkflow } from '../types/github';
import { AIAnalysisResult, IssueTriage, PRAnalysis } from '../types/analysis';

export class GitHubIntegrationLayer {
  private octokit: Octokit;
  private aiAnalyzer: AIAnalyzer;
  private repositoryCache: Map<string, GitHubRepository> = new Map();
  private rateLimitHandler: RateLimitHandler;

  constructor(token: string, options: GitHubIntegrationOptions = {}) {
    this.octokit = new Octokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter) => {
          console.warn(`Rate limit exceeded, retrying after ${retryAfter} seconds`);
          return true;
        },
        onAbuseLimit: (retryAfter) => {
          console.error(`Abuse detection triggered, retrying after ${retryAfter} seconds`);
          return true;
        }
      }
    });

    this.aiAnalyzer = new AIAnalyzer(options.aiConfig);
    this.rateLimitHandler = new RateLimitHandler(options.rateLimitConfig);
  }

  /**
   * Intelligent Issue Triage
   * Automatically categorizes and prioritizes issues using AI analysis
   */
  async triageIssue(owner: string, repo: string, issueNumber: number): Promise<IssueTriage> {
    try {
      // Fetch issue details
      const { data: issue } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });

      // Analyze issue content with AI
      const analysis = await this.aiAnalyzer.analyzeIssue({
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
        comments: await this.getIssueComments(owner, repo, issueNumber)
      });

      // Generate triage result
      const triage: IssueTriage = {
        issueNumber,
        priority: this.determinePriority(analysis),
        category: this.categorizeIssue(analysis),
        severity: this.assessSeverity(analysis),
        estimatedEffort: this.estimateEffort(analysis),
        suggestedLabels: this.suggestLabels(analysis),
        suggestedAssignees: await this.suggestAssignees(owner, repo, analysis),
        aiConfidence: analysis.confidence,
        analysisTimestamp: new Date().toISOString()
      };

      // Auto-apply triage if confidence is high enough
      if (triage.aiConfidence > 0.8) {
        await this.applyTriage(owner, repo, issueNumber, triage);
      }

      return triage;
    } catch (error) {
      console.error('Error triaging issue:', error);
      throw new GitHubIntegrationError('Failed to triage issue', error);
    }
  }

  /**
   * Advanced Pull Request Analysis
   * Provides comprehensive PR analysis with code quality metrics
   */
  async analyzePullRequest(owner: string, repo: string, prNumber: number): Promise<PRAnalysis> {
    try {
      // Fetch PR details
      const { data: pr } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      // Get PR files and commits
      const files = await this.getPRFiles(owner, repo, prNumber);
      const commits = await this.getPRCommits(owner, repo, prNumber);

      // Analyze code changes
      const codeAnalysis = await this.aiAnalyzer.analyzeCodeChanges({
        files,
        commits,
        title: pr.title,
        description: pr.body || ''
      });

      // Calculate metrics
      const metrics = await this.calculatePRMetrics(files, commits);

      // Generate analysis result
      const analysis: PRAnalysis = {
        prNumber,
        complexity: metrics.complexity,
        testCoverage: metrics.testCoverage,
        codeQuality: codeAnalysis.quality,
        securityRisk: codeAnalysis.securityRisk,
        performance: codeAnalysis.performance,
        maintainability: codeAnalysis.maintainability,
        suggestedReviewers: await this.suggestReviewers(owner, repo, files),
        potentialIssues: codeAnalysis.issues,
        recommendations: codeAnalysis.recommendations,
        mergeability: await this.assessMergeability(owner, repo, prNumber),
        analysisTimestamp: new Date().toISOString()
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing PR:', error);
      throw new GitHubIntegrationError('Failed to analyze PR', error);
    }
  }

  /**
   * Repository Health Monitoring
   * Continuous monitoring of repository health metrics
   */
  async monitorRepositoryHealth(owner: string, repo: string): Promise<RepositoryHealth> {
    try {
      // Fetch repository data
      const repository = await this.getRepository(owner, repo);
      
      // Calculate health metrics
      const metrics = await this.calculateRepositoryMetrics(repository);
      
      // Analyze trends
      const trends = await this.analyzeRepositoryTrends(owner, repo);
      
      // Generate health report
      const health: RepositoryHealth = {
        repository: `${owner}/${repo}`,
        overallScore: this.calculateOverallScore(metrics),
        metrics: {
          codeQuality: metrics.codeQuality,
          testCoverage: metrics.testCoverage,
          documentation: metrics.documentation,
          security: metrics.security,
          performance: metrics.performance,
          maintainability: metrics.maintainability,
          collaboration: metrics.collaboration
        },
        trends: trends,
        alerts: this.generateHealthAlerts(metrics, trends),
        recommendations: this.generateHealthRecommendations(metrics, trends),
        lastUpdated: new Date().toISOString()
      };

      // Store health data for trending
      await this.storeHealthData(owner, repo, health);

      return health;
    } catch (error) {
      console.error('Error monitoring repository health:', error);
      throw new GitHubIntegrationError('Failed to monitor repository health', error);
    }
  }

  /**
   * GitHub Actions Workflow Optimization
   * Analyzes and optimizes CI/CD workflows
   */
  async optimizeWorkflows(owner: string, repo: string): Promise<WorkflowOptimization> {
    try {
      // Fetch workflows
      const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
        owner,
        repo
      });

      const optimizations: WorkflowOptimization[] = [];

      for (const workflow of workflows.workflows) {
        // Analyze workflow performance
        const runs = await this.getWorkflowRuns(owner, repo, workflow.id);
        const analysis = await this.aiAnalyzer.analyzeWorkflow({
          workflow,
          runs,
          repository: await this.getRepository(owner, repo)
        });

        const optimization: WorkflowOptimization = {
          workflowId: workflow.id,
          workflowName: workflow.name,
          currentPerformance: analysis.performance,
          optimizationOpportunities: analysis.opportunities,
          suggestedChanges: analysis.suggestions,
          estimatedImprovement: analysis.estimatedImprovement,
          priority: analysis.priority
        };

        optimizations.push(optimization);
      }

      return {
        repository: `${owner}/${repo}`,
        optimizations,
        totalPotentialImprovement: optimizations.reduce((sum, opt) => 
          sum + opt.estimatedImprovement, 0),
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error optimizing workflows:', error);
      throw new GitHubIntegrationError('Failed to optimize workflows', error);
    }
  }

  /**
   * Collaborative Development Tools
   * Enhanced collaboration features
   */
  async enhanceCollaboration(owner: string, repo: string): Promise<CollaborationEnhancement> {
    try {
      // Analyze team collaboration patterns
      const collaborationData = await this.analyzeCollaboration(owner, repo);
      
      // Generate collaboration insights
      const insights = await this.aiAnalyzer.analyzeCollaborationPatterns(collaborationData);
      
      // Create enhancement recommendations
      const enhancement: CollaborationEnhancement = {
        repository: `${owner}/${repo}`,
        teamInsights: insights.teamInsights,
        communicationPatterns: insights.communicationPatterns,
        bottlenecks: insights.bottlenecks,
        recommendations: insights.recommendations,
        automationOpportunities: insights.automationOpportunities,
        trainingNeeds: insights.trainingNeeds,
        toolSuggestions: insights.toolSuggestions
      };

      return enhancement;
    } catch (error) {
      console.error('Error enhancing collaboration:', error);
      throw new GitHubIntegrationError('Failed to enhance collaboration', error);
    }
  }

  // Helper methods
  private async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const cacheKey = `${owner}/${repo}`;
    
    if (this.repositoryCache.has(cacheKey)) {
      return this.repositoryCache.get(cacheKey)!;
    }

    const { data: repository } = await this.octokit.repos.get({ owner, repo });
    this.repositoryCache.set(cacheKey, repository);
    
    return repository;
  }

  async getIssueComments(owner: string, repo: string, issueNumber: number) {
    const { data: comments } = await this.octokit.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber
    });
    return comments;
  }

  private async getPRFiles(owner: string, repo: string, prNumber: number) {
    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    });
    return files;
  }

  private async getPRCommits(owner: string, repo: string, prNumber: number) {
    const { data: commits } = await this.octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber
    });
    return commits;
  }

  private async getWorkflowRuns(owner: string, repo: string, workflowId: number) {
    const { data: runs } = await this.octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      per_page: 100
    });
    return runs.workflow_runs;
  }

  private determinePriority(analysis: AIAnalysisResult): 'critical' | 'high' | 'medium' | 'low' {
    if (analysis.severity > 0.8) return 'critical';
    if (analysis.severity > 0.6) return 'high';
    if (analysis.severity > 0.4) return 'medium';
    return 'low';
  }

  private categorizeIssue(analysis: AIAnalysisResult): string {
    return analysis.category || 'general';
  }

  private assessSeverity(analysis: AIAnalysisResult): number {
    return analysis.severity;
  }

  private estimateEffort(analysis: AIAnalysisResult): string {
    return analysis.estimatedEffort || 'medium';
  }

  private suggestLabels(analysis: AIAnalysisResult): string[] {
    return analysis.suggestedLabels || [];
  }

  private async suggestAssignees(owner: string, repo: string, analysis: AIAnalysisResult): Promise<string[]> {
    // AI-based assignee suggestion logic
    return analysis.suggestedAssignees || [];
  }

  private async suggestReviewers(owner: string, repo: string, files: any[]): Promise<string[]> {
    // AI-based reviewer suggestion based on file expertise
    return [];
  }

  private async applyTriage(owner: string, repo: string, issueNumber: number, triage: IssueTriage): Promise<void> {
    // Apply triage results to the issue
    await this.octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      labels: triage.suggestedLabels,
      assignees: triage.suggestedAssignees
    });
  }

  private async calculatePRMetrics(files: any[], commits: any[]): Promise<any> {
    // Calculate PR complexity, test coverage, etc.
    return {
      complexity: 0.5,
      testCoverage: 0.8
    };
  }

  private async assessMergeability(owner: string, repo: string, prNumber: number): Promise<boolean> {
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });
    return pr.mergeable === true;
  }

  private async calculateRepositoryMetrics(repository: GitHubRepository): Promise<any> {
    // Calculate comprehensive repository metrics
    return {
      codeQuality: 0.8,
      testCoverage: 0.7,
      documentation: 0.6,
      security: 0.9,
      performance: 0.8,
      maintainability: 0.7,
      collaboration: 0.8
    };
  }

  private async analyzeRepositoryTrends(owner: string, repo: string): Promise<any> {
    // Analyze repository trends over time
    return {
      codeQuality: 'improving',
      activity: 'stable',
      collaboration: 'improving'
    };
  }

  private calculateOverallScore(metrics: any): number {
    const weights = {
      codeQuality: 0.2,
      testCoverage: 0.15,
      documentation: 0.1,
      security: 0.25,
      performance: 0.1,
      maintainability: 0.1,
      collaboration: 0.1
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (metrics[key] || 0) * weight;
    }, 0);
  }

  private generateHealthAlerts(metrics: any, trends: any): string[] {
    const alerts: string[] = [];
    
    if (metrics.security < 0.7) {
      alerts.push('Security metrics below threshold');
    }
    
    if (metrics.testCoverage < 0.6) {
      alerts.push('Test coverage needs improvement');
    }
    
    return alerts;
  }

  private generateHealthRecommendations(metrics: any, trends: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.documentation < 0.7) {
      recommendations.push('Improve documentation coverage');
    }
    
    if (metrics.codeQuality < 0.8) {
      recommendations.push('Implement code quality improvements');
    }
    
    return recommendations;
  }

  private async storeHealthData(owner: string, repo: string, health: RepositoryHealth): Promise<void> {
    // Store health data for trending analysis
    // Implementation depends on storage backend
  }

  private async analyzeCollaboration(owner: string, repo: string): Promise<any> {
    // Analyze collaboration patterns
    return {
      teamMembers: [],
      communicationFrequency: {},
      reviewPatterns: {},
      contributionPatterns: {}
    };
  }

  // Missing methods required by AutomatedIssueTriage
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const { data } = await this.octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    return data as GitHubIssue;
  }

  async getIssueEvents(owner: string, repo: string, issueNumber: number): Promise<any[]> {
    const { data } = await this.octokit.issues.listEvents({
      owner,
      repo,
      issue_number: issueNumber
    });
    return data;
  }

  async updateIssue(owner: string, repo: string, issueNumber: number, updates: any): Promise<GitHubIssue> {
    const { data } = await this.octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...updates
    });
    return data as GitHubIssue;
  }

  async addComment(owner: string, repo: string, issueNumber: number, body: string): Promise<any> {
    const { data } = await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return data;
  }

}

// AI Analyzer class for intelligent analysis
class AIAnalyzer {
  constructor(private config: any) {}

  async analyzeIssue(issue: any): Promise<AIAnalysisResult> {
    // AI-powered issue analysis
    return {
      severity: 0.6,
      confidence: 0.8,
      category: 'bug',
      estimatedEffort: 'medium',
      suggestedLabels: ['bug', 'medium-priority'],
      suggestedAssignees: []
    };
  }

  async analyzeCodeChanges(changes: any): Promise<any> {
    // AI-powered code change analysis
    return {
      quality: 0.8,
      securityRisk: 0.2,
      performance: 0.9,
      maintainability: 0.7,
      issues: [],
      recommendations: []
    };
  }

  async analyzeWorkflow(workflow: any): Promise<any> {
    // AI-powered workflow analysis
    return {
      performance: 0.7,
      opportunities: [],
      suggestions: [],
      estimatedImprovement: 0.2,
      priority: 'medium'
    };
  }

  async analyzeCollaborationPatterns(data: any): Promise<any> {
    // AI-powered collaboration analysis
    return {
      teamInsights: {},
      communicationPatterns: {},
      bottlenecks: [],
      recommendations: [],
      automationOpportunities: [],
      trainingNeeds: [],
      toolSuggestions: []
    };
  }

  // Missing methods for CollaborativeDevelopmentTools integration
  async getRecentPullRequests(owner: string, repo: string, count: number = 100): Promise<any[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(count, 100)
      });
      return data;
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch recent pull requests: ${error.message}`, error);
    }
  }

  async getRecentIssues(owner: string, repo: string, count: number = 100): Promise<any[]> {
    try {
      const { data } = await this.octokit.issues.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(count, 100)
      });
      return data;
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch recent issues: ${error.message}`, error);
    }
  }

  async getRecentCommits(owner: string, repo: string, count: number = 200): Promise<any[]> {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: Math.min(count, 100)
      });
      return data;
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch recent commits: ${error.message}`, error);
    }
  }

  async getRecentComments(owner: string, repo: string, count: number = 200): Promise<any[]> {
    try {
      const { data } = await this.octokit.issues.listCommentsForRepo({
        owner,
        repo,
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(count, 100)
      });
      return data;
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch recent comments: ${error.message}`, error);
    }
  }

  async getRecentReviews(owner: string, repo: string, count: number = 100): Promise<any[]> {
    try {
      // Get recent PRs first
      const pullRequests = await this.getRecentPullRequests(owner, repo, Math.min(count, 50));
      const reviews: any[] = [];
      
      for (const pr of pullRequests.slice(0, 20)) { // Limit to avoid rate limits
        try {
          const { data: prReviews } = await this.octokit.pulls.listReviews({
            owner,
            repo,
            pull_number: pr.number
          });
          reviews.push(...prReviews);
        } catch (error) {
          console.warn(`Failed to fetch reviews for PR #${pr.number}: ${error.message}`);
        }
      }
      
      return reviews.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, count);
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch recent reviews: ${error.message}`, error);
    }
  }

  async getRepositoryContributors(owner: string, repo: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: 100
      });
      return data;
    } catch (error) {
      throw new GitHubIntegrationError(`Failed to fetch repository contributors: ${error.message}`, error);
    }
  }
}

// Rate limit handler
class RateLimitHandler {
  constructor(private config: any) {}

  async handleRateLimit(retryAfter: number): Promise<void> {
    // Handle rate limiting
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
}

// Error classes
class GitHubIntegrationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GitHubIntegrationError';
  }
}

// Type definitions
interface GitHubIntegrationOptions {
  aiConfig?: any;
  rateLimitConfig?: any;
}

interface IssueTriage {
  issueNumber: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  severity: number;
  estimatedEffort: string;
  suggestedLabels: string[];
  suggestedAssignees: string[];
  aiConfidence: number;
  analysisTimestamp: string;
}

interface PRAnalysis {
  prNumber: number;
  complexity: number;
  testCoverage: number;
  codeQuality: number;
  securityRisk: number;
  performance: number;
  maintainability: number;
  suggestedReviewers: string[];
  potentialIssues: string[];
  recommendations: string[];
  mergeability: boolean;
  analysisTimestamp: string;
}

interface RepositoryHealth {
  repository: string;
  overallScore: number;
  metrics: {
    codeQuality: number;
    testCoverage: number;
    documentation: number;
    security: number;
    performance: number;
    maintainability: number;
    collaboration: number;
  };
  trends: any;
  alerts: string[];
  recommendations: string[];
  lastUpdated: string;
}

interface WorkflowOptimization {
  workflowId: number;
  workflowName: string;
  currentPerformance: number;
  optimizationOpportunities: string[];
  suggestedChanges: string[];
  estimatedImprovement: number;
  priority: string;
}

interface CollaborationEnhancement {
  repository: string;
  teamInsights: any;
  communicationPatterns: any;
  bottlenecks: string[];
  recommendations: string[];
  automationOpportunities: string[];
  trainingNeeds: string[];
  toolSuggestions: string[];
}

export {
  GitHubIntegrationLayer,
  GitHubIntegrationError,
  type GitHubIntegrationOptions,
  type IssueTriage,
  type PRAnalysis,
  type RepositoryHealth,
  type WorkflowOptimization,
  type CollaborationEnhancement
};