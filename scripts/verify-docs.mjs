#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const readFile = (filePath) => fs.readFileSync(filePath, "utf-8");

const errors = [];
const warnings = [];

const parseJsonFile = (filePath, label) => {
  try {
    return JSON.parse(readFile(filePath));
  } catch (error) {
    warnings.push(`${label} is not valid JSON: ${error.message}`);
    return {};
  }
};

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

const quickStartSection = getSection(readme, "Quick Start") || getSection(readme, "Quick start") || getSection(readme, "Quickstart");
if (!quickStartSection) {
  errors.push("README.md is missing a Quick Start section.");
}

const packageJson = parseJsonFile(path.join(rootDir, "package.json"), "package.json");
const rootScripts = packageJson.scripts || {};

const workspaceScripts = new Map();
const packagesDir = path.join(rootDir, "packages");
if (fs.existsSync(packagesDir)) {
  for (const entry of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, entry, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const pkgJson = parseJsonFile(pkgPath, `workspace package.json (${path.relative(rootDir, pkgPath)})`);
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



const walkMarkdownFiles = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        out.push(path.relative(rootDir, fullPath));
      }
    }
  }
  return out;
};

const docsMarkdownFiles = walkMarkdownFiles(path.join(rootDir, "docs"));
const docsCaseMap = new Map();
for (const file of docsMarkdownFiles) {
  const key = file.toLowerCase();
  const list = docsCaseMap.get(key) || [];
  list.push(file);
  docsCaseMap.set(key, list);
}
for (const [, variants] of docsCaseMap.entries()) {
  if (variants.length > 1) {
    errors.push(`Case-collision markdown paths detected under docs/: ${variants.join(", ")}`);
  }
}

const canonicalDocs = [
  "docs/README.md",
  "docs/architecture/README.md",
  "docs/operations/README.md",
  "docs/product/README.md",
  "docs/getting-started/README.md",
  "docs/getting-started/quickstart.md",
  "docs/getting-started/env-files.md",
];
for (const canonicalDoc of canonicalDocs) {
  if (!fileExists(canonicalDoc)) {
    errors.push(`Missing canonical doc: ${canonicalDoc}`);
  }
}

const docsReadmePath = path.join(rootDir, "docs/README.md");
if (fs.existsSync(docsReadmePath)) {
  const docsReadme = readFile(docsReadmePath);
  ["docs/getting-started/quickstart.md", "docs/architecture/README.md", "docs/operations/README.md", "docs/product/README.md"].forEach((target) => {
    const targetRelative = target.replace("docs/", "");
    if (!docsReadme.includes(target) && !docsReadme.includes(targetRelative)) {
      errors.push(`docs/README.md missing canonical hub/discovery link: ${target}`);
    }
  });
}

const disallowedArchiveRoots = [
  path.join(rootDir, "archive"),
  path.join(rootDir, "HISTORICAL-PLANNING-ARCHIVE"),
];
for (const archiveRoot of disallowedArchiveRoots) {
  if (!fs.existsSync(archiveRoot)) {
    continue;
  }
  const markdownCount = walkMarkdownFiles(archiveRoot).length;
  if (markdownCount > 0) {
    errors.push(`Orphan archive markdown found outside docs/archive/: ${path.relative(rootDir, archiveRoot)} (${markdownCount} files)`);
  }
}

if (warnings.length > 0) {
  console.warn("Docs verification warnings:\n");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
  console.warn("");
}

if (errors.length > 0) {
  console.error("Docs verification failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("✅ Docs verification passed.");
