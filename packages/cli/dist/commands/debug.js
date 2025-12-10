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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const debugCommand = new commander_1.Command("debug");
exports.debugCommand = debugCommand;
debugCommand
    .description("Debugging and diagnostic tools");
// Test connection to an adapter
debugCommand
    .command("test-connection")
    .description("Test connection to an adapter")
    .requiredOption("-a, --adapter <adapter>", "Adapter name (stripe, shopify, etc.)")
    .option("-k, --api-key <key>", "Adapter API key")
    .option("--config <config>", "Adapter config JSON")
    .action(async (options) => {
    try {
        const settlerApiKey = process.env.SETTLER_API_KEY || options.parent.parent?.apiKey;
        if (!settlerApiKey) {
            console.error(chalk_1.default.red("Error: SETTLER_API_KEY required"));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`Testing connection to ${options.adapter}...`));
        // Use the playground endpoint to test adapter connection
        const response = await fetch(`${options.parent.parent?.baseUrl || "https://api.settler.io"}/api/v1/playground/test-adapter`, {
            method: "POST",
            headers: {
                "X-API-Key": settlerApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                adapter: options.adapter,
                config: options.config ? JSON.parse(options.config) : { apiKey: options.apiKey },
            }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(chalk_1.default.green("✅ Connection successful!"));
            if (data.adapter) {
                console.log(chalk_1.default.gray(`   Adapter: ${data.adapter}`));
            }
            if (data.status) {
                console.log(chalk_1.default.gray(`   Status: ${data.status}`));
            }
            if (data.sampleData && Array.isArray(data.sampleData)) {
                console.log(chalk_1.default.gray(`   Sample records: ${data.sampleData.length}`));
            }
        }
        else {
            const error = await response.json();
            console.error(chalk_1.default.red("❌ Connection failed:"));
            console.error(chalk_1.default.red(`   ${error.message || "Unknown error"}`));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
// Validate config file
debugCommand
    .command("validate-config")
    .description("Validate a job configuration file")
    .requiredOption("-f, --file <file>", "Config file path (YAML or JSON)")
    .action(async (options) => {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const path = await Promise.resolve().then(() => __importStar(require("path")));
        const filePath = options.file;
        const content = await fs.readFile(filePath, "utf-8");
        const ext = path.extname(filePath).toLowerCase();
        let config;
        if (ext === ".yaml" || ext === ".yml") {
            const yaml = await Promise.resolve().then(() => __importStar(require("yaml")));
            config = yaml.parse(content);
        }
        else if (ext === ".json") {
            config = JSON.parse(content);
        }
        else {
            console.error(chalk_1.default.red("Error: Config file must be YAML or JSON"));
            process.exit(1);
        }
        console.log(chalk_1.default.blue("Validating config file..."));
        // Basic validation
        const errors = [];
        if (!config.name) {
            errors.push("Missing required field: name");
        }
        if (!config.source || !config.source.adapter) {
            errors.push("Missing required field: source.adapter");
        }
        if (!config.target || !config.target.adapter) {
            errors.push("Missing required field: target.adapter");
        }
        if (!config.rules || !config.rules.matching || !Array.isArray(config.rules.matching)) {
            errors.push("Missing required field: rules.matching (must be an array)");
        }
        if (errors.length > 0) {
            console.error(chalk_1.default.red("❌ Validation failed:"));
            errors.forEach(err => console.error(chalk_1.default.red(`   - ${err}`)));
            process.exit(1);
        }
        console.log(chalk_1.default.green("✅ Config file is valid!"));
        console.log(chalk_1.default.gray(`   Name: ${config.name}`));
        console.log(chalk_1.default.gray(`   Source: ${config.source.adapter}`));
        console.log(chalk_1.default.gray(`   Target: ${config.target.adapter}`));
        console.log(chalk_1.default.gray(`   Matching rules: ${config.rules.matching.length}`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
// Trace API request
debugCommand
    .command("trace")
    .description("Trace an API request with detailed logging")
    .requiredOption("-m, --method <method>", "HTTP method (GET, POST, etc.)")
    .requiredOption("-p, --path <path>", "API path (e.g., /api/v1/jobs)")
    .option("-d, --data <data>", "Request body (JSON)")
    .action(async (options) => {
    try {
        const settlerApiKey = process.env.SETTLER_API_KEY || options.parent.parent?.apiKey;
        if (!settlerApiKey) {
            console.error(chalk_1.default.red("Error: SETTLER_API_KEY required"));
            process.exit(1);
        }
        const baseUrl = options.parent.parent?.baseUrl || "https://api.settler.io";
        const url = `${baseUrl}${options.path}`;
        console.log(chalk_1.default.blue("Tracing API request..."));
        console.log(chalk_1.default.gray(`   Method: ${options.method}`));
        console.log(chalk_1.default.gray(`   URL: ${url}`));
        const startTime = Date.now();
        const fetchOptions = {
            method: options.method,
            headers: {
                "X-API-Key": settlerApiKey,
                "Content-Type": "application/json",
            },
        };
        if (options.data) {
            fetchOptions.body = options.data;
            console.log(chalk_1.default.gray(`   Body: ${options.data}`));
        }
        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;
        console.log(chalk_1.default.gray(`   Status: ${response.status} ${response.statusText}`));
        console.log(chalk_1.default.gray(`   Duration: ${duration}ms`));
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log(chalk_1.default.gray(`   Response headers:`));
        Object.entries(headers).forEach(([key, value]) => {
            console.log(chalk_1.default.gray(`     ${key}: ${value}`));
        });
        const body = await response.text();
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
            console.log(chalk_1.default.gray(`   Response body:`));
            console.log(JSON.stringify(parsedBody, null, 2));
        }
        catch {
            console.log(chalk_1.default.gray(`   Response body: ${body.substring(0, 200)}...`));
        }
        if (response.ok) {
            console.log(chalk_1.default.green("✅ Request successful"));
        }
        else {
            console.log(chalk_1.default.red("❌ Request failed"));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
//# sourceMappingURL=debug.js.map