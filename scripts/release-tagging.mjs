import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Automated Release Tagging & Changelog Synthesizer (#93)
 * Inspects recent git history, categorizes commits into Settler's architectural rubric:
 * Moat, Leverage, and Maintenance, and synthesizes release notes.
 */
function synthesizeRelease() {
  const isDryRun = process.argv.includes("--dry-run");

  // Get last 20 commit subjects and bodies
  const logOutput = execSync('git log -n 20 --pretty=format:"%h||%s||%b||%an"')
    .toString("utf8")
    .trim();

  const commits = logOutput
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, body, author] = line.split("||");
      return { hash, subject: subject || "", body: body || "", author: author || "" };
    });

  const categories = {
    Moat: [],
    Leverage: [],
    Maintenance: [],
  };

  for (const c of commits) {
    const text = `${c.subject} ${c.body}`.toLowerCase();
    if (
      text.includes("moat") ||
      text.includes("merkle") ||
      text.includes("ledger") ||
      text.includes("tigerbeetle") ||
      text.includes("security") ||
      text.includes("invariants")
    ) {
      categories.Moat.push(c);
    } else if (
      text.includes("leverage") ||
      text.includes("sdk") ||
      text.includes("cli") ||
      text.includes("adapter") ||
      text.includes("pipeline")
    ) {
      categories.Leverage.push(c);
    } else {
      categories.Maintenance.push(c);
    }
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const releaseVersion = "v1.5.0";

  let markdown = `\n## [${releaseVersion}] - ${dateStr}\n\n`;

  if (categories.Moat.length > 0) {
    markdown += `### 🔒 Moat (Cryptographic Trust & Invariants)\n`;
    for (const c of categories.Moat) {
      markdown += `- \`${c.hash}\` ${c.subject} (${c.author})\n`;
    }
    markdown += `\n`;
  }

  if (categories.Leverage.length > 0) {
    markdown += `### ⚡ Leverage (Developer Velocity & Multi-Rail Throughput)\n`;
    for (const c of categories.Leverage) {
      markdown += `- \`${c.hash}\` ${c.subject} (${c.author})\n`;
    }
    markdown += `\n`;
  }

  if (categories.Maintenance.length > 0) {
    markdown += `### 🛠️ Maintenance (Polish, Hygiene & Conformance)\n`;
    for (const c of categories.Maintenance) {
      markdown += `- \`${c.hash}\` ${c.subject} (${c.author})\n`;
    }
    markdown += `\n`;
  }

  console.log("Synthesized Release Notes:\n");
  console.log(markdown);

  if (!isDryRun) {
    const changelogPath = path.resolve("CHANGELOG.md");
    if (fs.existsSync(changelogPath)) {
      const existing = fs.readFileSync(changelogPath, "utf8");
      // Insert after # Changelog header
      const updated = existing.replace("# Changelog\n", `# Changelog\n${markdown}`);
      fs.writeFileSync(changelogPath, updated, "utf8");
      console.log(`✅ CHANGELOG.md updated with release ${releaseVersion}`);
    }
  }
}

synthesizeRelease();
