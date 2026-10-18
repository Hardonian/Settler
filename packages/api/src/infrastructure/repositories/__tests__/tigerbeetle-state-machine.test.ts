import {
  createClient,
  CreateAccountStatus,
  CreateTransferStatus,
  TransferFlags,
  type Account,
  type Transfer,
} from "tigerbeetle-node";
import { TigerBeetleLedgerRepository } from "../TigerBeetleLedgerRepository";

jest.mock("tigerbeetle-node", () => {
  const actual = jest.requireActual("tigerbeetle-node");
  return { ...actual, createClient: jest.fn() };
});

describe("TigerBeetle two-phase and tenant ownership invariants", () => {
  const tenantAlpha = "00000000-0000-4000-8000-0000000000a1";
  const tenantBeta = "00000000-0000-4000-8000-0000000000b2";
  let accounts: Map<bigint, Account>;
  let transfers: Map<bigint, Transfer>;
  let createdTransfers: Transfer[];
  let repository: TigerBeetleLedgerRepository;

  beforeEach(() => {
    accounts = new Map();
    transfers = new Map();
    createdTransfers = [];
    const client = {
      lookupAccounts: jest.fn(async (ids: bigint[]) =>
        ids.flatMap((id) => (accounts.has(id) ? [accounts.get(id)!] : []))
      ),
      createAccounts: jest.fn(async (items: Account[]) => {
        for (const item of items) accounts.set(item.id, item);
        return items.map((_, index) => ({ index, status: CreateAccountStatus.created }));
      }),
      lookupTransfers: jest.fn(async (ids: bigint[]) =>
        ids.flatMap((id) => (transfers.has(id) ? [transfers.get(id)!] : []))
      ),
      createTransfers: jest.fn(async (items: Transfer[]) => {
        return items.map((item, index) => {
          if (transfers.has(item.id)) {
            return { index, status: CreateTransferStatus.exists };
          }
          transfers.set(item.id, item);
          createdTransfers.push(item);
          return { index, status: CreateTransferStatus.created };
        });
      }),
      getAccountTransfers: jest.fn(async () => []),
      destroy: jest.fn(),
    };
    jest.mocked(createClient).mockResolvedValue(client as never);
    repository = new TigerBeetleLedgerRepository();
  });

  afterEach(async () => {
    await repository.close();
  });

  it("stores and verifies tenant ownership independently of caller-supplied IDs", async () => {
    const account = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "asset",
      name: "cash",
    });

    await expect(repository.getAccount(account.id, tenantAlpha)).resolves.toMatchObject({
      tenantId: tenantAlpha,
    });
    await expect(repository.getAccount(account.id, tenantBeta)).resolves.toBeNull();
  });

  it("uses pending, post-pending, and void-pending flags with deterministic bigint IDs", async () => {
    const debit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "asset",
      name: "debit",
    });
    const credit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "liability",
      name: "credit",
    });

    const pending = await repository.createPendingTransfer({
      tenantId: tenantAlpha,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      amount: { value: 10.29, currency: "USD" },
      idempotencyKey: "authorization-1",
    });
    expect(createdTransfers[0]!.flags).toBe(TransferFlags.pending);
    expect(createdTransfers[0]!.amount).toBe(1029n);
    expect(typeof createdTransfers[0]!.id).toBe("bigint");

    await repository.postPendingTransfer(pending.id, tenantAlpha);
    expect(createdTransfers[1]!.flags).toBe(TransferFlags.post_pending_transfer);
    expect(createdTransfers[1]!.pending_id).toBe(createdTransfers[0]!.id);

    const secondPending = await repository.createPendingTransfer({
      tenantId: tenantAlpha,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      amount: { value: 5, currency: "USD" },
      idempotencyKey: "authorization-2",
    });
    await repository.reverseTransfer({
      tenantId: tenantAlpha,
      transferId: secondPending.id,
      reason: "authorization expired",
    });
    expect(createdTransfers.at(-1)!.flags).toBe(TransferFlags.void_pending_transfer);
    expect(createdTransfers.at(-1)!.pending_id).toBe(createdTransfers[2]!.id);
    expect(createdTransfers.at(-1)!.amount).toBe(0n);
  });

  it("rejects fractional minor units instead of rounding financial values", async () => {
    const debit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "asset",
      name: "debit",
    });
    const credit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "liability",
      name: "credit",
    });

    await expect(
      repository.postTransfer({
        tenantId: tenantAlpha,
        debitAccountId: debit.id,
        creditAccountId: credit.id,
        amount: { value: 1.001, currency: "USD" },
        idempotencyKey: "invalid-precision",
      })
    ).rejects.toThrow(/two decimal minor units/);
  });

  it("collapses concurrent retries onto one deterministic transfer", async () => {
    const debit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "asset",
      name: "race-debit",
    });
    const credit = await repository.createAccount({
      tenantId: tenantAlpha,
      type: "liability",
      name: "race-credit",
    });

    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        repository.postTransfer({
          tenantId: tenantAlpha,
          debitAccountId: debit.id,
          creditAccountId: credit.id,
          amount: { value: 19.99, currency: "USD" },
          idempotencyKey: "same-webhook-delivery",
        })
      )
    );

    expect(new Set(results.map((result) => result.id)).size).toBe(1);
    expect(createdTransfers).toHaveLength(1);
  });
});
