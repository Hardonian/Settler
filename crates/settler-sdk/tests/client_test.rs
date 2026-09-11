use settler_sdk::{SettlerClient, TransactionLeaf};

#[test]
fn test_reconcile_batch_deterministic() {
    let client = SettlerClient::new(Some("tenant_enterprise_01".to_string()));
    let leaves = vec![
        TransactionLeaf {
            tenant_id: "tenant_enterprise_01".to_string(),
            transaction_id: "tx_001".to_string(),
            rail: "stripe".to_string(),
            amount_cents: 5000,
            fee_cents: 145,
            currency: "USD".to_string(),
        },
        TransactionLeaf {
            tenant_id: "tenant_enterprise_01".to_string(),
            transaction_id: "tx_002".to_string(),
            rail: "paypal".to_string(),
            amount_cents: 12000,
            fee_cents: 348,
            currency: "USD".to_string(),
        },
    ];

    let evidence = client
        .reconcile_batch("tenant_enterprise_01", "batch_9901", &leaves)
        .expect("reconciliation should succeed");

    assert_eq!(evidence.tenant_id, "tenant_enterprise_01");
    assert_eq!(evidence.batch_id, "batch_9901");
    assert_eq!(evidence.total_gross_cents, 17000);
    assert_eq!(evidence.total_fees_cents, 493);
    assert_eq!(evidence.total_net_cents, 16507);
    assert_eq!(evidence.leaf_count, 2);
    assert_eq!(evidence.merkle_root_hex.len(), 64);
}

#[test]
fn test_tenant_isolation_mismatch_rejected() {
    let client = SettlerClient::new(None);
    let leaves = vec![TransactionLeaf {
        tenant_id: "tenant_attacker".to_string(),
        transaction_id: "tx_rogue".to_string(),
        rail: "stripe".to_string(),
        amount_cents: 1000,
        fee_cents: 30,
        currency: "USD".to_string(),
    }];

    let err = client.reconcile_batch("tenant_victim", "batch_9902", &leaves);
    assert!(err.is_err());
}
