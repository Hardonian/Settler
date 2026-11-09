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

async function waitForServer(
  url: string,
  serverProcess?: ChildProcessWithoutNullStreams | null,
  getErrorOutput?: () => string,
  timeoutMs = 60_000
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess && serverProcess.exitCode !== null && serverProcess.exitCode !== undefined) {
      const err = getErrorOutput?.() || "";
      throw new Error(
        `Server process exited prematurely with code ${serverProcess.exitCode}: ${err}`
      );
    }

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

  const err = getErrorOutput?.() || "";
  throw new Error(`Timed out waiting for production server at ${url}. Output: ${err}`);
}

jest.setTimeout(300_000);

describe("content pages in production build mode", () => {
  let serverProcess: ChildProcessWithoutNullStreams | null = null;
  let serverOutput = "";

  beforeAll(async () => {
    const buildIdPath = path.join(WEB_PACKAGE_DIR, ".next", "BUILD_ID");
    const previewPropsPath = path.join(WEB_PACKAGE_DIR, ".next", "server", "preview-props.json");
    if (!fs.existsSync(buildIdPath) || !fs.existsSync(previewPropsPath)) {
      await runCommand(
        PACKAGE_MANAGER.command,
        [...PACKAGE_MANAGER.argsPrefix, "run", "build"],
        WEB_PACKAGE_DIR
      );
    }

    const nextBin = path.join(WEB_PACKAGE_DIR, "node_modules", "next", "dist", "bin", "next");

    serverProcess = spawn(process.execPath, [nextBin, "start", "-p", String(PRODUCTION_PORT)], {
      cwd: WEB_PACKAGE_DIR,
      env: { ...process.env, NODE_ENV: "production", PORT: String(PRODUCTION_PORT) },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    }) as unknown as ChildProcessWithoutNullStreams;

    serverProcess.stdout?.on("data", (chunk: Buffer) => {
      serverOutput += chunk.toString();
    });
    serverProcess.stderr?.on("data", (chunk: Buffer) => {
      serverOutput += chunk.toString();
    });

    await waitForServer(`${BASE_URL}/product`, serverProcess, () => serverOutput);
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.stdout?.destroy();
      serverProcess.stderr?.destroy();

      if (!serverProcess.killed) {
        if (process.platform === "win32" && serverProcess.pid) {
          try {
            const { execSync } = await import("child_process");
            execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: "ignore" });
          } catch {}
        } else {
          serverProcess.kill("SIGTERM");
        }

        await Promise.race([
          new Promise<void>((resolve) => {
            serverProcess?.once("exit", () => resolve());
          }),
          new Promise<void>((resolve) => {
            setTimeout(() => {
              if (serverProcess && !serverProcess.killed) {
                try {
                  serverProcess.kill("SIGKILL");
                } catch {}
              }
              resolve();
            }, 2_000);
          }),
        ]);
      }

      serverProcess.unref();
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
