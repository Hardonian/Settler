use crate::smt::{verify_smt_proof, SparseMerkleTree};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChaosFuzzReport {
    pub iterations_executed: usize,
    pub bit_flip_tamper_detections: usize,
    pub sibling_mutation_rejections: usize,
    pub non_inclusion_soundness_passes: usize,
    pub monotonic_root_stability_passes: usize,
    pub zero_false_positives: bool,
}

/// Simple deterministic pseudo-random number generator (xorshift64)
pub struct ChaosRng {
    state: u64,
}

impl ChaosRng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 0xdeadbeefcafebabe } else { seed },
        }
    }

    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    pub fn next_bytes<const N: usize>(&mut self) -> [u8; N] {
        let mut bytes = [0u8; N];
        for chunk in bytes.chunks_mut(8) {
            let val = self.next_u64().to_le_bytes();
            let len = chunk.len();
            chunk.copy_from_slice(&val[..len]);
        }
        bytes
    }
}

/// Executes deterministic chaos and adversarial mutation fuzzing over the Sparse Merkle Tree (SMT)
pub fn run_chaos_fuzz(iterations: usize, seed: u64) -> ChaosFuzzReport {
    let mut rng = ChaosRng::new(seed);
    let mut bit_flip_tamper_detections = 0;
    let mut sibling_mutation_rejections = 0;
    let mut non_inclusion_soundness_passes = 0;
    let mut monotonic_root_stability_passes = 0;

    for _ in 0..iterations {
        let mut smt = SparseMerkleTree::new();
        let num_keys = (rng.next_u64() % 10) as usize + 3;
        let mut keys = Vec::with_capacity(num_keys);
        let mut values = Vec::with_capacity(num_keys);

        for _ in 0..num_keys {
            let k: [u8; 32] = rng.next_bytes();
            let v: [u8; 32] = rng.next_bytes();
            smt.update(&k, &v);
            keys.push(k);
            values.push(v);
        }

        let root = smt.root();

        // 1. Monotonic root stability: re-insert into clean tree in different order
        let mut smt2 = SparseMerkleTree::new();
        for i in (0..num_keys).rev() {
            smt2.update(&keys[i], &values[i]);
        }
        if smt2.root() == root {
            monotonic_root_stability_passes += 1;
        }

        // Pick a target key
        let target_idx = (rng.next_u64() as usize) % num_keys;
        let target_key = keys[target_idx];

        let proof = smt
            .prove_inclusion(&target_key)
            .expect("Target key must exist");
        let v_res = verify_smt_proof(&proof);
        assert!(v_res.is_ok());

        // 2. Adversarial Bit-Flip: Flip 1 bit in value -> must detect tamper
        let mut tampered_proof = proof.clone();
        let mut val_bytes = hex::decode(tampered_proof.value_hex.as_ref().unwrap()).unwrap();
        val_bytes[0] ^= 0x01; // Invert bit
        tampered_proof.value_hex = Some(hex::encode(val_bytes));

        let tamper_res = verify_smt_proof(&tampered_proof);
        if tamper_res.is_err() {
            bit_flip_tamper_detections += 1;
        }

        // 3. Sibling Mutation: Mutate sibling hash along proof path -> must reject
        let mut sibling_tampered_proof = proof.clone();
        if !sibling_tampered_proof.siblings_hex.is_empty() {
            let mutate_idx = (rng.next_u64() as usize) % sibling_tampered_proof.siblings_hex.len();
            let mut sib_bytes =
                hex::decode(&sibling_tampered_proof.siblings_hex[mutate_idx]).unwrap();
            sib_bytes[15] ^= 0x42;
            sibling_tampered_proof.siblings_hex[mutate_idx] = hex::encode(sib_bytes);

            let sib_res = verify_smt_proof(&sibling_tampered_proof);
            if sib_res.is_err() {
                sibling_mutation_rejections += 1;
            }
        }

        // 4. Non-Inclusion Soundness: Generate proof for non-existent key
        let mut non_existent_key = target_key;
        non_existent_key[0] ^= 0xff;
        while keys.contains(&non_existent_key) {
            non_existent_key[1] ^= 0x01;
        }

        let non_inc_proof = smt
            .prove_non_inclusion(&non_existent_key)
            .expect("Key must not exist");
        assert!(!non_inc_proof.is_inclusion);
        let non_inc_res = verify_smt_proof(&non_inc_proof);
        if non_inc_res.is_ok() {
            non_inclusion_soundness_passes += 1;
        }
    }

    ChaosFuzzReport {
        iterations_executed: iterations,
        bit_flip_tamper_detections,
        sibling_mutation_rejections,
        non_inclusion_soundness_passes,
        monotonic_root_stability_passes,
        zero_false_positives: bit_flip_tamper_detections == iterations
            && sibling_mutation_rejections == iterations
            && non_inclusion_soundness_passes == iterations
            && monotonic_root_stability_passes == iterations,
    }
}
