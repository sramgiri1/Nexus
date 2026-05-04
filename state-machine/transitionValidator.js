/**
 * Unified transition validator.
 * Routes to the appropriate state machine based on entityType.
 * Pure functions only — no file writes, no network, no mutation.
 */

import { canTransitionTask } from './taskStateMachine.js';
import { canTransitionGate } from './gateStateMachine.js';
import { canTransitionRelease } from './releaseStateMachine.js';
import { canTransitionBatch } from './batchStateMachine.js';

/**
 * Normalize an actor name to lowercase trimmed form.
 * Handles agent IDs, loop, state-machine labels.
 */
export function normalizeActor(actor) {
  if (typeof actor !== 'string') return '';
  return actor.trim().toLowerCase();
}

/**
 * Check whether an evidence array contains a given type identifier or substring.
 *
 * @param {Array}  evidence    - array of strings or { type: string } objects
 * @param {string} typeOrStr   - type value or substring to search for
 * @returns {boolean}
 */
export function hasEvidence(evidence, typeOrStr) {
  if (!Array.isArray(evidence)) return false;
  return evidence.some(e => {
    if (typeof e === 'string') return e.includes(typeOrStr);
    if (e && typeof e === 'object') {
      return e.type === typeOrStr || (typeof e.type === 'string' && e.type.includes(typeOrStr));
    }
    return false;
  });
}

/**
 * canTransition — unified entry point for all state machine validation.
 *
 * @param {object} params
 * @param {string} params.entityType    - task | gate | release | batch
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.actor
 * @param {string} [params.agentId]     - task: the owning agent
 * @param {string} [params.taskType]    - task: task type
 * @param {string} [params.gate]        - gate: AUDITOR | SENTINEL | WARDEN
 * @param {string} [params.provider]    - batch: provider name
 * @param {Array}  [params.evidence]
 * @param {object} [params.releaseContract]
 * @param {object} [params.context]
 * @returns {{ allowed: boolean, reason: string, requiredEvidence: string[], issues: string[] }}
 */
export function canTransition({
  entityType,
  from,
  to,
  actor,
  agentId,
  taskType,
  gate,
  provider,
  evidence = [],
  releaseContract,
  context = {},
}) {
  const normalizedActor = normalizeActor(actor);

  switch (entityType) {
    case 'task':
      return canTransitionTask({
        from, to,
        actor: normalizedActor,
        agentId: agentId ? normalizeActor(agentId) : normalizedActor,
        taskType,
        evidence,
        context,
      });

    case 'gate':
      return canTransitionGate({
        from, to,
        actor: normalizedActor,
        gate,
        evidence,
        context,
      });

    case 'release':
      return canTransitionRelease({
        from, to,
        actor: normalizedActor,
        evidence,
        releaseContract,
        context,
      });

    case 'batch':
      return canTransitionBatch({
        from, to,
        actor: normalizedActor,
        provider,
        evidence,
        context,
      });

    default:
      return {
        allowed: false,
        reason: `Unknown entityType '${entityType}'. Must be one of: task, gate, release, batch.`,
        requiredEvidence: [],
        issues: [`Unknown entityType: '${entityType}'`],
      };
  }
}
