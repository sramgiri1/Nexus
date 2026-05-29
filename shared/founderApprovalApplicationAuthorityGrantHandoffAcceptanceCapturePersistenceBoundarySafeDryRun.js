import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE = "P128.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES = {
  READY_PERSISTENCE_BLOCKED: "acceptance capture persistence dry run ready; live persistence blocked",
  NEEDS_PERSISTENCE_INTENT_MODEL: "acceptance capture persistence dry run needs intent model",
};

const ACCEPTANCE_CAPTURE_PERSISTENCE_SAFE_DRY_RUN_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSafeDryRunWritten: false,
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
  approvalDecisionAccepted: false,
  approvalDecisionRejected: false,
  executionUnlocked: false,
  providerCallPerformed: false,
  modelCallPerformed: false,
  agentDispatchPerformed: false,
  workerExecutionPerformed: false,
  toolExecutionPerformed: false,
  projectMutationPerformed: false,
  networkCallPerformed: false,
  providerSpendPerformed: false,
  localCrudAllowed: false,
  sqliteWriteAllowed: false,
  hostedDbMutationAllowed: false,
  deployAllowed: false,
  releaseAllowed: false,
  exportAllowed: false,
  packageAllowed: false,
  spendAllowed: false,
};

const DEFAULT_BLOCKERS = [
  "Acceptance capture persistence is blocked.",
  "DB schemas, migrations, DB writes, and runtime writes remain blocked.",
  "Acceptance capture, handoff acceptance, authority handoff, authority grant, activation, and approval application remain blocked.",
  "Runtime execution, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(ACCEPTANCE_CAPTURE_PERSISTENCE_SAFE_DRY_RUN_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function safeArrayValue(values = [], index, fallback) {
  return values[index % values.length] || fallback;
}

function buildPreviewRows(metadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return metadata.entities.map((entity, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: entity.publicLabel,
      currentState: "Dry-run only; acceptance capture persistence blocked",
      readinessLabel: readiness.label || "Acceptance capture persistence readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Acceptance capture persistence remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: safeArrayValue(intentModel.evidenceLabels, index, "P128 persistence dry-run evidence"),
      activityLabel: safeArrayValue(intentModel.activityLabels, index, "P128 persistence dry-run activity"),
      costImpactLabel: intentModel.costImpactLabel,
      wouldPersistCapture: false,
      wouldCreatePersistenceDraft: false,
      wouldCreatePersistenceEvent: false,
      wouldCreatePersistenceEvidence: false,
      wouldCreateSchema: false,
      wouldRunMigration: false,
      wouldWriteDb: false,
      wouldWriteRuntime: false,
      wouldCaptureAcceptance: false,
      wouldAcceptHandoff: false,
      wouldRecordAcceptance: false,
      wouldHandoffAuthority: false,
      wouldGrantAuthority: false,
      wouldActivateAuthority: false,
      wouldApplyApproval: false,
      wouldPersistApproval: false,
      wouldRecordApprovalDecision: false,
      wouldAcceptDecision: false,
      wouldRejectDecision: false,
      wouldUnlockExecution: false,
      wouldDispatchAgent: false,
      wouldExecuteWorker: false,
      wouldExecuteTool: false,
      wouldMutateProject: false,
      wouldUseNetwork: false,
      wouldSpend: false,
      ...ACCEPTANCE_CAPTURE_PERSISTENCE_SAFE_DRY_RUN_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Persistence candidate preview",
      currentState: "Blocked dry run",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
    },
    {
      sectionLabel: "Persistence write boundary",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep DB schemas, migrations, DB writes, and runtime writes blocked until a later explicit authority phase.",
      disabledReason: "P128.4 does not create schemas, run migrations, write DB records, or write runtime state.",
    },
    {
      sectionLabel: "Runtime and authority boundary",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution, handoff acceptance, authority grant, and approval application blocked until a later explicit authority phase.",
      disabledReason: "P128.4 does not capture acceptance, accept handoff, grant authority, unlock execution, dispatch agents, mutate projects, call providers, or spend.",
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata();
  const intentModel = input.intentModel || buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel({
    ...input,
    intentState: input.intentState || "ready_for_safe_capture_persistence_dry_run",
  });
  const intentValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE,
    mode: "founder-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-safe-dry-run",
    source: "shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun.js",
    summary:
      "Founder approval application authority grant handoff acceptance capture persistence dry-run preview is assembled locally; acceptance capture persistence, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES.READY_PERSISTENCE_BLOCKED
        : FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES.NEEDS_PERSISTENCE_INTENT_MODEL,
      previewMode: "local-only-authority-grant-handoff-acceptance-capture-persistence-safe-dry-run",
      dryRunOnly: true,
      localOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      sourceCapturePhase: metadata.sourceCapturePhase,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      acceptanceCapturePersistenceSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        persistenceCandidateCount: 0,
        persistableCaptureCandidateCount: 0,
        persistenceDraftCandidateCount: 0,
        persistenceEventCandidateCount: 0,
        persistenceEvidenceCandidateCount: 0,
        schemaCreatableCandidateCount: 0,
        migrationRunnableCandidateCount: 0,
        dbWritableCandidateCount: 0,
        runtimeWritableCandidateCount: 0,
        runtimeExecutableCandidateCount: 0,
        executionUnlockCandidateCount: 0,
        handoffCandidateCount: 0,
        authorityHandoffCandidateCount: 0,
        grantCandidateCount: 0,
        authorityGrantCandidateCount: 0,
        activationCandidateCount: 0,
        applicationCandidateCount: 0,
        approvalApplicationCandidateCount: 0,
        approvalDecisionRecordableCandidateCount: 0,
        agentDispatchCandidateCount: 0,
        workerExecutionCandidateCount: 0,
        toolExecutionCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        networkCallCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      previewSections: buildPreviewSections(previewRows, intentModel),
      previewRows,
      blockers: [...DEFAULT_BLOCKERS],
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
      ownerCapability: intentModel.ownerCapability,
      evidenceRefs: ["reports/p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run acceptance capture persistence preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, DB/runtime writes, or provider spend.",
      ...ACCEPTANCE_CAPTURE_PERSISTENCE_SAFE_DRY_RUN_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
      "contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json",
    ],
    warnings: [
      "P128.4 is a dry-run preview. It does not persist acceptance capture, create schemas, run migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject actions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, use hosted DBs, deploy, package, use network calls, or spend.",
    ],
  });
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE) {
    errors.push("phase must be P128.4");
  }
  if (data.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION) {
    errors.push("schemaVersion must be 1.0");
  }
  if (!Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-grant-handoff-acceptance-capture-persistence-safe-dry-run" || data.dryRunOnly !== true || data.localOnly !== true) {
    errors.push("preview must remain local-only acceptance capture persistence safe dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until a later scoped UX subphase");
  if (data.sourceIntentPhase !== "P128.3" || data.sourceMetadataPhase !== "P128.2" || data.sourceCapturePhase !== "P127.2") {
    errors.push("preview must reuse P128.3 intent model, P128.2 persistence metadata, and P127.2 capture metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level acceptance capture persistence safe dry-run authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldPersistCapture",
      "wouldCreatePersistenceDraft",
      "wouldCreatePersistenceEvent",
      "wouldCreatePersistenceEvidence",
      "wouldCreateSchema",
      "wouldRunMigration",
      "wouldWriteDb",
      "wouldWriteRuntime",
      "wouldCaptureAcceptance",
      "wouldAcceptHandoff",
      "wouldRecordAcceptance",
      "wouldHandoffAuthority",
      "wouldGrantAuthority",
      "wouldActivateAuthority",
      "wouldApplyApproval",
      "wouldPersistApproval",
      "wouldRecordApprovalDecision",
      "wouldAcceptDecision",
      "wouldRejectDecision",
      "wouldUnlockExecution",
      "wouldDispatchAgent",
      "wouldExecuteWorker",
      "wouldExecuteTool",
      "wouldMutateProject",
      "wouldUseNetwork",
      "wouldSpend",
    ]) {
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"} ${field} must remain false`);
    }
  }
  const summary = data.acceptanceCapturePersistenceSummary || {};
  for (const key of [
    "persistenceCandidateCount",
    "persistableCaptureCandidateCount",
    "persistenceDraftCandidateCount",
    "persistenceEventCandidateCount",
    "persistenceEvidenceCandidateCount",
    "schemaCreatableCandidateCount",
    "migrationRunnableCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "executionUnlockCandidateCount",
    "handoffCandidateCount",
    "authorityHandoffCandidateCount",
    "grantCandidateCount",
    "authorityGrantCandidateCount",
    "activationCandidateCount",
    "applicationCandidateCount",
    "approvalApplicationCandidateCount",
    "approvalDecisionRecordableCandidateCount",
    "agentDispatchCandidateCount",
    "workerExecutionCandidateCount",
    "toolExecutionCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "networkCallCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (summary[key] !== 0) errors.push(`${key} must remain zero`);
  }
  if (!data.ownerCapability || !Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0 || !data.activityLocation || !data.costImpact) {
    errors.push("owner, evidence, activity, and cost impact are required");
  }
  return { valid: errors.length === 0, errors };
}
