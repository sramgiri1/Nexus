import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P107_APPROVAL_CAPTURE_BLOCKED_FLAGS,
  P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS,
  P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalCaptureBoundary.js";
import { buildFounderLiveApprovalCaptureAuditPreview } from "./founderLiveApprovalCaptureAuditPreview.js";

export const P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE = "P108.1";

export const P108_OPERATOR_REVIEW_BOUNDARY_STATES = Object.freeze({
  OPERATOR_REVIEW_BOUNDARY_READY_CAPTURE_BLOCKED: "founder_live_operator_review_boundary_ready_capture_blocked",
  NEEDS_CAPTURE_AUDIT_PREVIEW: "founder_live_operator_review_boundary_needs_capture_audit_preview",
});

export const P108_OPERATOR_REVIEW_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P107_APPROVAL_CAPTURE_BLOCKED_FLAGS,
    "operatorReviewDecisionCaptureAllowed",
    "operatorReviewDecisionPersistenceAllowed",
    "operatorReviewWriteAllowed",
    "operatorReviewCanUnlockExecution",
    "operatorReviewRuntimeAdmissionAllowed",
    "operatorReviewDispatchAllowed",
    "operatorReviewWorkerExecutionAllowed",
    "operatorReviewToolExecutionAllowed",
    "operatorReviewProjectMutationAllowed",
    "operatorReviewHostedDbMutationAllowed",
    "operatorReviewDeployAllowed",
    "operatorReviewSpendAllowed",
  ]),
]);

export const P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE = Object.freeze([
  ...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE,
  "operatorReviewScopeConfirmed",
  "operatorDecisionAuthorityBoundaryReviewed",
  "founderConsentBoundaryReviewed",
  "approvalCaptureRevocationPathReviewed",
  "approvalCaptureRollbackPathReviewed",
  "operatorReviewAuditTrailReviewed",
  "executionUnlockStillSeparated",
  "runtimeAdmissionStillBlocked",
]);

export const P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS = Object.freeze([
  ...P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS,
  "operator review decision capture",
  "operator review decision persistence",
  "operator review write that unlocks execution",
  "operator review runtime admission",
]);

function blockedFlags() {
  return Object.fromEntries(P108_OPERATOR_REVIEW_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildOperatorReviewBoundaryShape(auditSummary = {}) {
  return {
    boundaryRef: "display-safe-operator-review-boundary",
    displayLabel: "Founder live approval operator review boundary",
    sourceApprovalCapturePhase: "P107",
    currentState: P108_OPERATOR_REVIEW_BOUNDARY_STATES.OPERATOR_REVIEW_BOUNDARY_READY_CAPTURE_BLOCKED,
    auditPreviewCount: auditSummary.auditPreviewCount || 0,
    operatorReviewRecordCount: auditSummary.auditPreviewCount || 0,
    capturedOperatorDecisionCount: 0,
    persistedOperatorDecisionCount: 0,
    executionUnlockCount: 0,
    runtimeAdmissionCount: 0,
    requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    missingEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
    forbiddenActions: [...P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS],
    validationCommands: ["npm run check:p1081-founder-live-approval-operator-review-contract"],
    reviewQuestions: [
      "Which approval capture item would an operator review later?",
      "Which evidence must exist before capture can ever be considered?",
      "Which rollback and revocation path must remain available before any future decision write?",
    ],
    blockers: [
      "P108.1 is contract/schema only.",
      "Operator decisions cannot be captured.",
      "Operator decisions cannot be persisted.",
      "Operator review writes cannot unlock execution or runtime admission.",
      "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and spend remain blocked.",
    ],
    disabledReason:
      "P108.1 defines the operator review boundary only. It does not capture approvals, persist approval state, write approval decisions, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
    evidenceRefs: ["reports/p1081-founder-live-approval-operator-review-contract-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveApprovalOperatorReviewBoundary(input = {}) {
  const captureAuditEnvelope = input.captureAuditPreviewEnvelope || buildFounderLiveApprovalCaptureAuditPreview(input);
  const captureAuditData = captureAuditEnvelope.data || {};
  const auditSummary = captureAuditData.approvalCaptureAuditSummary || {};
  const auditReady = auditSummary.auditPreviewReady === true && (auditSummary.auditPreviewCount || 0) > 0;
  const operatorReviewBoundaryShape = buildOperatorReviewBoundaryShape(auditSummary);

  return createPassResult({
    phase: P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE,
    mode: "founder-live-approval-operator-review-boundary",
    source: "live-ready/founderLiveApprovalOperatorReviewBoundary.js",
    summary: "Founder live approval operator review boundary is defined locally; capture, persistence, writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: auditReady
        ? P108_OPERATOR_REVIEW_BOUNDARY_STATES.OPERATOR_REVIEW_BOUNDARY_READY_CAPTURE_BLOCKED
        : P108_OPERATOR_REVIEW_BOUNDARY_STATES.NEEDS_CAPTURE_AUDIT_PREVIEW,
      sourceCaptureAuditPreviewPhase: captureAuditEnvelope.phase,
      sourceCaptureAuditPreviewState: captureAuditData.currentState,
      founderContextSummary: captureAuditData.founderContextSummary,
      operatorReviewBoundaryShape,
      operatorReviewReadiness: {
        operatorReviewBoundaryReady: auditReady,
        auditPreviewCount: auditSummary.auditPreviewCount || 0,
        operatorReviewRecordCount: auditSummary.auditPreviewCount || 0,
        blockedOperatorReviewRecordCount: auditSummary.auditPreviewCount || 0,
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
      requiredEvidence: [...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE],
      forbiddenActions: [...P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS],
      requiredEvidenceCount: P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length,
      nextAction: auditReady
        ? "Use this schema to build P108.2 deterministic local operator-review records without capture, persistence, writes, or execution authority."
        : "Complete P107 capture audit preview before operator-review boundary construction.",
      blockers: [
        "P108.1 is contract/schema only.",
        "Operator decisions cannot be captured.",
        "Operator decisions cannot be persisted.",
        "Operator review writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P108.1 is a local operator-review boundary only. It does not capture approvals, persist approval state, write approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Operator Review Boundary",
      evidenceRefs: [
        "reports/p1081-founder-live-approval-operator-review-contract-report.md",
        ...(captureAuditData.evidenceRefs || []),
      ],
      activityLocation: captureAuditData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local operator-review schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1081-founder-live-approval-operator-review-contract-report.md",
      "reports/p1077-founder-live-approval-capture-final-report.md",
      "contracts/os-roadmap/p108-founder-live-approval-capture-operator-review-contracts.json",
    ],
    warnings: [
      "P108.1 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalOperatorReviewBoundary(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE) errors.push("phase must be P108.1");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P108_OPERATOR_REVIEW_BOUNDARY_STATES).includes(data.currentState)) errors.push("currentState must be a P108 operator-review boundary state");
  if (!data.operatorReviewBoundaryShape) errors.push("operatorReviewBoundaryShape is required");
  if (!data.operatorReviewReadiness) errors.push("operatorReviewReadiness is required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 32) errors.push("requiredEvidence must include P107 evidence plus operator-review evidence");
  if (!Array.isArray(data.forbiddenActions) || !data.forbiddenActions.includes("operator review decision capture")) errors.push("forbiddenActions must block operator review decision capture");
  for (const flag of P108_OPERATOR_REVIEW_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.operatorReviewBoundaryShape?.[flag] !== false) errors.push(`operatorReviewBoundaryShape.${flag} must be false`);
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P108.1");
  return { valid: errors.length === 0, errors };
}
