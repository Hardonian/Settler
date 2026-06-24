/** @jest-environment node */
import fs from "fs";
import path from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

const WEB_PACKAGE_DIR = path.resolve(__dirname, "../../..");
const PRODUCTION_PORT = 3301;
const BASE_URL = `http://127.0.0.1:${PRODUCTION_PORT}`;
const CONTENT_PAGES_DIR = path.join(WEB_PACKAGE_DIR, "content", "pages");
const PACKAGE_MANAGER = resolvePackageManager();
const ROUTES = fs
  .readdirSync(CONTENT_PAGES_DIR)
  .filter((fileName) => fileName.endsWith(".mdx"))
  .map((fileName) => `/${fileName.replace(/\.mdx$/, "")}`)
  .sort();

function resolvePackageManager(): { command: string; argsPrefix: string[] } {
  const execPath = process.env.npm_execpath;
  if (execPath && /pnpm(?:\.cjs)?$/i.test(execPath)) {
    return { command: process.execPath, argsPrefix: [execPath] };
  }

  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    argsPrefix: [],
  };
}

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env },
      stdio: "pipe",
      shell: process.platform === "win32",
    });

    let stdoutOutput = "";
    let stderrOutput = "";

    child.stdout.on("data", (chunk) => {
      stdoutOutput += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`Command failed: ${command} ${args.join(" ")}\n${stdoutOutput}\n${stderrOutput}`)
      );
    });

    child.on("error", reject);
  });
}

async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status > 0) {
        return;
      }
    } catch {
      // keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for production server at ${url}`);
}

jest.setTimeout(300_000);

describe("content pages in production build mode", () => {
  let serverProcess: ChildProcessWithoutNullStreams | null = null;

  beforeAll(async () => {
    const buildIdPath = path.join(WEB_PACKAGE_DIR, ".next", "BUILD_ID");
    if (!fs.existsSync(buildIdPath)) {
      await runCommand(
        PACKAGE_MANAGER.command,
        [...PACKAGE_MANAGER.argsPrefix, "run", "build"],
        WEB_PACKAGE_DIR
      );
    }

    serverProcess = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", String(PRODUCTION_PORT)],
      {
        cwd: WEB_PACKAGE_DIR,
        env: { ...process.env, NODE_ENV: "production", PORT: String(PRODUCTION_PORT) },
        stdio: "inherit",
        shell: false,
      }
    ) as unknown as ChildProcessWithoutNullStreams;

    await waitForServer(`${BASE_URL}/product`);
  });

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");

      await Promise.race([
        new Promise<void>((resolve) => {
          serverProcess?.once("exit", () => resolve());
        }),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
              serverProcess.kill("SIGKILL");
            }
            resolve();
          }, 2_000);
        }),
      ]);
    }
  });

  it("serves all MDX-backed content routes without hard-500 errors", async () => {
    const failures: Array<{ route: string; status: number; bodySnippet: string }> = [];

    for (const route of ROUTES) {
      const response = await fetch(`${BASE_URL}${route}`);
      const body = await response.text();

      if (response.status >= 500) {
        failures.push({
          route,
          status: response.status,
          bodySnippet: body.slice(0, 250),
        });
        continue;
      }

      expect(response.status).toBeLessThan(500);
      expect(body).not.toContain("An error occurred in the Server Components render");
      expect(body).not.toContain("Internal Server Error");
    }

    expect(failures).toEqual([]);
  });
});
