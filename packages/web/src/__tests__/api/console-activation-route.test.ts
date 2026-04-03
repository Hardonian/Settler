/** @jest-environment node */

const getConsoleActivationOverviewMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/server/console/activation-overview", () => ({
  getConsoleActivationOverview: (...args: unknown[]) => getConsoleActivationOverviewMock(...args),
}));

import { GET as getActivation } from "@/app/api/console/activation/route";

describe("GET /api/console/activation", () => {
  beforeEach(() => {
    getConsoleActivationOverviewMock.mockReset();
  });

  it("returns support bundle with explicit blockers", async () => {
    getConsoleActivationOverviewMock.mockResolvedValue({
      generatedAt: "2026-04-03T00:00:00.000Z",
      overallState: "degraded",
      authState: "authenticated",
      counts: {
        workspaces: 1,
        activeWorkspaces: 1,
        connectedIntegrations: 0,
        reconciliationRuns: 0,
        unresolvedExceptions: 0,
        adjudicationMemories: 0,
        evidenceArtifacts: 0,
        degradedEvidenceArtifacts: 0,
        finalizedProofPackages: 0,
      },
      workspaces: [],
      systemChecks: [],
      journeyChecks: [],
      tasks: [],
      supportBundle: {
        generatedAt: "2026-04-03T00:00:00.000Z",
        summary: "1 activation blocker requires follow-up.",
        blockers: [
          {
            id: "integration_readiness",
            label: "Integration readiness",
            state: "setup_required",
            summary: "No integration connected",
            detail: "Connect data source",
            actionLabel: "Connect data",
            href: "/console/onboarding",
          },
        ],
        recommendedNextActions: ["Connect data: Integration readiness"],
      },
      lastRunAt: null,
      lastDecisionAt: null,
    });

    const response = await getActivation();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.supportBundle.blockers).toHaveLength(1);
    expect(payload.data.supportBundle.blockers[0].state).toBe("setup_required");
  });
});
