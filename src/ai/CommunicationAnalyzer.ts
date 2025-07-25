/**
 * Communication Analyzer
 * AI module for analyzing team communication patterns and effectiveness
 */

import { SentimentAnalysis } from '../types/analysis';

export interface CommunicationMessage {
  id: string;
  sender: string;
  recipients: string[];
  content: string;
  timestamp: Date;
  channel: string;
  type: 'text' | 'code' | 'document' | 'meeting' | 'email';
  metadata?: Record<string, string | number | boolean>;
}

export interface CommunicationConfig {
  enableSentimentAnalysis?: boolean;
  enablePatternDetection?: boolean;
  cacheTimeout?: number;
  maxMessageHistory?: number;
}

export interface CommunicationMetrics {
  totalMessages: number;
  averageResponseTime: number;
  participationRate: number;
  sentimentScore: number;
  clarityScore: number;
  collaborationIndex: number;
  networkDensity: number;
  informationFlow: number;
}

export interface CommunicationPattern {
  type: 'broadcast' | 'direct' | 'group' | 'meeting' | 'async';
  frequency: number;
  effectiveness: number;
  participants: string[];
  averageLength: number;
  sentimentTrend: 'positive' | 'negative' | 'neutral' | 'declining' | 'improving';
}

export interface CommunicationInsight {
  category: 'efficiency' | 'clarity' | 'sentiment' | 'participation' | 'network';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  metrics: Record<string, number>;
}

export class CommunicationAnalyzer {
  private messages: CommunicationMessage[] = [];
  private analysisCache: Map<string, CommunicationMetrics | CommunicationPattern[] | CommunicationInsight[]> = new Map();
  private cacheExpiries: Map<string, number> = new Map();
  private cacheExpiry: number = 300000; // 5 minutes
  private config: CommunicationConfig;

  constructor(config?: CommunicationConfig) {
    this.config = config || {};
  }

  async addMessage(message: CommunicationMessage): Promise<void> {
    this.messages.push(message);
    this.invalidateCache();
  }

  async addMessages(messages: CommunicationMessage[]): Promise<void> {
    this.messages.push(...messages);
    this.invalidateCache();
  }

  async analyzeCommunication(timeframe?: { start: Date; end: Date }): Promise<CommunicationMetrics> {
    const cacheKey = `metrics_${timeframe?.start.getTime() || 0}_${timeframe?.end.getTime() || Date.now()}`;
    
    if (this.hasValidCache(cacheKey)) {
      return this.analysisCache.get(cacheKey) as CommunicationMetrics;
    }

    const filteredMessages = this.filterMessagesByTimeframe(this.messages, timeframe);
    
    // Stub implementation - would perform actual communication analysis
    const metrics: CommunicationMetrics = {
      totalMessages: filteredMessages.length,
      averageResponseTime: this.calculateAverageResponseTime(filteredMessages),
      participationRate: this.calculateParticipationRate(filteredMessages),
      sentimentScore: this.calculateSentimentScore(filteredMessages),
      clarityScore: this.calculateClarityScore(filteredMessages),
      collaborationIndex: this.calculateCollaborationIndex(filteredMessages),
      networkDensity: this.calculateNetworkDensity(filteredMessages),
      informationFlow: this.calculateInformationFlow(filteredMessages)
    };

    this.setCacheWithExpiry(cacheKey, metrics);
    return metrics;
  }

  async identifyPatterns(timeframe?: { start: Date; end: Date }): Promise<CommunicationPattern[]> {
    const filteredMessages = this.filterMessagesByTimeframe(this.messages, timeframe);
    
    // Stub implementation - would identify actual communication patterns
    const patterns: CommunicationPattern[] = [
      {
        type: 'direct',
        frequency: this.countDirectMessages(filteredMessages),
        effectiveness: 0.85,
        participants: this.getUniqueParticipants(filteredMessages),
        averageLength: this.calculateAverageMessageLength(filteredMessages),
        sentimentTrend: 'positive'
      },
      {
        type: 'group',
        frequency: this.countGroupMessages(filteredMessages),
        effectiveness: 0.75,
        participants: this.getUniqueParticipants(filteredMessages),
        averageLength: this.calculateAverageMessageLength(filteredMessages),
        sentimentTrend: 'neutral'
      }
    ];

    return patterns;
  }

  async generateInsights(timeframe?: { start: Date; end: Date }): Promise<CommunicationInsight[]> {
    const metrics = await this.analyzeCommunication(timeframe);
    await this.identifyPatterns(timeframe);

    // Stub implementation - would generate actual insights
    const insights: CommunicationInsight[] = [];

    if (metrics.participationRate < 0.6) {
      insights.push({
        category: 'participation',
        title: 'Low Participation Rate',
        description: 'Several team members are not actively participating in communications',
        impact: 'high',
        recommendation: 'Encourage more inclusive communication practices and check in with quiet team members',
        metrics: { participationRate: metrics.participationRate }
      });
    }

    if (metrics.sentimentScore < 0.5) {
      insights.push({
        category: 'sentiment',
        title: 'Negative Communication Sentiment',
        description: 'Overall sentiment in team communications is trending negative',
        impact: 'medium',
        recommendation: 'Address team concerns and focus on positive reinforcement',
        metrics: { sentimentScore: metrics.sentimentScore }
      });
    }

    if (metrics.averageResponseTime > 3600000) { // 1 hour
      insights.push({
        category: 'efficiency',
        title: 'Slow Response Times',
        description: 'Team members are taking too long to respond to messages',
        impact: 'medium',
        recommendation: 'Establish communication expectations and response time guidelines',
        metrics: { averageResponseTime: metrics.averageResponseTime }
      });
    }

    return insights;
  }

  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // Stub implementation - would perform actual sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'problem'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    const positiveScore = total > 0 ? positiveCount / total : 0.5;
    const negativeScore = total > 0 ? negativeCount / total : 0.5;
    const neutralScore = 1 - positiveScore - negativeScore;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveScore > negativeScore && positiveScore > 0.3) sentiment = 'positive';
    else if (negativeScore > positiveScore && negativeScore > 0.3) sentiment = 'negative';
    
    return {
      sentiment,
      confidence: Math.max(positiveScore, negativeScore, neutralScore),
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore
      },
      keywords: words.filter(word => 
        positiveWords.includes(word) || negativeWords.includes(word)
      ).map(word => ({
        word,
        sentiment: positiveWords.includes(word) ? 'positive' : 'negative',
        weight: 1.0
      }))
    };
  }

  private filterMessagesByTimeframe(messages: CommunicationMessage[], timeframe?: { start: Date; end: Date }): CommunicationMessage[] {
    if (!timeframe) return messages;
    
    return messages.filter(msg => 
      msg.timestamp >= timeframe.start && msg.timestamp <= timeframe.end
    );
  }

  private calculateAverageResponseTime(messages: CommunicationMessage[]): number {
    // Stub implementation - would calculate actual response times
    const baseTime = messages.length > 0 ? messages.length * 100 : 1000;
    return Math.min(3600000, baseTime + Math.random() * 1800000); // Base time + random up to 30 min
  }

  private calculateParticipationRate(messages: CommunicationMessage[]): number {
    const uniqueSenders = new Set(messages.map(m => m.sender));
    const allParticipants = new Set([
      ...messages.map(m => m.sender),
      ...messages.flatMap(m => m.recipients)
    ]);
    
    return allParticipants.size > 0 ? uniqueSenders.size / allParticipants.size : 0;
  }

  private calculateSentimentScore(messages: CommunicationMessage[]): number {
    // Stub implementation - would analyze sentiment of all messages
    if (messages.length === 0) return 0.5;
    
    // Simple sentiment analysis based on message content
    const positiveWords = ['good', 'great', 'excellent', 'success', 'thanks'];
    const negativeWords = ['bad', 'error', 'problem', 'issue', 'fail'];
    
    let totalSentiment = 0;
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      const positive = positiveWords.some(word => content.includes(word));
      const negative = negativeWords.some(word => content.includes(word));
      
      if (positive && !negative) totalSentiment += 0.8;
      else if (negative && !positive) totalSentiment += 0.3;
      else totalSentiment += 0.6;
    });
    
    return totalSentiment / messages.length;
  }

  private calculateClarityScore(messages: CommunicationMessage[]): number {
    // Stub implementation - would analyze message clarity
    if (messages.length === 0) return 0.5;
    
    // Simple clarity metric based on message length and question words
    const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    
    const clarityQuestions = messages.filter(msg => 
      questionWords.some(word => msg.content.toLowerCase().includes(word + ' '))
    ).length;
    
    const clarityRatio = 1 - (clarityQuestions / messages.length);
    const lengthScore = Math.min(1, avgLength / 100); // Reasonable length gets higher score
    
    return (clarityRatio + lengthScore) / 2;
  }

  private calculateCollaborationIndex(messages: CommunicationMessage[]): number {
    // Stub implementation - would measure collaboration indicators
    if (messages.length === 0) return 0;
    
    const collaborationWords = ['let\'s', 'we should', 'together', 'collaborate', 'help', 'support'];
    const collaborativeMessages = messages.filter(msg => 
      collaborationWords.some(word => msg.content.toLowerCase().includes(word))
    ).length;
    
    return Math.min(1, collaborativeMessages / messages.length + 0.5);
  }

  private calculateNetworkDensity(messages: CommunicationMessage[]): number {
    // Stub implementation - would calculate communication network density
    const participants = this.getUniqueParticipants(messages);
    if (participants.length < 2) return 0;
    
    const maxConnections = participants.length * (participants.length - 1);
    const actualConnections = messages.length;
    
    return Math.min(1, actualConnections / maxConnections);
  }

  private calculateInformationFlow(messages: CommunicationMessage[]): number {
    // Stub implementation - would measure information flow efficiency
    if (messages.length === 0) return 0;
    
    // Simple metric based on message distribution over time
    const timeSpread = messages.length > 1 ? 
      messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime() : 1;
    const messageRate = messages.length / (timeSpread / 3600000); // messages per hour
    
    return Math.min(1, messageRate / 10); // Normalize to 10 messages per hour = 1.0
  }

  private countDirectMessages(messages: CommunicationMessage[]): number {
    return messages.filter(m => m.recipients.length === 1).length;
  }

  private countGroupMessages(messages: CommunicationMessage[]): number {
    return messages.filter(m => m.recipients.length > 1).length;
  }

  private getUniqueParticipants(messages: CommunicationMessage[]): string[] {
    const participants = new Set([
      ...messages.map(m => m.sender),
      ...messages.flatMap(m => m.recipients)
    ]);
    return Array.from(participants);
  }

  private calculateAverageMessageLength(messages: CommunicationMessage[]): number {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    return totalLength / messages.length;
  }

  private hasValidCache(key: string): boolean {
    return this.analysisCache.has(key) && 
           this.cacheExpiries.has(key) && 
           Date.now() < this.cacheExpiries.get(key)!;
  }

  private setCacheWithExpiry(key: string, value: CommunicationMetrics | CommunicationPattern[] | CommunicationInsight[]): void {
    this.analysisCache.set(key, value);
    this.cacheExpiries.set(key, Date.now() + this.cacheExpiry);
  }

  private invalidateCache(): void {
    this.analysisCache.clear();
    this.cacheExpiries.clear();
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  clearMessages(): void {
    this.messages = [];
    this.invalidateCache();
  }
}