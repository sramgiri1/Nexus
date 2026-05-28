import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveExecutionApprovalReviewPacket } from "./founderLiveExecutionApprovalReviewPacket.js";
import {
  P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS,
  P106_APPROVAL_REQUEST_BOUNDARY_STATES,
  P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS,
  P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE,
  buildFounderLiveApprovalRequestBoundarySchema,
} from "./founderLiveApprovalRequestBoundary.js";

export const P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE = "P106.2";

export const P106_APPROVAL_REQUEST_MODEL_STATES = Object.freeze({
  LOCAL_REQUEST_RECORDS_READY_EXECUTION_BLOCKED: "founder_live_approval_request_records_ready_execution_blocked",
  NEEDS_REVIEW_PACKET_ROWS: "founder_live_approval_request_records_needs_review_packet_rows",
});

function blockedFlags() {
  return Object.fromEntries(P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function slugFor(value = "", fallback = "approval-request") {
  const slug = String(value || fallback)
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function requestKeyFor(review = {}, index = 0) {
  return `approval-request-${index + 1}-${slugFor(review.displayLabel, "review")}`;
}

function evidenceFor(review = {}) {
  const missingGates = Array.isArray(review.missingGates) ? review.missingGates : [];
  return [...new Set([...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE, ...missingGates])];
}

function buildApprovalRequestRecord(review = {}, index = 0) {
  const missingEvidence = evidenceFor(review);
  return {
    approvalRequestKey: requestKeyFor(review, index),
    displayLabel: review.displayLabel || `Approval Request ${index + 1}`,
    sourceReviewLabel: review.displayLabel || `Approval Review ${index + 1}`,
    sourceBoundaryLabel: review.sourceWorkOrderLabel || review.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: review.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: review.proposedOutcome || "Prepare governed work for later approval request review.",
    requestState: P106_APPROVAL_REQUEST_MODEL_STATES.LOCAL_REQUEST_RECORDS_READY_EXECUTION_BLOCKED,
    boundaryState: P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED,
    requestRecordReady: true,
    requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
    missingEvidence,
    evidenceSummary: {
      requiredEvidenceCount: P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: missingEvidence.length,
      readyEvidenceCount: Math.max(P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length - missingEvidence.length, 0),
      approvalRequestSubmitted: false,
      approvalCaptured: false,
      approvalPersisted: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    founderDecisionPrompt: "Review the scope, evidence, blockers, cost posture, and rollback path before any later approval capture phase.",
    operatorDecisionPrompt: "Confirm the request remains local, display-safe, non-persistent, and unable to unlock runtime execution.",
    decisionOptions: ["not_available_until_explicit_approval_capture_phase"],
    reviewQuestions: review.reviewQuestions || [],
    validationCommands: [
      "npm run check:p1062-founder-live-approval-request-model",
      "npm run check:p1061-founder-live-approval-request-boundary-contract",
      ...(review.validationCommands || []),
    ],
    nextAction: "Route this local request record into the P106.3 queue preview without approval controls or runtime actions.",
    blockers: [
      "Approval request submission is not available.",
      "Approval capture is not available.",
      "Approval persistence is not available.",
      "Approval request writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(review.blockers || []),
    ],
    disabledReason:
      "P106.2 records local approval-request rows only. It cannot submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Request Boundary",
    evidenceRefs: [
      "reports/p1062-founder-live-approval-request-model-report.md",
      ...(review.evidenceRefs || []),
    ],
    activityLocation: review.activityLocation || "reports/os-phase-status-report.md",
    costImpact: review.costImpact || "Local approval-request record only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    approvalRequestSubmitted: false,
    approvalSubmitted: false,
    approvalCaptured: false,
    approvalPersisted: false,
    approvalRequestSubmissionAllowed: false,
    approvalRequestCaptureAllowed: false,
    approvalRequestPersistenceAllowed: false,
    approvalRequestWriteAllowed: false,
    approvalRequestCanUnlockExecution: false,
    approvalRequestRuntimeAdmissionAllowed: false,
    approvalRequestDispatchAllowed: false,
    approvalRequestWorkerExecutionAllowed: false,
    approvalRequestToolExecutionAllowed: false,
    approvalRequestProjectMutationAllowed: false,
    approvalRequestHostedDbMutationAllowed: false,
    approvalRequestDeployAllowed: false,
    approvalRequestSpendAllowed: false,
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

export function buildFounderLiveApprovalRequestModel(input = {}) {
  const boundaryEnvelope = input.boundaryEnvelope || buildFounderLiveApprovalRequestBoundarySchema();
  const reviewPacketEnvelope = input.reviewPacketEnvelope || buildFounderLiveExecutionApprovalReviewPacket(input);
  const boundaryData = boundaryEnvelope.data || {};
  const reviewPacketData = reviewPacketEnvelope.data || {};
  const approvalRequestRecords = (reviewPacketData.reviewPacketRows || []).map(buildApprovalRequestRecord);
  const approvalRequestReady = approvalRequestRecords.length > 0;

  return createPassResult({
    phase: P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE,
    mode: "founder-live-approval-request-local-model",
    source: "live-ready/founderLiveApprovalRequestModel.js",
    summary: "Founder live approval request records are assembled locally from P105 review packets; request submission and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: approvalRequestReady
        ? P106_APPROVAL_REQUEST_MODEL_STATES.LOCAL_REQUEST_RECORDS_READY_EXECUTION_BLOCKED
        : P106_APPROVAL_REQUEST_MODEL_STATES.NEEDS_REVIEW_PACKET_ROWS,
      sourceBoundaryPhase: boundaryEnvelope.phase,
      sourceBoundaryState: boundaryData.currentState,
      sourceReviewPacketPhase: reviewPacketEnvelope.phase,
      sourceReviewPacketState: reviewPacketData.currentState,
      founderContextSummary: reviewPacketData.founderContextSummary,
      approvalRequestReadiness: {
        approvalRequestReady,
        approvalRequestRecordCount: approvalRequestRecords.length,
        blockedApprovalRequestCount: approvalRequestRecords.length,
        submittedApprovalRequestCount: 0,
        capturedApprovalRequestCount: 0,
        persistedApprovalRequestCount: 0,
        approvalRequestUnlockCount: 0,
        runtimeAdmissionRequestCount: 0,
        executableApprovalRequestCount: 0,
        dispatchableApprovalRequestCount: 0,
        projectMutationApprovalRequestCount: 0,
        hostedDbMutationApprovalRequestCount: 0,
        providerSpendApprovalRequestCount: 0,
      },
      approvalRequestRecords,
      requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
      forbiddenActions: [...P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS],
      nextAction: approvalRequestReady
        ? "Build P106.3 approval request queue preview without writable approvals or runtime actions."
        : "Complete P105 review packet rows before approval request modeling.",
      blockers: [
        "Approval request submission remains blocked.",
        "Approval capture remains blocked.",
        "Approval persistence remains blocked.",
        "Approval request writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P106.2 is a local approval-request model only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Request Boundary",
      evidenceRefs: [
        "reports/p1062-founder-live-approval-request-model-report.md",
        ...(boundaryData.evidenceRefs || []),
        ...(reviewPacketData.evidenceRefs || []),
      ],
      activityLocation: boundaryData.activityLocation || reviewPacketData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic approval-request model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      approvalRequestSubmitted: false,
      approvalSubmitted: false,
      approvalCaptured: false,
      approvalPersisted: false,
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
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1062-founder-live-approval-request-model-report.md",
      "reports/p1061-founder-live-approval-request-boundary-contract-report.md",
      "reports/p1053-founder-live-execution-approval-review-packet-report.md",
      "contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json",
    ],
    warnings: [
      "P106.2 does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalRequestModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE) errors.push("phase must be P106.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceBoundaryPhase",
    "sourceReviewPacketPhase",
    "founderContextSummary",
    "approvalRequestReadiness",
    "approvalRequestRecords",
    "requiredEvidence",
    "forbiddenActions",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.approvalRequestRecords) || data.approvalRequestRecords.length < 5) errors.push("approvalRequestRecords must cover review packet rows");
  for (const countField of [
    "submittedApprovalRequestCount",
    "capturedApprovalRequestCount",
    "persistedApprovalRequestCount",
    "approvalRequestUnlockCount",
    "runtimeAdmissionRequestCount",
    "executableApprovalRequestCount",
    "dispatchableApprovalRequestCount",
    "projectMutationApprovalRequestCount",
    "hostedDbMutationApprovalRequestCount",
    "providerSpendApprovalRequestCount",
  ]) {
    if (data.approvalRequestReadiness?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of ["approvalRequestSubmitted", "approvalSubmitted", "approvalCaptured", "approvalPersisted", "approvalRequestSubmissionAllowed", "approvalRequestCaptureAllowed", "approvalRequestPersistenceAllowed", "approvalRequestWriteAllowed", "approvalRequestCanUnlockExecution", "approvalRequestRuntimeAdmissionAllowed", "approvalCanUnlockExecution", "approvalWriteAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const record of data.approvalRequestRecords || []) {
    for (const field of ["approvalRequestKey", "displayLabel", "sourceReviewLabel", "sourceBoundaryLabel", "proposedAgentLane", "requestState", "requiredEvidence", "missingEvidence", "evidenceSummary", "founderDecisionPrompt", "operatorDecisionPrompt", "decisionOptions", "validationCommands", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in record)) errors.push(`${record.displayLabel || "record"}.${field} missing`);
    }
    if (record.evidenceSummary?.approvalRequestSubmitted !== false) errors.push(`${record.displayLabel}.evidenceSummary.approvalRequestSubmitted must be false`);
    if (record.evidenceSummary?.approvalCaptured !== false) errors.push(`${record.displayLabel}.evidenceSummary.approvalCaptured must be false`);
    if (record.evidenceSummary?.approvalPersisted !== false) errors.push(`${record.displayLabel}.evidenceSummary.approvalPersisted must be false`);
    if (record.evidenceSummary?.executionUnlockAllowed !== false) errors.push(`${record.displayLabel}.evidenceSummary.executionUnlockAllowed must be false`);
    if (record.evidenceSummary?.runtimeAdmissionAllowed !== false) errors.push(`${record.displayLabel}.evidenceSummary.runtimeAdmissionAllowed must be false`);
    for (const flag of ["approvalRequestSubmitted", "approvalSubmitted", "approvalCaptured", "approvalPersisted", "approvalRequestSubmissionAllowed", "approvalRequestCaptureAllowed", "approvalRequestPersistenceAllowed", "approvalRequestWriteAllowed", "approvalRequestCanUnlockExecution", "approvalRequestRuntimeAdmissionAllowed", "approvalRequestDispatchAllowed", "approvalRequestWorkerExecutionAllowed", "approvalRequestToolExecutionAllowed", "approvalRequestProjectMutationAllowed", "approvalRequestHostedDbMutationAllowed", "approvalRequestDeployAllowed", "approvalRequestSpendAllowed", "approvalWriteAllowed", "executionUnlockAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
      if (record[flag] !== false) errors.push(`${record.displayLabel}.${flag} must be false`);
    }
    for (const flag of P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS) {
      if (record[flag] !== false) errors.push(`${record.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey)/.test(serialized)) errors.push("model must not expose raw approval packet keys");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("model must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
