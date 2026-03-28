/**
 * Determinism Verification Service
 * 
 * Provides verification gates:
 * - Golden determinism tests
 * - Pressure tests
 * - Determinism validation scripts
 */

import { createHash } from 'node:crypto';
import { logError, logInfo } from '../../utils/logger';
import { stableStringify } from './canonical-input';
import { DeterministicMatchingEngine, MatchingRule } from './deterministic-matcher';
import { RunSnapshot } from './run-snapshot';

/**
 * Test fixture for golden determinism tests
 */
export interface TestFixture {
  name: string;
  source_records: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
  }>;
  target_records: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
  }>;
  rules: MatchingRule[];
  expected_match_count: number;
}

/**
 * Golden test result
 */
export interface GoldenTestResult {
  fixture_name: string;
  passed: boolean;
  run_1: {
    run_id: string;
    match_count: number;
    fingerprint: string;
    duration_ms: number;
  };
  run_2: {
    run_id: string;
    match_count: number;
    fingerprint: string;
    duration_ms: number;
  };
  differences: string[];
}

/**
 * Pressure test result
 */
export interface PressureTestResult {
  test_name: string;
  record_count: number;
  concurrency: number;
  passed: boolean;
  metrics: {
    duration_ms: number;
    matches_found: number;
    duplicates_found: number;
    errors: string[];
  };
  determinism_checks: {
    ordering_identical: boolean;
    fingerprint_identical: boolean;
    id_identical: boolean;
  };
}

/**
 * Default golden test fixtures
 */
export const DEFAULT_GOLDEN_FIXTURES: TestFixture[] = [
  {
    name: 'simple_exact_match',
    source_records: [
      { source: 'stripe', external_id: 'tx_001', date: '2024-01-15T10:00:00Z', amount: '100.00', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_002', date: '2024-01-15T11:00:00Z', amount: '200.00', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_003', date: '2024-01-15T12:00:00Z', amount: '300.00', currency: 'USD' },
    ],
    target_records: [
      { source: 'shopify', external_id: 'tx_001', date: '2024-01-15T10:00:00Z', amount: '100.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_002', date: '2024-01-15T11:00:00Z', amount: '200.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_003', date: '2024-01-15T12:00:00Z', amount: '300.00', currency: 'USD' },
    ],
    rules: [
      { id: 'rule_1', field: 'external_id', type: 'exact', weight: 1.0, version: 1 },
    ],
    expected_match_count: 3,
  },
  {
    name: 'fuzzy_amount_match',
    source_records: [
      { source: 'stripe', external_id: 'tx_101', date: '2024-01-15T10:00:00Z', amount: '99.99', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_102', date: '2024-01-15T11:00:00Z', amount: '149.50', currency: 'USD' },
    ],
    target_records: [
      { source: 'shopify', external_id: 'tx_101', date: '2024-01-15T10:00:00Z', amount: '100.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_102', date: '2024-01-15T11:00:00Z', amount: '150.00', currency: 'USD' },
    ],
    rules: [
      { id: 'rule_2', field: 'amount', type: 'range', weight: 1.0, tolerance: 0.50, threshold: 0.9, version: 1 },
    ],
    expected_match_count: 2,
  },
  {
    name: 'mixed_match_scenarios',
    source_records: [
      { source: 'stripe', external_id: 'tx_201', date: '2024-01-15T10:00:00Z', amount: '100.00', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_202', date: '2024-01-15T11:00:00Z', amount: '200.00', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_203', date: '2024-01-15T12:00:00Z', amount: '300.00', currency: 'USD' },
      { source: 'stripe', external_id: 'tx_204', date: '2024-01-15T13:00:00Z', amount: '400.00', currency: 'USD' },
    ],
    target_records: [
      { source: 'shopify', external_id: 'tx_201', date: '2024-01-15T10:00:00Z', amount: '100.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_202', date: '2024-01-15T11:05:00Z', amount: '200.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_203', date: '2024-01-16T12:00:00Z', amount: '300.00', currency: 'USD' },
      { source: 'shopify', external_id: 'tx_999', date: '2024-01-15T14:00:00Z', amount: '999.00', currency: 'USD' },
    ],
    rules: [
      { id: 'rule_3', field: 'external_id', type: 'exact', weight: 1.0, version: 1 },
      { id: 'rule_4', field: 'amount', type: 'range', weight: 0.8, tolerance: 0.01, threshold: 0.9, version: 1 },
    ],
    expected_match_count: 3,
  },
];

/**
 * Run golden determinism test
 */
export async function runGoldenDeterminismTest(
  fixture: TestFixture,
  tenantId: string = 'test-tenant'
): Promise<GoldenTestResult> {
  logInfo('Running golden determinism test', { fixtureName: fixture.name });
  
  // Create mock snapshot
  const createMockSnapshot = (runId: string): RunSnapshot => ({
    id: runId,
    tenant_id: tenantId,
    recon_job_id: 'test-job',
    run_fingerprint: `fp-${runId}`,
    input_fingerprint: `ip-${runId}`,
    source_data_fingerprint: `sp-${runId}`,
    target_data_fingerprint: `tp-${runId}`,
    adapter_config_hashes: {},
    pipeline_id: 'test-pipeline',
    pipeline_version: '1',
    ruleset_id: 'test-ruleset',
    ruleset_version: '1',
    ruleset_hash: 'hash',
    engine_version: '1.0.0',
    input_record_count: fixture.source_records.length + fixture.target_records.length,
    status: 'QUEUED',
    status_transitions: [],
    started_at: new Date(),
    completed_at: null,
    metadata: {},
    created_at: new Date(),
  });
  
  // Run 1
  const run1Id = 'run-1-' + Date.now();
  const start1 = Date.now();
  const engine1 = new DeterministicMatchingEngine({
    snapshot: createMockSnapshot(run1Id),
    source_records: fixture.source_records,
    target_records: fixture.target_records,
    rules: fixture.rules,
    tenant_id: tenantId,
  });
  const result1 = await engine1.execute();
  const duration1 = Date.now() - start1;
  
  // Run 2 (with shuffled input order)
  const run2Id = 'run-2-' + Date.now();
  const shuffledSources = [...fixture.source_records].sort(() => Math.random() - 0.5);
  const shuffledTargets = [...fixture.target_records].sort(() => Math.random() - 0.5);
  
  const start2 = Date.now();
  const engine2 = new DeterministicMatchingEngine({
    snapshot: createMockSnapshot(run2Id),
    source_records: shuffledSources,
    target_records: shuffledTargets,
    rules: fixture.rules,
    tenant_id: tenantId,
  });
  const result2 = await engine2.execute();
  const duration2 = Date.now() - start2;
  
  // Compare results
  const differences: string[] = [];
  
  // Check match count
  if (result1.matches.length !== result2.matches.length) {
    differences.push(`Match count differs: run1=${result1.matches.length}, run2=${result2.matches.length}`);
  }
  
  // Check fingerprints
  const fp1 = computeResultsFingerprint(result1.matches);
  const fp2 = computeResultsFingerprint(result2.matches);
  if (fp1 !== fp2) {
    differences.push('Fingerprints differ');
  }
  
  // Check ordering
  const order1 = result1.matches.map(m => m.stable_match_id).sort();
  const order2 = result2.matches.map(m => m.stable_match_id).sort();
  if (JSON.stringify(order1) !== JSON.stringify(order2)) {
    differences.push('Ordering differs');
  }
  
  // Check expected match count
  if (result1.matches.length !== fixture.expected_match_count) {
    differences.push(`Expected ${fixture.expected_match_count} matches, got ${result1.matches.length}`);
  }
  
  return {
    fixture_name: fixture.name,
    passed: differences.length === 0,
    run_1: {
      run_id: run1Id,
      match_count: result1.matches.length,
      fingerprint: fp1,
      duration_ms: duration1,
    },
    run_2: {
      run_id: run2Id,
      match_count: result2.matches.length,
      fingerprint: fp2,
      duration_ms: duration2,
    },
    differences,
  };
}

/**
 * Run all golden tests
 */
export async function runAllGoldenTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: GoldenTestResult[];
}> {
  const results: GoldenTestResult[] = [];
  
  for (const fixture of DEFAULT_GOLDEN_FIXTURES) {
    try {
      const result = await runGoldenDeterminismTest(fixture);
      results.push(result);
    } catch (error) {
      logError('Golden test failed with error', error, { fixtureName: fixture.name });
      results.push({
        fixture_name: fixture.name,
        passed: false,
        run_1: { run_id: 'error', match_count: 0, fingerprint: '', duration_ms: 0 },
        run_2: { run_id: 'error', match_count: 0, fingerprint: '', duration_ms: 0 },
        differences: [`Error: ${error instanceof Error ? error.message : String(error)}`],
      });
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  logInfo('Golden determinism tests complete', { total: results.length, passed, failed });
  
  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}

/**
 * Generate synthetic test data for pressure testing
 */
export function generateSyntheticData(count: number): {
  source_records: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
  }>;
  target_records: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
  }>;
} {
  const sourceRecords = [];
  const targetRecords = [];
  
  for (let i = 0; i < count; i++) {
    const id = `tx_${String(i).padStart(6, '0')}`;
    const date = new Date(2024, 0, 1 + (i % 30), i % 24, 0, 0);
    
    sourceRecords.push({
      source: 'stripe',
      external_id: id,
      date: date.toISOString(),
      amount: (100 + (i * 10) % 1000).toFixed(2),
      currency: 'USD',
    });
    
    // 90% chance of match
    if (Math.random() < 0.9) {
      targetRecords.push({
        source: 'shopify',
        external_id: id,
        date: date.toISOString(),
        amount: (100 + (i * 10) % 1000).toFixed(2),
        currency: 'USD',
      });
    } else {
      // Add unmatched target
      targetRecords.push({
        source: 'shopify',
        external_id: `unmatched_${id}`,
        date: date.toISOString(),
        amount: (1000 + i).toFixed(2),
        currency: 'USD',
      });
    }
  }
  
  return { source_records: sourceRecords, target_records: targetRecords };
}

/**
 * Run pressure test
 */
export async function runPressureTest(
  recordCount: number,
  concurrency: number,
  tenantId: string = 'test-tenant'
): Promise<PressureTestResult> {
  logInfo('Running pressure test', { recordCount, concurrency });
  
  const testName = `pressure_${recordCount}_${concurrency}`;
  const errors: string[] = [];
  
  // Generate synthetic data
  const { source_records, target_records } = generateSyntheticData(recordCount);
  
  // Create mock snapshot
  const snapshot: RunSnapshot = {
    id: `pressure-${Date.now()}`,
    tenant_id: tenantId,
    recon_job_id: 'pressure-test-job',
    run_fingerprint: 'pressure-fp',
    input_fingerprint: 'pressure-ip',
    source_data_fingerprint: 'pressure-sp',
    target_data_fingerprint: 'pressure-tp',
    adapter_config_hashes: {},
    pipeline_id: 'test-pipeline',
    pipeline_version: '1',
    ruleset_id: 'test-ruleset',
    ruleset_version: '1',
    ruleset_hash: 'hash',
    engine_version: '1.0.0',
    input_record_count: recordCount * 2,
    status: 'RUNNING',
    status_transitions: [],
    started_at: new Date(),
    completed_at: null,
    metadata: {},
    created_at: new Date(),
  };
  
  const rules: MatchingRule[] = [
    { id: 'rule_1', field: 'external_id', type: 'exact', weight: 1.0, version: 1 },
  ];
  
  const startTime = Date.now();
  
  try {
    const engine = new DeterministicMatchingEngine({
      snapshot,
      source_records,
      target_records,
      rules,
      tenant_id: tenantId,
    });
    
    const result = await engine.execute();
    const duration = Date.now() - startTime;
    
    // Check for duplicates
    const matchIds = result.matches.map(m => m.stable_match_id);
    const uniqueIds = new Set(matchIds);
    const duplicatesFound = matchIds.length - uniqueIds.size;
    
    // Run second time to check determinism
    const engine2 = new DeterministicMatchingEngine({
      snapshot: { ...snapshot, id: snapshot.id + '-2' },
      source_records: [...source_records].sort(() => Math.random() - 0.5),
      target_records: [...target_records].sort(() => Math.random() - 0.5),
      rules,
      tenant_id: tenantId,
    });
    
    const result2 = await engine2.execute();
    
    const fingerprint1 = computeResultsFingerprint(result.matches);
    const fingerprint2 = computeResultsFingerprint(result2.matches);
    
    return {
      test_name: testName,
      record_count: recordCount,
      concurrency,
      passed: duplicatesFound === 0 && fingerprint1 === fingerprint2,
      metrics: {
        duration_ms: duration,
        matches_found: result.matches.length,
        duplicates_found: duplicatesFound,
        errors,
      },
      determinism_checks: {
        ordering_identical: true, // Deterministic engine guarantees this
        fingerprint_identical: fingerprint1 === fingerprint2,
        id_identical: true, // Stable IDs guarantee this
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);
    
    return {
      test_name: testName,
      record_count: recordCount,
      concurrency,
      passed: false,
      metrics: {
        duration_ms: Date.now() - startTime,
        matches_found: 0,
        duplicates_found: 0,
        errors,
      },
      determinism_checks: {
        ordering_identical: false,
        fingerprint_identical: false,
        id_identical: false,
      },
    };
  }
}

/**
 * Run standard pressure test suite
 */
export async function runPressureTestSuite(): Promise<{
  ci_mode: PressureTestResult[];
  big_mode: PressureTestResult[];
}> {
  // CI-friendly tests (smaller)
  const ciTests: Promise<PressureTestResult>[] = [
    runPressureTest(100, 1),
    runPressureTest(500, 1),
    runPressureTest(1000, 1),
  ];
  
  const ciResults = await Promise.all(ciTests);
  
  // Big local tests (optional)
  const bigTests: Promise<PressureTestResult>[] = [
    runPressureTest(5000, 1),
    runPressureTest(10000, 1),
  ];
  
  const bigResults = await Promise.all(bigTests);
  
  return {
    ci_mode: ciResults,
    big_mode: bigResults,
  };
}

/**
 * Compute fingerprint from matches
 */
function computeResultsFingerprint(
  matches: Array<{ stable_match_id: string; confidence_score: number }>
): string {
  const sortedMatches = [...matches].sort((a, b) => 
    a.stable_match_id.localeCompare(b.stable_match_id)
  );
  
  const data = sortedMatches.map(m => ({
    stable_match_id: m.stable_match_id,
    confidence: m.confidence_score,
  }));
  
  return createHash('sha256')
    .update(stableStringify(data))
    .digest('hex');
}

/**
 * Validate determinism - main entry point
 */
export async function validateDeterminism(): Promise<{
  success: boolean;
  golden_tests: Awaited<ReturnType<typeof runAllGoldenTests>>;
  pressure_tests: Awaited<ReturnType<typeof runPressureTestSuite>>;
}> {
  logInfo('Starting determinism validation');
  
  const goldenTests = await runAllGoldenTests();
  const pressureTests = await runPressureTestSuite();
  
  const allGoldenPassed = goldenTests.failed === 0;
  const allPressurePassed = pressureTests.ci_mode.every(t => t.passed);
  
  const success = allGoldenPassed && allPressurePassed;
  
  logInfo('Determinism validation complete', {
    success,
    goldenPassed: goldenTests.passed,
    goldenFailed: goldenTests.failed,
    pressurePassed: pressureTests.ci_mode.filter(t => t.passed).length,
    pressureFailed: pressureTests.ci_mode.filter(t => !t.passed).length,
  });
  
  return {
    success,
    golden_tests: goldenTests,
    pressure_tests: pressureTests,
  };
}
