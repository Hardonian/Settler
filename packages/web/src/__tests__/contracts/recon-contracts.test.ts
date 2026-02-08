import fs from "node:fs";
import path from "node:path";

import { ReconRunSchema } from "../../../../../contracts/recon";

describe("recon contracts", () => {
  it("parses the demo reconciliation run", () => {
    const fixturePath = path.join(process.cwd(), "..", "..", "fixtures", "demo-recon-run.json");
    const parsed = ReconRunSchema.parse(JSON.parse(fs.readFileSync(fixturePath, "utf8")));

    expect(parsed.runId).toBe("demo-run-2024-09-14");
    expect(parsed.items).toHaveLength(3);
    expect(parsed.summary?.matched).toBe(1);
  });
});
