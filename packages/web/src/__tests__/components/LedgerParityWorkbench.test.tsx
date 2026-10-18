import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LedgerParityWorkbench } from "@/components/console/LedgerParityWorkbench";

describe("LedgerParityWorkbench", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          tenantId: "tenant-primary-production",
          timestamp: "2026-10-18T22:00:00.000Z",
          balanceSheet: {
            zeroSumInvariant: "PASS",
            twoPhaseCommitInvariant: "PASS",
            totalPostedDebits: "500000000",
            totalPostedCredits: "500000000",
            totalPendingDebits: "0",
            totalPendingCredits: "0",
            imbalanceCents: "0",
          },
          crossLedgerVolume: {
            invariant: "PASS",
            tigerBeetleClearedVolumeCents: "500000000",
            relationalMatchedVolumeCents: "500000000",
            varianceCents: "0",
            varianceRatioPercent: 0.0,
            acceptableThresholdCents: "100",
          },
          discrepancies: [],
          proof: {
            smtEpochRoot: "0x1122334455667788",
            attestationHash: "0x8877665544332211",
            signerId: "tigerbeetle-parity-attestor-v1",
            timestamp: "2026-10-18T22:00:00.000Z",
          },
          accounts: [
            {
              id: "1001",
              code: 100,
              ledger: 1,
              debitsPosted: "500000000",
              creditsPosted: "0",
              debitsPending: "0",
              creditsPending: "0",
              netPosted: "500000000",
            },
          ],
        },
      }),
    });
  });

  it("renders TigerBeetle parity invariant indicators and status cards", async () => {
    render(<LedgerParityWorkbench />);

    expect(screen.getByText(/TigerBeetle Live Parity Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/Double-Entry Zero-Sum/i)).toBeInTheDocument();
    expect(screen.getByText(/Two-Phase Commit \(2PC\)/i)).toBeInTheDocument();
    expect(screen.getByText(/TB vs Postgres Clearing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Dual-Ledger Invariants In Parity/i)).toBeInTheDocument();
    });
  });

  it("triggers a parity invariant sweep upon user action", async () => {
    render(<LedgerParityWorkbench />);

    const sweepBtn = screen.getByRole("button", { name: /Run Parity Invariant Sweep/i });
    expect(sweepBtn).toBeInTheDocument();

    fireEvent.click(sweepBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/console/ledger-parity",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ toleranceCents: "100" }),
        })
      );
    });
  });
});
