"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptersCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = __importDefault(require("@settler/sdk"));
const adaptersCommand = new commander_1.Command("adapters");
exports.adaptersCommand = adaptersCommand;
adaptersCommand
    .description("List available adapters")
    .alias("adapter");
adaptersCommand
    .command("list")
    .description("List all available adapters")
    .action(async (options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        const client = new sdk_1.default({
            apiKey,
            ...(options.parent?.baseUrl ? { baseUrl: options.parent.baseUrl } : {}),
        });
        const response = await client.adapters.list();
        console.log(chalk_1.default.bold("\nAvailable Adapters:\n"));
        response.data.forEach((adapter) => {
            console.log(chalk_1.default.cyan(`  ${adapter.id}`));
            console.log(`    Name: ${adapter.name}`);
            console.log(`    Description: ${adapter.description}`);
            console.log(`    Version: ${adapter.version}`);
            console.log();
        });
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
//# sourceMappingURL=adapters.js.map