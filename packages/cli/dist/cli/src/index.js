#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commandRegistry = {
    jobs: {
        description: "Manage reconciliation jobs",
        aliases: ["job"],
        load: async () => {
            const { jobsCommand } = await Promise.resolve().then(() => __importStar(require("./commands/jobs")));
            return { command: jobsCommand };
        },
    },
    reports: {
        description: "View reconciliation reports",
        aliases: ["report"],
        load: async () => {
            const { reportsCommand } = await Promise.resolve().then(() => __importStar(require("./commands/reports")));
            return { command: reportsCommand };
        },
    },
    webhooks: {
        description: "Manage webhooks",
        aliases: ["webhook"],
        load: async () => {
            const { webhooksCommand } = await Promise.resolve().then(() => __importStar(require("./commands/webhooks")));
            return { command: webhooksCommand };
        },
    },
    adapters: {
        description: "List available adapters",
        aliases: ["adapter"],
        load: async () => {
            const { adaptersCommand } = await Promise.resolve().then(() => __importStar(require("./commands/adapters")));
            return { command: adaptersCommand };
        },
    },
    debug: {
        description: "Debugging and diagnostic tools",
        load: async () => {
            const { debugCommand } = await Promise.resolve().then(() => __importStar(require("./commands/debug")));
            return { command: debugCommand };
        },
    },
    receipts: {
        description: "Manage receipts",
        load: async () => {
            const { receiptsCommand } = await Promise.resolve().then(() => __importStar(require("./commands/receipts")));
            return { command: receiptsCommand };
        },
    },
    console: {
        description: "Manage Console resources",
        load: async () => {
            const { consoleCommand } = await Promise.resolve().then(() => __importStar(require("./commands/console")));
            return { command: consoleCommand };
        },
    },
    admin: {
        description: "Administrative operations",
        load: async () => {
            const { createAdminCommands } = await Promise.resolve().then(() => __importStar(require("./commands/admin")));
            return { command: createAdminCommands() };
        },
    },
    export: {
        description: "Export portability contract data",
        load: async () => {
            const { exportCommand } = await Promise.resolve().then(() => __importStar(require("./commands/export")));
            return { command: exportCommand };
        },
    },
    "verify-export": {
        description: "Verify exported portability contract files",
        load: async () => {
            const { verifyExportCommand } = await Promise.resolve().then(() => __importStar(require("./commands/export")));
            return { command: verifyExportCommand };
        },
    },
    mcp: {
        description: "Model Context Protocol server utilities",
        load: async () => {
            const { mcpCommand } = await Promise.resolve().then(() => __importStar(require("./commands/mcp")));
            return { command: mcpCommand };
        },
    },
};
const aliasMap = new Map();
for (const [name, config] of Object.entries(commandRegistry)) {
    aliasMap.set(name, name);
    for (const alias of config.aliases ?? []) {
        aliasMap.set(alias, name);
    }
}
function findTopLevelCommand(argv) {
    for (const arg of argv) {
        if (arg.startsWith("-")) {
            continue;
        }
        return aliasMap.get(arg) ?? null;
    }
    return null;
}
function registerHelpOnlyCommands(program) {
    for (const [name, config] of Object.entries(commandRegistry)) {
        const cmd = program.command(name).description(config.description);
        for (const alias of config.aliases ?? []) {
            cmd.alias(alias);
        }
    }
}
async function main() {
    const program = new commander_1.Command();
    const argv = process.argv.slice(2);
    program.name("settler").description("CLI tool for Settler API").version("1.0.0");
    program
        .option("-k, --api-key <key>", "API key")
        .option("-u, --base-url <url>", "Base URL", "https://api.settler.io")
        .option("-v, --verbose", "Verbose logging");
    const topLevelCommand = findTopLevelCommand(argv);
    if (!topLevelCommand) {
        registerHelpOnlyCommands(program);
    }
    else {
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
main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error: ${message}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map