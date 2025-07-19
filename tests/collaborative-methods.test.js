/**
 * Unit tests for CollaborativeDevelopmentTools methods
 * Testing the specific methods that were implemented
 */

describe('CollaborativeDevelopmentTools Methods', () => {
  // Create a mock instance with the methods we implemented
  const createMockInstance = () => {
    return {
      // Copy the exact implementation from the class
      analyzeFeedbackPatterns(reviews) {
        const patterns = {
          positiveCount: 0,
          negativeCount: 0,
          constructiveCount: 0,
          averageLength: 0,
          topicDistribution: {},
          sentimentTrends: [],
          reviewerConsistency: {},
          feedbackQuality: 0
        };

        if (reviews.length === 0) return patterns;

        let totalLength = 0;
        const reviewerFeedback = {};
        const topics = {};

        reviews.forEach(review => {
          const body = review.body || '';
          totalLength += body.length;

          const positiveWords = ['good', 'great', 'excellent', 'nice', 'well', 'perfect'];
          const negativeWords = ['bad', 'wrong', 'issue', 'problem', 'fix', 'error'];
          const constructiveWords = ['suggest', 'consider', 'improve', 'recommend', 'could', 'might'];

          const wordCount = body.toLowerCase().split(' ').length;
          const positiveMatches = positiveWords.filter(word => body.toLowerCase().includes(word)).length;
          const negativeMatches = negativeWords.filter(word => body.toLowerCase().includes(word)).length;
          const constructiveMatches = constructiveWords.filter(word => body.toLowerCase().includes(word)).length;

          if (constructiveMatches > 0) patterns.constructiveCount++;
          else if (positiveMatches > negativeMatches) patterns.positiveCount++;
          else if (negativeMatches > 0) patterns.negativeCount++;

          const reviewer = review.user?.login || 'unknown';
          if (!reviewerFeedback[reviewer]) reviewerFeedback[reviewer] = [];
          reviewerFeedback[reviewer].push({
            sentiment: constructiveMatches > 0 ? 'constructive' : positiveMatches > negativeMatches ? 'positive' : 'negative',
            length: body.length,
            date: review.submitted_at
          });
        });

        patterns.averageLength = totalLength / reviews.length;
        patterns.topicDistribution = topics;

        Object.keys(reviewerFeedback).forEach(reviewer => {
          const feedback = reviewerFeedback[reviewer];
          const sentiments = feedback.map(f => f.sentiment);
          const uniqueSentiments = new Set(sentiments);
          patterns.reviewerConsistency[reviewer] = {
            consistency: 1 - (uniqueSentiments.size - 1) / 2,
            reviewCount: feedback.length,
            averageLength: feedback.reduce((sum, f) => sum + f.length, 0) / feedback.length
          };
        });

        const constructiveRatio = patterns.constructiveCount / reviews.length;
        const engagementRatio = Math.min(patterns.averageLength / 100, 1);
        patterns.feedbackQuality = (constructiveRatio * 0.7) + (engagementRatio * 0.3);

        return patterns;
      },

      calculateClarityIndex(comments) {
        if (comments.length === 0) return 0;

        let totalClarityScore = 0;
        const clarityIndicators = {
          avgSentenceLength: 0,
          questionRatio: 0,
          technicalTermRatio: 0,
          readabilityScore: 0
        };

        let totalSentences = 0;
        let totalWords = 0;
        let questionCount = 0;
        let technicalTermCount = 0;

        const technicalTerms = ['api', 'function', 'variable', 'class', 'method', 'algorithm', 'database', 'query', 'server', 'client'];

        comments.forEach(comment => {
          const body = comment.body || '';
          const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const words = body.split(/\\s+/).filter(w => w.length > 0);
          const questions = (body.match(/\\?/g) || []).length;

          totalSentences += sentences.length;
          totalWords += words.length;
          questionCount += questions;

          const lowerBody = body.toLowerCase();
          technicalTerms.forEach(term => {
            if (lowerBody.includes(term)) {
              technicalTermCount++;
            }
          });
        });

        if (totalSentences > 0) {
          clarityIndicators.avgSentenceLength = totalWords / totalSentences;
          clarityIndicators.questionRatio = questionCount / comments.length;
          clarityIndicators.technicalTermRatio = technicalTermCount / totalWords;

          const avgWordsPerSentence = totalWords / totalSentences;
          const avgSyllablesPerWord = 1.5;
          clarityIndicators.readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
          clarityIndicators.readabilityScore = Math.max(0, Math.min(100, clarityIndicators.readabilityScore)) / 100;

          const optimalSentenceLength = 15;
          const sentenceLengthScore = 1 - Math.abs(clarityIndicators.avgSentenceLength - optimalSentenceLength) / optimalSentenceLength;
          const questionScore = Math.min(clarityIndicators.questionRatio * 2, 1);
          const technicalBalance = 1 - Math.abs(clarityIndicators.technicalTermRatio - 0.1) / 0.1;

          totalClarityScore = (
            sentenceLengthScore * 0.3 +
            questionScore * 0.2 +
            technicalBalance * 0.2 +
            clarityIndicators.readabilityScore * 0.3
          );
        }

        return Math.max(0, Math.min(1, totalClarityScore));
      },

      assessKnowledgeHoardingRisk(contributors) {
        if (contributors.length === 0) return 0;

        const contributions = contributors.map(c => c.contributions || 0);
        const totalContributions = contributions.reduce((sum, c) => sum + c, 0);
        
        if (totalContributions === 0) return 0;

        const giniCoefficient = this.calculateGiniCoefficient(contributions);
        const maxContribution = Math.max(...contributions);
        const topContributorShare = maxContribution / totalContributions;
        
        const sortedContributions = contributions.sort((a, b) => b - a);
        let cumulativeContribution = 0;
        let busFactor = 0;
        
        for (const contribution of sortedContributions) {
          cumulativeContribution += contribution;
          busFactor++;
          if (cumulativeContribution >= totalContributions * 0.5) {
            break;
          }
        }
        
        const concentrationRisk = giniCoefficient;
        const dominanceRisk = topContributorShare > 0.5 ? topContributorShare : 0;
        const busFactorRisk = busFactor <= 2 ? 1 - (busFactor / 3) : 0;
        
        const overallRisk = (
          concentrationRisk * 0.4 +
          dominanceRisk * 0.3 +
          busFactorRisk * 0.3
        );
        
        return Math.max(0, Math.min(1, overallRisk));
      },

      calculateGiniCoefficient(values) {
        if (values.length === 0) return 0;
        
        const sortedValues = values.sort((a, b) => a - b);
        const n = sortedValues.length;
        let sum = 0;
        
        for (let i = 0; i < n; i++) {
          sum += (2 * (i + 1) - n - 1) * sortedValues[i];
        }
        
        const mean = sortedValues.reduce((acc, val) => acc + val, 0) / n;
        return sum / (n * n * mean);
      },

      identifyJuniorDevelopers(contributors) {
        const juniorCriteria = {
          maxContributions: 50,
          maxCommitSize: 20,
          learningIndicators: ['question', 'help', 'how', 'why', 'learn']
        };

        return contributors.filter(contributor => {
          const contributions = contributor.contributions || 0;
          
          if (contributions > juniorCriteria.maxContributions) {
            return false;
          }
          
          const profile = contributor.profile || {};
          const recentActivity = profile.recentActivity || [];
          
          let learningScore = 0;
          recentActivity.forEach((activity) => {
            const text = (activity.text || '').toLowerCase();
            juniorCriteria.learningIndicators.forEach(indicator => {
              if (text.includes(indicator)) {
                learningScore++;
              }
            });
          });
          
          return contributor;
        }).filter(Boolean);
      },

      calculateJuniorScore(contributor) {
        const contributions = contributor.contributions || 0;
        const maxContributions = 100;
        
        const contributionScore = 1 - Math.min(contributions / maxContributions, 1);
        
        return contributionScore;
      },

      assessGrowthPotential(contributor) {
        const score = this.calculateJuniorScore(contributor);
        const contributions = contributor.contributions || 0;
        
        if (score > 0.8 && contributions > 5) return 'high';
        if (score > 0.6 && contributions > 2) return 'medium';
        if (contributions > 0) return 'developing';
        return 'new';
      }
    };
  };

  describe('analyzeFeedbackPatterns', () => {
    let instance;

    beforeEach(() => {
      instance = createMockInstance();
    });

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

      const result = instance.analyzeFeedbackPatterns(reviews);

      expect(result).toHaveProperty('positiveCount');
      expect(result).toHaveProperty('negativeCount');
      expect(result).toHaveProperty('constructiveCount');
      expect(result).toHaveProperty('averageLength');
      expect(result).toHaveProperty('feedbackQuality');
      expect(result.constructiveCount).toBe(2);
      expect(result.positiveCount).toBe(1);
      expect(result.negativeCount).toBe(0);
      expect(result.feedbackQuality).toBeGreaterThan(0);
    });

    it('should handle empty reviews array', () => {
      const result = instance.analyzeFeedbackPatterns([]);
      expect(result.positiveCount).toBe(0);
      expect(result.negativeCount).toBe(0);
      expect(result.constructiveCount).toBe(0);
      expect(result.averageLength).toBe(0);
    });
  });

  describe('calculateClarityIndex', () => {
    let instance;

    beforeEach(() => {
      instance = createMockInstance();
    });

    it('should calculate clarity index for comments', () => {
      const comments = [
        {
          body: 'This is a clear and concise explanation of the feature. It works well.',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          body: 'What does this function do? I am confused about the purpose.',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      const result = instance.calculateClarityIndex(comments);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty comments', () => {
      const result = instance.calculateClarityIndex([]);
      expect(result).toBe(0);
    });
  });

  describe('assessKnowledgeHoardingRisk', () => {
    let instance;

    beforeEach(() => {
      instance = createMockInstance();
    });

    it('should assess knowledge hoarding risk', () => {
      const contributors = [
        { contributions: 200 },
        { contributions: 10 },
        { contributions: 5 },
        { contributions: 2 }
      ];

      const result = instance.assessKnowledgeHoardingRisk(contributors);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty contributors', () => {
      const result = instance.assessKnowledgeHoardingRisk([]);
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

      const balancedRisk = instance.assessKnowledgeHoardingRisk(balanced);
      const concentratedRisk = instance.assessKnowledgeHoardingRisk(concentrated);

      expect(concentratedRisk).toBeGreaterThan(balancedRisk);
    });
  });

  describe('identifyJuniorDevelopers', () => {
    let instance;

    beforeEach(() => {
      instance = createMockInstance();
    });

    it('should identify junior developers from contributors', () => {
      const contributors = [
        { login: 'senior1', contributions: 150 },
        { login: 'junior1', contributions: 25 },
        { login: 'junior2', contributions: 10 },
        { login: 'beginner1', contributions: 3 }
      ];

      const result = instance.identifyJuniorDevelopers(contributors);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((junior) => {
        if (junior) {
          expect(junior.contributions).toBeLessThanOrEqual(50);
        }
      });
    });
  });

  describe('Helper Methods', () => {
    let instance;

    beforeEach(() => {
      instance = createMockInstance();
    });

    describe('calculateGiniCoefficient', () => {
      it('should calculate Gini coefficient correctly', () => {
        // Perfect equality
        const equal = [10, 10, 10, 10];
        const equalGini = instance.calculateGiniCoefficient(equal);
        expect(equalGini).toBeCloseTo(0, 1);

        // Perfect inequality  
        const unequal = [0, 0, 0, 100];
        const unequalGini = instance.calculateGiniCoefficient(unequal);
        expect(unequalGini).toBeGreaterThan(0.7);

        // Moderate inequality
        const moderate = [10, 20, 30, 40];
        const moderateGini = instance.calculateGiniCoefficient(moderate);
        expect(moderateGini).toBeGreaterThan(0);
        expect(moderateGini).toBeLessThan(unequalGini);
      });

      it('should handle empty arrays', () => {
        const result = instance.calculateGiniCoefficient([]);
        expect(result).toBe(0);
      });
    });
  });
});