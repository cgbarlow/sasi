/**
 * Shader Transformer for Jest
 * Handles GLSL, vertex, and fragment shader files in tests
 */

module.exports = {
  process(sourceText, sourcePath, options) {
    // Return a mock implementation for shader files
    return {
      code: `module.exports = ${JSON.stringify(sourceText)};`,
    };
  },
  
  getCacheKey(sourceText, sourcePath, options) {
    // Create a cache key based on the source content
    return require('crypto')
      .createHash('md5')
      .update(sourceText)
      .digest('hex');
  },
};