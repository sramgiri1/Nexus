/**
 * Release state machine.
 * Pure functions only — no file writes, no network, no mutation.
 */

import { validateReleaseContract } from '../contracts/validators/validateReleaseContract.js';

export const RELEASE_STATES = Object.freeze({
  NOT_READY:         'not_ready',
  READY_FOR_REVIEW:  'ready_for_review',
  GO:                'go',
  NO_GO:             'no_go',
  BLOCKED:           'blocked',
});

export const FINAL_RELEASE_STATES = new Set([
  RELEASE_STATES.GO,
]);

// Only control-plane actors may advance release state.
const RELEASE_CONTROL_ACTORS = new Set(['nexus', 'loop', 'state-machine']);

// Worker agents — blocked from all release state changes.
const WORKER_AGENTS = new Set([
  'core', 'swift', 'pixel', 'canvas', 'prism',
  'stream', 'radar', 'beacon', 'compass', 'oracle', 'synapse',
  'auditor', 'sentinel', 'warden',
]);

const ALLOWED_EDGES = new Set([
  'not_ready->ready_for_review',
  'ready_for_review->go',
  'ready_for_review->no_go',
  'ready_for_review->blocked',
  'blocked->ready_for_review',
  'no_go->ready_for_review',
  'go->blocked',
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
 * canTransitionRelease — validate whether a release state transition is allowed.
 *
 * @param {object} params
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.actor
 * @param {Array}  [params.evidence]
 * @param {object} [params.releaseContract] - required for go/no_go
 * @param {object} [params.context]         - context.allowRollback for go->blocked
 * @returns {{ allowed: boolean, reason: string, requiredEvidence: string[], issues: string[] }}
 */
export function canTransitionRelease({ from, to, actor, evidence = [], releaseContract, context = {} }) {
  // GO is final unless rollback is explicitly authorized.
  if (from === RELEASE_STATES.GO) {
    if (to === RELEASE_STATES.BLOCKED) {
      if (!context.allowRollback) {
        return {
          allowed: false,
          reason: `'go' is a final release state. Rollback to 'blocked' requires context.allowRollback === true.`,
          requiredEvidence: ['rollback_required'],
          issues: [`'go' is final; rollback not enabled`],
        };
      }
      if (!hasEvidence(evidence, 'rollback_required')) {
        return {
          allowed: false,
          reason: `'go -> blocked' rollback requires evidence containing 'rollback_required'.`,
          requiredEvidence: ['rollback_required'],
          issues: [`No rollback_required evidence found`],
        };
      }
      return { allowed: true, reason: `Rollback authorized: go -> blocked.`, requiredEvidence: [], issues: [] };
    }
    return {
      allowed: false,
      reason: `'go' is a final release state — no transitions allowed except rollback when context.allowRollback === true.`,
      requiredEvidence: [],
      issues: [`'go' is final`],
    };
  }

  const edge = `${from}->${to}`;
  if (!ALLOWED_EDGES.has(edge)) {
    return {
      allowed: false,
      reason: `Transition '${edge}' is not a defined release state edge.`,
      requiredEvidence: [],
      issues: [`No edge '${edge}' in release state machine`],
    };
  }

  // Workers cannot change release state.
  if (WORKER_AGENTS.has(actor)) {
    return {
      allowed: false,
      reason: `Worker '${actor}' cannot modify release state. Only nexus, loop, or state-machine may do so.`,
      requiredEvidence: [],
      issues: [`Actor '${actor}' is a worker — blocked from release transitions`],
    };
  }

  // Control-plane actor enforcement for go/no_go/blocked.
  if ([RELEASE_STATES.GO, RELEASE_STATES.NO_GO, RELEASE_STATES.BLOCKED].includes(to)) {
    if (!RELEASE_CONTROL_ACTORS.has(actor)) {
      return {
        allowed: false,
        reason: `Only nexus, loop, or state-machine can move release to '${to}'. Actor '${actor}' is not authorized.`,
        requiredEvidence: ['release_contract'],
        issues: [`Actor '${actor}' is not a release control actor`],
      };
    }
  }

  // GO requires a valid release contract with decision GO.
  if (to === RELEASE_STATES.GO) {
    if (!releaseContract) {
      return {
        allowed: false,
        reason: `Transitioning release to 'go' requires a releaseContract.`,
        requiredEvidence: ['release_contract with GO decision'],
        issues: [`No releaseContract provided`],
      };
    }
    const validation = validateReleaseContract(releaseContract);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: `Release contract failed validation: ${validation.issues.map(i => i.message).join('; ')}`,
        requiredEvidence: ['valid release_contract'],
        issues: validation.issues.map(i => i.message),
      };
    }
    if (releaseContract.releaseDecision !== 'GO') {
      return {
        allowed: false,
        reason: `Release contract releaseDecision is '${releaseContract.releaseDecision}', not 'GO'.`,
        requiredEvidence: ['release_contract with releaseDecision: GO'],
        issues: [`releaseDecision must be GO`],
      };
    }
  }

  // NO_GO requires valid contract with NO_GO or BLOCKED decision, and non-empty evidence.
  if (to === RELEASE_STATES.NO_GO) {
    if (!releaseContract) {
      return {
        allowed: false,
        reason: `Transitioning release to 'no_go' requires a releaseContract.`,
        requiredEvidence: ['release_contract'],
        issues: [`No releaseContract provided`],
      };
    }
    const validation = validateReleaseContract(releaseContract);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: `Release contract failed validation: ${validation.issues.map(i => i.message).join('; ')}`,
        requiredEvidence: ['valid release_contract'],
        issues: validation.issues.map(i => i.message),
      };
    }
    if (!['NO_GO', 'BLOCKED'].includes(releaseContract.releaseDecision)) {
      return {
        allowed: false,
        reason: `Release contract releaseDecision is '${releaseContract.releaseDecision}'. NO_GO transition requires NO_GO or BLOCKED decision.`,
        requiredEvidence: [],
        issues: [`releaseDecision must be NO_GO or BLOCKED`],
      };
    }
    if (!Array.isArray(evidence) || evidence.length === 0) {
      return {
        allowed: false,
        reason: `Transitioning to 'no_go' requires non-empty evidence explaining the decision.`,
        requiredEvidence: ['blocker or failure evidence'],
        issues: [`evidence array is empty`],
      };
    }
  }

  return { allowed: true, reason: `Release transition '${edge}' is allowed.`, requiredEvidence: [], issues: [] };
}
