/**
 * Automatic Release Notes Generator
 * Generates release notes from git commits and PRs
 */

export interface ReleaseNote {
  type: "feature" | "fix" | "improvement" | "breaking" | "security";
  title: string;
  description: string;
  prNumber?: number;
  author?: string;
}

/**
 * Generate release notes from commits
 */
export function generateReleaseNotes(
  commits: Array<{
    hash: string;
    message: string;
    author: string;
    pr?: number;
  }>,
  version: string
): {
  version: string;
  date: string;
  notes: ReleaseNote[];
  breaking: ReleaseNote[];
  security: ReleaseNote[];
} {
  const notes: ReleaseNote[] = [];
  const breaking: ReleaseNote[] = [];
  const security: ReleaseNote[] = [];

  for (const commit of commits) {
    const message = commit.message.toLowerCase();
    let type: ReleaseNote["type"] = "improvement";
    const title = commit.message.split("\n")[0];

    if (message.includes("feat:") || message.includes("feature:")) {
      type = "feature";
    } else if (message.includes("fix:") || message.includes("bug:")) {
      type = "fix";
    } else if (message.includes("breaking") || message.includes("!:")) {
      type = "breaking";
    } else if (message.includes("security:") || message.includes("sec:")) {
      type = "security";
    }

    const note: ReleaseNote = {
      type,
      title: title || "Untitled",
      description: commit.message || "",
      prNumber: commit.pr || undefined,
      author: commit.author || "Unknown",
    };

    notes.push(note);

    if (type === "breaking") {
      breaking.push(note);
    }
    if (type === "security") {
      security.push(note);
    }
  }

  return {
    version,
    date: new Date().toISOString().split("T")[0]!,
    notes,
    breaking,
    security,
  };
}

/**
 * Format release notes as markdown
 */
export function formatReleaseNotes(release: ReturnType<typeof generateReleaseNotes>): string {
  let markdown = `# Release ${release.version}\n\n`;
  markdown += `**Release Date:** ${release.date}\n\n`;

  if (release.breaking.length > 0) {
    markdown += `## ⚠️ Breaking Changes\n\n`;
    for (const note of release.breaking) {
      markdown += `- **${note.title}**\n`;
      if (note.description) {
        markdown += `  ${note.description}\n`;
      }
    }
    markdown += `\n`;
  }

  if (release.security.length > 0) {
    markdown += `## 🔒 Security Updates\n\n`;
    for (const note of release.security) {
      markdown += `- **${note.title}**\n`;
    }
    markdown += `\n`;
  }

  const features = release.notes.filter((n) => n.type === "feature");
  if (features.length > 0) {
    markdown += `## ✨ New Features\n\n`;
    for (const note of features) {
      markdown += `- **${note.title}**\n`;
    }
    markdown += `\n`;
  }

  const fixes = release.notes.filter((n) => n.type === "fix");
  if (fixes.length > 0) {
    markdown += `## 🐛 Bug Fixes\n\n`;
    for (const note of fixes) {
      markdown += `- **${note.title}**\n`;
    }
    markdown += `\n`;
  }

  const improvements = release.notes.filter((n) => n.type === "improvement");
  if (improvements.length > 0) {
    markdown += `## 🔧 Improvements\n\n`;
    for (const note of improvements) {
      markdown += `- **${note.title}**\n`;
    }
  }

  return markdown;
}
