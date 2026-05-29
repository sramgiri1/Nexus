import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata,
} from "./founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE = "P122.3";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES = [
  "authority_blocked",
  "needs_boundary_review",
  "needs_runtime_guard_review",
  "ready_for_safe_dry_run",
];

const DEFAULT_BLOCKERS = [
  "Approval decision application authority is not granted.",
  "DB and runtime writes remain blocked.",
  "Runtime execution and execution unlock remain blocked.",
  "Provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES.includes(value)
    ? value
    : "authority_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_dry_run";
  return [
    {
      label: "Authority handoff readiness",
      state: dryRunReady ? "ready for safe dry run" : "blocked",
      nextAction: dryRunReady
        ? "Preview authority handoff locally without applying decisions."
        : "Review authority handoff intent before any dry-run preview.",
      disabledReason: "P122.3 models authority intent only; it does not grant approval application authority.",
      ownerCapability: "NEXUS Approval Application Authority Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Prior boundary readiness",
      state: "blocked",
      nextAction: "Keep P121 approval application boundary as read-only source context.",
      disabledReason: "P122.3 does not read or persist approval decisions.",
      ownerCapability: "NEXUS Approval Source Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Runtime guard readiness",
      state: "blocked",
      nextAction: "Keep runtime admission and execution unlock behind later explicit authority.",
      disabledReason: "P122.3 cannot unlock runtime execution.",
      ownerCapability: "NEXUS Runtime Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Operator evidence readiness",
      state: "blocked",
      nextAction: "Carry display-safe evidence labels into P122.4 safe dry-run preview.",
      disabledReason: "P122.3 does not create evidence, audit, approval, or runtime records.",
      ownerCapability: "NEXUS Operator Evidence Guard",
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
  ];
}

export function buildFounderApprovalDecisionApplicationAuthorityIntentModel(input = {}) {
  const metadata = buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future approval decision application authority handoff review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval application authority remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE,
    sourceMetadataPhase: metadata.phaseId,
    sourceMetadataVersion: metadata.metadataVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_dry_run"
      ? "Ready for safe dry-run planning"
      : "Approval application authority unavailable",
    founderIdeaSummary,
    authorityCandidateCount: 0,
    handoffCandidateCount: 0,
    applicationCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the local authority handoff in P122.4 before any application path exists."),
    disabledReason: cleanText(input.disabledReason, "P122.3 models approval application authority intent only; it does not grant authority."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Decision Application Authority Guard"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P122 approval authority evidence"))
      : ["P122.2 authority metadata", "P122.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P122 approval authority activity"))
      : ["P122.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    approvalDecisionApplied: false,
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    authorityHandoffGranted: false,
    runtimeAdmissionGranted: false,
    dbWritePerformed: false,
    runtimeWritePerformed: false,
    executionUnlocked: false,
    providerCallPerformed: false,
    agentDispatchPerformed: false,
    workerExecutionPerformed: false,
    toolExecutionPerformed: false,
    projectMutationPerformed: false,
    networkCallPerformed: false,
    providerSpendPerformed: false,
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS },
    metadataSectionLabels: metadata.sections.map((section) => section.publicLabel),
  };
}

export function validateFounderApprovalDecisionApplicationAuthorityIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval application authority intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval application authority intent model phase.");
  }
  if (model.sourceMetadataPhase !== "P122.2" || model.sourceMetadataVersion !== "1.0") {
    errors.push("Authority intent model must reuse P122.2 metadata.");
  }
  if (!FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES.includes(model.intentState)) {
    errors.push("Authority intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Authority intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "authorityCandidateCount",
    "handoffCandidateCount",
    "applicationCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  for (const key of [
    "approvalDecisionApplied",
    "approvalDecisionPersisted",
    "approvalDecisionRecorded",
    "authorityHandoffGranted",
    "runtimeAdmissionGranted",
    "dbWritePerformed",
    "runtimeWritePerformed",
    "executionUnlocked",
    "providerCallPerformed",
    "agentDispatchPerformed",
    "workerExecutionPerformed",
    "toolExecutionPerformed",
    "projectMutationPerformed",
    "networkCallPerformed",
    "providerSpendPerformed",
  ]) {
    if (model[key] !== false) errors.push(`${key} must remain false.`);
  }
  if (!model.authorityFlags || Object.values(model.authorityFlags).some((value) => value !== false)) {
    errors.push("All approval application authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 4) {
    errors.push("Four readiness rows are required.");
  } else if (model.readinessRows.some((row) => (
    row.canApplyDecision !== false
    || row.canWriteDb !== false
    || row.canWriteRuntime !== false
    || row.canUnlockExecution !== false
    || row.canDispatchAgent !== false
    || row.canSpend !== false
  ))) {
    errors.push("Readiness rows must not grant approval application, writes, execution unlock, dispatch, or spend.");
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
  if (!Array.isArray(model.metadataSectionLabels) || model.metadataSectionLabels.length !== 4) {
    errors.push("Display-safe metadata section labels are required.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
