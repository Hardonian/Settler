#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const readFile = (filePath) => fs.readFileSync(filePath, "utf-8");

const errors = [];

const readmePath = path.join(rootDir, "README.md");
const contributingPath = path.join(rootDir, "CONTRIBUTING.md");

if (!fs.existsSync(readmePath)) {
  console.error("README.md not found.");
  process.exit(1);
}

const readme = readFile(readmePath);
const contributing = fs.existsSync(contributingPath) ? readFile(contributingPath) : "";

if (/\bTODO\b/i.test(readme)) {
  errors.push("README.md contains TODO markers.");
}
if (/\bTODO\b/i.test(contributing)) {
  errors.push("CONTRIBUTING.md contains TODO markers.");
}

const getSection = (content, heading) => {
  const headingRegex = new RegExp(`^##\\s+${heading}\\s*$`, "m");
  const match = headingRegex.exec(content);
  if (!match) {
    return null;
  }
  const startIndex = match.index + match[0].length;
  const rest = content.slice(startIndex);
  const nextHeadingMatch = /\n##\s+/.exec(rest);
  if (!nextHeadingMatch) {
    return rest;
  }
  return rest.slice(0, nextHeadingMatch.index);
};

const quickStartSection = getSection(readme, "Quick Start");
if (!quickStartSection) {
  errors.push("README.md is missing a 'Quick Start' section.");
}

const packageJson = JSON.parse(readFile(path.join(rootDir, "package.json")));
const rootScripts = packageJson.scripts || {};

const workspaceScripts = new Map();
const packagesDir = path.join(rootDir, "packages");
if (fs.existsSync(packagesDir)) {
  for (const entry of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, entry, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const pkgJson = JSON.parse(readFile(pkgPath));
    if (pkgJson.name) {
      workspaceScripts.set(pkgJson.name, pkgJson.scripts || {});
    }
  }
}

const fileExists = (relativePath) => fs.existsSync(path.join(rootDir, relativePath));

const checkScriptExists = (scriptName, scope) => {
  if (!scriptName) {
    return;
  }
  if (scope === "root") {
    if (!rootScripts[scriptName]) {
      errors.push(`Missing root script: ${scriptName}`);
    }
    return;
  }
  const scripts = workspaceScripts.get(scope);
  if (!scripts || !scripts[scriptName]) {
    errors.push(`Missing script '${scriptName}' in workspace '${scope}'`);
  }
};

const checkCommand = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return;
  }
  if (trimmed.startsWith("export ")) {
    return;
  }
  if (trimmed.startsWith("cd ")) {
    const target = trimmed.replace(/^cd\s+/, "").trim();
    if (!fileExists(target)) {
      errors.push(`Missing directory from command: ${target}`);
    }
    return;
  }
  if (trimmed.startsWith("cp ")) {
    const parts = trimmed.split(/\s+/).slice(1);
    const source = parts[0];
    if (source && !fileExists(source)) {
      errors.push(`Missing file referenced in cp command: ${source}`);
    }
    return;
  }
  const tokens = trimmed.split(/\s+/);
  if (tokens[0] === "pnpm") {
    if (tokens[1] === "install") {
      return;
    }
    if (tokens[1] === "run") {
      checkScriptExists(tokens[2], "root");
      return;
    }
    if (tokens[1] === "exec") {
      const scriptToken = tokens.find((token) => token.endsWith(".ts") || token.endsWith(".mjs") || token.endsWith(".js") || token.endsWith(".sh"));
      if (scriptToken && !fileExists(scriptToken)) {
        errors.push(`Missing script referenced in command: ${scriptToken}`);
      }
      return;
    }
    if (tokens[1] === "--filter" || tokens[1] === "-F") {
      const workspace = tokens[2];
      const scriptName = tokens[3];
      checkScriptExists(scriptName, workspace);
      return;
    }
    if (rootScripts[tokens[1]]) {
      checkScriptExists(tokens[1], "root");
      return;
    }
  }
  if (tokens[0] === "npm") {
    if (tokens[1] === "run") {
      checkScriptExists(tokens[2], "root");
      return;
    }
  }

  const fileToken = tokens.find((token) => token.includes("/") && !token.startsWith("http"));
  if (fileToken && (fileToken.endsWith(".ts") || fileToken.endsWith(".mjs") || fileToken.endsWith(".js") || fileToken.endsWith(".sh"))) {
    if (!fileExists(fileToken)) {
      errors.push(`Missing file referenced in command: ${fileToken}`);
    }
  }
};

if (quickStartSection) {
  const codeBlockRegex = /```[a-zA-Z]*\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(quickStartSection)) !== null) {
    const block = match[1];
    const lines = block.split("\n");
    lines.forEach(checkCommand);
  }
}

const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
let linkMatch;
while ((linkMatch = linkRegex.exec(readme)) !== null) {
  const rawTarget = linkMatch[1];
  if (!rawTarget || rawTarget.startsWith("http") || rawTarget.startsWith("mailto:") || rawTarget.startsWith("#")) {
    continue;
  }
  const target = rawTarget.split("#")[0];
  if (!target) {
    continue;
  }
  if (!fileExists(target)) {
    errors.push(`README.md references missing file: ${target}`);
  }
}

if (errors.length > 0) {
  console.error("Docs verification failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("✅ Docs verification passed.");
