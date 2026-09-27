import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { stopManagedProcess } from "../lib/managed-child-process.mjs";

function fakeChild(pid = 4242) {
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = null;
  child.killed = false;
  child.killCalls = [];
  child.kill = (signal) => {
    child.killCalls.push(signal);
    return true;
  };
  return child;
}

test("stops the entire POSIX process group", async () => {
  const child = fakeChild();
  const signals = [];

  await stopManagedProcess(child, {
    platform: "linux",
    graceMs: 50,
    killProcessGroup: (pid, signal) => {
      signals.push([pid, signal]);
      queueMicrotask(() => child.emit("exit", 0));
    },
  });

  assert.deepEqual(signals, [[-4242, "SIGTERM"]]);
  assert.deepEqual(child.killCalls, []);
});

test("falls back to signaling the direct child when no process group exists", async () => {
  const child = fakeChild();

  await stopManagedProcess(child, {
    platform: "linux",
    graceMs: 50,
    killProcessGroup: () => {
      queueMicrotask(() => child.emit("exit", 0));
      throw new Error("ESRCH");
    },
  });

  assert.deepEqual(child.killCalls, ["SIGTERM"]);
});

test("uses taskkill tree termination on Windows", async () => {
  const child = fakeChild(99);
  const calls = [];

  await stopManagedProcess(child, {
    platform: "win32",
    spawnSyncImpl: (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [["taskkill", ["/F", "/T", "/PID", "99"], { stdio: "ignore" }]]);
});
