/**
 * Astra CLI Token Provisioning & Secret Storage
 *
 * Implements `stlr login`, `stlr whoami`, and `stlr logout` commands.
 * Safely persists tenant credentials in `~/.settler/credentials.json` with restricted permissions.
 */

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface StoredProfile {
  tenantId: string;
  apiKey: string;
  apiUrl: string;
  createdAt: string;
}

export interface CredentialsFile {
  activeProfile: string;
  profiles: Record<string, StoredProfile>;
}

export function getCredentialsPath(): string {
  const baseDir = process.env.SETTLER_CONFIG_DIR || path.join(os.homedir(), ".settler");
  return path.join(baseDir, "credentials.json");
}

export function loadCredentials(): CredentialsFile {
  const filePath = getCredentialsPath();
  if (!fs.existsSync(filePath)) {
    return {
      activeProfile: "default",
      profiles: {},
    };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CredentialsFile;
  } catch {
    return {
      activeProfile: "default",
      profiles: {},
    };
  }
}

export function saveCredentials(data: CredentialsFile): void {
  const filePath = getCredentialsPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
    mode: 0o600, // Read/write only by owner
  });
}

export function storeProfile(
  profileName: string,
  tenantId: string,
  apiKey: string,
  apiUrl: string
): void {
  const creds = loadCredentials();
  creds.profiles[profileName] = {
    tenantId,
    apiKey,
    apiUrl,
    createdAt: new Date().toISOString(),
  };
  creds.activeProfile = profileName;
  saveCredentials(creds);
}

export function getActiveProfile(): StoredProfile | null {
  const creds = loadCredentials();
  return creds.profiles[creds.activeProfile] || null;
}

export function removeProfile(profileName: string): boolean {
  const creds = loadCredentials();
  if (creds.profiles[profileName]) {
    delete creds.profiles[profileName];
    if (creds.activeProfile === profileName) {
      const remaining = Object.keys(creds.profiles);
      creds.activeProfile = remaining[0] || "default";
    }
    saveCredentials(creds);
    return true;
  }
  return false;
}

export const authCommand = new Command("auth").description(
  "Manage Astra credentials & authentication"
);

authCommand
  .command("login")
  .description("Authenticate and save tenant API key locally")
  .requiredOption("--token <apiKey>", "Settler Astra API key")
  .requiredOption("--tenant <tenantId>", "Tenant ID")
  .option("--endpoint <url>", "Astra API base URL", "https://api.settler.io")
  .option("--profile <profile>", "Config profile name", "default")
  .action((options: { token: string; tenant: string; endpoint: string; profile: string }) => {
    storeProfile(options.profile, options.tenant, options.token, options.endpoint);
    console.log(
      `[auth] Successfully saved credentials for tenant '${options.tenant}' under profile '${options.profile}'`
    );
  });

authCommand
  .command("whoami")
  .description("Display the active tenant context and profile")
  .action(() => {
    const creds = loadCredentials();
    const active = creds.profiles[creds.activeProfile];
    if (!active) {
      console.log("[auth] No active Settler profile found. Run `stlr auth login` first.");
      return;
    }
    console.log(
      JSON.stringify(
        {
          profile: creds.activeProfile,
          tenantId: active.tenantId,
          apiUrl: active.apiUrl,
          apiKey: `${active.apiKey.slice(0, 8)}...`,
          createdAt: active.createdAt,
        },
        null,
        2
      )
    );
  });

authCommand
  .command("logout")
  .description("Remove stored credentials for a profile")
  .option("--profile <profile>", "Profile name to remove", "default")
  .action((options: { profile: string }) => {
    const removed = removeProfile(options.profile);
    if (removed) {
      console.log(`[auth] Successfully removed credentials for profile '${options.profile}'`);
    } else {
      console.log(`[auth] Profile '${options.profile}' not found.`);
    }
  });
