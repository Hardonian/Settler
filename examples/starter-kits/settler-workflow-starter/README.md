# Settler Workflow Starter

Runnable quickstart for a webhook-driven reconciliation pipeline with Settler.

## What this does

1. Registers a webhook for reconciliation events
2. Creates and executes a reconciliation job
3. Exports results as CSV
4. Receives real-time events via a local webhook server

## Prerequisites

- Node.js 20+
- A Settler API key (get one at **Settings → API Keys** in the console, or use a local dev instance)

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env and set SETTLER_API_KEY

# 3. Start the webhook receiver (terminal 1)
npm run webhook-server

# 4. Run the pipeline (terminal 2)
npm start
```

### Point to a local Settler instance

```bash
SETTLER_BASE_URL=http://localhost:4000 npm start
```

## Scripts

| Command                  | Description                            |
| ------------------------ | -------------------------------------- |
| `npm start`              | Create job, run reconciliation, export |
| `npm run webhook-server` | Start the local webhook event receiver |

## Project structure

```
settler-workflow-starter/
├── src/
│   ├── index.ts           # Pipeline: register webhook → reconcile → export
│   └── webhook-server.ts  # Local HTTP server that receives Settler events
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Next steps

- Deploy the webhook server behind a public URL (ngrok, Cloudflare Tunnel, etc.)
- Add `schedule` to the job config for automated daily runs
- Handle `exception.created` events to route exceptions to Slack or PagerDuty
- Explore the [SDK reference](../../packages/sdk/README.md) for the full API surface
- See [examples/](../../) for more use cases (multi-provider, multi-currency, etc.)
