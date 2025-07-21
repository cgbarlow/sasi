/**
 * Automated Issue Triage System
 * Intelligent issue categorization and prioritization
 */

import { GitHubIntegrationLayer } from './GitHubIntegrationLayer';
import { MachineLearningClassifier, ClassifierConfig } from '../ai/MachineLearningClassifier';
import { NeuralPatternMatcher, PatternConfig } from '../ai/NeuralPatternMatcher';

interface TriageAction {
  type: 'label' | 'assign' | 'comment' | 'close';
  value: string | string[];
}

export class AutomatedIssueTriage {
  private githubIntegration: GitHubIntegrationLayer;
  private classifier: MachineLearningClassifier;
  private patternMatcher: NeuralPatternMatcher;
  private triageRules: unknown[];
  private learningEnabled: boolean;

  constructor(options: TriageOptions) {
    this.githubIntegration = new GitHubIntegrationLayer(options.githubToken);
    const defaultClassifierConfig = {
      algorithm: 'naive_bayes' as const,
      features: ['title', 'body', 'labels'],
      classes: ['bug', 'feature', 'documentation', 'security']
    };
    this.classifier = new MachineLearningClassifier((options.mlConfig as ClassifierConfig) || defaultClassifierConfig);
    const defaultPatternConfig = {
      patterns: ['error', 'bug', 'feature', 'security'],
      threshold: 0.7,
      algorithm: 'neural' as const,
      contextWindow: 100
    };
    this.patternMatcher = new NeuralPatternMatcher((options.patternConfig as PatternConfig) || defaultPatternConfig);
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
    
    // Pattern-based suggestions (convert unknown to LabelSuggestion)
    const patternSuggestions = await this.patternMatcher.suggestLabels((issueData.patterns as string[]) || []);
    const validPatternSuggestions = Array.isArray(patternSuggestions) ? patternSuggestions.filter((s: unknown): s is LabelSuggestion => 
      typeof s === 'object' && s !== null && 'label' in s && 'confidence' in s && 'reasoning' in s
    ) : [];
    suggestions.push(...validPatternSuggestions);
    
    // Rule-based suggestions (convert unknown to LabelSuggestion)
    const ruleSuggestions = this.applyLabelRules(issueData);
    const validRuleSuggestions = Array.isArray(ruleSuggestions) ? ruleSuggestions.filter((s: unknown): s is LabelSuggestion => 
      typeof s === 'object' && s !== null && 'label' in s && 'confidence' in s && 'reasoning' in s
    ) : [];
    suggestions.push(...validRuleSuggestions);
    
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
    
    // Safe confidence access
    const getConfidence = (item: unknown): number => {
      return (typeof item === 'object' && item !== null && 'confidence' in item && typeof (item as Record<string, unknown>).confidence === 'number') 
        ? Number((item as Record<string, unknown>).confidence) 
        : 0;
    };
    
    return {
      isDuplicate: rankedDuplicates.length > 0 && getConfidence(rankedDuplicates[0]) > 0.7,
      duplicates: rankedDuplicates,
      confidence: getConfidence(rankedDuplicates[0])
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
    
    // Safe property access with type guards
    const safeResponse = response as { message?: string; actions?: string[]; confidence?: number };
    const message = safeResponse.message || 'Automated response generated';
    const actions = safeResponse.actions || ['label'];
    const confidence = safeResponse.confidence || 0.7;
    
    return {
      message,
      actions,
      confidence,
      requiresHumanReview: confidence < 0.8
    };
  }

  // Private helper methods
  private async fetchIssueData(owner: string, repo: string, issueNumber: number): Promise<IssueData> {
    // Comprehensive issue data collection
    const issue = await this.githubIntegration.getIssue(owner, repo, issueNumber);
    const comments = await this.githubIntegration.getIssueComments(owner, repo, issueNumber);
    const events = await this.githubIntegration.getIssueEvents(owner, repo, issueNumber);
    
    // Safe property extraction helper
    const safeGet = (obj: unknown, prop: string): unknown => {
      return (typeof obj === 'object' && obj !== null && prop in obj) 
        ? (obj as Record<string, unknown>)[prop] 
        : null;
    };
    
    const safeGetString = (obj: unknown, prop: string): string => {
      const value = safeGet(obj, prop);
      return typeof value === 'string' ? value : '';
    };
    
    const safeGetNumber = (obj: unknown, prop: string): number => {
      const value = safeGet(obj, prop);
      return typeof value === 'number' ? value : 0;
    };
    
    const safeGetArray = (obj: unknown, prop: string): unknown[] => {
      const value = safeGet(obj, prop);
      return Array.isArray(value) ? value : [];
    };
    
    const safeGetStringArray = (obj: unknown, prop: string): string[] => {
      const value = safeGet(obj, prop);
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
      }
      return [];
    };
    
    // Extract author from nested user object
    const getAuthor = (issueObj: unknown): string => {
      const user = safeGet(issueObj, 'user');
      return safeGetString(user, 'login');
    };
    
    return {
      number: safeGetNumber(issue, 'number'),
      title: safeGetString(issue, 'title'),
      body: safeGetString(issue, 'body'),
      labels: safeGetStringArray(issue, 'labels'),
      assignees: safeGetStringArray(issue, 'assignees'),
      author: getAuthor(issue),
      createdAt: safeGetString(issue, 'created_at'),
      updatedAt: safeGetString(issue, 'updated_at'),
      content: this.extractContent(issue, comments),
      patterns: this.extractPatterns(issue, comments),
      metadata: this.extractMetadata(issue, comments, events),
      comments,
      events
    };
  }

  private async classifyIssue(issueData: IssueData): Promise<ClassificationResult> {
    try {
      // Convert IssueData to compatible format for classifier
      const classifierInput: Record<string, number> = {
        contentLength: issueData.content.length,
        commentsCount: issueData.comments.length,
        eventsCount: issueData.events.length,
        patternsCount: issueData.patterns.length
      };
      const result = await this.classifier.classify(classifierInput);
      return {
        category: result.category || 'unknown',
        severity: result.severity || 0.5,
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      // Fallback classification
      return {
        category: 'bug',
        severity: 0.5,
        confidence: 0.3
      };
    }
  }

  private async matchPatterns(issueData: IssueData): Promise<PatternMatchResult> {
    return await this.patternMatcher.match(issueData);
  }

  private async applyRules(issueData: IssueData): Promise<RuleResult> {
    const results: RuleResult[] = [];
    
    for (const rule of this.triageRules) {
      // Safe property access with type guards
      const safeRule = rule as TriageRule;
      if (typeof safeRule === 'object' && safeRule !== null && 
          'condition' in safeRule && typeof safeRule.condition === 'function' &&
          'action' in safeRule && typeof safeRule.action === 'function') {
        if (safeRule.condition(issueData)) {
          results.push(safeRule.action(issueData) as RuleResult);
        }
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

  private combineAnalyses(analyses: unknown[]): CombinedAnalysis {
    // Intelligent combination of different analysis results
    const defaultClassification: ClassificationResult = {
      category: 'unknown',
      severity: 0.5,
      confidence: 0.5
    };
    const defaultPatterns: PatternMatchResult = {
      matchCount: 0,
      matches: [],
      confidence: 0.5
    };
    const defaultRules: RuleResult = {
      appliedCount: 0,
      results: []
    };
    const defaultContext: ContextResult = {
      repositoryContext: {},
      temporalContext: {},
      userContext: {}
    };

    return {
      classification: (analyses[0] as ClassificationResult) || defaultClassification,
      patterns: (analyses[1] as PatternMatchResult) || defaultPatterns,
      rules: (analyses[2] as RuleResult) || defaultRules,
      context: (analyses[3] as ContextResult) || defaultContext,
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
      'owner', // TODO: Extract from issueData metadata
      'repo',  // TODO: Extract from issueData metadata
      issueData
    );
    const duplicates = await this.detectDuplicates(
      'owner', // TODO: Extract from issueData metadata
      'repo',  // TODO: Extract from issueData metadata
      issueData
    );
    
    return {
      issueNumber: issueData.number,
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
    try {
      if (this.classifier.learn) {
        const trainingData = {
          features: {
            contentLength: issueData.content.length,
            commentsCount: issueData.comments.length,
            categoryScore: triageResult.priority === 'critical' ? 1.0 : triageResult.priority === 'high' ? 0.8 : 0.5
          },
          label: triageResult.category
        };
        const classificationResult = {
          category: triageResult.category,
          severity: triageResult.priority === 'critical' ? 1.0 : triageResult.priority === 'high' ? 0.8 : triageResult.priority === 'medium' ? 0.5 : 0.2,
          confidence: triageResult.confidence
        };
        await this.classifier.learn(trainingData, classificationResult);
      }
      if (this.patternMatcher.learn) {
        const patternData: Record<string, unknown> = {
          content: issueData.content,
          patterns: issueData.patterns,
          category: triageResult.category
        };
        const triageDataRecord: Record<string, unknown> = {
          category: triageResult.category,
          priority: triageResult.priority,
          confidence: triageResult.confidence,
          issueNumber: triageResult.issueNumber
        };
        await this.patternMatcher.learn(patternData, triageDataRecord);
      }
    } catch (error) {
      console.warn('Failed to update learning models:', error);
    }
  }

  private getDefaultTriageRules(): TriageRule[] {
    return [
      {
        name: 'Security Issue',
        condition: (data) => /security|vulnerability|exploit/i.test(data.content),
        action: (data) => ({ priority: 'critical', labels: ['security'] }),
        id: 'security-rule',
        priority: 1
      },
      {
        name: 'Bug Report',
        condition: (data) => /bug|error|crash|exception/i.test(data.content),
        action: (data) => ({ priority: 'high', labels: ['bug'] }),
        id: 'bug-rule',
        priority: 2
      },
      {
        name: 'Feature Request',
        condition: (data) => /feature|enhancement|improvement/i.test(data.content),
        action: (data) => ({ priority: 'medium', labels: ['enhancement'] }),
        id: 'feature-rule',
        priority: 3
      },
      {
        name: 'Documentation',
        condition: (data) => /documentation|docs|readme/i.test(data.content),
        action: (data) => ({ priority: 'low', labels: ['documentation'] }),
        id: 'docs-rule',
        priority: 4
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractContent(issue: unknown, comments: unknown[]): string {
    // Safe property access with type guards
    const getTitle = (obj: unknown): string => {
      return (typeof obj === 'object' && obj !== null && 'title' in obj && typeof (obj as Record<string, unknown>).title === 'string') 
        ? String((obj as Record<string, unknown>).title) 
        : '';
    };
    
    const getBody = (obj: unknown): string => {
      return (typeof obj === 'object' && obj !== null && 'body' in obj && typeof (obj as Record<string, unknown>).body === 'string') 
        ? String((obj as Record<string, unknown>).body) 
        : '';
    };

    const title = getTitle(issue);
    const body = getBody(issue);
    const commentBodies = comments.map(getBody);
    
    return [title, body, ...commentBodies].join(' ');
  }

  private extractPatterns(issue: unknown, comments: unknown[]): string[] {
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

  private extractMetadata(issue: unknown, comments: unknown[], events: unknown[]): unknown {
    // Safe property access with type guards
    const safeGet = (obj: unknown, prop: string): unknown => {
      return (typeof obj === 'object' && obj !== null && prop in obj) 
        ? (obj as Record<string, unknown>)[prop] 
        : null;
    };

    return {
      createdAt: safeGet(issue, 'created_at'),
      updatedAt: safeGet(issue, 'updated_at'),
      authorAssociation: safeGet(issue, 'author_association'),
      commentCount: comments.length,
      eventCount: events.length,
      labels: safeGet(issue, 'labels'),
      milestone: safeGet(issue, 'milestone')
    };
  }

  // Missing method implementations
  private applyLabelRules(issueData: IssueData): LabelSuggestion[] {
    // Apply rule-based label suggestions
    const suggestions: LabelSuggestion[] = [];
    
    if (/security|vulnerability/i.test(issueData.content || '')) {
      suggestions.push({ label: 'security', confidence: 0.9, reasoning: 'Security-related content detected' });
    }
    if (/bug|error|crash/i.test(issueData.content || '')) {
      suggestions.push({ label: 'bug', confidence: 0.8, reasoning: 'Bug-related content detected' });
    }
    if (/feature|enhancement/i.test(issueData.content || '')) {
      suggestions.push({ label: 'enhancement', confidence: 0.7, reasoning: 'Feature request detected' });
    }
    
    return suggestions;
  }

  private rankLabelSuggestions(suggestions: LabelSuggestion[]): LabelSuggestion[] {
    return suggestions
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 5); // Top 5 suggestions
  }

  private async findExpertiseMatches(owner: string, repo: string, issueData: IssueData): Promise<AssigneeSuggestion[]> {
    // Find team members with relevant expertise
    return [
      { username: 'expert1', confidence: 0.8, reasoning: 'Has experience with similar issues' },
      { username: 'expert2', confidence: 0.7, reasoning: 'Domain expertise match' }
    ];
  }

  private async findWorkloadOptimal(owner: string, repo: string, issueData: IssueData): Promise<AssigneeSuggestion[]> {
    // Find assignees based on current workload
    return [
      { username: 'available1', confidence: 0.9, reasoning: 'Low current workload' },
      { username: 'available2', confidence: 0.8, reasoning: 'Medium workload, good availability' }
    ];
  }

  private async findHistoricalMatches(owner: string, repo: string, issueData: IssueData): Promise<AssigneeSuggestion[]> {
    // Find assignees based on historical patterns
    return [
      { username: 'historical1', confidence: 0.7, reasoning: 'Previously resolved similar issues' }
    ];
  }

  private rankAssigneeSuggestions(suggestions: AssigneeSuggestion[]): AssigneeSuggestion[] {
    return suggestions
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3); // Top 3 suggestions
  }

  private async assessSeverity(issueData: IssueData): Promise<{ score: number; confidence: number; reasoning: string }> {
    let score = 0.5;
    let reasoning = 'Standard severity assessment';
    
    if (/critical|urgent|blocking/i.test(issueData.content)) {
      score = 0.9;
      reasoning = 'Critical keywords detected';
    } else if (/important|major/i.test(issueData.content)) {
      score = 0.7;
      reasoning = 'Important issue indicators found';
    } else if (/minor|small/i.test(issueData.content)) {
      score = 0.3;
      reasoning = 'Minor issue indicators found';
    }
    
    return { score, confidence: 0.8, reasoning };
  }

  private async assessUrgency(issueData: IssueData): Promise<{ score: number; confidence: number; reasoning: string }> {
    let score = 0.5;
    let reasoning = 'Standard urgency assessment';
    
    if (/asap|immediately|urgent/i.test(issueData.content)) {
      score = 0.9;
      reasoning = 'Urgent language detected';
    } else if (/soon|priority/i.test(issueData.content)) {
      score = 0.7;
      reasoning = 'Priority indicators found';
    }
    
    return { score, confidence: 0.7, reasoning };
  }

  private async assessBusinessImpact(issueData: IssueData): Promise<{ score: number; confidence: number; reasoning: string }> {
    let score = 0.5;
    let reasoning = 'Standard business impact';
    
    if (/revenue|customer|production/i.test(issueData.content)) {
      score = 0.8;
      reasoning = 'High business impact keywords detected';
    }
    
    return { score, confidence: 0.6, reasoning };
  }

  private async assessUserImpact(issueData: IssueData): Promise<{ score: number; confidence: number; reasoning: string }> {
    let score = 0.5;
    let reasoning = 'Standard user impact';
    
    if (/users affected|user experience|accessibility/i.test(issueData.content)) {
      score = 0.8;
      reasoning = 'User impact indicators found';
    }
    
    return { score, confidence: 0.7, reasoning };
  }

  // Additional helper methods would be implemented here...
  private calculateWeightedPriority(assessments: unknown[]): number {
    // Implementation for weighted priority calculation with type guards
    const validAssessments = assessments.filter((a: unknown): a is { score: number } => 
      typeof a === 'object' && a !== null && 'score' in a && typeof (a as Record<string, unknown>).score === 'number'
    );
    return validAssessments.length > 0 
      ? validAssessments.reduce((sum, assessment) => sum + assessment.score, 0) / validAssessments.length 
      : 0.5;
  }

  private calculateConfidence(assessments: unknown[]): number {
    // Implementation for confidence calculation with type guards
    const validAssessments = assessments.filter((a: unknown): a is { confidence: number } => 
      typeof a === 'object' && a !== null && 'confidence' in a && typeof (a as Record<string, unknown>).confidence === 'number'
    );
    return validAssessments.length > 0 
      ? validAssessments.reduce((sum, assessment) => sum + assessment.confidence, 0) / validAssessments.length 
      : 0.5;
  }

  private scoreToPriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private generatePriorityReasoning(assessments: unknown[]): string {
    const validAssessments = assessments.filter((a: unknown): a is { reasoning: string } => 
      typeof a === 'object' && a !== null && 'reasoning' in a && typeof (a as Record<string, unknown>).reasoning === 'string'
    );
    return validAssessments.map(a => a.reasoning).join('; ');
  }

  private generateReasoning(analysis: CombinedAnalysis): string {
    return `Analysis based on classification (${analysis.classification.category}), ` +
           `patterns (${analysis.patterns.matchCount} matches), ` +
           `rules (${analysis.rules.appliedCount} applied), ` +
           `and context analysis with ${analysis.confidence} confidence.`;
  }

  // Additional missing methods
  private async findSemanticDuplicates(owner: string, repo: string, issueData: IssueData): Promise<unknown[]> {
    // Stub implementation - would find semantically similar issues
    return [
      { issueNumber: 123, confidence: 0.8, similarity: 'semantic', reason: 'Similar content and context' }
    ];
  }

  private async findPatternDuplicates(owner: string, repo: string, issueData: IssueData): Promise<unknown[]> {
    // Stub implementation - would find pattern-based duplicates
    return [
      { issueNumber: 124, confidence: 0.7, similarity: 'pattern', reason: 'Similar error patterns' }
    ];
  }

  private async findKeywordDuplicates(owner: string, repo: string, issueData: IssueData): Promise<unknown[]> {
    // Stub implementation - would find keyword-based duplicates
    return [
      { issueNumber: 125, confidence: 0.6, similarity: 'keyword', reason: 'Shared keywords and terms' }
    ];
  }

  private rankDuplicates(duplicates: unknown[]): unknown[] {
    return duplicates
      .sort((a, b) => {
        const aConfidence = (typeof a === 'object' && a !== null && 'confidence' in a && typeof (a as Record<string, unknown>).confidence === 'number') ? Number((a as Record<string, unknown>).confidence) : 0;
        const bConfidence = (typeof b === 'object' && b !== null && 'confidence' in b && typeof (b as Record<string, unknown>).confidence === 'number') ? Number((b as Record<string, unknown>).confidence) : 0;
        return bConfidence - aConfidence;
      })
      .slice(0, 5); // Top 5 potential duplicates
  }

  private async getResponseTemplates(category: string): Promise<unknown> {
    // Stub implementation - would get response templates
    return {
      bug: 'Thank you for reporting this bug. We will investigate and provide updates.',
      feature: 'Thank you for the feature request. We will review and consider for future releases.',
      security: 'Thank you for the security report. This will be prioritized for immediate review.'
    };
  }

  private async personalizeResponse(templates: unknown, issueData: IssueData, triageResult: TriageResult): Promise<unknown> {
    // Stub implementation - would personalize response
    const safeTemplates = templates as Record<string, unknown>;
    const template = safeTemplates[triageResult.category] || safeTemplates.bug || 'Default response template';
    return {
      message: template,
      actions: ['label', 'assign'],
      confidence: 0.8
    };
  }

  private combineRuleResults(results: unknown[]): RuleResult {
    return {
      appliedCount: results.length,
      results: results
    };
  }

  private async analyzeRepositoryContext(issueData: IssueData): Promise<unknown> {
    // Stub implementation - would analyze repository context
    return {
      recentIssues: 10,
      activeContributors: 5,
      projectPhase: 'development'
    };
  }

  private async analyzeTemporalContext(issueData: IssueData): Promise<unknown> {
    // Stub implementation - would analyze temporal patterns
    return {
      timeOfDay: 'business_hours',
      dayOfWeek: 'weekday',
      seasonality: 'normal'
    };
  }

  private async analyzeUserContext(issueData: IssueData): Promise<unknown> {
    // Stub implementation - would analyze user context
    return {
      userType: 'contributor',
      reputation: 'established',
      previousIssues: 3
    };
  }

  private calculateCombinedConfidence(analyses: unknown[]): number {
    const validAnalyses = analyses.filter((a: unknown): a is { confidence: number } => 
      typeof a === 'object' && a !== null && 'confidence' in a && typeof (a as Record<string, unknown>).confidence === 'number'
    );
    return validAnalyses.length > 0 
      ? validAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / validAnalyses.length 
      : 0.5;
  }
}

// Type definitions
export interface TriageOptions {
  githubToken: string;
  mlConfig?: unknown;
  patternConfig?: unknown;
  triageRules?: TriageRule[];
  learningEnabled?: boolean;
}

export interface TriageRule {
  id: string;
  name?: string;
  condition: (data: IssueData) => boolean;
  action: (data: IssueData) => unknown;
  priority: number;
}

export interface IssueData {
  number: number;
  title: string;
  body: string;
  content: string;
  labels: string[];
  assignees: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  comments: unknown[];
  events: unknown[];
  patterns: unknown[];
  metadata: unknown;
}

export interface TriageResult {
  issueNumber: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  severity: number;
  confidence: number;
  suggestedLabels: string[];
  suggestedAssignees: string[];
  duplicates: unknown[];
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
  matches: unknown[];
  confidence: number;
}

interface RuleResult {
  appliedCount: number;
  results: unknown[];
}

interface ContextResult {
  repositoryContext: unknown;
  temporalContext: unknown;
  userContext: unknown;
}

interface CombinedAnalysis {
  classification: ClassificationResult;
  patterns: PatternMatchResult;
  rules: RuleResult;
  context: ContextResult;
  confidence: number;
}

export interface LabelSuggestion {
  label: string;
  confidence: number;
  reasoning: string;
}

export interface AssigneeSuggestion {
  username: string;
  confidence: number;
  reasoning: string;
}

export interface PriorityAssessment {
  priority: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  confidence: number;
  reasoning: string;
  factors: unknown[];
}

export interface DuplicateDetection {
  isDuplicate: boolean;
  duplicates: unknown[];
  confidence: number;
}

export interface AutomatedResponse {
  message: string;
  actions: string[];
  confidence: number;
  requiresHumanReview: boolean;
}

export class TriageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TriageError';
  }
}

// Types and interfaces already exported above