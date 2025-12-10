"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = __importDefault(require("@settler/sdk"));
const webhooksCommand = new commander_1.Command("webhooks");
exports.webhooksCommand = webhooksCommand;
webhooksCommand
    .description("Manage webhooks")
    .alias("webhook");
webhooksCommand
    .command("list")
    .description("List all webhooks")
    .action(async (options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        const client = new sdk_1.default({
            apiKey,
            baseUrl: options.parent.baseUrl,
        });
        const response = await client.webhooks.list();
        if (response.data.length === 0) {
            console.log(chalk_1.default.yellow("No webhooks found."));
            return;
        }
        console.log(chalk_1.default.bold("\nWebhooks:\n"));
        response.data.forEach((webhook) => {
            console.log(chalk_1.default.cyan(`  ${webhook.id}`));
            console.log(`    URL: ${webhook.url}`);
            console.log(`    Events: ${webhook.events.join(", ")}`);
            console.log(`    Status: ${webhook.status}`);
            console.log();
        });
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
//# sourceMappingURL=webhooks.js.map