import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_PHASE = "P127.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_STATES = {
  READY_CAPTURE_BLOCKED: "acceptance capture dry run ready; live capture blocked",
  NEEDS_CAPTURE_INTENT_MODEL: "acceptance capture dry run needs intent model",
};

const ACCEPTANCE_CAPTURE_SAFE_DRY_RUN_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureSafeDryRunWritten: false,
  handoffAccepted: false,
  acceptanceCaptured: false,
  acceptanceRecorded: false,
  acceptancePersisted: false,
  acceptanceCapturePersisted: false,
  authorityHandedOff: false,
  authorityGranted: false,
  authorityActivated: false,
  handoffPersisted: false,
  grantPersisted: false,
  approvalDecisionApplied: false,
  approvalDecisionPersisted: false,
  approvalDecisionRecorded: false,
  approvalDecisionAccepted: false,
  approvalDecisionRejected: false,
  approvalDecisionWriteAllowed: false,
  runtimeAdmissionGranted: false,
  localCrudAllowed: false,
  sqliteWriteAllowed: false,
  runtimeApprovalAllowed: false,
  executionAllowed: false,
  executionUnlocked: false,
  dispatchAllowed: false,
  providerCallsAllowed: false,
  modelCallsAllowed: false,
  deployAllowed: false,
  releaseAllowed: false,
  exportAllowed: false,
  packageAllowed: false,
  spendAllowed: false,
};

const DEFAULT_BLOCKERS = [
  "Acceptance capture is blocked.",
  "Handoff acceptance, authority handoff, authority grant, activation, and approval application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(ACCEPTANCE_CAPTURE_SAFE_DRY_RUN_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function safeArrayValue(values = [], index, fallback) {
  return values[index % values.length] || fallback;
}

function buildPreviewRows(metadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return metadata.sections.map((section, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: section.publicLabel,
      currentState: "Dry-run only; acceptance capture blocked",
      readinessLabel: readiness.label || "Acceptance capture readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Acceptance capture remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: safeArrayValue(intentModel.evidenceLabels, index, "P127 capture dry-run evidence"),
      activityLabel: safeArrayValue(intentModel.activityLabels, index, "P127 capture dry-run activity"),
      costImpactLabel: intentModel.costImpactLabel,
      wouldAcceptHandoff: false,
      wouldCaptureAcceptance: false,
      wouldRecordAcceptance: false,
      wouldHandoffAuthority: false,
      wouldGrantAuthority: false,
      wouldActivateAuthority: false,
      wouldApplyDecision: false,
      wouldCaptureApproval: false,
      wouldPersistAcceptance: false,
      wouldPersistAcceptanceCapture: false,
      wouldPersistApproval: false,
      wouldRecordDecision: false,
      wouldAcceptDecision: false,
      wouldRejectDecision: false,
      wouldWriteDb: false,
      wouldWriteRuntime: false,
      wouldUnlockExecution: false,
      wouldDispatchAgent: false,
      wouldExecuteWorker: false,
      wouldExecuteTool: false,
      wouldMutateProject: false,
      wouldUseNetwork: false,
      wouldSpend: false,
      ...ACCEPTANCE_CAPTURE_SAFE_DRY_RUN_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Acceptance capture intent",
      currentState: "Blocked dry run",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
    },
    {
      sectionLabel: "Prior acceptance boundary",
      currentState: "Read-only",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep P126 acceptance metadata read-only until a later explicit phase grants narrow capture authority.",
      disabledReason: "P127.4 does not capture acceptance, accept handoff, hand off authority, grant authority, activate authority, or write runtime state.",
    },
    {
      sectionLabel: "Runtime boundary",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow runtime authority.",
      disabledReason: "P127.4 does not unlock execution, dispatch agents, mutate projects, call providers, or spend.",
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata();
  const intentModel = input.intentModel || buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel({
    ...input,
    intentState: input.intentState || "ready_for_safe_acceptance_capture_dry_run",
  });
  const intentValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_PHASE,
    mode: "founder-approval-application-authority-grant-handoff-acceptance-capture-boundary-safe-dry-run",
    source: "shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun.js",
    summary:
      "Founder approval application authority grant handoff acceptance capture dry-run preview is assembled locally; acceptance capture, handoff acceptance, authority handoff, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_STATES.READY_CAPTURE_BLOCKED
        : FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_STATES.NEEDS_CAPTURE_INTENT_MODEL,
      previewMode: "local-only-authority-grant-handoff-acceptance-capture-safe-dry-run",
      dryRunOnly: true,
      localOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      sourceAcceptancePhase: metadata.sourceAcceptancePhase,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      acceptanceCaptureSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        acceptanceCandidateCount: 0,
        acceptanceCaptureCandidateCount: 0,
        acceptanceRecordCandidateCount: 0,
        handoffCandidateCount: 0,
        authorityHandoffCandidateCount: 0,
        grantCandidateCount: 0,
        authorityGrantCandidateCount: 0,
        activationCandidateCount: 0,
        applicationCandidateCount: 0,
        approvalApplicationCandidateCount: 0,
        decisionRecordableCandidateCount: 0,
        approvalDecisionRecordableCandidateCount: 0,
        dbWritableCandidateCount: 0,
        runtimeWritableCandidateCount: 0,
        runtimeExecutableCandidateCount: 0,
        executionUnlockCandidateCount: 0,
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
      evidenceRefs: ["reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run acceptance capture preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...ACCEPTANCE_CAPTURE_SAFE_DRY_RUN_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
      "contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json",
    ],
    warnings: [
      "P127.4 is a dry-run preview. It does not capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_PHASE) {
    errors.push("phase must be P127.4");
  }
  if (data.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_VERSION) {
    errors.push("schemaVersion must be 1.0");
  }
  if (!Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-grant-handoff-acceptance-capture-safe-dry-run" || data.dryRunOnly !== true || data.localOnly !== true) {
    errors.push("preview must remain local-only acceptance capture safe dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until a later scoped UX subphase");
  if (data.sourceIntentPhase !== "P127.3" || data.sourceMetadataPhase !== "P127.2" || data.sourceAcceptancePhase !== "P126.2") {
    errors.push("preview must reuse P127.3 intent model, P127.2 capture metadata, and P126.2 acceptance metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level acceptance capture safe dry-run authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldAcceptHandoff",
      "wouldCaptureAcceptance",
      "wouldRecordAcceptance",
      "wouldHandoffAuthority",
      "wouldGrantAuthority",
      "wouldActivateAuthority",
      "wouldApplyDecision",
      "wouldCaptureApproval",
      "wouldPersistAcceptance",
      "wouldPersistAcceptanceCapture",
      "wouldPersistApproval",
      "wouldRecordDecision",
      "wouldAcceptDecision",
      "wouldRejectDecision",
      "wouldWriteDb",
      "wouldWriteRuntime",
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
  const summary = data.acceptanceCaptureSummary || {};
  for (const [key, value] of Object.entries(summary)) {
    if (key.endsWith("CandidateCount") && value !== 0) errors.push(`${key} must remain zero`);
  }
  return { valid: errors.length === 0, errors };
}
