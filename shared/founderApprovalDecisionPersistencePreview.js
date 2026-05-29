import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionPersistenceSchemaMetadata,
} from "./founderApprovalDecisionPersistenceSchemaMetadata.js";
import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE,
  buildFounderApprovalDecisionPersistenceIntentModel,
  validateFounderApprovalDecisionPersistenceIntentModel,
} from "./founderApprovalDecisionPersistenceIntentModel.js";

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE = "P120.4";
export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES = {
  READY_PERSISTENCE_BLOCKED: "persistence preview ready; writes blocked",
  NEEDS_INTENT_MODEL: "persistence preview needs intent model",
};

const PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS,
  approvalPersistencePreviewAllowed: false,
  approvalPersistencePreviewWritten: false,
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
  "Approval decision persistence is blocked.",
  "DB and runtime writes remain blocked.",
  "Approve/reject decision recording remains blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(schemaMetadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return schemaMetadata.entities.map((entity, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: entity.publicLabel,
      currentState: "Dry-run only; persistence blocked",
      readinessLabel: readiness.label || "Approval decision persistence readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval decision persistence remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
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
      sectionLabel: "Persistence readiness",
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
      nextAction: "Keep DB and runtime writes unavailable until a later explicit phase grants authority.",
      disabledReason: "P120.4 does not persist approval decisions or write runtime state.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P120.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalDecisionPersistencePreview(input = {}) {
  const schemaMetadata = buildFounderApprovalDecisionPersistenceSchemaMetadata();
  const intentModel = input.intentModel || buildFounderApprovalDecisionPersistenceIntentModel(input);
  const intentValidation = validateFounderApprovalDecisionPersistenceIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(schemaMetadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE,
    mode: "founder-approval-decision-persistence-safe-dry-run",
    source: "shared/founderApprovalDecisionPersistencePreview.js",
    summary:
      "Founder approval decision persistence dry-run preview is assembled locally; persistence, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES.READY_PERSISTENCE_BLOCKED
        : FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-persistence-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE,
      sourceSchemaPhase: schemaMetadata.phaseId,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      approvalDecisionPersistenceSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        persistenceCandidateCount: 0,
        persistableCandidateCount: 0,
        decisionRecordableCandidateCount: 0,
        approvalDecisionRecordableCandidateCount: 0,
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
      evidenceRefs: ["reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run approval decision persistence preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md",
      "contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json",
    ],
    warnings: [
      "P120.4 is a dry-run preview. It does not accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalDecisionPersistencePreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE) errors.push("phase must be P120.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-persistence-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only persistence dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P120.5");
  if (data.sourceIntentPhase !== "P120.3" || data.sourceSchemaPhase !== "P120.2") {
    errors.push("preview must reuse P120.3 intent model and P120.2 schema metadata");
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
      "wouldWriteRuntime",
      "wouldUnlockExecution",
      "wouldDispatchAgent",
      "wouldMutateProject",
      "wouldSpend",
    ]) {
      if (row[field] !== false) errors.push(`${row.rowLabel || "row"}.${field} must be false`);
    }
  }
  const summary = data.approvalDecisionPersistenceSummary || {};
  for (const field of [
    "persistenceCandidateCount",
    "persistableCandidateCount",
    "decisionRecordableCandidateCount",
    "approvalDecisionRecordableCandidateCount",
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
  if (/founderApprovalDecisionPersistenceDrafts|founderApprovalDecisionPersistenceEvents|founderApprovalDecisionPersistenceEvidenceRefs|approval_decision_persistence/i.test(serialized)) {
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
