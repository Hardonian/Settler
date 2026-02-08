const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const globToRegex = (pattern: string) => {
  const normalized = pattern.replace(/\\/g, "/");
  const regexBody = normalized
    .split("**")
    .map((segment) =>
      segment
        .split("*")
        .map((part) => escapeRegex(part))
        .join("[^/]*")
    )
    .join(".*")
    .replace(/\?/g, ".");

  return new RegExp(`^${regexBody}$`);
};

export type ReconChangeDetectorOptions = {
  patterns?: string[];
  excludedPatterns?: string[];
};

export type ReconChangeResult = {
  changed: boolean;
  matchedFiles: string[];
  reason: string;
};

export const defaultReconPatterns = [
  "contracts/recon.ts",
  "**/recon/**",
  "**/reconciliation/**",
  "**/rules/**",
  "**/*.recon.*",
  "**/*.rules.*",
  "**/*reconcile*",
];

export const detectReconChange = (
  changedFiles: string[],
  { patterns = defaultReconPatterns, excludedPatterns = [] }: ReconChangeDetectorOptions = {}
): ReconChangeResult => {
  const matcher = patterns.map(globToRegex);
  const excludedMatcher = excludedPatterns.map(globToRegex);
  const matches: string[] = [];

  changedFiles.forEach((file) => {
    const normalized = file.replace(/\\/g, "/");
    if (excludedMatcher.some((regex) => regex.test(normalized))) {
      return;
    }
    if (matcher.some((regex) => regex.test(normalized))) {
      matches.push(normalized);
    }
  });

  return {
    changed: matches.length > 0,
    matchedFiles: matches,
    reason:
      matches.length > 0
        ? "Reconciliation logic changed"
        : "No reconciliation logic changes detected",
  };
};
