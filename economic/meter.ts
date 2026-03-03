import type { BudgetCaps, MeterUsage } from "./types";

export class Meter {
  private usage: MeterUsage = {
    compute_units: 0,
    memory_units: 0,
    cas_io_units: 0,
    replay_calls: 0,
  };

  constructor(private readonly budgets: BudgetCaps) {}

  addCompute(units: number): void {
    this.usage.compute_units += units;
    this.assertBudget("compute_units", this.usage.compute_units, this.budgets.maxComputeUnits);
  }

  declareMemory(units: number): void {
    this.usage.memory_units = Math.max(this.usage.memory_units, units);
    this.assertBudget("memory_units", this.usage.memory_units, this.budgets.maxMemoryUnits);
  }

  addCasIo(units: number): void {
    this.usage.cas_io_units += units;
    this.assertBudget("cas_io_units", this.usage.cas_io_units, this.budgets.maxCasIoUnits);
  }

  addReplayCall(): void {
    this.usage.replay_calls += 1;
    this.assertBudget("replay_calls", this.usage.replay_calls, this.budgets.maxReplayCalls);
  }

  snapshot(): MeterUsage {
    return { ...this.usage };
  }

  private assertBudget(metric: keyof MeterUsage, value: number, limit: number): void {
    if (value > limit) {
      throw new Error(`Budget exceeded for ${metric}: ${value} > ${limit}`);
    }
  }
}
