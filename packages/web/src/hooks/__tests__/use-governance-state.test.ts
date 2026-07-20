import { renderHook, waitFor } from "@testing-library/react";
import { useGovernanceState } from "../use-governance-state";

describe("useGovernanceState", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("loads the current freeze state", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          frozen: true,
          frozen_at: "2026-03-17T10:00:00Z",
          frozen_by: "operator@example.com",
          freeze_reason: "Maintenance",
          updated_at: "2026-03-17T10:00:00Z",
        },
      }),
    }) as typeof fetch;

    const { result } = renderHook(() => useGovernanceState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFrozen).toBe(true);
    expect(result.current.governanceState?.freeze_reason).toBe("Maintenance");
  });

  it("fails open on fetch errors while exposing the error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as typeof fetch;

    const { result } = renderHook(() => useGovernanceState());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFrozen).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
