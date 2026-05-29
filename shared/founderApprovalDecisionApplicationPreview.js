import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionApplicationEligibilityMetadata,
} from "./founderApprovalDecisionApplicationEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE,
  buildFounderApprovalDecisionApplicationIntentModel,
  validateFounderApprovalDecisionApplicationIntentModel,
} from "./founderApprovalDecisionApplicationIntentModel.js";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_PHASE = "P121.4";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_STATES = {
  READY_APPLICATION_BLOCKED: "application preview ready; application blocked",
  NEEDS_INTENT_MODEL: "application preview needs intent model",
};

const PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  approvalDecisionApplicationPreviewAllowed: false,
  approvalDecisionApplicationPreviewWritten: false,
  approvalDecisionApplied: false,
  approvalDecisionPersisted: false,
  approvalDecisionRecorded: false,
  approvalDecisionAccepted: false,
  approvalDecisionRejected: false,
  approvalDecisionWriteAllowed: false,
  localCrudAllowed: false,
  sqliteWriteAllowed: false,
  runtimeWriteAllowed: false,
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
  "Approval decision application is blocked.",
  "Approval decision persistence remains blocked.",
  "DB and runtime writes remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(metadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return metadata.sections.map((section, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: section.publicLabel,
      currentState: "Dry-run only; application blocked",
      readinessLabel: readiness.label || "Approval decision application readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval decision application remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: intentModel.evidenceLabels[index % intentModel.evidenceLabels.length],
      activityLabel: intentModel.activityLabels[index % intentModel.activityLabels.length],
      costImpactLabel: intentModel.costImpactLabel,
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
      wouldMutateProject: false,
      wouldSpend: false,
      ...PREVIEW_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Application readiness",
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
      disabledReason: "P121.4 does not apply approval decisions or write runtime state.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P121.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalDecisionApplicationPreview(input = {}) {
  const metadata = buildFounderApprovalDecisionApplicationEligibilityMetadata();
  const intentModel = input.intentModel || buildFounderApprovalDecisionApplicationIntentModel(input);
  const intentValidation = validateFounderApprovalDecisionApplicationIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_PHASE,
    mode: "founder-approval-decision-application-safe-dry-run",
    source: "shared/founderApprovalDecisionApplicationPreview.js",
    summary:
      "Founder approval decision application dry-run preview is assembled locally; application, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_STATES.READY_APPLICATION_BLOCKED
        : FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-application-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      approvalDecisionApplicationSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        applicationCandidateCount: 0,
        applicableDecisionCount: 0,
        decisionRecordableCandidateCount: 0,
        approvalDecisionRecordableCandidateCount: 0,
        approvalApplicationCandidateCount: 0,
        dbWritableCandidateCount: 0,
        runtimeWritableCandidateCount: 0,
        runtimeExecutableCandidateCount: 0,
        executionUnlockCandidateCount: 0,
        agentDispatchCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      previewSections: buildPreviewSections(previewRows, intentModel),
      previewRows,
      blockers: [...DEFAULT_BLOCKERS],
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
      ownerCapability: intentModel.ownerCapability,
      evidenceRefs: ["reports/p1214-founder-runtime-approval-decision-application-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run approval decision application preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1214-founder-runtime-approval-decision-application-boundary-report.md",
      "contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json",
    ],
    warnings: [
      "P121.4 is a dry-run preview. It does not apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalDecisionApplicationPreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_PHASE) errors.push("phase must be P121.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-application-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only application dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P121.5");
  if (data.sourceIntentPhase !== "P121.3" || data.sourceMetadataPhase !== "P121.2") {
    errors.push("preview must reuse P121.3 intent model and P121.2 eligibility metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level preview authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
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
      "wouldMutateProject",
      "wouldSpend",
    ]) {
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"}.${field} must be false`);
    }
  }
  const summary = data.approvalDecisionApplicationSummary || {};
  for (const field of [
    "applicationCandidateCount",
    "applicableDecisionCount",
    "decisionRecordableCandidateCount",
    "approvalDecisionRecordableCandidateCount",
    "approvalApplicationCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "runtimeExecutableCandidateCount",
    "executionUnlockCandidateCount",
    "agentDispatchCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
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
