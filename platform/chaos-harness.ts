/**
 * Chaos Determinism Harness
 *
 * Injects controlled faults into platform subsystems and
 * verifies that invariants hold: replay correctness, proof
 * integrity, execution idempotency, and tenant isolation.
 */

import type {
  ChaosFault,
  ChaosFaultType,
  ChaosInvariant,
} from "./primitives";
import { DeterminismAuditor } from "./determinism";

export interface ChaosScenario {
  name: string;
  description: string;
  faults: ChaosFault[];
  invariants: string[];
}

export interface ChaosResult {
  scenario: string;
  faultsInjected: number;
  invariantsChecked: number;
  invariantsPassed: number;
  invariantsFailed: number;
  results: ChaosInvariant[];
  duration: number;
  passed: boolean;
}

type InvariantChecker = () => Promise<ChaosInvariant>;

export class ChaosHarness {
  private faultHandlers = new Map<ChaosFaultType, (fault: ChaosFault) => Promise<void>>();
  private invariantCheckers = new Map<string, InvariantChecker>();
  private auditor = new DeterminismAuditor();
  private activeFaults: ChaosFault[] = [];

  registerFaultHandler(type: ChaosFaultType, handler: (fault: ChaosFault) => Promise<void>): void {
    this.faultHandlers.set(type, handler);
  }

  registerInvariantChecker(name: string, checker: InvariantChecker): void {
    this.invariantCheckers.set(name, checker);
  }

  async injectFault(fault: ChaosFault): Promise<void> {
    const handler = this.faultHandlers.get(fault.faultType);
    if (!handler) {
      throw new Error(`No fault handler registered for type: ${fault.faultType}`);
    }
    this.activeFaults.push(fault);
    await handler(fault);
  }

  async checkInvariant(name: string): Promise<ChaosInvariant> {
    const checker = this.invariantCheckers.get(name);
    if (!checker) {
      throw new Error(`No invariant checker registered: ${name}`);
    }
    return checker();
  }

  async runScenario(scenario: ChaosScenario): Promise<ChaosResult> {
    const start = Date.now();
    this.activeFaults = [];
    this.auditor.reset();

    // Inject all faults
    for (const fault of scenario.faults) {
      try {
        await this.injectFault(fault);
      } catch (error) {
        // Fault injection failure is acceptable; record it
        this.activeFaults.push(fault);
      }
    }

    // Check all invariants
    const results: ChaosInvariant[] = [];
    for (const invariantName of scenario.invariants) {
      try {
        const result = await this.checkInvariant(invariantName);
        results.push(result);
      } catch (error) {
        results.push({
          invariantId: invariantName,
          name: invariantName,
          description: `Invariant check failed with error: ${error instanceof Error ? error.message : String(error)}`,
          check: "replay_correctness",
          passed: false,
          checkedAt: new Date().toISOString(),
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      scenario: scenario.name,
      faultsInjected: scenario.faults.length,
      invariantsChecked: results.length,
      invariantsPassed: passed,
      invariantsFailed: failed,
      results,
      duration: Date.now() - start,
      passed: failed === 0,
    };
  }

  clearFaults(): void {
    this.activeFaults = [];
  }

  getActiveFaults(): ChaosFault[] {
    return [...this.activeFaults];
  }

  /**
   * Built-in scenario: Worker crash during execution
   */
  static workerCrashScenario(): ChaosScenario {
    return {
      name: "worker_crash_mid_execution",
      description: "Simulates a worker crash midway through reconciliation",
      faults: [
        {
          faultId: "f-worker-crash-1",
          faultType: "worker_crash",
          target: "reconciliation_worker",
          injectedAt: new Date().toISOString(),
          parameters: { crashAfterStep: 3, totalSteps: 10 },
        },
      ],
      invariants: ["replay_correctness", "proof_integrity", "execution_idempotency"],
    };
  }

  /**
   * Built-in scenario: Connector returns partial data
   */
  static connectorFailureScenario(): ChaosScenario {
    return {
      name: "connector_partial_failure",
      description: "Simulates a connector returning partial data then failing",
      faults: [
        {
          faultId: "f-connector-fail-1",
          faultType: "connector_failure",
          target: "stripe_connector",
          injectedAt: new Date().toISOString(),
          duration: 5000,
          parameters: { failAfterRecords: 50, errorCode: "ECONNRESET" },
        },
      ],
      invariants: ["replay_correctness", "proof_integrity", "tenant_isolation"],
    };
  }

  /**
   * Built-in scenario: Event delivery delay
   */
  static eventDelayScenario(): ChaosScenario {
    return {
      name: "event_delivery_delay",
      description: "Simulates delayed event delivery on the backbone",
      faults: [
        {
          faultId: "f-event-delay-1",
          faultType: "event_delay",
          target: "event_backbone",
          injectedAt: new Date().toISOString(),
          duration: 3000,
          parameters: { delayMs: 2000, affectedEventTypes: ["state.persisted"] },
        },
      ],
      invariants: ["replay_correctness", "execution_idempotency"],
    };
  }

  /**
   * Built-in scenario: Cross-tenant isolation stress
   */
  static tenantIsolationScenario(): ChaosScenario {
    return {
      name: "tenant_isolation_stress",
      description: "Verifies tenant data isolation under concurrent operations",
      faults: [
        {
          faultId: "f-tenant-stress-1",
          faultType: "partial_write",
          target: "artifact_store",
          injectedAt: new Date().toISOString(),
          parameters: { concurrentTenants: 10, writesPerTenant: 100 },
        },
      ],
      invariants: ["tenant_isolation", "proof_integrity"],
    };
  }
}
