/**
 * GitHub Integration Enhancement Package
 * Comprehensive GitHub integration with advanced AI-powered features
 */

// Core integration layer
export { GitHubIntegrationLayer, GitHubIntegrationError } from './GitHubIntegrationLayer';

// Automated issue management
export { 
  AutomatedIssueTriage, 
  TriageError,
  type TriageOptions,
  type TriageResult,
  type IssueData,
  type LabelSuggestion,
  type AssigneeSuggestion,
  type PriorityAssessment,
  type DuplicateDetection,
  type AutomatedResponse
} from './AutomatedIssueTriage';

// Intelligent PR analysis
export {
  IntelligentPRAnalysis,
  PRAnalysisError,
  type PRAnalysisOptions,
  type PRAnalysisResult,
  type ReviewerSuggestion,
  type ReviewComment,
  type MergeReadinessAssessment,
  type ImpactAnalysis,
  type QualityMetrics
} from './IntelligentPRAnalysis';

// Workflow optimization
export {
  WorkflowOptimizer,
  WorkflowOptimizationError,
  type WorkflowOptimizerOptions,
  type WorkflowOptimization,
  type RepositoryOptimization,
  type PerformanceBottleneck,
  type ParallelizationRecommendation,
  type ResourceOptimization,
  type SecurityEnhancement,
  type CostOptimization,
  type WorkflowHealth
} from './WorkflowOptimizer';

// Repository health monitoring
export {
  RepositoryHealthMonitor,
  HealthMonitorError,
  type HealthMonitorOptions,
  type RepositoryHealth,
  type HealthMetrics,
  type HealthTrends,
  type HealthAlert,
  type HealthRecommendation
} from './RepositoryHealthMonitor';

// Collaborative development tools
export {
  CollaborativeDevelopmentTools,
  CollaborativeToolsError,
  type CollaborativeToolsOptions,
  type TeamCollaborationAnalysis,
  type TeamFormationRecommendation,
  type MentorshipProgramManagement,
  type CodeReviewOptimization,
  type KnowledgeManagementEnhancement,
  type CommunicationOptimization,
  type ConflictResolutionSupport,
  type ProductivityOptimization
} from './CollaborativeDevelopmentTools';

// Utility functions and constants
export const GITHUB_INTEGRATION_VERSION = '1.0.0';
export const SUPPORTED_GITHUB_API_VERSION = '2022-11-28';

// Common interfaces
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    type: string;
  };
  private: boolean;
  html_url: string;
  description?: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language?: string;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  default_branch: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    id: number;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  state: 'open' | 'closed';
  locked: boolean;
  assignee?: {
    login: string;
    id: number;
  };
  assignees: Array<{
    login: string;
    id: number;
  }>;
  milestone?: {
    id: number;
    title: string;
    description?: string;
    state: 'open' | 'closed';
  };
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  body?: string;
  reactions: {
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
  timeline_url: string;
  repository_url: string;
  html_url: string;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    id: number;
  };
  body?: string;
  state: 'open' | 'closed';
  locked: boolean;
  merged: boolean;
  mergeable?: boolean;
  mergeable_state: string;
  merged_by?: {
    login: string;
    id: number;
  };
  comments: number;
  review_comments: number;
  maintainer_can_modify: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  head: {
    label: string;
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  requested_reviewers: Array<{
    login: string;
    id: number;
  }>;
  requested_teams: Array<{
    id: number;
    name: string;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  milestone?: {
    id: number;
    title: string;
  };
  assignee?: {
    login: string;
    id: number;
  };
  assignees: Array<{
    login: string;
    id: number;
  }>;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

// Configuration interfaces
export interface GitHubIntegrationConfig {
  token: string;
  baseURL?: string;
  userAgent?: string;
  timeout?: number;
  retries?: number;
  aiConfig?: AIAnalysisConfig;
  rateLimitHandling?: {
    enabled: boolean;
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  webhooks?: {
    secret?: string;
    events: string[];
  };
}

export interface AIAnalysisConfig {
  models: {
    classification: string;
    sentiment: string;
    complexity: string;
    security: string;
  };
  thresholds: {
    confidence: number;
    severity: number;
    complexity: number;
  };
  features: {
    autoTriage: boolean;
    smartAssignment: boolean;
    duplicateDetection: boolean;
    qualityAnalysis: boolean;
    securityScanning: boolean;
  };
}

// Import necessary classes
import { GitHubIntegrationLayer, GitHubIntegrationError } from './GitHubIntegrationLayer';
import { AutomatedIssueTriage, TriageError } from './AutomatedIssueTriage';
import { IntelligentPRAnalysis, PRAnalysisError } from './IntelligentPRAnalysis';
import { WorkflowOptimizer, WorkflowOptimizationError } from './WorkflowOptimizer';
import { RepositoryHealthMonitor, HealthMonitorError } from './RepositoryHealthMonitor';
import { CollaborativeDevelopmentTools, CollaborativeToolsError } from './CollaborativeDevelopmentTools';

// Utility functions
export function createGitHubIntegration(config: GitHubIntegrationConfig): GitHubIntegrationLayer {
  return new GitHubIntegrationLayer(config.token, {
    aiConfig: config.aiConfig,
    rateLimitConfig: config.rateLimitHandling
  });
}

export function createAutomatedTriage(config: GitHubIntegrationConfig & { aiConfig?: AIAnalysisConfig }): AutomatedIssueTriage {
  return new AutomatedIssueTriage({
    githubToken: config.token,
    mlConfig: config.aiConfig?.models,
    patternConfig: config.aiConfig?.thresholds,
    learningEnabled: config.aiConfig?.features.autoTriage
  });
}

export function createIntelligentPRAnalysis(config: GitHubIntegrationConfig & { aiConfig?: AIAnalysisConfig }): IntelligentPRAnalysis {
  return new IntelligentPRAnalysis({
    githubToken: config.token,
    codeQualityConfig: config.aiConfig?.features.qualityAnalysis,
    securityConfig: config.aiConfig?.features.securityScanning,
    performanceConfig: config.aiConfig?.thresholds
  });
}

export function createWorkflowOptimizer(config: GitHubIntegrationConfig): WorkflowOptimizer {
  return new WorkflowOptimizer({
    githubToken: config.token,
    analyzerConfig: {},
    optimizerConfig: {}
  });
}

export function createRepositoryHealthMonitor(config: GitHubIntegrationConfig): RepositoryHealthMonitor {
  return new RepositoryHealthMonitor({
    githubToken: config.token,
    metricsConfig: {},
    trendConfig: {},
    alertConfig: {}
  });
}

export function createCollaborativeDevelopmentTools(config: GitHubIntegrationConfig): CollaborativeDevelopmentTools {
  return new CollaborativeDevelopmentTools({
    githubToken: config.token,
    teamAnalyzerConfig: {},
    communicationConfig: {},
    mentorshipConfig: {}
  });
}

// Error handling utilities
export function isGitHubIntegrationError(error: any): error is GitHubIntegrationError {
  return error instanceof GitHubIntegrationError;
}

export function isTriageError(error: any): error is TriageError {
  return error instanceof TriageError;
}

export function isPRAnalysisError(error: any): error is PRAnalysisError {
  return error instanceof PRAnalysisError;
}

export function isWorkflowOptimizationError(error: any): error is WorkflowOptimizationError {
  return error instanceof WorkflowOptimizationError;
}

export function isHealthMonitorError(error: any): error is HealthMonitorError {
  return error instanceof HealthMonitorError;
}

export function isCollaborativeToolsError(error: any): error is CollaborativeToolsError {
  return error instanceof CollaborativeToolsError;
}

// Constants
export const DEFAULT_GITHUB_API_VERSION = '2022-11-28';
export const DEFAULT_USER_AGENT = `sasi-github-integration/${GITHUB_INTEGRATION_VERSION}`;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRIES = 3;

// Rate limiting constants
export const GITHUB_RATE_LIMIT_REMAINING_THRESHOLD = 100;
export const GITHUB_RATE_LIMIT_RESET_BUFFER = 60000; // 1 minute
export const GITHUB_SECONDARY_RATE_LIMIT_DELAY = 60000; // 1 minute

// Webhook event types
export const GITHUB_WEBHOOK_EVENTS = [
  'issues',
  'pull_request',
  'push',
  'release',
  'workflow_run',
  'repository',
  'member',
  'team',
  'organization',
  'security_advisory',
  'code_scanning_alert',
  'secret_scanning_alert',
  'dependabot_alert'
] as const;

export type GitHubWebhookEvent = typeof GITHUB_WEBHOOK_EVENTS[number];

// Priority levels
export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// Issue states
export const ISSUE_STATES = {
  OPEN: 'open',
  CLOSED: 'closed'
} as const;

export type IssueState = typeof ISSUE_STATES[keyof typeof ISSUE_STATES];

// PR states
export const PR_STATES = {
  OPEN: 'open',
  CLOSED: 'closed',
  MERGED: 'merged'
} as const;

export type PRState = typeof PR_STATES[keyof typeof PR_STATES];

// Workflow states
export const WORKFLOW_STATES = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  DISABLED_FORK: 'disabled_fork',
  DISABLED_INACTIVITY: 'disabled_inactivity',
  DISABLED_MANUALLY: 'disabled_manually'
} as const;

export type WorkflowState = typeof WORKFLOW_STATES[keyof typeof WORKFLOW_STATES];

// Default configurations
export const DEFAULT_TRIAGE_CONFIG = {
  confidenceThreshold: 0.8,
  autoApplyThreshold: 0.9,
  learningEnabled: true,
  duplicateDetectionEnabled: true,
  sentimentAnalysisEnabled: true
};

export const DEFAULT_PR_ANALYSIS_CONFIG = {
  codeQualityThreshold: 0.7,
  securityThreshold: 0.8,
  performanceThreshold: 0.6,
  complexityThreshold: 0.5,
  testCoverageThreshold: 0.8,
  maintainabilityThreshold: 0.7
};

export const DEFAULT_WORKFLOW_OPTIMIZATION_CONFIG = {
  performanceThreshold: 0.6,
  costOptimizationEnabled: true,
  securityEnhancementEnabled: true,
  parallelizationEnabled: true,
  resourceOptimizationEnabled: true
};

export const DEFAULT_HEALTH_MONITOR_CONFIG = {
  monitoringInterval: 3600000, // 1 hour
  alertThresholds: {
    critical: 0.3,
    high: 0.5,
    medium: 0.7,
    low: 0.9
  },
  trendAnalysisEnabled: true,
  predictiveAnalysisEnabled: true
};

export const DEFAULT_COLLABORATIVE_TOOLS_CONFIG = {
  teamAnalysisEnabled: true,
  mentorshipEnabled: true,
  communicationOptimizationEnabled: true,
  conflictResolutionEnabled: true,
  productivityTrackingEnabled: true
};

// Export everything as a namespace for easier consumption
// Note: Commented out circular export to avoid redeclaration issues
// export * as GitHubIntegration from './index';