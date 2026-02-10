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
  mcp: {
    description: "Model Context Protocol server utilities",
    load: async () => {
      const { mcpCommand } = await import("./commands/mcp");
      return { command: mcpCommand };
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

  program.name("settler").description("CLI tool for Settler API").version("1.0.0");

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
