/**
 * TDD Test Suite for PerformanceAnalyzer
 * Comprehensive tests for AI-powered performance impact assessment
 */

import { PerformanceAnalyzer, type PerformanceConfig } from '../../../src/ai/PerformanceAnalyzer';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;
  let mockConfig: PerformanceConfig;

  beforeEach(() => {
    mockConfig = {
      enableComplexityAnalysis: true,
      enableMemoryAnalysis: true,
      enableNetworkAnalysis: true,
      complexityThreshold: 10,
      memoryThreshold: 1024,
      networkThreshold: 100,
      targetPlatforms: ['web', 'mobile']
    };
    analyzer = new PerformanceAnalyzer(mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with default config when no config provided', () => {
      const defaultAnalyzer = new PerformanceAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(PerformanceAnalyzer);
    });

    it('should initialize with provided config', () => {
      expect(analyzer).toBeInstanceOf(PerformanceAnalyzer);
    });
  });

  describe('analyze', () => {
    const mockPRData = {
      files: [
        {
          filename: 'test.js',
          patch: `+for (let i = 0; i < array.length; i++) {
+  for (let j = 0; j < items.length; j++) {
+    processItem(array[i], items[j]);
+  }
+}`,
          sha: 'perf123'
        }
      ]
    };

    it('should return analysis with overall performance score', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('overall');
      expect(typeof result.overall).toBe('number');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(1);
    });

    it('should return performance issues array', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return performance metrics', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result.metrics).toHaveProperty('complexity');
      expect(result.metrics).toHaveProperty('memory');
      expect(result.metrics).toHaveProperty('network');
      expect(result.metrics).toHaveProperty('rendering');
      expect(result.metrics).toHaveProperty('bundle');
    });

    it('should include confidence score', async () => {
      const result = await analyzer.analyze(mockPRData);
      
      expect(result).toHaveProperty('confidence');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Complexity Analysis', () => {
    it('should detect inefficient loops with array.length in condition', async () => {
      const inefficientLoop = {
        files: [
          {
            filename: 'loop.js',
            patch: '+for (let i = 0; i < items.length; i++) { processItem(items[i]); }',
            sha: 'loop123'
          }
        ]
      };

      const result = await analyzer.analyze(inefficientLoop);
      const complexityIssues = result.issues.filter(i => i.type === 'cpu');
      
      expect(complexityIssues.length).toBeGreaterThan(0);
      expect(complexityIssues[0].title).toContain('Inefficient Loop');
      expect(complexityIssues[0].suggestion).toContain('Cache array length');
    });

    it('should detect nested forEach operations', async () => {
      const nestedForEach = {
        files: [
          {
            filename: 'nested.js',
            patch: `+items.forEach(item => {
+  item.subitems.forEach(subitem => {
+    process(subitem);
+  });
+});`,
            sha: 'nested123'
          }
        ]
      };

      const result = await analyzer.analyze(nestedForEach);
      const complexityIssues = result.issues.filter(i => i.type === 'cpu');
      
      expect(complexityIssues.length).toBeGreaterThan(0);
    });

    it('should detect chained inefficient operations', async () => {
      const chainedOps = {
        files: [
          {
            filename: 'chained.js',
            patch: `+const result = items.filter(item => item.active).map(item => item.name);
+const user = users.find(u => u.id === id).find(u => u.active);`,
            sha: 'chained123'
          }
        ]
      };

      const result = await analyzer.analyze(chainedOps);
      const complexityIssues = result.issues.filter(i => i.type === 'cpu');
      
      expect(complexityIssues.length).toBeGreaterThan(0);
      expect(complexityIssues.some(issue => 
        issue.title.includes('Inefficient Operation')
      )).toBe(true);
    });

    it('should analyze nested loop complexity', async () => {
      const complexNestedLoops = {
        files: [
          {
            filename: 'complex.js',
            patch: `+for (let i = 0; i < n; i++) {
+  for (let j = 0; j < m; j++) {
+    for (let k = 0; k < p; k++) {
+      matrix[i][j][k] = compute(i, j, k);
+    }
+  }
+}`,
            sha: 'complex123'
          }
        ]
      };

      const result = await analyzer.analyze(complexNestedLoops);
      const complexityIssues = result.issues.filter(i => 
        i.type === 'cpu' && i.title.includes('Complexity')
      );
      
      expect(complexityIssues.length).toBeGreaterThan(0);
      expect(complexityIssues[0].severity).toBe('medium');
    });
  });

  describe('Memory Analysis', () => {
    it('should detect potential memory leaks from setInterval', async () => {
      const memoryLeak = {
        files: [
          {
            filename: 'timer.js',
            patch: '+setInterval(() => { doSomething(); }, 1000);',
            sha: 'timer123'
          }
        ]
      };

      const result = await analyzer.analyze(memoryLeak);
      const memoryIssues = result.issues.filter(i => i.type === 'memory');
      
      expect(memoryIssues.length).toBeGreaterThan(0);
      expect(memoryIssues[0].severity).toBe('high');
      expect(memoryIssues[0].title).toContain('Memory Leak');
    });

    it('should detect large array allocations', async () => {
      const largeAllocation = {
        files: [
          {
            filename: 'array.js',
            patch: '+const bigArray = new Array(100000);',
            sha: 'array123'
          }
        ]
      };

      const result = await analyzer.analyze(largeAllocation);
      const memoryIssues = result.issues.filter(i => 
        i.type === 'memory' && i.title.includes('Large Memory Allocation')
      );
      
      expect(memoryIssues.length).toBeGreaterThan(0);
      expect(memoryIssues[0].suggestion).toContain('lazy loading');
    });

    it('should detect addEventListener without cleanup', async () => {
      const eventListener = {
        files: [
          {
            filename: 'events.js',
            patch: '+element.addEventListener("click", handler);',
            sha: 'events123'
          }
        ]
      };

      const result = await analyzer.analyze(eventListener);
      const memoryIssues = result.issues.filter(i => i.type === 'memory');
      
      expect(memoryIssues.length).toBeGreaterThan(0);
      expect(memoryIssues[0].suggestion).toContain('cleanup');
    });
  });

  describe('Network Performance Analysis', () => {
    it('should detect multiple fetch calls', async () => {
      const multipleFetch = {
        files: [
          {
            filename: 'api.js',
            patch: `+fetch('/api/users');
+fetch('/api/posts');
+fetch('/api/comments');`,
            sha: 'fetch123'
          }
        ]
      };

      const result = await analyzer.analyze(multipleFetch);
      const networkIssues = result.issues.filter(i => i.type === 'network');
      
      expect(networkIssues.length).toBeGreaterThan(0);
      expect(networkIssues[0].title).toContain('Multiple Network Requests');
      expect(networkIssues[0].suggestion).toContain('batching');
    });

    it('should detect missing request optimizations', async () => {
      const unoptimizedRequest = {
        files: [
          {
            filename: 'request.js',
            patch: '+fetch("/api/data").then(res => res.json());',
            sha: 'unopt123'
          }
        ]
      };

      const result = await analyzer.analyze(unoptimizedRequest);
      const networkIssues = result.issues.filter(i => 
        i.type === 'network' && i.title.includes('Missing Network Optimizations')
      );
      
      expect(networkIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering Performance Analysis', () => {
    it('should detect DOM thrashing patterns', async () => {
      const domThrashing = {
        files: [
          {
            filename: 'dom.js',
            patch: `+element.style.width = "100px";
+element.style.height = "200px";
+element.style.backgroundColor = "red";`,
            sha: 'dom123'
          }
        ]
      };

      const result = await analyzer.analyze(domThrashing);
      const renderingIssues = result.issues.filter(i => i.type === 'rendering');
      
      expect(renderingIssues.length).toBeGreaterThan(0);
      expect(renderingIssues[0].title).toContain('DOM Thrashing');
    });

    it('should detect innerHTML concatenation', async () => {
      const innerHTMLConcat = {
        files: [
          {
            filename: 'render.js',
            patch: '+element.innerHTML += "<div>content</div>";',
            sha: 'html123'
          }
        ]
      };

      const result = await analyzer.analyze(innerHTMLConcat);
      const renderingIssues = result.issues.filter(i => i.type === 'rendering');
      
      expect(renderingIssues.length).toBeGreaterThan(0);
    });

    it('should analyze React-specific performance issues', async () => {
      const reactComponent = {
        files: [
          {
            filename: 'Component.jsx',
            patch: `+export default function Component({ items }) {
+  return (
+    <div style={{padding: 10}} onClick={() => doSomething()}>
+      {items.map(item => <Item key={item.id} item={item} />)}
+    </div>
+  );
+}`,
            sha: 'react123'
          }
        ]
      };

      const result = await analyzer.analyze(reactComponent);
      const reactIssues = result.issues.filter(i => 
        i.type === 'rendering' && i.description.includes('inline')
      );
      
      expect(reactIssues.length).toBeGreaterThan(0);
    });

    it('should suggest React.memo for missing optimization', async () => {
      const unmemoizedComponent = {
        files: [
          {
            filename: 'Unmemoized.jsx',
            patch: `+export default function UnmemoizedComponent({ data }) {
+  return <div>{data.title}</div>;
+}`,
            sha: 'unmemo123'
          }
        ]
      };

      const result = await analyzer.analyze(unmemoizedComponent);
      const memoIssues = result.issues.filter(i => 
        i.title.includes('React.memo')
      );
      
      expect(memoIssues.length).toBeGreaterThan(0);
      expect(memoIssues[0].severity).toBe('low');
    });
  });

  describe('Bundle Impact Analysis', () => {
    it('should estimate bundle size impact', async () => {
      const largeFile = {
        files: [
          {
            filename: 'large-component.js',
            patch: '+'.repeat(2000) + 'export function largeFunction() { return "large"; }',
            sha: 'large123'
          }
        ]
      };

      const result = await analyzer.analyze(largeFile);
      const bundleIssues = result.issues.filter(i => i.type === 'bundle');
      
      expect(bundleIssues.length).toBeGreaterThan(0);
      expect(bundleIssues[0].title).toContain('Large Bundle Impact');
    });

    it('should detect tree-shaking opportunities', async () => {
      const nonTreeShakeable = {
        files: [
          {
            filename: 'lib.js',
            patch: `+window.globalLib = {
+  utils: require('./utils')
+};`,
            sha: 'tree123'
          }
        ]
      };

      const result = await analyzer.analyze(nonTreeShakeable);
      const treeShakeIssues = result.issues.filter(i => 
        i.title.includes('Tree-shaking')
      );
      
      expect(treeShakeIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate complexity metrics', async () => {
      const complexCode = {
        files: [
          {
            filename: 'metrics.js',
            patch: `+for (let i = 0; i < n; i++) {
+  for (let j = 0; j < m; j++) {
+    process(i, j);
+  }
+}`,
            sha: 'metrics123'
          }
        ]
      };

      const result = await analyzer.analyze(complexCode);
      
      expect(result.metrics.complexity).toHaveProperty('timeComplexity');
      expect(result.metrics.complexity).toHaveProperty('spaceComplexity');
      expect(result.metrics.complexity).toHaveProperty('cyclomaticComplexity');
      
      expect(typeof result.metrics.complexity.timeComplexity).toBe('string');
      expect(result.metrics.complexity.timeComplexity).toMatch(/O\(.+\)/);
    });

    it('should calculate memory metrics', async () => {
      const memoryCode = {
        files: [
          {
            filename: 'memory.js',
            patch: '+setInterval(() => {}, 1000);',
            sha: 'memory123'
          }
        ]
      };

      const result = await analyzer.analyze(memoryCode);
      
      expect(result.metrics.memory).toHaveProperty('estimatedUsage');
      expect(result.metrics.memory).toHaveProperty('leakRisk');
      expect(result.metrics.memory).toHaveProperty('optimizationOpportunities');
      
      expect(result.metrics.memory.leakRisk).toBeGreaterThan(0);
    });

    it('should calculate rendering metrics', async () => {
      const renderingCode = {
        files: [
          {
            filename: 'Component.jsx',
            patch: '+<div style={{color: "red"}} onClick={() => click()} />',
            sha: 'render123'
          }
        ]
      };

      const result = await analyzer.analyze(renderingCode);
      
      expect(result.metrics.rendering).toHaveProperty('rerenderRisk');
      expect(result.metrics.rendering).toHaveProperty('domManipulation');
      expect(result.metrics.rendering).toHaveProperty('layoutThrashing');
    });
  });

  describe('File Type Filtering', () => {
    it('should only analyze relevant code files', async () => {
      const mixedFiles = {
        files: [
          {
            filename: 'README.md',
            patch: '+# Documentation',
            sha: 'doc123'
          },
          {
            filename: 'code.js',
            patch: '+for (let i = 0; i < array.length; i++) {}',
            sha: 'code123'
          },
          {
            filename: 'image.png',
            patch: 'Binary file',
            sha: 'img123'
          }
        ]
      };

      const result = await analyzer.analyze(mixedFiles);
      
      // Should only analyze the .js file
      result.issues.forEach(issue => {
        expect(['.js', '.ts', '.jsx', '.tsx'].some(ext => 
          issue.file.endsWith(ext)
        )).toBe(true);
      });
    });

    it('should analyze web-specific files for rendering issues', async () => {
      const webFile = {
        files: [
          {
            filename: 'Component.tsx',
            patch: '+element.style.color = "red";',
            sha: 'web123'
          }
        ]
      };

      const result = await analyzer.analyze(webFile);
      const renderingIssues = result.issues.filter(i => i.type === 'rendering');
      
      expect(renderingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Issue Properties', () => {
    it('should ensure all issues have required properties', async () => {
      const performanceCode = {
        files: [
          {
            filename: 'perf.js',
            patch: '+for (let i = 0; i < items.length; i++) { process(items[i]); }',
            sha: 'props123'
          }
        ]
      };

      const result = await analyzer.analyze(performanceCode);
      
      result.issues.forEach(issue => {
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('title');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('file');
        expect(issue).toHaveProperty('line');
        expect(issue).toHaveProperty('impact');
        expect(issue).toHaveProperty('suggestion');
        expect(issue).toHaveProperty('confidence');
        
        expect(['cpu', 'memory', 'network', 'io', 'rendering', 'bundle'].includes(issue.type)).toBe(true);
        expect(['low', 'medium', 'high', 'critical'].includes(issue.severity)).toBe(true);
        expect(['minor', 'moderate', 'major', 'severe'].includes(issue.impact)).toBe(true);
        expect(typeof issue.confidence).toBe('number');
        expect(issue.confidence).toBeGreaterThan(0);
        expect(issue.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Score Calculation', () => {
    it('should penalize critical performance issues heavily', async () => {
      const criticalIssueCode = {
        files: [
          {
            filename: 'critical.js',
            patch: '+eval(userCode); // Critical performance issue',
            sha: 'critical123'
          }
        ]
      };

      const result = await analyzer.analyze(criticalIssueCode);
      
      expect(result.overall).toBeLessThan(0.8);
    });

    it('should give high scores to optimized code', async () => {
      const optimizedCode = {
        files: [
          {
            filename: 'optimized.js',
            patch: '+const cached = useMemo(() => expensiveCalculation(), [dep]);',
            sha: 'opt123'
          }
        ]
      };

      const result = await analyzer.analyze(optimizedCode);
      
      expect(result.overall).toBeGreaterThan(0.7);
    });
  });

  describe('Recommendations', () => {
    it('should provide specific performance recommendations', async () => {
      const inefficientCode = {
        files: [
          {
            filename: 'inefficient.js',
            patch: `+for (let i = 0; i < items.length; i++) {
+  for (let j = 0; j < data.length; j++) {
+    process(items[i], data[j]);
+  }
+}`,
            sha: 'inefficient123'
          }
        ]
      };

      const result = await analyzer.analyze(inefficientCode);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.includes('performance') || rec.includes('optimization')
      )).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache analysis results for identical inputs', async () => {
      const prData = {
        files: [
          {
            filename: 'cache.js',
            patch: '+function simple() { return 1; }',
            sha: 'cache123'
          }
        ]
      };

      const result1 = await analyzer.analyze(prData);
      const result2 = await analyzer.analyze(prData);
      
      expect(result1.timestamp).toBe(result2.timestamp);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty PR gracefully', async () => {
      const result = await analyzer.analyze({ files: [] });
      
      expect(result).toHaveProperty('overall');
      expect(result.issues).toEqual([]);
      expect(result.recommendations.some(rec => rec.includes('Performance impact looks minimal'))).toBe(true);
    });

    it('should return fallback analysis on error', async () => {
      const invalidPR = null as any;
      
      const result = await analyzer.analyze(invalidPR);
      
      expect(result.overall).toBe(0.5);
      expect(result.confidence).toBe(0.1);
      expect(result.recommendations.some(rec => rec.includes('Unable to analyze performance due to errors'))).toBe(true);
    });
  });
});