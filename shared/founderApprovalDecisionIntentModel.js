import {
  FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionSchemaMetadata,
} from "./founderApprovalDecisionSchemaMetadata.js";

export const FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE = "P119.3";
export const FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_INTENT_STATES = [
  "not_requested",
  "needs_founder_decision_review",
  "blocked_no_decision_recording",
  "ready_for_future_decision_boundary",
];

const DEFAULT_BLOCKERS = [
  "Approval decision recording is not enabled.",
  "Approve/reject persistence is not enabled.",
  "Runtime execution remains blocked.",
  "Execution unlock remains blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_DECISION_INTENT_STATES.includes(value)
    ? value
    : "blocked_no_decision_recording";
}

export function buildFounderApprovalDecisionIntentModel(input = {}) {
  const schemaMetadata = buildFounderApprovalDecisionSchemaMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderQuestion = cleanText(
    input.founderQuestion,
    "Should this future runtime approval request be eligible for founder decision review?",
  );
  const requestedDecisionLabel = cleanText(input.requestedDecisionLabel, "Future founder decision review only");
  const proposedDecisionLabel = cleanText(input.proposedDecisionLabel, "No decision recorded");
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval decision recording remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE,
    sourceSchemaPhase: schemaMetadata.phaseId,
    modelOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_future_decision_boundary"
      ? "Ready for future decision boundary preview"
      : "Approval decision recording unavailable",
    founderQuestion,
    requestedDecisionLabel,
    proposedDecisionLabel,
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the decision boundary in P119.4 before any decision control exists."),
    disabledReason: cleanText(input.disabledReason, "P119.3 models approval decision intent only; it does not record or persist decisions."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Decision Boundary"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P119 approval decision evidence"))
      : ["P119.2 schema metadata", "P119.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P119 approval decision activity"))
      : ["P119.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    approvalDecisionRecorded: false,
    approvalDecisionPersisted: false,
    approvalDecisionAccepted: false,
    approvalDecisionRejected: false,
    executionUnlocked: false,
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS },
    schemaEntityNames: schemaMetadata.entities.map((entity) => entity.entityName),
  };
}

export function validateFounderApprovalDecisionIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval decision intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval decision intent model phase.");
  }
  if (model.sourceSchemaPhase !== "P119.2") {
    errors.push("Approval decision intent model must reuse P119.2 schema metadata.");
  }
  if (!FOUNDER_APPROVAL_DECISION_INTENT_STATES.includes(model.intentState)) {
    errors.push("Approval decision intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Approval decision intent model must remain local and hidden from primary UX.");
  }
  if (
    model.approvalDecisionRecorded !== false
    || model.approvalDecisionPersisted !== false
    || model.approvalDecisionAccepted !== false
    || model.approvalDecisionRejected !== false
    || model.executionUnlocked !== false
  ) {
    errors.push("Approval decisions must not be recorded, persisted, accepted, rejected, or used to unlock execution in P119.3.");
  }
  if (!model.authorityFlags || Object.values(model.authorityFlags).some((value) => value !== false)) {
    errors.push("All approval decision authority flags must remain false.");
  }
  for (const key of ["founderQuestion", "requestedDecisionLabel", "proposedDecisionLabel", "nextAction", "disabledReason", "ownerCapability"]) {
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
