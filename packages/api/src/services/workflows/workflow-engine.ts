/**
 * Workflow Engine
 *
 * Orchestrates complex data operations workflows
 * Part of Phase V: AIOS (Open Source Reconciliation Engine)
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { logInfo, logError, logWarn } from "../../utils/logger";

export type WorkflowStepType =
  | "ingestion"
  | "transform"
  | "validate"
  | "map"
  | "recon"
  | "drift_detection"
  | "audit"
  | "webhook"
  | "conditional"
  | "loop"
  | "timer";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, unknown>;
  onSuccess?: string;
  onFailure?: string;
  retry?: {
    maxAttempts: number;
    backoff: "linear" | "exponential";
  };
}

export interface WorkflowTrigger {
  type: "schedule" | "event" | "manual";
  config: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

interface StepResult {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
}

export class WorkflowEngine {
  private prisma: PrismaClient;
  private stepHandlers: Map<WorkflowStepType, (step: WorkflowStep, context: Record<string, unknown>) => Promise<Record<string, unknown>>>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stepHandlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Register default step handlers
   */
  private registerDefaultHandlers(): void {
    this.stepHandlers.set("ingestion", this.handleIngestion.bind(this));
    this.stepHandlers.set("transform", this.handleTransform.bind(this));
    this.stepHandlers.set("validate", this.handleValidate.bind(this));
    this.stepHandlers.set("map", this.handleMap.bind(this));
    this.stepHandlers.set("recon", this.handleRecon.bind(this));
    this.stepHandlers.set("drift_detection", this.handleDriftDetection.bind(this));
    this.stepHandlers.set("audit", this.handleAudit.bind(this));
    this.stepHandlers.set("webhook", this.handleWebhook.bind(this));
    this.stepHandlers.set("conditional", this.handleConditional.bind(this));
    this.stepHandlers.set("loop", this.handleLoop.bind(this));
    this.stepHandlers.set("timer", this.handleTimer.bind(this));
  }

  /**
   * Load workflow definition from database
   */
  private async loadWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    const workflow = await (this.prisma as any).workflowDefinitions.findUnique({
      where: { id: workflowId },
    });
    
    if (!workflow) {
      logWarn(`Workflow definition not found: ${workflowId}`);
      return null;
    }

    return {
      id: workflow.id,
      name: workflow.name,
      version: workflow.version,
      steps: workflow.steps as WorkflowStep[],
      triggers: workflow.triggers as WorkflowTrigger[],
    };
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    tenantId: string,
    workflowId: string,
    input?: Record<string, unknown>
  ): Promise<{
    workflowRunId: string;
    status: "running" | "completed" | "failed";
    results: Record<string, unknown>;
  }> {
    // Load workflow definition
    const definition = await this.loadWorkflowDefinition(workflowId);
    if (!definition) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Create workflow run
    const workflowRun = await (this.prisma as any).workflowRuns.create({
      data: {
        tenantId,
        workflowId,
        workflowName: definition.name,
        status: "running",
        triggeredBy: "api",
        triggerEvent: (input || {}) as Prisma.InputJsonValue,
        executionGraph: { steps: definition.steps.map(s => s.id) },
        stepResults: {},
      },
    });

    const stepResults: Record<string, StepResult> = {};
    const context: Record<string, unknown> = { ...input, tenantId, workflowRunId: workflowRun.id };

    try {
      // Execute steps in order
      const startStep = definition.steps[0];
      if (!startStep) {
        throw new Error("Workflow has no steps");
      }

      let currentStepId: string | undefined = startStep.id;
      const executedSteps = new Set<string>();

      while (currentStepId) {
        // Prevent infinite loops
        if (executedSteps.has(currentStepId)) {
          logWarn(`Loop detected in workflow ${workflowId}, stopping execution`);
          break;
        }
        executedSteps.add(currentStepId);

        const step = definition.steps.find(s => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
        }

        // Execute step with retry logic
        const result = await this.executeStep(step, context, workflowRun.id, stepResults);
        stepResults[step.id] = result;

        // Update step results in database
        await this.prisma.workflowRun.update({
          where: { id: workflowRun.id },
          data: {
            stepResults: stepResults as Prisma.InputJsonValue,
          },
        });

        // Determine next step
        if (result.status === "completed") {
          currentStepId = step.onSuccess;
        } else if (result.status === "failed") {
          currentStepId = step.onFailure;
        } else {
          break;
        }
      }

      // Check overall status
      const hasFailures = Object.values(stepResults).some(r => r.status === "failed");
      const finalStatus = hasFailures ? "failed" : "completed";

      await this.prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          durationMs: BigInt(Date.now() - workflowRun.startedAt.getTime()),
        },
      });

      return {
        workflowRunId: workflowRun.id,
        status: finalStatus,
        results: stepResults,
      };
    } catch (error) {
      await this.prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep(
    step: WorkflowStep,
    context: Record<string, unknown>,
    workflowRunId: string,
    stepResults: Record<string, StepResult>
  ): Promise<StepResult> {
    const maxAttempts = step.retry?.maxAttempts || 1;
    const backoff = step.retry?.backoff || "linear";
    
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result: StepResult = {
        stepId: step.id,
        status: "running",
        startedAt: new Date(),
        attempts: attempt,
      };

      try {
        const handler = this.stepHandlers.get(step.type);
        if (!handler) {
          throw new Error(`No handler for step type: ${step.type}`);
        }

        const output = await handler(step, context);
        
        return {
          ...result,
          status: "completed",
          output,
          completedAt: new Date(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxAttempts) {
          // Calculate backoff delay
          const delay = backoff === "exponential" 
            ? Math.pow(2, attempt - 1) * 1000 
            : attempt * 1000;
          
          logWarn(`Step ${step.id} failed (attempt ${attempt}), retrying in ${delay}ms`, { error: lastError.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      stepId: step.id,
      status: "failed",
      error: lastError?.message || "Unknown error",
      completedAt: new Date(),
      attempts: maxAttempts,
    };
  }

  // Step Handlers

  private async handleIngestion(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing ingestion step", { stepId: step.id, config: step.config });
    return { status: "ingested", timestamp: new Date().toISOString() };
  }

  private async handleTransform(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing transform step", { stepId: step.id });
    return { status: "transformed" };
  }

  private async handleValidate(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing validate step", { stepId: step.id });
    return { status: "validated", valid: true };
  }

  private async handleMap(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing map step", { stepId: step.id });
    return { status: "mapped" };
  }

  private async handleRecon(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing recon step", { stepId: step.id });
    return { status: "reconciled" };
  }

  private async handleDriftDetection(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing drift detection step", { stepId: step.id });
    return { status: "drift_checked", driftDetected: false };
  }

  private async handleAudit(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    logInfo("Executing audit step", { stepId: step.id });
    return { status: "audited" };
  }

  private async handleWebhook(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { url, method = "POST", headers = {}, body } = step.config;
    
    if (!url || typeof url !== "string") {
      throw new Error("Webhook URL required");
    }

    const response = await fetch(url, {
      method: method as string,
      headers: headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    return { status: "webhook_sent", statusCode: response.status };
  }

  private async handleConditional(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { condition } = step.config;
    
    // Simple condition evaluation (could be expanded)
    const conditionMet = this.evaluateCondition(condition, context);
    
    return { status: "condition_evaluated", conditionMet };
  }

  private async handleLoop(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { iterations = 1 } = step.config;
    
    logInfo("Executing loop step", { stepId: step.id, iterations });
    
    return { status: "loop_completed", iterations };
  }

  private async handleTimer(step: WorkflowStep, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { duration = 1000 } = step.config;
    
    logInfo("Executing timer step", { stepId: step.id, duration });
    await new Promise(resolve => setTimeout(resolve, Number(duration)));
    
    return { status: "timer_completed", duration };
  }

  /**
   * Evaluate a simple condition
   */
  private evaluateCondition(condition: unknown, context: Record<string, unknown>): boolean {
    if (!condition) return true;
    
    // Simple condition: { key: "value" } checks context[key] === value
    if (typeof condition === "object" && condition !== null) {
      for (const [key, expectedValue] of Object.entries(condition)) {
        if (context[key] !== expectedValue) {
          return false;
        }
      }
      return true;
    }
    
    return Boolean(condition);
  }

  /**
   * Schedule workflow
   */
  async scheduleWorkflow(
    tenantId: string,
    workflowId: string,
    schedule: {
      type: "cron" | "interval" | "once";
      config: Record<string, unknown>;
    }
  ): Promise<void> {
    // Load workflow to validate
    const definition = await this.loadWorkflowDefinition(workflowId);
    if (!definition) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Create scheduled workflow entry
    await this.prisma.scheduledWorkflow.create({
      data: {
        tenantId,
        workflowId,
        scheduleType: schedule.type,
        scheduleConfig: schedule.config as Prisma.InputJsonValue,
        enabled: true,
        nextRunAt: this.calculateNextRun(schedule),
      },
    });

    logInfo("Workflow scheduled", { tenantId, workflowId, schedule });
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: { type: string; config: Record<string, unknown> }): Date {
    const now = new Date();
    
    switch (schedule.type) {
      case "once":
        return new Date(schedule.config.date as string || now);
      case "interval":
        const minutes = (schedule.config.minutes as number) || 60;
        return new Date(now.getTime() + minutes * 60 * 1000);
      case "cron":
        // Simple cron: just return now for next run, real implementation would parse cron
        return now;
      default:
        return now;
    }
  }
}
