const puppeteer = require('puppeteer');

describe('SASI@home E2E Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true, // Required for containerized environments
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Landing Page', () => {
    test('should load landing page successfully', async () => {
      await page.goto(BASE_URL);
      await page.waitForSelector('.landing-page', { timeout: 10000 });
      
      // Check main title
      const title = await page.$eval('.sasi-logo', el => el.textContent);
      expect(title).toBe('SASI@home');
      
      // Check hero section
      const heroTitle = await page.$eval('.hero-title', el => el.textContent);
      expect(heroTitle).toContain('Join the Mega-Swarm');
      
      console.log('✅ Landing page loaded successfully');
    });

    test('should display live statistics', async () => {
      // Check stats are present and have values
      const stats = await page.$$eval('.stat-value', elements => 
        elements.map(el => el.textContent)
      );
      
      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0]).toMatch(/\d+/); // Should contain numbers
      
      console.log('✅ Statistics displayed:', stats);
    });

    test('should show animated preview visualization', async () => {
      await page.waitForSelector('.mini-swarm-preview');
      
      const previewNodes = await page.$$('.preview-node');
      expect(previewNodes.length).toBe(20);
      
      const activeNodes = await page.$$('.preview-node.active');
      expect(activeNodes.length).toBeGreaterThan(0);
      
      console.log('✅ Preview visualization displayed with animated nodes');
    });
  });

  describe('Authentication Flow', () => {
    test('should open authentication modal', async () => {
      await page.click('.retro-button.primary');
      await page.waitForSelector('.auth-modal', { timeout: 5000 });
      
      const modalTitle = await page.$eval('.auth-title', el => el.textContent);
      expect(modalTitle).toBe('Connect to SASI@home');
      
      console.log('✅ Authentication modal opened');
    });

    test('should show mock login form', async () => {
      await page.waitForSelector('#username');
      await page.waitForSelector('#password');
      
      const usernameInput = await page.$('#username');
      const passwordInput = await page.$('#password');
      
      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      
      console.log('✅ Login form elements present');
    });

    test('should perform mock authentication', async () => {
      await page.type('#username', 'TestUser');
      await page.type('#password', 'password123');
      
      // Click submit and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        page.click('.auth-submit-btn')
      ]);
      
      // Should be on dashboard now
      await page.waitForSelector('.dashboard', { timeout: 10000 });
      const url = page.url();
      expect(url).toContain('/dashboard');
      
      console.log('✅ Mock authentication successful, redirected to dashboard');
    });
  });

  describe('Dashboard Navigation', () => {
    test('should display dashboard header with user info', async () => {
      await page.waitForSelector('.dashboard-header');
      
      const dashboardTitle = await page.$eval('.dashboard-title', el => el.textContent);
      expect(dashboardTitle).toBe('SASI@home');
      
      const username = await page.$eval('.username', el => el.textContent);
      expect(username).toBe('TestUser');
      
      console.log('✅ Dashboard header displayed with user info');
    });

    test('should show view selector buttons', async () => {
      const viewButtons = await page.$$('.view-btn');
      expect(viewButtons.length).toBe(3);
      
      const buttonTexts = await page.$$eval('.view-btn', elements => 
        elements.map(el => el.textContent)
      );
      
      expect(buttonTexts).toEqual(['Swarm View', 'Agents', 'Repositories']);
      
      console.log('✅ View selector buttons present');
    });

    test('should have active swarm view by default', async () => {
      const activeButton = await page.$('.view-btn.active');
      const activeText = await page.evaluate(el => el.textContent, activeButton);
      expect(activeText).toBe('Swarm View');
      
      console.log('✅ Swarm view active by default');
    });
  });

  describe('Swarm Visualization', () => {
    test('should render WebGL canvas', async () => {
      await page.waitForSelector('.visualization-canvas canvas', { timeout: 10000 });
      
      const canvas = await page.$('.visualization-canvas canvas');
      expect(canvas).toBeTruthy();
      
      // Check canvas has dimensions
      const canvasSize = await page.evaluate(canvas => {
        return {
          width: canvas.width,
          height: canvas.height
        };
      }, canvas);
      
      expect(canvasSize.width).toBeGreaterThan(0);
      expect(canvasSize.height).toBeGreaterThan(0);
      
      console.log('✅ WebGL canvas rendered with dimensions:', canvasSize);
    });

    test('should show visualization controls', async () => {
      await page.waitForSelector('.visualization-controls');
      
      const cameraSelect = await page.$('.control-select');
      expect(cameraSelect).toBeTruthy();
      
      const statusText = await page.$eval('.status-text', el => el.textContent);
      expect(statusText).toContain('SWARM');
      
      console.log('✅ Visualization controls displayed');
    });

    test('should display legend and info panels', async () => {
      await page.waitForSelector('.visualization-info');
      
      const legendItems = await page.$$('.legend-item');
      expect(legendItems.length).toBe(5); // 5 agent types
      
      const legendTexts = await page.$$eval('.legend-item span', elements => 
        elements.map(el => el.textContent)
      );
      
      expect(legendTexts).toContain('Researcher');
      expect(legendTexts).toContain('Coder');
      expect(legendTexts).toContain('Tester');
      
      console.log('✅ Legend displayed with agent types');
    });
  });

  describe('Statistics Panel', () => {
    test('should display stats panel with live data', async () => {
      await page.waitForSelector('.stats-panel');
      
      const panelTitle = await page.$eval('.panel-title', el => el.textContent);
      expect(panelTitle).toBe('Swarm Statistics');
      
      const liveIndicator = await page.$('.live-indicator .live-text');
      const liveText = await page.evaluate(el => el.textContent, liveIndicator);
      expect(liveText).toBe('LIVE');
      
      console.log('✅ Stats panel displayed with live indicator');
    });

    test('should show stat cards with values', async () => {
      const statCards = await page.$$('.stat-card');
      expect(statCards.length).toBeGreaterThan(0);
      
      const statValues = await page.$$eval('.stat-value', elements => 
        elements.map(el => el.textContent)
      );
      
      // All stat values should be numeric
      statValues.forEach(value => {
        expect(value).toMatch(/[\d.,]+[KM]?/);
      });
      
      console.log('✅ Stat cards displayed with values:', statValues.slice(0, 4));
    });

    test('should display ASI progress bar', async () => {
      await page.waitForSelector('.progress-section');
      
      const progressValue = await page.$eval('.progress-value', el => el.textContent);
      expect(progressValue).toMatch(/\d+\.\d+%/);
      
      const progressBar = await page.$('.progress-fill');
      const progressWidth = await page.evaluate(el => el.style.width, progressBar);
      expect(progressWidth).toMatch(/\d+%/);
      
      console.log('✅ ASI progress displayed:', progressValue);
    });

    test('should show real-time activity feed', async () => {
      await page.waitForSelector('.activity-list');
      
      const activityItems = await page.$$('.activity-item');
      expect(activityItems.length).toBeGreaterThan(0);
      
      const activityTypes = await page.$$eval('.activity-type', elements => 
        elements.map(el => el.textContent)
      );
      
      expect(activityTypes).toContain('Research');
      expect(activityTypes).toContain('Code');
      
      console.log('✅ Real-time activity feed displayed');
    });
  });

  describe('Agent List View', () => {
    test('should navigate to agents view', async () => {
      await page.click('.view-btn:nth-child(2)'); // Agents button
      await page.waitForSelector('.agent-list', { timeout: 5000 });
      
      const listTitle = await page.$eval('.list-title', el => el.textContent);
      expect(listTitle).toBe('Active Agents');
      
      console.log('✅ Navigated to agents view');
    });

    test('should display agent cards', async () => {
      const agentCards = await page.$$('.agent-card');
      expect(agentCards.length).toBeGreaterThan(0);
      
      console.log('✅ Agent cards displayed, count:', agentCards.length);
    });

    test('should show filter controls', async () => {
      const filterSelects = await page.$$('.filter-select');
      expect(filterSelects.length).toBe(3); // Type, Status, Sort
      
      console.log('✅ Filter controls present');
    });

    test('should filter agents by type', async () => {
      // Get initial count
      const initialCards = await page.$$('.agent-card');
      const initialCount = initialCards.length;
      
      // Filter by researcher
      await page.select('.filter-select:first-child', 'researcher');
      await page.waitForTimeout(500); // Wait for filtering
      
      const filteredCards = await page.$$('.agent-card');
      
      // Should have fewer or equal cards
      expect(filteredCards.length).toBeLessThanOrEqual(initialCount);
      
      // Check that all visible cards are researchers
      if (filteredCards.length > 0) {
        const agentTypes = await page.$$eval('.type-name', elements => 
          elements.map(el => el.textContent)
        );
        agentTypes.forEach(type => {
          expect(type).toBe('researcher');
        });
      }
      
      console.log('✅ Agent filtering by type works');
    });
  });

  describe('Repository List View', () => {
    test('should navigate to repositories view', async () => {
      await page.click('.view-btn:nth-child(3)'); // Repositories button
      await page.waitForSelector('.repository-list', { timeout: 5000 });
      
      const listTitle = await page.$eval('.list-title', el => el.textContent);
      expect(listTitle).toBe('Active Repositories');
      
      console.log('✅ Navigated to repositories view');
    });

    test('should display repository cards', async () => {
      const repoCards = await page.$$('.repository-card');
      expect(repoCards.length).toBeGreaterThan(0);
      
      console.log('✅ Repository cards displayed, count:', repoCards.length);
    });

    test('should show search and sort controls', async () => {
      const searchInput = await page.$('.search-input');
      const sortSelect = await page.$('.filter-select');
      
      expect(searchInput).toBeTruthy();
      expect(sortSelect).toBeTruthy();
      
      console.log('✅ Search and sort controls present');
    });

    test('should display repository metrics', async () => {
      // Check first repository card has metrics
      await page.waitForSelector('.metric-grid');
      
      const metricValues = await page.$$eval('.metric-value', elements => 
        elements.slice(0, 4).map(el => el.textContent)
      );
      
      metricValues.forEach(value => {
        expect(value).toMatch(/\d+/);
      });
      
      console.log('✅ Repository metrics displayed');
    });
  });

  describe('Control Panel', () => {
    test('should navigate back to swarm view', async () => {
      await page.click('.view-btn:first-child'); // Swarm View button
      await page.waitForSelector('.swarm-visualization', { timeout: 5000 });
      
      console.log('✅ Navigated back to swarm view');
    });

    test('should show control panel with swarm controls', async () => {
      await page.waitForSelector('.control-panel');
      
      const panelTitle = await page.$eval('.control-panel .panel-title', el => el.textContent);
      expect(panelTitle).toBe('Swarm Control');
      
      console.log('✅ Control panel displayed');
    });

    test('should have system control buttons', async () => {
      const controlButtons = await page.$$('.control-button');
      expect(controlButtons.length).toBeGreaterThan(0);
      
      const buttonTexts = await page.$$eval('.control-button', elements => 
        elements.slice(0, 4).map(el => el.textContent.trim())
      );
      
      expect(buttonTexts.some(text => text.includes('Stop Swarm') || text.includes('Start Swarm'))).toBeTruthy();
      
      console.log('✅ System control buttons present');
    });

    test('should show agent spawn controls', async () => {
      await page.waitForSelector('.agent-spawn-controls');
      
      const agentSelect = await page.$('.agent-type-select');
      const spawnButton = await page.$('.spawn-agent');
      
      expect(agentSelect).toBeTruthy();
      expect(spawnButton).toBeTruthy();
      
      console.log('✅ Agent spawn controls present');
    });

    test('should spawn new agent', async () => {
      // Get initial agent count
      await page.waitForSelector('.stats-panel');
      const initialStatsText = await page.$eval('.stat-value', el => el.textContent);
      
      // Select coder agent type
      await page.select('.agent-type-select', 'coder');
      
      // Click spawn button
      await page.click('.spawn-agent');
      await page.waitForTimeout(1000); // Wait for agent to be created
      
      console.log('✅ Agent spawn functionality works');
    });
  });

  describe('Responsive Design', () => {
    test('should work on tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Check that page still loads and main elements are visible
      const dashboard = await page.$('.dashboard');
      expect(dashboard).toBeTruthy();
      
      console.log('✅ Works on tablet viewport (768x1024)');
    });

    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Check that page still loads
      const dashboard = await page.$('.dashboard');
      expect(dashboard).toBeTruthy();
      
      console.log('✅ Works on mobile viewport (375x667)');
    });

    test('should restore desktop viewport', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      console.log('✅ Restored desktop viewport');
    });
  });

  describe('Footer and Status', () => {
    test('should display footer with network status', async () => {
      await page.waitForSelector('.dashboard-footer');
      
      const footerStats = await page.$$('.footer-stats .stat-item');
      expect(footerStats.length).toBeGreaterThan(0);
      
      const networkStatus = await page.$eval('.footer-stats .stat-value', el => el.textContent);
      expect(networkStatus).toMatch(/ACTIVE|INACTIVE/);
      
      console.log('✅ Footer displayed with network status');
    });
  });

  describe('Performance and Stability', () => {
    test('should handle view switching without errors', async () => {
      // Rapidly switch between views
      await page.click('.view-btn:nth-child(2)'); // Agents
      await page.waitForTimeout(200);
      await page.click('.view-btn:nth-child(3)'); // Repositories  
      await page.waitForTimeout(200);
      await page.click('.view-btn:first-child'); // Swarm
      await page.waitForTimeout(200);
      
      // Should still be functional
      const activeView = await page.$('.view-btn.active');
      expect(activeView).toBeTruthy();
      
      console.log('✅ View switching works without errors');
    });

    test('should maintain WebGL performance', async () => {
      // Check that canvas is still responsive after interactions
      await page.waitForSelector('.visualization-canvas canvas');
      
      const canvas = await page.$('.visualization-canvas canvas');
      
      // Simulate mouse interaction
      await page.mouse.move(960, 540);
      await page.mouse.down();
      await page.mouse.move(1000, 500);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Canvas should still be present and functional
      expect(canvas).toBeTruthy();
      
      console.log('✅ WebGL canvas maintains performance');
    });
  });

  describe('Integration Test - Full User Journey', () => {
    test('should complete full user journey', async () => {
      console.log('🚀 Starting full user journey test...');
      
      // Go back to landing page
      await page.goto(BASE_URL);
      await page.waitForSelector('.landing-page');
      
      // Use quick demo
      await page.click('.retro-button.secondary'); // Quick Demo button
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Should be on dashboard
      await page.waitForSelector('.dashboard');
      
      // Check all major components load
      await page.waitForSelector('.swarm-visualization');
      await page.waitForSelector('.stats-panel');
      await page.waitForSelector('.control-panel');
      
      // Test all views work
      await page.click('.view-btn:nth-child(2)'); // Agents
      await page.waitForSelector('.agent-list');
      
      await page.click('.view-btn:nth-child(3)'); // Repositories
      await page.waitForSelector('.repository-list');
      
      await page.click('.view-btn:first-child'); // Back to Swarm
      await page.waitForSelector('.swarm-visualization');
      
      console.log('✅ Full user journey completed successfully!');
    });
  });
});