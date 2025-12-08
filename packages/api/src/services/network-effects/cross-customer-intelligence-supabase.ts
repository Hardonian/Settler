/**
 * Cross-Customer Intelligence - Supabase Integration
 * 
 * Persists anonymized patterns to Supabase PostgreSQL
 */

import { AnonymizedPattern, PatternMatch } from './cross-customer-intelligence';
import { supabase } from '../../infrastructure/supabase/client';
import { EventEmitter } from 'events';

export class CrossCustomerIntelligenceSupabase extends EventEmitter {
  /**
   * Submit a pattern from a customer (anonymized)
   */
  async submitPattern(
    customerId: string,
    pattern: {
      type: AnonymizedPattern['patternType'];
      data: Record<string, unknown>;
    }
  ): Promise<string> {
    // Create anonymized pattern hash
    const patternHash = this.hashPattern(pattern.data);

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from('network_patterns')
      .select('*')
      .eq('pattern_hash', patternHash)
      .eq('pattern_type', pattern.type)
      .single();

    let patternId: string;

    if (existingPattern) {
      // Update existing pattern
      const { data, error } = await supabase
        .from('network_patterns')
        .update({
          frequency: existingPattern.frequency + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existingPattern.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update pattern: ${error.message}`);
      }

      patternId = data.id;
    } else {
      // Create new pattern
      const { data, error } = await supabase
        .from('network_patterns')
        .insert({
          pattern_hash: patternHash,
          pattern_type: pattern.type,
          frequency: 1,
          metadata: this.anonymizeMetadata(pattern.data),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create pattern: ${error.message}`);
      }

      patternId = data.id;
    }

    // Track customer's patterns
    await supabase
      .from('customer_patterns')
      .upsert({
        customer_id: customerId,
        pattern_id: patternId,
        opted_in_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,pattern_id',
      });

    this.emit('pattern_submitted', { customerId, patternId });
    return patternId;
  }

  /**
   * Check if a pattern matches known patterns
   */
  async checkPattern(pattern: {
    type: AnonymizedPattern['patternType'];
    data: Record<string, unknown>;
  }): Promise<PatternMatch | null> {
    const patternHash = this.hashPattern(pattern.data);

    const { data: matchingPattern } = await supabase
      .from('network_patterns')
      .select('*')
      .eq('pattern_hash', patternHash)
      .eq('pattern_type', pattern.type)
      .single();

    if (!matchingPattern) {
      return null;
    }

    const confidence = Math.min(100, matchingPattern.frequency * 10);

    return {
      patternId: matchingPattern.id,
      confidence,
      matchReason: `This pattern has been seen ${matchingPattern.frequency} times across the network`,
      recommendedAction: this.getRecommendedAction(matchingPattern.pattern_type),
    };
  }

  /**
   * Get network insights (anonymized)
   */
  async getNetworkInsights(): Promise<{
    totalPatterns: number;
    fraudPatterns: number;
    anomalyPatterns: number;
    topPatterns: Array<{
      id: string;
      type: string;
      frequency: number;
    }>;
  }> {
    const { data: allPatterns } = await supabase
      .from('network_patterns')
      .select('id, pattern_type, frequency')
      .order('frequency', { ascending: false })
      .limit(10);

    const patterns = allPatterns || [];

    return {
      totalPatterns: patterns.length,
      fraudPatterns: patterns.filter(p => p.pattern_type === 'fraud').length,
      anomalyPatterns: patterns.filter(p => p.pattern_type === 'anomaly').length,
      topPatterns: patterns.map(p => ({
        id: p.id,
        type: p.pattern_type,
        frequency: p.frequency,
      })),
    };
  }

  /**
   * Opt-in a customer
   */
  async optIn(customerId: string): Promise<void> {
    // Customer opt-in is tracked via customer_patterns table
    // No separate opt-in table needed
    this.emit('customer_opted_in', customerId);
  }

  /**
   * Opt-out a customer
   */
  async optOut(customerId: string): Promise<void> {
    // Remove customer's pattern associations
    await supabase
      .from('customer_patterns')
      .delete()
      .eq('customer_id', customerId);

    // Decrement pattern frequencies
    const { data: customerPatterns } = await supabase
      .from('customer_patterns')
      .select('pattern_id')
      .eq('customer_id', customerId);

    if (customerPatterns) {
      for (const cp of customerPatterns) {
        await supabase.rpc('decrement_pattern_frequency', {
          pattern_id: cp.pattern_id,
        });
      }
    }

    this.emit('customer_opted_out', customerId);
  }

  /**
   * Hash pattern for anonymization
   */
  private hashPattern(data: Record<string, unknown>): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Anonymize metadata
   */
  private anonymizeMetadata(data: Record<string, unknown>): Record<string, unknown> {
    const anonymized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (['email', 'name', 'address', 'phone', 'ssn'].includes(key.toLowerCase())) {
        continue;
      }

      if (typeof value === 'number') {
        const noise = (Math.random() - 0.5) * 0.1;
        anonymized[key] = value * (1 + noise);
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  /**
   * Get recommended action
   */
  private getRecommendedAction(patternType: string): string {
    switch (patternType) {
      case 'fraud':
        return 'Review transaction for potential fraud. This pattern has been associated with fraudulent activity.';
      case 'anomaly':
        return 'Investigate anomaly. This pattern is unusual and may indicate a data quality issue.';
      case 'performance':
        return 'Optimize performance. This pattern suggests a performance bottleneck.';
      case 'error':
        return 'Review error. This pattern has been associated with errors in other customers.';
      default:
        return 'Review pattern. This pattern has been seen across multiple customers.';
    }
  }
}
