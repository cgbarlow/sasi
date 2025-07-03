const puppeteer = require('puppeteer');

describe('SASI@home Core Functionality E2E Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:3000';

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
        '--single-process',
        '--disable-gpu'
      ]
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (err) => {
      console.log(`🚨 PAGE ERROR: ${err.message}`);
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should successfully navigate to dashboard with Quick Demo', async () => {
    console.log('🎯 Testing core navigation flow...');
    
    // Load landing page
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Wait for React to load fully
    await page.waitForSelector('.landing-page', { timeout: 10000 });
    console.log('✅ Landing page loaded');
    
    // Find and click the Quick Demo button
    const quickDemoButton = await page.waitForSelector('.retro-button.secondary', { timeout: 5000 });
    expect(quickDemoButton).toBeTruthy();
    console.log('✅ Quick Demo button found');
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      quickDemoButton.click()
    ]);
    
    // Verify we're on dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
    console.log('✅ Successfully navigated to dashboard:', url);
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Dashboard container loaded');
  });

  test('should load all dashboard components', async () => {
    console.log('🎯 Testing dashboard components...');
    
    // Test header components
    const dashboardTitle = await page.waitForSelector('.dashboard-title', { timeout: 5000 });
    const titleText = await page.evaluate(el => el.textContent, dashboardTitle);
    expect(titleText).toBe('SASI@home');
    console.log('✅ Dashboard title present');
    
    // Test user info
    const userInfo = await page.waitForSelector('.user-info', { timeout: 5000 });
    expect(userInfo).toBeTruthy();
    console.log('✅ User info panel present');
    
    // Test view selector
    const viewButtons = await page.$$('.view-btn');
    expect(viewButtons.length).toBe(3);
    console.log('✅ View selector buttons present (3 views)');
    
    // Test stats panel
    const statsPanel = await page.waitForSelector('.stats-panel', { timeout: 5000 });
    expect(statsPanel).toBeTruthy();
    console.log('✅ Stats panel present');
    
    // Test control panel
    const controlPanel = await page.waitForSelector('.control-panel', { timeout: 5000 });
    expect(controlPanel).toBeTruthy();
    console.log('✅ Control panel present');
  });

  test('should render WebGL visualization canvas', async () => {
    console.log('🎯 Testing WebGL visualization rendering...');
    
    // Wait for swarm visualization container
    const swarmViz = await page.waitForSelector('.swarm-visualization', { timeout: 10000 });
    expect(swarmViz).toBeTruthy();
    console.log('✅ Swarm visualization container found');
    
    // Wait for canvas to be created (give Three.js time to initialize)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for WebGL canvas
    const canvas = await page.$('.visualization-canvas canvas');
    if (!canvas) {
      console.log('❌ CRITICAL: No WebGL canvas found!');
      
      // Debug: Check what's in the visualization container
      const vizContent = await page.evaluate(() => {
        const container = document.querySelector('.swarm-visualization');
        return {
          innerHTML: container?.innerHTML || 'No container',
          childNodes: container?.childNodes.length || 0,
          classes: container?.className || 'No classes'
        };
      });
      console.log('🔍 Visualization container debug:', vizContent);
      
      expect(canvas).toBeTruthy(); // This will fail and show the problem
    }
    
    console.log('✅ WebGL canvas element found');
    
    // Test canvas properties
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('.visualization-canvas canvas');
      return {
        width: canvas?.width || 0,
        height: canvas?.height || 0,
        context: canvas?.getContext('webgl') ? 'webgl' : 'no-webgl'
      };
    });
    
    expect(canvasInfo.width).toBeGreaterThan(0);
    expect(canvasInfo.height).toBeGreaterThan(0);
    expect(canvasInfo.context).toBe('webgl');
    
    console.log('✅ Canvas has valid dimensions:', canvasInfo);
  });

  test('should display agent data and statistics', async () => {
    console.log('🎯 Testing agent data display...');
    
    // Test live statistics in stats panel
    const statValues = await page.$$eval('.stat-value', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    expect(statValues.length).toBeGreaterThan(0);
    console.log('✅ Statistics displayed:', statValues);
    
    // Test real-time activity feed
    const activityItems = await page.$$('.activity-item');
    expect(activityItems.length).toBeGreaterThan(0);
    console.log('✅ Activity feed shows', activityItems.length, 'items');
    
    // Test ASI progress
    const progressValue = await page.$eval('.progress-value', el => el.textContent);
    expect(progressValue).toMatch(/\d+\.\d+%/);
    console.log('✅ ASI progress displayed:', progressValue);
  });

  test('should navigate between different views', async () => {
    console.log('🎯 Testing view navigation...');
    
    // Test Agents view
    const agentsBtn = await page.$('.view-btn:nth-child(2)');
    await agentsBtn.click();
    await page.waitForSelector('.agent-list', { timeout: 5000 });
    console.log('✅ Agents view loads');
    
    // Verify agent cards are displayed
    const agentCards = await page.$$('.agent-card');
    expect(agentCards.length).toBeGreaterThan(0);
    console.log('✅ Agent cards displayed:', agentCards.length);
    
    // Test Repositories view
    const reposBtn = await page.$('.view-btn:nth-child(3)');
    await reposBtn.click();
    await page.waitForSelector('.repository-list', { timeout: 5000 });
    console.log('✅ Repositories view loads');
    
    // Verify repository cards are displayed
    const repoCards = await page.$$('.repository-card');
    expect(repoCards.length).toBeGreaterThan(0);
    console.log('✅ Repository cards displayed:', repoCards.length);
    
    // Return to Swarm view
    const swarmBtn = await page.$('.view-btn:first-child');
    await swarmBtn.click();
    await page.waitForSelector('.swarm-visualization', { timeout: 5000 });
    console.log('✅ Back to Swarm view');
  });

  test('should have functional control panel', async () => {
    console.log('🎯 Testing control panel functionality...');
    
    // Test swarm start/stop toggle
    const swarmToggle = await page.$('.swarm-toggle');
    expect(swarmToggle).toBeTruthy();
    console.log('✅ Swarm toggle button found');
    
    // Test agent spawning controls
    const agentSelect = await page.$('.agent-type-select');
    expect(agentSelect).toBeTruthy();
    console.log('✅ Agent type selector found');
    
    const spawnButton = await page.$('.spawn-agent');
    expect(spawnButton).toBeTruthy();
    console.log('✅ Spawn agent button found');
    
    // Test visualization controls
    const visualizationControls = await page.$('.visualization-controls');
    expect(visualizationControls).toBeTruthy();
    console.log('✅ Visualization controls found');
  });

  test('should verify Three.js scene is actually rendering content', async () => {
    console.log('🎯 Testing Three.js scene content...');
    
    // Wait for scene to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check Three.js scene state
    const sceneInfo = await page.evaluate(() => {
      // Check if Three.js globals exist
      const hasThree = typeof THREE !== 'undefined';
      
      // Check canvas rendering
      const canvas = document.querySelector('.visualization-canvas canvas');
      const canvasData = canvas ? {
        hasCanvas: true,
        width: canvas.width,
        height: canvas.height,
        style: canvas.style.cssText,
        parent: canvas.parentElement?.className
      } : { hasCanvas: false };
      
      return {
        hasThree,
        canvas: canvasData,
        timestamp: Date.now()
      };
    });
    
    console.log('🔍 Three.js scene analysis:', sceneInfo);
    
    if (!sceneInfo.canvas.hasCanvas) {
      console.log('❌ CRITICAL FAILURE: Three.js canvas not rendering!');
      
      // Additional debugging
      const debugInfo = await page.evaluate(() => {
        const vizContainer = document.querySelector('.swarm-visualization');
        const canvasContainer = document.querySelector('.visualization-canvas');
        
        return {
          vizContainer: vizContainer ? {
            className: vizContainer.className,
            children: vizContainer.children.length,
            innerHTML: vizContainer.innerHTML.substring(0, 500)
          } : null,
          canvasContainer: canvasContainer ? {
            className: canvasContainer.className,
            children: canvasContainer.children.length,
            innerHTML: canvasContainer.innerHTML.substring(0, 200)
          } : null
        };
      });
      
      console.log('🔍 Debug containers:', debugInfo);
    }
    
    expect(sceneInfo.canvas.hasCanvas).toBe(true);
    expect(sceneInfo.canvas.width).toBeGreaterThan(0);
    expect(sceneInfo.canvas.height).toBeGreaterThan(0);
    
    console.log('✅ Three.js scene rendering with canvas:', 
      `${sceneInfo.canvas.width}x${sceneInfo.canvas.height}`);
  });

  test('should verify swarm is actually active and showing content', async () => {
    console.log('🎯 Testing active swarm state...');
    
    // Check swarm status indicator
    const statusText = await page.$eval('.status-text', el => el.textContent);
    expect(statusText).toContain('ACTIVE');
    console.log('✅ Swarm status shows ACTIVE');
    
    // Check that footer shows active network
    const footerStatus = await page.$$eval('.footer-stats .stat-value', 
      elements => elements.map(el => el.textContent)
    );
    
    expect(footerStatus).toContain('ACTIVE');
    console.log('✅ Footer confirms active network');
    
    // Verify legend is showing agent types
    const legendItems = await page.$$eval('.legend-item span', 
      elements => elements.map(el => el.textContent)
    );
    
    expect(legendItems).toEqual(expect.arrayContaining([
      'Researcher', 'Coder', 'Tester', 'Reviewer', 'Debugger'
    ]));
    console.log('✅ Legend shows all agent types:', legendItems);
  });

  test('should detect and report visualization failures', async () => {
    console.log('🔍 Final diagnostic check for visualization...');
    
    const diagnostics = await page.evaluate(() => {
      const canvas = document.querySelector('.visualization-canvas canvas');
      const vizContainer = document.querySelector('.swarm-visualization');
      const mountPoint = document.querySelector('.visualization-canvas');
      
      return {
        hasCanvas: !!canvas,
        canvasDimensions: canvas ? { 
          width: canvas.width, 
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        } : null,
        containerDimensions: vizContainer ? {
          width: vizContainer.clientWidth,
          height: vizContainer.clientHeight
        } : null,
        mountPointExists: !!mountPoint,
        mountPointChildren: mountPoint?.children.length || 0,
        hasThreeJS: typeof THREE !== 'undefined',
        reactRootExists: !!document.getElementById('root'),
        errorLogs: window.console?.errors || []
      };
    });
    
    console.log('📊 FINAL VISUALIZATION DIAGNOSTICS:');
    console.log('=====================================');
    console.log('Canvas Present:', diagnostics.hasCanvas ? '✅' : '❌');
    console.log('Canvas Dimensions:', diagnostics.canvasDimensions);
    console.log('Container Dimensions:', diagnostics.containerDimensions);
    console.log('Mount Point:', diagnostics.mountPointExists ? '✅' : '❌');
    console.log('Mount Children:', diagnostics.mountPointChildren);
    console.log('Three.js Available:', diagnostics.hasThreeJS ? '✅' : '❌');
    console.log('React Root:', diagnostics.reactRootExists ? '✅' : '❌');
    
    if (!diagnostics.hasCanvas) {
      console.log('');
      console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
      console.log('The WebGL visualization is not rendering!');
      console.log('This explains why the center area is black in the screenshot.');
      console.log('The Three.js canvas is not being created or mounted properly.');
    }
    
    // This test should pass to document what we found
    expect(diagnostics.reactRootExists).toBe(true);
    expect(diagnostics.mountPointExists).toBe(true);
    
    // The canvas test will reveal the real issue
    if (!diagnostics.hasCanvas) {
      console.log('🎯 ROOT CAUSE: Three.js initialization failing');
      throw new Error('WebGL visualization not rendering - this is the core functionality issue!');
    }
  });
});