export const RECOVERY_ACTION_PREVIEW_STATES = Object.freeze([
  "preview_only",
  "blocked",
  "missing_context",
  "requires_later_phase",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map(normalizeString).filter(Boolean) : [];
}

function resolveState(missingContext = [], blockedReasons = []) {
  if (blockedReasons.length > 0) return "blocked";
  if (missingContext.length > 0) return "missing_context";
  return "requires_later_phase";
}

export function buildReplayPlanPreview(input = {}) {
  const requiredContext = normalizeArray(input.requiredContext).length
    ? normalizeArray(input.requiredContext)
    : [
      "Redacted snapshot metadata",
      "Recovery point posture",
      "Evidence summary",
      "Approved replay execution phase",
    ];
  const providedContext = new Set(normalizeArray(input.providedContext));
  const missingContext = requiredContext.filter((item) => !providedContext.has(item));
  const blockedReasons = normalizeArray(input.blockedReasons);
  const state = RECOVERY_ACTION_PREVIEW_STATES.includes(input.state)
    ? input.state
    : resolveState(missingContext, blockedReasons);

  return {
    actionPreviewId: normalizeString(input.actionPreviewId) || "replay_preview",
    actionLabel: "Replay",
    state,
    previewOnly: true,
    executionEnabled: false,
    disabledReason:
      normalizeString(input.disabledReason)
      || "Replay is disabled; this preview only lists context required for a later governed phase.",
    requiredContext,
    missingContext,
    blockedReasons,
    evidenceRefs: normalizeArray(input.evidenceRefs),
    nextSafeActionLabel:
      normalizeString(input.nextSafeActionLabel)
      || (missingContext.length ? "Collect missing context before replay can be planned." : "Review replay preview; execution remains disabled."),
  };
}

export function validateReplayResumePreview(preview = {}) {
  const errors = [];

  for (const field of [
    "actionPreviewId",
    "actionLabel",
    "state",
    "disabledReason",
    "nextSafeActionLabel",
  ]) {
    if (!normalizeString(preview[field])) errors.push(`missing_${field}`);
  }

  if (!RECOVERY_ACTION_PREVIEW_STATES.includes(preview.state)) errors.push("invalid_state");
  if (preview.previewOnly !== true) errors.push("preview_only_required");
  if (preview.executionEnabled !== false) errors.push("execution_must_remain_disabled");
  if (!Array.isArray(preview.requiredContext) || preview.requiredContext.length === 0) {
    errors.push("required_context_missing");
  }
  if (!Array.isArray(preview.missingContext)) errors.push("missing_context_must_be_array");
  if (!Array.isArray(preview.evidenceRefs)) errors.push("evidence_refs_must_be_array");
  if (/\b(success|executed|restored|replayed|resumed)\b/i.test(preview.disabledReason)) {
    errors.push("disabled_reason_implies_execution_success");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
