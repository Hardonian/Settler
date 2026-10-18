use settler_kernel::chaos::run_chaos_fuzz;

#[test]
fn test_chaos_fuzz_smt_soundness() {
    // Run 50 iterations of adversarial mutations
    let report = run_chaos_fuzz(50, 0x123456789abcdef0);

    assert_eq!(report.iterations_executed, 50);
    assert_eq!(report.bit_flip_tamper_detections, 50);
    assert_eq!(report.sibling_mutation_rejections, 50);
    assert_eq!(report.non_inclusion_soundness_passes, 50);
    assert_eq!(report.monotonic_root_stability_passes, 50);
    assert!(report.zero_false_positives);
}
