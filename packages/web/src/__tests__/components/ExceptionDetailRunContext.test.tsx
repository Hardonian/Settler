/** @jest-environment jsdom */

import { renderToStaticMarkup } from "react-dom/server";
import { ExceptionDetailRunContext } from "@/components/console/ExceptionDetailRunContext";

describe("ExceptionDetailRunContext", () => {
  const baseRun = {
    id: "66666666-7777-4888-8999-aaaaaaaaaaaa",
    name: "Nightly Stripe ↔ Ledger",
    status: "completed",
    createdAt: "2026-02-01T08:00:00.000Z",
    startedAt: "2026-02-01T08:05:00.000Z",
    completedAt: "2026-02-01T08:10:00.000Z",
    ingestionId: "ing-1",
    href: "/console/runs/66666666-7777-4888-8999-aaaaaaaaaaaa",
    recordFound: true,
  };

  test("renders run name, status, and drift actions are not part of this component", () => {
    const html = renderToStaticMarkup(<ExceptionDetailRunContext run={baseRun} />);
    expect(html).toContain("Nightly Stripe");
    expect(html).toContain("66666666-7777-4888-8999-aaaaaaaaaaaa");
    expect(html).toContain("completed");
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
          status: null,
          createdAt: null,
          startedAt: null,
          completedAt: null,
          ingestionId: null,
          recordFound: false,
        }}
      />
    );
    expect(html).toContain("Run record not found");
  });

  test("renders unusual run status without throwing", () => {
    const html = renderToStaticMarkup(
      <ExceptionDetailRunContext run={{ ...baseRun, status: "archived" }} />
    );
    expect(html).toContain("archived");
  });
});
