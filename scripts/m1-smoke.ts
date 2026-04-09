import { spawn } from "node:child_process";

const WEB_DIR = "packages/web";
const PORT = 4010;

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: WEB_DIR,
      env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore until ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const baseEnv = {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  };

  console.log("[M1 smoke] Build with marketing-safe minimal env...");
  await runCommand("pnpm", ["build"], baseEnv);

  console.log("[M1 smoke] Start app with missing secrets and check /app fails gracefully...");
  const startProc = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      cwd: WEB_DIR,
      env: baseEnv,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  startProc.stdout.on("data", (chunk) => process.stdout.write(chunk));
  startProc.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`, 45_000);
    const marketingResponse = await fetch(`http://127.0.0.1:${PORT}/`);
    if (!marketingResponse.ok) {
      throw new Error(`Marketing route returned status ${marketingResponse.status}`);
    }

    const appResponse = await fetch(`http://127.0.0.1:${PORT}/app`);
    const appHtml = await appResponse.text();
    if (!appResponse.ok) {
      throw new Error(`/app returned status ${appResponse.status}`);
    }
    if (!appHtml.includes("Configuration Required")) {
      throw new Error("/app did not render misconfigured environment screen");
    }

    console.log("[M1 smoke] PASS");
  } finally {
    startProc.kill("SIGTERM");
    await new Promise((resolve) => startProc.once("exit", resolve));
  }
}

main().catch((error) => {
  console.error("[M1 smoke] FAIL", error);
  process.exit(1);
});
