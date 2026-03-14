export type EvidenceRef = {
  label: string;
  href: string;
  type: "route" | "package" | "doc";
};

export type VisualProofEntry = {
  title: string;
  detail: string;
  refs: EvidenceRef[];
};

export const visualProofRegistry: Record<string, VisualProofEntry[]> = {
  architecture: [
    {
      title: "Control-plane and reconciliation surfaces",
      detail:
        "Public and authenticated route layers expose deterministic run, policy, and evidence paths.",
      refs: [
        { label: "Architecture", href: "/architecture", type: "route" },
        { label: "App runs", href: "/app/runs", type: "route" },
        { label: "App policies", href: "/app/policies", type: "route" },
      ],
    },
    {
      title: "Execution runtime modules",
      detail:
        "Adapter, SDK, and protocol packages back deterministic execution and integration boundaries.",
      refs: [
        { label: "Adapter docs", href: "/docs/integrations", type: "route" },
        { label: "SDK docs", href: "/docs/sdk", type: "route" },
        { label: "API protocol docs", href: "/docs/api", type: "route" },
      ],
    },
  ],
  integrations: [
    {
      title: "Provider connection handshake",
      detail:
        "Connector runtime path includes auth/callback/sync lifecycle routes and request flows.",
      refs: [
        { label: "Integrations request", href: "/integrations/request", type: "route" },
        { label: "Dashboard integrations", href: "/dashboard/integrations", type: "route" },
        { label: "API connectors", href: "/docs/integrations", type: "route" },
      ],
    },
    {
      title: "Canonical mapping + reconciliation",
      detail:
        "Connected providers flow through deterministic matching and proof generation routes.",
      refs: [
        { label: "App connections", href: "/app/connections", type: "route" },
        { label: "App runs", href: "/app/runs", type: "route" },
        { label: "Proof explorer", href: "/proof-explorer", type: "route" },
      ],
    },
  ],
  proof: [
    {
      title: "Evidence lifecycle",
      detail:
        "Proof generation, lineage inspection, and replay verification are available as first-class flows.",
      refs: [
        { label: "Proof explorer", href: "/proof-explorer", type: "route" },
        { label: "Replay lab", href: "/replay-lab", type: "route" },
        { label: "App proofs", href: "/app/proofs", type: "route" },
      ],
    },
  ],
  console: [
    {
      title: "Developer/operator console surfaces",
      detail:
        "Console routes provide runtime observability, policy controls, usage, and integration management.",
      refs: [
        { label: "Console", href: "/console", type: "route" },
        { label: "Console operator", href: "/console/operator", type: "route" },
        { label: "Console usage", href: "/console/usage", type: "route" },
      ],
    },
  ],
  trust: [
    {
      title: "Trust posture and degraded-state transparency",
      detail:
        "Trust and status pages expose uptime proxy, reliability signals, and operational disclosures.",
      refs: [
        { label: "Trust", href: "/trust", type: "route" },
        { label: "Status", href: "/status", type: "route" },
        { label: "Transparency", href: "/transparency", type: "route" },
      ],
    },
  ],
  security: [
    {
      title: "Isolation + audit verification surfaces",
      detail:
        "Security and audit pages map tenant safety, immutable logging, and evidence export boundaries.",
      refs: [
        { label: "Security and audit", href: "/security-and-audit", type: "route" },
        { label: "Trust", href: "/trust", type: "route" },
        { label: "App audit", href: "/app/audit", type: "route" },
      ],
    },
  ],
  roadmap: [
    {
      title: "Roadmap honesty guardrails",
      detail:
        "Roadmap statuses are explicitly separated into shipped, in-progress, and directional lanes.",
      refs: [
        { label: "Roadmap", href: "/changelog", type: "route" },
        { label: "Changelog", href: "/changelog", type: "route" },
        { label: "Open source", href: "/open-source", type: "route" },
      ],
    },
  ],
};
