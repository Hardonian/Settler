# Settler (Open Source Core)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](packages/sdk)
[![Rust](https://img.shields.io/badge/Rust-1.80%2B-DEA584?logo=rust&logoColor=white)](crates/settler-kernel)
[![WASM](https://img.shields.io/badge/WASM-Ready-654FF0?logo=webassembly&logoColor=white)](crates/settler-verify-wasm)

**Deterministic Financial Matching Engine, SDK, CLI, & Cryptographic Verification Kernel.**

Settler is an open-core reconciliation intelligence platform. This repository contains the open-source client SDKs, developer CLI, Rust kernel primitives, and WebAssembly verification packages.

---

## Open Source Packages

| Package | Role | Language | Directory |
| :--- | :--- | :--- | :--- |
| **`@settler/sdk`** | Official TypeScript/JavaScript client SDK | TypeScript | [`packages/sdk`](packages/sdk) |
| **`@settler/cli`** | Developer CLI for local reconciliation, runs, and replay | TypeScript | [`packages/cli`](packages/cli) |
| **`@settler/protocol`** | Shared wire protocol and JSON schema definitions | TypeScript | [`packages/protocol`](packages/protocol) |
| **`@settler/react-settler`**| React UI components and status widgets | TypeScript / React | [`packages/react-settler`](packages/react-settler) |
| **`settler-kernel`** | High-performance content-addressable storage & hashing | Rust | [`crates/settler-kernel`](crates/settler-kernel) |
| **`settler-verify-wasm`** | Client-side cryptographic proofpack verifier | Rust / WASM | [`crates/settler-verify-wasm`](crates/settler-verify-wasm) |
| **`settler-sdk`** | Native Rust bindings and client SDK | Rust | [`crates/settler-sdk`](crates/settler-sdk) |

---

## Quickstart

### 1. Install Developer CLI

```bash
npm install -g @settler/cli
# or via pnpm
pnpm add -g @settler/cli
```

### 2. Verify an Audit Proofpack (Offline Deterministic Replay)

```bash
settler replay evidence.json
```

Output:
```text
✔ Proofpack signature valid: sha256:48c781e97fd3557ea0722087...
✔ 100% Deterministic match
✔ 0.000000 Variance detected across all records
```

### 3. Client SDK Usage

```typescript
import { SettlerClient } from "@settler/sdk";

const settler = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
  endpoint: "https://api.settler.dev"
});

// Reconcile two transaction streams
const run = await settler.reconciliations.create({
  source: { adapter: "stripe", config: { accountId: "acct_123" } },
  target: { adapter: "postgres", config: { table: "general_ledger" } },
  rules: {
    matching: [{ field: "transaction_id", tolerance: 0 }],
    precision: "exact_cents"
  }
});

console.log(`Reconciliation completed: ${run.id}, status: ${run.status}`);
```

---

## Architecture & Determinism Guarantee

Settler operates under **Strict Determinism**:
1. **Exact 64-bit Integer Cents**: Zero IEEE-754 floating-point drift across trillions of monetary transactions.
2. **RFC 6962 SHA-256 Merkle Proofpacks**: Every match run produces a verifiable, tamper-evident cryptographic artifact.
3. **WASM Client Verification**: Proofpacks can be verified independently in the browser or offline without contacting Settler servers.

---

## Commercial & Enterprise Platform

For the complete multi-tenant control plane, 30+ turnkey enterprise connectors (SAP S/4HANA, NetSuite, QuickBooks, Stripe), TigerBeetle 2PC ledger dual-write, and automated processor fee leakage recovery, visit [Settler.dev](https://settler.dev).

---

## License

The open-source core packages in this repository are licensed under the [MIT License](LICENSE).
