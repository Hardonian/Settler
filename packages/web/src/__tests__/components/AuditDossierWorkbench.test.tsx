import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuditDossierWorkbench } from "../../components/console/AuditDossierWorkbench";

describe("AuditDossierWorkbench", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it("renders audit dossier details and census population metrics", () => {
    render(<AuditDossierWorkbench />);

    expect(screen.getByText(/Cryptographic Audit Dossier Explorer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/100% Census Population/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/SOC-1 Type II Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Audited Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-discrepancy attested/i)).toBeInTheDocument();
  });

  it("executes the in-browser WASM verification sandbox", async () => {
    jest.useFakeTimers();
    render(<AuditDossierWorkbench />);

    const runWasmBtn = screen.getByRole("button", { name: /Run In-Browser WASM Check/i });
    expect(runWasmBtn).toBeInTheDocument();

    fireEvent.click(runWasmBtn);

    expect(screen.getByText(/Verifying Proofs/i)).toBeInTheDocument();

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText(/WASM Cryptographically Verified/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /ZERO-KNOWLEDGE PROOF VALIDATED: Root hash matches deterministic consensus state/i
        )
      ).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("triggers dossier synthesis API call", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          dossierId: "dossier-test-fresh-01",
          title: "Fresh Synthesized Audit Dossier",
          summary: "Newly generated proofpack.",
          reportingPeriod: { from: "2026-09-01", to: "2026-10-01" },
          censusStatistics: {
            totalTransactionsAnalyzed: 50000,
            totalVolumeCents: 500000000,
            matchingRatePercent: 100.0,
            totalDiscrepancies: 0,
            samplePopulationPercent: 100.0,
          },
          cryptographicProofs: {
            smtEpochRoot: "0x1234567890abcdef",
            sha256Digest: "0xabcdef1234567890",
            merkleLeafCount: 50000,
            wasmVerificationSnippet:
              "npx @settler/cli verify-proof --dossier dossier-test-fresh-01",
          },
          complianceSignoff: {
            soc1Ready: true,
            pciDssCompliant: true,
            zeroDiscrepancyAttested: true,
          },
          generatedAt: new Date().toISOString(),
        },
      }),
    });

    render(<AuditDossierWorkbench />);

    const synthBtn = screen.getByRole("button", { name: /Synthesize Fresh Dossier/i });
    fireEvent.click(synthBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/console/audit-dossier",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Fresh Synthesized Audit Dossier/i)).toBeInTheDocument();
    });
  });
});
