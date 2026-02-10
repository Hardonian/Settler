import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import { Command } from "commander";
import chalk from "chalk";

import { startMcpStdioServer } from "../mcp/server";

const mcpCommand = new Command("mcp").description("Model Context Protocol server utilities");

mcpCommand
  .command("serve")
  .description("Start MCP server over stdio")
  .action(() => {
    startMcpStdioServer({ appName: "settler-cli", appVersion: "1.0.0" });
  });

mcpCommand
  .command("ping")
  .description("Run MCP stdio handshake smoke test")
  .option("--timeout-ms <ms>", "Handshake timeout in milliseconds", "2000")
  .action(async (options: { timeoutMs?: string }) => {
    const timeoutMs = Number(options.timeoutMs ?? "2000");
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      console.error(chalk.red("Error: --timeout-ms must be a positive number"));
      process.exit(1);
    }

    const cliEntrypoint = process.argv[1];
    if (!cliEntrypoint) {
      console.error(chalk.red("Error: Unable to resolve CLI entrypoint"));
      process.exit(1);
    }

    const spawnArgs = cliEntrypoint.endsWith(".ts")
      ? ["exec", "tsx", cliEntrypoint, "mcp", "serve"]
      : [cliEntrypoint, "mcp", "serve"];

    const spawnCmd = cliEntrypoint.endsWith(".ts") ? "pnpm" : process.execPath;

    const child: ChildProcessWithoutNullStreams = spawn(spawnCmd, spawnArgs);

    let completed = false;

    const cleanup = (): void => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    };

    const timer = setTimeout(() => {
      if (completed) {
        return;
      }

      cleanup();
      console.error(chalk.red(`Error: MCP ping timed out after ${timeoutMs}ms`));
      process.exit(1);
    }, timeoutMs);

    const send = (payload: unknown): void => {
      child.stdin.write(`${JSON.stringify(payload)}\n`);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      const lines = chunk
        .toString()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        const message = JSON.parse(line) as { id?: number; result?: unknown; error?: unknown };

        if (message.id === 1 && message.result) {
          send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
          continue;
        }

        if (message.id === 2 && message.result) {
          send({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "ping",
              arguments: {},
            },
          });
          continue;
        }

        if (message.id === 3 && message.result) {
          completed = true;
          clearTimeout(timer);
          cleanup();
          console.log(chalk.green("✓ MCP handshake and tool call succeeded"));
          return;
        }

        if (message.error) {
          completed = true;
          clearTimeout(timer);
          cleanup();
          console.error(chalk.red(`Error: MCP request failed ${JSON.stringify(message.error)}`));
          process.exit(1);
        }
      }
    });

    child.on("exit", (code: number | null) => {
      if (!completed && code !== 0) {
        clearTimeout(timer);
        console.error(chalk.red(`Error: MCP server exited unexpectedly with code ${code}`));
        process.exit(1);
      }
    });

    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "settler-cli", version: "1.0.0" },
      },
    });
  });

export { mcpCommand };
