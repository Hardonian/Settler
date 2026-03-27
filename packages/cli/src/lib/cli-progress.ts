import chalk from "chalk";

/**
 * Indeterminate progress for long async work. Skips animation when JSON/CI mode is on.
 */
export async function withIndeterminateProgress<T>(
  label: string,
  isJSONFallback: boolean,
  work: () => Promise<T>
): Promise<T> {
  if (isJSONFallback) {
    return work();
  }

  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i] ?? "⠋")} ${chalk.gray(label)}`);
    i = (i + 1) % frames.length;
  }, 90);

  try {
    return await work();
  } finally {
    clearInterval(id);
    process.stdout.write("\r\x1b[K");
  }
}
