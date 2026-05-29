import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionSchemaMetadata,
} from "./founderApprovalDecisionSchemaMetadata.js";
import {
  FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE,
  buildFounderApprovalDecisionIntentModel,
  validateFounderApprovalDecisionIntentModel,
} from "./founderApprovalDecisionIntentModel.js";

export const FOUNDER_APPROVAL_DECISION_PREVIEW_PHASE = "P119.4";
export const FOUNDER_APPROVAL_DECISION_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_PREVIEW_STATES = {
  READY_DECISION_BLOCKED: "approval_decision_preview_ready_decision_blocked",
  NEEDS_INTENT_MODEL: "approval_decision_preview_needs_intent_model",
};

const PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS,
  approvalIntentRecordingAllowed: false,
  approvalIntentRecorded: false,
  approvalDecisionRecorded: false,
  approvalDecisionPersisted: false,
  approvalDecisionAccepted: false,
  approvalDecisionRejected: false,
  approvalDecisionWriteAllowed: false,
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
  "Approval decision recording is blocked.",
  "Approve/reject persistence is blocked.",
  "Runtime execution remains blocked.",
  "Execution unlock remains blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(schemaMetadata, intentModel) {
  return schemaMetadata.entities.map((entity, index) => ({
    rowLabel: entity.publicLabel,
    currentState: "Preview only; decision recording blocked",
    nextAction: intentModel.nextAction,
    blocker: DEFAULT_BLOCKERS[index] || "Approval decision recording remains blocked.",
    disabledReason: intentModel.disabledReason,
    ownerCapability: intentModel.ownerCapability,
    evidenceLabel: intentModel.evidenceLabels[index % intentModel.evidenceLabels.length],
    activityLabel: intentModel.activityLabels[index % intentModel.activityLabels.length],
    costImpactLabel: intentModel.costImpactLabel,
    redactionRequired: entity.redactionRequired === true,
    wouldCaptureApproval: false,
    wouldPersistApproval: false,
    wouldRecordDecision: false,
    wouldAcceptDecision: false,
    wouldRejectDecision: false,
    wouldWriteDb: false,
    wouldUnlockExecution: false,
    wouldDispatchAgent: false,
    wouldMutateProject: false,
    wouldSpend: false,
    ...PREVIEW_BLOCKED_FLAGS,
  }));
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Decision readiness",
      currentState: "Blocked preview",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: intentModel.nextAction,
      disabledReason: intentModel.disabledReason,
    },
    {
      sectionLabel: "Decision recording",
      currentState: "Unavailable",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep approve/reject recording unavailable until a later explicit phase grants authority.",
      disabledReason: "P119.4 does not record approval decisions.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P119.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalDecisionPreview(input = {}) {
  const schemaMetadata = buildFounderApprovalDecisionSchemaMetadata();
  const intentModel = input.intentModel || buildFounderApprovalDecisionIntentModel(input);
  const intentValidation = validateFounderApprovalDecisionIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(schemaMetadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_DECISION_PREVIEW_PHASE,
    mode: "founder-approval-decision-safe-dry-run",
    source: "shared/founderApprovalDecisionPreview.js",
    summary:
      "Founder approval decision dry-run preview is assembled locally; approve/reject decision recording, persistence, and runtime execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_DECISION_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_DECISION_PREVIEW_STATES.READY_DECISION_BLOCKED
        : FOUNDER_APPROVAL_DECISION_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE,
      sourceSchemaPhase: schemaMetadata.phaseId,
      founderQuestion: intentModel.founderQuestion,
      requestedDecisionLabel: intentModel.requestedDecisionLabel,
      proposedDecisionLabel: intentModel.proposedDecisionLabel,
      approvalDecisionSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        decisionReviewCandidateCount: 0,
        approvableCandidateCount: 0,
        rejectableCandidateCount: 0,
        persistableCandidateCount: 0,
        decisionRecordableCandidateCount: 0,
        dbWritableCandidateCount: 0,
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
      evidenceRefs: ["reports/p1194-founder-runtime-approval-decision-recording-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run approval decision preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1194-founder-runtime-approval-decision-recording-boundary-report.md",
      "contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json",
    ],
    warnings: [
      "P119.4 is a dry-run preview. It does not accept approvals, persist decisions, record approve/reject actions, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalDecisionPreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_DECISION_PREVIEW_PHASE) errors.push("phase must be P119.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_DECISION_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_DECISION_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P119.5");
  if (data.sourceIntentPhase !== "P119.3" || data.sourceSchemaPhase !== "P119.2") {
    errors.push("preview must reuse P119.3 intent model and P119.2 schema metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level preview authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldCaptureApproval",
      "wouldPersistApproval",
      "wouldRecordDecision",
      "wouldAcceptDecision",
      "wouldRejectDecision",
      "wouldWriteDb",
      "wouldUnlockExecution",
      "wouldDispatchAgent",
      "wouldMutateProject",
      "wouldSpend",
    ]) {
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"}.${field} must be false`);
    }
  }
  const summary = data.approvalDecisionSummary || {};
  for (const field of [
    "decisionReviewCandidateCount",
    "approvableCandidateCount",
    "rejectableCandidateCount",
    "persistableCandidateCount",
    "decisionRecordableCandidateCount",
    "dbWritableCandidateCount",
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
  if (/founderApprovalDecisionRequests|founderApprovalDecisionEvents|founderApprovalDecisionEvidenceRefs|approval_decision_requests|approval_decision_events|approval_decision_evidence/i.test(serialized)) {
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
