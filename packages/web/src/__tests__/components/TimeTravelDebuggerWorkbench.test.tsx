import { act, fireEvent, render, screen } from "@testing-library/react";
import { TimeTravelDebuggerWorkbench } from "../../components/console/TimeTravelDebuggerWorkbench";

describe("TimeTravelDebuggerWorkbench", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          tenantId: "00000000-0000-4000-8000-000000000001",
          asOfTimestamp: "2026-10-18T18:55:00.000Z",
          asOfEpoch: 5,
          totalPostedDebitsCents: "1250000",
          totalPostedCreditsCents: "1250000",
          totalPendingDebitsCents: "0",
          totalPendingCreditsCents: "0",
          isDoubleEntryBalanced: true,
          isTwoPhaseBalanced: true,
          driftDetected: false,
          driftMagnitudeCents: 0,
          smtStateRoot: "0x7a9c3b88f21e05d21498c603125ab4430f81d9f041235bc6e9112458acde9231",
          accountCount: 5,
          accounts: [
            {
              accountId: "1010",
              name: "Operating Cash (Chase Treasury)",
              type: "asset",
              debitsPosted: "971000",
              creditsPosted: "250000",
              debitsPending: "0",
              creditsPending: "0",
              netBalanceCents: 721000,
              smtLeafHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            {
              accountId: "1020",
              name: "Stripe Settlement Clearing",
              type: "asset",
              debitsPosted: "1000000",
              creditsPosted: "1000000",
              debitsPending: "0",
              creditsPending: "0",
              netBalanceCents: 0,
              smtLeafHash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            },
          ],
        },
      }),
    });
  });

  it("renders Time-Travel Forensic Financial Debugger title and scrubber", async () => {
    await act(async () => {
      render(<TimeTravelDebuggerWorkbench />);
    });

    expect(
      screen.getByRole("heading", { name: /Time-Travel Forensic Financial Debugger/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/SMT-256 Microsecond Flight Recorder/i)).toBeInTheDocument();
    expect(screen.getByText(/ZERO-SUM BALANCED/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Replay/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Genesis/i })).toBeInTheDocument();
    expect(screen.getByText(/Deterministic SMT State Root:/i)).toBeInTheDocument();
  });

  it("interacts with timeline scrubber and toggles playback", async () => {
    await act(async () => {
      render(<TimeTravelDebuggerWorkbench />);
    });

    const replayBtn = screen.getByRole("button", { name: /Replay/i });
    act(() => {
      fireEvent.click(replayBtn);
    });

    // Button should toggle to Pause
    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
    });
    expect(screen.getByRole("button", { name: /Replay/i })).toBeInTheDocument();
  });
});
