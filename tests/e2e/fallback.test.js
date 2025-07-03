const puppeteer = require('puppeteer');

describe('WebGL Fallback Test', () => {
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

  test('should show WebGL fallback visualization when WebGL fails', async () => {
    console.log('🎯 Testing WebGL fallback visualization...');
    
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
    
    // Check for fallback content
    const fallbackContent = await page.evaluate(() => {
      const fallback = document.querySelector('.webgl-fallback');
      const fallbackTitle = document.querySelector('.webgl-fallback h3');
      const asciiSwarm = document.querySelector('.ascii-swarm');
      
      return {
        hasFallback: !!fallback,
        fallbackTitle: fallbackTitle?.textContent || '',
        hasAsciiSwarm: !!asciiSwarm,
        asciiContent: asciiSwarm?.textContent?.substring(0, 100) || ''
      };
    });
    
    console.log('🔍 Fallback content analysis:', fallbackContent);
    
    // Verify fallback is showing
    expect(fallbackContent.hasFallback).toBe(true);
    expect(fallbackContent.fallbackTitle).toContain('WebGL Initialization Error');
    expect(fallbackContent.hasAsciiSwarm).toBe(true);
    expect(fallbackContent.asciiContent).toContain('SASI@home');
    
    console.log('✅ WebGL fallback visualization is working correctly!');
    console.log('✅ The black screen issue has been resolved');
  });
});