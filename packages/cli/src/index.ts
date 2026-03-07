#!/usr/bin/env node

import { Command } from "commander";

type CommandLoader = () => Promise<{ command: Command }>;

const commandRegistry: Record<
  string,
  { description: string; aliases?: string[]; load: CommandLoader }
> = {
  jobs: {
    description: "Manage reconciliation jobs",
    aliases: ["job"],
    load: async () => {
      const { jobsCommand } = await import("./commands/jobs");
      return { command: jobsCommand };
    },
  },
  reports: {
    description: "View reconciliation reports",
    aliases: ["report"],
    load: async () => {
      const { reportsCommand } = await import("./commands/reports");
      return { command: reportsCommand };
    },
  },
  webhooks: {
    description: "Manage webhooks",
    aliases: ["webhook"],
    load: async () => {
      const { webhooksCommand } = await import("./commands/webhooks");
      return { command: webhooksCommand };
    },
  },
  adapters: {
    description: "List available adapters",
    aliases: ["adapter"],
    load: async () => {
      const { adaptersCommand } = await import("./commands/adapters");
      return { command: adaptersCommand };
    },
  },
  debug: {
    description: "Debugging and diagnostic tools",
    load: async () => {
      const { debugCommand } = await import("./commands/debug");
      return { command: debugCommand };
    },
  },
  receipts: {
    description: "Manage receipts",
    load: async () => {
      const { receiptsCommand } = await import("./commands/receipts");
      return { command: receiptsCommand };
    },
  },
  console: {
    description: "Manage Console resources",
    load: async () => {
      const { consoleCommand } = await import("./commands/console");
      return { command: consoleCommand };
    },
  },
  admin: {
    description: "Administrative operations",
    load: async () => {
      const { createAdminCommands } = await import("./commands/admin");
      return { command: createAdminCommands() };
    },
  },
  export: {
    description: "Export portability contract data",
    load: async () => {
      const { exportCommand } = await import("./commands/export");
      return { command: exportCommand };
    },
  },
  "verify-export": {
    description: "Verify exported portability contract files",
    load: async () => {
      const { verifyExportCommand } = await import("./commands/export");
      return { command: verifyExportCommand };
    },
  },
  mcp: {
    description: "Model Context Protocol server utilities",
    load: async () => {
      const { mcpCommand } = await import("./commands/mcp");
      return { command: mcpCommand };
    },
  },

  capsule: {
    description: "Create/verify deterministic time capsules",
    load: async () => {
      const { capsuleCommand } = await import("./commands/future");
      return { command: capsuleCommand };
    },
  },
  proof: {
    description: "Proof mode verification utilities",
    load: async () => {
      const { proofCommand } = await import("./commands/future");
      return { command: proofCommand };
    },
  },
  flow: {
    description: "Export reconciliation flow explorer artifacts",
    load: async () => {
      const { flowCommand } = await import("./commands/future");
      return { command: flowCommand };
    },
  },
  lineage: {
    description: "Export tenant topology/data lineage artifacts",
    load: async () => {
      const { lineageCommand } = await import("./commands/future");
      return { command: lineageCommand };
    },
  },
  rules: {
    description: "Manage rules marketplace registry",
    load: async () => {
      const { rulesCommand } = await import("./commands/future");
      return { command: rulesCommand };
    },
  },
  init: {
    description: "Generate governed templates",
    load: async () => {
      const { initCommand } = await import("./commands/future");
      return { command: initCommand };
    },
  },
  explain: {
    description: "Human-readable reconciliation explain output",
    load: async () => {
      const { explainCommand } = await import("./commands/future");
      return { command: explainCommand };
    },
  },
  operator: {
    description: "Local-first operator telemetry mode",
    load: async () => {
      const { operatorCommand } = await import("./commands/future");
      return { command: operatorCommand };
    },
  },
  arena: {
    description: "Run deterministic audit arena scorecards",
    load: async () => {
      const { arenaCommand } = await import("./commands/future");
      return { command: arenaCommand };
    },
  },
  support: {
    description: "Offline-first support bot CLI",
    load: async () => {
      const { supportCommand } = await import("./commands/future");
      return { command: supportCommand };
    },
  },
  profile: {
    description: "Gamification profile (cosmetic only)",
    load: async () => {
      const { profileCommand } = await import("./commands/future");
      return { command: profileCommand };
    },
  },
  version: {
    description: "Print Settler CLI build metadata",
    load: async () => {
      const { versionCommand } = await import("./commands/runtime");
      return { command: versionCommand };
    },
  },
  doctor: {
    description: "Run local environment diagnostics",
    load: async () => {
      const { doctorCommand } = await import("./commands/runtime");
      return { command: doctorCommand };
    },
  },
  demo: {
    description: "Run deterministic one-command demo",
    load: async () => {
      const { demoCommand } = await import("./commands/runtime");
      return { command: demoCommand };
    },
  },
  bugreport: {
    description: "Generate redacted support bundle",
    load: async () => {
      const { bugreportCommand } = await import("./commands/runtime");
      return { command: bugreportCommand };
    },
  },
  "tenant-check": {
    description: "Run multi-tenant isolation integrity checks",
    load: async () => {
      const { tenantCheckCommand } = await import("./commands/tenant-check");
      return { command: tenantCheckCommand };
    },
  },
  foundry: {
    description: "Test data foundry dataset mining/generation/execution",
    load: async () => {
      const { foundryCommand } = await import("./commands/foundry");
      return { command: foundryCommand };
    },
  },
  verify: {
    description: "Verify a Reconciliation Proof Capsule (RPC)",
    load: async () => {
      const { verifyCommand } = await import("./commands/verify");
      return { command: verifyCommand };
    },
  },
};

const aliasMap = new Map<string, string>();
for (const [name, config] of Object.entries(commandRegistry)) {
  aliasMap.set(name, name);
  for (const alias of config.aliases ?? []) {
    aliasMap.set(alias, name);
  }
}

function findTopLevelCommand(argv: string[]): string | null {
  for (const arg of argv) {
    if (arg.startsWith("-")) {
      continue;
    }

    return aliasMap.get(arg) ?? null;
  }

  return null;
}

function registerHelpOnlyCommands(program: Command): void {
  for (const [name, config] of Object.entries(commandRegistry)) {
    const cmd = program.command(name).description(config.description);
    for (const alias of config.aliases ?? []) {
      cmd.alias(alias);
    }
  }
}

async function main(): Promise<void> {
  const program = new Command();
  const argv = process.argv.slice(2);

  program.name("settler").description("Settler CLI for the Open Source Reconciliation Engine");

  program
    .option("-k, --api-key <key>", "API key")
    .option("-u, --base-url <url>", "Base URL", "https://api.settler.io")
    .option("-v, --verbose", "Verbose logging");

  const topLevelCommand = findTopLevelCommand(argv);

  if (!topLevelCommand) {
    registerHelpOnlyCommands(program);
  } else {
    const registryEntry = commandRegistry[topLevelCommand];
    if (!registryEntry) {
      console.error(`Error: Unsupported command: ${topLevelCommand}`);
      process.exit(1);
    }

    const { command } = await registryEntry.load();
    program.addCommand(command);
  }

  program.parse(process.argv);

  if (argv.length === 0) {
    program.outputHelp();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Error: ${message}`);
  process.exit(1);
});
