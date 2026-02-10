export interface TenantScopedRecord {
  tenantId: string;
}

export function assertTenantScopedRecord<T extends TenantScopedRecord>(
  record: T,
  expectedTenantId: string
): void {
  expect(record.tenantId).toBeDefined();
  expect(record.tenantId).toBe(expectedTenantId);
}

export function assertTenantScopedCollection<T extends TenantScopedRecord>(
  records: T[],
  expectedTenantId: string
): void {
  for (const record of records) {
    assertTenantScopedRecord(record, expectedTenantId);
  }
}
