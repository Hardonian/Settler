# Operator Control Plane

```mermaid
flowchart LR
  A[Run Explorer] --> D[Operator Decision Loop]
  B[Truth Explorer] --> D
  C[Replay Verification] --> D
  E[Policy Simulation] --> D
  D --> F[Remediation / Escalation]
```
