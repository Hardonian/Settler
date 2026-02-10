import { query } from "../../db";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import {
  assertTenantScopedCollection,
  assertTenantScopedRecord,
} from "../utils/tenant-contract-assertions";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const queryMock = query as jest.MockedFunction<typeof query>;

describe("UserRepository tenantId contract", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns tenant-scoped users from findById/findByEmail/findAll", async () => {
    const repository = new UserRepository();

    const row = {
      id: "user-1",
      tenant_id: "tenant-1",
      email: "user@example.com",
      password_hash: "hashed",
      role: "developer",
      data_residency_region: "us",
      data_retention_days: 365,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-02T00:00:00.000Z",
      deleted_at: null,
      deletion_scheduled_at: null,
      name: null,
    };

    queryMock.mockResolvedValueOnce([row]);
    const byId = await repository.findById("user-1", "tenant-1");
    expect(byId).not.toBeNull();
    assertTenantScopedRecord(byId as { tenantId: string }, "tenant-1");

    queryMock.mockResolvedValueOnce([row]);
    const byEmail = await repository.findByEmail("user@example.com", "tenant-1");
    expect(byEmail).not.toBeNull();
    assertTenantScopedRecord(byEmail as { tenantId: string }, "tenant-1");

    queryMock.mockResolvedValueOnce([row]);
    const all = await repository.findAll("tenant-1", 10, 0);
    expect(all).toHaveLength(1);
    assertTenantScopedCollection(all as Array<{ tenantId: string }>, "tenant-1");
  });
});
