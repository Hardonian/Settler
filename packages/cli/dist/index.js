#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const jobs_1 = require("./commands/jobs");
const reports_1 = require("./commands/reports");
const webhooks_1 = require("./commands/webhooks");
const adapters_1 = require("./commands/adapters");
const debug_1 = require("./commands/debug");
const program = new commander_1.Command();
program
    .name("settler")
    .description("CLI tool for Settler API")
    .version("1.0.0");
program
    .option("-k, --api-key <key>", "API key")
    .option("-u, --base-url <url>", "Base URL", "https://api.settler.io")
    .option("-v, --verbose", "Verbose logging");
// Add command groups
program.addCommand(jobs_1.jobsCommand);
program.addCommand(reports_1.reportsCommand);
program.addCommand(webhooks_1.webhooksCommand);
program.addCommand(adapters_1.adaptersCommand);
program.addCommand(debug_1.debugCommand);
// Parse arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map