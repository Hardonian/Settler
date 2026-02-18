"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyExportCommand = exports.exportCommand = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const export_integrity_1 = require("../lib/export-integrity");
exports.exportCommand = new commander_1.Command("export").description("Export reconciliation data using the portability contract");
exports.exportCommand
    .requiredOption("-r, --run-id <runId>", "Reconciliation run ID")
    .option("-o, --output <file>", "Write export to file path")
    .action(async (options) => {
    const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
    if (!apiKey) {
        console.error(chalk_1.default.red("Error: API key required"));
        process.exit(1);
    }
    const baseUrl = (options.parent.baseUrl || "https://api.settler.io").replace(/\/$/, "");
    const url = `${baseUrl}/api/export?runId=${encodeURIComponent(options.runId)}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
    if (!response.ok) {
        const body = await response.text();
        console.error(chalk_1.default.red(`Error: export request failed (${response.status}) ${body}`));
        process.exit(1);
    }
    const payload = (await response.json());
    if (options.output) {
        await promises_1.default.writeFile(options.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        console.log(chalk_1.default.green(`Export written to ${options.output}`));
        return;
    }
    console.log(JSON.stringify(payload, null, 2));
});
const verifyExportCommand = new commander_1.Command("verify-export")
    .description("Verify export integrity contract and deterministic hashes")
    .argument("<file>", "Path to JSON export file")
    .action(async (file) => {
    const raw = await promises_1.default.readFile(file, "utf8");
    const payload = JSON.parse(raw);
    if (payload.schemaVersion !== export_integrity_1.EXPORT_SCHEMA_VERSION) {
        console.error(chalk_1.default.red(`Schema version mismatch: expected ${export_integrity_1.EXPORT_SCHEMA_VERSION}, got ${payload.schemaVersion}`));
        process.exit(1);
    }
    const chainResult = (0, export_integrity_1.validateHashChain)(payload.integrity.chain);
    if (!chainResult.valid) {
        console.error(chalk_1.default.red(`Hash chain validation failed at index ${chainResult.brokenIndex}`));
        process.exit(1);
    }
    const deterministicHash = (0, export_integrity_1.computeReconciliationHash)(payload.run, payload.matches);
    if (deterministicHash !== payload.integrity.reconciliationHash) {
        console.error(chalk_1.default.red("Deterministic reconciliation hash mismatch"));
        process.exit(1);
    }
    console.log(chalk_1.default.green("Export verification passed"));
    console.log(`schemaVersion=${payload.schemaVersion}`);
    console.log(`chainEntries=${payload.integrity.chain.length}`);
    console.log(`reconciliationHash=${deterministicHash}`);
});
exports.verifyExportCommand = verifyExportCommand;
//# sourceMappingURL=export.js.map