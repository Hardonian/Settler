import { trackSyncComplete, metrics } from "../metrics/prometheus";

describe("Prometheus Metrics - trackSyncComplete", () => {
  beforeEach(() => {
    metrics.reset();
  });

  it("should record sync completion with mandatory labels and metrics", () => {
    trackSyncComplete("conn_123", "tenant_abc", 5000, {});

    const exported = metrics.export();

    // Check completed counter
    expect(exported).toContain(
      'settler_sync_completed_total{connector_id="conn_123",tenant_id="tenant_abc",status="success"} 1'
    );

    // Check duration histogram
    expect(exported).toContain('settler_sync_duration_seconds{connector_id="conn_123"}_sum 5');
    expect(exported).toContain('settler_sync_duration_seconds{connector_id="conn_123"}_count 1');

    // Check in_progress gauge is set to 0
    expect(exported).toContain(
      'settler_sync_in_progress{connector_id="conn_123",tenant_id="tenant_abc"} 0'
    );
  });

  it("should record transaction counts if provided", () => {
    trackSyncComplete("conn_123", "tenant_abc", 5000, { transactions: 42 });

    const exported = metrics.export();

    // Check transaction counter
    expect(exported).toContain('settler_transactions_synced_total{connector_id="conn_123"} 42');
  });

  it("should record account counts if provided", () => {
    trackSyncComplete("conn_123", "tenant_abc", 5000, { accounts: 10 });

    const exported = metrics.export();

    // Check account counter
    expect(exported).toContain('settler_accounts_synced_total{connector_id="conn_123"} 10');
  });

  it("should record multiple counts if provided", () => {
    trackSyncComplete("conn_123", "tenant_abc", 5000, {
      transactions: 25,
      accounts: 5,
    });

    const exported = metrics.export();

    expect(exported).toContain('settler_transactions_synced_total{connector_id="conn_123"} 25');
    expect(exported).toContain('settler_accounts_synced_total{connector_id="conn_123"} 5');
  });
});
