import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityGrantEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_INTENT_MODEL_PHASE,
  buildFounderApprovalApplicationAuthorityGrantIntentModel,
  validateFounderApprovalApplicationAuthorityGrantIntentModel,
} from "./founderApprovalApplicationAuthorityGrantIntentModel.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_PHASE = "P124.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_STATES = {
  READY_GRANT_BLOCKED: "grant dry run ready; authority grant blocked",
  NEEDS_INTENT_MODEL: "grant dry run needs intent model",
};

const GRANT_SAFE_DRY_RUN_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS,
  approvalApplicationAuthorityGrantSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantSafeDryRunWritten: false,
  authorityGranted: false,
  authorityActivated: false,
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
  "Approval application authority grant is blocked.",
  "Activation and approval application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(GRANT_SAFE_DRY_RUN_BLOCKED_FLAGS).every((flag) => target[flag] === false);
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
      currentState: "Dry-run only; authority grant blocked",
      readinessLabel: readiness.label || "Approval application authority grant readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval application authority grant remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: safeArrayValue(intentModel.evidenceLabels, index, "P124 grant dry-run evidence"),
      activityLabel: safeArrayValue(intentModel.activityLabels, index, "P124 grant dry-run activity"),
      costImpactLabel: intentModel.costImpactLabel,
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
      ...GRANT_SAFE_DRY_RUN_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Grant intent",
      currentState: "Blocked dry run",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
    },
    {
      sectionLabel: "Write authority",
      currentState: "Unavailable",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep authority grant, activation, approval application, DB writes, and runtime writes unavailable until a later explicit phase grants narrow authority.",
      disabledReason: "P124.4 does not grant authority, activate authority, apply decisions, or write runtime state.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow runtime authority.",
      disabledReason: "P124.4 does not unlock execution, dispatch agents, mutate projects, call providers, or spend.",
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityGrantSafeDryRun(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata();
  const intentModel = input.intentModel || buildFounderApprovalApplicationAuthorityGrantIntentModel({
    ...input,
    intentState: input.intentState || "ready_for_safe_grant_dry_run",
  });
  const intentValidation = validateFounderApprovalApplicationAuthorityGrantIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_PHASE,
    mode: "founder-approval-application-authority-grant-safe-dry-run",
    source: "shared/founderApprovalApplicationAuthorityGrantSafeDryRun.js",
    summary:
      "Founder approval application authority grant dry-run preview is assembled locally; authority grant, activation, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_STATES.READY_GRANT_BLOCKED
        : FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-authority-grant-safe-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      grantSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
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
      evidenceRefs: ["reports/p1244-founder-runtime-approval-application-authority-grant-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run grant preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...GRANT_SAFE_DRY_RUN_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1244-founder-runtime-approval-application-authority-grant-boundary-report.md",
      "contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json",
    ],
    warnings: [
      "P124.4 is a dry-run preview. It does not grant authority, activate authority, apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalApplicationAuthorityGrantSafeDryRun(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_PHASE) errors.push("phase must be P124.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SAFE_DRY_RUN_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-grant-safe-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only grant safe dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P124.5");
  if (data.sourceIntentPhase !== "P124.3" || data.sourceMetadataPhase !== "P124.2") {
    errors.push("preview must reuse P124.3 intent model and P124.2 eligibility metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level grant safe dry-run authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
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
  const summary = data.grantSummary || {};
  for (const field of [
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
  if (/founderApprovalApplicationAuthorityGrant|approval_authority_grant/i.test(serialized)) {
    errors.push("Preview model must not expose raw schema or table names");
  }
  if (/grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serialized)) {
    errors.push("Preview model must not expose fake unsafe runnable actions");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
