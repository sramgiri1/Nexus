import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_PHASE = "P126.3";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_STATES = [
  "acceptance_blocked",
  "needs_handoff_boundary_review",
  "needs_runtime_acceptance_guard_review",
  "ready_for_safe_acceptance_dry_run",
];

const DEFAULT_BLOCKERS = [
  "Approval application authority grant handoff acceptance is not allowed.",
  "Authority handoff, authority grant, activation, and approval application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_STATES.includes(value)
    ? value
    : "acceptance_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_acceptance_dry_run";
  return [
    {
      label: "Acceptance readiness",
      state: dryRunReady ? "ready for safe dry run" : "blocked",
      nextAction: dryRunReady
        ? "Preview acceptance readiness locally without accepting handoff."
        : "Review acceptance intent before any dry-run preview.",
      disabledReason: "P126.3 models acceptance intent only; it does not accept handoff.",
      ownerCapability: "NEXUS Approval Application Authority Grant Handoff Acceptance Guard",
      canAcceptHandoff: false,
      canCaptureAcceptance: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Prior handoff boundary readiness",
      state: "blocked",
      nextAction: "Keep P125 handoff metadata as read-only source context.",
      disabledReason: "P126.3 does not hand off or accept authority.",
      ownerCapability: "NEXUS Approval Application Authority Grant Handoff Guard",
      canAcceptHandoff: false,
      canCaptureAcceptance: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Runtime acceptance guard readiness",
      state: "blocked",
      nextAction: "Keep runtime writes and execution unlock behind later explicit authority.",
      disabledReason: "P126.3 cannot write runtime state or unlock execution.",
      ownerCapability: "NEXUS Runtime Guard",
      canAcceptHandoff: false,
      canCaptureAcceptance: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Operator acceptance evidence readiness",
      state: "blocked",
      nextAction: "Carry display-safe evidence labels into P126.4 safe dry-run preview.",
      disabledReason: "P126.3 does not create evidence, audit, approval, or runtime records.",
      ownerCapability: "NEXUS Operator Evidence Guard",
      canAcceptHandoff: false,
      canCaptureAcceptance: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyDecision: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future approval application authority grant handoff acceptance review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval application authority grant handoff acceptance remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_PHASE,
    sourceMetadataPhase: metadata.phaseId,
    sourceMetadataVersion: metadata.metadataVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_acceptance_dry_run"
      ? "Ready for safe acceptance dry-run planning"
      : "Approval application authority grant handoff acceptance unavailable",
    founderIdeaSummary,
    acceptanceCandidateCount: 0,
    acceptanceCaptureCandidateCount: 0,
    handoffCandidateCount: 0,
    grantCandidateCount: 0,
    activationCandidateCount: 0,
    applicationCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the local acceptance intent in P126.4 before any authority path exists."),
    disabledReason: cleanText(input.disabledReason, "P126.3 models approval application authority grant handoff acceptance intent only; it does not accept handoff."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Application Authority Grant Handoff Acceptance Guard"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P126 acceptance evidence"))
      : ["P126.2 acceptance metadata", "P126.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P126 acceptance activity"))
      : ["P126.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    handoffAccepted: false,
    acceptanceCaptured: false,
    authorityHandedOff: false,
    authorityGranted: false,
    authorityActivated: false,
    approvalDecisionApplied: false,
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    acceptancePersisted: false,
    handoffPersisted: false,
    grantPersisted: false,
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
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS },
    metadataSectionLabels: metadata.sections.map((section) => section.publicLabel),
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval application authority grant handoff acceptance intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval application authority grant handoff acceptance intent model phase.");
  }
  if (model.sourceMetadataPhase !== "P126.2" || model.sourceMetadataVersion !== "1.0") {
    errors.push("Acceptance intent model must reuse P126.2 metadata.");
  }
  if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_STATES.includes(model.intentState)) {
    errors.push("Acceptance intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Acceptance intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "acceptanceCandidateCount",
    "acceptanceCaptureCandidateCount",
    "handoffCandidateCount",
    "grantCandidateCount",
    "activationCandidateCount",
    "applicationCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  for (const key of [
    "handoffAccepted",
    "acceptanceCaptured",
    "authorityHandedOff",
    "authorityGranted",
    "authorityActivated",
    "approvalDecisionApplied",
    "approvalDecisionPersisted",
    "approvalDecisionRecorded",
    "acceptancePersisted",
    "handoffPersisted",
    "grantPersisted",
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
    errors.push("All acceptance authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 4) {
    errors.push("Four readiness rows are required.");
  } else if (model.readinessRows.some((row) => (
    row.canAcceptHandoff !== false
    || row.canCaptureAcceptance !== false
    || row.canHandoffAuthority !== false
    || row.canGrantAuthority !== false
    || row.canActivateAuthority !== false
    || row.canApplyDecision !== false
    || row.canWriteDb !== false
    || row.canWriteRuntime !== false
    || row.canUnlockExecution !== false
    || row.canDispatchAgent !== false
    || row.canSpend !== false
  ))) {
    errors.push("Readiness rows must keep all action flags false.");
  }
  if (!Array.isArray(model.blockers) || model.blockers.length === 0) {
    errors.push("Blockers are required.");
  }
  return { valid: errors.length === 0, errors };
}
