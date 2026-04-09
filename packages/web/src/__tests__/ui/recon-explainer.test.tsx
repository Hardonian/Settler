import fs from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";
import React from "react";

import { ReconRunSchema } from "../../../../../contracts/recon";
import { ReconResultExplainer } from "../../../../../ui/explainers/ReconResultExplainer";

describe("ReconResultExplainer", () => {
  it("renders the demo report with CSV overlay", () => {
    const csvPath = path.join(process.cwd(), "..", "..", "fixtures", "demo-recon.csv");
    const jsonPath = path.join(process.cwd(), "..", "..", "fixtures", "demo-recon-run.json");
    const csv = fs.readFileSync(csvPath, "utf8");
    const run = ReconRunSchema.parse(JSON.parse(fs.readFileSync(jsonPath, "utf8")));

    render(<ReconResultExplainer run={run} rawCsv={csv} />);

    expect(screen.getByText("Reconciliation result")).toBeInTheDocument();
    expect(screen.getByText("Run ID: demo-run-2024-09-14")).toBeInTheDocument();
    expect(screen.getByText("CSV overlay annotations")).toBeInTheDocument();
    expect(screen.getAllByText(/Payment and ledger entry line up exactly/).length).toBeGreaterThan(
      0
    );
  });
});
