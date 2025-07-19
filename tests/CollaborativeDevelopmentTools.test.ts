/**
 * Tests for CollaborativeDevelopmentTools
 * TDD tests for missing methods implementation
 */

import { CollaborativeDevelopmentTools } from '../src/github/CollaborativeDevelopmentTools';

describe('CollaborativeDevelopmentTools', () => {
  let tools: CollaborativeDevelopmentTools;
  
  beforeEach(() => {
    tools = new CollaborativeDevelopmentTools({
      githubToken: 'test-token',
      teamAnalyzerConfig: {},
      communicationConfig: {},
      mentorshipConfig: {}
    });
  });

  describe('analyzeFeedbackPatterns', () => {
    it('should analyze feedback patterns from reviews', () => {
      const reviews = [
        {
          body: 'This looks great! Good work on the implementation.',
          user: { login: 'reviewer1' },
          submitted_at: '2024-01-01T00:00:00Z'
        },
        {
          body: 'There are some issues with this approach. Could you consider using a different method?',
          user: { login: 'reviewer2' },
          submitted_at: '2024-01-02T00:00:00Z'
        },
        {
          body: 'I suggest improving the error handling. This code might break in edge cases.',
          user: { login: 'reviewer1' },
          submitted_at: '2024-01-03T00:00:00Z'
        }
      ];

      // Access private method for testing
      const result = (tools as any).analyzeFeedbackPatterns(reviews);

      expect(result).toHaveProperty('positiveCount');
      expect(result).toHaveProperty('negativeCount');
      expect(result).toHaveProperty('constructiveCount');
      expect(result).toHaveProperty('averageLength');
      expect(result).toHaveProperty('feedbackQuality');
      expect(result.constructiveCount).toBe(1);
      expect(result.positiveCount).toBe(1);
      expect(result.negativeCount).toBe(1);
      expect(result.feedbackQuality).toBeGreaterThan(0);
    });

    it('should handle empty reviews array', () => {
      const result = (tools as any).analyzeFeedbackPatterns([]);
      expect(result.positiveCount).toBe(0);
      expect(result.negativeCount).toBe(0);
      expect(result.constructiveCount).toBe(0);
      expect(result.averageLength).toBe(0);
    });
  });

  describe('calculateClarityIndex', () => {
    it('should calculate clarity index for comments', () => {
      const comments = [
        {
          body: 'This is a clear and concise explanation of the feature. It works well.',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          body: 'What does this function do? I am confused about the purpose.',
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          body: 'The API endpoint returns JSON data with user information including name, email, and preferences.',
          created_at: '2024-01-03T00:00:00Z'
        }
      ];

      const result = (tools as any).calculateClarityIndex(comments);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty comments', () => {
      const result = (tools as any).calculateClarityIndex([]);
      expect(result).toBe(0);
    });

    it('should handle comments with varying clarity levels', () => {
      const clearComments = [
        { body: 'This feature adds user authentication using JWT tokens.' }
      ];
      const unclearComments = [
        { body: 'Stuff happens here and then other stuff and maybe it works???' }
      ];

      const clearResult = (tools as any).calculateClarityIndex(clearComments);
      const unclearResult = (tools as any).calculateClarityIndex(unclearComments);

      expect(clearResult).toBeGreaterThan(unclearResult);
    });
  });

  describe('analyzeEmotionalTone', () => {
    it('should analyze emotional tone of comments', () => {
      const comments = [
        {
          body: 'This is awesome! Great job on this feature.',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          body: 'I am frustrated with this broken implementation.',
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          body: 'I am curious about how this algorithm works.',
          created_at: '2024-01-03T00:00:00Z'
        }
      ];

      const result = (tools as any).analyzeEmotionalTone(comments);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('positiveScore');
      expect(result).toHaveProperty('negativeScore');
      expect(result).toHaveProperty('emotions');
      expect(result.emotions).toHaveProperty('enthusiasm');
      expect(result.emotions).toHaveProperty('frustration');
      expect(result.emotions).toHaveProperty('curiosity');
      expect(result.overall).toMatch(/positive|negative|neutral/);
    });

    it('should handle empty comments', () => {
      const result = (tools as any).analyzeEmotionalTone([]);
      expect(result.overall).toBe('neutral');
      expect(result.positiveScore).toBe(0);
      expect(result.negativeScore).toBe(0);
    });
  });

  describe('identifyCommunicationBarriers', () => {
    it('should identify communication barriers from interactions', () => {
      const interactions = [
        {
          type: 'comment',
          participants: ['user1'],
          timestamp: '2024-01-01T00:00:00Z',
          data: { body: 'This is unclear and hard to understand' }
        },
        {
          type: 'review',
          participants: ['user2'],
          timestamp: '2024-01-03T00:00:00Z', // 2 days later
          data: { body: 'Response to previous comment' }
        }
      ];

      const result = (tools as any).identifyCommunicationBarriers(interactions);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('severity');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('impact');
        expect(result[0]).toHaveProperty('solutions');
      }
    });
  });

  describe('analyzeExpertiseDistribution', () => {
    it('should analyze expertise distribution among contributors', () => {
      const contributors = [
        { login: 'senior1', contributions: 150 },
        { login: 'mid1', contributions: 75 },
        { login: 'junior1', contributions: 25 },
        { login: 'beginner1', contributions: 5 }
      ];

      const result = (tools as any).analyzeExpertiseDistribution(contributors);

      expect(result).toHaveProperty('expertiseLevels');
      expect(result).toHaveProperty('knowledgeConcentration');
      expect(result).toHaveProperty('expertiseGaps');
      expect(result).toHaveProperty('mentorPotential');
      expect(result.expertiseLevels).toHaveProperty('senior');
      expect(result.expertiseLevels).toHaveProperty('mid');
      expect(result.expertiseLevels).toHaveProperty('junior');
      expect(result.knowledgeConcentration).toBeGreaterThanOrEqual(0);
      expect(result.knowledgeConcentration).toBeLessThanOrEqual(1);
    });

    it('should handle empty contributors array', () => {
      const result = (tools as any).analyzeExpertiseDistribution([]);
      expect(result.knowledgeConcentration).toBe(0);
      expect(result.expertiseGaps).toEqual([]);
    });
  });

  describe('analyzeMentoringActivity', () => {
    it('should analyze mentoring activity from interactions', () => {
      const interactions = [
        {
          type: 'comment',
          participants: ['mentor1'],
          timestamp: '2024-01-01T00:00:00Z',
          data: { body: 'Let me help you understand this concept. Here is an example...' }
        },
        {
          type: 'comment',
          participants: ['mentee1'],
          timestamp: '2024-01-02T00:00:00Z',
          data: { body: 'How does this function work? Can you explain?' }
        }
      ];

      const result = (tools as any).analyzeMentoringActivity(interactions);

      expect(result).toHaveProperty('mentoringEvents');
      expect(result).toHaveProperty('mentorshipPairs');
      expect(result).toHaveProperty('knowledgeTransferScore');
      expect(result).toHaveProperty('helpfulnessIndex');
      expect(result).toHaveProperty('learningIndicators');
      expect(result.knowledgeTransferScore).toBeGreaterThanOrEqual(0);
      expect(result.knowledgeTransferScore).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeDocumentationContribution', () => {
    it('should analyze documentation contributions from commits', () => {
      const commits = [
        {
          commit: { message: 'Update README with installation instructions' },
          author: { login: 'contributor1' },
          files: [{ filename: 'README.md', additions: 20 }]
        },
        {
          commit: { message: 'Add JSDoc comments to utility functions' },
          author: { login: 'contributor2' },
          files: [{ filename: 'utils.js', additions: 5, patch: '// Added documentation comments' }]
        },
        {
          commit: { message: 'Fix bug in user authentication' },
          author: { login: 'contributor1' },
          files: [{ filename: 'auth.js', additions: 2 }]
        }
      ];

      const result = (tools as any).analyzeDocumentationContribution(commits);

      expect(result).toHaveProperty('docCommitRatio');
      expect(result).toHaveProperty('documentationTypes');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('contributors');
      expect(result.docCommitRatio).toBeGreaterThanOrEqual(0);
      expect(result.docCommitRatio).toBeLessThanOrEqual(1);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('identifyLearningIndicators', () => {
    it('should identify learning indicators from interactions', () => {
      const interactions = [
        {
          type: 'comment',
          participants: ['learner1'],
          timestamp: '2024-01-01T00:00:00Z',
          data: { body: 'How do I implement this algorithm? I want to learn the best approach.' }
        },
        {
          type: 'comment',
          participants: ['learner1'],
          timestamp: '2024-01-02T00:00:00Z',
          data: { body: 'Thanks! Now I understand how the code works.' }
        }
      ];

      const result = (tools as any).identifyLearningIndicators(interactions);

      expect(result).toHaveProperty('learningActivities');
      expect(result).toHaveProperty('skillDevelopment');
      expect(result).toHaveProperty('learningPatterns');
      expect(Array.isArray(result.learningActivities)).toBe(true);
      expect(typeof result.skillDevelopment).toBe('object');
    });
  });

  describe('assessKnowledgeHoardingRisk', () => {
    it('should assess knowledge hoarding risk', () => {
      const contributors = [
        { contributions: 200 }, // Dominant contributor
        { contributions: 10 },
        { contributions: 5 },
        { contributions: 2 }
      ];

      const result = (tools as any).assessKnowledgeHoardingRisk(contributors);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty contributors', () => {
      const result = (tools as any).assessKnowledgeHoardingRisk([]);
      expect(result).toBe(0);
    });

    it('should return higher risk for concentrated contributions', () => {
      const balanced = [
        { contributions: 50 },
        { contributions: 45 },
        { contributions: 40 },
        { contributions: 35 }
      ];
      const concentrated = [
        { contributions: 150 },
        { contributions: 5 },
        { contributions: 5 },
        { contributions: 5 }
      ];

      const balancedRisk = (tools as any).assessKnowledgeHoardingRisk(balanced);
      const concentratedRisk = (tools as any).assessKnowledgeHoardingRisk(concentrated);

      expect(concentratedRisk).toBeGreaterThan(balancedRisk);
    });
  });

  describe('analyzeCrossTeamLearning', () => {
    it('should analyze cross-team learning patterns', () => {
      const interactions = [
        {
          type: 'comment',
          participants: ['frontend_dev', 'backend_dev'],
          timestamp: '2024-01-01T00:00:00Z',
          data: { body: 'How should the API endpoint handle user authentication?' }
        },
        {
          type: 'review',
          participants: ['devops_engineer'],
          timestamp: '2024-01-02T00:00:00Z',
          data: { body: 'The deployment configuration needs Docker optimization.' }
        }
      ];

      const result = (tools as any).analyzeCrossTeamLearning(interactions);

      expect(result).toHaveProperty('crossTeamInteractions');
      expect(result).toHaveProperty('knowledgeExchange');
      expect(result).toHaveProperty('collaborationIndex');
      expect(result.collaborationIndex).toBeGreaterThanOrEqual(0);
      expect(result.collaborationIndex).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateKnowledgeRetention', () => {
    it('should calculate knowledge retention score', () => {
      const contributors = [
        { login: 'active1', contributions: 100 },
        { login: 'active2', contributions: 80 },
        { login: 'moderate1', contributions: 20 },
        { login: 'inactive1', contributions: 2 }
      ];

      const result = (tools as any).calculateKnowledgeRetention(contributors);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty contributors', () => {
      const result = (tools as any).calculateKnowledgeRetention([]);
      expect(result).toBe(0);
    });
  });

  describe('identifyJuniorDevelopers', () => {
    it('should identify junior developers from contributors', () => {
      const contributors = [
        { login: 'senior1', contributions: 150 },
        { login: 'junior1', contributions: 25 },
        { login: 'junior2', contributions: 10 },
        { login: 'beginner1', contributions: 3 }
      ];

      const result = (tools as any).identifyJuniorDevelopers(contributors);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((junior: any) => {
        expect(junior.contributions).toBeLessThanOrEqual(50);
        expect(junior).toHaveProperty('juniorScore');
        expect(junior).toHaveProperty('growthPotential');
      });
    });
  });

  describe('identifyQuickWins', () => {
    it('should identify quick wins from optimization data', () => {
      const optimization = {
        bottleneckIdentification: {
          bottlenecks: [
            {
              type: 'process',
              description: 'Manual deployment process',
              effort: 'low',
              impact: 'high',
              solutions: ['Automate deployment', 'Use CI/CD pipeline']
            }
          ]
        },
        automationOpportunities: {
          opportunities: [
            {
              task: 'testing',
              complexity: 'low',
              savings: 8 // hours per week
            }
          ]
        }
      };

      const result = (tools as any).identifyQuickWins(optimization);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((win: any) => {
        expect(win).toHaveProperty('type');
        expect(win).toHaveProperty('title');
        expect(win).toHaveProperty('effort');
        expect(win).toHaveProperty('impact');
        expect(win).toHaveProperty('timeframe');
        expect(win).toHaveProperty('actions');
      });
    });
  });

  describe('developLongTermStrategy', () => {
    it('should develop long-term strategy from optimization data', () => {
      const optimization = {
        workflowAnalysis: { efficiency: 0.6 },
        automationOpportunities: { opportunities: [] },
        toolOptimization: { optimizations: [] }
      };

      const result = (tools as any).developLongTermStrategy(optimization);

      expect(result).toHaveProperty('vision');
      expect(result).toHaveProperty('goals');
      expect(result).toHaveProperty('phases');
      expect(result).toHaveProperty('keyInitiatives');
      expect(result).toHaveProperty('successMetrics');
      expect(result).toHaveProperty('riskMitigation');
      expect(Array.isArray(result.goals)).toBe(true);
      expect(Array.isArray(result.phases)).toBe(true);
      expect(Array.isArray(result.keyInitiatives)).toBe(true);
      expect(typeof result.vision).toBe('string');
      expect(result.vision.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    describe('calculateGiniCoefficient', () => {
      it('should calculate Gini coefficient correctly', () => {
        // Perfect equality
        const equal = [10, 10, 10, 10];
        const equalGini = (tools as any).calculateGiniCoefficient(equal);
        expect(equalGini).toBeCloseTo(0, 1);

        // Perfect inequality
        const unequal = [0, 0, 0, 100];
        const unequalGini = (tools as any).calculateGiniCoefficient(unequal);
        expect(unequalGini).toBeGreaterThan(0.7);

        // Moderate inequality
        const moderate = [10, 20, 30, 40];
        const moderateGini = (tools as any).calculateGiniCoefficient(moderate);
        expect(moderateGini).toBeGreaterThan(0);
        expect(moderateGini).toBeLessThan(unequalGini);
      });
    });

    describe('calculateShannonDiversity', () => {
      it('should calculate Shannon diversity index', () => {
        // Maximum diversity (equal distribution)
        const maxDiversity = [1, 1, 1, 1];
        const maxResult = (tools as any).calculateShannonDiversity(maxDiversity);
        expect(maxResult).toBeCloseTo(1, 1);

        // Minimum diversity (all in one category)
        const minDiversity = [4, 0, 0, 0];
        const minResult = (tools as any).calculateShannonDiversity(minDiversity);
        expect(minResult).toBeCloseTo(0, 1);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex collaboration analysis workflow', async () => {
      // Mock GitHub integration methods
      const mockCollaborationData = {
        pullRequests: [
          { user: { login: 'dev1' }, created_at: '2024-01-01T00:00:00Z' }
        ],
        issues: [
          { user: { login: 'dev2' }, created_at: '2024-01-02T00:00:00Z' }
        ],
        commits: [
          { 
            author: { login: 'dev1' },
            commit: { message: 'Add documentation', author: { date: '2024-01-01T00:00:00Z' } }
          }
        ],
        comments: [
          { body: 'This looks great!', user: { login: 'dev2' }, created_at: '2024-01-01T00:00:00Z' }
        ],
        reviews: [
          { body: 'Good work', user: { login: 'dev3' }, submitted_at: '2024-01-01T00:00:00Z' }
        ],
        contributors: [
          { login: 'dev1', contributions: 100 },
          { login: 'dev2', contributions: 50 },
          { login: 'dev3', contributions: 25 }
        ]
      };

      // Mock the private method that gathers collaboration data
      jest.spyOn(tools as any, 'gatherCollaborationData').mockResolvedValue({
        ...mockCollaborationData,
        interactions: [],
        collaborations: [],
        timeline: []
      });

      const result = await tools.analyzeTeamCollaboration('test-owner', 'test-repo');

      expect(result).toHaveProperty('repository', 'test-owner/test-repo');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('analysis');
      expect(result.analysis).toHaveProperty('teamDynamics');
      expect(result.analysis).toHaveProperty('communicationPatterns');
      expect(result.analysis).toHaveProperty('knowledgeSharing');
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });
});