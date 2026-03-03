export interface MeterUsage {
  compute_units: number;
  memory_units: number;
  cas_io_units: number;
  replay_calls: number;
}

export interface BudgetCaps {
  maxComputeUnits: number;
  maxMemoryUnits: number;
  maxCasIoUnits: number;
  maxReplayCalls: number;
}
