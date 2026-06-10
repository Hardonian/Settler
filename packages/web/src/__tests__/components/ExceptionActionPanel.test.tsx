import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExceptionActionPanel } from "@/app/console/exceptions/[exceptionId]/components";

const refresh = jest.fn();

jest.mock("@/hooks/use-governance-state", () => ({
  useGovernanceState: () => ({
    isFrozen: false,
    governanceState: null,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

describe("ExceptionActionPanel", () => {
  beforeEach(() => {
    refresh.mockReset();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Updated" }),
    }) as typeof fetch;
  });

  it("shows resolve and ignore actions for pending exceptions", () => {
    render(<ExceptionActionPanel exceptionId="exc-1" status="pending" />);

    expect(screen.getByRole("button", { name: "Resolve exception" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ignore exception" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen exception" })).not.toBeInTheDocument();
  });

  it("shows reopen action for resolved exceptions", () => {
    render(<ExceptionActionPanel exceptionId="exc-1" status="resolved" />);

    expect(screen.getByRole("button", { name: "Reopen exception" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resolve exception" })).not.toBeInTheDocument();
  });

  it("submits the selected action with notes and refreshes the page", async () => {
    render(<ExceptionActionPanel exceptionId="exc-1" status="pending" />);

    fireEvent.change(screen.getByPlaceholderText(/why was this resolved/i), {
      target: { value: "Confirmed against ledger export." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resolve exception" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/exceptions/exc-1?action=resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "Confirmed against ledger export." }),
      });
    });

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows a governance recovery alert when the action is freeze-blocked", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 423,
      json: async () => ({
        error: "GOVERNANCE_FREEZE_ACTIVE",
        message: "Writes are blocked",
        freeze_reason: "Maintenance window",
        frozen_at: "2026-03-17T10:00:00Z",
      }),
    }) as typeof fetch;

    render(<ExceptionActionPanel exceptionId="exc-1" status="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Resolve exception" }));

    await waitFor(() => {
      expect(screen.getByText("Action blocked by tenant freeze")).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
