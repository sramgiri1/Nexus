import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionApplicationEligibilityMetadata,
} from "./founderApprovalDecisionApplicationEligibilityMetadata.js";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE = "P121.3";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES = [
  "application_blocked",
  "needs_persisted_decision_review",
  "ready_for_safe_dry_run",
  "blocked_no_application_authority",
];

const DEFAULT_BLOCKERS = [
  "Approval decision application is not enabled.",
  "Approval decision persistence remains blocked.",
  "DB and runtime writes remain blocked.",
  "Execution unlock remains blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES.includes(value)
    ? value
    : "application_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_dry_run";
  return [
    {
      label: "Application intent readiness",
      state: dryRunReady ? "ready for safe dry run" : "blocked",
      nextAction: dryRunReady
        ? "Preview the approval application boundary without applying decisions."
        : "Review the approval application intent before dry-run planning.",
      disabledReason: "P121.3 models intent only; it does not apply approval decisions.",
      ownerCapability: "NEXUS Approval Decision Application Boundary",
      canApplyDecision: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
    {
      label: "Decision source readiness",
      state: "blocked",
      nextAction: "Keep persisted decision reads disabled until a later approved application phase.",
      disabledReason: "No approval decision application source is available in P121.3.",
      ownerCapability: "NEXUS Approval Source Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
    {
      label: "Runtime authority readiness",
      state: "blocked",
      nextAction: "Route any future runtime unlock through governed admission and execution controls.",
      disabledReason: "Approval decision application cannot unlock runtime execution in P121.3.",
      ownerCapability: "NEXUS Runtime Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
  ];
}

export function buildFounderApprovalDecisionApplicationIntentModel(input = {}) {
  const metadata = buildFounderApprovalDecisionApplicationEligibilityMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future founder approval decision application review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval decision application remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE,
    sourceMetadataPhase: metadata.phaseId,
    sourceMetadataVersion: metadata.metadataVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_dry_run"
      ? "Ready for safe dry-run planning"
      : "Approval decision application unavailable",
    founderIdeaSummary,
    applicationCandidateCount: 0,
    applicableDecisionCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the application boundary in P121.4 before any application path exists."),
    disabledReason: cleanText(input.disabledReason, "P121.3 models approval decision application intent only; it does not apply decisions."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Decision Application Boundary"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P121 approval application evidence"))
      : ["P121.2 eligibility metadata", "P121.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P121 approval application activity"))
      : ["P121.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    approvalDecisionApplied: false,
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    approvalDecisionAccepted: false,
    approvalDecisionRejected: false,
    dbWritePerformed: false,
    runtimeWritePerformed: false,
    executionUnlocked: false,
    providerCallPerformed: false,
    agentDispatchPerformed: false,
    projectMutationPerformed: false,
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS },
    metadataSectionLabels: metadata.sections.map((section) => section.publicLabel),
  };
}

export function validateFounderApprovalDecisionApplicationIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval decision application intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval decision application intent model phase.");
  }
  if (model.sourceMetadataPhase !== "P121.2" || model.sourceMetadataVersion !== "1.0") {
    errors.push("Approval decision application intent model must reuse P121.2 eligibility metadata.");
  }
  if (!FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES.includes(model.intentState)) {
    errors.push("Approval decision application intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Approval decision application intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "applicationCandidateCount",
    "applicableDecisionCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  if (
    model.approvalDecisionApplied !== false
    || model.approvalDecisionPersisted !== false
    || model.approvalDecisionRecorded !== false
    || model.approvalDecisionAccepted !== false
    || model.approvalDecisionRejected !== false
    || model.dbWritePerformed !== false
    || model.runtimeWritePerformed !== false
    || model.executionUnlocked !== false
    || model.providerCallPerformed !== false
    || model.agentDispatchPerformed !== false
    || model.projectMutationPerformed !== false
  ) {
    errors.push("Approval decision application, writes, execution, dispatch, and project mutation must remain blocked in P121.3.");
  }
  if (!model.authorityFlags || Object.values(model.authorityFlags).some((value) => value !== false)) {
    errors.push("All approval decision application authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 3) {
    errors.push("Three readiness rows are required.");
  } else if (model.readinessRows.some((row) => row.canApplyDecision !== false || row.canWriteDb !== false || row.canUnlockExecution !== false)) {
    errors.push("Readiness rows must not grant approval application, DB writes, or execution unlock.");
  }
  for (const key of ["founderIdeaSummary", "nextAction", "disabledReason", "ownerCapability", "costImpactLabel"]) {
    if (!model[key]) errors.push(`Missing ${key}.`);
  }
  if (!Array.isArray(model.blockers) || model.blockers.length === 0) {
    errors.push("Blockers are required.");
  }
  if (!Array.isArray(model.evidenceLabels) || model.evidenceLabels.length === 0) {
    errors.push("Evidence labels are required.");
  }
  if (!Array.isArray(model.activityLabels) || model.activityLabels.length === 0) {
    errors.push("Activity labels are required.");
  }
  if (!Array.isArray(model.metadataSectionLabels) || model.metadataSectionLabels.length !== 3) {
    errors.push("Display-safe metadata section labels are required.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
