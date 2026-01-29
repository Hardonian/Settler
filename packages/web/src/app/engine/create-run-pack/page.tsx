"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zipSync } from "fflate";

const defaultReadme = (rulesetName: string) =>
  `# Settler Engine Run Pack\n\nThis run pack is OSS-first and designed to run locally or in CI.\n\n## Run\n\n1) Build the engine binary (or download from releases).\n2) Execute:\n\n   settler-engine --input engine_input.json\n\n## Notes\n- This workflow surfaces discrepancies and produces deterministic evidence bundles.\n- No compliance or correctness guarantees are provided.\n\nRuleset: ${rulesetName}\n`;

export default function CreateRunPackPage() {
  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const [rulesetTemplate, setRulesetTemplate] = useState<string>("");
  const [mappingTemplate, setMappingTemplate] = useState<string>("");
  const [includeMapping, setIncludeMapping] = useState(true);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const loadTemplates = async () => {
      const [rulesetRes, mappingRes] = await Promise.all([
        fetch("/engine-templates/ruleset.template.json"),
        fetch("/engine-templates/mapping.template.json"),
      ]);
      setRulesetTemplate(await rulesetRes.text());
      setMappingTemplate(await mappingRes.text());
    };
    loadTemplates().catch(() => {
      setRulesetTemplate("");
      setMappingTemplate("");
    });
  }, []);

  const rulesetName = useMemo(() => {
    try {
      const parsed = JSON.parse(rulesetTemplate);
      return parsed?.name ?? "OSS Default Ruleset";
    } catch (err) {
      return "OSS Default Ruleset";
    }
  }, [rulesetTemplate]);

  const handleCreate = useCallback(async () => {
    if (inputFiles.length === 0) {
      setStatus("Select at least one input file.");
      return;
    }
    if (!rulesetTemplate) {
      setStatus("Ruleset template is unavailable.");
      return;
    }

    const files: Record<string, Uint8Array<ArrayBuffer>> = {};

    for (const file of inputFiles) {
      const buffer = await file.arrayBuffer();
      files[`inputs/${file.name}`] = Buffer.from(buffer);
    }

    files["ruleset.json"] = Buffer.from(rulesetTemplate);
    if (includeMapping && mappingTemplate) {
      files["mapping.json"] = Buffer.from(mappingTemplate);
    }

    const engineInput = {
      input_files: inputFiles.map((file) => `inputs/${file.name}`),
      input_format: "auto",
      mapping_config_path: includeMapping ? "mapping.json" : "",
      ruleset_path: "ruleset.json",
      rounding_mode: "bankers",
      timezone: "UTC",
      output_dir: "./output",
      mode: "local",
      determinism: {
        sort_keys: ["record_type", "id", "source_file", "source_row"],
        rounding: "bankers",
        timezone: "UTC",
      },
    };

    files["engine_input.json"] = Buffer.from(JSON.stringify(engineInput, null, 2));
    files["README.txt"] = Buffer.from(defaultReadme(rulesetName));

    const zipData = zipSync(files, { level: 9 });
    const blob = new Blob([zipData as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "settler-run-pack.zip";
    link.click();
    URL.revokeObjectURL(url);

    setStatus("Run pack created.");
  }, [inputFiles, rulesetTemplate, mappingTemplate, includeMapping, rulesetName]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 text-white">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Create Run Pack</h1>
        <p className="text-white/70">
          Package inputs, ruleset, and mapping config into a zip you can execute locally or in CI.
          The engine surfaces discrepancies and produces deterministic evidence bundles without any
          server dependency.
        </p>
        <Link href="/engine" className="text-sm text-blue-200 underline">
          ← Back to Engine overview
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="block text-sm font-medium">Input files</label>
        <input
          type="file"
          multiple
          className="mt-2 w-full rounded border border-white/10 bg-black/30 p-2 text-sm"
          onChange={(event) => setInputFiles(Array.from(event.target.files ?? []))}
        />
        <p className="mt-2 text-xs text-white/60">
          Supported: CSV or JSON. Use synthetic data only.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Ruleset Template</h2>
        <p className="mt-2 text-sm text-white/70">
          The default ruleset matches on reference ID, provider IDs, amount tolerance, date
          tolerance, and currency. You can edit the JSON after downloading the run pack.
        </p>
        <pre className="mt-4 max-h-48 overflow-auto rounded bg-black/40 p-3 text-xs text-white/80">
          {rulesetTemplate || "Loading ruleset template..."}
        </pre>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={includeMapping}
            onChange={(event) => setIncludeMapping(event.target.checked)}
          />
          Include mapping.json
        </label>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-black/40 p-3 text-xs text-white/80">
          {mappingTemplate || "Loading mapping template..."}
        </pre>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        className="w-fit rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
      >
        Create Run Pack Zip
      </button>

      {status ? <p className="text-sm text-emerald-200">{status}</p> : null}
    </div>
  );
}
