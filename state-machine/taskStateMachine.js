/**
 * Task state machine.
 * Pure functions only — no file writes, no network, no mutation.
 */

export const TASK_STATES = Object.freeze({
  DRAFT:                  'draft',
  VALIDATED:              'validated',
  QUEUED:                 'queued',
  RUNNING:                'running',
  IMPLEMENTATION_DONE:    'implementation_done',
  AWAITING_VERIFICATION:  'awaiting_verification',
  VERIFICATION_FAILED:    'verification_failed',
  AWAITING_APPROVAL:      'awaiting_approval',
  DEFERRED_BATCH:         'deferred_batch',
  COMPLETED:              'completed',
  FAILED:                 'failed',
  CANCELLED:              'cancelled',
});

export const FINAL_TASK_STATES = new Set([
  TASK_STATES.COMPLETED,
  TASK_STATES.FAILED,
  TASK_STATES.CANCELLED,
]);

// Agents that are execution-plane workers and cannot self-certify completion.
const WORKER_AGENTS = new Set([
  'core', 'swift', 'pixel', 'canvas', 'prism',
  'stream', 'radar', 'beacon', 'compass', 'oracle', 'synapse',
]);

// Only these actors may advance a task past awaiting_verification.
const VERIFICATION_ACTORS = new Set([
  'auditor', 'sentinel', 'warden', 'loop', 'state-machine',
]);

// All allowed state-to-state edges (without actor/evidence constraints).
const ALLOWED_EDGES = new Set([
  'draft->validated',
  'validated->queued',
  'queued->running',
  'running->implementation_done',
  'implementation_done->awaiting_verification',
  'awaiting_verification->completed',
  'awaiting_verification->verification_failed',
  'verification_failed->running',
  'running->awaiting_approval',
  'awaiting_approval->running',
  'running->deferred_batch',
  'deferred_batch->completed',
  'deferred_batch->failed',
  'running->failed',
]);

function hasEvidence(evidence, typeOrStr) {
  if (!Array.isArray(evidence)) return false;
  return evidence.some(e => {
    if (typeof e === 'string') return e.includes(typeOrStr);
    if (e && typeof e === 'object') return e.type === typeOrStr || (typeof e.type === 'string' && e.type.includes(typeOrStr));
    return false;
  });
}

/**
 * canTransitionTask — validate whether a task state transition is allowed.
 *
 * @param {object} params
 * @param {string} params.from      - current state
 * @param {string} params.to        - proposed state
 * @param {string} params.actor     - who is requesting the transition
 * @param {string} [params.agentId] - the agent that owns the task (for worker check)
 * @param {string} [params.taskType]
 * @param {Array}  [params.evidence]
 * @param {object} [params.context]
 * @returns {{ allowed: boolean, reason: string, requiredEvidence: string[], issues: string[] }}
 */
export function canTransitionTask({ from, to, actor, agentId, taskType, evidence = [], context = {} }) {
  const issues = [];

  // Final state check.
  if (FINAL_TASK_STATES.has(from)) {
    return {
      allowed: false,
      reason: `State '${from}' is final — no further transitions allowed.`,
      requiredEvidence: [],
      issues: [`'${from}' is a final state`],
    };
  }

  // Cancelled is reachable from any non-final state.
  if (to === TASK_STATES.CANCELLED) {
    return { allowed: true, reason: `Any non-final state may transition to cancelled.`, requiredEvidence: [], issues: [] };
  }

  // Edge existence check.
  const edge = `${from}->${to}`;
  if (!ALLOWED_EDGES.has(edge)) {
    return {
      allowed: false,
      reason: `Transition '${edge}' is not a defined task state edge.`,
      requiredEvidence: [],
      issues: [`No edge '${edge}' in task state machine`],
    };
  }

  // Worker completion block: workers cannot directly reach completed.
  const effectiveActor = agentId || actor;
  if (WORKER_AGENTS.has(effectiveActor)) {
    if (to === TASK_STATES.COMPLETED) {
      return {
        allowed: false,
        reason: `Worker '${effectiveActor}' cannot transition a task directly to 'completed'. Completion requires verification plane sign-off.`,
        requiredEvidence: ['verification_contract', 'skill_result'],
        issues: [`Worker self-certification blocked`],
      };
    }
    if (from === TASK_STATES.IMPLEMENTATION_DONE && to === TASK_STATES.COMPLETED) {
      return {
        allowed: false,
        reason: `'implementation_done -> completed' is not allowed. Tasks must pass through 'awaiting_verification' first.`,
        requiredEvidence: ['verification_contract'],
        issues: [`implementation_done -> completed skips verification`],
      };
    }
  }

  // Verification transitions require a verification actor.
  if (from === TASK_STATES.AWAITING_VERIFICATION && (to === TASK_STATES.COMPLETED || to === TASK_STATES.VERIFICATION_FAILED)) {
    if (!VERIFICATION_ACTORS.has(actor)) {
      return {
        allowed: false,
        reason: `Only verification actors (auditor, sentinel, warden, loop, state-machine) can advance a task from 'awaiting_verification'.`,
        requiredEvidence: ['verification_contract'],
        issues: [`Actor '${actor}' is not a verification actor`],
      };
    }
    if (to === TASK_STATES.COMPLETED) {
      const hasPassEvidence = hasEvidence(evidence, 'PASS') || hasEvidence(evidence, 'skill_result') || hasEvidence(evidence, 'verification_contract');
      if (!hasPassEvidence) {
        return {
          allowed: false,
          reason: `Advancing from 'awaiting_verification' to 'completed' requires PASS evidence (skill_result, verification_contract, or string containing "PASS").`,
          requiredEvidence: ['skill_result or verification_contract with PASS result'],
          issues: [`No PASS evidence found`],
        };
      }
    }
  }

  // Batch completion evidence check.
  if (from === TASK_STATES.DEFERRED_BATCH && to === TASK_STATES.COMPLETED) {
    if (!hasEvidence(evidence, 'batch_reconciled')) {
      return {
        allowed: false,
        reason: `'deferred_batch -> completed' requires evidence containing 'batch_reconciled'.`,
        requiredEvidence: ['batch_reconciled'],
        issues: [`No batch_reconciled evidence found`],
      };
    }
  }

  if (from === TASK_STATES.DEFERRED_BATCH && to === TASK_STATES.FAILED) {
    if (!hasEvidence(evidence, 'batch_failed')) {
      return {
        allowed: false,
        reason: `'deferred_batch -> failed' requires evidence containing 'batch_failed'.`,
        requiredEvidence: ['batch_failed'],
        issues: [`No batch_failed evidence found`],
      };
    }
  }

  // Approval required to re-queue from awaiting_approval.
  if (from === TASK_STATES.AWAITING_APPROVAL && to === TASK_STATES.RUNNING) {
    if (!hasEvidence(evidence, 'approval_granted')) {
      return {
        allowed: false,
        reason: `'awaiting_approval -> running' requires evidence containing 'approval_granted'.`,
        requiredEvidence: ['approval_granted'],
        issues: [`No approval_granted evidence found`],
      };
    }
  }

  return { allowed: true, reason: `Transition '${edge}' is allowed.`, requiredEvidence: [], issues };
}
