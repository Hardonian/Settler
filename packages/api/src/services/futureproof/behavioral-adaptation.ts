/**
 * Behavioral Adaptation
 * 
 * Agents that continuously adjust system defaults, routing, cost thresholds, etc.
 * Part 13: Long-Range Futureproofing
 */

import { logInfo } from '../../utils/logger';

export interface SystemDefaults {
  routingPreference: 'cost' | 'latency' | 'accuracy' | 'balanced';
  costThreshold: number;
  pipelineTemplateChoice: string;
  reconAccuracyHeuristic: number;
}

export interface AdaptationEvent {
  type: 'default_change' | 'routing_change' | 'cost_threshold_change' | 'template_change' | 'heuristic_change';
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: Date;
}

export class BehavioralAdaptation {
  private defaults: SystemDefaults;
  private adaptationHistory: AdaptationEvent[] = [];

  constructor() {
    this.defaults = {
      routingPreference: 'balanced',
      costThreshold: 100,
      pipelineTemplateChoice: 'default',
      reconAccuracyHeuristic: 0.9,
    };
  }

  /**
   * Get current defaults
   */
  getDefaults(): SystemDefaults {
    return { ...this.defaults };
  }

  /**
   * Adapt routing preference
   */
  adaptRoutingPreference(
    preference: 'cost' | 'latency' | 'accuracy' | 'balanced',
    reason: string
  ): void {
    const oldValue = this.defaults.routingPreference;
    this.defaults.routingPreference = preference;

    this.adaptationHistory.push({
      type: 'routing_change',
      oldValue,
      newValue: preference,
      reason,
      timestamp: new Date(),
    });

    logInfo('Routing preference adapted', { oldValue, newValue: preference, reason });
  }

  /**
   * Adapt cost threshold
   */
  adaptCostThreshold(threshold: number, reason: string): void {
    const oldValue = this.defaults.costThreshold;
    this.defaults.costThreshold = threshold;

    this.adaptationHistory.push({
      type: 'cost_threshold_change',
      oldValue,
      newValue: threshold,
      reason,
      timestamp: new Date(),
    });

    logInfo('Cost threshold adapted', { oldValue, newValue: threshold, reason });
  }

  /**
   * Adapt pipeline template choice
   */
  adaptPipelineTemplate(template: string, reason: string): void {
    const oldValue = this.defaults.pipelineTemplateChoice;
    this.defaults.pipelineTemplateChoice = template;

    this.adaptationHistory.push({
      type: 'template_change',
      oldValue,
      newValue: template,
      reason,
      timestamp: new Date(),
    });

    logInfo('Pipeline template adapted', { oldValue, newValue: template, reason });
  }

  /**
   * Adapt recon accuracy heuristic
   */
  adaptReconAccuracy(heuristic: number, reason: string): void {
    const oldValue = this.defaults.reconAccuracyHeuristic;
    this.defaults.reconAccuracyHeuristic = heuristic;

    this.adaptationHistory.push({
      type: 'heuristic_change',
      oldValue,
      newValue: heuristic,
      reason,
      timestamp: new Date(),
    });

    logInfo('Recon accuracy heuristic adapted', { oldValue, newValue: heuristic, reason });
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(): AdaptationEvent[] {
    return [...this.adaptationHistory];
  }

  /**
   * Auto-adapt based on usage patterns
   */
  async autoAdapt(usageData: {
    avgCost: number;
    avgLatency: number;
    avgAccuracy: number;
    popularTemplates: string[];
  }): Promise<void> {
    // Adapt cost threshold if costs are high
    if (usageData.avgCost > this.defaults.costThreshold * 1.5) {
      this.adaptCostThreshold(
        usageData.avgCost * 1.2,
        'Costs exceeding threshold - adjusting'
      );
    }

    // Adapt routing preference based on priorities
    if (usageData.avgLatency > 5000 && usageData.avgCost < this.defaults.costThreshold) {
      this.adaptRoutingPreference('latency', 'High latency detected - prioritizing speed');
    } else if (usageData.avgCost > this.defaults.costThreshold) {
      this.adaptRoutingPreference('cost', 'High costs detected - prioritizing cost');
    }

    // Adapt template choice to most popular
    const mostPopular = usageData.popularTemplates[0];
    if (mostPopular && mostPopular !== this.defaults.pipelineTemplateChoice) {
      this.adaptPipelineTemplate(
        mostPopular,
        'Most popular template - switching default'
      );
    }

    // Adapt accuracy heuristic
    if (usageData.avgAccuracy < this.defaults.reconAccuracyHeuristic) {
      this.adaptReconAccuracy(
        usageData.avgAccuracy * 0.95,
        'Accuracy below target - adjusting heuristic'
      );
    }
  }
}
