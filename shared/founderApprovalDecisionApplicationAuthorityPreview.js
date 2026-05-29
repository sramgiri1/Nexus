import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata,
} from "./founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE,
  buildFounderApprovalDecisionApplicationAuthorityIntentModel,
  validateFounderApprovalDecisionApplicationAuthorityIntentModel,
} from "./founderApprovalDecisionApplicationAuthorityIntentModel.js";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE = "P122.4";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES = {
  READY_AUTHORITY_BLOCKED: "authority preview ready; authority blocked",
  NEEDS_INTENT_MODEL: "authority preview needs intent model",
};

const AUTHORITY_PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  approvalApplicationAuthorityPreviewAllowed: false,
  approvalApplicationAuthorityPreviewWritten: false,
  approvalDecisionApplied: false,
  approvalDecisionPersisted: false,
  approvalDecisionRecorded: false,
  approvalDecisionAccepted: false,
  approvalDecisionRejected: false,
  approvalDecisionWriteAllowed: false,
  authorityHandoffGranted: false,
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
  "Approval decision application authority is blocked.",
  "Approval decision application remains blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution and execution unlock remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(AUTHORITY_PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(metadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return metadata.sections.map((section, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: section.publicLabel,
      currentState: "Dry-run only; authority blocked",
      readinessLabel: readiness.label || "Approval application authority readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval application authority remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: intentModel.evidenceLabels[index % intentModel.evidenceLabels.length],
      activityLabel: intentModel.activityLabels[index % intentModel.activityLabels.length],
      costImpactLabel: intentModel.costImpactLabel,
      wouldGrantAuthority: false,
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
      ...AUTHORITY_PREVIEW_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Authority handoff",
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
      nextAction: "Keep approval application, DB writes, and runtime writes unavailable until a later explicit phase grants authority.",
      disabledReason: "P122.4 does not grant authority, apply decisions, or write runtime state.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P122.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalDecisionApplicationAuthorityPreview(input = {}) {
  const metadata = buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata();
  const intentModel = input.intentModel || buildFounderApprovalDecisionApplicationAuthorityIntentModel(input);
  const intentValidation = validateFounderApprovalDecisionApplicationAuthorityIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE,
    mode: "founder-approval-decision-application-authority-safe-dry-run",
    source: "shared/founderApprovalDecisionApplicationAuthorityPreview.js",
    summary:
      "Founder approval application authority handoff dry-run preview is assembled locally; authority, application, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES.READY_AUTHORITY_BLOCKED
        : FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-authority-handoff-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      authorityHandoffSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        authorityCandidateCount: 0,
        handoffCandidateCount: 0,
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
      evidenceRefs: ["reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run authority handoff preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...AUTHORITY_PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md",
      "contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json",
    ],
    warnings: [
      "P122.4 is a dry-run preview. It does not grant authority, apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalDecisionApplicationAuthorityPreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE) errors.push("phase must be P122.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-handoff-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only authority handoff dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P122.5");
  if (data.sourceIntentPhase !== "P122.3" || data.sourceMetadataPhase !== "P122.2") {
    errors.push("preview must reuse P122.3 intent model and P122.2 eligibility metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level preview authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldGrantAuthority",
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
  const summary = data.authorityHandoffSummary || {};
  for (const field of [
    "authorityCandidateCount",
    "handoffCandidateCount",
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
  if (/founderApprovalDecisionApplication|approval_decision_application/i.test(serialized)) {
    errors.push("Preview model must not expose raw schema or table names");
  }
  if (/approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serialized)) {
    errors.push("Preview model must not expose fake unsafe runnable actions");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
