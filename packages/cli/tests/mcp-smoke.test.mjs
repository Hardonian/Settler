import { spawn } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

function send(child, payload) {
  child.stdin.write(`${JSON.stringify(payload)}\n`);
}

async function waitFor(predicate, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = predicate();
    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return null;
}

test("mcp stdio initialize/list/call flow works", async () => {
  const child = spawn("pnpm", ["exec", "tsx", "src/index.ts", "mcp", "serve"], {
    cwd: new URL("..", import.meta.url).pathname,
    stdio: ["pipe", "pipe", "inherit"],
  });

  const responses = [];
  child.stdout.on("data", (chunk) => {
    const lines = chunk
      .toString()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      responses.push(JSON.parse(line));
    }
  });

  send(child, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  send(child, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  send(child, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "echo", arguments: { message: "ok" } },
  });

  const init = await waitFor(() => responses.find((item) => item.id === 1));
  const list = await waitFor(() => responses.find((item) => item.id === 2));
  const call = await waitFor(() => responses.find((item) => item.id === 3));

  assert.ok(init?.result?.serverInfo?.name);
  assert.ok(Array.isArray(list?.result?.tools));
  assert.match(call?.result?.content?.[0]?.text ?? "", /"message":"ok"/);

  child.kill("SIGTERM");
});
