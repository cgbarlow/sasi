const puppeteer = require('puppeteer');

describe('SASI@home Quick Smoke Test', () => {
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
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should load and display the landing page', async () => {
    console.log('🚀 Testing landing page...');
    
    // Navigate to the page
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Check main title
    const title = await page.$eval('.sasi-logo', el => el.textContent);
    expect(title).toBe('SASI@home');
    
    console.log('✅ Landing page loads with correct title');
  });

  test('should display statistics and preview', async () => {
    console.log('🚀 Testing statistics display...');
    
    // Check stats are present
    const stats = await page.$$eval('.stat-value', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    expect(stats.length).toBeGreaterThan(0);
    console.log('✅ Statistics displayed:', stats);
    
    // Check preview visualization
    const previewNodes = await page.$$('.preview-node');
    expect(previewNodes.length).toBe(20);
    
    console.log('✅ Preview visualization with 20 nodes present');
  });

  test('should complete quick demo flow', async () => {
    console.log('🚀 Testing quick demo flow...');
    
    // Click quick demo button
    await page.click('.retro-button.secondary');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    
    // Verify we're on the dashboard
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/dashboard');
    
    console.log('✅ Quick demo navigation successful');
  });

  test('should display dashboard components', async () => {
    console.log('🚀 Testing dashboard components...');
    
    // Check main dashboard elements
    const dashboardTitle = await page.$eval('.dashboard-title', el => el.textContent);
    expect(dashboardTitle).toBe('SASI@home');
    
    // Check stats panel
    await page.waitForSelector('.stats-panel');
    const statsPanel = await page.$('.stats-panel');
    expect(statsPanel).toBeTruthy();
    
    // Check visualization area
    await page.waitForSelector('.swarm-visualization');
    const swarmViz = await page.$('.swarm-visualization');
    expect(swarmViz).toBeTruthy();
    
    console.log('✅ Dashboard components loaded successfully');
  });

  test('should handle view switching', async () => {
    console.log('🚀 Testing view switching...');
    
    // Switch to agents view
    await page.click('.view-btn:nth-child(2)');
    await page.waitForSelector('.agent-list', { timeout: 5000 });
    
    const agentListTitle = await page.$eval('.list-title', el => el.textContent);
    expect(agentListTitle).toBe('Active Agents');
    
    // Switch to repositories view
    await page.click('.view-btn:nth-child(3)');
    await page.waitForSelector('.repository-list', { timeout: 5000 });
    
    const repoListTitle = await page.$eval('.list-title', el => el.textContent);
    expect(repoListTitle).toBe('Active Repositories');
    
    // Switch back to swarm view
    await page.click('.view-btn:first-child');
    await page.waitForSelector('.swarm-visualization', { timeout: 5000 });
    
    console.log('✅ View switching works correctly');
  });

  test('should verify responsive design on mobile', async () => {
    console.log('🚀 Testing mobile responsive design...');
    
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that dashboard is still functional
    const dashboard = await page.$('.dashboard');
    expect(dashboard).toBeTruthy();
    
    // Restore desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    console.log('✅ Mobile responsive design works');
  });
});