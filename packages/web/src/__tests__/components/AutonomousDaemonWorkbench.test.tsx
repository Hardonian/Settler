import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AutonomousDaemonWorkbench } from "@/components/console/AutonomousDaemonWorkbench";

describe("AutonomousDaemonWorkbench", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        metrics: {
          status: "IDLE",
          currentTick: 125,
          activeLeaseId: "daemon-lease-worker-01-us-east",
          leaseExpiresAt: "2026-10-18T22:00:00.000Z",
          consecutiveFailures: 0,
          circuitBroken: false,
          totalSettledVolumeCents: 150000000,
          totalTripletsSettled: 850,
          avgTickDurationMs: 12.4,
          lastTickTimestamp: "2026-10-18T21:55:00.000Z",
          stagingCounts: {
            pendingOrders: 10,
            pendingCaptures: 8,
            pendingSweeps: 4,
          },
        },
      }),
    });
  });

  it("renders the continuous settlement daemon title and primary KPI metrics", async () => {
    render(<AutonomousDaemonWorkbench />);

    expect(screen.getByText(/Continuous Settlement Daemon/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Settled Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Micro-Loop Frequency/i)).toBeInTheDocument();
    expect(screen.getByText(/Circuit Breaker/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/daemon-lease-worker-01-us-east/i)).toBeInTheDocument();
    });
  });

  it("allows triggering a manual settlement tick", async () => {
    render(<AutonomousDaemonWorkbench />);

    const tickButton = screen.getByRole("button", { name: /Trigger Tick Now/i });
    expect(tickButton).toBeInTheDocument();

    fireEvent.click(tickButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/console/daemon",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ force: true }),
        })
      );
    });
  });

  it("toggles auto-refresh state", () => {
    render(<AutonomousDaemonWorkbench />);

    const autoRefreshBtn = screen.getByRole("button", { name: /Auto-refresh ON/i });
    expect(autoRefreshBtn).toBeInTheDocument();

    fireEvent.click(autoRefreshBtn);
    expect(screen.getByRole("button", { name: /Auto-refresh PAUSED/i })).toBeInTheDocument();
  });
});
