import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS,
  P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS,
  P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalRequestBoundary.js";
import { buildFounderLiveApprovalRequestQueuePreview } from "./founderLiveApprovalRequestQueuePreview.js";

export const P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE = "P107.1";

export const P107_APPROVAL_CAPTURE_BOUNDARY_STATES = Object.freeze({
  CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED: "founder_live_approval_capture_boundary_ready_execution_blocked",
  NEEDS_APPROVAL_REQUEST_QUEUE: "founder_live_approval_capture_boundary_needs_request_queue",
});

export const P107_APPROVAL_CAPTURE_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS,
    "approvalDecisionCaptureAllowed",
    "approvalDecisionPersistenceAllowed",
    "approvalCaptureWriteAllowed",
    "approvalCaptureCanUnlockExecution",
    "approvalCaptureRuntimeAdmissionAllowed",
    "approvalCaptureDispatchAllowed",
    "approvalCaptureWorkerExecutionAllowed",
    "approvalCaptureToolExecutionAllowed",
    "approvalCaptureProjectMutationAllowed",
    "approvalCaptureHostedDbMutationAllowed",
    "approvalCaptureDeployAllowed",
    "approvalCaptureSpendAllowed",
  ]),
]);

export const P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE = Object.freeze([
  ...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE,
  "approvalRequestQueueSelected",
  "founderIdentityBoundaryReviewed",
  "operatorIdentityBoundaryReviewed",
  "decisionCaptureAuditPolicyReviewed",
  "decisionRevocationPolicyReviewed",
  "captureStorageBoundaryReviewed",
  "executionUnlockSeparationReviewed",
  "approvalExpiryPolicyReviewed",
]);

export const P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS = Object.freeze([
  ...P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS,
  "approval decision capture",
  "approval decision persistence",
  "approval capture write that unlocks execution",
  "approval capture runtime admission",
]);

function blockedFlags() {
  return Object.fromEntries(P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildApprovalCaptureBoundaryShape(queueSummary = {}) {
  return {
    captureBoundaryKey: "display-safe-approval-capture-boundary",
    displayLabel: "Founder live approval capture boundary",
    sourceApprovalRequestPhase: "P106",
    currentState: P107_APPROVAL_CAPTURE_BOUNDARY_STATES.CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED,
    queuedRequestCount: queueSummary.queuedRequestCount || 0,
    capturedDecisionCount: 0,
    persistedDecisionCount: 0,
    executionUnlockCount: 0,
    runtimeAdmissionCount: 0,
    requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    missingEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    forbiddenActions: [...P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS],
    validationCommands: ["npm run check:p1071-founder-live-approval-capture-boundary-contract"],
    blockers: [
      "P107.1 is contract/schema only.",
      "Approval decisions cannot be captured.",
      "Approval decisions cannot be persisted.",
      "Approval capture writes cannot unlock execution or runtime admission.",
      "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and spend remain blocked.",
    ],
    disabledReason:
      "P107.1 defines the approval capture boundary only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
    evidenceRefs: ["reports/p1071-founder-live-approval-capture-boundary-contract-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedFlags(),
  };
}

function buildApprovalCaptureDecisionShape() {
  return {
    decisionBoundaryKey: "display-safe-approval-capture-decision",
    displayLabel: "Approval capture decision boundary",
    currentState: P107_APPROVAL_CAPTURE_BOUNDARY_STATES.CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED,
    decisionOptions: ["not_available_in_p107_1"],
    decisionCaptureAllowed: false,
    decisionPersistenceAllowed: false,
    decisionCanUnlockExecution: false,
    runtimeTransitionAllowed: false,
    validationCommands: ["npm run check:p1071-founder-live-approval-capture-boundary-contract"],
    disabledReason:
      "Approval decisions are not capturable in P107.1. A later explicit phase must define decision capture review, persistence, rollback, audit, and revocation behavior before any runtime transition can be considered.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveApprovalCaptureBoundarySchema(input = {}) {
  const queuePreviewEnvelope = input.queuePreviewEnvelope || buildFounderLiveApprovalRequestQueuePreview(input);
  const queuePreviewData = queuePreviewEnvelope.data || {};
  const queueSummary = queuePreviewData.approvalRequestQueueSummary || {};
  const approvalCaptureBoundaryShape = buildApprovalCaptureBoundaryShape(queueSummary);
  const approvalCaptureDecisionShape = buildApprovalCaptureDecisionShape();
  const queueReady = queueSummary.queueReady === true;

  return createPassResult({
    phase: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE,
    mode: "founder-live-approval-capture-boundary",
    source: "live-ready/founderLiveApprovalCaptureBoundary.js",
    summary: "Founder live approval capture boundary schema is defined locally; approval capture and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: queueReady
        ? P107_APPROVAL_CAPTURE_BOUNDARY_STATES.CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED
        : P107_APPROVAL_CAPTURE_BOUNDARY_STATES.NEEDS_APPROVAL_REQUEST_QUEUE,
      sourceApprovalRequestQueuePhase: queuePreviewEnvelope.phase,
      sourceApprovalRequestQueueState: queuePreviewData.currentState,
      founderContextSummary: queuePreviewData.founderContextSummary,
      approvalCaptureBoundaryShape,
      approvalCaptureDecisionShape,
      approvalCaptureReadiness: {
        captureBoundaryReady: queueReady,
        queuedRequestCount: queueSummary.queuedRequestCount || 0,
        capturedDecisionCount: 0,
        persistedDecisionCount: 0,
        writableDecisionCount: 0,
        executableDecisionCount: 0,
        runtimeAdmissionDecisionCount: 0,
        dispatchableDecisionCount: 0,
        projectMutationDecisionCount: 0,
        hostedDbMutationDecisionCount: 0,
        providerSpendDecisionCount: 0,
      },
      requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
      forbiddenActions: [...P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS],
      requiredEvidenceCount: P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length,
      nextAction: queueReady
        ? "Use this schema to build P107.2 deterministic approval capture records without capturing, persisting, or unlocking execution."
        : "Complete the P106 approval request queue preview before approval capture boundary construction.",
      blockers: [
        "P107.1 is contract/schema only.",
        "Approval decisions cannot be captured.",
        "Approval decisions cannot be persisted.",
        "Approval capture writes cannot unlock execution or runtime admission.",
        "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and spend remain blocked.",
      ],
      disabledReason:
        "P107.1 defines a local approval capture boundary only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
      evidenceRefs: [
        "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
        ...(queuePreviewData.evidenceRefs || []),
      ],
      activityLocation: queuePreviewData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
      "contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json",
      "reports/p1067-founder-live-approval-request-final-report.md",
    ],
    warnings: [
      "P107.1 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalCaptureBoundarySchema(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE) errors.push("phase must be P107.1");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P107_APPROVAL_CAPTURE_BOUNDARY_STATES).includes(data.currentState)) errors.push("currentState must be a P107 approval capture boundary state");
  if (!data.approvalCaptureBoundaryShape) errors.push("approvalCaptureBoundaryShape is required");
  if (!data.approvalCaptureDecisionShape) errors.push("approvalCaptureDecisionShape is required");
  if (!data.approvalCaptureReadiness) errors.push("approvalCaptureReadiness is required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 24) errors.push("requiredEvidence must include P106 evidence plus capture evidence");
  if (!Array.isArray(data.forbiddenActions) || !data.forbiddenActions.includes("approval decision capture")) errors.push("forbiddenActions must block approval decision capture");
  for (const flag of P107_APPROVAL_CAPTURE_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.approvalCaptureBoundaryShape?.[flag] !== false) errors.push(`approvalCaptureBoundaryShape.${flag} must be false`);
    if (data.approvalCaptureDecisionShape?.[flag] !== false) errors.push(`approvalCaptureDecisionShape.${flag} must be false`);
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P107.1");
  return { valid: errors.length === 0, errors };
}
