1/ We open sourced Settler: deterministic reconciliation workflows with replayable proof artifacts.

2/ Problem: many reconciliation systems start as scripts + cron. Later, outcomes drift and post-incident debugging turns into guesswork.

3/ Settler's model is explicit:

- deterministic run execution
- policy checks in-path
- generated evidence (`run.json`, `results.json`, `evidence.json`)
- replay verification against fingerprints

4/ Try it locally:

```bash
pnpm install
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

5/ The demo writes concrete artifacts under `examples/demo-output/`, including an HTML report and replayable evidence.

6/ Repo entry points:

- `ARCHITECTURE.md`
- `docs/launch/QUICK_START.md`
- `docs/launch/EXAMPLE_WORKFLOWS.md`
- `CONTRIBUTING.md`

7/ We'd value feedback from engineers running high-integrity data pipelines: where does deterministic replay help most in your stack?
