export interface TenantScopedRecord {
  tenantId: string;
}

export interface TenantScopedEventMetadata {
  metadata: {
    tenant_id: string;
  };
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

export function assertTenantScopedEventMetadata<T extends TenantScopedEventMetadata>(
  event: T,
  expectedTenantId: string
): void {
  expect(event.metadata).toBeDefined();
  expect(event.metadata.tenant_id).toBeDefined();
  expect(event.metadata.tenant_id).toBe(expectedTenantId);
}

export function assertTenantScopedEventCollection<T extends TenantScopedEventMetadata>(
  events: T[],
  expectedTenantId: string
): void {
  for (const event of events) {
    assertTenantScopedEventMetadata(event, expectedTenantId);
  }
}

export function assertTenantEntityId<T extends { id: string }>(
  entity: T,
  expectedTenantId: string
): void {
  expect(entity.id).toBeDefined();
  expect(entity.id).toBe(expectedTenantId);
}
