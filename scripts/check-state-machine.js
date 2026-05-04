#!/usr/bin/env node
/**
 * State machine smoke tests.
 * 30 tests covering task, gate, release, batch, and schema-vs-state distinction.
 * Exits 1 on any failure.
 */

import { canTransition } from '../state-machine/transitionValidator.js';
import { validateStateTransition } from '../contracts/validators/validateStateTransition.js';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`  ✓  ${name}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`  ✗  ${name}\n`);
    process.stdout.write(`     ${err.message}\n`);
    failures.push(name);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function assertAllowed(result, context) {
  assert(result.allowed, `Expected allowed=true${context ? ` (${context})` : ''}. reason: ${result.reason}. issues: ${JSON.stringify(result.issues)}`);
}

function assertBlocked(result, context) {
  assert(!result.allowed, `Expected allowed=false${context ? ` (${context})` : ''}. reason: ${result.reason}`);
}

// ── Task transitions ──────────────────────────────────────────────────────────

console.log('\nTask transitions');

test('1. draft -> validated allowed', () => {
  assertAllowed(canTransition({ entityType: 'task', from: 'draft', to: 'validated', actor: 'nexus' }));
});

test('2. validated -> queued allowed', () => {
  assertAllowed(canTransition({ entityType: 'task', from: 'validated', to: 'queued', actor: 'loop' }));
});

test('3. queued -> running allowed', () => {
  assertAllowed(canTransition({ entityType: 'task', from: 'queued', to: 'running', actor: 'loop' }));
});

test('4. worker core running -> completed blocked', () => {
  assertBlocked(canTransition({
    entityType: 'task', from: 'running', to: 'completed',
    actor: 'core', agentId: 'core',
  }), 'worker self-certification');
});

test('5. worker core running -> implementation_done allowed', () => {
  assertAllowed(canTransition({
    entityType: 'task', from: 'running', to: 'implementation_done',
    actor: 'core', agentId: 'core',
  }));
});

test('6. implementation_done -> completed blocked (skips verification)', () => {
  assertBlocked(canTransition({
    entityType: 'task', from: 'implementation_done', to: 'completed',
    actor: 'loop',
  }), 'no direct implementation_done -> completed edge');
});

test('7. implementation_done -> awaiting_verification allowed', () => {
  assertAllowed(canTransition({
    entityType: 'task', from: 'implementation_done', to: 'awaiting_verification',
    actor: 'core',
  }));
});

test('8. auditor awaiting_verification -> completed allowed with PASS evidence', () => {
  assertAllowed(canTransition({
    entityType: 'task', from: 'awaiting_verification', to: 'completed',
    actor: 'auditor',
    evidence: ['PASS — all lint checks passed'],
  }));
});

test('9. sentinel awaiting_verification -> verification_failed allowed', () => {
  assertAllowed(canTransition({
    entityType: 'task', from: 'awaiting_verification', to: 'verification_failed',
    actor: 'sentinel',
    evidence: [],
  }));
});

test('10. deferred_batch -> completed blocked without batch_reconciled evidence', () => {
  assertBlocked(canTransition({
    entityType: 'task', from: 'deferred_batch', to: 'completed',
    actor: 'loop', evidence: [],
  }), 'missing batch_reconciled');
});

test('11. deferred_batch -> completed allowed with batch_reconciled evidence', () => {
  assertAllowed(canTransition({
    entityType: 'task', from: 'deferred_batch', to: 'completed',
    actor: 'loop',
    evidence: [{ type: 'batch_reconciled', jobId: 'batch-abc' }],
  }));
});

test('12. completed -> running blocked (final state)', () => {
  assertBlocked(canTransition({
    entityType: 'task', from: 'completed', to: 'running',
    actor: 'nexus',
  }), 'final state');
});

// ── Gate transitions ──────────────────────────────────────────────────────────

console.log('\nGate transitions');

test('13. AUDITOR pending -> running allowed', () => {
  assertAllowed(canTransition({
    entityType: 'gate', from: 'pending', to: 'running',
    actor: 'auditor', gate: 'AUDITOR',
  }));
});

test('14. auditor AUDITOR running -> passed allowed with PASS evidence', () => {
  assertAllowed(canTransition({
    entityType: 'gate', from: 'running', to: 'passed',
    actor: 'auditor', gate: 'AUDITOR',
    evidence: ['PASS — eslint 0 errors'],
  }));
});

test('15. core AUDITOR running -> passed blocked (wrong actor)', () => {
  assertBlocked(canTransition({
    entityType: 'gate', from: 'running', to: 'passed',
    actor: 'core', gate: 'AUDITOR',
    evidence: ['PASS'],
  }), 'wrong gate actor');
});

test('16. AUDITOR failed -> running allowed (retry)', () => {
  assertAllowed(canTransition({
    entityType: 'gate', from: 'failed', to: 'running',
    actor: 'auditor', gate: 'AUDITOR',
  }));
});

test('17. failed -> waived_requires_approval blocked without approval evidence', () => {
  assertBlocked(canTransition({
    entityType: 'gate', from: 'failed', to: 'waived_requires_approval',
    actor: 'nexus', gate: 'AUDITOR', evidence: [],
  }), 'no approval evidence');
});

test('18. failed -> waived_requires_approval allowed with approval_granted evidence', () => {
  assertAllowed(canTransition({
    entityType: 'gate', from: 'failed', to: 'waived_requires_approval',
    actor: 'nexus', gate: 'AUDITOR',
    evidence: [{ type: 'approval_granted', grantedBy: 'founder' }],
  }));
});

// ── Release transitions ───────────────────────────────────────────────────────

console.log('\nRelease transitions');

test('19. worker core ready_for_review -> go blocked', () => {
  assertBlocked(canTransition({
    entityType: 'release', from: 'ready_for_review', to: 'go',
    actor: 'core',
  }), 'worker cannot set release go');
});

test('20. nexus ready_for_review -> go blocked without releaseContract', () => {
  assertBlocked(canTransition({
    entityType: 'release', from: 'ready_for_review', to: 'go',
    actor: 'nexus',
  }), 'no releaseContract');
});

const validGoContract = {
  projectId: 'careloop',
  auditorResult: 'PASS',
  sentinelResult: 'PASS',
  wardenResult: 'PASS',
  openCriticalSafetyEvents: 0,
  unreconciledBlockingBatchTasks: 0,
  failedBlockingGates: 0,
  releaseDecision: 'GO',
  evidence: [
    'reports/auditor/careloop-diff-review-sprint2-2026-05-03.md',
    'reports/sentinel/careloop-qa-sprint2-2026-05-03.md',
    'reports/warden/careloop-compliance-sprint2-2026-05-03.md',
  ],
  decidedAt: '2026-05-03T12:00:00Z',
};

test('21. nexus ready_for_review -> go allowed with valid GO releaseContract', () => {
  assertAllowed(canTransition({
    entityType: 'release', from: 'ready_for_review', to: 'go',
    actor: 'nexus', releaseContract: validGoContract,
  }));
});

test('22. go -> ready_for_review blocked (go is final)', () => {
  assertBlocked(canTransition({
    entityType: 'release', from: 'go', to: 'ready_for_review',
    actor: 'nexus',
  }), 'go is final');
});

test('23. go -> blocked allowed only with allowRollback and rollback_required evidence', () => {
  const withoutRollback = canTransition({
    entityType: 'release', from: 'go', to: 'blocked',
    actor: 'nexus', evidence: [{ type: 'rollback_required' }],
  });
  assertBlocked(withoutRollback, 'allowRollback not set');

  const withRollback = canTransition({
    entityType: 'release', from: 'go', to: 'blocked',
    actor: 'nexus',
    evidence: [{ type: 'rollback_required' }],
    context: { allowRollback: true },
  });
  assertAllowed(withRollback, 'rollback authorized');
});

// ── Batch transitions ─────────────────────────────────────────────────────────

console.log('\nBatch transitions');

test('24. batch_pending -> provider_submitted allowed', () => {
  assertAllowed(canTransition({
    entityType: 'batch', from: 'batch_pending', to: 'provider_submitted',
    actor: 'loop',
  }));
});

test('25. provider_submitted -> provider_processing allowed', () => {
  assertAllowed(canTransition({
    entityType: 'batch', from: 'provider_submitted', to: 'provider_processing',
    actor: 'loop',
  }));
});

test('26. provider_processing -> provider_completed allowed', () => {
  assertAllowed(canTransition({
    entityType: 'batch', from: 'provider_processing', to: 'provider_completed',
    actor: 'loop',
  }));
});

test('27. provider_completed -> reconciled blocked without provider_output evidence', () => {
  assertBlocked(canTransition({
    entityType: 'batch', from: 'provider_completed', to: 'reconciled',
    actor: 'loop', evidence: [],
  }), 'no provider_output evidence');
});

test('28. provider_completed -> reconciled allowed with provider_output evidence', () => {
  assertAllowed(canTransition({
    entityType: 'batch', from: 'provider_completed', to: 'reconciled',
    actor: 'loop',
    evidence: [{ type: 'provider_output', jobId: 'batch-xyz' }],
  }));
});

test('29. reconciled -> provider_processing blocked (final state)', () => {
  assertBlocked(canTransition({
    entityType: 'batch', from: 'reconciled', to: 'provider_processing',
    actor: 'loop',
  }), 'reconciled is final');
});

// ── Schema-vs-state distinction ───────────────────────────────────────────────

console.log('\nSchema-vs-state distinction');

test('30. core running -> completed: schema-valid but state-machine-blocked', () => {
  const transitionRecord = {
    entityType: 'task',
    entityId: 'task-001',
    from: 'running',
    to: 'completed',
    requestedBy: 'core',
    evidence: [],
    reason: 'implementation finished',
    createdAt: '2026-05-03T11:00:00Z',
  };

  const schemaResult = validateStateTransition(transitionRecord);
  assert(schemaResult.valid, `Expected schema-valid, got: ${JSON.stringify(schemaResult.issues)}`);

  const smResult = canTransition({
    entityType: 'task',
    from: transitionRecord.from,
    to: transitionRecord.to,
    actor: transitionRecord.requestedBy,
    agentId: transitionRecord.requestedBy,
    evidence: transitionRecord.evidence,
  });
  assert(!smResult.valid || !smResult.allowed, `Expected state-machine-blocked, got allowed=true`);
});

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${total} tests: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach(name => console.log(`  - ${name}`));
}

console.log('');

if (failed > 0) {
  process.exit(1);
}
