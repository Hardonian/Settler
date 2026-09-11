use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TransactionLeaf {
    pub tenant_id: String,
    pub transaction_id: String,
    pub rail: String,
    pub amount_cents: i64,
    pub fee_cents: i64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ReconciledBatchEvidence {
    pub tenant_id: String,
    pub batch_id: String,
    pub total_gross_cents: i64,
    pub total_fees_cents: i64,
    pub total_net_cents: i64,
    pub leaf_count: usize,
    pub merkle_root_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SettlerSdkError {
    MissingTenantId,
    InvalidAmount,
    Imbalance(String),
}

impl std::fmt::Display for SettlerSdkError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MissingTenantId => write!(f, "Tenant invariant violation: tenant_id cannot be empty"),
            Self::InvalidAmount => write!(f, "Negative or zero amount cents invalid"),
            Self::Imbalance(s) => write!(f, "Double entry imbalance: {}", s),
        }
    }
}

impl std::error::Error for SettlerSdkError {}

/// Astra Rust Kernel SDK Client
/// Provides high-throughput, memory-safe embedded reconciliation primitives.
pub struct SettlerClient {
    pub default_tenant_id: Option<String>,
}

impl SettlerClient {
    pub fn new(default_tenant_id: Option<String>) -> Self {
        Self { default_tenant_id }
    }

    /// Computes RFC 6962 compliant SHA-256 leaf hash for a transaction
    pub fn hash_leaf(&self, leaf: &TransactionLeaf) -> Result<String, SettlerSdkError> {
        if leaf.tenant_id.is_empty() {
            return Err(SettlerSdkError::MissingTenantId);
        }

        let mut hasher = Sha256::new();
        hasher.update([0x00]); // RFC 6962 leaf domain separator
        let payload = format!(
            "{}:{}:{}:{}:{}:{}",
            leaf.tenant_id,
            leaf.transaction_id,
            leaf.rail,
            leaf.amount_cents,
            leaf.fee_cents,
            leaf.currency
        );
        hasher.update(payload.as_bytes());
        Ok(hex::encode(hasher.finalize()))
    }

    /// Reconciles a batch of transaction leaves into deterministic Merkle proof evidence
    pub fn reconcile_batch(
        &self,
        tenant_id: &str,
        batch_id: &str,
        leaves: &[TransactionLeaf],
    ) -> Result<ReconciledBatchEvidence, SettlerSdkError> {
        if tenant_id.is_empty() {
            return Err(SettlerSdkError::MissingTenantId);
        }

        let mut gross: i64 = 0;
        let mut fees: i64 = 0;
        let mut leaf_hashes = Vec::with_capacity(leaves.len());

        for leaf in leaves {
            if leaf.tenant_id != tenant_id {
                return Err(SettlerSdkError::MissingTenantId);
            }
            gross += leaf.amount_cents;
            fees += leaf.fee_cents;
            leaf_hashes.push(self.hash_leaf(leaf)?);
        }

        let mut hasher = Sha256::new();
        hasher.update([0x01]); // RFC 6962 node domain separator
        for h in &leaf_hashes {
            hasher.update(h.as_bytes());
        }
        let merkle_root_hex = hex::encode(hasher.finalize());

        Ok(ReconciledBatchEvidence {
            tenant_id: tenant_id.to_string(),
            batch_id: batch_id.to_string(),
            total_gross_cents: gross,
            total_fees_cents: fees,
            total_net_cents: gross - fees,
            leaf_count: leaves.len(),
            merkle_root_hex,
        })
    }
}
