const puppeteer = require('puppeteer');

describe('Visual Screenshot Test', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:3002';

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

  test('should take screenshot of swarm visualization', async () => {
    console.log('🎯 Taking screenshot of swarm visualization...');
    
    // Navigate to landing page
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Click Quick Demo to go to dashboard
    await page.waitForSelector('.retro-button.secondary', { timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('.retro-button.secondary')
    ]);
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Dashboard loaded');
    
    // Wait for swarm visualization container
    await page.waitForSelector('.swarm-visualization', { timeout: 10000 });
    console.log('✅ Swarm visualization container found');
    
    // Wait extra time for animations to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/sasi-dashboard.png', fullPage: true });
    console.log('✅ Screenshot saved to /tmp/sasi-dashboard.png');
    
    // Get detailed info about what's on the page
    const pageInfo = await page.evaluate(() => {
      const swarmViz = document.querySelector('.swarm-visualization');
      const canvas = document.querySelector('.visualization-canvas canvas');
      const fallback = document.querySelector('.webgl-fallback');
      
      return {
        swarmVizExists: !!swarmViz,
        swarmVizRect: swarmViz?.getBoundingClientRect(),
        canvasExists: !!canvas,
        canvasRect: canvas?.getBoundingClientRect(),
        fallbackExists: !!fallback,
        fallbackRect: fallback?.getBoundingClientRect(),
        swarmVizHTML: swarmViz?.innerHTML.substring(0, 300) || 'No swarm viz',
        canvasHTML: canvas?.outerHTML || 'No canvas'
      };
    });
    
    console.log('📊 Page Analysis:', pageInfo);
    
    expect(pageInfo.swarmVizExists).toBe(true);
  });
});