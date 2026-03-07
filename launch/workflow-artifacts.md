# Example Workflow Output + Proof Artifact

## Generated output (`examples/demo-output/results.json`)

```json
{
  "output": {
    "matches": 2,
    "mismatches": 0,
    "reviewQueue": 0
  }
}
```

## Generated proof (`examples/demo-output/evidence.json`)

```json
{
  "run_id": "demo-run-1",
  "policy_id": "demo.strict",
  "run_fingerprint": "48c781e97fd3557ea0722087a34c3098579d9bef56d76f41c5f96c46199631b5",
  "metadata": {
    "replay_required": true,
    "evidence_level": "full"
  }
}
```

## Replay command

```bash
pnpm settler:replay examples/demo-output/evidence.json
```
