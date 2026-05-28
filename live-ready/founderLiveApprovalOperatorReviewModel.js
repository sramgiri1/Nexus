import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveApprovalCaptureAuditPreview } from "./founderLiveApprovalCaptureAuditPreview.js";
import {
  P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
  P108_OPERATOR_REVIEW_BOUNDARY_STATES,
  P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
  buildFounderLiveApprovalOperatorReviewBoundary,
} from "./founderLiveApprovalOperatorReviewBoundary.js";

export const P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE = "P108.2";

export const P108_OPERATOR_REVIEW_MODEL_STATES = Object.freeze({
  OPERATOR_REVIEW_RECORDS_READY_CAPTURE_BLOCKED: "founder_live_operator_review_records_ready_capture_blocked",
  NEEDS_OPERATOR_REVIEW_BOUNDARY: "founder_live_operator_review_model_needs_operator_review_boundary",
});

function blockedFlags() {
  return Object.fromEntries(P108_OPERATOR_REVIEW_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function slugFor(value = "", fallback = "operator-review") {
  const slug = String(value || fallback)
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function recordRefFor(row = {}, index = 0) {
  return `operator-review-record-${index + 1}-${slugFor(row.displayLabel, "item")}`;
}

function buildOperatorReviewRecord(row = {}, index = 0) {
  return {
    recordRef: recordRefFor(row, index),
    displayLabel: `${row.displayLabel || `Approval Capture Audit ${index + 1}`} operator review`,
    sourceAuditLabel: row.displayLabel || `Approval Capture Audit ${index + 1}`,
    sourceQueueLabel: row.sourceQueueLabel,
    proposedAgentLane: row.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: row.proposedOutcome || "Prepare governed work for later operator review.",
    reviewState: P108_OPERATOR_REVIEW_MODEL_STATES.OPERATOR_REVIEW_RECORDS_READY_CAPTURE_BLOCKED,
    reviewPosition: row.queuePosition || index + 1,
    localOperatorReviewReady: true,
    founderReviewPrompt: row.auditQuestions?.[0] || "Which founder decision would be reviewed later?",
    operatorReviewPrompt: row.auditQuestions?.[1] || "Which operator evidence would be reviewed later?",
    rollbackReviewPrompt: "Which rollback and revocation path must remain available before any future decision write?",
    decisionOptions: ["not_available_in_p108_2"],
    requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    missingEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    evidenceSummary: {
      requiredEvidenceCount: P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length,
      readyEvidenceCount: 0,
      operatorDecisionCaptured: false,
      operatorDecisionPersisted: false,
      operatorReviewWriteAllowed: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    validationCommands: ["npm run check:p1082-founder-live-approval-operator-review-model"],
    nextAction: "Keep this as a local operator-review record until a later explicit preview/UX phase renders it without capture controls.",
    blockers: [
      "Operator-review record is local and read-only.",
      "Operator decision capture is not available.",
      "Operator decision persistence is not available.",
      "Operator review writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(row.blockers || []),
    ],
    disabledReason:
      "P108.2 builds local operator-review records only. It cannot capture approvals, persist approval state, write approval decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
    evidenceRefs: [
      "reports/p1082-founder-live-approval-operator-review-model-report.md",
      ...(row.evidenceRefs || []),
    ],
    activityLocation: row.activityLocation || "reports/os-phase-status-report.md",
    costImpact: row.costImpact || "Local operator-review model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
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

export function buildFounderLiveApprovalOperatorReviewModel(input = {}) {
  const operatorReviewBoundaryEnvelope = input.operatorReviewBoundaryEnvelope || buildFounderLiveApprovalOperatorReviewBoundary(input);
  const operatorReviewBoundaryData = operatorReviewBoundaryEnvelope.data || {};
  const captureAuditEnvelope = input.captureAuditPreviewEnvelope || buildFounderLiveApprovalCaptureAuditPreview(input);
  const captureAuditData = captureAuditEnvelope.data || {};
  const auditRows = captureAuditData.auditRows || [];
  const operatorReviewRecords = auditRows.map(buildOperatorReviewRecord);
  const recordCount = operatorReviewRecords.length;
  const boundaryReady = operatorReviewBoundaryData.currentState === P108_OPERATOR_REVIEW_BOUNDARY_STATES.OPERATOR_REVIEW_BOUNDARY_READY_CAPTURE_BLOCKED;
  const modelReady = boundaryReady && recordCount > 0;

  return createPassResult({
    phase: P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE,
    mode: "founder-live-approval-operator-review-model",
    source: "live-ready/founderLiveApprovalOperatorReviewModel.js",
    summary: "Founder live approval operator-review records are assembled locally; capture, persistence, writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: modelReady
        ? P108_OPERATOR_REVIEW_MODEL_STATES.OPERATOR_REVIEW_RECORDS_READY_CAPTURE_BLOCKED
        : P108_OPERATOR_REVIEW_MODEL_STATES.NEEDS_OPERATOR_REVIEW_BOUNDARY,
      sourceOperatorReviewBoundaryPhase: operatorReviewBoundaryEnvelope.phase,
      sourceOperatorReviewBoundaryState: operatorReviewBoundaryData.currentState,
      sourceCaptureAuditPreviewPhase: captureAuditEnvelope.phase,
      sourceCaptureAuditPreviewState: captureAuditData.currentState,
      founderContextSummary: captureAuditData.founderContextSummary || operatorReviewBoundaryData.founderContextSummary,
      operatorReviewModelSummary: {
        modelReady,
        operatorReviewRecordCount: recordCount,
        blockedOperatorReviewRecordCount: recordCount,
        capturedOperatorDecisionCount: 0,
        persistedOperatorDecisionCount: 0,
        writableOperatorDecisionCount: 0,
        operatorReviewWriteCount: 0,
        operatorReviewUnlockCount: 0,
        runtimeAdmissionOperatorReviewCount: 0,
        executableOperatorReviewCount: 0,
        dispatchableOperatorReviewCount: 0,
        projectMutationOperatorReviewCount: 0,
        hostedDbMutationOperatorReviewCount: 0,
        providerSpendOperatorReviewCount: 0,
      },
      operatorReviewRecords,
      requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
      forbiddenActions: [...P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS],
      nextAction: modelReady
        ? "Use these local operator-review records to build P108.3 audit preview without capture, persistence, writes, or execution authority."
        : "Complete P108.1 operator-review boundary and P107 capture audit preview before operator-review model construction.",
      blockers: [
        "Operator-review records are local and read-only.",
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
        "P108.2 is a local operator-review model only. It does not capture approvals, persist approval state, write approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
      evidenceRefs: [
        "reports/p1082-founder-live-approval-operator-review-model-report.md",
        ...(operatorReviewBoundaryData.evidenceRefs || []),
      ],
      activityLocation: operatorReviewBoundaryData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic operator-review model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1082-founder-live-approval-operator-review-model-report.md",
      "reports/p1081-founder-live-approval-operator-review-contract-report.md",
      "contracts/os-roadmap/p108-founder-live-approval-capture-operator-review-contracts.json",
    ],
    warnings: [
      "P108.2 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalOperatorReviewModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE) errors.push("phase must be P108.2");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P108_OPERATOR_REVIEW_MODEL_STATES).includes(data.currentState)) errors.push("currentState must be a P108 operator-review model state");
  if (!data.operatorReviewModelSummary) errors.push("operatorReviewModelSummary is required");
  if (!Array.isArray(data.operatorReviewRecords) || data.operatorReviewRecords.length === 0) errors.push("operatorReviewRecords are required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 32) errors.push("requiredEvidence must include P108 operator-review evidence");
  for (const flag of P108_OPERATOR_REVIEW_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const record of data.operatorReviewRecords || []) {
      if (record[flag] !== false) errors.push(`operatorReviewRecords.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P108.2");
  return { valid: errors.length === 0, errors };
}
