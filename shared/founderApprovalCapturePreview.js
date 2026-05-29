import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS,
  buildFounderApprovalCaptureSchemaMetadata,
} from "./founderApprovalCaptureSchemaMetadata.js";
import {
  FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE,
  buildFounderApprovalCaptureIntentModel,
  validateFounderApprovalCaptureIntentModel,
} from "./founderApprovalCaptureIntentModel.js";

export const FOUNDER_APPROVAL_CAPTURE_PREVIEW_PHASE = "P118.4";
export const FOUNDER_APPROVAL_CAPTURE_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_CAPTURE_PREVIEW_STATES = {
  READY_CAPTURE_BLOCKED: "approval_capture_preview_ready_capture_blocked",
  NEEDS_INTENT_MODEL: "approval_capture_preview_needs_intent_model",
};

const PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS,
  approvalIntentRecordingAllowed: false,
  approvalIntentRecorded: false,
  approvalDecisionRecorded: false,
  approvalCaptureWriteAllowed: false,
  localCrudAllowed: false,
  sqliteWriteAllowed: false,
  runtimeApprovalAllowed: false,
  executionAllowed: false,
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
  "Approval capture is blocked.",
  "Approval persistence is blocked.",
  "Approve/reject decision recording is blocked.",
  "Runtime execution remains blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(schemaMetadata, intentModel) {
  return schemaMetadata.entities.map((entity, index) => ({
    rowLabel: entity.publicLabel,
    currentState: "Preview only; capture blocked",
    nextAction: intentModel.nextAction,
    blocker: DEFAULT_BLOCKERS[index] || "Approval capture remains blocked.",
    disabledReason: intentModel.disabledReason,
    ownerCapability: intentModel.ownerCapability,
    evidenceLabel: intentModel.evidenceLabels[index % intentModel.evidenceLabels.length],
    activityLabel: intentModel.activityLabels[index % intentModel.activityLabels.length],
    costImpactLabel: intentModel.costImpactLabel,
    redactionRequired: entity.redactionRequired === true,
    wouldCaptureApproval: false,
    wouldPersistApproval: false,
    wouldRecordDecision: false,
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
      sectionLabel: "Capture readiness",
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
      disabledReason: "P118.4 does not record approval decisions.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P118.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalCapturePreview(input = {}) {
  const schemaMetadata = buildFounderApprovalCaptureSchemaMetadata();
  const intentModel = input.intentModel || buildFounderApprovalCaptureIntentModel(input);
  const intentValidation = validateFounderApprovalCaptureIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(schemaMetadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_CAPTURE_PREVIEW_PHASE,
    mode: "founder-approval-capture-safe-dry-run",
    source: "shared/founderApprovalCapturePreview.js",
    summary:
      "Founder approval capture dry-run preview is assembled locally; approval capture, persistence, decision recording, and runtime execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_CAPTURE_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_CAPTURE_PREVIEW_STATES.READY_CAPTURE_BLOCKED
        : FOUNDER_APPROVAL_CAPTURE_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE,
      sourceSchemaPhase: schemaMetadata.phaseId,
      founderQuestion: intentModel.founderQuestion,
      requestedDecisionLabel: intentModel.requestedDecisionLabel,
      approvalCaptureSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        capturableCandidateCount: 0,
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
      evidenceRefs: ["reports/p1184-founder-runtime-approval-capture-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run approval capture preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1184-founder-runtime-approval-capture-boundary-report.md",
      "contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json",
    ],
    warnings: [
      "P118.4 is a dry-run preview. It does not capture approvals, persist decisions, record approve/reject actions, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalCapturePreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_CAPTURE_PREVIEW_PHASE) errors.push("phase must be P118.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_CAPTURE_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_CAPTURE_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P118.5");
  if (data.sourceIntentPhase !== "P118.3" || data.sourceSchemaPhase !== "P118.2") {
    errors.push("preview must reuse P118.3 intent model and P118.2 schema metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level preview authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of ["wouldCaptureApproval", "wouldPersistApproval", "wouldRecordDecision", "wouldWriteDb", "wouldUnlockExecution", "wouldDispatchAgent", "wouldMutateProject", "wouldSpend"]) {
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"}.${field} must be false`);
    }
  }
  const summary = data.approvalCaptureSummary || {};
  for (const field of [
    "capturableCandidateCount",
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
  if (/founderApprovalCaptureRequests|founderApprovalCaptureEvents|founderApprovalCaptureEvidenceRefs|approval_capture_requests|approval_capture_events|approval_capture_evidence/i.test(serialized)) {
    errors.push("Preview model must not expose raw schema or table names");
  }
  if (/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serialized)) {
    errors.push("Preview model must not expose fake unsafe runnable actions");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
