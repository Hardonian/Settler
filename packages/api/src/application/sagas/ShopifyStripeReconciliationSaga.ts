/**
 * Shopify-Stripe Monthly Reconciliation Saga
 * Concrete saga implementation for monthly reconciliation between Shopify and Stripe
 */

import { SagaDefinition, SagaStep, SagaStepResult, SagaState } from "./SagaOrchestrator";
import { ShopifyAdapter } from "@settler/adapters";
import { StripeAdapter } from "@settler/adapters";
import { IEventStore } from "../../infrastructure/eventsourcing/EventStore";
import { ReconciliationEvents } from "../../domain/eventsourcing/reconciliation/ReconciliationEvents";
import { createCircuitBreaker } from "../../infrastructure/resilience/circuit-breaker";
import type { CircuitBreaker } from "opossum";
import { logError } from "../../utils/logger";

export class ShopifyStripeReconciliationSaga {
  private shopifyCircuitBreaker: CircuitBreaker<any>;

  private stripeCircuitBreaker: CircuitBreaker<any>;

  constructor(
    private eventStore: IEventStore,
    private shopifyAdapter: ShopifyAdapter,
    private stripeAdapter: StripeAdapter
  ) {
    // Initialize circuit breakers
    this.shopifyCircuitBreaker = createCircuitBreaker(
      async (options: any) => this.shopifyAdapter.fetch(options),
      { name: "shopify-api" }
    );
    this.stripeCircuitBreaker = createCircuitBreaker(
      async (options: any) => this.stripeAdapter.fetch(options),
      { name: "stripe-api" }
    );
  }

  /**
   * Create saga definition
   */
  createDefinition(): SagaDefinition {
    return {
      type: "shopify_stripe_monthly_reconciliation",
      steps: [
        this.createFetchShopifyOrdersStep(),
        this.createFetchStripePaymentsStep(),
        this.createMatchingStep(),
        this.createPersistResultsStep(),
        this.createNotifyWebhooksStep(),
      ],
      onComplete: this.handleSagaComplete.bind(this),
      onFailure: this.handleSagaFailure.bind(this),
    };
  }

  /**
   * Step 1: Fetch orders from Shopify
   */
  private createFetchShopifyOrdersStep(): SagaStep {
    return {
      name: "fetch_shopify_orders",
      timeoutMs: 60000, // 1 minute timeout
      retryable: true,
      maxRetries: 3,
      execute: async (state: SagaState): Promise<SagaStepResult> => {
        try {
          const reconciliationId = state.aggregateId;
          const dateRange = state.data.date_range as { start: string; end: string };
          const shopifyConfig = state.data.shopify_config as Record<string, unknown>;

          // Use circuit breaker for external API call
          const orders = await this.shopifyCircuitBreaker.fire({
            dateRange: {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            },
            config: shopifyConfig,
          });

          // Emit OrdersFetched event
          const event = ReconciliationEvents.OrdersFetched(
            reconciliationId,
            {
              reconciliation_id: reconciliationId,
              source: "shopify",
              count: orders.length,
              orders: orders.map(
                (order: {
                  id: string;
                  amount: number;
                  currency: string;
                  date: Date;
                  metadata?: Record<string, unknown>;
                }) => ({
                  id: order.id,
                  amount: order.amount,
                  currency: order.currency,
                  date: order.date.toISOString(),
                  metadata: order.metadata,
                })
              ),
              fetch_duration_ms: Date.now() - (state.data.started_at as number),
            },
            state.tenantId,
            state.correlationId
          );

          await this.eventStore.append(event);

          // Store orders in saga state
          state.data.shopify_orders = orders;

          return {
            success: true,
            data: {
              shopify_orders_count: orders.length,
            },
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "FetchError";
          return {
            success: false,
            error: {
              type: errorName,
              message: errorMessage,
              retryable: true,
            },
          };
        }
      },
      compensate: async (state: SagaState): Promise<void> => {
        // No compensation needed for read-only fetch
        logError(`Compensating fetch_shopify_orders for ${state.aggregateId}`, undefined, {
          aggregateId: state.aggregateId,
        });
      },
    };
  }

  /**
   * Step 2: Fetch payments from Stripe
   */
  private createFetchStripePaymentsStep(): SagaStep {
    return {
      name: "fetch_stripe_payments",
      timeoutMs: 60000,
      retryable: true,
      maxRetries: 3,
      execute: async (state: SagaState): Promise<SagaStepResult> => {
        try {
          const reconciliationId = state.aggregateId;
          const dateRange = state.data.date_range as { start: string; end: string };
          const stripeConfig = state.data.stripe_config as Record<string, unknown>;

          const payments = await this.stripeCircuitBreaker.fire({
            dateRange: {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            },
            config: stripeConfig,
          });

          // Emit PaymentsFetched event
          const event = ReconciliationEvents.PaymentsFetched(
            reconciliationId,
            {
              reconciliation_id: reconciliationId,
              source: "stripe",
              count: payments.length,
              payments: payments.map(
                (payment: {
                  id: string;
                  amount: number;
                  currency: string;
                  date: Date;
                  metadata?: Record<string, unknown>;
                }) => ({
                  id: payment.id,
                  amount: payment.amount,
                  currency: payment.currency,
                  date: payment.date.toISOString(),
                  metadata: payment.metadata,
                })
              ),
              fetch_duration_ms: Date.now() - (state.data.started_at as number),
            },
            state.tenantId,
            state.correlationId
          );

          await this.eventStore.append(event);

          state.data.stripe_payments = payments;

          return {
            success: true,
            data: {
              stripe_payments_count: payments.length,
            },
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "FetchError";
          return {
            success: false,
            error: {
              type: errorName,
              message: errorMessage,
              retryable: true,
            },
          };
        }
      },
      compensate: async (state: SagaState): Promise<void> => {
        // No compensation needed
        logError(`Compensating fetch_stripe_payments for ${state.aggregateId}`, undefined, {
          aggregateId: state.aggregateId,
        });
      },
    };
  }

  /**
   * Step 3: Perform matching
   */
  private createMatchingStep(): SagaStep {
    return {
      name: "perform_matching",
      timeoutMs: 300000, // 5 minutes for large datasets
      retryable: false, // Matching is idempotent but expensive
      execute: async (state: SagaState): Promise<SagaStepResult> => {
        try {
          const reconciliationId = state.aggregateId;
          interface Order {
            id: string;
            amount: number;
            currency: string;
            date: Date | string;
            metadata?: Record<string, unknown>;
          }
          interface Payment {
            id: string;
            amount: number;
            currency: string;
            date: Date | string;
            metadata?: Record<string, unknown>;
            referenceId?: string;
          }
          interface Match {
            source_id: string;
            target_id: string;
            amount: number;
            currency: string;
            confidence: number;
            matched_fields: string[];
          }
          interface Unmatched {
            source_id?: string;
            target_id?: string;
            amount: number;
            currency: string;
            reason: string;
          }
          const orders = state.data.shopify_orders as Order[];
          const payments = state.data.stripe_payments as Payment[];
          // Matching rules reserved for future use
          const _matchingRules = state.data.matching_rules as Record<string, unknown>;
          void _matchingRules;

          const matched: Match[] = [];
          const unmatched: Unmatched[] = [];

          // Simple matching logic (in production, use more sophisticated algorithm)
          for (const order of orders) {
            const match = payments.find((payment) => {
              // Match by amount and date proximity
              const amountMatch = Math.abs(order.amount - payment.amount) < 0.01;
              const dateDiff = Math.abs(
                new Date(order.date).getTime() - new Date(payment.date).getTime()
              );
              const dateMatch = dateDiff < 24 * 60 * 60 * 1000; // Within 24 hours

              // Also check metadata for order_id match
              const metadataMatch =
                payment.metadata?.order_id === order.id || payment.referenceId === order.id;

              return amountMatch && (dateMatch || metadataMatch);
            });

            if (match) {
              matched.push({
                source_id: order.id,
                target_id: match.id,
                amount: order.amount,
                currency: order.currency,
                confidence: 1.0,
                matched_fields: ["amount", "date", "metadata"],
              });

              // Emit RecordMatched event
              const matchEvent = ReconciliationEvents.RecordMatched(
                reconciliationId,
                {
                  reconciliation_id: reconciliationId,
                  match_id: crypto.randomUUID(),
                  source_id: order.id,
                  target_id: match.id,
                  amount: order.amount,
                  currency: order.currency,
                  confidence: 1.0,
                  matched_fields: ["amount", "date", "metadata"],
                  matched_at: new Date().toISOString(),
                },
                state.tenantId,
                state.correlationId
              );

              await this.eventStore.append(matchEvent);
            } else {
              unmatched.push({
                source_id: order.id,
                amount: order.amount,
                currency: order.currency,
                reason: "No matching payment found",
              });

              // Emit RecordUnmatched event
              const unmatchedEvent = ReconciliationEvents.RecordUnmatched(
                reconciliationId,
                {
                  reconciliation_id: reconciliationId,
                  source_id: order.id,
                  amount: order.amount,
                  currency: order.currency,
                  reason: "No matching payment found",
                  unmatched_at: new Date().toISOString(),
                },
                state.tenantId,
                state.correlationId
              );

              await this.eventStore.append(unmatchedEvent);
            }
          }

          // Check for unmatched payments
          const matchedPaymentIds = new Set(matched.map((m) => m.target_id));
          for (const payment of payments) {
            if (!matchedPaymentIds.has(payment.id)) {
              unmatched.push({
                target_id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                reason: "No matching order found",
              });

              const unmatchedEvent = ReconciliationEvents.RecordUnmatched(
                reconciliationId,
                {
                  reconciliation_id: reconciliationId,
                  target_id: payment.id,
                  amount: payment.amount,
                  currency: payment.currency,
                  reason: "No matching order found",
                  unmatched_at: new Date().toISOString(),
                },
                state.tenantId,
                state.correlationId
              );

              await this.eventStore.append(unmatchedEvent);
            }
          }

          state.data.matched = matched;
          state.data.unmatched = unmatched;

          return {
            success: true,
            data: {
              matched_count: matched.length,
              unmatched_count: unmatched.length,
            },
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "MatchingError";
          return {
            success: false,
            error: {
              type: errorName,
              message: errorMessage,
              retryable: false,
            },
          };
        }
      },
    };
  }

  /**
   * Step 4: Persist results
   */
  private createPersistResultsStep(): SagaStep {
    return {
      name: "persist_results",
      timeoutMs: 30000,
      retryable: true,
      maxRetries: 3,
      execute: async (_state: SagaState): Promise<SagaStepResult> => {
        try {
          // In production, persist to database
          // For now, results are already persisted via events
          // This step could write to a read model or trigger report generation

          return {
            success: true,
            data: {
              persisted: true,
            },
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "PersistenceError";
          return {
            success: false,
            error: {
              type: errorName,
              message: errorMessage,
              retryable: true,
            },
          };
        }
      },
      compensate: async (state: SagaState): Promise<void> => {
        // Could delete persisted results if needed
        logError(`Compensating persist_results for ${state.aggregateId}`, undefined, {
          aggregateId: state.aggregateId,
        });
      },
    };
  }

  /**
   * Step 5: Notify via webhooks
   */
  private createNotifyWebhooksStep(): SagaStep {
    return {
      name: "notify_webhooks",
      timeoutMs: 30000,
      retryable: true,
      maxRetries: 3,
      execute: async (state: SagaState): Promise<SagaStepResult> => {
        try {
          // In production, send webhooks to configured endpoints
          // For now, just log
          logError(`Sending webhook notifications for ${state.aggregateId}`, undefined, {
            aggregateId: state.aggregateId,
          });

          return {
            success: true,
            data: {
              webhooks_sent: true,
            },
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "WebhookError";
          return {
            success: false,
            error: {
              type: errorName,
              message: errorMessage,
              retryable: true,
            },
          };
        }
      },
      compensate: async (state: SagaState): Promise<void> => {
        // Webhooks are typically fire-and-forget, no compensation needed
        logError(`Compensating notify_webhooks for ${state.aggregateId}`, undefined, {
          aggregateId: state.aggregateId,
        });
      },
    };
  }

  /**
   * Handle saga completion
   */
  private async handleSagaComplete(state: SagaState): Promise<void> {
    const reconciliationId = state.aggregateId;
    interface Match {
      source_id: string;
      target_id: string;
      amount: number;
      currency: string;
      confidence: number;
      matched_fields: string[];
    }
    interface Unmatched {
      source_id?: string;
      target_id?: string;
      amount: number;
      currency: string;
      reason: string;
    }
    interface Order {
      id: string;
      amount: number;
      currency: string;
      date: Date | string;
    }
    interface Payment {
      id: string;
      amount: number;
      currency: string;
      date: Date | string;
    }
    const matched = state.data.matched as Match[];
    const unmatched = state.data.unmatched as Unmatched[];
    const orders = state.data.shopify_orders as Order[];
    const payments = state.data.stripe_payments as Payment[];

    const unmatchedSource = unmatched.filter((u) => u.source_id).length;
    const unmatchedTarget = unmatched.filter((u) => u.target_id).length;

    const totalRecords = orders.length + payments.length;
    const accuracy = totalRecords > 0 ? (matched.length / totalRecords) * 100 : 100;

    const completedEvent = ReconciliationEvents.ReconciliationCompleted(
      reconciliationId,
      {
        reconciliation_id: reconciliationId,
        summary: {
          total_source_records: orders.length,
          total_target_records: payments.length,
          matched_count: matched.length,
          unmatched_source_count: unmatchedSource,
          unmatched_target_count: unmatchedTarget,
          errors_count: 0,
          duration_ms: Date.now() - (state.data.started_at as number),
          accuracy_percentage: accuracy,
        },
        completed_at: new Date().toISOString(),
        finalization: {
          finalized_at: new Date().toISOString(),
          finalization_source: "saga",
        },
      },
      state.tenantId,
      state.correlationId
    );

    await this.eventStore.append(completedEvent);
  }

  /**
   * Handle saga failure
   */
  private async handleSagaFailure(state: SagaState, error: Error): Promise<void> {
    const reconciliationId = state.aggregateId;

    const failedEvent = ReconciliationEvents.ReconciliationFailed(
      reconciliationId,
      {
        reconciliation_id: reconciliationId,
        error: {
          type: error.name || "UnknownError",
          message: error.message,
          ...(error.stack ? { stack: error.stack } : {}),
        },
        failed_at: new Date().toISOString(),
        step: state.currentStep,
        retryable: true,
      },
      state.tenantId,
      state.correlationId
    );

    await this.eventStore.append(failedEvent);
  }
}
