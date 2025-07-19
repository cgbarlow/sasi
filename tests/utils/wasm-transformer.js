/**
 * Jest transformer for WASM files
 * Transforms .wasm files into mock modules for testing
 */

module.exports = {
  process(sourceText, sourcePath, options) {
    const wasmFileName = sourcePath.split('/').pop()
    
    // Create a mock WASM module with proper string escaping
    const simdExports = wasmFileName.includes('simd') ? 
      'simd_add: (a, b) => new Float32Array(a.map((val, i) => val + b[i])), simd_multiply: (a, b) => new Float32Array(a.map((val, i) => val * b[i])),' : ''
    
    const neuralExports = wasmFileName.includes('neural') ? 
      'neural_forward: (input) => new Float32Array(input.length).map(() => Math.random()), neural_backward: () => {}, neural_train: () => {},' : ''
    
    const fannExports = wasmFileName.includes('fann') ? 
      'fann_create: () => ({ id: "mock-network" }), fann_train: () => {}, fann_run: (input) => new Float32Array(10).map(() => Math.random()),' : ''
    
    return `
      module.exports = {
        default: {
          instance: {
            exports: {
              ${simdExports}
              ${neuralExports}
              ${fannExports}
              matrix_multiply: (a, b, rows, cols) => {
                const result = new Float32Array(rows * cols)
                for (let i = 0; i < rows; i++) {
                  for (let j = 0; j < cols; j++) {
                    let sum = 0
                    for (let k = 0; k < cols; k++) {
                      sum += a[i * cols + k] * b[k * cols + j]
                    }
                    result[i * cols + j] = sum
                  }
                }
                return result
              },
              allocate_memory: (size) => new ArrayBuffer(size),
              free_memory: () => {},
              memory: new WebAssembly.Memory({ initial: 10 })
            }
          },
          module: {}
        }
      };
    `
  }
}