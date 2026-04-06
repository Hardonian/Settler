# Settler Recon Starter

Runnable quickstart for reconciling payment transactions with Settler.

## What this does

1. Creates a reconciliation job (Stripe payments → internal ledger)
2. Executes the job and waits for results
3. Prints a match/unmatch summary
4. Lists any exceptions that need manual review

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

# 3. Run
npm start
```

### Point to a local Settler instance

If you're running Settler locally (`pnpm dev` from the monorepo root):

```bash
SETTLER_BASE_URL=http://localhost:4000 npm start
```

## Scripts

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm start`          | Run the reconciliation example             |
| `npm run check-results` | Fetch results for a previous job (set `JOB_ID`) |

## Project structure

```
settler-recon-starter/
├── src/
│   ├── index.ts           # Main reconciliation flow
│   └── check-results.ts   # Fetch results for a previous job
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Next steps

- Swap `stripe` / `internal_ledger` adapters for your real data sources
- Add a webhook listener instead of polling for results
- Set up scheduled reconciliation with `schedule: "0 2 * * *"`
- Explore the [SDK reference](../../packages/sdk/README.md) for the full API surface
- See [examples/](../../) for more use cases (multi-currency, exception handling, etc.)
