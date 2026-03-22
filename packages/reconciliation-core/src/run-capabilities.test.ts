import { capabilitiesForRunKind } from "./run-capabilities";

describe("run capabilities", () => {
  it("enables workbench-style routes only for ingestion_run", () => {
    const ing = capabilitiesForRunKind("ingestion_run");
    expect(ing.matches && ing.workbench && ing.compare && ing.export).toBe(true);

    const job = capabilitiesForRunKind("recon_job");
    expect(job.matches || job.workbench || job.compare || job.export).toBe(false);
    expect(job.consoleResults).toBe(true);
  });
});
