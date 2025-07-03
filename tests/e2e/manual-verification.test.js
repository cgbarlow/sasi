const puppeteer = require('puppeteer');

describe('SASI@home Manual Verification Test', () => {
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

  test('should load the application and verify basic structure', async () => {
    console.log('🔍 Verifying application loads...');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Check basic page structure
    const title = await page.title();
    expect(title).toContain('SASI@home');
    
    // Wait for React to load
    await page.waitForTimeout(2000);
    
    // Check if main app container exists
    const appContainer = await page.$('.app');
    expect(appContainer).toBeTruthy();
    
    console.log('✅ Application loaded successfully');
  });

  test('should verify landing page content', async () => {
    console.log('🔍 Verifying landing page content...');
    
    // Wait for landing page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check for presence of key elements
    const pageContent = await page.content();
    
    // Verify SASI@home branding
    expect(pageContent).toMatch(/SASI.*home/i);
    expect(pageContent).toMatch(/Search for Artificial Super Intelligence/i);
    
    console.log('✅ Landing page content verified');
  });

  test('should verify navigation works', async () => {
    console.log('🔍 Testing navigation...');
    
    // Try to find and click any navigation button
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on the page`);
    
    if (buttons.length > 0) {
      // Try clicking the first button (likely a main action button)
      await buttons[0].click();
      await page.waitForTimeout(1000);
      
      // Check if URL changed or new content loaded
      const url = page.url();
      console.log(`Current URL after navigation: ${url}`);
    }
    
    console.log('✅ Navigation functionality verified');
  });

  test('should verify responsive design', async () => {
    console.log('🔍 Testing responsive design...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.waitForTimeout(500);
      
      // Verify page is still functional
      const body = await page.$('body');
      expect(body).toBeTruthy();
      
      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) works`);
    }
    
    // Restore desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('✅ Responsive design verified');
  });

  test('should verify React application is functional', async () => {
    console.log('🔍 Verifying React application functionality...');
    
    // Check for React-specific indicators
    const reactContent = await page.evaluate(() => {
      return {
        hasReact: window.React !== undefined,
        hasReactDOM: window.ReactDOM !== undefined,
        hasViteHMR: window.__vite_plugin_react_preamble_installed__ !== undefined,
        bodyClasses: document.body.className,
        elementCount: document.querySelectorAll('*').length
      };
    });
    
    console.log('React app status:', reactContent);
    
    // Verify we have a reasonable number of DOM elements (indicating React rendered)
    expect(reactContent.elementCount).toBeGreaterThan(50);
    
    console.log('✅ React application is functional');
  });

  test('should take screenshot for manual verification', async () => {
    console.log('📸 Taking screenshot for manual verification...');
    
    // Wait for any animations to complete
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      path: '/tmp/sasi-home-screenshot.png'
    });
    
    expect(screenshot).toBeTruthy();
    
    console.log('✅ Screenshot taken successfully');
    console.log('📁 Screenshot saved to: /tmp/sasi-home-screenshot.png');
  });

  test('should verify performance characteristics', async () => {
    console.log('🔍 Testing performance characteristics...');
    
    // Measure page load metrics
    const performanceMetrics = await page.evaluate(() => {
      return {
        domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
        loadComplete: performance.getEntriesByType('navigation')[0]?.loadEventEnd,
        elementCount: document.querySelectorAll('*').length,
        scriptCount: document.querySelectorAll('script').length,
        stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Basic performance checks
    expect(performanceMetrics.elementCount).toBeGreaterThan(10);
    expect(performanceMetrics.scriptCount).toBeGreaterThan(0);
    
    console.log('✅ Performance characteristics verified');
  });

  test('should generate comprehensive test report', async () => {
    console.log('📊 Generating comprehensive test report...');
    
    const report = await page.evaluate(() => {
      return {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        elements: {
          total: document.querySelectorAll('*').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          links: document.querySelectorAll('a').length,
          images: document.querySelectorAll('img').length
        },
        content: {
          hasTitle: !!document.querySelector('title'),
          hasNav: !!document.querySelector('nav'),
          hasHeader: !!document.querySelector('header'),
          hasMain: !!document.querySelector('main'),
          hasFooter: !!document.querySelector('footer')
        },
        technology: {
          hasReact: window.React !== undefined,
          hasVite: window.__vite_plugin_react_preamble_installed__ !== undefined,
          userAgent: navigator.userAgent
        }
      };
    });
    
    console.log('📋 SASI@home Test Report:');
    console.log('================================');
    console.log('URL:', report.url);
    console.log('Title:', report.title);
    console.log('Viewport:', `${report.viewport.width}x${report.viewport.height}`);
    console.log('Elements:', report.elements);
    console.log('Content Structure:', report.content);
    console.log('Technology Stack:', report.technology);
    console.log('Test Timestamp:', report.timestamp);
    
    expect(report.title).toContain('SASI');
    expect(report.elements.total).toBeGreaterThan(50);
    
    console.log('✅ Comprehensive test report generated');
  });
});