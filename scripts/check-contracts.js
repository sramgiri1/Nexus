#!/usr/bin/env node
/**
 * Contract validator smoke tests.
 * 22 tests covering all 6 contract types.
 * Exits 1 on any failure.
 */

import { validateTaskContract } from '../contracts/validators/validateTaskContract.js';
import { validateHandoffContract } from '../contracts/validators/validateHandoffContract.js';
import { validateSkillResult } from '../contracts/validators/validateSkillResult.js';
import { validateVerificationContract } from '../contracts/validators/validateVerificationContract.js';
import { validateReleaseContract } from '../contracts/validators/validateReleaseContract.js';
import { validateStateTransition } from '../contracts/validators/validateStateTransition.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const validTask = {
  id: 'task-001',
  contractVersion: '1.0',
  projectId: 'careloop',
  sourceAgent: 'nexus',
  targetAgent: 'core',
  taskType: 'implementation',
  objective: 'Implement reminder endpoint',
  allowedFiles: ['projects/careloop/src/'],
  forbiddenFiles: ['projects/careloop/.env'],
  inputs: {},
  acceptanceCriteria: ['POST /reminders returns 201'],
  requiredSkills: [],
  riskLevel: 'medium',
  blocking: true,
  dependsOn: [],
  parentTaskId: null,
  createdAt: '2026-05-03T10:00:00Z',
};

const validHandoff = {
  contractType: 'verification',
  sourceAgent: 'core',
  targetAgent: 'auditor',
  projectId: 'careloop',
  objective: 'Verify Sprint 2 backend',
  evidence: ['task-001 completed'],
  allowedFiles: ['projects/careloop/src/'],
  forbiddenFiles: [],
  requiredSkills: ['auditor.code.lint'],
  doneCriteria: ['code.lint PASS'],
  riskLevel: 'medium',
  blocking: true,
  parentTaskId: 'task-001',
};

const validSkillResult = {
  result: 'PASS',
  issues: [],
  summary: 'ESLint: 0 errors across 12 files',
};

const validVerification = {
  gate: 'AUDITOR',
  projectId: 'careloop',
  skillsRequired: ['auditor.code.lint', 'auditor.code.diff_review'],
  evidenceRequired: ['reports/auditor/careloop-lint-sprint2.json'],
  passCriteria: ['code.lint PASS', 'code.diff_review PASS'],
  failCriteria: ['any skill returns FAIL'],
  blocking: true,
};

const validRelease = {
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

const validTransition = {
  entityType: 'task',
  entityId: 'task-001',
  from: 'running',
  to: 'completed',
  requestedBy: 'core',
  evidence: ['task-001 result file'],
  reason: 'Implementation complete, handoff to AUDITOR',
  createdAt: '2026-05-03T11:00:00Z',
};

// ── Task Contract (6 tests) ────────────────────────────────────────────────────

console.log('\nTask Contract');

test('1. valid task contract passes', () => {
  const r = validateTaskContract(validTask);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('2. missing objective fails', () => {
  const data = { ...validTask };
  delete data.objective;
  const r = validateTaskContract(data);
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('objective')), 'Expected objective issue');
});

test('3. missing targetAgent fails', () => {
  const data = { ...validTask };
  delete data.targetAgent;
  const r = validateTaskContract(data);
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('targetAgent')), 'Expected targetAgent issue');
});

test('4. invalid riskLevel fails', () => {
  const r = validateTaskContract({ ...validTask, riskLevel: 'extreme' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('riskLevel')), 'Expected riskLevel issue');
});

test('5. allowedFiles must be array', () => {
  const r = validateTaskContract({ ...validTask, allowedFiles: 'projects/' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('allowedFiles')), 'Expected allowedFiles issue');
});

test('6. acceptanceCriteria must be array with minItems 1', () => {
  const r = validateTaskContract({ ...validTask, acceptanceCriteria: [] });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('acceptanceCriteria')), 'Expected acceptanceCriteria issue');
});

// ── Handoff Contract (4 tests) ────────────────────────────────────────────────

console.log('\nHandoff Contract');

test('7. valid handoff contract passes', () => {
  const r = validateHandoffContract(validHandoff);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('8. missing sourceAgent fails', () => {
  const data = { ...validHandoff };
  delete data.sourceAgent;
  const r = validateHandoffContract(data);
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('sourceAgent')), 'Expected sourceAgent issue');
});

test('9. invalid contractType fails', () => {
  const r = validateHandoffContract({ ...validHandoff, contractType: 'random_type' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('contractType')), 'Expected contractType issue');
});

test('10. empty doneCriteria fails', () => {
  const r = validateHandoffContract({ ...validHandoff, doneCriteria: [] });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('doneCriteria')), 'Expected doneCriteria issue');
});

// ── Skill Result (3 tests) ────────────────────────────────────────────────────

console.log('\nSkill Result');

test('11. PASS skill result passes', () => {
  const r = validateSkillResult(validSkillResult);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('12. invalid result value fails', () => {
  const r = validateSkillResult({ ...validSkillResult, result: 'OK' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('result')), 'Expected result issue');
});

test('13. missing summary fails', () => {
  const data = { ...validSkillResult };
  delete data.summary;
  const r = validateSkillResult(data);
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('summary')), 'Expected summary issue');
});

// ── Verification Contract (3 tests) ──────────────────────────────────────────

console.log('\nVerification Contract');

test('14. valid AUDITOR verification contract passes', () => {
  const r = validateVerificationContract(validVerification);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('15. invalid gate fails', () => {
  const r = validateVerificationContract({ ...validVerification, gate: 'NEXUS' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('gate')), 'Expected gate issue');
});

test('16. empty skillsRequired fails', () => {
  const r = validateVerificationContract({ ...validVerification, skillsRequired: [] });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('skillsRequired')), 'Expected skillsRequired issue');
});

// ── Release Contract (4 tests) ────────────────────────────────────────────────

console.log('\nRelease Contract');

test('17. GO release with full evidence passes', () => {
  const r = validateReleaseContract(validRelease);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('18. GO release fails when auditorResult is FAIL', () => {
  const r = validateReleaseContract({ ...validRelease, auditorResult: 'FAIL' });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('auditorResult')), 'Expected auditorResult issue');
});

test('19. GO release fails when openCriticalSafetyEvents > 0', () => {
  const r = validateReleaseContract({ ...validRelease, openCriticalSafetyEvents: 1 });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('openCriticalSafetyEvents')), 'Expected openCriticalSafetyEvents issue');
});

test('20. GO release fails when unreconciledBlockingBatchTasks > 0', () => {
  const r = validateReleaseContract({ ...validRelease, unreconciledBlockingBatchTasks: 2 });
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('unreconciledBlockingBatchTasks')), 'Expected unreconciledBlockingBatchTasks issue');
});

// ── State Transition (2 tests) ────────────────────────────────────────────────

console.log('\nState Transition');

test('21. valid state transition passes', () => {
  const r = validateStateTransition(validTransition);
  assert(r.valid, `Expected valid, got issues: ${JSON.stringify(r.issues)}`);
});

test('22. missing requestedBy fails', () => {
  const data = { ...validTransition };
  delete data.requestedBy;
  const r = validateStateTransition(data);
  assert(!r.valid, 'Expected invalid');
  assert(r.issues.some(i => i.path.includes('requestedBy')), 'Expected requestedBy issue');
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
