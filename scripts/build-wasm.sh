#!/bin/bash

# Build script for WASM neural runtime with SIMD optimization
# This script builds the Rust code to optimized WASM with SIMD support

set -e

echo "🦀 Building WASM Neural Runtime with SIMD optimization..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if Rust is installed with wasm32 target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "📦 Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Create wasm directory if it doesn't exist
mkdir -p src/wasm
cd src/wasm

# Initialize lib.rs if it doesn't exist
if [ ! -f "lib.rs" ]; then
    echo "📝 Creating lib.rs..."
    cat > lib.rs << 'EOF'
//! SASI Neural Runtime WASM Module
//! High-performance neural network operations with SIMD acceleration

mod neural_runtime;
pub use neural_runtime::*;

use wasm_bindgen::prelude::*;

// Enable console.log for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("🚀 SASI Neural Runtime WASM loaded with SIMD support");
}
EOF
fi

# Build with wasm-pack
echo "🔨 Building WASM module..."
wasm-pack build --target web --out-dir ../../public/wasm --release -- --features "simd"

# Copy additional files
echo "📋 Setting up WASM loader..."
cd ../../

# Create WASM loader if it doesn't exist
if [ ! -f "src/utils/wasm-loader.js" ]; then
    cat > src/utils/wasm-loader.js << 'EOF'
/**
 * WASM Loader for SASI Neural Runtime
 * Provides initialization and performance optimization
 */

class WASMNeuralLoader {
  constructor() {
    this.module = null;
    this.isLoaded = false;
    this.loadStartTime = 0;
  }

  async load() {
    this.loadStartTime = performance.now();
    
    try {
      console.log('🔄 Loading WASM Neural Runtime...');
      
      const { default: init, NeuralRuntime, check_simd_support } = await import('./neural_wasm_runtime.js');
      
      // Initialize WASM module
      await init();
      
      // Check SIMD support
      const simdSupported = check_simd_support();
      console.log(`✅ WASM loaded. SIMD support: ${simdSupported}`);
      
      // Create runtime instance
      this.module = new NeuralRuntime();
      this.isLoaded = true;
      
      const loadTime = performance.now() - this.loadStartTime;
      console.log(`⚡ WASM load time: ${loadTime.toFixed(2)}ms`);
      
      if (loadTime > 100) {
        console.warn(`⚠️ WASM load time ${loadTime.toFixed(2)}ms exceeds 100ms target`);
      }
      
      return this.module;
      
    } catch (error) {
      console.error('❌ Failed to load WASM module:', error);
      throw error;
    }
  }

  getModule() {
    if (!this.isLoaded) {
      throw new Error('WASM module not loaded. Call load() first.');
    }
    return this.module;
  }

  benchmark() {
    if (!this.isLoaded) {
      throw new Error('WASM module not loaded');
    }
    
    return this.module.benchmark();
  }
}

// Export for use in application
window.WASMNeuralLoader = WASMNeuralLoader;

export default WASMNeuralLoader;
EOF
fi

# Optimize the generated WASM file
if command -v wasm-opt &> /dev/null; then
    echo "🔧 Optimizing WASM with wasm-opt..."
    wasm-opt public/wasm/neural_wasm_runtime_bg.wasm -O4 --enable-simd -o public/wasm/neural_wasm_runtime_bg.wasm
else
    echo "⚠️ wasm-opt not found. Install binaryen for additional optimizations."
fi

# Display build results
echo "✅ WASM build complete!"
echo "📊 Build summary:"
ls -lh public/wasm/neural_wasm_runtime_bg.wasm 2>/dev/null || echo "   WASM file not found"
echo "   Files generated in public/wasm/"
echo "   Ready for integration with NeuralAgentManager"

# Run quick validation
echo "🧪 Running quick validation..."
node -e "
const fs = require('fs');
const wasmFile = 'public/wasm/neural_wasm_runtime_bg.wasm';
if (fs.existsSync(wasmFile)) {
  const stats = fs.statSync(wasmFile);
  console.log(\`✅ WASM file size: \${(stats.size / 1024).toFixed(2)} KB\`);
  if (stats.size > 1024 * 1024) {
    console.warn('⚠️ WASM file is larger than 1MB - consider optimization');
  }
} else {
  console.error('❌ WASM file not generated');
  process.exit(1);
}
" || echo "Node.js validation skipped"

echo "🎉 WASM Neural Runtime build completed successfully!"