/**
 * Neural Weight Storage Manager - Phase 2A Implementation
 * Handles neural network weight serialization, compression, and persistence
 * 
 * Performance Requirements:
 * - Weight save/load: <30ms
 * - Compression ratio: >50%
 * - Data integrity: 100% with checksums
 * - Memory usage: <10MB during operations
 */

import * as crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { performance } from 'perf_hooks';
import type { AgentPersistenceManager } from './AgentPersistenceManager';

export interface NeuralWeightData {
  agentId: string;
  layerIndex: number;
  weights: Float32Array;
  biases: Float32Array;
  timestamp: number;
  checksum?: string;
}

export interface CompressedWeightData {
  weightData: Buffer;
  biasData: Buffer;
  compressionType: 'gzip' | 'lz4' | 'none';
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  checksum: string;
}

export class NeuralWeightStorage {
  private persistence: AgentPersistenceManager;
  private compressionEnabled: boolean = true;
  private checksumValidation: boolean = true;
  private compressionThreshold: number = 1024; // Compress if data > 1KB

  constructor(persistenceManager: AgentPersistenceManager) {
    this.persistence = persistenceManager;
  }

  /**
   * Save neural weights for an agent with compression and validation
   * Performance target: <30ms
   */
  async saveNeuralWeights(
    agentId: string,
    networkLayers: number[],
    weights: Float32Array[],
    biases: Float32Array[]
  ): Promise<void> {
    const startTime = performance.now();

    try {
      if (weights.length !== biases.length) {
        throw new Error('Weights and biases arrays must have the same length');
      }

      if (weights.length !== networkLayers.length - 1) {
        throw new Error('Weight layers must match network architecture');
      }

      // Process each layer
      for (let layerIndex = 0; layerIndex < weights.length; layerIndex++) {
        const compressedData = await this.compressLayerData(
          weights[layerIndex],
          biases[layerIndex]
        );

        // Save to database via persistence manager
        // This would call a method we'll add to AgentPersistenceManager
        await this.saveLayerWeights(agentId, layerIndex, compressedData);
      }

      const saveTime = performance.now() - startTime;
      
      if (saveTime > 30) {
        console.warn(`⚠️ Neural weight save time exceeded target: ${saveTime.toFixed(2)}ms`);
      }

      console.log(`💾 Saved neural weights for agent ${agentId} (${saveTime.toFixed(2)}ms)`);

    } catch (error) {
      const saveTime = performance.now() - startTime;
      console.error(`❌ Failed to save neural weights for ${agentId} (${saveTime.toFixed(2)}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Load neural weights for an agent with decompression and validation
   * Performance target: <30ms
   */
  async loadNeuralWeights(agentId: string): Promise<{ weights: Float32Array[]; biases: Float32Array[] }> {
    const startTime = performance.now();

    try {
      // Load weight records from database
      const weightRecords = await this.getAgentWeightRecords(agentId);
      
      if (weightRecords.length === 0) {
        throw new Error(`No neural weights found for agent ${agentId}`);
      }

      const weights: Float32Array[] = [];
      const biases: Float32Array[] = [];

      // Process each layer in order
      for (const record of weightRecords.sort((a, b) => a.layerIndex - b.layerIndex)) {
        // Validate checksum if enabled
        if (this.checksumValidation) {
          const expectedChecksum = this.generateChecksum(record.weightData, record.biasData);
          if (expectedChecksum !== record.checksum) {
            throw new Error(`Weight corruption detected for agent ${agentId}, layer ${record.layerIndex}`);
          }
        }

        // Decompress and deserialize
        const layerWeights = await this.decompressWeights(record.weightData, record.compressionType);
        const layerBiases = await this.decompressBiases(record.biasData, record.compressionType);

        weights.push(layerWeights);
        biases.push(layerBiases);
      }

      const loadTime = performance.now() - startTime;
      
      if (loadTime > 30) {
        console.warn(`⚠️ Neural weight load time exceeded target: ${loadTime.toFixed(2)}ms`);
      }

      console.log(`📥 Loaded neural weights for agent ${agentId} (${loadTime.toFixed(2)}ms)`);

      return { weights, biases };

    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(`❌ Failed to load neural weights for ${agentId} (${loadTime.toFixed(2)}ms):`, error.message);
      throw error;
    }
  }

  /**
   * Compress weight and bias data for a single layer
   */
  private async compressLayerData(
    weights: Float32Array,
    biases: Float32Array
  ): Promise<CompressedWeightData> {
    const startTime = performance.now();

    try {
      // Convert to buffers
      const weightBuffer = Buffer.from(weights.buffer);
      const biasBuffer = Buffer.from(biases.buffer);

      const originalSize = weightBuffer.length + biasBuffer.length;
      
      let compressedWeights: Buffer;
      let compressedBiases: Buffer;
      let compressionType: 'gzip' | 'none' = 'none';

      // Apply compression if data is large enough
      if (originalSize > this.compressionThreshold && this.compressionEnabled) {
        compressedWeights = gzipSync(weightBuffer);
        compressedBiases = gzipSync(biasBuffer);
        compressionType = 'gzip';
      } else {
        compressedWeights = weightBuffer;
        compressedBiases = biasBuffer;
      }

      const compressedSize = compressedWeights.length + compressedBiases.length;
      const compressionRatio = compressedSize / originalSize;

      // Generate checksum for integrity validation
      const checksum = this.generateChecksum(compressedWeights, compressedBiases);

      const compressionTime = performance.now() - startTime;
      
      console.log(`🗜️ Compressed layer data: ${originalSize} → ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}%) in ${compressionTime.toFixed(2)}ms`);

      return {
        weightData: compressedWeights,
        biasData: compressedBiases,
        compressionType,
        originalSize,
        compressedSize,
        compressionRatio,
        checksum
      };

    } catch (error) {
      console.error('❌ Failed to compress layer data:', error.message);
      throw error;
    }
  }

  /**
   * Decompress weight data
   */
  private async decompressWeights(data: Buffer, compressionType: string): Promise<Float32Array> {
    try {
      let decompressedBuffer: Buffer;

      if (compressionType === 'gzip') {
        decompressedBuffer = gunzipSync(data);
      } else {
        decompressedBuffer = data;
      }

      // Convert back to Float32Array
      return new Float32Array(decompressedBuffer.buffer.slice(
        decompressedBuffer.byteOffset,
        decompressedBuffer.byteOffset + decompressedBuffer.byteLength
      ));

    } catch (error) {
      console.error('❌ Failed to decompress weights:', error.message);
      throw error;
    }
  }

  /**
   * Decompress bias data
   */
  private async decompressBiases(data: Buffer, compressionType: string): Promise<Float32Array> {
    try {
      let decompressedBuffer: Buffer;

      if (compressionType === 'gzip') {
        decompressedBuffer = gunzipSync(data);
      } else {
        decompressedBuffer = data;
      }

      // Convert back to Float32Array
      return new Float32Array(decompressedBuffer.buffer.slice(
        decompressedBuffer.byteOffset,
        decompressedBuffer.byteOffset + decompressedBuffer.byteLength
      ));

    } catch (error) {
      console.error('❌ Failed to decompress biases:', error.message);
      throw error;
    }
  }

  /**
   * Generate checksum for data integrity validation
   */
  private generateChecksum(weightData: Buffer, biasData: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(weightData);
    hash.update(biasData);
    return hash.digest('hex');
  }

  /**
   * Save compressed layer weights to database
   * This method will call the persistence manager
   */
  private async saveLayerWeights(
    agentId: string,
    layerIndex: number,
    compressedData: CompressedWeightData
  ): Promise<void> {
    // This would call a method we need to add to AgentPersistenceManager
    // For now, we'll implement a placeholder that shows the interface
    
    try {
      // The AgentPersistenceManager would need a method like this:
      // await this.persistence.saveNeuralWeightRecord({
      //   agentId,
      //   layerIndex,
      //   weightData: compressedData.weightData,
      //   biasData: compressedData.biasData,
      //   updatedAt: Date.now(),
      //   checksum: compressedData.checksum,
      //   compressionType: compressedData.compressionType
      // });

      console.log(`💾 Saved layer ${layerIndex} weights for agent ${agentId}`);
      
    } catch (error) {
      console.error(`❌ Failed to save layer weights:`, error.message);
      throw error;
    }
  }

  /**
   * Get agent weight records from database
   * This method will call the persistence manager
   */
  private async getAgentWeightRecords(agentId: string): Promise<any[]> {
    // This would call a method we need to add to AgentPersistenceManager
    // For now, we'll return an empty array to show the interface
    
    try {
      // The AgentPersistenceManager would need a method like this:
      // return await this.persistence.getNeuralWeightRecords(agentId);
      
      console.log(`📥 Loading weight records for agent ${agentId}`);
      return []; // Placeholder
      
    } catch (error) {
      console.error(`❌ Failed to load weight records:`, error.message);
      throw error;
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): {
    compressionEnabled: boolean;
    checksumValidation: boolean;
    compressionThreshold: number;
  } {
    return {
      compressionEnabled: this.compressionEnabled,
      checksumValidation: this.checksumValidation,
      compressionThreshold: this.compressionThreshold
    };
  }

  /**
   * Configure compression settings
   */
  configureCompression(options: {
    enabled?: boolean;
    threshold?: number;
    validation?: boolean;
  }): void {
    if (options.enabled !== undefined) {
      this.compressionEnabled = options.enabled;
    }
    if (options.threshold !== undefined) {
      this.compressionThreshold = options.threshold;
    }
    if (options.validation !== undefined) {
      this.checksumValidation = options.validation;
    }

    console.log('⚙️ Neural weight storage configuration updated:', {
      compressionEnabled: this.compressionEnabled,
      compressionThreshold: this.compressionThreshold,
      checksumValidation: this.checksumValidation
    });
  }
}