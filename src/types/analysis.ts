/**
 * Analysis Type Definitions
 * TypeScript interfaces for data analysis and machine learning
 */

export interface AnalysisResult {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  results: any;
  metadata: {
    version: string;
    algorithm: string;
    parameters: Record<string, any>;
  };
}

export interface DataPoint {
  id: string;
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  name: string;
  data: DataPoint[];
  aggregation?: 'sum' | 'average' | 'min' | 'max' | 'count';
  interval?: number;
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface CorrelationMatrix {
  variables: string[];
  correlations: number[][];
  significanceLevel: number;
}

export interface RegressionAnalysis {
  type: 'linear' | 'polynomial' | 'logistic' | 'ridge' | 'lasso';
  coefficients: number[];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  pValues: number[];
  standardErrors: number[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
}

export interface ClassificationResult {
  category: string;
  severity: number;
  confidence: number;
  predictedClass?: string;
  probabilities?: Record<string, number>;
  features?: Record<string, number>;
}

export interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
  classNames: string[];
}

export interface ClusteringResult {
  clusterId: number;
  centroid: number[];
  members: string[];
  intraClusterDistance: number;
  silhouetteScore: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  threshold: number;
  explanation: string;
  features: Record<string, number>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  rank: number;
  type: 'permutation' | 'gain' | 'split' | 'shap';
}

export interface ModelEvaluation {
  modelName: string;
  version: string;
  metrics: PerformanceMetrics;
  featureImportance: FeatureImportance[];
  crossValidationScores: number[];
  trainingTime: number;
  predictionTime: number;
}

export interface DataQualityReport {
  totalRecords: number;
  missingValues: Record<string, number>;
  duplicateRecords: number;
  outliers: Record<string, number>;
  dataTypes: Record<string, string>;
  uniqueValues: Record<string, number>;
  recommendations: string[];
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'seasonal';
  slope: number;
  seasonality: {
    detected: boolean;
    period?: number;
    strength?: number;
  };
  changePoints: {
    timestamp: Date;
    significance: number;
  }[];
  forecast: {
    values: number[];
    timestamps: Date[];
    confidenceInterval: {
      lower: number[];
      upper: number[];
    };
  };
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: {
    word: string;
    sentiment: string;
    weight: number;
  }[];
}

export interface NetworkAnalysis {
  nodes: {
    id: string;
    centrality: {
      degree: number;
      betweenness: number;
      closeness: number;
      eigenvector: number;
    };
    clustering: number;
  }[];
  edges: {
    source: string;
    target: string;
    weight: number;
  }[];
  globalMetrics: {
    density: number;
    transitivity: number;
    averagePathLength: number;
    diameter: number;
    communities: number;
  };
}

export interface OptimizationResult {
  objective: number;
  variables: Record<string, number>;
  constraints: {
    active: string[];
    violated: string[];
  };
  iterations: number;
  convergence: boolean;
  optimality: 'global' | 'local' | 'unknown';
}

export interface BayesianAnalysis {
  prior: {
    distribution: string;
    parameters: Record<string, number>;
  };
  posterior: {
    distribution: string;
    parameters: Record<string, number>;
  };
  credibleInterval: {
    lower: number;
    upper: number;
    probability: number;
  };
  bayesFactor: number;
}

export interface ExperimentResult {
  experimentId: string;
  treatment: string;
  control: string;
  sampleSize: {
    treatment: number;
    control: number;
  };
  effect: {
    estimate: number;
    standardError: number;
    pValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
  power: number;
  significance: boolean;
}