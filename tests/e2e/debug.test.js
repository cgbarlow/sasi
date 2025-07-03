const puppeteer = require('puppeteer');

describe('SASI@home Debug Test', () => {
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
    
    // Capture console logs
    page.on('console', (msg) => {
      console.log(`PAGE LOG: ${msg.text()}`);
    });
    
    // Capture errors
    page.on('error', (err) => {
      console.log(`PAGE ERROR: ${err.message}`);
    });
    
    // Capture page errors
    page.on('pageerror', (err) => {
      console.log(`PAGE SCRIPT ERROR: ${err.message}`);
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should debug application loading', async () => {
    console.log('🔍 Debug: Loading application...');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Wait longer for React to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get page HTML to see what's actually rendered
    const html = await page.content();
    console.log('📄 Page HTML length:', html.length);
    
    // Check for specific elements
    const bodyContent = await page.evaluate(() => {
      return {
        bodyHTML: document.body.innerHTML,
        bodyText: document.body.textContent,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),
        hasRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML || 'No root element'
      };
    });
    
    console.log('🔍 Body text preview:', bodyContent.bodyText.substring(0, 200));
    console.log('🔍 Has root element:', bodyContent.hasRoot);
    console.log('🔍 Root content length:', bodyContent.rootContent.length);
    console.log('🔍 Scripts loaded:', bodyContent.scripts);
    
    // Check if the loading message is still showing
    if (bodyContent.bodyText.includes('Initializing SASI@home')) {
      console.log('⚠️ App still showing loading screen');
    }
    
    if (bodyContent.bodyText.includes('SASI@home')) {
      console.log('✅ SASI@home text found in content');
    }
    
    expect(bodyContent.hasRoot).toBe(true);
    
    console.log('✅ Debug test completed');
  });
});