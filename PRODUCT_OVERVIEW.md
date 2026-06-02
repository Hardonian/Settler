# Settler: Product Overview & Architecture

## System Architecture

Settler is built on a modern, ultra-resilient tech stack designed to handle financial-grade data deterministically.

### 1. The Frontend (God-Mode Dashboard)

- **Framework**: Next.js 15 (App Router), React 19.
- **Styling**: Tailwind CSS, Framer Motion for micro-animations, Lucide React for iconography.
- **Key Features**:
  - **Global Command Palette (CMD+K)**: Instant access to billing, AI triggers, and settings.
  - **Live AI Activity Feed**: Real-time websocket/polling UI that surfaces AI background tasks to the user, providing psychological validation of autonomous labor.
  - **App Marketplace**: Pre-built integration cards for Stripe, QuickBooks, Slack, and Xero.

### 2. The AI Workforce (BYOK Architecture)

Settler doesn't just display data; it acts on it. We use the Vercel AI SDK and Zod for rigid, tool-calling intelligence.

- **Bring-Your-Own-Key (BYOK)**: To minimize infrastructure burn and protect our margins, users supply their own OpenAI API keys. If the key is missing or fails, the platform degrades gracefully into a standard deterministic app (`verified_degraded` state).
- **The Orchestrator**: The master agent (`orchestrator-agent.ts`) that manages concurrent sub-agents, handling state, task delegation, and error recovery.
- **Specialized Agents**:
  - **Support Deflector**: Analyzes inbound support tickets and cross-references documentation to deflect them automatically.
  - **Sales Hunter**: Scrapes inbound intent signals and structures them into lead schemas.

### 3. The Core Ledger (TigerBeetle Inspired)

At the heart of Settler is a double-entry ledger system.

- **Immutability**: Once a transaction is logged, it cannot be modified, only reversed via a contra-entry.
- **AutoMapper Engine**: The deterministic reconciliation engine that maps source data (e.g., a Stripe webhook) to ledger entries, applying fee abstraction logic.

### 4. Edge Observability & Security

- **Sentry**: Wired directly into `global-error.tsx` for immediate edge-level incident reporting.
- **Strict Linting & ARIA Compliance**: Zero-tolerance policy for linting and accessibility errors in production branches.

## Roadmap & Upcoming Features

1. **Full Xero/QBO Bidirectional Sync**: Push matched transactions directly to cloud accounting software.
2. **SOC2 Type II Audit**: Formalize our security invariants.
3. **Advanced AI Tool Calling**: Allow the Sales Hunter to automatically send emails via Resend.
