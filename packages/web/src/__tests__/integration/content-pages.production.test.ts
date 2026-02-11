/** @jest-environment node */
import fs from "fs";
import path from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

const WEB_PACKAGE_DIR = path.resolve(__dirname, "../../..");
const PRODUCTION_PORT = 3301;
const BASE_URL = `http://127.0.0.1:${PRODUCTION_PORT}`;
const CONTENT_PAGES_DIR = path.join(WEB_PACKAGE_DIR, "content", "pages");
const ROUTES = fs
  .readdirSync(CONTENT_PAGES_DIR)
  .filter((fileName) => fileName.endsWith(".mdx"))
  .map((fileName) => `/${fileName.replace(/\.mdx$/, "")}`)
  .sort();

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env },
      stdio: "pipe",
    });

    let stderrOutput = "";

    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${command} ${args.join(" ")}\n${stderrOutput}`));
    });

    child.on("error", reject);
  });
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
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
      await runCommand("pnpm", ["run", "build"], WEB_PACKAGE_DIR);
    }

    serverProcess = spawn("pnpm", ["exec", "next", "start", "-p", String(PRODUCTION_PORT)], {
      cwd: WEB_PACKAGE_DIR,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "pipe",
    });

    await waitForServer(`${BASE_URL}/product`);
  });

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
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
