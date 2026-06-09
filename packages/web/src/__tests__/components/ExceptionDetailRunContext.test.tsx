/** @jest-environment jsdom */

import { renderToStaticMarkup } from "react-dom/server";
import { ExceptionDetailRunContext } from "@/components/console/ExceptionDetailRunContext";

describe("ExceptionDetailRunContext", () => {
  const baseRun = {
    id: "66666666-7777-4888-8999-aaaaaaaaaaaa",
    runKind: "ingestion_run" as const,
    sourceModel: "recon_results" as const,
    name: "Nightly Stripe ↔ Ledger",
    normalizedStatus: "completed",
    statusLabel: "Completed",
    createdAt: "2026-02-01T08:00:00.000Z",
    startedAt: "2026-02-01T08:05:00.000Z",
    completedAt: "2026-02-01T08:10:00.000Z",
    ingestionId: "ing-1",
    reconJobId: null,
    href: "/console/runs/66666666-7777-4888-8999-aaaaaaaaaaaa",
    recordFound: true,
    latestResultId: null,
    uuidCollision: false,
  };

  test("renders run name, status label, and no drift action buttons", () => {
    const html = renderToStaticMarkup(<ExceptionDetailRunContext run={baseRun} />);
    expect(html).toContain("Nightly Stripe");
    expect(html).toContain("66666666-7777-4888-8999-aaaaaaaaaaaa");
    expect(html).toContain("Completed");
    expect(html).toContain("recon_results");
    expect(html).not.toMatch(/Mark Resolved|Ignore Exception|Reopen/);
  });

  test("renders explicit fallback when no run is linked", () => {
    const html = renderToStaticMarkup(<ExceptionDetailRunContext run={null} />);
    expect(html).toContain("Run context is unavailable");
  });

  test("renders honest message when run id present but row missing", () => {
    const html = renderToStaticMarkup(
      <ExceptionDetailRunContext
        run={{
          ...baseRun,
          name: null,
          recordFound: false,
          normalizedStatus: "unknown",
          statusLabel: "Not found",
        }}
      />
    );
    expect(html).toContain("Run record not found");
  });

  test("renders uuid collision warning with both ids", () => {
    const html = renderToStaticMarkup(
      <ExceptionDetailRunContext
        run={{
          ...baseRun,
          recordFound: false,
          uuidCollision: true,
          collision: {
            reconJobId: "job-1",
            reconciliationRunId: "run-1",
          },
        }}
      />
    );
    expect(html).toContain("Ambiguous run id");
    expect(html).toContain("job-1");
    expect(html).toContain("run-1");
  });

  test("renders unknown normalized status without throwing", () => {
    const html = renderToStaticMarkup(
      <ExceptionDetailRunContext
        run={{
          ...baseRun,
          normalizedStatus: "unknown",
          statusLabel: "Unknown",
        }}
      />
    );
    expect(html).toContain("Unknown");
  });
});
