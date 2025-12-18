"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptsCommand = void 0;
const commander_1 = require("commander");
const sdk_1 = require("@settler/sdk");
const chalk_1 = __importDefault(require("chalk"));
exports.receiptsCommand = new commander_1.Command("receipts")
    .description("Manage receipts");
exports.receiptsCommand
    .command("parse <file>")
    .description("Parse a receipt from a file or URL")
    .option("-u, --url", "Treat file argument as a URL")
    .action(async (file, options) => {
    const client = new sdk_1.SettlerClient({
        apiKey: process.env.SETTLER_API_KEY || "demo_key"
    });
    console.log(chalk_1.default.blue(`Parsing receipt: ${file}...`));
    try {
        let receipt;
        if (options.url || file.startsWith("http")) {
            receipt = await client.receipts.parse(file);
        }
        else {
            // Read file and convert to base64 or upload (mocked for now)
            // In a real CLI we would upload to signed URL first
            console.log(chalk_1.default.yellow("Local file upload not fully implemented in CLI demo."));
            return;
        }
        console.log(chalk_1.default.green("✓ Receipt parsed successfully"));
        console.log(JSON.stringify(receipt, null, 2));
    }
    catch (error) {
        console.error(chalk_1.default.red("Error parsing receipt:"), error.message);
    }
});
exports.receiptsCommand
    .command("get <id>")
    .description("Get a receipt by ID")
    .action(async (id) => {
    const client = new sdk_1.SettlerClient({
        apiKey: process.env.SETTLER_API_KEY || "demo_key"
    });
    try {
        const receipt = await client.receipts.get(id);
        console.log(JSON.stringify(receipt, null, 2));
    }
    catch (error) {
        console.error(chalk_1.default.red("Error fetching receipt:"), error.message);
    }
});
//# sourceMappingURL=receipts.js.map