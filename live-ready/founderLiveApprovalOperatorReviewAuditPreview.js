import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
  P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalOperatorReviewBoundary.js";
import { buildFounderLiveApprovalOperatorReviewModel } from "./founderLiveApprovalOperatorReviewModel.js";

export const P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE = "P108.3";

export const P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES = Object.freeze({
  OPERATOR_REVIEW_AUDIT_PREVIEW_READY_CAPTURE_BLOCKED: "founder_live_operator_review_audit_preview_ready_capture_blocked",
  NEEDS_OPERATOR_REVIEW_RECORDS: "founder_live_operator_review_audit_preview_needs_operator_review_records",
});

function blockedFlags() {
  return Object.fromEntries(P108_OPERATOR_REVIEW_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function auditRowFor(record = {}, index = 0) {
  return {
    auditPreviewRef: `operator-review-audit-preview-${index + 1}`,
    displayLabel: record.displayLabel || `Operator Review ${index + 1}`,
    sourceReviewLabel: record.displayLabel || `Operator Review Record ${index + 1}`,
    sourceAuditLabel: record.sourceAuditLabel,
    sourceQueueLabel: record.sourceQueueLabel,
    proposedAgentLane: record.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: record.proposedOutcome || "Prepare governed work for later operator-review audit.",
    auditState: P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES.OPERATOR_REVIEW_AUDIT_PREVIEW_READY_CAPTURE_BLOCKED,
    reviewPosition: record.reviewPosition || index + 1,
    evidenceStatus: {
      requiredEvidenceCount: P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length,
      readyEvidenceCount: 0,
      operatorDecisionCaptured: false,
      operatorDecisionPersisted: false,
      operatorReviewWriteAllowed: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    missingEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    auditQuestions: [
      record.founderReviewPrompt || "Which founder decision would be reviewed later?",
      record.operatorReviewPrompt || "Which operator evidence would be reviewed later?",
      record.rollbackReviewPrompt || "Which rollback and revocation path must remain available before any future decision write?",
      "What audit evidence must exist before any future operator decision capture can be considered?",
    ],
    nextAction: "Keep this audit preview local and read-only until a later explicit UX phase renders it without capture controls.",
    blockers: [
      "Operator-review audit preview is local and read-only.",
      "Operator decision capture is not available.",
      "Operator decision persistence is not available.",
      "Operator review writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(record.blockers || []),
    ],
    disabledReason:
      "P108.3 builds a local operator-review audit preview only. It cannot capture approvals, persist approval state, write approval decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
    evidenceRefs: [
      "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md",
      ...(record.evidenceRefs || []),
    ],
    activityLocation: record.activityLocation || "reports/os-phase-status-report.md",
    costImpact: record.costImpact || "Local operator-review audit preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    operatorDecisionCaptured: false,
    operatorDecisionPersisted: false,
    operatorDecisionCaptureAllowed: false,
    operatorDecisionPersistenceAllowed: false,
    operatorReviewWriteAllowed: false,
    operatorReviewCanUnlockExecution: false,
    operatorReviewRuntimeAdmissionAllowed: false,
    approvalCaptured: false,
    approvalPersisted: false,
    approvalDecisionCaptureAllowed: false,
    approvalDecisionPersistenceAllowed: false,
    approvalCaptureWriteAllowed: false,
    approvalCaptureCanUnlockExecution: false,
    approvalCaptureRuntimeAdmissionAllowed: false,
    approvalWriteAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    runtimeTransitionAllowed: false,
    executionAllowed: false,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    hostedDbMutationAllowed: false,
    deployAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    ...blockedFlags(),
  };
}

function buildAuditSections(auditRows = []) {
  return [
    {
      sectionRef: "local-operator-review-audit-ready-capture-blocked",
      displayLabel: "Local operator review audit ready",
      auditPreviewCount: auditRows.length,
      blockedCount: auditRows.length,
      nextAction: "Render this section in P108.4 without capture controls, execution controls, raw IDs, logs, or policy dumps.",
      disabledReason: "This audit section is read-only and cannot capture, persist, write, or unlock approvals.",
    },
  ];
}

export function buildFounderLiveApprovalOperatorReviewAuditPreview(input = {}) {
  const operatorReviewModelEnvelope = input.operatorReviewModelEnvelope || buildFounderLiveApprovalOperatorReviewModel(input);
  const operatorReviewModelData = operatorReviewModelEnvelope.data || {};
  const auditRows = (operatorReviewModelData.operatorReviewRecords || []).map(auditRowFor);
  const auditPreviewReady = auditRows.length > 0;
  const auditSections = buildAuditSections(auditRows);

  return createPassResult({
    phase: P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE,
    mode: "founder-live-approval-operator-review-audit-preview",
    source: "live-ready/founderLiveApprovalOperatorReviewAuditPreview.js",
    summary: "Founder live approval operator-review audit preview is assembled locally; capture, persistence, writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: auditPreviewReady
        ? P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES.OPERATOR_REVIEW_AUDIT_PREVIEW_READY_CAPTURE_BLOCKED
        : P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES.NEEDS_OPERATOR_REVIEW_RECORDS,
      sourceOperatorReviewModelPhase: operatorReviewModelEnvelope.phase,
      sourceOperatorReviewModelState: operatorReviewModelData.currentState,
      founderContextSummary: operatorReviewModelData.founderContextSummary,
      operatorReviewAuditSummary: {
        auditPreviewReady,
        auditPreviewCount: auditRows.length,
        blockedAuditPreviewCount: auditRows.length,
        capturableOperatorDecisionCount: 0,
        persistedOperatorDecisionCount: 0,
        writableOperatorDecisionCount: 0,
        executableOperatorReviewCount: 0,
        dispatchableOperatorReviewCount: 0,
        projectMutationOperatorReviewCount: 0,
        hostedDbMutationOperatorReviewCount: 0,
        providerSpendOperatorReviewCount: 0,
      },
      auditSections,
      auditRows,
      requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
      forbiddenActions: [...P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS],
      nextAction: auditPreviewReady
        ? "Render P108.4 Command Center operator-review boundary visibility on non-chat founder pages without capture or execution controls."
        : "Complete P108.2 operator-review records before audit preview assembly.",
      blockers: [
        "Operator-review audit preview is local and read-only.",
        "Operator decision capture remains blocked.",
        "Operator decision persistence remains blocked.",
        "Operator review writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P108.3 is a local operator-review audit preview only. It does not capture approvals, persist approval state, write approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
      evidenceRefs: [
        "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md",
        ...(operatorReviewModelData.evidenceRefs || []),
      ],
      activityLocation: operatorReviewModelData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic operator-review audit preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md",
      "reports/p1082-founder-live-approval-operator-review-model-report.md",
      "reports/p1081-founder-live-approval-operator-review-contract-report.md",
      "contracts/os-roadmap/p108-founder-live-approval-capture-operator-review-contracts.json",
    ],
    warnings: [
      "P108.3 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalOperatorReviewAuditPreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE) errors.push("phase must be P108.3");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES).includes(data.currentState)) errors.push("currentState must be a P108 operator-review audit preview state");
  if (!data.operatorReviewAuditSummary) errors.push("operatorReviewAuditSummary is required");
  if (!Array.isArray(data.auditRows) || data.auditRows.length === 0) errors.push("auditRows are required");
  if (!Array.isArray(data.auditSections) || data.auditSections.length === 0) errors.push("auditSections are required");
  for (const flag of P108_OPERATOR_REVIEW_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const row of data.auditRows || []) {
      if (row[flag] !== false) errors.push(`auditRows.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P108.3");
  return { valid: errors.length === 0, errors };
}
