import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P105_EXECUTION_APPROVAL_BLOCKED_FLAGS,
  P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS,
  P105_EXECUTION_APPROVAL_REQUIRED_GATES,
  P105_EXECUTION_APPROVAL_STATES,
} from "./founderLiveExecutionApprovalPlanning.js";

export const P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE = "P106.1";

export const P106_APPROVAL_REQUEST_BOUNDARY_STATES = Object.freeze({
  REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED: "founder_live_approval_request_boundary_ready_execution_blocked",
  NEEDS_APPROVAL_REVIEW_PACKET: "founder_live_approval_request_boundary_needs_approval_review_packet",
});

export const P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P105_EXECUTION_APPROVAL_BLOCKED_FLAGS,
    "approvalRequestSubmissionAllowed",
    "approvalRequestCaptureAllowed",
    "approvalRequestPersistenceAllowed",
    "approvalRequestWriteAllowed",
    "approvalRequestCanUnlockExecution",
    "approvalRequestRuntimeAdmissionAllowed",
    "approvalRequestDispatchAllowed",
    "approvalRequestWorkerExecutionAllowed",
    "approvalRequestToolExecutionAllowed",
    "approvalRequestProjectMutationAllowed",
    "approvalRequestHostedDbMutationAllowed",
    "approvalRequestDeployAllowed",
    "approvalRequestSpendAllowed",
  ]),
]);

export const P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE = Object.freeze([
  ...P105_EXECUTION_APPROVAL_REQUIRED_GATES,
  "approvalReviewPacketSelected",
  "founderDecisionPromptReviewed",
  "operatorDecisionPromptReviewed",
  "requestExpirationPolicyReviewed",
  "requestAuditRetentionReviewed",
  "requestRevocationPathReviewed",
]);

export const P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS = Object.freeze([
  ...P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS,
  "approval request submission",
  "approval request capture",
  "approval request persistence",
  "approval request write that unlocks execution",
]);

function blockedFlags() {
  return Object.fromEntries(P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildApprovalRequestEnvelopeShape() {
  return {
    requestKey: "display-safe-approval-request-envelope",
    displayLabel: "Founder live approval request envelope",
    sourceApprovalPhase: "P105",
    sourceApprovalState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
    currentState: P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED,
    requestSubmissionAllowed: false,
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
    missingEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
    forbiddenActions: [...P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS],
    validationCommands: ["npm run check:p1061-founder-live-approval-request-boundary-contract"],
    blockers: [
      "P106.1 is contract/schema only.",
      "Approval requests cannot be submitted, captured, or persisted.",
      "Approval requests cannot unlock execution or runtime admission.",
      "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and spend remain blocked.",
    ],
    disabledReason:
      "P106.1 defines the approval request boundary only. It does not submit approvals, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Request Boundary",
    evidenceRefs: ["reports/p1061-founder-live-approval-request-boundary-contract-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedFlags(),
  };
}

function buildApprovalRequestDecisionShape() {
  return {
    decisionKey: "display-safe-approval-request-decision",
    displayLabel: "Approval request decision boundary",
    currentState: P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED,
    decisionOptions: ["not_available_in_p106_1"],
    decisionCaptureAllowed: false,
    decisionPersistenceAllowed: false,
    decisionCanUnlockExecution: false,
    runtimeTransitionAllowed: false,
    validationCommands: ["npm run check:p1061-founder-live-approval-request-boundary-contract"],
    disabledReason:
      "Approval decisions are not capturable in P106.1. A later explicit phase must define decision capture, persistence, rollback, and audit behavior before any runtime transition can be considered.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveApprovalRequestBoundarySchema() {
  const approvalRequestEnvelopeShape = buildApprovalRequestEnvelopeShape();
  const approvalRequestDecisionShape = buildApprovalRequestDecisionShape();

  return createPassResult({
    phase: P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE,
    mode: "founder-live-approval-request-boundary",
    source: "live-ready/founderLiveApprovalRequestBoundary.js",
    summary: "Founder live approval request boundary schema is defined locally; request submission and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED,
      sourceApprovalPhase: "P105",
      approvalRequestEnvelopeShape,
      approvalRequestDecisionShape,
      requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
      forbiddenActions: [...P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS],
      requiredEvidenceCount: P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length,
      approvalRequestSubmissionAllowed: false,
      approvalRequestCaptureAllowed: false,
      approvalRequestPersistenceAllowed: false,
      approvalRequestWriteAllowed: false,
      approvalRequestCanUnlockExecution: false,
      approvalRequestRuntimeAdmissionAllowed: false,
      approvalCanUnlockExecution: false,
      approvalWriteAllowed: false,
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
      nextAction: "Use this schema to build P106.2 deterministic approval request records without submitting, capturing, persisting, or unlocking execution.",
      blockers: [
        "P106.1 is contract/schema only.",
        "Approval requests cannot be submitted, captured, or persisted.",
        "Approval requests cannot unlock execution or runtime admission.",
        "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, and spend remain blocked.",
      ],
      disabledReason:
        "P106.1 defines a local approval request boundary only. It does not submit approvals, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Request Boundary",
      evidenceRefs: ["reports/p1061-founder-live-approval-request-boundary-contract-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1061-founder-live-approval-request-boundary-contract-report.md",
      "contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json",
    ],
    warnings: [
      "P106.1 does not submit approval requests, capture approvals, persist approval state, unlock execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalRequestBoundarySchema(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE) errors.push("phase must be P106.1");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (data.currentState !== P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED) errors.push("currentState must be request boundary ready execution blocked");
  if (!data.approvalRequestEnvelopeShape) errors.push("approvalRequestEnvelopeShape is required");
  if (!data.approvalRequestDecisionShape) errors.push("approvalRequestDecisionShape is required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 18) errors.push("requiredEvidence must include P105 gates plus request evidence");
  if (!Array.isArray(data.forbiddenActions) || !data.forbiddenActions.includes("approval request submission")) errors.push("forbiddenActions must block approval request submission");
  for (const flag of P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.approvalRequestEnvelopeShape?.[flag] !== false) errors.push(`approvalRequestEnvelopeShape.${flag} must be false`);
    if (data.approvalRequestDecisionShape?.[flag] !== false) errors.push(`approvalRequestDecisionShape.${flag} must be false`);
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P106.1");
  return { valid: errors.length === 0, errors };
}
