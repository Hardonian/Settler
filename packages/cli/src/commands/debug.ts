import { Command } from "commander";
import chalk from "chalk";

const debugCommand = new Command("debug");

debugCommand.description("Debugging and diagnostic tools");

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
        console.error(chalk.red("Error: SETTLER_API_KEY required"));
        process.exit(1);
      }

      console.log(chalk.blue(`Testing connection to ${options.adapter}...`));

      // Use the playground endpoint to test adapter connection
      const response = await fetch(
        `${options.parent.parent?.baseUrl || "https://api.settler.io"}/api/v1/playground/test-adapter`,
        {
          method: "POST",
          headers: {
            "X-API-Key": settlerApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adapter: options.adapter,
            config: options.config ? JSON.parse(options.config) : { apiKey: options.apiKey },
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          adapter?: string;
          status?: string;
          sampleData?: unknown[];
        };
        console.log(chalk.green("✅ Connection successful!"));
        if (data.adapter) {
          console.log(chalk.gray(`   Adapter: ${data.adapter}`));
        }
        if (data.status) {
          console.log(chalk.gray(`   Status: ${data.status}`));
        }
        if (data.sampleData && Array.isArray(data.sampleData)) {
          console.log(chalk.gray(`   Sample records: ${data.sampleData.length}`));
        }
      } else {
        const error = (await response.json()) as { message?: string };
        console.error(chalk.red("❌ Connection failed:"));
        console.error(chalk.red(`   ${error.message || "Unknown error"}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
      const fs = await import("fs/promises");
      const path = await import("path");

      const filePath = options.file;
      const content = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();

      let config: any;
      if (ext === ".yaml" || ext === ".yml") {
        const yaml = await import("yaml");
        config = yaml.parse(content);
      } else if (ext === ".json") {
        config = JSON.parse(content);
      } else {
        console.error(chalk.red("Error: Config file must be YAML or JSON"));
        process.exit(1);
      }

      console.log(chalk.blue("Validating config file..."));

      // Basic validation
      const errors: string[] = [];

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
        console.error(chalk.red("❌ Validation failed:"));
        errors.forEach((err) => console.error(chalk.red(`   - ${err}`)));
        process.exit(1);
      }

      console.log(chalk.green("✅ Config file is valid!"));
      console.log(chalk.gray(`   Name: ${config.name}`));
      console.log(chalk.gray(`   Source: ${config.source.adapter}`));
      console.log(chalk.gray(`   Target: ${config.target.adapter}`));
      console.log(chalk.gray(`   Matching rules: ${config.rules.matching.length}`));
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
        console.error(chalk.red("Error: SETTLER_API_KEY required"));
        process.exit(1);
      }

      const baseUrl = options.parent.parent?.baseUrl || "https://api.settler.io";
      const url = `${baseUrl}${options.path}`;

      console.log(chalk.blue("Tracing API request..."));
      console.log(chalk.gray(`   Method: ${options.method}`));
      console.log(chalk.gray(`   URL: ${url}`));

      const startTime = Date.now();

      const fetchOptions: RequestInit = {
        method: options.method,
        headers: {
          "X-API-Key": settlerApiKey,
          "Content-Type": "application/json",
        },
      };

      if (options.data) {
        fetchOptions.body = options.data;
        console.log(chalk.gray(`   Body: ${options.data}`));
      }

      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;

      console.log(chalk.gray(`   Status: ${response.status} ${response.statusText}`));
      console.log(chalk.gray(`   Duration: ${duration}ms`));

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      console.log(chalk.gray(`   Response headers:`));
      Object.entries(headers).forEach(([key, value]) => {
        console.log(chalk.gray(`     ${key}: ${value}`));
      });

      const body = await response.text();
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(body);
        console.log(chalk.gray(`   Response body:`));
        console.log(JSON.stringify(parsedBody, null, 2));
      } catch {
        console.log(chalk.gray(`   Response body: ${body.substring(0, 200)}...`));
      }

      if (response.ok) {
        console.log(chalk.green("✅ Request successful"));
      } else {
        console.log(chalk.red("❌ Request failed"));
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

export { debugCommand };
