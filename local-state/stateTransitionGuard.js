import { canTransition, normalizeActor } from "../state-machine/transitionValidator.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function normalizeEvidenceEntry(entry) {
  if (typeof entry === "string") {
    return {
      type: entry,
      reference: "",
    };
  }

  if (entry && typeof entry === "object") {
    return {
      type: normalizeString(entry.type) || normalizeString(entry.result),
      reference:
        normalizeString(entry.reference) ||
        normalizeString(entry.evidenceId) ||
        normalizeString(entry.id),
    };
  }

  return {
    type: "",
    reference: "",
  };
}

export function normalizeTransitionActor(input = {}) {
  if (typeof input === "string") {
    return normalizeActor(input);
  }

  return normalizeActor(
    normalizeString(input.actor) ||
      normalizeString(input.actorId) ||
      normalizeString(input.agentId) ||
      normalizeString(input.context?.actorId) ||
      normalizeString(input.context?.agentId)
  );
}

export function buildTransitionEvidence(input = {}) {
  const evidence = ensureArray(input.evidence)
    .map((entry) => normalizeEvidenceEntry(entry))
    .filter((entry) => entry.type || entry.reference);

  return {
    entityType: "task",
    entityId: normalizeString(input.entityId) || normalizeString(input.taskId),
    projectId: normalizeString(input.projectId),
    taskId: normalizeString(input.taskId),
    fromState: normalizeString(input.fromState),
    toState: normalizeString(input.toState),
    actor: normalizeTransitionActor(input),
    agentId: normalizeString(input.agentId),
    reason: normalizeString(input.reason),
    evidenceCount: evidence.length,
    evidenceTypes: [...new Set(evidence.map((entry) => entry.type).filter(Boolean))],
    evidenceReferences: evidence
      .map((entry) => entry.reference)
      .filter(Boolean),
    validatedAt: new Date().toISOString(),
  };
}

export function createTransitionGuardResult(input = {}) {
  return {
    allowed: Boolean(input.allowed),
    reason: normalizeString(input.reason),
    errors: ensureArray(input.errors).map((entry) => String(entry)),
    warnings: ensureArray(input.warnings).map((entry) => String(entry)),
    evidenceRequired: ensureArray(input.evidenceRequired).map((entry) =>
      String(entry)
    ),
    transitionEvidence:
      input.transitionEvidence && typeof input.transitionEvidence === "object"
        ? input.transitionEvidence
        : {},
  };
}

export function validateLocalTaskTransition(input = {}) {
  const errors = [];
  const warnings = [];

  if (normalizeString(input.entityType || "task") !== "task") {
    errors.push("Only task transitions are supported in local state enforcement.");
  }

  const fromState = normalizeString(input.fromState);
  const toState = normalizeString(input.toState);
  const actor = normalizeTransitionActor(input);
  const evidence = ensureArray(input.evidence);

  if (!fromState) {
    errors.push("fromState is required.");
  }

  if (!toState) {
    errors.push("toState is required.");
  }

  if (!actor) {
    warnings.push("missing_actor");
  }

  if (!Array.isArray(input.evidence)) {
    warnings.push("evidence should be an array.");
  }

  const transitionEvidence = buildTransitionEvidence({
    ...input,
    fromState,
    toState,
    evidence,
    actor,
  });

  if (errors.length > 0) {
    return createTransitionGuardResult({
      allowed: false,
      reason: "Task transition input is incomplete.",
      errors,
      warnings,
      evidenceRequired: [],
      transitionEvidence,
    });
  }

  const validatorResult = canTransition({
    entityType: "task",
    from: fromState,
    to: toState,
    actor,
    agentId: normalizeString(input.agentId),
    taskType: normalizeString(input.context?.taskType) || normalizeString(input.taskType),
    evidence,
    context:
      input.context && typeof input.context === "object" ? input.context : {},
  });

  const validatorIssues = ensureArray(validatorResult.issues);
  const reason =
    normalizeString(validatorResult.reason) ||
    (validatorResult.allowed
      ? `Transition '${fromState}->${toState}' is allowed.`
      : `Transition '${fromState}->${toState}' is blocked.`);

  return createTransitionGuardResult({
    allowed: validatorResult.allowed,
    reason,
    errors: validatorResult.allowed ? [] : validatorIssues,
    warnings,
    evidenceRequired: ensureArray(validatorResult.requiredEvidence),
    transitionEvidence: {
      ...transitionEvidence,
      validatorReason: reason,
      validatorIssues,
    },
  });
}
