import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development performance
      fastRefresh: true,
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Enable HTTP/2 for better performance
    https: false,
    // Enable compression
    compress: true,
    // Optimize hot reload
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize build performance
    target: 'es2020',
    cssCodeSplit: true,
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Optimize chunk splitting
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          performance: ['@/performance/performanceOptimizer', '@/hooks/usePerformanceMonitoring'],
        },
        // Optimize asset names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimize build cache
    brotliSize: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Enable performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Configure WASM support
  assetsInclude: ['**/*.wasm'],
  // Enable worker support for performance
  worker: {
    format: 'es',
    plugins: [react()],
  },
  // Configure preview server
  preview: {
    port: 3001,
    https: false,
    compress: true,
  },
  // Environment variables
  define: {
    __PERFORMANCE_MONITORING__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __ENABLE_SIMD__: JSON.stringify(true),
    __ENABLE_WASM_CACHING__: JSON.stringify(true),
  },
})