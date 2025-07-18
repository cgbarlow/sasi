/**
 * Automated Issue Triage System
 * Intelligent issue categorization and prioritization
 */

import { GitHubIntegrationLayer } from './GitHubIntegrationLayer';
import { MachineLearningClassifier } from '../ai/MachineLearningClassifier';
import { NeuralPatternMatcher } from '../ai/NeuralPatternMatcher';

export class AutomatedIssueTriage {
  private githubIntegration: GitHubIntegrationLayer;
  private classifier: MachineLearningClassifier;
  private patternMatcher: NeuralPatternMatcher;
  private triageRules: TriageRule[];
  private learningEnabled: boolean;

  constructor(options: TriageOptions) {
    this.githubIntegration = new GitHubIntegrationLayer(options.githubToken);
    this.classifier = new MachineLearningClassifier(options.mlConfig);
    this.patternMatcher = new NeuralPatternMatcher(options.patternConfig);
    this.triageRules = options.triageRules || this.getDefaultTriageRules();
    this.learningEnabled = options.learningEnabled ?? true;
  }

  /**
   * Automatically triage incoming issues
   */
  async triageIssue(owner: string, repo: string, issueNumber: number): Promise<TriageResult> {
    try {
      // Fetch issue data
      const issueData = await this.fetchIssueData(owner, repo, issueNumber);
      
      // Multi-stage analysis
      const analyses = await Promise.all([
        this.classifyIssue(issueData),
        this.matchPatterns(issueData),
        this.applyRules(issueData),
        this.analyzeContext(issueData)
      ]);

      // Combine results
      const combinedAnalysis = this.combineAnalyses(analyses);
      
      // Generate triage result
      const triageResult = await this.generateTriageResult(
        issueData,
        combinedAnalysis
      );

      // Apply triage if confidence is high
      if (triageResult.confidence > 0.8) {
        await this.applyTriage(owner, repo, issueNumber, triageResult);
      }

      // Learn from the triage
      if (this.learningEnabled) {
        await this.learnFromTriage(issueData, triageResult);
      }

      return triageResult;
    } catch (error) {
      console.error('Error in automated triage:', error);
      throw new TriageError('Failed to triage issue', error);
    }
  }

  /**
   * Batch triage multiple issues
   */
  async batchTriage(owner: string, repo: string, issueNumbers: number[]): Promise<TriageResult[]> {
    const results: TriageResult[] = [];
    
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < issueNumbers.length; i += batchSize) {
      const batch = issueNumbers.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(issueNumber => this.triageIssue(owner, repo, issueNumber))
      );
      
      results.push(...batchResults);
      
      // Rate limiting delay
      if (i + batchSize < issueNumbers.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  /**
   * Smart label suggestion based on issue content
   */
  async suggestLabels(issueData: IssueData): Promise<LabelSuggestion[]> {
    const suggestions: LabelSuggestion[] = [];
    
    // Content-based suggestions
    const contentSuggestions = await this.classifier.suggestLabels(issueData.content);
    suggestions.push(...contentSuggestions);
    
    // Pattern-based suggestions
    const patternSuggestions = await this.patternMatcher.suggestLabels(issueData.patterns);
    suggestions.push(...patternSuggestions);
    
    // Rule-based suggestions
    const ruleSuggestions = this.applyLabelRules(issueData);
    suggestions.push(...ruleSuggestions);
    
    // Deduplicate and rank suggestions
    return this.rankLabelSuggestions(suggestions);
  }

  /**
   * Intelligent assignee suggestion
   */
  async suggestAssignees(owner: string, repo: string, issueData: IssueData): Promise<AssigneeSuggestion[]> {
    const suggestions: AssigneeSuggestion[] = [];
    
    // Expertise-based assignment
    const expertiseSuggestions = await this.findExpertiseMatches(owner, repo, issueData);
    suggestions.push(...expertiseSuggestions);
    
    // Workload-based assignment
    const workloadSuggestions = await this.findWorkloadOptimal(owner, repo, issueData);
    suggestions.push(...workloadSuggestions);
    
    // Historical pattern-based assignment
    const historicalSuggestions = await this.findHistoricalMatches(owner, repo, issueData);
    suggestions.push(...historicalSuggestions);
    
    return this.rankAssigneeSuggestions(suggestions);
  }

  /**
   * Priority assessment with confidence scoring
   */
  async assessPriority(issueData: IssueData): Promise<PriorityAssessment> {
    const assessments = await Promise.all([
      this.assessSeverity(issueData),
      this.assessUrgency(issueData),
      this.assessBusinessImpact(issueData),
      this.assessUserImpact(issueData)
    ]);
    
    const weightedScore = this.calculateWeightedPriority(assessments);
    const confidence = this.calculateConfidence(assessments);
    
    return {
      priority: this.scoreToPriority(weightedScore),
      score: weightedScore,
      confidence,
      reasoning: this.generatePriorityReasoning(assessments),
      factors: assessments
    };
  }

  /**
   * Duplicate detection and linking
   */
  async detectDuplicates(owner: string, repo: string, issueData: IssueData): Promise<DuplicateDetection> {
    // Semantic similarity search
    const semanticDuplicates = await this.findSemanticDuplicates(owner, repo, issueData);
    
    // Pattern matching for duplicates
    const patternDuplicates = await this.findPatternDuplicates(owner, repo, issueData);
    
    // Keyword-based duplicates
    const keywordDuplicates = await this.findKeywordDuplicates(owner, repo, issueData);
    
    // Combine and rank duplicates
    const allDuplicates = [...semanticDuplicates, ...patternDuplicates, ...keywordDuplicates];
    const rankedDuplicates = this.rankDuplicates(allDuplicates);
    
    return {
      isDuplicate: rankedDuplicates.length > 0 && rankedDuplicates[0].confidence > 0.7,
      duplicates: rankedDuplicates,
      confidence: rankedDuplicates[0]?.confidence || 0
    };
  }

  /**
   * Automated response generation
   */
  async generateResponse(issueData: IssueData, triageResult: TriageResult): Promise<AutomatedResponse> {
    const responseTemplates = await this.getResponseTemplates(triageResult.category);
    
    // Generate personalized response
    const response = await this.personalizeResponse(
      responseTemplates,
      issueData,
      triageResult
    );
    
    return {
      message: response.message,
      actions: response.actions,
      confidence: response.confidence,
      requiresHumanReview: response.confidence < 0.8
    };
  }

  // Private helper methods
  private async fetchIssueData(owner: string, repo: string, issueNumber: number): Promise<IssueData> {
    // Comprehensive issue data collection
    const issue = await this.githubIntegration.getIssue(owner, repo, issueNumber);
    const comments = await this.githubIntegration.getIssueComments(owner, repo, issueNumber);
    const events = await this.githubIntegration.getIssueEvents(owner, repo, issueNumber);
    
    return {
      issue,
      comments,
      events,
      content: this.extractContent(issue, comments),
      patterns: this.extractPatterns(issue, comments),
      metadata: this.extractMetadata(issue, comments, events)
    };
  }

  private async classifyIssue(issueData: IssueData): Promise<ClassificationResult> {
    return await this.classifier.classify(issueData);
  }

  private async matchPatterns(issueData: IssueData): Promise<PatternMatchResult> {
    return await this.patternMatcher.match(issueData);
  }

  private async applyRules(issueData: IssueData): Promise<RuleResult> {
    const results: RuleResult[] = [];
    
    for (const rule of this.triageRules) {
      if (rule.condition(issueData)) {
        results.push(rule.action(issueData));
      }
    }
    
    return this.combineRuleResults(results);
  }

  private async analyzeContext(issueData: IssueData): Promise<ContextResult> {
    // Analyze issue context (repository state, recent issues, etc.)
    return {
      repositoryContext: await this.analyzeRepositoryContext(issueData),
      temporalContext: await this.analyzeTemporalContext(issueData),
      userContext: await this.analyzeUserContext(issueData)
    };
  }

  private combineAnalyses(analyses: any[]): CombinedAnalysis {
    // Intelligent combination of different analysis results
    return {
      classification: analyses[0],
      patterns: analyses[1],
      rules: analyses[2],
      context: analyses[3],
      confidence: this.calculateCombinedConfidence(analyses)
    };
  }

  private async generateTriageResult(
    issueData: IssueData,
    analysis: CombinedAnalysis
  ): Promise<TriageResult> {
    const priority = await this.assessPriority(issueData);
    const labels = await this.suggestLabels(issueData);
    const assignees = await this.suggestAssignees(
      issueData.issue.owner,
      issueData.issue.repo,
      issueData
    );
    const duplicates = await this.detectDuplicates(
      issueData.issue.owner,
      issueData.issue.repo,
      issueData
    );
    
    return {
      issueNumber: issueData.issue.number,
      priority: priority.priority,
      category: analysis.classification.category,
      severity: analysis.classification.severity,
      confidence: analysis.confidence,
      suggestedLabels: labels.map(l => l.label),
      suggestedAssignees: assignees.map(a => a.username),
      duplicates: duplicates.duplicates,
      automatedResponse: await this.generateResponse(issueData, {
        priority: priority.priority,
        category: analysis.classification.category,
        confidence: analysis.confidence
      } as TriageResult),
      reasoning: this.generateReasoning(analysis),
      timestamp: new Date().toISOString()
    };
  }

  private async applyTriage(
    owner: string,
    repo: string,
    issueNumber: number,
    triageResult: TriageResult
  ): Promise<void> {
    // Apply triage results to the issue
    await this.githubIntegration.updateIssue(owner, repo, issueNumber, {
      labels: triageResult.suggestedLabels,
      assignees: triageResult.suggestedAssignees
    });
    
    // Add automated comment if confidence is high
    if (triageResult.confidence > 0.9 && triageResult.automatedResponse) {
      await this.githubIntegration.addComment(
        owner,
        repo,
        issueNumber,
        triageResult.automatedResponse.message
      );
    }
  }

  private async learnFromTriage(issueData: IssueData, triageResult: TriageResult): Promise<void> {
    // Update ML models with new data
    await this.classifier.learn(issueData, triageResult);
    await this.patternMatcher.learn(issueData, triageResult);
  }

  private getDefaultTriageRules(): TriageRule[] {
    return [
      {
        name: 'Security Issue',
        condition: (data) => /security|vulnerability|exploit/i.test(data.content),
        action: (data) => ({ priority: 'critical', labels: ['security'] })
      },
      {
        name: 'Bug Report',
        condition: (data) => /bug|error|crash|exception/i.test(data.content),
        action: (data) => ({ priority: 'high', labels: ['bug'] })
      },
      {
        name: 'Feature Request',
        condition: (data) => /feature|enhancement|improvement/i.test(data.content),
        action: (data) => ({ priority: 'medium', labels: ['enhancement'] })
      },
      {
        name: 'Documentation',
        condition: (data) => /documentation|docs|readme/i.test(data.content),
        action: (data) => ({ priority: 'low', labels: ['documentation'] })
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractContent(issue: any, comments: any[]): string {
    return [issue.title, issue.body, ...comments.map(c => c.body)].join(' ');
  }

  private extractPatterns(issue: any, comments: any[]): string[] {
    // Extract patterns from issue content
    const content = this.extractContent(issue, comments);
    const patterns = [];
    
    // Code patterns
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    patterns.push(...codeBlocks);
    
    // Error patterns
    const errorPatterns = content.match(/error|exception|failed|crash/gi) || [];
    patterns.push(...errorPatterns);
    
    return patterns;
  }

  private extractMetadata(issue: any, comments: any[], events: any[]): any {
    return {
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      authorAssociation: issue.author_association,
      commentCount: comments.length,
      eventCount: events.length,
      labels: issue.labels,
      milestone: issue.milestone
    };
  }

  // Additional helper methods would be implemented here...
  private calculateWeightedPriority(assessments: any[]): number {
    // Implementation for weighted priority calculation
    return assessments.reduce((sum, assessment) => sum + assessment.score, 0) / assessments.length;
  }

  private calculateConfidence(assessments: any[]): number {
    // Implementation for confidence calculation
    return assessments.reduce((sum, assessment) => sum + assessment.confidence, 0) / assessments.length;
  }

  private scoreToPriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private generatePriorityReasoning(assessments: any[]): string {
    return assessments.map(a => a.reasoning).join('; ');
  }

  private generateReasoning(analysis: CombinedAnalysis): string {
    return `Analysis based on classification (${analysis.classification.category}), ` +
           `patterns (${analysis.patterns.matchCount} matches), ` +
           `rules (${analysis.rules.appliedCount} applied), ` +
           `and context analysis with ${analysis.confidence} confidence.`;
  }
}

// Type definitions
interface TriageOptions {
  githubToken: string;
  mlConfig?: any;
  patternConfig?: any;
  triageRules?: TriageRule[];
  learningEnabled?: boolean;
}

interface TriageRule {
  name: string;
  condition: (data: IssueData) => boolean;
  action: (data: IssueData) => any;
}

interface IssueData {
  issue: any;
  comments: any[];
  events: any[];
  content: string;
  patterns: string[];
  metadata: any;
}

interface TriageResult {
  issueNumber: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  severity: number;
  confidence: number;
  suggestedLabels: string[];
  suggestedAssignees: string[];
  duplicates: any[];
  automatedResponse?: AutomatedResponse;
  reasoning: string;
  timestamp: string;
}

interface ClassificationResult {
  category: string;
  severity: number;
  confidence: number;
}

interface PatternMatchResult {
  matchCount: number;
  matches: any[];
  confidence: number;
}

interface RuleResult {
  appliedCount: number;
  results: any[];
}

interface ContextResult {
  repositoryContext: any;
  temporalContext: any;
  userContext: any;
}

interface CombinedAnalysis {
  classification: ClassificationResult;
  patterns: PatternMatchResult;
  rules: RuleResult;
  context: ContextResult;
  confidence: number;
}

interface LabelSuggestion {
  label: string;
  confidence: number;
  reasoning: string;
}

interface AssigneeSuggestion {
  username: string;
  confidence: number;
  reasoning: string;
}

interface PriorityAssessment {
  priority: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  confidence: number;
  reasoning: string;
  factors: any[];
}

interface DuplicateDetection {
  isDuplicate: boolean;
  duplicates: any[];
  confidence: number;
}

interface AutomatedResponse {
  message: string;
  actions: string[];
  confidence: number;
  requiresHumanReview: boolean;
}

class TriageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TriageError';
  }
}

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
};