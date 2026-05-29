import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityActivationEligibilityMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE = "P123.3";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES = [
  "activation_blocked",
  "needs_prior_handoff_review",
  "needs_runtime_guard_review",
  "ready_for_safe_activation_dry_run",
];

const DEFAULT_BLOCKERS = [
  "Approval application authority activation is not granted.",
  "Authority grant and approval decision application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES.includes(value)
    ? value
    : "activation_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_activation_dry_run";
  return [
    {
      label: "Activation readiness",
      state: dryRunReady ? "ready for safe dry run" : "blocked",
      nextAction: dryRunReady
        ? "Preview activation locally without granting authority."
        : "Review activation intent before any dry-run preview.",
      disabledReason: "P123.3 models activation intent only; it does not activate approval application authority.",
      ownerCapability: "NEXUS Approval Application Authority Activation Guard",
      canActivateAuthority: false,
      canGrantAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Prior handoff readiness",
      state: "blocked",
      nextAction: "Keep P122 authority handoff as read-only source context.",
      disabledReason: "P123.3 does not apply or persist approval decisions.",
      ownerCapability: "NEXUS Approval Authority Handoff Guard",
      canActivateAuthority: false,
      canGrantAuthority: false,
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
      nextAction: "Keep runtime writes and execution unlock behind later explicit authority.",
      disabledReason: "P123.3 cannot write runtime state or unlock execution.",
      ownerCapability: "NEXUS Runtime Guard",
      canActivateAuthority: false,
      canGrantAuthority: false,
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
      nextAction: "Carry display-safe evidence labels into P123.4 safe dry-run preview.",
      disabledReason: "P123.3 does not create evidence, audit, approval, or runtime records.",
      ownerCapability: "NEXUS Operator Evidence Guard",
      canActivateAuthority: false,
      canGrantAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityActivationIntentModel(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future approval application authority activation review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval application authority activation remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE,
    sourceMetadataPhase: metadata.phaseId,
    sourceMetadataVersion: metadata.metadataVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_activation_dry_run"
      ? "Ready for safe activation dry-run planning"
      : "Approval application authority activation unavailable",
    founderIdeaSummary,
    activationCandidateCount: 0,
    authorityGrantCandidateCount: 0,
    applicationCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the local activation intent in P123.4 before any authority path exists."),
    disabledReason: cleanText(input.disabledReason, "P123.3 models approval application authority activation intent only; it does not activate authority."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Application Authority Activation Guard"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P123 activation evidence"))
      : ["P123.2 activation metadata", "P123.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P123 activation activity"))
      : ["P123.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    authorityActivated: false,
    authorityGranted: false,
    approvalDecisionApplied: false,
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    activationPersisted: false,
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
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS },
    metadataSectionLabels: metadata.sections.map((section) => section.publicLabel),
  };
}

export function validateFounderApprovalApplicationAuthorityActivationIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval application authority activation intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval application authority activation intent model phase.");
  }
  if (model.sourceMetadataPhase !== "P123.2" || model.sourceMetadataVersion !== "1.0") {
    errors.push("Activation intent model must reuse P123.2 metadata.");
  }
  if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES.includes(model.intentState)) {
    errors.push("Activation intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Activation intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "activationCandidateCount",
    "authorityGrantCandidateCount",
    "applicationCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  for (const key of [
    "authorityActivated",
    "authorityGranted",
    "approvalDecisionApplied",
    "approvalDecisionPersisted",
    "approvalDecisionRecorded",
    "activationPersisted",
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
    errors.push("All activation authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 4) {
    errors.push("Four readiness rows are required.");
  } else if (model.readinessRows.some((row) => (
    row.canActivateAuthority !== false
    || row.canGrantAuthority !== false
    || row.canApplyDecision !== false
    || row.canWriteDb !== false
    || row.canWriteRuntime !== false
    || row.canUnlockExecution !== false
    || row.canDispatchAgent !== false
    || row.canSpend !== false
  ))) {
    errors.push("Readiness rows must not grant activation, approval application, writes, execution unlock, dispatch, or spend.");
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
