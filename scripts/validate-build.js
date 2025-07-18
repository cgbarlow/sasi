#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates production build artifacts and deployment readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildValidator {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'dist');
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      errors: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} ${message}`);
    
    this.results.checks.push({
      message,
      type,
      timestamp
    });
  }

  addError(message) {
    this.results.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.results.warnings.push(message);
    this.log(message, 'warning');
  }

  validateBuildExists() {
    this.log('Checking if build directory exists...');
    
    if (!fs.existsSync(this.buildDir)) {
      this.addError('Build directory does not exist');
      return false;
    }
    
    this.log('Build directory found', 'success');
    return true;
  }

  validateEssentialFiles() {
    this.log('Validating essential build files...');
    
    const requiredFiles = [
      'index.html',
      'assets'
    ];
    
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.buildDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      this.addError(`Missing required files: ${missingFiles.join(', ')}`);
      return false;
    }
    
    this.log('All essential files present', 'success');
    return true;
  }

  validateBundleSize() {
    this.log('Checking bundle size...');
    
    try {
      const stats = this.getBuildStats();
      const maxSizeMB = parseInt(process.env.MAX_BUNDLE_SIZE_MB) || 75;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (stats.totalSize > maxSizeBytes) {
        this.addError(`Bundle size exceeds limit: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB > ${maxSizeMB}MB`);
        return false;
      }
      
      this.log(`Bundle size acceptable: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`, 'success');
      
      // Check individual asset sizes
      const largeAssets = stats.assets.filter(asset => asset.size > 10 * 1024 * 1024); // 10MB
      if (largeAssets.length > 0) {
        largeAssets.forEach(asset => {
          this.addWarning(`Large asset detected: ${asset.name} (${(asset.size / 1024 / 1024).toFixed(2)}MB)`);
        });
      }
      
      return true;
      
    } catch (error) {
      this.addWarning(`Could not validate bundle size: ${error.message}`);
      return true; // Non-critical
    }
  }

  getBuildStats() {
    const stats = {
      totalSize: 0,
      assets: [],
      fileCount: 0
    };
    
    const calculateSize = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          calculateSize(itemPath);
        } else {
          stats.totalSize += stat.size;
          stats.fileCount++;
          
          // Track large assets
          if (stat.size > 1024 * 1024) { // > 1MB
            stats.assets.push({
              name: path.relative(this.buildDir, itemPath),
              size: stat.size
            });
          }
        }
      }
    };
    
    calculateSize(this.buildDir);
    return stats;
  }

  validateIndexHTML() {
    this.log('Validating index.html...');
    
    try {
      const indexPath = path.join(this.buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for required meta tags
      const requiredPatterns = [
        /<meta charset=/,
        /<meta name="viewport"/,
        /<title>/,
        /<script.*src=.*\.js/
      ];
      
      const missingPatterns = requiredPatterns.filter(pattern => !pattern.test(content));
      
      if (missingPatterns.length > 0) {
        this.addWarning('index.html missing some recommended meta tags');
      }
      
      // Check for security headers
      if (!content.includes('Content-Security-Policy') && !content.includes('X-Frame-Options')) {
        this.addWarning('Consider adding security headers to index.html');
      }
      
      this.log('index.html validation completed', 'success');
      return true;
      
    } catch (error) {
      this.addError(`Failed to validate index.html: ${error.message}`);
      return false;
    }
  }

  validateAssets() {
    this.log('Validating assets directory...');
    
    try {
      const assetsPath = path.join(this.buildDir, 'assets');
      
      if (!fs.existsSync(assetsPath)) {
        this.addError('Assets directory not found');
        return false;
      }
      
      const assets = fs.readdirSync(assetsPath);
      
      // Check for JS and CSS files
      const jsFiles = assets.filter(file => file.endsWith('.js'));
      const cssFiles = assets.filter(file => file.endsWith('.css'));
      
      if (jsFiles.length === 0) {
        this.addError('No JavaScript files found in assets');
        return false;
      }
      
      if (cssFiles.length === 0) {
        this.addWarning('No CSS files found in assets - expected for most applications');
      }
      
      // Check for source maps in production
      const sourceMaps = assets.filter(file => file.endsWith('.map'));
      if (sourceMaps.length > 0 && process.env.NODE_ENV === 'production') {
        this.addWarning(`Source maps found in production build: ${sourceMaps.length} files`);
      }
      
      this.log(`Assets validation completed: ${jsFiles.length} JS, ${cssFiles.length} CSS files`, 'success');
      return true;
      
    } catch (error) {
      this.addError(`Failed to validate assets: ${error.message}`);
      return false;
    }
  }

  validateServerStart() {
    this.log('Testing server startup...');
    
    try {
      // Try to start the preview server briefly
      const port = process.env.PREVIEW_PORT || 4173;
      
      // Use timeout to prevent hanging
      const command = `timeout 10s npm run preview`;
      
      try {
        execSync(command, { 
          stdio: 'pipe',
          timeout: 15000
        });
        this.log('Server starts successfully', 'success');
        return true;
      } catch (error) {
        // Timeout is expected, check if it was a startup error
        if (error.status === 124) { // timeout exit code
          this.log('Server startup test completed (timeout expected)', 'success');
          return true;
        } else {
          this.addError(`Server failed to start: ${error.message}`);
          return false;
        }
      }
      
    } catch (error) {
      this.addWarning(`Could not test server startup: ${error.message}`);
      return true; // Non-critical
    }
  }

  validateSEO() {
    this.log('Checking SEO optimization...');
    
    try {
      const indexPath = path.join(this.buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const seoChecks = [
        { pattern: /<meta name="description"/, name: 'Meta description' },
        { pattern: /<meta property="og:title"/, name: 'Open Graph title' },
        { pattern: /<meta property="og:description"/, name: 'Open Graph description' },
        { pattern: /<meta name="twitter:card"/, name: 'Twitter card' },
        { pattern: /<link rel="canonical"/, name: 'Canonical URL' }
      ];
      
      const missingSEO = seoChecks.filter(check => !check.pattern.test(content));
      
      if (missingSEO.length > 0) {
        this.addWarning(`Missing SEO elements: ${missingSEO.map(m => m.name).join(', ')}`);
      } else {
        this.log('SEO optimization looks good', 'success');
      }
      
      return true;
      
    } catch (error) {
      this.addWarning(`Could not validate SEO: ${error.message}`);
      return true;
    }
  }

  generateReport() {
    const report = {
      ...this.results,
      summary: {
        totalChecks: this.results.checks.length,
        errors: this.results.errors.length,
        warnings: this.results.warnings.length,
        success: this.results.errors.length === 0
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), 'coverage', 'build-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate summary
    console.log('\n📋 Build Validation Summary:');
    console.log(`✅ Total checks: ${report.summary.totalChecks}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    return report;
  }

  async validate() {
    console.log('🔍 Starting build validation...\n');
    
    const checks = [
      () => this.validateBuildExists(),
      () => this.validateEssentialFiles(),
      () => this.validateBundleSize(),
      () => this.validateIndexHTML(),
      () => this.validateAssets(),
      () => this.validateServerStart(),
      () => this.validateSEO()
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      try {
        const result = await check();
        if (!result) allPassed = false;
      } catch (error) {
        this.addError(`Check failed: ${error.message}`);
        allPassed = false;
      }
    }
    
    const report = this.generateReport();
    
    if (report.summary.success) {
      console.log('\n🎉 Build validation passed!');
      process.exit(0);
    } else {
      console.log('\n💥 Build validation failed!');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  validator.validate().catch(console.error);
}

module.exports = BuildValidator;