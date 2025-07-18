/**
 * Repository Health Monitor
 * Comprehensive repository health monitoring and analysis
 */

import { GitHubIntegrationLayer } from './GitHubIntegrationLayer';
import { MetricsCollector } from '../ai/MetricsCollector';
import { TrendAnalyzer } from '../ai/TrendAnalyzer';
import { AlertManager } from '../ai/AlertManager';

export class RepositoryHealthMonitor {
  private githubIntegration: GitHubIntegrationLayer;
  private metricsCollector: MetricsCollector;
  private trendAnalyzer: TrendAnalyzer;
  private alertManager: AlertManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCache: Map<string, RepositoryHealth> = new Map();

  constructor(options: HealthMonitorOptions) {
    this.githubIntegration = new GitHubIntegrationLayer(options.githubToken);
    this.metricsCollector = new MetricsCollector(options.metricsConfig);
    this.trendAnalyzer = new TrendAnalyzer(options.trendConfig);
    this.alertManager = new AlertManager(options.alertConfig);
  }

  /**
   * Start continuous monitoring of repository health
   */
  startMonitoring(owner: string, repo: string, interval: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.assessRepositoryHealth(owner, repo);
      } catch (error) {
        console.error('Error in health monitoring:', error);
      }
    }, interval);

    console.log(`Started health monitoring for ${owner}/${repo} every ${interval}ms`);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Stopped health monitoring');
    }
  }

  /**
   * Comprehensive repository health assessment
   */
  async assessRepositoryHealth(owner: string, repo: string): Promise<RepositoryHealth> {
    const cacheKey = `${owner}/${repo}`;
    
    try {
      // Collect all metrics
      const metrics = await this.collectHealthMetrics(owner, repo);
      
      // Analyze trends
      const trends = await this.analyzeTrends(owner, repo, metrics);
      
      // Calculate health scores
      const healthScores = this.calculateHealthScores(metrics);
      
      // Generate alerts
      const alerts = await this.generateAlerts(owner, repo, metrics, trends);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, trends, alerts);
      
      const health: RepositoryHealth = {
        repository: `${owner}/${repo}`,
        overallHealth: this.calculateOverallHealth(healthScores),
        healthScores,
        metrics,
        trends,
        alerts,
        recommendations,
        lastAssessment: new Date().toISOString(),
        nextAssessment: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      
      // Cache the result
      this.healthCache.set(cacheKey, health);
      
      // Send notifications if needed
      await this.processAlerts(alerts);
      
      return health;
    } catch (error) {
      console.error('Error assessing repository health:', error);
      throw new HealthMonitorError('Failed to assess repository health', error);
    }
  }

  /**
   * Collect comprehensive health metrics
   */
  private async collectHealthMetrics(owner: string, repo: string): Promise<HealthMetrics> {
    const [
      repositoryStats,
      codeQualityMetrics,
      securityMetrics,
      performanceMetrics,
      collaborationMetrics,
      maintenanceMetrics,
      communityMetrics
    ] = await Promise.all([
      this.collectRepositoryStats(owner, repo),
      this.collectCodeQualityMetrics(owner, repo),
      this.collectSecurityMetrics(owner, repo),
      this.collectPerformanceMetrics(owner, repo),
      this.collectCollaborationMetrics(owner, repo),
      this.collectMaintenanceMetrics(owner, repo),
      this.collectCommunityMetrics(owner, repo)
    ]);

    return {
      repository: repositoryStats,
      codeQuality: codeQualityMetrics,
      security: securityMetrics,
      performance: performanceMetrics,
      collaboration: collaborationMetrics,
      maintenance: maintenanceMetrics,
      community: communityMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Collect basic repository statistics
   */
  private async collectRepositoryStats(owner: string, repo: string): Promise<RepositoryStats> {
    const repository = await this.githubIntegration.getRepository(owner, repo);
    const languages = await this.githubIntegration.getRepositoryLanguages(owner, repo);
    const contributors = await this.githubIntegration.getRepositoryContributors(owner, repo);
    const releases = await this.githubIntegration.getRepositoryReleases(owner, repo);
    
    return {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      watchers: repository.watchers_count,
      openIssues: repository.open_issues_count,
      size: repository.size,
      languages: Object.keys(languages).length,
      contributors: contributors.length,
      releases: releases.length,
      lastUpdated: repository.updated_at,
      defaultBranch: repository.default_branch,
      isArchived: repository.archived,
      isPrivate: repository.private,
      hasWiki: repository.has_wiki,
      hasProjects: repository.has_projects,
      hasPages: repository.has_pages
    };
  }

  /**
   * Collect code quality metrics
   */
  private async collectCodeQualityMetrics(owner: string, repo: string): Promise<CodeQualityMetrics> {
    const recentCommits = await this.githubIntegration.getRecentCommits(owner, repo, 100);
    const pullRequests = await this.githubIntegration.getRecentPullRequests(owner, repo, 50);
    const issues = await this.githubIntegration.getRecentIssues(owner, repo, 100);
    
    return {
      commitFrequency: this.calculateCommitFrequency(recentCommits),
      avgCommitSize: this.calculateAverageCommitSize(recentCommits),
      codeChurn: this.calculateCodeChurn(recentCommits),
      testCoverage: await this.estimateTestCoverage(owner, repo),
      codeComplexity: await this.estimateCodeComplexity(owner, repo),
      technicalDebt: await this.estimateTechnicalDebt(owner, repo),
      documentationCoverage: await this.estimateDocumentationCoverage(owner, repo),
      codeDuplication: await this.estimateCodeDuplication(owner, repo)
    };
  }

  /**
   * Collect security metrics
   */
  private async collectSecurityMetrics(owner: string, repo: string): Promise<SecurityMetrics> {
    const vulnerabilities = await this.githubIntegration.getSecurityVulnerabilities(owner, repo);
    const dependencyAlerts = await this.githubIntegration.getDependencyAlerts(owner, repo);
    const secretScanningAlerts = await this.githubIntegration.getSecretScanningAlerts(owner, repo);
    
    return {
      vulnerabilities: vulnerabilities.length,
      dependencyAlerts: dependencyAlerts.length,
      secretScanningAlerts: secretScanningAlerts.length,
      securityScore: this.calculateSecurityScore(vulnerabilities, dependencyAlerts, secretScanningAlerts),
      lastSecurityUpdate: this.findLastSecurityUpdate(vulnerabilities),
      hasSecurityPolicy: await this.checkSecurityPolicy(owner, repo),
      hasDependabot: await this.checkDependabotConfig(owner, repo),
      hasCodeScanning: await this.checkCodeScanningConfig(owner, repo)
    };
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(owner: string, repo: string): Promise<PerformanceMetrics> {
    const workflows = await this.githubIntegration.getWorkflows(owner, repo);
    const workflowRuns = await this.githubIntegration.getRecentWorkflowRuns(owner, repo, 50);
    
    return {
      ciSuccess: this.calculateCISuccessRate(workflowRuns),
      avgBuildTime: this.calculateAverageBuildTime(workflowRuns),
      deploymentFrequency: this.calculateDeploymentFrequency(workflowRuns),
      leadTime: this.calculateLeadTime(workflowRuns),
      mttr: this.calculateMTTR(workflowRuns),
      changeFailureRate: this.calculateChangeFailureRate(workflowRuns),
      activeWorkflows: workflows.filter(w => w.state === 'active').length,
      workflowComplexity: this.calculateWorkflowComplexity(workflows)
    };
  }

  /**
   * Collect collaboration metrics
   */
  private async collectCollaborationMetrics(owner: string, repo: string): Promise<CollaborationMetrics> {
    const pullRequests = await this.githubIntegration.getRecentPullRequests(owner, repo, 100);
    const issues = await this.githubIntegration.getRecentIssues(owner, repo, 100);
    const contributors = await this.githubIntegration.getRepositoryContributors(owner, repo);
    
    return {
      prMergeTime: this.calculateAveragePRMergeTime(pullRequests),
      issueResolutionTime: this.calculateAverageIssueResolutionTime(issues),
      activeContributors: this.countActiveContributors(contributors),
      codeReviewCoverage: this.calculateCodeReviewCoverage(pullRequests),
      collaborationScore: this.calculateCollaborationScore(pullRequests, issues, contributors),
      communityEngagement: this.calculateCommunityEngagement(issues, pullRequests),
      responseTime: this.calculateResponseTime(issues, pullRequests),
      mentorshipIndex: this.calculateMentorshipIndex(pullRequests)
    };
  }

  /**
   * Collect maintenance metrics
   */
  private async collectMaintenanceMetrics(owner: string, repo: string): Promise<MaintenanceMetrics> {
    const issues = await this.githubIntegration.getRecentIssues(owner, repo, 100);
    const pullRequests = await this.githubIntegration.getRecentPullRequests(owner, repo, 100);
    const releases = await this.githubIntegration.getRepositoryReleases(owner, repo);
    
    return {
      issueBacklog: issues.filter(i => i.state === 'open').length,
      stalePRs: pullRequests.filter(pr => this.isPRStale(pr)).length,
      releaseFrequency: this.calculateReleaseFrequency(releases),
      maintenanceScore: this.calculateMaintenanceScore(issues, pullRequests, releases),
      technicalDebtTrend: await this.calculateTechnicalDebtTrend(owner, repo),
      refactoringActivity: this.calculateRefactoringActivity(pullRequests),
      dependencyFreshness: await this.calculateDependencyFreshness(owner, repo),
      documentationFreshness: await this.calculateDocumentationFreshness(owner, repo)
    };
  }

  /**
   * Collect community metrics
   */
  private async collectCommunityMetrics(owner: string, repo: string): Promise<CommunityMetrics> {
    const contributors = await this.githubIntegration.getRepositoryContributors(owner, repo);
    const issues = await this.githubIntegration.getRecentIssues(owner, repo, 100);
    const discussions = await this.githubIntegration.getRepositoryDiscussions(owner, repo);
    
    return {
      contributorGrowth: this.calculateContributorGrowth(contributors),
      communityHealth: this.calculateCommunityHealth(contributors, issues, discussions),
      diversityIndex: this.calculateDiversityIndex(contributors),
      onboardingEffectiveness: this.calculateOnboardingEffectiveness(contributors),
      retentionRate: this.calculateRetentionRate(contributors),
      mentorshipPrograms: this.identifyMentorshipPrograms(contributors),
      communityEvents: this.identifyCommunityEvents(issues, discussions),
      feedbackLoop: this.calculateFeedbackLoop(issues, discussions)
    };
  }

  /**
   * Analyze trends in health metrics
   */
  private async analyzeTrends(owner: string, repo: string, currentMetrics: HealthMetrics): Promise<HealthTrends> {
    const historicalData = await this.getHistoricalHealthData(owner, repo);
    
    return {
      overallTrend: this.trendAnalyzer.analyzeTrend(historicalData.overallHealth),
      codeQualityTrend: this.trendAnalyzer.analyzeTrend(historicalData.codeQuality),
      securityTrend: this.trendAnalyzer.analyzeTrend(historicalData.security),
      performanceTrend: this.trendAnalyzer.analyzeTrend(historicalData.performance),
      collaborationTrend: this.trendAnalyzer.analyzeTrend(historicalData.collaboration),
      maintenanceTrend: this.trendAnalyzer.analyzeTrend(historicalData.maintenance),
      communityTrend: this.trendAnalyzer.analyzeTrend(historicalData.community),
      predictedHealth: this.trendAnalyzer.predictFutureHealth(historicalData),
      riskFactors: this.trendAnalyzer.identifyRiskFactors(historicalData, currentMetrics)
    };
  }

  /**
   * Calculate health scores for different categories
   */
  private calculateHealthScores(metrics: HealthMetrics): HealthScores {
    return {
      codeQuality: this.calculateCodeQualityScore(metrics.codeQuality),
      security: this.calculateSecurityScore(metrics.security),
      performance: this.calculatePerformanceScore(metrics.performance),
      collaboration: this.calculateCollaborationScore(metrics.collaboration),
      maintenance: this.calculateMaintenanceScore(metrics.maintenance),
      community: this.calculateCommunityScore(metrics.community),
      overall: 0 // Will be calculated by calculateOverallHealth
    };
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(healthScores: HealthScores): number {
    const weights = {
      codeQuality: 0.2,
      security: 0.25,
      performance: 0.2,
      collaboration: 0.15,
      maintenance: 0.1,
      community: 0.1
    };

    const weightedScore = Object.entries(weights).reduce((score, [category, weight]) => {
      return score + (healthScores[category as keyof HealthScores] || 0) * weight;
    }, 0);

    healthScores.overall = weightedScore;
    return weightedScore;
  }

  /**
   * Generate health alerts based on metrics and trends
   */
  private async generateAlerts(owner: string, repo: string, metrics: HealthMetrics, trends: HealthTrends): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [];

    // Security alerts
    if (metrics.security.vulnerabilities > 0) {
      alerts.push({
        type: 'security',
        severity: 'critical',
        message: `${metrics.security.vulnerabilities} security vulnerabilities detected`,
        recommendation: 'Review and fix security vulnerabilities immediately',
        timestamp: new Date().toISOString()
      });
    }

    // Performance alerts
    if (metrics.performance.ciSuccess < 0.8) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `CI success rate is ${Math.round(metrics.performance.ciSuccess * 100)}% (below 80%)`,
        recommendation: 'Investigate and fix failing CI workflows',
        timestamp: new Date().toISOString()
      });
    }

    // Code quality alerts
    if (metrics.codeQuality.testCoverage < 0.6) {
      alerts.push({
        type: 'code_quality',
        severity: 'medium',
        message: `Test coverage is ${Math.round(metrics.codeQuality.testCoverage * 100)}% (below 60%)`,
        recommendation: 'Improve test coverage for better code quality',
        timestamp: new Date().toISOString()
      });
    }

    // Maintenance alerts
    if (metrics.maintenance.issueBacklog > 50) {
      alerts.push({
        type: 'maintenance',
        severity: 'medium',
        message: `Issue backlog is ${metrics.maintenance.issueBacklog} (above 50)`,
        recommendation: 'Review and prioritize issue backlog',
        timestamp: new Date().toISOString()
      });
    }

    // Trend-based alerts
    if (trends.overallTrend.direction === 'declining' && trends.overallTrend.slope < -0.1) {
      alerts.push({
        type: 'trend',
        severity: 'high',
        message: 'Overall repository health is declining',
        recommendation: 'Review recent changes and address declining metrics',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Generate recommendations based on health assessment
   */
  private generateRecommendations(metrics: HealthMetrics, trends: HealthTrends, alerts: HealthAlert[]): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Code quality recommendations
    if (metrics.codeQuality.testCoverage < 0.8) {
      recommendations.push({
        category: 'code_quality',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: 'Current test coverage is below recommended threshold',
        actionItems: [
          'Add unit tests for uncovered code',
          'Implement integration tests',
          'Set up coverage reporting in CI'
        ],
        estimatedEffort: 'medium',
        expectedImpact: 'high'
      });
    }

    // Security recommendations
    if (metrics.security.securityScore < 0.8) {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Enhance Security Posture',
        description: 'Repository security needs improvement',
        actionItems: [
          'Enable Dependabot for dependency updates',
          'Set up security scanning in CI',
          'Add security policy documentation'
        ],
        estimatedEffort: 'low',
        expectedImpact: 'high'
      });
    }

    // Performance recommendations
    if (metrics.performance.avgBuildTime > 600) { // 10 minutes
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Build Performance',
        description: 'Build times are longer than recommended',
        actionItems: [
          'Implement build caching',
          'Parallelize build jobs',
          'Optimize dependency installation'
        ],
        estimatedEffort: 'medium',
        expectedImpact: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Process alerts and send notifications
   */
  private async processAlerts(alerts: HealthAlert[]): Promise<void> {
    for (const alert of alerts) {
      if (alert.severity === 'critical') {
        await this.alertManager.sendCriticalAlert(alert);
      } else if (alert.severity === 'high') {
        await this.alertManager.sendHighPriorityAlert(alert);
      }
    }
  }

  // Helper methods for metric calculations
  private calculateCommitFrequency(commits: any[]): number {
    if (commits.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentCommits = commits.filter(c => new Date(c.commit.author.date) > thirtyDaysAgo);
    
    return recentCommits.length / 30; // commits per day
  }

  private calculateAverageCommitSize(commits: any[]): number {
    if (commits.length === 0) return 0;
    
    const totalChanges = commits.reduce((sum, commit) => {
      return sum + (commit.stats?.additions || 0) + (commit.stats?.deletions || 0);
    }, 0);
    
    return totalChanges / commits.length;
  }

  private calculateCodeChurn(commits: any[]): number {
    if (commits.length === 0) return 0;
    
    const totalAdditions = commits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
    const totalDeletions = commits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);
    
    return totalAdditions > 0 ? totalDeletions / totalAdditions : 0;
  }

  private async estimateTestCoverage(owner: string, repo: string): Promise<number> {
    // This would integrate with coverage tools or analyze test files
    // For now, return a placeholder
    return 0.75;
  }

  private async estimateCodeComplexity(owner: string, repo: string): Promise<number> {
    // This would analyze code complexity using static analysis
    // For now, return a placeholder
    return 0.6;
  }

  private async estimateTechnicalDebt(owner: string, repo: string): Promise<number> {
    // This would analyze technical debt using static analysis
    // For now, return a placeholder
    return 0.3;
  }

  private async estimateDocumentationCoverage(owner: string, repo: string): Promise<number> {
    // This would analyze documentation coverage
    // For now, return a placeholder
    return 0.8;
  }

  private async estimateCodeDuplication(owner: string, repo: string): Promise<number> {
    // This would analyze code duplication
    // For now, return a placeholder
    return 0.1;
  }

  private calculateCISuccessRate(workflowRuns: any[]): number {
    if (workflowRuns.length === 0) return 1;
    
    const successfulRuns = workflowRuns.filter(run => run.conclusion === 'success');
    return successfulRuns.length / workflowRuns.length;
  }

  private calculateAverageBuildTime(workflowRuns: any[]): number {
    if (workflowRuns.length === 0) return 0;
    
    const totalDuration = workflowRuns.reduce((sum, run) => {
      const start = new Date(run.created_at);
      const end = new Date(run.updated_at);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    
    return totalDuration / workflowRuns.length / 1000; // in seconds
  }

  private calculateDeploymentFrequency(workflowRuns: any[]): number {
    const deploymentRuns = workflowRuns.filter(run => 
      run.name.toLowerCase().includes('deploy') || 
      run.name.toLowerCase().includes('release')
    );
    
    return deploymentRuns.length / 30; // deployments per day (last 30 days)
  }

  private calculateLeadTime(workflowRuns: any[]): number {
    // Simplified lead time calculation
    return this.calculateAverageBuildTime(workflowRuns);
  }

  private calculateMTTR(workflowRuns: any[]): number {
    // Mean Time To Recovery - simplified calculation
    const failedRuns = workflowRuns.filter(run => run.conclusion === 'failure');
    if (failedRuns.length === 0) return 0;
    
    // This would need more sophisticated analysis of when failures were fixed
    return 3600; // 1 hour placeholder
  }

  private calculateChangeFailureRate(workflowRuns: any[]): number {
    if (workflowRuns.length === 0) return 0;
    
    const failedRuns = workflowRuns.filter(run => run.conclusion === 'failure');
    return failedRuns.length / workflowRuns.length;
  }

  private calculateWorkflowComplexity(workflows: any[]): number {
    // Simplified complexity calculation
    return workflows.reduce((sum, workflow) => sum + 1, 0) / 10; // normalize
  }

  private calculateAveragePRMergeTime(pullRequests: any[]): number {
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);
    if (mergedPRs.length === 0) return 0;
    
    const totalTime = mergedPRs.reduce((sum, pr) => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at);
      return sum + (merged.getTime() - created.getTime());
    }, 0);
    
    return totalTime / mergedPRs.length / (1000 * 60 * 60); // in hours
  }

  private calculateAverageIssueResolutionTime(issues: any[]): number {
    const closedIssues = issues.filter(issue => issue.closed_at);
    if (closedIssues.length === 0) return 0;
    
    const totalTime = closedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at);
      const closed = new Date(issue.closed_at);
      return sum + (closed.getTime() - created.getTime());
    }, 0);
    
    return totalTime / closedIssues.length / (1000 * 60 * 60 * 24); // in days
  }

  private countActiveContributors(contributors: any[]): number {
    // Active contributors in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return contributors.filter(c => new Date(c.last_contribution) > thirtyDaysAgo).length;
  }

  private calculateCodeReviewCoverage(pullRequests: any[]): number {
    if (pullRequests.length === 0) return 0;
    
    const reviewedPRs = pullRequests.filter(pr => pr.reviews && pr.reviews.length > 0);
    return reviewedPRs.length / pullRequests.length;
  }

  // Additional helper methods would be implemented here...
  private isPRStale(pr: any): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(pr.updated_at) < thirtyDaysAgo && pr.state === 'open';
  }

  private calculateReleaseFrequency(releases: any[]): number {
    if (releases.length === 0) return 0;
    
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const recentReleases = releases.filter(r => new Date(r.created_at) > yearAgo);
    
    return recentReleases.length / 12; // releases per month
  }

  private async getHistoricalHealthData(owner: string, repo: string): Promise<any> {
    // This would retrieve historical health data from storage
    // For now, return mock data
    return {
      overallHealth: [0.8, 0.82, 0.85, 0.83, 0.87],
      codeQuality: [0.75, 0.78, 0.8, 0.82, 0.85],
      security: [0.9, 0.88, 0.92, 0.9, 0.93],
      performance: [0.7, 0.72, 0.75, 0.73, 0.78],
      collaboration: [0.8, 0.82, 0.85, 0.87, 0.89],
      maintenance: [0.65, 0.68, 0.7, 0.72, 0.75],
      community: [0.6, 0.62, 0.65, 0.67, 0.7]
    };
  }
}

// Type definitions
interface HealthMonitorOptions {
  githubToken: string;
  metricsConfig?: any;
  trendConfig?: any;
  alertConfig?: any;
}

interface RepositoryHealth {
  repository: string;
  overallHealth: number;
  healthScores: HealthScores;
  metrics: HealthMetrics;
  trends: HealthTrends;
  alerts: HealthAlert[];
  recommendations: HealthRecommendation[];
  lastAssessment: string;
  nextAssessment: string;
}

interface HealthScores {
  codeQuality: number;
  security: number;
  performance: number;
  collaboration: number;
  maintenance: number;
  community: number;
  overall: number;
}

interface HealthMetrics {
  repository: RepositoryStats;
  codeQuality: CodeQualityMetrics;
  security: SecurityMetrics;
  performance: PerformanceMetrics;
  collaboration: CollaborationMetrics;
  maintenance: MaintenanceMetrics;
  community: CommunityMetrics;
  timestamp: string;
}

interface RepositoryStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number;
  languages: number;
  contributors: number;
  releases: number;
  lastUpdated: string;
  defaultBranch: string;
  isArchived: boolean;
  isPrivate: boolean;
  hasWiki: boolean;
  hasProjects: boolean;
  hasPages: boolean;
}

interface CodeQualityMetrics {
  commitFrequency: number;
  avgCommitSize: number;
  codeChurn: number;
  testCoverage: number;
  codeComplexity: number;
  technicalDebt: number;
  documentationCoverage: number;
  codeDuplication: number;
}

interface SecurityMetrics {
  vulnerabilities: number;
  dependencyAlerts: number;
  secretScanningAlerts: number;
  securityScore: number;
  lastSecurityUpdate: string;
  hasSecurityPolicy: boolean;
  hasDependabot: boolean;
  hasCodeScanning: boolean;
}

interface PerformanceMetrics {
  ciSuccess: number;
  avgBuildTime: number;
  deploymentFrequency: number;
  leadTime: number;
  mttr: number;
  changeFailureRate: number;
  activeWorkflows: number;
  workflowComplexity: number;
}

interface CollaborationMetrics {
  prMergeTime: number;
  issueResolutionTime: number;
  activeContributors: number;
  codeReviewCoverage: number;
  collaborationScore: number;
  communityEngagement: number;
  responseTime: number;
  mentorshipIndex: number;
}

interface MaintenanceMetrics {
  issueBacklog: number;
  stalePRs: number;
  releaseFrequency: number;
  maintenanceScore: number;
  technicalDebtTrend: number;
  refactoringActivity: number;
  dependencyFreshness: number;
  documentationFreshness: number;
}

interface CommunityMetrics {
  contributorGrowth: number;
  communityHealth: number;
  diversityIndex: number;
  onboardingEffectiveness: number;
  retentionRate: number;
  mentorshipPrograms: number;
  communityEvents: number;
  feedbackLoop: number;
}

interface HealthTrends {
  overallTrend: TrendData;
  codeQualityTrend: TrendData;
  securityTrend: TrendData;
  performanceTrend: TrendData;
  collaborationTrend: TrendData;
  maintenanceTrend: TrendData;
  communityTrend: TrendData;
  predictedHealth: number;
  riskFactors: string[];
}

interface TrendData {
  direction: 'improving' | 'stable' | 'declining';
  slope: number;
  confidence: number;
}

interface HealthAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  timestamp: string;
}

interface HealthRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
}

class HealthMonitorError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'HealthMonitorError';
  }
}

export {
  RepositoryHealthMonitor,
  HealthMonitorError,
  type HealthMonitorOptions,
  type RepositoryHealth,
  type HealthMetrics,
  type HealthTrends,
  type HealthAlert,
  type HealthRecommendation
};