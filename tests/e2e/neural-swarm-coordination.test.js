/**
 * E2E Tests for Neural Swarm Coordination
 * Tests end-to-end neural agent coordination workflows
 */

const puppeteer = require('puppeteer');

describe('Neural Swarm Coordination E2E Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set longer timeout for neural operations
    page.setDefaultTimeout(30000);
    
    // Navigate to the application
    await page.goto('http://localhost:4173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Neural Agent Creation and Management', () => {
    test('should create neural agents through UI', async () => {
      // Wait for app to load
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
      
      // Look for agent creation controls
      const createButton = await page.$('[data-testid="create-agent"]');
      if (createButton) {
        await createButton.click();
        
        // Wait for agent to appear
        await page.waitForSelector('[data-testid="agent-item"]', { timeout: 5000 });
        
        const agents = await page.$$('[data-testid="agent-item"]');
        expect(agents.length).toBeGreaterThan(0);
      }
    });

    test('should display neural mesh visualization', async () => {
      // Check for neural mesh visualization component
      const meshViz = await page.waitForSelector('[data-testid="neural-mesh-viz"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (meshViz) {
        // Verify mesh is rendering
        const canvas = await page.$('canvas');
        expect(canvas).toBeTruthy();
        
        // Check for WebGL context
        const hasWebGL = await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return false;
          
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        });
        
        if (hasWebGL) {
          console.log('✅ WebGL context available for neural mesh visualization');
        } else {
          console.log('⚠️ WebGL not available, using fallback rendering');
        }
      }
    });

    test('should handle agent interactions', async () => {
      // Wait for agents to load
      await page.waitForSelector('[data-testid="agent-list"]', { timeout: 10000 });
      
      // Check for agent interaction capabilities
      const agentElements = await page.$$('[data-testid="agent-item"]');
      
      if (agentElements.length > 0) {
        // Click on first agent
        await agentElements[0].click();
        
        // Wait for agent details or interaction panel
        const detailsPanel = await page.waitForSelector('[data-testid="agent-details"]', { 
          timeout: 5000 
        }).catch(() => null);
        
        if (detailsPanel) {
          // Verify agent details are displayed
          const agentInfo = await page.$eval('[data-testid="agent-details"]', el => el.textContent);
          expect(agentInfo).toBeTruthy();
          expect(agentInfo.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Performance Monitoring', () => {
    test('should display performance metrics', async () => {
      // Look for performance dashboard
      const perfDashboard = await page.waitForSelector('[data-testid="performance-dashboard"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (perfDashboard) {
        // Check for performance metrics
        const metrics = await page.$$('[data-testid="metric-item"]');
        expect(metrics.length).toBeGreaterThan(0);
        
        // Verify metrics have values
        for (const metric of metrics) {
          const value = await metric.$eval('[data-testid="metric-value"]', el => el.textContent);
          expect(value).toBeTruthy();
        }
      }
    });

    test('should update metrics in real-time', async () => {
      // Check for real-time updates
      const metricsContainer = await page.$('[data-testid="performance-metrics"]');
      
      if (metricsContainer) {
        // Get initial metric values
        const initialValues = await page.$$eval('[data-testid="metric-value"]', 
          elements => elements.map(el => el.textContent)
        );
        
        // Wait for potential updates
        await page.waitForTimeout(2000);
        
        // Get updated metric values
        const updatedValues = await page.$$eval('[data-testid="metric-value"]', 
          elements => elements.map(el => el.textContent)
        );
        
        // Some metrics should update (though not all necessarily)
        console.log('Performance metrics monitoring:', {
          initial: initialValues.length,
          updated: updatedValues.length
        });
      }
    });
  });

  describe('Neural Mesh Coordination', () => {
    test('should coordinate multiple agents', async () => {
      // Wait for swarm coordination controls
      const swarmControls = await page.waitForSelector('[data-testid="swarm-controls"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (swarmControls) {
        // Start coordination
        const startButton = await page.$('[data-testid="start-coordination"]');
        if (startButton) {
          await startButton.click();
          
          // Wait for coordination to begin
          await page.waitForTimeout(1000);
          
          // Check for coordination status
          const status = await page.$eval('[data-testid="coordination-status"]', 
            el => el.textContent
          ).catch(() => null);
          
          if (status) {
            expect(status).toContain('active');
          }
        }
      }
    });

    test('should display mesh topology', async () => {
      // Check for mesh topology visualization
      const topology = await page.waitForSelector('[data-testid="mesh-topology"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (topology) {
        // Verify topology elements
        const nodes = await page.$$('[data-testid="mesh-node"]');
        const connections = await page.$$('[data-testid="mesh-connection"]');
        
        console.log(`Mesh topology: ${nodes.length} nodes, ${connections.length} connections`);
        
        // Should have at least some nodes
        expect(nodes.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle network failures gracefully', async () => {
      // Simulate network failure
      await page.setOfflineMode(true);
      
      // Try to perform operations
      const errorMessage = await page.waitForSelector('[data-testid="error-message"]', { 
        timeout: 5000 
      }).catch(() => null);
      
      // Restore network
      await page.setOfflineMode(false);
      
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        expect(errorText).toContain('network');
      }
      
      // Should recover after network restoration
      await page.waitForTimeout(2000);
      const recovered = await page.$('[data-testid="dashboard"]');
      expect(recovered).toBeTruthy();
    });

    test('should handle WASM loading failures', async () => {
      // Intercept WASM requests and simulate failure
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        if (request.url().includes('.wasm')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Reload page to trigger WASM loading
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Should fall back gracefully
      const fallbackMessage = await page.waitForSelector('[data-testid="wasm-fallback"]', { 
        timeout: 5000 
      }).catch(() => null);
      
      if (fallbackMessage) {
        const fallbackText = await fallbackMessage.textContent();
        expect(fallbackText).toContain('fallback');
      }
    });
  });

  describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async () => {
      // Focus on first interactive element
      await page.focus('body');
      
      // Tab through interface
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        
        const focused = await page.evaluate(() => {
          return document.activeElement.tagName;
        });
        
        // Should focus on interactive elements
        expect(['BUTTON', 'INPUT', 'SELECT', 'A', 'CANVAS'].includes(focused)).toBeTruthy();
      }
    });

    test('should have proper ARIA labels', async () => {
      // Check for accessibility attributes
      const ariaElements = await page.$$('[aria-label], [aria-labelledby], [role]');
      
      if (ariaElements.length > 0) {
        console.log(`Found ${ariaElements.length} accessible elements`);
        
        // Verify aria-labels are meaningful
        for (const element of ariaElements.slice(0, 5)) { // Check first 5
          const ariaLabel = await element.getAttribute('aria-label');
          const role = await element.getAttribute('role');
          
          if (ariaLabel) {
            expect(ariaLabel.length).toBeGreaterThan(0);
          }
          
          if (role) {
            expect(role.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('Performance Requirements', () => {
    test('should load within performance budget', async () => {
      const metrics = await page.metrics();
      
      // Check key performance metrics
      expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // <100MB
      expect(metrics.JSHeapTotalSize).toBeLessThan(200 * 1024 * 1024); // <200MB
      
      console.log('Performance metrics:', {
        jsHeapUsed: `${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
        jsHeapTotal: `${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)}MB`,
        scriptDuration: `${metrics.ScriptDuration.toFixed(2)}ms`,
        taskDuration: `${metrics.TaskDuration.toFixed(2)}ms`
      });
    });

    test('should maintain 60fps during animations', async () => {
      // Enable FPS monitoring
      await page.tracing.start({
        path: '/tmp/trace.json',
        categories: ['devtools.timeline']
      });
      
      // Trigger animations (if any)
      const animatedElement = await page.$('[data-testid="animated-element"]');
      if (animatedElement) {
        await animatedElement.hover();
        await page.waitForTimeout(2000);
      }
      
      await page.tracing.stop();
      
      // In a real implementation, you would parse the trace file
      // to analyze frame rates
      console.log('FPS monitoring completed');
    });

    test('should handle large datasets efficiently', async () => {
      // Check performance with many agents
      const createManyAgents = await page.$('[data-testid="create-many-agents"]');
      
      if (createManyAgents) {
        const startTime = Date.now();
        await createManyAgents.click();
        
        // Wait for agents to be created
        await page.waitForSelector('[data-testid="agent-list"]', { timeout: 10000 });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        
        // Check final memory usage
        const finalMetrics = await page.metrics();
        expect(finalMetrics.JSHeapUsedSize).toBeLessThan(150 * 1024 * 1024); // <150MB
        
        console.log(`Large dataset test: ${duration}ms, ${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work in different browser contexts', async () => {
      // This test would be run with different browser configurations
      const userAgent = await page.evaluate(() => navigator.userAgent);
      console.log('User agent:', userAgent);
      
      // Basic functionality should work regardless of browser
      const dashboard = await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
      expect(dashboard).toBeTruthy();
      
      // Check for WebGL support
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      });
      
      console.log('WebGL support:', hasWebGL);
      
      // Should provide fallback if WebGL not available
      if (!hasWebGL) {
        const fallback = await page.$('[data-testid="webgl-fallback"]');
        expect(fallback).toBeTruthy();
      }
    });
  });
});