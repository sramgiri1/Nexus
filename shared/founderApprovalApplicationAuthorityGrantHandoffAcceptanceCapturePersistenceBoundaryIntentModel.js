import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE = "P128.3";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES = [
  "acceptance_capture_persistence_blocked",
  "needs_capture_persistence_metadata_review",
  "needs_runtime_persistence_guard_review",
  "ready_for_safe_capture_persistence_dry_run",
];

const DEFAULT_BLOCKERS = [
  "Acceptance capture persistence is not allowed.",
  "DB schemas, migrations, DB writes, and runtime writes remain blocked.",
  "Acceptance capture, handoff acceptance, authority handoff, authority grant, activation, approval application, and approve/reject recording remain blocked.",
  "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES.includes(value)
    ? value
    : "acceptance_capture_persistence_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_capture_persistence_dry_run";
  return [
    {
      label: "Persistence draft readiness",
      state: dryRunReady ? "ready for safe dry run" : "blocked",
      nextAction: dryRunReady
        ? "Preview persistence requirements locally without writing records."
        : "Review persistence intent before any dry-run preview.",
      disabledReason: "P128.3 models acceptance capture persistence intent only; it does not persist acceptance capture.",
      ownerCapability: "NEXUS Acceptance Capture Persistence Guard",
      canPersistCapture: false,
      canCreateSchema: false,
      canRunMigration: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canCaptureAcceptance: false,
      canAcceptHandoff: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyApproval: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Persistence write readiness",
      state: "blocked",
      nextAction: "Keep DB and runtime writes disabled until a later explicit authority phase.",
      disabledReason: "P128.3 has no local or hosted DB write authority.",
      ownerCapability: "NEXUS Persistence Guard",
      canPersistCapture: false,
      canCreateSchema: false,
      canRunMigration: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canCaptureAcceptance: false,
      canAcceptHandoff: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyApproval: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Runtime persistence guard readiness",
      state: "blocked",
      nextAction: "Keep runtime execution and dispatch behind later explicit authority.",
      disabledReason: "P128.3 cannot unlock execution, dispatch agents, execute workers/tools, or mutate projects.",
      ownerCapability: "NEXUS Runtime Guard",
      canPersistCapture: false,
      canCreateSchema: false,
      canRunMigration: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canCaptureAcceptance: false,
      canAcceptHandoff: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyApproval: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
    {
      label: "Persistence evidence readiness",
      state: "blocked",
      nextAction: "Carry display-safe evidence labels into P128.4 safe dry-run preview.",
      disabledReason: "P128.3 does not create evidence, audit, approval, capture, DB, or runtime records.",
      ownerCapability: "NEXUS Evidence Guard",
      canPersistCapture: false,
      canCreateSchema: false,
      canRunMigration: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canCaptureAcceptance: false,
      canAcceptHandoff: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canApplyApproval: false,
      canUnlockExecution: false,
      canDispatchAgent: false,
      canSpend: false,
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future approval application authority grant handoff acceptance capture persistence review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Acceptance capture persistence remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE,
    sourceMetadataPhase: metadata.phaseId,
    sourceMetadataVersion: metadata.metadataVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_capture_persistence_dry_run"
      ? "Ready for safe acceptance capture persistence dry-run planning"
      : "Acceptance capture persistence unavailable",
    founderIdeaSummary,
    persistenceCandidateCount: 0,
    persistableCaptureCandidateCount: 0,
    schemaCreatableCandidateCount: 0,
    migrationRunnableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the local acceptance capture persistence intent in P128.4 before any persistence path exists."),
    disabledReason: cleanText(input.disabledReason, "P128.3 models acceptance capture persistence intent only; it does not write records."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Acceptance Capture Persistence Guard"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P128 persistence evidence"))
      : ["P128.2 persistence metadata", "P128.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P128 persistence activity"))
      : ["P128.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    acceptanceCapturePersisted: false,
    acceptanceCapturePersistenceDrafted: false,
    acceptanceCapturePersistenceEventCreated: false,
    acceptanceCapturePersistenceEvidenceCreated: false,
    dbSchemaCreated: false,
    dbMigrationRun: false,
    dbWritePerformed: false,
    runtimeWritePerformed: false,
    handoffAccepted: false,
    acceptanceCaptured: false,
    acceptanceRecorded: false,
    authorityHandedOff: false,
    authorityGranted: false,
    authorityActivated: false,
    approvalDecisionApplied: false,
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    executionUnlocked: false,
    providerCallPerformed: false,
    agentDispatchPerformed: false,
    workerExecutionPerformed: false,
    toolExecutionPerformed: false,
    projectMutationPerformed: false,
    networkCallPerformed: false,
    providerSpendPerformed: false,
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS },
    metadataEntityLabels: metadata.entities.map((entity) => entity.publicLabel),
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION) {
    errors.push("Unexpected acceptance capture persistence intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE) {
    errors.push("Unexpected acceptance capture persistence intent model phase.");
  }
  if (model.sourceMetadataPhase !== "P128.2" || model.sourceMetadataVersion !== "1.0") {
    errors.push("Acceptance capture persistence intent model must reuse P128.2 metadata.");
  }
  if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES.includes(model.intentState)) {
    errors.push("Acceptance capture persistence intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Acceptance capture persistence intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "persistenceCandidateCount",
    "persistableCaptureCandidateCount",
    "schemaCreatableCandidateCount",
    "migrationRunnableCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  for (const key of [
    "acceptanceCapturePersisted",
    "acceptanceCapturePersistenceDrafted",
    "acceptanceCapturePersistenceEventCreated",
    "acceptanceCapturePersistenceEvidenceCreated",
    "dbSchemaCreated",
    "dbMigrationRun",
    "dbWritePerformed",
    "runtimeWritePerformed",
    "handoffAccepted",
    "acceptanceCaptured",
    "acceptanceRecorded",
    "authorityHandedOff",
    "authorityGranted",
    "authorityActivated",
    "approvalDecisionApplied",
    "approvalDecisionPersisted",
    "approvalDecisionRecorded",
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
    errors.push("All acceptance capture persistence authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 4) {
    errors.push("Four readiness rows are required.");
  } else if (model.readinessRows.some((row) => (
    row.canPersistCapture !== false
    || row.canCreateSchema !== false
    || row.canRunMigration !== false
    || row.canWriteDb !== false
    || row.canWriteRuntime !== false
    || row.canCaptureAcceptance !== false
    || row.canAcceptHandoff !== false
    || row.canHandoffAuthority !== false
    || row.canGrantAuthority !== false
    || row.canActivateAuthority !== false
    || row.canApplyApproval !== false
    || row.canUnlockExecution !== false
    || row.canDispatchAgent !== false
    || row.canSpend !== false
  ))) {
    errors.push("Readiness rows must keep all action flags false.");
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
  if (!Array.isArray(model.metadataEntityLabels) || model.metadataEntityLabels.length !== 3) {
    errors.push("Display-safe metadata entity labels are required.");
  }
  return { valid: errors.length === 0, errors };
}
