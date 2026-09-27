import { spawn, spawnSync } from "node:child_process";

export function spawnManagedProcess(command, args, options = {}) {
  return spawn(command, args, {
    ...options,
    // A dedicated POSIX process group lets teardown terminate wrappers and
    // descendants (for example pnpm -> next-server) as one unit.
    detached: process.platform !== "win32",
  });
}

export async function stopManagedProcess(
  child,
  {
    graceMs = 3_000,
    platform = process.platform,
    killProcessGroup = process.kill,
    spawnSyncImpl = spawnSync,
  } = {}
) {
  if (!child?.pid) return;

  if (platform === "win32") {
    if (child.exitCode === null && !child.killed) {
      spawnSyncImpl("taskkill", ["/F", "/T", "/PID", String(child.pid)], {
        stdio: "ignore",
      });
    }
    return;
  }

  const signalTree = (signal) => {
    try {
      killProcessGroup(-child.pid, signal);
    } catch {
      if (child.exitCode === null && !child.killed) {
        try {
          child.kill(signal);
        } catch {
          // The process already exited between the state check and signal.
        }
      }
    }
  };

  signalTree("SIGTERM");

  await new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve();
    };

    child.once("exit", finish);
    child.once("close", finish);
    timer = setTimeout(() => {
      signalTree("SIGKILL");
      finish();
    }, graceMs);
  });
}
