import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityActivationEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE,
  buildFounderApprovalApplicationAuthorityActivationIntentModel,
  validateFounderApprovalApplicationAuthorityActivationIntentModel,
} from "./founderApprovalApplicationAuthorityActivationIntentModel.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_PHASE = "P123.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_STATES = {
  READY_ACTIVATION_BLOCKED: "activation preview ready; activation blocked",
  NEEDS_INTENT_MODEL: "activation preview needs intent model",
};

const ACTIVATION_PREVIEW_BLOCKED_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  approvalApplicationAuthorityActivationPreviewAllowed: false,
  approvalApplicationAuthorityActivationPreviewWritten: false,
  authorityActivated: false,
  authorityGranted: false,
  activationPersisted: false,
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
  "Approval application authority activation is blocked.",
  "Authority grant and approval decision application remain blocked.",
  "DB and runtime writes remain blocked.",
  "Runtime execution and execution unlock remain blocked.",
];

function allFlagsFalse(target = {}) {
  return Object.keys(ACTIVATION_PREVIEW_BLOCKED_FLAGS).every((flag) => target[flag] === false);
}

function buildPreviewRows(metadata, intentModel) {
  const readinessRows = intentModel.readinessRows || [];
  return metadata.sections.map((section, index) => {
    const readiness = readinessRows[index % readinessRows.length] || {};
    return {
      rowLabel: section.publicLabel,
      currentState: "Dry-run only; activation blocked",
      readinessLabel: readiness.label || "Approval application authority activation readiness",
      readinessState: readiness.state || "blocked",
      nextAction: readiness.nextAction || intentModel.nextAction,
      blocker: DEFAULT_BLOCKERS[index] || "Approval application authority activation remains blocked.",
      disabledReason: readiness.disabledReason || intentModel.disabledReason,
      ownerCapability: readiness.ownerCapability || intentModel.ownerCapability,
      evidenceLabel: intentModel.evidenceLabels[index % intentModel.evidenceLabels.length],
      activityLabel: intentModel.activityLabels[index % intentModel.activityLabels.length],
      costImpactLabel: intentModel.costImpactLabel,
      wouldActivateAuthority: false,
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
      ...ACTIVATION_PREVIEW_BLOCKED_FLAGS,
    };
  });
}

function buildPreviewSections(rows, intentModel) {
  return [
    {
      sectionLabel: "Activation intent",
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
      nextAction: "Keep activation, authority grant, DB writes, and runtime writes unavailable until a later explicit phase grants authority.",
      disabledReason: "P123.4 does not activate authority, grant authority, apply decisions, or write runtime state.",
    },
    {
      sectionLabel: "Runtime authority",
      currentState: "Blocked",
      rowCount: rows.length,
      blockedCount: rows.length,
      nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow authority.",
      disabledReason: "P123.4 does not unlock execution, dispatch agents, mutate projects, or spend.",
    },
  ];
}

export function buildFounderApprovalApplicationAuthorityActivationPreview(input = {}) {
  const metadata = buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata();
  const intentModel = input.intentModel || buildFounderApprovalApplicationAuthorityActivationIntentModel(input);
  const intentValidation = validateFounderApprovalApplicationAuthorityActivationIntentModel(intentModel);
  const previewRows = intentValidation.valid ? buildPreviewRows(metadata, intentModel) : [];
  const previewReady = previewRows.length > 0;

  return createPassResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_PHASE,
    mode: "founder-approval-application-authority-activation-safe-dry-run",
    source: "shared/founderApprovalApplicationAuthorityActivationPreview.js",
    summary:
      "Founder approval application authority activation dry-run preview is assembled locally; activation, authority grant, DB/runtime writes, and execution remain blocked.",
    data: {
      schemaVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_VERSION,
      currentState: previewReady
        ? FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_STATES.READY_ACTIVATION_BLOCKED
        : FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_STATES.NEEDS_INTENT_MODEL,
      previewMode: "local-only-authority-activation-dry-run",
      dryRunOnly: true,
      commandCenterVisible: false,
      sourceIntentPhase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE,
      sourceMetadataPhase: metadata.phaseId,
      founderIdeaSummary: intentModel.founderIdeaSummary,
      activationSummary: {
        previewRowCount: previewRows.length,
        blockedRowCount: previewRows.length,
        activationCandidateCount: 0,
        authorityGrantCandidateCount: 0,
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
      evidenceRefs: ["reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run activation preview only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      ...ACTIVATION_PREVIEW_BLOCKED_FLAGS,
    },
    evidence: [
      "reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md",
      "contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json",
    ],
    warnings: [
      "P123.4 is a dry-run preview. It does not activate authority, grant authority, apply approvals, accept approvals, persist decisions, record approve/reject actions, write DB/runtime records, execute runtime work, dispatch agents, mutate projects, use hosted DBs, deploy, package, call providers, or spend.",
    ],
  });
}

export function validateFounderApprovalApplicationAuthorityActivationPreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_PHASE) errors.push("phase must be P123.4");
  if (data.schemaVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (!Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be allowlisted");
  }
  if (data.previewMode !== "local-only-authority-activation-dry-run" || data.dryRunOnly !== true) {
    errors.push("preview must remain local-only activation dry run");
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P123.5");
  if (data.sourceIntentPhase !== "P123.3" || data.sourceMetadataPhase !== "P123.2") {
    errors.push("preview must reuse P123.3 intent model and P123.2 eligibility metadata");
  }
  if (!Array.isArray(data.previewRows) || data.previewRows.length === 0) errors.push("previewRows required");
  if (!Array.isArray(data.previewSections) || data.previewSections.length === 0) errors.push("previewSections required");
  if (!allFlagsFalse(data)) errors.push("top-level activation preview authority flags must remain false");
  for (const row of data.previewRows || []) {
    if (!allFlagsFalse(row)) errors.push(`${row.rowLabel || "row"} authority flags must remain false`);
    for (const field of [
      "wouldActivateAuthority",
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
  const summary = data.activationSummary || {};
  for (const field of [
    "activationCandidateCount",
    "authorityGrantCandidateCount",
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
  if (/founderApprovalApplicationAuthorityActivation|approval_authority_activation/i.test(serialized)) {
    errors.push("Preview model must not expose raw schema or table names");
  }
  if (/activate now|grant authority now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serialized)) {
    errors.push("Preview model must not expose fake unsafe runnable actions");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
