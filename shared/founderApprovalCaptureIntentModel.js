import {
  FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS,
  buildFounderApprovalCaptureSchemaMetadata,
} from "./founderApprovalCaptureSchemaMetadata.js";

export const FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE = "P118.3";
export const FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_CAPTURE_INTENT_STATES = [
  "not_requested",
  "needs_founder_review",
  "blocked_no_capture",
  "ready_for_future_capture_boundary",
];

const DEFAULT_BLOCKERS = [
  "Approval capture is not enabled.",
  "Approval persistence is not enabled.",
  "Approve/reject decision recording is not enabled.",
  "Runtime execution remains blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_CAPTURE_INTENT_STATES.includes(value) ? value : "blocked_no_capture";
}

export function buildFounderApprovalCaptureIntentModel(input = {}) {
  const schemaMetadata = buildFounderApprovalCaptureSchemaMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderQuestion = cleanText(
    input.founderQuestion,
    "Should this future runtime action be eligible for founder approval review?",
  );
  const requestedDecisionLabel = cleanText(input.requestedDecisionLabel, "Future approval review only");
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval capture remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE,
    sourceSchemaPhase: schemaMetadata.phaseId,
    modelOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_future_capture_boundary"
      ? "Ready for future capture boundary preview"
      : "Approval capture unavailable",
    founderQuestion,
    requestedDecisionLabel,
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the capture boundary in P118.4 before any UI control exists."),
    disabledReason: cleanText(input.disabledReason, "P118.3 models approval intent only; it does not capture or persist decisions."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Capture Boundary"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P118 approval capture evidence"))
      : ["P118.2 schema metadata", "P118.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P118 approval capture activity"))
      : ["P118.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    approvalDecisionRecorded: false,
    approvalIntentRecorded: false,
    authorityFlags: { ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS },
    schemaEntityNames: schemaMetadata.entities.map((entity) => entity.entityName),
  };
}

export function validateFounderApprovalCaptureIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval capture intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval capture intent model phase.");
  }
  if (!FOUNDER_APPROVAL_CAPTURE_INTENT_STATES.includes(model.intentState)) {
    errors.push("Approval capture intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Approval capture intent model must remain local and hidden from primary UX.");
  }
  if (model.approvalDecisionRecorded !== false || model.approvalIntentRecorded !== false) {
    errors.push("Approval decisions and intents must not be recorded in P118.3.");
  }
  if (!model.authorityFlags || Object.values(model.authorityFlags).some((value) => value !== false)) {
    errors.push("All approval capture authority flags must remain false.");
  }
  for (const key of ["founderQuestion", "requestedDecisionLabel", "nextAction", "disabledReason", "ownerCapability"]) {
    if (!model[key]) errors.push(`Missing ${key}.`);
  }
  if (!Array.isArray(model.evidenceLabels) || model.evidenceLabels.length === 0) {
    errors.push("Evidence labels are required.");
  }
  if (!Array.isArray(model.activityLabels) || model.activityLabels.length === 0) {
    errors.push("Activity labels are required.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
