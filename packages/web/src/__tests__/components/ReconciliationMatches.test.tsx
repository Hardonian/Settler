import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReconciliationMatches } from "@/components/console/ReconciliationMatches";

const mockUseGovernanceState = jest.fn();

jest.mock("@/hooks/use-governance-state", () => ({
  useGovernanceState: () => mockUseGovernanceState(),
}));

describe("ReconciliationMatches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGovernanceState.mockReturnValue({
      isFrozen: false,
      governanceState: null,
    });
  });

  it("disables review controls when the tenant is frozen", async () => {
    mockUseGovernanceState.mockReturnValue({
      isFrozen: true,
      governanceState: {
        frozen: true,
        frozen_at: "2026-03-17T10:00:00Z",
        frozen_by: "operator@example.com",
        freeze_reason: "Validation lock",
        updated_at: "2026-03-17T10:00:00Z",
      },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: "match-1",
            matchType: "manual",
            confidence: 0.95,
            matchReason: "Operator-reviewed",
            amountDiff: 0,
            dateDiff: 0,
            reviewed: false,
            source: {
              id: "src-1",
              amount: 100,
              currency: "USD",
              date: "2026-03-17T10:00:00Z",
              description: "Source",
              externalId: null,
            },
            target: {
              id: "tgt-1",
              amount: 100,
              currency: "USD",
              date: "2026-03-17T10:00:00Z",
              description: "Target",
              externalId: null,
            },
          },
        ],
      }),
    }) as typeof fetch;

    render(<ReconciliationMatches runId="run-1" runKind="ingestion_run" />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    expect(screen.getByText("Action blocked by tenant freeze")).toBeInTheDocument();
  });

  it("shows governance recovery guidance when review mutation is freeze-blocked", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              id: "match-1",
              matchType: "manual",
              confidence: 0.95,
              matchReason: "Operator-reviewed",
              amountDiff: 0,
              dateDiff: 0,
              reviewed: false,
              source: {
                id: "src-1",
                amount: 100,
                currency: "USD",
                date: "2026-03-17T10:00:00Z",
                description: "Source",
                externalId: null,
              },
              target: {
                id: "tgt-1",
                amount: 100,
                currency: "USD",
                date: "2026-03-17T10:00:00Z",
                description: "Target",
                externalId: null,
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 423,
        json: async () => ({
          error: "GOVERNANCE_FREEZE_ACTIVE",
          message: "Writes are blocked",
          freeze_reason: "Validation lock",
          frozen_at: "2026-03-17T10:00:00Z",
        }),
      }) as typeof fetch;

    render(<ReconciliationMatches runId="run-1" runKind="ingestion_run" />);

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("Action blocked by tenant freeze")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /open governance controls/i })).toHaveAttribute(
      "href",
      "/console/settings?tab=governance#governance"
    );
  });
});
