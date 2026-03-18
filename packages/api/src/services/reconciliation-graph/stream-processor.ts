/**
 * Stream Processor for Continuous Reconciliation Graph
 *
 * Processes transaction events in real-time and updates the graph.
 */

import { ReconciliationNode } from "./types";
import { graphEngine, MatchingRule } from "./graph-engine";
import { EventEmitter } from "events";
import { logError, logInfo } from "../../utils/logger";
import { getMatchingRulesForJob } from "../matching-rules-loader";

export interface TransactionEvent {
  id: string;
  jobId: string;
  tenantId?: string; // Added for matching rules lookup
  type: "source" | "target";
  sourceId?: string;
  targetId?: string;
  data: Record<string, unknown>;
  amount?: number;
  currency?: string;
  timestamp: Date;
}

export class StreamProcessor extends EventEmitter {
  private processingQueue: TransactionEvent[] = [];
  private isProcessing = false;
  private batchSize = 100;
  private processingInterval = 100; // ms

  constructor() {
    super();
    this.startProcessing();
  }

  /**
   * Add transaction event to processing queue
   */
  async addEvent(event: TransactionEvent): Promise<void> {
    this.processingQueue.push(event);
    this.emit("event_added", event);
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processBatch();
      }
    }, this.processingInterval);
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.batchSize);

    try {
      for (const event of batch) {
        await this.processEvent(event);
      }
    } catch (error) {
      logError("Error processing batch", error);
      this.emit("processing_error", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: TransactionEvent): Promise<void> {
    // Create node from event
    const node: ReconciliationNode = {
      id: event.id,
      type: "transaction",
      jobId: event.jobId,
      ...(event.sourceId !== undefined && { sourceId: event.sourceId }),
      ...(event.targetId !== undefined && { targetId: event.targetId }),
      data: event.data,
      ...(event.amount !== undefined && { amount: event.amount }),
      ...(event.currency !== undefined && { currency: event.currency }),
      timestamp: event.timestamp,
      metadata: {
        processedAt: new Date(),
      },
    };

    // Add node to graph
    graphEngine.addNode(event.jobId, node);

    // Try to find matches (if we have matching rules)
    // Load rules from config with tenant context
    const matchingRules = await this.getMatchingRules(event.jobId, event.tenantId ?? "default");

    if (matchingRules.length > 0) {
      const matches = graphEngine.findMatches(event.jobId, node.id, matchingRules);

      for (const match of matches) {
        graphEngine.addEdge(event.jobId, match);

        // Update node confidence
        const sourceNode = graphEngine.getGraphState(event.jobId)?.nodes.get(match.source);
        const targetNode = graphEngine.getGraphState(event.jobId)?.nodes.get(match.target);

        if (sourceNode && targetNode) {
          sourceNode.confidence = match.confidence;
          targetNode.confidence = match.confidence;
          sourceNode.type = "match";
          targetNode.type = "match";
        }
      }
    }

    this.emit("event_processed", event);
  }

  /**
   * Get matching rules for a job
   * Loads from template or uses defaults
   */
  private async getMatchingRules(
    jobId: string,
    tenantId: string = "default"
  ): Promise<MatchingRule[]> {
    try {
      // Load from the matching rules loader service
      const config = await getMatchingRulesForJob(tenantId, jobId);

      logInfo("Stream processor loaded matching rules", {
        jobId,
        ruleCount: config.matchingRules.length,
        amountTolerance: config.amountTolerance,
        configSource: config.configSource,
      });

      // Map to the format expected by graph engine
      return config.matchingRules.map((rule) => ({
        field: rule.field,
        type: rule.type === "date_range" ? "range" : rule.type,
        tolerance: rule.tolerance,
        weight: rule.weight ?? 1,
        version: 1,
      }));
    } catch (error) {
      logError("Failed to load matching rules, using defaults", error, { jobId });
      // Return defaults on error
      return [
        {
          field: "amount",
          type: "range",
          tolerance: 0.01,
          weight: 1,
        },
        {
          field: "referenceId",
          type: "exact",
          weight: 2,
        },
      ];
    }
  }

  /**
   * Get processing stats
   */
  getStats(): {
    queueLength: number;
    isProcessing: boolean;
    batchSize: number;
  } {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
    };
  }
}

export const streamProcessor = new StreamProcessor();
