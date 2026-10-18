import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requireCredentials = process.argv.includes("--require");
const tokenPresent = Boolean(process.env.TURBO_TOKEN);
const teamPresent = Boolean(process.env.TURBO_TEAM);
const signatureKeyPresent = Boolean(process.env.TURBO_REMOTE_CACHE_SIGNATURE_KEY);
const onVercel = Boolean(process.env.VERCEL);

let linkedProject = false;
const projectPath = resolve(".vercel", "project.json");
if (existsSync(projectPath)) {
  try {
    const project = JSON.parse(readFileSync(projectPath, "utf8"));
    linkedProject = Boolean(project.projectId && project.orgId);
  } catch {
    linkedProject = false;
  }
}

const externalCredentialsReady = tokenPresent && teamPresent;
const remoteCacheReady = onVercel || externalCredentialsReady;

console.log(`Vercel project linked: ${linkedProject ? "yes" : "no"}`);
console.log(`Vercel build environment: ${onVercel ? "yes" : "no"}`);
console.log(
  `External CI cache credentials: ${externalCredentialsReady ? "configured" : "missing"}`
);
console.log(`Artifact signature key: ${signatureKeyPresent ? "configured" : "not configured"}`);

if (!remoteCacheReady) {
  console.log(
    "Remote caching is not active in this shell. Configure TURBO_TOKEN and TURBO_TEAM for local or external CI runs; Vercel builds connect automatically."
  );
  if (requireCredentials) {
    process.exitCode = 1;
  }
} else {
  console.log("Remote caching configuration is present.");
}
