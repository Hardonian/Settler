import os from "node:os";
import { getLedgerService } from "../../domain/services/LedgerService";
import { LedgerConnectionError } from "../../domain/LedgerError";

const describeOrSkip = os.platform() === "win32" ? describe.skip : describe;

describeOrSkip("Ledger Fail Closed (H1/H2)", () => {
  it("should throw LedgerConnectionError when TigerBeetle is offline/fails to initialize", async () => {
    // Force a bad address
    const service = getLedgerService({
      enabled: true,
      address: "255.255.255.255:9999",
      timeoutMs: 100,
    });
    const repo = service.getRepository();

    await expect(repo.ping()).resolves.toBe(false);

    await expect(
      repo.createAccount({ tenantId: "t1", name: "test", type: "asset" })
    ).rejects.toThrow(LedgerConnectionError);
  });
});
