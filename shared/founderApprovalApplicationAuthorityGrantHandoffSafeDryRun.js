import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_INTENT_MODEL_PHASE,
  buildFounderApprovalApplicationAuthorityGrantHandoffIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffIntentModel,
} from "./founderApprovalApplicationAuthorityGrantHandoffIntentModel.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE = "P125.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES = {
  READY_HANDOFF_BLOCKED: "handoff dry run ready; authority handoff blocked",
  NEEDS_HANDOFF_INTENT_MODEL: "handoff dry run needs intent model",
};

const HANDOFF_SAFE_DRY_RUN_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
  approvalApplicationAuthorityGrantHandoffSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffSafeDryRunWritten: false,
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
  "Approval application authority grant handoff is blocked.",
  "Authority grant, activation, approval application, and decision application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(HANDOFF_SAFE_DRY_RUN_BLOCKED_FLAGS).every((flag) => target[flag] === false);
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
      currentState: "Dry-run only; authority handoff blocked",
      readinessLabel: readiness.label || "Approval application authority grant handoff readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval application authority grant handoff remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: safeArrayValue(intentModel.evidenceLabels, index, "P125 handoff dry-run evidence"),
      activityLabel: safeArrayValue(intentModel.activityLabels, index, "P125 handoff dry-run activity"),
      costImpactLabel: intentModel.costImpactLabel,
      wouldHandoffAuthority: false,
      wouldGrantAuthority: false,
      wouldActivateAuthority: false,
      wouldApplyDecision: false,
      wouldCaptureApproval: false,
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
      ...HANDOFF_SAFE_DRY_RUN_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Handoff intent",
      currentState: "Blocked dry run",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
    },
    {
      sectionLabel: "Authority boundary",
      currentState: "Unavailable",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep authority handoff, authority grant, activation, approval application, DB writes, and runtime writes unavailable until a later explicit phase grants narrow authority.",
      disabledReason: "P125.4 does not hand off authority, grant authority, activate authority, apply decisions, or write runtime state.",
    },
    {
      sectionLabel: "Runtime boundary",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow runtime authority.",
      disabledReason: "P125.4 does not unlock execution, dispatch agents, mutate projects, call providers, or spend.",
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata();
  const intentModel = input.intentModel || buildFounderApprovalApplicationAuthorityGrantHandoffIntentModel({
    ...input,
    intentState: input.intentState || "ready_for_safe_handoff_dry_run",
  });
  const intentValidation = validateFounderApprovalApplicationAuthorityGrantHandoffIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE,
    mode: "founder-approval-application-authority-grant-handoff-safe-dry-run",
    source: "shared/founderApprovalApplicationAuthorityGrantHandoffSafeDryRun.js",
    summary:
      "Founder approval application authority grant handoff dry-run preview is assembled locally; authority handoff, grant, activation, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES.READY_HANDOFF_BLOCKED
        : FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES.NEEDS_HANDOFF_INTENT_MODEL,
      previewMode: "local-only-authority-grant-handoff-safe-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      sourceGrantPhase: metadata.sourceGrantPhase,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      handoffSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
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
      evidenceRefs: ["reports/p1254-founder-runtime-approval-application-authority-grant-handoff-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run handoff preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...HANDOFF_SAFE_DRY_RUN_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1254-founder-runtime-approval-application-authority-grant-handoff-report.md",
      "contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json",
    ],
    warnings: [
      "P125.4 is a dry-run preview. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE) {
    errors.push("phase must be P125.4");
  }
  if (data.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION) {
    errors.push("schemaVersion must be 1.0");
  }
  if (!Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-grant-handoff-safe-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only handoff safe dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until a later scoped UX subphase");
  if (data.sourceIntentPhase !== "P125.3" || data.sourceMetadataPhase !== "P125.2" || data.sourceGrantPhase !== "P124.2") {
    errors.push("preview must reuse P125.3 intent model, P125.2 handoff metadata, and P124.2 grant metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level handoff safe dry-run authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldHandoffAuthority",
      "wouldGrantAuthority",
      "wouldActivateAuthority",
      "wouldApplyDecision",
      "wouldCaptureApproval",
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
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"}.${field} must be false`);
    }
  }
  const summary = data.handoffSummary || {};
  for (const field of [
    "handoffCandidateCount",
    "authorityHandoffCandidateCount",
    "grantCandidateCount",
    "authorityGrantCandidateCount",
    "activationCandidateCount",
    "applicationCandidateCount",
    "approvalApplicationCandidateCount",
    "decisionRecordableCandidateCount",
    "approvalDecisionRecordableCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "executionUnlockCandidateCount",
    "agentDispatchCandidateCount",
    "workerExecutionCandidateCount",
    "toolExecutionCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "networkCallCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (summary[field] !== 0) errors.push(`${field} must be zero`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) {
    errors.push("Preview model must not expose raw private IDs");
  }
  if (/founderApprovalApplicationAuthorityGrantHandoff|approval_authority_grant_handoff/i.test(serialized)) {
    errors.push("Preview model must not expose raw schema or table names");
  }
  if (/handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serialized)) {
    errors.push("Preview model must not expose fake unsafe runnable actions");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
