/**
 * Gate state machine.
 * Pure functions only — no file writes, no network, no mutation.
 */

export const GATE_STATES = Object.freeze({
  NOT_REQUIRED:             'not_required',
  PENDING:                  'pending',
  RUNNING:                  'running',
  PASSED:                   'passed',
  FAILED:                   'failed',
  WAIVED_REQUIRES_APPROVAL: 'waived_requires_approval',
});

export const FINAL_GATE_STATES = new Set([
  GATE_STATES.NOT_REQUIRED,
  GATE_STATES.PASSED,
  GATE_STATES.WAIVED_REQUIRES_APPROVAL,
]);

// Authoritative actors for each gate.
const GATE_ACTORS = {
  AUDITOR: new Set(['auditor', 'loop', 'state-machine']),
  SENTINEL: new Set(['sentinel', 'loop', 'state-machine']),
  WARDEN: new Set(['warden', 'loop', 'state-machine']),
};

const ALLOWED_EDGES = new Set([
  'pending->running',
  'running->passed',
  'running->failed',
  'failed->running',
  'pending->waived_requires_approval',
  'failed->waived_requires_approval',
]);

function hasEvidence(evidence, typeOrStr) {
  if (!Array.isArray(evidence)) return false;
  return evidence.some(e => {
    if (typeof e === 'string') return e.includes(typeOrStr);
    if (e && typeof e === 'object') return e.type === typeOrStr || (typeof e.type === 'string' && e.type.includes(typeOrStr));
    return false;
  });
}

function hasPassEvidence(evidence) {
  return hasEvidence(evidence, 'skill_result')
    || hasEvidence(evidence, 'report')
    || hasEvidence(evidence, 'verification_contract')
    || hasEvidence(evidence, 'PASS');
}

/**
 * canTransitionGate — validate whether a gate state transition is allowed.
 *
 * @param {object} params
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.actor
 * @param {string} [params.gate]  - AUDITOR | SENTINEL | WARDEN
 * @param {Array}  [params.evidence]
 * @param {object} [params.context]
 * @returns {{ allowed: boolean, reason: string, requiredEvidence: string[], issues: string[] }}
 */
export function canTransitionGate({ from, to, actor, gate, evidence = [], context = {} }) {
  // Final state check — not_required and passed are final but waived requires explicit check.
  if (FINAL_GATE_STATES.has(from)) {
    return {
      allowed: false,
      reason: `Gate state '${from}' is final — no further transitions allowed.`,
      requiredEvidence: [],
      issues: [`'${from}' is a final gate state`],
    };
  }

  const edge = `${from}->${to}`;
  if (!ALLOWED_EDGES.has(edge)) {
    return {
      allowed: false,
      reason: `Transition '${edge}' is not a defined gate state edge.`,
      requiredEvidence: [],
      issues: [`No edge '${edge}' in gate state machine`],
    };
  }

  // Gate actor enforcement for pass/fail.
  if (to === GATE_STATES.PASSED || to === GATE_STATES.FAILED) {
    const allowedActors = gate ? GATE_ACTORS[gate] : null;
    if (allowedActors && !allowedActors.has(actor)) {
      return {
        allowed: false,
        reason: `Actor '${actor}' is not authorized to pass or fail gate '${gate}'. Authorized actors: ${[...allowedActors].join(', ')}.`,
        requiredEvidence: ['skill_result or verification_contract'],
        issues: [`Actor '${actor}' is not a gate actor for ${gate}`],
      };
    }

    if (to === GATE_STATES.PASSED && !hasPassEvidence(evidence)) {
      return {
        allowed: false,
        reason: `Passing a gate requires deterministic evidence: skill_result, report, verification_contract, or string containing "PASS".`,
        requiredEvidence: ['skill_result', 'report', 'verification_contract'],
        issues: [`No PASS evidence found for gate transition`],
      };
    }
  }

  // Waiver requires approval.
  if (to === GATE_STATES.WAIVED_REQUIRES_APPROVAL) {
    if (!hasEvidence(evidence, 'approval_granted')) {
      return {
        allowed: false,
        reason: `Gate waiver requires evidence containing 'approval_granted'.`,
        requiredEvidence: ['approval_granted'],
        issues: [`No approval_granted evidence found for gate waiver`],
      };
    }
  }

  return { allowed: true, reason: `Gate transition '${edge}' is allowed.`, requiredEvidence: [], issues: [] };
}
