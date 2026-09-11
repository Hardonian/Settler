declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { storeProfile, loadCredentials, getActiveProfile, removeProfile } from "../commands/auth";

describe("CLI Auth & Credential Store", () => {
  const testDir = path.join(os.tmpdir(), `.settler-cli-auth-test-${Date.now()}`);

  beforeEach(() => {
    process.env.SETTLER_CONFIG_DIR = testDir;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    delete process.env.SETTLER_CONFIG_DIR;
  });

  it("stores and loads credentials safely", () => {
    storeProfile("default", "tenant_alpha", "stlr_live_12345", "https://api.settler.io");

    const creds = loadCredentials();
    expect(creds.activeProfile).toBe("default");
    expect(creds.profiles.default).toBeDefined();
    expect(creds.profiles.default!.tenantId).toBe("tenant_alpha");
    expect(creds.profiles.default!.apiKey).toBe("stlr_live_12345");

    const active = getActiveProfile();
    expect(active).not.toBeNull();
    expect(active!.tenantId).toBe("tenant_alpha");
  });

  it("removes a profile on logout", () => {
    storeProfile("prod", "tenant_prod", "stlr_live_999", "https://api.settler.io");
    expect(removeProfile("prod")).toBe(true);

    const creds = loadCredentials();
    expect(creds.profiles.prod).toBeUndefined();
    expect(removeProfile("non_existent")).toBe(false);
  });
});
