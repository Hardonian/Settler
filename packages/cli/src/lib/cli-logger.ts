import chalk from "chalk";

export type CliLogLevel = "info" | "success" | "warning" | "error";

export interface CliLoggerOptions {
  /** When true, emit plain text / JSON-friendly lines without ANSI or decorative glyphs */
  isJSONFallback?: boolean;
}

const LEVEL_LABEL: Record<CliLogLevel, string> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

function formatPlainLine(level: CliLogLevel, message: string): string {
  return `[${LEVEL_LABEL[level]}] ${message}`;
}

/** Human-friendly section header (skipped in JSON/CI mode) */
export function formatCliSection(title: string, json: boolean): string {
  if (json) {
    return "";
  }
  const line = "─".repeat(Math.min(48, Math.max(title.length + 4, 24)));
  return `\n${line}\n${title}\n${line}\n`;
}

/**
 * Structured CLI logger: strict levels, optional JSON/CI mode (no chalk, no icons).
 */
export function createCliLogger(options: CliLoggerOptions = {}) {
  const json = options.isJSONFallback === true;

  const log = (level: CliLogLevel, message: string): void => {
    if (json) {
      console.log(formatPlainLine(level, message));
      return;
    }
    const styled =
      level === "success"
        ? chalk.green(message)
        : level === "warning"
          ? chalk.yellow(message)
          : level === "error"
            ? chalk.red(message)
            : chalk.white(message);
    const prefix =
      level === "success"
        ? chalk.green("✓")
        : level === "warning"
          ? chalk.yellow("!")
          : level === "error"
            ? chalk.red("✗")
            : chalk.cyan("›");
    console.log(`${prefix} ${styled}`);
  };

  return {
    log,

    info: (message: string): void => {
      log("info", message);
    },

    success: (message: string): void => {
      log("success", message);
    },

    warning: (message: string): void => {
      log("warning", message);
    },

    error: (message: string): void => {
      log("error", message);
    },

    /** Raw line without level prefix — use for tables or key=value output */
    rawLine: (message: string): void => {
      console.log(message);
    },

    /** Dim secondary detail */
    detail: (message: string): void => {
      if (json) {
        console.log(message);
        return;
      }
      console.log(chalk.gray(message));
    },

    /** Section header for long flows — no-op in JSON mode */
    section: (title: string): void => {
      const block = formatCliSection(title, json);
      if (block) {
        console.log(chalk.bold.cyan(block.trimEnd()));
      }
    },
  };
}

export function resolveJsonFallbackFromEnv(): boolean {
  const v = process.env.SETTLER_CLI_JSON;
  return v === "1" || v === "true" || v === "yes";
}
