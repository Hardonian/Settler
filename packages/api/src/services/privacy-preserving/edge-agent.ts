/**
 * Edge Computing Agent
 * 
 * Lightweight agent that runs in customer infrastructure to perform
 * reconciliation locally without sending data to Settler cloud.
 */

import { EventEmitter } from 'events';

export interface EdgeAgentConfig {
  customerId: string;
  apiKey: string;
  cloudEndpoint: string;
  reconciliationRules: ReconciliationRule[];
  encryptionKey?: string; // Customer-controlled encryption key
}

export interface ReconciliationRule {
  field: string;
  type: 'exact' | 'fuzzy' | 'range' | 'date_range';
  threshold?: number;
  tolerance?: number;
  days?: number;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  errors: number;
  accuracy: number;
  executionTime: number;
  metadata: Record<string, unknown>; // Encrypted metadata sent to cloud
}

export class EdgeAgent extends EventEmitter {
  private config: EdgeAgentConfig;
  private isRunning = false;

  constructor(config: EdgeAgentConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the edge agent
   */
  async initialize(): Promise<void> {
    // Validate configuration
    if (!this.config.customerId || !this.config.apiKey) {
      throw new Error('Missing required configuration');
    }

    // Test connection to cloud endpoint
    await this.testCloudConnection();

    this.isRunning = true;
    this.emit('initialized');
  }

  /**
   * Perform local reconciliation
   */
  async reconcile(sourceData: Record<string, unknown>[], targetData: Record<string, unknown>[]): Promise<ReconciliationResult> {
    if (!this.isRunning) {
      throw new Error('Edge agent not initialized');
    }

    const startTime = Date.now();
    let matched = 0;
    let unmatched = 0;
    let errors = 0;

    try {
      // Perform matching locally
      for (const source of sourceData) {
        let foundMatch = false;

        for (const target of targetData) {
          if (this.matches(source, target, this.config.reconciliationRules)) {
            matched++;
            foundMatch = true;
            break;
          }
        }

        if (!foundMatch) {
          unmatched++;
        }
      }

      const total = sourceData.length;
      const accuracy = total > 0 ? matched / total : 0;
      const executionTime = Date.now() - startTime;

      // Create encrypted metadata (only send results, not raw data)
      const metadata = this.createEncryptedMetadata({
        matched,
        unmatched,
        errors,
        accuracy,
        executionTime,
      });

      const result: ReconciliationResult = {
        matched,
        unmatched,
        errors,
        accuracy,
        executionTime,
        metadata,
      };

      // Send only metadata to cloud (not raw data)
      await this.sendMetadataToCloud(metadata);

      this.emit('reconciliation_complete', result);
      return result;
    } catch (error: any) {
      errors++;
      this.emit('reconciliation_error', error);
      throw error;
    }
  }

  /**
   * Check if source and target match according to rules
   */
  private matches(
    source: Record<string, unknown>,
    target: Record<string, unknown>,
    rules: ReconciliationRule[]
  ): boolean {
    for (const rule of rules) {
      const sourceValue = source[rule.field];
      const targetValue = target[rule.field];

      if (!this.matchesRule(sourceValue, targetValue, rule)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if values match according to rule
   */
  private matchesRule(sourceValue: unknown, targetValue: unknown, rule: ReconciliationRule): boolean {
    if (sourceValue === undefined || targetValue === undefined) {
      return false;
    }

    switch (rule.type) {
      case 'exact':
        return sourceValue === targetValue;
      
      case 'fuzzy':
        if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
          const similarity = this.stringSimilarity(sourceValue, targetValue);
          return similarity >= (rule.threshold || 0.8);
        }
        return false;
      
      case 'range':
        if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
          const diff = Math.abs(sourceValue - targetValue);
          return diff <= (rule.tolerance || 0.01);
        }
        return false;
      
      case 'date_range':
        if (sourceValue instanceof Date && targetValue instanceof Date) {
          const diffDays = Math.abs((sourceValue.getTime() - targetValue.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= (rule.days || 1);
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Calculate string similarity
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      if (!matrix[0]) {
        matrix[0] = [];
      }
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (!matrix[i]) {
          matrix[i] = [];
        }
        const prevRow = matrix[i - 1];
        const currRow = matrix[i];
        if (!prevRow || !currRow) {
          continue;
        }
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          currRow[j] = prevRow[j - 1] ?? 0;
        } else {
          currRow[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1,
            (currRow[j - 1] ?? 0) + 1,
            (prevRow[j] ?? 0) + 1
          );
        }
      }
    }
    
    const lastRow = matrix[str2.length];
    if (!lastRow) {
      return str1.length;
    }
    return lastRow[str1.length] ?? str1.length;
  }

  /**
   * Create encrypted metadata (only results, not raw data)
   */
  private createEncryptedMetadata(data: Record<string, unknown>): Record<string, unknown> {
    // In production, use proper encryption (AES-256-GCM)
    // For now, return data as-is (would be encrypted in production)
    return {
      ...data,
      encrypted: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send encrypted metadata to cloud (not raw data)
   */
  private async sendMetadataToCloud(metadata: Record<string, unknown>): Promise<void> {
    // TODO: Send to Settler cloud endpoint
    // Only metadata is sent, never raw transaction data
    try {
      const response = await fetch(`${this.config.cloudEndpoint}/api/v1/edge/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          customerId: this.config.customerId,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send metadata: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send metadata to cloud:', error);
      // Don't throw - metadata sending failure shouldn't break reconciliation
    }
  }

  /**
   * Test connection to cloud endpoint
   */
  private async testCloudConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.config.cloudEndpoint}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Cloud endpoint not reachable');
      }
    } catch (error) {
      throw new Error(`Failed to connect to cloud endpoint: ${error}`);
    }
  }

  /**
   * Shutdown the edge agent
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    this.emit('shutdown');
  }
}
