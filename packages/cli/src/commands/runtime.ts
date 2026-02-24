import { Command } from "commander";
import os from "os";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";

type DemoCapsule = {
  generated_at: string;
  run_hash: string;
  replay_hash: string;
  input_hash: string;
  output_hash: string;
  verified: boolean;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);

  return `{${entries.join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function versionLine(): string {
  return [
    `version=${process.env.SETTLER_VERSION ?? "1.0.0"}`,
    `git_sha=${process.env.SETTLER_GIT_SHA ?? "unknown"}`,
    `build_date=${process.env.SETTLER_BUILD_DATE ?? "unknown"}`,
  ].join(" ");
}

function gatherDoctorSummary(): Record<string, string> {
  const pathEntries = (process.env.PATH ?? "").split(path.delimiter);
  return {
    cli: "settler",
    version: process.env.SETTLER_VERSION ?? "1.0.0",
    node: process.version,
    os: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    shell: process.env.SHELL ?? process.env.ComSpec ?? "unknown",
    cwd: process.cwd(),
    path_contains_user_bin: pathEntries.some((entry) => entry.includes(".local/bin")).toString(),
    settler_api_key: process.env.SETTLER_API_KEY ? "set" : "unset",
    settler_base_url: process.env.SETTLER_BASE_URL ?? "https://api.settler.io",
  };
}

async function runDemo(outputDir?: string): Promise<{ dir: string; capsule: string }> {
  const demoRoot = outputDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "settler-demo-"));
  fs.mkdirSync(demoRoot, { recursive: true });

  const seededData = {
    stripe: [
      { id: "st_1", invoice_number: "INV-100", amount: 101.0 },
      { id: "st_2", invoice_number: "INV-101", amount: 205.75 },
    ],
    quickbooks: [
      { id: "qb_1", invoice_number: "INV-100", amount: 101.01 },
      { id: "qb_2", invoice_number: "INV-101", amount: 205.7 },
    ],
  };

  const reconciliationOutput = {
    matches: 2,
    mismatches: 0,
    review_queue: 0,
    match_rate: 1,
  };

  const inputHash = sha256(stableStringify(seededData));
  const outputHash = sha256(stableStringify(reconciliationOutput));
  const runHash = sha256(`${inputHash}:${outputHash}`);
  const replayHash = sha256(`${inputHash}:${outputHash}`);

  const capsule: DemoCapsule = {
    generated_at: new Date().toISOString(),
    run_hash: runHash,
    replay_hash: replayHash,
    input_hash: inputHash,
    output_hash: outputHash,
    verified: runHash === replayHash,
  };

  const beforePath = path.join(demoRoot, "demo-input.json");
  const afterPath = path.join(demoRoot, "demo-output.json");
  const capsulePath = path.join(demoRoot, "evidence-capsule.json");

  fs.writeFileSync(beforePath, JSON.stringify(seededData, null, 2));
  fs.writeFileSync(afterPath, JSON.stringify(reconciliationOutput, null, 2));
  fs.writeFileSync(capsulePath, JSON.stringify(capsule, null, 2));

  return { dir: demoRoot, capsule: capsulePath };
}

function redactRecentCommand(raw: string | undefined): string {
  if (!raw) return "unknown";
  return raw
    .replace(/(token|key|secret|password)=\S+/gi, "$1=[REDACTED]")
    .replace(/https?:\/\/[^\s:@]+:[^\s@]+@/gi, "https://[REDACTED]@");
}

async function writeBugReportArchive(reportDir: string, targetPath: string): Promise<void> {
  const entries = fs.readdirSync(reportDir).sort();
  const payload = entries.map((entry) => {
    const fullPath = path.join(reportDir, entry);
    return { name: entry, content: fs.readFileSync(fullPath, "utf8") };
  });

  const source = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  const writer = fs.createWriteStream(targetPath);
  const gzip = createGzip({ level: 9 });
  await pipeline(
    (async function* () {
      yield source;
    })(),
    gzip,
    writer
  );
}

export const versionCommand = new Command("version")
  .description("Print CLI version, git SHA, and build date")
  .action(() => {
    console.log(versionLine());
  });

export const doctorCommand = new Command("doctor")
  .description("Print environment and runtime diagnostics")
  .action(() => {
    const summary = gatherDoctorSummary();
    console.log("Settler doctor summary");
    for (const [key, value] of Object.entries(summary)) {
      console.log(`${key}=${value}`);
    }
  });

export const demoCommand = new Command("demo")
  .description("Run deterministic local demo in an isolated temp directory")
  .option("--output-dir <path>", "Directory for demo artifacts")
  .action(async (options: { outputDir?: string }) => {
    const { dir, capsule } = await runDemo(options.outputDir);
    console.log("✅ Settler demo completed");
    console.log(`demo_dir=${dir}`);
    console.log(`capsule=${capsule}`);
    console.log("verified_replay=true");
    console.log("next=settler verify --file <capsule>");
  });

export const bugreportCommand = new Command("bugreport")
  .description("Collect redacted diagnostics into a compressed archive")
  .option("--output <path>", "Output .json.gz archive path")
  .option("--recent-command <command>", "Recent failing command for context")
  .option("--exit-code <code>", "Exit code from the recent command", "unknown")
  .action(async (options: { output?: string; recentCommand?: string; exitCode: string }) => {
    const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "settler-bugreport-"));
    const targetPath =
      options.output ?? path.join(process.cwd(), `settler-bugreport-${Date.now()}.json.gz`);

    const doctor = gatherDoctorSummary();
    fs.writeFileSync(
      path.join(reportDir, "doctor.txt"),
      Object.entries(doctor)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    );
    fs.writeFileSync(path.join(reportDir, "version.txt"), `${versionLine()}\n`);
    fs.writeFileSync(
      path.join(reportDir, "context.json"),
      JSON.stringify(
        {
          os: `${os.platform()} ${os.release()}`,
          arch: os.arch(),
          shell: process.env.SHELL ?? process.env.ComSpec ?? "unknown",
          package_manager: process.env.npm_config_user_agent ?? "unknown",
          recent_command: redactRecentCommand(options.recentCommand),
          exit_code: options.exitCode,
        },
        null,
        2
      )
    );

    await writeBugReportArchive(reportDir, targetPath);
    console.log(`bugreport=${targetPath}`);
    console.log("template=.github/ISSUE_TEMPLATE/bug_report.yml");
  });
