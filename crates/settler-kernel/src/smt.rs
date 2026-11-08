use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::OnceLock;

/// Tree depth for 256-bit keys (SHA-256 digests)
pub const SMT_DEPTH: usize = 256;

static EMPTY_HASHES_CACHE: OnceLock<Vec<[u8; 32]>> = OnceLock::new();

/// Deterministically computes the SHA-256 hash of two 32-byte chunks with domain separator (0x01)
pub fn hash_nodes(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update([0x01]); // Domain separator for internal node
    hasher.update(left);
    hasher.update(right);
    hasher.finalize().into()
}

/// Deterministically computes the leaf hash for a key-value pair
pub fn hash_leaf(key: &[u8; 32], value: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update([0x00]); // Domain separator for leaf
    hasher.update(key);
    hasher.update(value);
    hasher.finalize().into()
}

/// Canonical domain-separated hash for an unoccupied leaf.
pub fn hash_empty_leaf() -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update([0x00]);
    hasher.finalize().into()
}

/// Precomputes the deterministic default empty hashes for all 257 depths (0..=256).
/// `empty_hashes[256]` is the domain-separated canonical empty leaf hash.
/// `empty_hashes[d]` is `hash_nodes(&empty_hashes[d+1], &empty_hashes[d+1])`.
pub fn get_empty_hashes() -> Vec<[u8; 32]> {
    EMPTY_HASHES_CACHE
        .get_or_init(|| {
            let mut empty = vec![[0u8; 32]; SMT_DEPTH + 1];
            // Depth 256 is the empty leaf
            empty[SMT_DEPTH] = hash_empty_leaf();
            for d in (0..SMT_DEPTH).rev() {
                empty[d] = hash_nodes(&empty[d + 1], &empty[d + 1]);
            }
            empty
        })
        .clone()
}

/// A Sparse Merkle Tree Proof for inclusion or non-inclusion
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SmtProof {
    /// 32-byte key in hex format
    pub key_hex: String,
    /// 32-byte value in hex format, or None for non-inclusion proof
    pub value_hex: Option<String>,
    /// Sibling hashes from leaf to root (length SMT_DEPTH = 256) in hex
    pub siblings_hex: Vec<String>,
    /// Expected root hash in hex format
    pub root_hex: String,
    /// Whether this is an inclusion proof or a non-inclusion proof
    pub is_inclusion: bool,
}

/// A Compact Sparse Merkle Tree Proof that compresses default empty hashes
/// via a 256-bit presence bitmap.
/// Reduces wire payload size by >90% (e.g. from 16.4 KB down to ~300-800 bytes).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CompactSmtProof {
    /// 32-byte key in hex format
    pub key_hex: String,
    /// 32-byte value in hex format, or None for non-inclusion proof
    pub value_hex: Option<String>,
    /// 32-byte presence bitmap (64 hex chars, MSB at index 0).
    /// Bit `i` is 1 if sibling `i` (from depth 255 to 0) is explicit, 0 if it is the canonical empty hash.
    pub presence_bitmap_hex: String,
    /// Vector of non-empty sibling hashes in hex format
    pub non_empty_siblings_hex: Vec<String>,
    /// Expected root hash in hex format
    pub root_hex: String,
    /// Whether this is an inclusion proof or non-inclusion proof
    pub is_inclusion: bool,
}

/// Verification result for SMT proof
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SmtVerificationResult {
    pub valid: bool,
    pub computed_root: String,
    pub expected_root: String,
    pub is_non_inclusion: bool,
    pub error: Option<String>,
}

impl SmtVerificationResult {
    #[inline]
    pub fn is_ok(&self) -> bool {
        self.valid
    }

    #[inline]
    pub fn is_err(&self) -> bool {
        !self.valid
    }

    #[inline]
    pub fn unwrap(self) -> Self {
        if !self.valid {
            panic!(
                "called `SmtVerificationResult::unwrap()` on an invalid result: {:?}",
                self.error
            );
        }
        self
    }
}

/// In-memory Sparse Merkle Tree (SMT-256)
#[derive(Debug, Clone)]
pub struct SparseMerkleTree {
    root: [u8; 32],
    empty_hashes: Vec<[u8; 32]>,
    /// Map from (depth, path_prefix_bits) or node_hash to children
    nodes: HashMap<[u8; 32], ([u8; 32], [u8; 32])>,
    /// Map from key to value
    entries: HashMap<[u8; 32], [u8; 32]>,
}

impl Default for SparseMerkleTree {
    fn default() -> Self {
        Self::new()
    }
}

impl SparseMerkleTree {
    /// Creates a new empty Sparse Merkle Tree
    pub fn new() -> Self {
        let empty_hashes = get_empty_hashes();
        let root = empty_hashes[0];
        Self {
            root,
            empty_hashes,
            nodes: HashMap::new(),
            entries: HashMap::new(),
        }
    }

    /// Returns the current 32-byte root hash
    pub fn root(&self) -> [u8; 32] {
        self.root
    }

    /// Returns the current root hash as a hex string
    pub fn root_hex(&self) -> String {
        hex::encode(self.root)
    }

    /// Retrieves the value associated with a key, if present
    pub fn get(&self, key: &[u8; 32]) -> Option<[u8; 32]> {
        self.entries.get(key).copied()
    }

    /// Inserts or updates a key-value pair in the tree, updating the root hash
    pub fn update(&mut self, key: &[u8; 32], value: &[u8; 32]) -> [u8; 32] {
        self.entries.insert(*key, *value);

        // Compute siblings along the path
        let siblings = self.collect_siblings(key);

        // Recompute hashes upwards from leaf to root
        let mut current_hash = hash_leaf(key, value);

        for (depth_rev, sibling) in siblings.iter().enumerate() {
            let depth = SMT_DEPTH - 1 - depth_rev;
            let bit = get_bit(key, depth);
            let (left, right) = if bit == 0 {
                (current_hash, *sibling)
            } else {
                (*sibling, current_hash)
            };
            let parent_hash = hash_nodes(&left, &right);
            self.nodes.insert(parent_hash, (left, right));
            current_hash = parent_hash;
        }

        self.root = current_hash;
        self.root
    }

    /// Generates a cryptographic inclusion proof for an existing key
    pub fn prove_inclusion(&self, key: &[u8; 32]) -> Option<SmtProof> {
        let value = self.entries.get(key)?;
        let siblings = self.collect_siblings(key);
        let siblings_hex = siblings.iter().map(hex::encode).collect();

        Some(SmtProof {
            key_hex: hex::encode(key),
            value_hex: Some(hex::encode(value)),
            siblings_hex,
            root_hex: hex::encode(self.root),
            is_inclusion: true,
        })
    }

    /// Generates a cryptographic non-inclusion proof for a key that does not exist in the tree
    pub fn prove_non_inclusion(&self, key: &[u8; 32]) -> Option<SmtProof> {
        if self.entries.contains_key(key) {
            return None; // Key is present; cannot prove non-inclusion
        }

        let siblings = self.collect_siblings(key);
        let siblings_hex = siblings.iter().map(hex::encode).collect();

        Some(SmtProof {
            key_hex: hex::encode(key),
            value_hex: None,
            siblings_hex,
            root_hex: hex::encode(self.root),
            is_inclusion: false,
        })
    }

    /// Generates a compact cryptographic inclusion proof, omitting default empty hashes
    pub fn prove_compact_inclusion(&self, key: &[u8; 32]) -> Option<CompactSmtProof> {
        let full_proof = self.prove_inclusion(key)?;
        compress_smt_proof(&full_proof).ok()
    }

    /// Generates a compact cryptographic non-inclusion proof, omitting default empty hashes
    pub fn prove_compact_non_inclusion(&self, key: &[u8; 32]) -> Option<CompactSmtProof> {
        let full_proof = self.prove_non_inclusion(key)?;
        compress_smt_proof(&full_proof).ok()
    }

    /// Collects the sibling hashes for a key path (from leaf up to root)
    fn collect_siblings(&self, key: &[u8; 32]) -> Vec<[u8; 32]> {
        let mut siblings = Vec::with_capacity(SMT_DEPTH);
        let mut current_hash = self.root;

        for depth in 0..SMT_DEPTH {
            let bit = get_bit(key, depth);
            if let Some((left, right)) = self.nodes.get(&current_hash) {
                if bit == 0 {
                    siblings.push(*right);
                    current_hash = *left;
                } else {
                    siblings.push(*left);
                    current_hash = *right;
                }
            } else {
                // If node is uninstantiated, it is the default empty subtree
                let child_depth = depth + 1;
                siblings.push(self.empty_hashes[child_depth]);
                current_hash = self.empty_hashes[child_depth];
            }
        }

        // Sibling vector ordered from depth 255 (leaf sibling) to 0 (root sibling)
        siblings.reverse();
        siblings
    }
}

/// Extracts the i-th bit of a 256-bit key (0-indexed from MSB to LSB)
pub fn get_bit(key: &[u8; 32], index: usize) -> u8 {
    let byte_idx = index / 8;
    let bit_idx = 7 - (index % 8);
    (key[byte_idx] >> bit_idx) & 1
}

/// Verifies an SMT inclusion or non-inclusion proof against a declared root hash
pub fn verify_smt_proof(proof: &SmtProof) -> SmtVerificationResult {
    if proof.is_inclusion != proof.value_hex.is_some() {
        return SmtVerificationResult {
            valid: false,
            computed_root: String::new(),
            expected_root: proof.root_hex.clone(),
            is_non_inclusion: !proof.is_inclusion,
            error: Some("Proof kind is inconsistent with value_hex presence".to_string()),
        };
    }

    if !matches!(hex::decode(&proof.root_hex), Ok(bytes) if bytes.len() == 32) {
        return SmtVerificationResult {
            valid: false,
            computed_root: String::new(),
            expected_root: proof.root_hex.clone(),
            is_non_inclusion: !proof.is_inclusion,
            error: Some("Invalid root_hex format (expected 32 bytes)".to_string()),
        };
    }

    let key_bytes = match hex::decode(&proof.key_hex) {
        Ok(b) if b.len() == 32 => {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&b);
            arr
        }
        _ => {
            return SmtVerificationResult {
                valid: false,
                computed_root: String::new(),
                expected_root: proof.root_hex.clone(),
                is_non_inclusion: !proof.is_inclusion,
                error: Some("Invalid key_hex format (expected 32 bytes)".to_string()),
            }
        }
    };

    if proof.siblings_hex.len() != SMT_DEPTH {
        return SmtVerificationResult {
            valid: false,
            computed_root: String::new(),
            expected_root: proof.root_hex.clone(),
            is_non_inclusion: !proof.is_inclusion,
            error: Some(format!(
                "Invalid siblings length: expected {}, got {}",
                SMT_DEPTH,
                proof.siblings_hex.len()
            )),
        };
    }

    // Decode siblings
    let mut siblings = Vec::with_capacity(SMT_DEPTH);
    for s_hex in &proof.siblings_hex {
        match hex::decode(s_hex) {
            Ok(b) if b.len() == 32 => {
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&b);
                siblings.push(arr);
            }
            _ => {
                return SmtVerificationResult {
                    valid: false,
                    computed_root: String::new(),
                    expected_root: proof.root_hex.clone(),
                    is_non_inclusion: !proof.is_inclusion,
                    error: Some("Invalid sibling hash format (expected 32 bytes hex)".to_string()),
                }
            }
        }
    }

    // Determine initial leaf hash
    let mut current_hash = if let Some(ref val_hex) = proof.value_hex {
        let val_bytes = match hex::decode(val_hex) {
            Ok(b) if b.len() == 32 => {
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&b);
                arr
            }
            _ => {
                return SmtVerificationResult {
                    valid: false,
                    computed_root: String::new(),
                    expected_root: proof.root_hex.clone(),
                    is_non_inclusion: false,
                    error: Some("Invalid value_hex format (expected 32 bytes hex)".to_string()),
                }
            }
        };
        hash_leaf(&key_bytes, &val_bytes)
    } else {
        // Non-inclusion proof terminates at the canonical domain-separated empty leaf.
        hash_empty_leaf()
    };

    // Ascend tree from leaf to root
    for (depth_rev, sibling) in siblings.iter().enumerate() {
        let depth = SMT_DEPTH - 1 - depth_rev;
        let bit = get_bit(&key_bytes, depth);
        let (left, right) = if bit == 0 {
            (current_hash, *sibling)
        } else {
            (*sibling, current_hash)
        };
        current_hash = hash_nodes(&left, &right);
    }

    let computed_root_hex = hex::encode(current_hash);
    let valid = computed_root_hex.eq_ignore_ascii_case(&proof.root_hex);

    SmtVerificationResult {
        valid,
        computed_root: computed_root_hex,
        expected_root: proof.root_hex.clone(),
        is_non_inclusion: proof.value_hex.is_none(),
        error: if valid {
            None
        } else {
            Some("Root hash mismatch: computed root does not match declared root".to_string())
        },
    }
}

/// Compresses a standard 256-sibling SMT proof into a Compact SMT proof
pub fn compress_smt_proof(proof: &SmtProof) -> Result<CompactSmtProof, String> {
    if proof.siblings_hex.len() != SMT_DEPTH {
        return Err(format!(
            "Invalid siblings length for compression: expected {}, got {}",
            SMT_DEPTH,
            proof.siblings_hex.len()
        ));
    }

    let empty_hashes = get_empty_hashes();
    let mut bitmap = [0u8; 32];
    let mut non_empty_siblings_hex = Vec::new();

    for (depth_rev, sibling_hex) in proof.siblings_hex.iter().enumerate() {
        let depth = SMT_DEPTH - 1 - depth_rev;
        let expected_empty_hex = hex::encode(empty_hashes[depth + 1]);

        if !sibling_hex.eq_ignore_ascii_case(&expected_empty_hex) {
            let byte_idx = depth_rev / 8;
            let bit_idx = 7 - (depth_rev % 8);
            bitmap[byte_idx] |= 1 << bit_idx;
            non_empty_siblings_hex.push(sibling_hex.clone());
        }
    }

    Ok(CompactSmtProof {
        key_hex: proof.key_hex.clone(),
        value_hex: proof.value_hex.clone(),
        presence_bitmap_hex: hex::encode(bitmap),
        non_empty_siblings_hex,
        root_hex: proof.root_hex.clone(),
        is_inclusion: proof.is_inclusion,
    })
}

/// Expands a Compact SMT proof back into a standard 256-sibling SMT proof
pub fn expand_smt_proof(compact: &CompactSmtProof) -> Result<SmtProof, String> {
    let bitmap_bytes = hex::decode(&compact.presence_bitmap_hex)
        .map_err(|e| format!("Invalid presence_bitmap_hex: {e}"))?;
    if bitmap_bytes.len() != 32 {
        return Err("Invalid presence_bitmap length (expected 32 bytes)".to_string());
    }

    let empty_hashes = get_empty_hashes();
    let mut siblings_hex = Vec::with_capacity(SMT_DEPTH);
    let mut explicit_iter = compact.non_empty_siblings_hex.iter();

    for depth_rev in 0..SMT_DEPTH {
        let depth = SMT_DEPTH - 1 - depth_rev;
        let byte_idx = depth_rev / 8;
        let bit_idx = 7 - (depth_rev % 8);
        let is_present = ((bitmap_bytes[byte_idx] >> bit_idx) & 1) == 1;

        if is_present {
            let sibling = explicit_iter
                .next()
                .ok_or_else(|| "Premature end of non_empty_siblings_hex".to_string())?;
            siblings_hex.push(sibling.clone());
        } else {
            siblings_hex.push(hex::encode(empty_hashes[depth + 1]));
        }
    }

    if explicit_iter.next().is_some() {
        return Err("Superfluous non-empty siblings provided in compact proof".to_string());
    }

    Ok(SmtProof {
        key_hex: compact.key_hex.clone(),
        value_hex: compact.value_hex.clone(),
        siblings_hex,
        root_hex: compact.root_hex.clone(),
        is_inclusion: compact.is_inclusion,
    })
}

/// Verifies a Compact SMT proof directly against the declared root hash
pub fn verify_compact_smt_proof(compact: &CompactSmtProof) -> SmtVerificationResult {
    match expand_smt_proof(compact) {
        Ok(proof) => verify_smt_proof(&proof),
        Err(err) => SmtVerificationResult {
            valid: false,
            computed_root: String::new(),
            expected_root: compact.root_hex.clone(),
            is_non_inclusion: compact.value_hex.is_none(),
            error: Some(err),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_tree_root() {
        let tree = SparseMerkleTree::new();
        assert_eq!(tree.root_hex().len(), 64);
        assert_ne!(hash_empty_leaf(), [0u8; 32]);
    }

    #[test]
    fn test_smt_inclusion_verification() {
        let mut tree = SparseMerkleTree::new();
        let key = Sha256::digest(b"tx_settlement_1001").into();
        let val = Sha256::digest(b"amount_cents=5000:status=cleared").into();

        tree.update(&key, &val);
        let proof = tree
            .prove_inclusion(&key)
            .expect("Proof should be generated");
        assert!(proof.is_inclusion);
        assert_eq!(proof.siblings_hex.len(), SMT_DEPTH);

        let verification = verify_smt_proof(&proof);
        assert!(verification.valid, "Inclusion proof must verify cleanly");
        assert_eq!(verification.computed_root, tree.root_hex());
    }

    #[test]
    fn test_smt_non_inclusion_verification() {
        let mut tree = SparseMerkleTree::new();
        let key_a = Sha256::digest(b"tx_settlement_1001").into();
        let val_a = Sha256::digest(b"amount_cents=5000:status=cleared").into();
        tree.update(&key_a, &val_a);

        // Key B was never inserted
        let key_b = Sha256::digest(b"tx_fraudulent_replayed_nonce").into();
        let proof = tree
            .prove_non_inclusion(&key_b)
            .expect("Non-inclusion proof should be generated");
        assert!(!proof.is_inclusion);
        assert!(proof.value_hex.is_none());

        let verification = verify_smt_proof(&proof);
        assert!(
            verification.valid,
            "Non-inclusion proof must verify that key does not exist"
        );
        assert!(verification.is_non_inclusion);
    }

    #[test]
    fn test_smt_tamper_detection() {
        let mut tree = SparseMerkleTree::new();
        let key = Sha256::digest(b"tx_invoice_999").into();
        let val = Sha256::digest(b"balance_due=0").into();
        tree.update(&key, &val);

        let mut proof = tree.prove_inclusion(&key).expect("Proof should exist");

        // Tamper with the value
        let tampered_val: [u8; 32] = Sha256::digest(b"balance_due=99999999").into();
        proof.value_hex = Some(hex::encode(tampered_val));

        let verification = verify_smt_proof(&proof);
        assert!(
            !verification.valid,
            "Tampered value must fail SMT verification"
        );
    }

    #[test]
    fn test_smt_rejects_contradictory_proof_kind() {
        let tree = SparseMerkleTree::new();
        let key = Sha256::digest(b"absent").into();
        let mut proof = tree
            .prove_non_inclusion(&key)
            .expect("non-inclusion proof should exist");
        proof.is_inclusion = true;

        let verification = verify_smt_proof(&proof);
        assert!(!verification.valid);
        assert_eq!(
            verification.error.as_deref(),
            Some("Proof kind is inconsistent with value_hex presence")
        );
    }

    #[test]
    fn test_compact_smt_inclusion_roundtrip_and_compression() {
        let mut tree = SparseMerkleTree::new();
        let key_1 = Sha256::digest(b"tx_settlement_1001").into();
        let val_1 = Sha256::digest(b"amount_cents=5000:status=cleared").into();
        let key_2 = Sha256::digest(b"tx_settlement_1002").into();
        let val_2 = Sha256::digest(b"amount_cents=7500:status=cleared").into();

        tree.update(&key_1, &val_1);
        tree.update(&key_2, &val_2);

        let full_proof = tree.prove_inclusion(&key_1).expect("Full proof");
        let compact_proof = tree.prove_compact_inclusion(&key_1).expect("Compact proof");

        // Verify dramatic compression: 256 siblings down to < 20 siblings
        assert!(
            compact_proof.non_empty_siblings_hex.len() <= 16,
            "Expected compact proof to compress 256 siblings to <= 16, got {}",
            compact_proof.non_empty_siblings_hex.len()
        );

        // Verify expansion roundtrip matches 100%
        let expanded = expand_smt_proof(&compact_proof).expect("Expansion must succeed");
        assert_eq!(expanded, full_proof);

        // Verify direct verification
        let verification = verify_compact_smt_proof(&compact_proof);
        assert!(verification.valid);
        assert_eq!(verification.computed_root, tree.root_hex());
    }

    #[test]
    fn test_compact_smt_non_inclusion() {
        let mut tree = SparseMerkleTree::new();
        let key_1 = Sha256::digest(b"tx_settlement_1001").into();
        let val_1 = Sha256::digest(b"amount_cents=5000:status=cleared").into();
        tree.update(&key_1, &val_1);

        let absent_key = Sha256::digest(b"non_existent_key").into();
        let compact_non_proof = tree
            .prove_compact_non_inclusion(&absent_key)
            .expect("Compact non-inclusion proof");

        assert!(!compact_non_proof.is_inclusion);
        assert!(compact_non_proof.value_hex.is_none());

        let verification = verify_compact_smt_proof(&compact_non_proof);
        assert!(verification.valid);
        assert!(verification.is_non_inclusion);
    }
}
