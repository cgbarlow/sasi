/**
 * TDD Tests for TypeScript Fixes - GitHub Integration
 * Testing GitHubIntegrationLayer and CollaborativeDevelopmentTools
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  GitHubIntegrationLayer,
  GitHubIntegrationError,
  type GitHubIntegrationOptions,
  type IssueTriage,
  type PRAnalysis,
  type RepositoryHealth,
  type WorkflowOptimization,
  type CollaborationEnhancement
} from '../../src/github/GitHubIntegrationLayer';
import {
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
} from '../../src/github/CollaborativeDevelopmentTools';

// Mock Octokit for testing
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      get: jest.fn().mockResolvedValue({
        data: {
          number: 1,
          title: 'Test Issue',
          body: 'This is a test issue',
          labels: [{ name: 'bug' }, { name: 'high-priority' }],
          user: { login: 'testuser' },
          assignees: []
        }
      }),
      listComments: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            body: 'Test comment',
            user: { login: 'commenter' },
            created_at: '2023-01-01T00:00:00Z'
          }
        ]
      }),
      update: jest.fn().mockResolvedValue({
        data: { number: 1, title: 'Updated Issue' }
      }),
      createComment: jest.fn().mockResolvedValue({
        data: { id: 1, body: 'New comment' }
      }),
      list: jest.fn().mockResolvedValue({
        data: [
          {
            number: 1,
            title: 'Test Issue',
            user: { login: 'testuser' },
            created_at: '2023-01-01T00:00:00Z',
            assignees: []
          }
        ]
      }),
      listEvents: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            event: 'labeled',
            created_at: '2023-01-01T00:00:00Z'
          }
        ]
      }),
      listCommentsForRepo: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            body: 'Repository comment',
            user: { login: 'commenter' }
          }
        ]
      })
    },
    pulls: {
      get: jest.fn().mockResolvedValue({
        data: {
          number: 1,
          title: 'Test PR',
          body: 'This is a test PR',
          user: { login: 'prauthor' },
          mergeable: true
        }
      }),
      listFiles: jest.fn().mockResolvedValue({
        data: [
          {
            filename: 'test.js',
            status: 'modified',
            additions: 10,
            deletions: 5
          }
        ]
      }),
      listCommits: jest.fn().mockResolvedValue({
        data: [
          {
            sha: 'abc123',
            commit: {
              message: 'Test commit',
              author: { name: 'Test Author', date: '2023-01-01T00:00:00Z' }
            },
            author: { login: 'testauthor' }
          }
        ]
      }),
      list: jest.fn().mockResolvedValue({
        data: [
          {
            number: 1,
            title: 'Test PR',
            user: { login: 'prauthor' }
          }
        ]
      }),
      listReviews: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            user: { login: 'reviewer' },
            state: 'approved',
            submitted_at: '2023-01-01T00:00:00Z'
          }
        ]
      })
    },
    repos: {
      get: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          private: false,
          default_branch: 'main'
        }
      }),
      listCommits: jest.fn().mockResolvedValue({
        data: [
          {
            sha: 'abc123',
            commit: {
              message: 'Test commit',
              author: { name: 'Test Author', date: '2023-01-01T00:00:00Z' }
            },
            author: { login: 'testauthor' },
            committer: { login: 'testcommitter' }
          }
        ]
      }),
      listContributors: jest.fn().mockResolvedValue({
        data: [
          {
            login: 'contributor1',
            contributions: 50,
            type: 'User'
          },
          {
            login: 'contributor2',
            contributions: 25,
            type: 'User'
          }
        ]
      })
    },
    actions: {
      listRepoWorkflows: jest.fn().mockResolvedValue({
        data: {
          workflows: [
            {
              id: 1,
              name: 'CI',
              path: '.github/workflows/ci.yml',
              state: 'active'
            }
          ]
        }
      }),
      listWorkflowRuns: jest.fn().mockResolvedValue({
        data: {
          workflow_runs: [
            {
              id: 1,
              status: 'completed',
              conclusion: 'success',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:05:00Z'
            }
          ]
        }
      })
    }
  }))
}));

describe('GitHub Integration TypeScript Compatibility', () => {
  let githubIntegration: GitHubIntegrationLayer;
  let collaborativeTools: CollaborativeDevelopmentTools;
  let mockOptions: GitHubIntegrationOptions;
  let mockCollabOptions: CollaborativeToolsOptions;

  beforeEach(() => {
    mockOptions = {
      aiConfig: { apiKey: 'test-key' },
      rateLimitConfig: { maxRequests: 100 }
    };

    mockCollabOptions = {
      githubToken: 'test-token',
      teamAnalyzerConfig: { enabled: true },
      communicationConfig: { channels: ['github'] },
      mentorshipConfig: { enabled: true }
    };

    githubIntegration = new GitHubIntegrationLayer('test-token', mockOptions);
    collaborativeTools = new CollaborativeDevelopmentTools(mockCollabOptions);
  });

  describe('GitHubIntegrationLayer Class', () => {
    it('should initialize with proper configuration', () => {
      expect(githubIntegration).toBeInstanceOf(GitHubIntegrationLayer);
    });

    it('should handle issue triage operations', async () => {
      const triage = await githubIntegration.triageIssue('owner', 'repo', 1);
      
      expect(triage).toBeDefined();
      expect(typeof triage.issueNumber).toBe('number');
      expect(['critical', 'high', 'medium', 'low'].includes(triage.priority)).toBe(true);
      expect(typeof triage.category).toBe('string');
      expect(typeof triage.severity).toBe('number');
      expect(typeof triage.estimatedEffort).toBe('string');
      expect(Array.isArray(triage.suggestedLabels)).toBe(true);
      expect(Array.isArray(triage.suggestedAssignees)).toBe(true);
      expect(typeof triage.aiConfidence).toBe('number');
      expect(typeof triage.analysisTimestamp).toBe('string');
    });

    it('should handle PR analysis operations', async () => {
      const analysis = await githubIntegration.analyzePullRequest('owner', 'repo', 1);
      
      expect(analysis).toBeDefined();
      expect(typeof analysis.prNumber).toBe('number');
      expect(typeof analysis.complexity).toBe('number');
      expect(typeof analysis.testCoverage).toBe('number');
      expect(typeof analysis.codeQuality).toBe('number');
      expect(typeof analysis.securityRisk).toBe('number');
      expect(typeof analysis.performance).toBe('number');
      expect(typeof analysis.maintainability).toBe('number');
      expect(Array.isArray(analysis.suggestedReviewers)).toBe(true);
      expect(Array.isArray(analysis.potentialIssues)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(typeof analysis.mergeability).toBe('boolean');
      expect(typeof analysis.analysisTimestamp).toBe('string');
    });

    it('should monitor repository health', async () => {
      const health = await githubIntegration.monitorRepositoryHealth('owner', 'repo');
      
      expect(health).toBeDefined();
      expect(typeof health.repository).toBe('string');
      expect(typeof health.overallScore).toBe('number');
      expect(health.metrics).toBeDefined();
      expect(typeof health.metrics.codeQuality).toBe('number');
      expect(typeof health.metrics.testCoverage).toBe('number');
      expect(typeof health.metrics.documentation).toBe('number');
      expect(typeof health.metrics.security).toBe('number');
      expect(typeof health.metrics.performance).toBe('number');
      expect(typeof health.metrics.maintainability).toBe('number');
      expect(typeof health.metrics.collaboration).toBe('number');
      expect(Array.isArray(health.alerts)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
      expect(typeof health.lastUpdated).toBe('string');
    });

    it('should optimize workflows', async () => {
      const optimization = await githubIntegration.optimizeWorkflows('owner', 'repo');
      
      expect(optimization).toBeDefined();
      expect(typeof optimization.repository).toBe('string');
      expect(Array.isArray(optimization.optimizations)).toBe(true);
      expect(typeof optimization.totalPotentialImprovement).toBe('number');
      expect(typeof optimization.analysisTimestamp).toBe('string');
    });

    it('should enhance collaboration', async () => {
      const enhancement = await githubIntegration.enhanceCollaboration('owner', 'repo');
      
      expect(enhancement).toBeDefined();
      expect(typeof enhancement.repository).toBe('string');
      expect(enhancement.teamInsights).toBeDefined();
      expect(enhancement.communicationPatterns).toBeDefined();
      expect(Array.isArray(enhancement.bottlenecks)).toBe(true);
      expect(Array.isArray(enhancement.recommendations)).toBe(true);
      expect(Array.isArray(enhancement.automationOpportunities)).toBe(true);
      expect(Array.isArray(enhancement.trainingNeeds)).toBe(true);
      expect(Array.isArray(enhancement.toolSuggestions)).toBe(true);
    });

    it('should handle missing methods for AutomatedIssueTriage integration', async () => {
      const issue = await githubIntegration.getIssue('owner', 'repo', 1);
      expect(issue).toBeDefined();
      expect(issue.number).toBe(1);

      const events = await githubIntegration.getIssueEvents('owner', 'repo', 1);
      expect(Array.isArray(events)).toBe(true);

      const updatedIssue = await githubIntegration.updateIssue('owner', 'repo', 1, { title: 'Updated' });
      expect(updatedIssue).toBeDefined();

      const comment = await githubIntegration.addComment('owner', 'repo', 1, 'Test comment');
      expect(comment).toBeDefined();
    });
  });

  describe('CollaborativeDevelopmentTools Class', () => {
    it('should initialize with proper configuration', () => {
      expect(collaborativeTools).toBeInstanceOf(CollaborativeDevelopmentTools);
    });

    it('should analyze team collaboration', async () => {
      const analysis = await collaborativeTools.analyzeTeamCollaboration('owner', 'repo');
      
      expect(analysis).toBeDefined();
      expect(typeof analysis.repository).toBe('string');
      expect(typeof analysis.overallScore).toBe('number');
      expect(analysis.analysis).toBeDefined();
      expect(analysis.analysis.teamDynamics).toBeDefined();
      expect(analysis.analysis.communicationPatterns).toBeDefined();
      expect(analysis.analysis.knowledgeSharing).toBeDefined();
      expect(Array.isArray(analysis.analysis.mentorshipOpportunities)).toBe(true);
      expect(Array.isArray(analysis.analysis.collaborationBottlenecks)).toBe(true);
      expect(analysis.analysis.teamHealthMetrics).toBeDefined();
      expect(Array.isArray(analysis.analysis.improvementRecommendations)).toBe(true);
      expect(typeof analysis.timestamp).toBe('string');
    });

    it('should optimize team formation', async () => {
      const projectRequirements = {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: ['senior', 'mid-level'],
        workload: 'full-time',
        timeline: '3 months',
        complexity: 'medium'
      };

      const recommendation = await collaborativeTools.optimizeTeamFormation('owner', 'repo', projectRequirements);
      
      expect(recommendation).toBeDefined();
      expect(typeof recommendation.repository).toBe('string');
      expect(typeof recommendation.optimalTeamSize).toBe('number');
      expect(Array.isArray(recommendation.recommendedRoles)).toBe(true);
      expect(Array.isArray(recommendation.memberAssignments)).toBe(true);
      expect(Array.isArray(recommendation.skillGaps)).toBe(true);
      expect(Array.isArray(recommendation.trainingNeeds)).toBe(true);
      expect(typeof recommendation.collaborationStrategy).toBe('string');
      expect(Array.isArray(recommendation.expectedOutcomes)).toBe(true);
      expect(Array.isArray(recommendation.riskFactors)).toBe(true);
      expect(typeof recommendation.timestamp).toBe('string');
    });

    it('should manage mentorship programs', async () => {
      const management = await collaborativeTools.manageMentorshipProgram('owner', 'repo');
      
      expect(management).toBeDefined();
      expect(typeof management.repository).toBe('string');
      expect(typeof management.activeMentorships).toBe('number');
      expect(typeof management.programHealth).toBe('number');
      expect(Array.isArray(management.recommendations)).toBe(true);
      expect(management.learningOutcomes).toBeDefined();
      expect(Array.isArray(management.nextSteps)).toBe(true);
      expect(typeof management.timestamp).toBe('string');
    });

    it('should optimize code reviews', async () => {
      const optimization = await collaborativeTools.optimizeCodeReviews('owner', 'repo');
      
      expect(optimization).toBeDefined();
      expect(typeof optimization.repository).toBe('string');
      expect(typeof optimization.currentEfficiency).toBe('number');
      expect(typeof optimization.optimizedEfficiency).toBe('number');
      expect(optimization.improvements).toBeDefined();
      expect(optimization.implementationPlan).toBeDefined();
      expect(optimization.expectedBenefits).toBeDefined();
      expect(typeof optimization.timestamp).toBe('string');
    });

    it('should enhance knowledge management', async () => {
      const enhancement = await collaborativeTools.enhanceKnowledgeManagement('owner', 'repo');
      
      expect(enhancement).toBeDefined();
      expect(typeof enhancement.repository).toBe('string');
      expect(typeof enhancement.knowledgeScore).toBe('number');
      expect(typeof enhancement.documentationCoverage).toBe('number');
      expect(enhancement.expertiseDistribution).toBeDefined();
      expect(enhancement.improvementPlan).toBeDefined();
      expect(enhancement.priorityAreas).toBeDefined();
      expect(typeof enhancement.timestamp).toBe('string');
    });

    it('should optimize communication', async () => {
      const optimization = await collaborativeTools.optimizeCommunication('owner', 'repo');
      
      expect(optimization).toBeDefined();
      expect(typeof optimization.repository).toBe('string');
      expect(typeof optimization.communicationHealth).toBe('number');
      expect(optimization.optimizations).toBeDefined();
      expect(optimization.implementationRoadmap).toBeDefined();
      expect(optimization.expectedImprovements).toBeDefined();
      expect(typeof optimization.timestamp).toBe('string');
    });

    it('should facilitate conflict resolution', async () => {
      const resolution = await collaborativeTools.facilitateConflictResolution('owner', 'repo');
      
      expect(resolution).toBeDefined();
      expect(typeof resolution.repository).toBe('string');
      expect(typeof resolution.conflictLevel).toBe('number');
      expect(resolution.resolutionPlan).toBeDefined();
      expect(resolution.mediationNeeds).toBeDefined();
      expect(resolution.preventionStrategy).toBeDefined();
      expect(resolution.teamHealthActions).toBeDefined();
      expect(typeof resolution.timestamp).toBe('string');
    });

    it('should optimize productivity', async () => {
      const optimization = await collaborativeTools.optimizeProductivity('owner', 'repo');
      
      expect(optimization).toBeDefined();
      expect(typeof optimization.repository).toBe('string');
      expect(typeof optimization.currentProductivity).toBe('number');
      expect(typeof optimization.optimizedProductivity).toBe('number');
      expect(optimization.improvements).toBeDefined();
      expect(optimization.quickWins).toBeDefined();
      expect(optimization.longTermStrategy).toBeDefined();
      expect(typeof optimization.timestamp).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should create GitHubIntegrationError properly', () => {
      const error = new GitHubIntegrationError('Test error', new Error('Cause'));
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GitHubIntegrationError');
      expect(error.message).toBe('Test error');
      expect(error.cause).toBeInstanceOf(Error);
    });

    it('should create CollaborativeToolsError properly', () => {
      const error = new CollaborativeToolsError('Collaboration error', new Error('Cause'));
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('CollaborativeToolsError');
      expect(error.message).toBe('Collaboration error');
      expect(error.cause).toBeInstanceOf(Error);
    });

    it('should handle API errors gracefully', async () => {
      // Mock a failing API call
      const failingIntegration = new GitHubIntegrationLayer('invalid-token');
      
      // This should throw but be caught by error handling
      await expect(async () => {
        try {
          await failingIntegration.triageIssue('owner', 'repo', 999);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          throw error;
        }
      }).rejects.toThrow();
    });
  });

  describe('Type Safety and Interface Compatibility', () => {
    it('should maintain type safety for all return types', async () => {
      // Test that all methods return properly typed objects
      const triage: IssueTriage = await githubIntegration.triageIssue('owner', 'repo', 1);
      const prAnalysis: PRAnalysis = await githubIntegration.analyzePullRequest('owner', 'repo', 1);
      const repoHealth: RepositoryHealth = await githubIntegration.monitorRepositoryHealth('owner', 'repo');
      
      // These should all compile without issues due to proper typing
      expect(triage.priority).toBeDefined();
      expect(prAnalysis.complexity).toBeDefined();
      expect(repoHealth.overallScore).toBeDefined();
    });

    it('should support configuration type interfaces', () => {
      const options: GitHubIntegrationOptions = {
        aiConfig: { model: 'gpt-3.5-turbo' },
        rateLimitConfig: { maxRequests: 50, windowMs: 60000 }
      };

      const collabOptions: CollaborativeToolsOptions = {
        githubToken: 'test-token',
        teamAnalyzerConfig: { algorithm: 'advanced' },
        communicationConfig: { enableAnalytics: true },
        mentorshipConfig: { autoMatching: true }
      };

      expect(options.aiConfig?.model).toBe('gpt-3.5-turbo');
      expect(collabOptions.teamAnalyzerConfig?.algorithm).toBe('advanced');
    });

    it('should support workflow optimization interfaces', async () => {
      const optimization = await githubIntegration.optimizeWorkflows('owner', 'repo');
      
      if (optimization.optimizations.length > 0) {
        const firstOptimization = optimization.optimizations[0];
        expect(typeof firstOptimization.workflowId).toBe('number');
        expect(typeof firstOptimization.workflowName).toBe('string');
        expect(typeof firstOptimization.currentPerformance).toBe('number');
        expect(Array.isArray(firstOptimization.optimizationOpportunities)).toBe(true);
        expect(Array.isArray(firstOptimization.suggestedChanges)).toBe(true);
        expect(typeof firstOptimization.estimatedImprovement).toBe('number');
        expect(typeof firstOptimization.priority).toBe('string');
      }
    });
  });

  describe('Integration between GitHubIntegrationLayer and CollaborativeDevelopmentTools', () => {
    it('should work together for comprehensive analysis', async () => {
      // Test that both classes can work with the same repository
      const repoHealth = await githubIntegration.monitorRepositoryHealth('owner', 'repo');
      const teamAnalysis = await collaborativeTools.analyzeTeamCollaboration('owner', 'repo');
      
      expect(repoHealth.repository).toContain('owner/repo');
      expect(teamAnalysis.repository).toContain('owner/repo');
      
      // Both should provide complementary insights
      expect(repoHealth.metrics.collaboration).toBeDefined();
      expect(teamAnalysis.analysis.teamDynamics).toBeDefined();
    });

    it('should handle new methods required by CollaborativeDevelopmentTools', async () => {
      // Test that GitHubIntegrationLayer has all required methods for integration
      const pullRequests = await githubIntegration.getRecentPullRequests('owner', 'repo', 10);
      const issues = await githubIntegration.getRecentIssues('owner', 'repo', 10);
      const commits = await githubIntegration.getRecentCommits('owner', 'repo', 10);
      const comments = await githubIntegration.getRecentComments('owner', 'repo', 10);
      const reviews = await githubIntegration.getRecentReviews('owner', 'repo', 10);
      const contributors = await githubIntegration.getRepositoryContributors('owner', 'repo');
      
      expect(Array.isArray(pullRequests)).toBe(true);
      expect(Array.isArray(issues)).toBe(true);
      expect(Array.isArray(commits)).toBe(true);
      expect(Array.isArray(comments)).toBe(true);
      expect(Array.isArray(reviews)).toBe(true);
      expect(Array.isArray(contributors)).toBe(true);
    });
  });

  describe('AI Analyzer Integration', () => {
    it('should support AI analysis operations', async () => {
      // Test that AI analyzer methods work properly with TypeScript
      const triage = await githubIntegration.triageIssue('owner', 'repo', 1);
      
      // AI confidence should be a valid number between 0 and 1
      expect(triage.aiConfidence).toBeGreaterThanOrEqual(0);
      expect(triage.aiConfidence).toBeLessThanOrEqual(1);
      
      // AI-generated suggestions should be properly typed
      expect(Array.isArray(triage.suggestedLabels)).toBe(true);
      expect(Array.isArray(triage.suggestedAssignees)).toBe(true);
    });
  });
});