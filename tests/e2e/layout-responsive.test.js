const puppeteer = require('puppeteer');

describe('Layout and Responsive Design Tests', () => {
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
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  const testViewport = async (width, height, deviceName) => {
    page = await browser.newPage();
    await page.setViewport({ width, height });
    
    console.log(`🎯 Testing ${deviceName} (${width}x${height})`);
    
    // Navigate to dashboard
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('.retro-button.secondary', { timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('.retro-button.secondary')
    ]);
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    
    // Check for horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Check for vertical scrollbar on dashboard body
    const hasVerticalScrollOnBody = await page.evaluate(() => {
      const dashboard = document.querySelector('.dashboard');
      return dashboard ? dashboard.scrollHeight > dashboard.clientHeight : false;
    });
    
    // Check for overlapping elements
    const overlappingElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('.seti-panel, .control-group, .view-btn');
      const overlaps = [];
      
      for (let i = 0; i < elements.length; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        for (let j = i + 1; j < elements.length; j++) {
          const rect2 = elements[j].getBoundingClientRect();
          
          // Check if rectangles overlap
          if (rect1.left < rect2.right && rect2.left < rect1.right &&
              rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
            overlaps.push({
              element1: elements[i].className,
              element2: elements[j].className,
              rect1: { x: rect1.x, y: rect1.y, width: rect1.width, height: rect1.height },
              rect2: { x: rect2.x, y: rect2.y, width: rect2.width, height: rect2.height }
            });
          }
        }
      }
      return overlaps;
    });
    
    // Check if all buttons are properly sized and accessible
    const buttonAccessibility = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const issues = [];
      
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(button);
        
        // Check minimum touch target size (44x44px recommended)
        if (rect.width < 36 || rect.height < 36) {
          issues.push({
            buttonIndex: index,
            className: button.className,
            size: { width: rect.width, height: rect.height },
            issue: 'Too small for touch interaction'
          });
        }
        
        // Check if button is visible
        if (rect.width === 0 || rect.height === 0 || computedStyle.display === 'none') {
          issues.push({
            buttonIndex: index,
            className: button.className,
            issue: 'Button not visible'
          });
        }
        
        // Check if button extends outside viewport
        if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
          issues.push({
            buttonIndex: index,
            className: button.className,
            position: { right: rect.right, bottom: rect.bottom },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            issue: 'Button extends outside viewport'
          });
        }
      });
      
      return issues;
    });
    
    // Check text readability (font size)
    const textReadability = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, label, h1, h2, h3, h4, .seti-data-line');
      const issues = [];
      
      textElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        // Check minimum readable font size (12px)
        if (fontSize < 12) {
          issues.push({
            elementIndex: index,
            className: element.className,
            fontSize: fontSize,
            text: element.textContent?.substring(0, 50) || '',
            issue: 'Font too small for readability'
          });
        }
      });
      
      return issues;
    });
    
    // Check container overflow
    const containerOverflow = await page.evaluate(() => {
      const containers = document.querySelectorAll('.dashboard, .dashboard-header, .sidebar, .visualization-info');
      const issues = [];
      
      containers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(container);
        
        if (rect.right > window.innerWidth + 5) { // 5px tolerance
          issues.push({
            containerIndex: index,
            className: container.className,
            overflow: rect.right - window.innerWidth,
            issue: 'Container overflows horizontally'
          });
        }
      });
      
      return issues;
    });
    
    console.log(`📊 ${deviceName} Layout Analysis:`);
    console.log(`   - Horizontal scroll: ${hasHorizontalScroll ? '❌ YES' : '✅ NO'}`);
    console.log(`   - Vertical scroll on body: ${hasVerticalScrollOnBody ? '⚠️ YES' : '✅ NO'}`);
    console.log(`   - Overlapping elements: ${overlappingElements.length > 0 ? `❌ ${overlappingElements.length}` : '✅ NONE'}`);
    console.log(`   - Button accessibility issues: ${buttonAccessibility.length > 0 ? `❌ ${buttonAccessibility.length}` : '✅ NONE'}`);
    console.log(`   - Text readability issues: ${textReadability.length > 0 ? `❌ ${textReadability.length}` : '✅ NONE'}`);
    console.log(`   - Container overflow issues: ${containerOverflow.length > 0 ? `❌ ${containerOverflow.length}` : '✅ NONE'}`);
    
    if (overlappingElements.length > 0) {
      console.log(`🔍 Overlapping elements details:`, overlappingElements);
    }
    if (buttonAccessibility.length > 0) {
      console.log(`🔍 Button accessibility issues:`, buttonAccessibility);
    }
    if (containerOverflow.length > 0) {
      console.log(`🔍 Container overflow issues:`, containerOverflow);
    }
    
    await page.close();
    
    return {
      deviceName,
      width,
      height,
      hasHorizontalScroll,
      hasVerticalScrollOnBody,
      overlappingElements: overlappingElements.length,
      buttonAccessibilityIssues: buttonAccessibility.length,
      textReadabilityIssues: textReadability.length,
      containerOverflowIssues: containerOverflow.length,
      passed: !hasHorizontalScroll && 
              overlappingElements.length === 0 && 
              buttonAccessibility.length === 0 && 
              containerOverflow.length === 0
    };
  };

  test('Desktop layout (1920x1080) should have no layout issues', async () => {
    const result = await testViewport(1920, 1080, 'Desktop');
    expect(result.passed).toBe(true);
    expect(result.hasHorizontalScroll).toBe(false);
    expect(result.overlappingElements).toBe(0);
    expect(result.containerOverflowIssues).toBe(0);
  });

  test('Laptop layout (1366x768) should have no layout issues', async () => {
    const result = await testViewport(1366, 768, 'Laptop');
    expect(result.passed).toBe(true);
    expect(result.hasHorizontalScroll).toBe(false);
    expect(result.overlappingElements).toBe(0);
    expect(result.containerOverflowIssues).toBe(0);
  });

  test('Tablet layout (768x1024) should have no layout issues', async () => {
    const result = await testViewport(768, 1024, 'Tablet');
    expect(result.passed).toBe(true);
    expect(result.hasHorizontalScroll).toBe(false);
    expect(result.overlappingElements).toBe(0);
    expect(result.containerOverflowIssues).toBe(0);
  });

  test('Mobile layout (375x667) should have no layout issues', async () => {
    const result = await testViewport(375, 667, 'Mobile');
    expect(result.passed).toBe(true);
    expect(result.hasHorizontalScroll).toBe(false);
    expect(result.overlappingElements).toBe(0);
    expect(result.containerOverflowIssues).toBe(0);
  });

  test('Small mobile layout (320x568) should have no layout issues', async () => {
    const result = await testViewport(320, 568, 'Small Mobile');
    expect(result.passed).toBe(true);
    expect(result.hasHorizontalScroll).toBe(false);
    expect(result.overlappingElements).toBe(0);
    expect(result.containerOverflowIssues).toBe(0);
  });

  test('All viewports comprehensive test', async () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 320, height: 568, name: 'Small Mobile' }
    ];

    console.log('🎯 Running comprehensive layout tests across all viewports...');
    
    const results = [];
    for (const viewport of viewports) {
      const result = await testViewport(viewport.width, viewport.height, viewport.name);
      results.push(result);
    }
    
    const failedViewports = results.filter(r => !r.passed);
    const passedViewports = results.filter(r => r.passed);
    
    console.log(`\n📊 COMPREHENSIVE LAYOUT TEST RESULTS:`);
    console.log(`✅ Passed: ${passedViewports.length}/${results.length} viewports`);
    console.log(`❌ Failed: ${failedViewports.length}/${results.length} viewports`);
    
    if (failedViewports.length > 0) {
      console.log(`\n❌ Failed viewports:`);
      failedViewports.forEach(result => {
        console.log(`   - ${result.deviceName} (${result.width}x${result.height}): Issues detected`);
      });
    }
    
    // Test should pass if all viewports are working
    expect(failedViewports.length).toBe(0);
  });
});