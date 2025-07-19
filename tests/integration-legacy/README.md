# Legacy Integration Tests

This directory contains integration tests that were originally located in the root `/tests` directory of the workspace. These tests were created during the initial SASI/synaptic-mesh integration development phase.

## Files in this Directory

### Core Integration Tests
- **`sasi-synaptic-integration.test.js`** - Main integration test between SASI and synaptic-mesh systems
- **`integration-points.test.js`** - Tests for specific integration points and API interfaces
- **`sasi-setup.js`** - Setup utilities specifically for SASI integration testing

### Performance & Workflow Tests  
- **`wasm-performance.test.js`** - WebAssembly performance testing for neural networks
- **`complete-workflow.test.js`** - End-to-end workflow testing across both systems

### Documentation
- **`ROOT-TESTS-README.md`** - Original README from the root tests directory

## Status

These tests represent the **original integration test suite** created when SASI and synaptic-mesh were being developed together in a shared workspace. They may contain:

- **Outdated import paths** that reference the old file structure
- **Cross-system dependencies** that may no longer be valid
- **Integration patterns** that have since been superseded by newer implementations

## Recommendations

1. **Review and Update**: These tests should be reviewed and potentially updated to work with the current SASI project structure
2. **Import Path Fixes**: Update any import statements to reference the consolidated SASI file structure
3. **Integration Strategy**: Consider whether these integration tests should be:
   - Updated to work with the current project structure
   - Converted to use synaptic-mesh as an external dependency
   - Replaced with newer integration tests in the main `/tests` directory

## Migration Notes

- **Date Migrated**: July 18, 2025
- **Original Location**: `/workspaces/agentists-quickstart-workspace-basic/tests/`
- **Migration Reason**: Workspace consolidation - separating SASI and synaptic-mesh projects
- **Current Status**: Legacy/archive - requires review before use

These files are preserved for historical reference and to ensure no important integration logic is lost during the consolidation process.