# Policy-as-Code

Policies are defined in `/policies` and compiled by `compilePolicy()` into deterministic enforcement plans.

Supported policy fields:

- requiredRole / requiredScopes
- evidenceLevel (`none|standard|full`)
- replayRequired
- maxComputeUnits / maxMemoryUnits / maxCasIoUnits / maxReplayCalls
- retentionDays
- allowDeterministicOverride (default false)

Execution funnel:

- all demo engine execution goes through `runner/executeWithPolicy.ts`
- policy compilation, economic metering, evidence emission, and replay enforcement are applied in one path
