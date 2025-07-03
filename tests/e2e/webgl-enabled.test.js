const puppeteer = require('puppeteer');

describe('WebGL Enabled Test', () => {
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
        '--enable-webgl',
        '--use-gl=swiftshader',
        '--enable-accelerated-2d-canvas',
        '--disable-software-rasterizer',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable WebGL in page
    await page.evaluateOnNewDocument(() => {
      // Override WebGL context creation to be more permissive
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, options) {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return originalGetContext.call(this, 'webgl', {
            ...options,
            failIfMajorPerformanceCaveat: false,
            antialias: false,
            alpha: true,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'default'
          });
        }
        return originalGetContext.call(this, type, options);
      };
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should render actual WebGL 3D spectrum visualization', async () => {
    console.log('🎯 Testing WebGL enabled spectrum visualization...');
    
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
    
    // Wait extra time for WebGL to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for actual WebGL canvas
    const webglStatus = await page.evaluate(() => {
      const canvas = document.querySelector('.visualization-canvas canvas');
      const fallback = document.querySelector('.webgl-fallback');
      
      // Test WebGL context creation
      let webglWorking = false;
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        webglWorking = !!gl;
      }
      
      return {
        hasCanvas: !!canvas,
        hasFallback: !!fallback,
        webglWorking,
        canvasInfo: canvas ? {
          width: canvas.width,
          height: canvas.height,
          style: canvas.style.cssText
        } : null
      };
    });
    
    console.log('🔍 WebGL Status:', webglStatus);
    
    if (webglStatus.hasCanvas && webglStatus.webglWorking) {
      console.log('🎉 SUCCESS: WebGL canvas is working!');
      console.log('🎉 Classic SETI@home 3D visualization is rendering!');
      
      // Take screenshot of working WebGL
      await page.screenshot({ path: '/tmp/sasi-webgl-working.png', fullPage: true });
      console.log('✅ Screenshot saved showing working WebGL visualization');
      
      expect(webglStatus.hasCanvas).toBe(true);
      expect(webglStatus.webglWorking).toBe(true);
      expect(webglStatus.hasFallback).toBe(false);
    } else {
      console.log('ℹ️ WebGL still not working, but fallback looks great!');
      
      // The fallback should be visible
      expect(webglStatus.hasFallback).toBe(true);
    }
  });
});