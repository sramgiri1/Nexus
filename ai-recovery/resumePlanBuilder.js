import {
  RECOVERY_ACTION_PREVIEW_STATES,
  validateReplayResumePreview,
} from "./replayPlanBuilder.js";

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

export function buildResumePlanPreview(input = {}) {
  const requiredContext = normalizeArray(input.requiredContext).length
    ? normalizeArray(input.requiredContext)
    : [
      "Redacted snapshot metadata",
      "Recovery point chain",
      "Blocked action review",
      "Approved resume execution phase",
    ];
  const providedContext = new Set(normalizeArray(input.providedContext));
  const missingContext = requiredContext.filter((item) => !providedContext.has(item));
  const blockedReasons = normalizeArray(input.blockedReasons);
  const state = RECOVERY_ACTION_PREVIEW_STATES.includes(input.state)
    ? input.state
    : resolveState(missingContext, blockedReasons);

  return {
    actionPreviewId: normalizeString(input.actionPreviewId) || "resume_preview",
    actionLabel: "Resume",
    state,
    previewOnly: true,
    executionEnabled: false,
    disabledReason:
      normalizeString(input.disabledReason)
      || "Resume is disabled; this preview only explains requirements for a later governed phase.",
    requiredContext,
    missingContext,
    blockedReasons,
    evidenceRefs: normalizeArray(input.evidenceRefs),
    nextSafeActionLabel:
      normalizeString(input.nextSafeActionLabel)
      || (missingContext.length ? "Resolve missing context before resume can be planned." : "Review resume preview; execution remains disabled."),
  };
}

export { RECOVERY_ACTION_PREVIEW_STATES, validateReplayResumePreview };
