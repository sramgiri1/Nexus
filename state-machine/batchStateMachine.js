/**
 * Batch state machine.
 * Pure functions only — no file writes, no network, no mutation.
 */

export const BATCH_STATES = Object.freeze({
  BATCH_PENDING:        'batch_pending',
  DRY_RUN_SUBMITTED:    'dry_run_submitted',
  PROVIDER_SUBMITTED:   'provider_submitted',
  PROVIDER_PROCESSING:  'provider_processing',
  PROVIDER_COMPLETED:   'provider_completed',
  PROVIDER_FAILED:      'provider_failed',
  RECONCILED:           'reconciled',
  FAILED:               'failed',
});

export const FINAL_BATCH_STATES = new Set([
  BATCH_STATES.RECONCILED,
  BATCH_STATES.FAILED,
]);

const ALLOWED_EDGES = new Set([
  'batch_pending->dry_run_submitted',
  'batch_pending->provider_submitted',
  'provider_submitted->provider_processing',
  'provider_submitted->provider_completed',
  'provider_submitted->provider_failed',
  'provider_processing->provider_completed',
  'provider_processing->provider_failed',
  'provider_completed->reconciled',
  'provider_failed->failed',
  'dry_run_submitted->batch_pending',
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
 * canTransitionBatch — validate whether a batch state transition is allowed.
 *
 * @param {object} params
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.actor
 * @param {string} [params.provider]
 * @param {Array}  [params.evidence]
 * @param {object} [params.context]
 * @returns {{ allowed: boolean, reason: string, requiredEvidence: string[], issues: string[] }}
 */
export function canTransitionBatch({ from, to, actor, provider, evidence = [], context = {} }) {
  if (FINAL_BATCH_STATES.has(from)) {
    return {
      allowed: false,
      reason: `Batch state '${from}' is final — no further transitions allowed.`,
      requiredEvidence: [],
      issues: [`'${from}' is a final batch state`],
    };
  }

  const edge = `${from}->${to}`;
  if (!ALLOWED_EDGES.has(edge)) {
    return {
      allowed: false,
      reason: `Transition '${edge}' is not a defined batch state edge.`,
      requiredEvidence: [],
      issues: [`No edge '${edge}' in batch state machine`],
    };
  }

  // Reconciliation requires provider output evidence.
  if (from === BATCH_STATES.PROVIDER_COMPLETED && to === BATCH_STATES.RECONCILED) {
    const hasOutput = hasEvidence(evidence, 'provider_output')
      || hasEvidence(evidence, 'batch_result')
      || hasEvidence(evidence, 'batch output');
    if (!hasOutput) {
      return {
        allowed: false,
        reason: `'provider_completed -> reconciled' requires evidence containing 'provider_output', 'batch_result', or "batch output".`,
        requiredEvidence: ['provider_output or batch_result'],
        issues: [`No provider output evidence found for reconciliation`],
      };
    }
  }

  // Failed transition requires error evidence.
  if (from === BATCH_STATES.PROVIDER_FAILED && to === BATCH_STATES.FAILED) {
    const hasError = hasEvidence(evidence, 'provider_error')
      || hasEvidence(evidence, 'provider error');
    if (!hasError) {
      return {
        allowed: false,
        reason: `'provider_failed -> failed' requires evidence containing 'provider_error' or "provider error".`,
        requiredEvidence: ['provider_error'],
        issues: [`No provider_error evidence found`],
      };
    }
  }

  return { allowed: true, reason: `Batch transition '${edge}' is allowed.`, requiredEvidence: [], issues: [] };
}
