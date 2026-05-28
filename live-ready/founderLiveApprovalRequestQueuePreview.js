import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS,
  P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS,
  P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalRequestBoundary.js";
import { buildFounderLiveApprovalRequestModel } from "./founderLiveApprovalRequestModel.js";

export const P106_FOUNDER_LIVE_APPROVAL_REQUEST_QUEUE_PREVIEW_PHASE = "P106.3";

export const P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES = Object.freeze({
  LOCAL_QUEUE_READY_EXECUTION_BLOCKED: "founder_live_approval_request_queue_ready_execution_blocked",
  NEEDS_APPROVAL_REQUEST_RECORDS: "founder_live_approval_request_queue_needs_request_records",
});

function blockedFlags() {
  return Object.fromEntries(P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function slugFor(value = "", fallback = "approval-request-queue") {
  const slug = String(value || fallback)
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function queueItemKeyFor(record = {}, index = 0) {
  return `approval-request-queue-${index + 1}-${slugFor(record.displayLabel, "item")}`;
}

function buildQueueRow(record = {}, index = 0) {
  const missingEvidence = Array.isArray(record.missingEvidence) ? record.missingEvidence : [];
  return {
    queueItemKey: queueItemKeyFor(record, index),
    displayLabel: record.displayLabel || `Approval Queue Item ${index + 1}`,
    sourceRequestLabel: record.displayLabel || `Approval Request ${index + 1}`,
    sourceBoundaryLabel: record.sourceBoundaryLabel || record.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: record.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: record.proposedOutcome || "Prepare governed work for later approval queue review.",
    queuePosition: index + 1,
    queueState: P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES.LOCAL_QUEUE_READY_EXECUTION_BLOCKED,
    requestState: record.requestState,
    localReviewReady: true,
    evidenceStatus: {
      requiredEvidenceCount: P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: missingEvidence.length,
      readyEvidenceCount: Math.max(P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length - missingEvidence.length, 0),
      approvalRequestSubmitted: false,
      approvalCaptured: false,
      approvalPersisted: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
    missingEvidence,
    founderDecisionPrompt: record.founderDecisionPrompt,
    operatorDecisionPrompt: record.operatorDecisionPrompt,
    nextAction: "Keep this request in the local preview queue until a later explicit UX phase renders it without approval controls.",
    blockers: [
      "Queue preview is local and read-only.",
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
      ...(record.blockers || []),
    ],
    disabledReason:
      "P106.3 builds a local approval request queue preview only. It cannot submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Request Boundary",
    evidenceRefs: [
      "reports/p1063-founder-live-approval-request-queue-preview-report.md",
      ...(record.evidenceRefs || []),
    ],
    activityLocation: record.activityLocation || "reports/os-phase-status-report.md",
    costImpact: record.costImpact || "Local approval-request queue preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
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

function buildQueueSections(queueRows = []) {
  return [
    {
      sectionKey: "local-review-ready-execution-blocked",
      displayLabel: "Local review ready",
      queuedCount: queueRows.length,
      blockedCount: queueRows.length,
      nextAction: "Render this section in P106.4 without approval controls, execution controls, raw IDs, logs, or policy dumps.",
      disabledReason: "This queue section is read-only and cannot submit, capture, persist, or unlock approval requests.",
    },
  ];
}

export function buildFounderLiveApprovalRequestQueuePreview(input = {}) {
  const requestModelEnvelope = input.requestModelEnvelope || buildFounderLiveApprovalRequestModel(input);
  const requestModelData = requestModelEnvelope.data || {};
  const queueRows = (requestModelData.approvalRequestRecords || []).map(buildQueueRow);
  const queueReady = queueRows.length > 0;
  const queueSections = buildQueueSections(queueRows);

  return createPassResult({
    phase: P106_FOUNDER_LIVE_APPROVAL_REQUEST_QUEUE_PREVIEW_PHASE,
    mode: "founder-live-approval-request-queue-preview",
    source: "live-ready/founderLiveApprovalRequestQueuePreview.js",
    summary: "Founder live approval request queue preview is assembled locally from P106.2 request records; writable approvals and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: queueReady
        ? P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES.LOCAL_QUEUE_READY_EXECUTION_BLOCKED
        : P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES.NEEDS_APPROVAL_REQUEST_RECORDS,
      sourceRequestModelPhase: requestModelEnvelope.phase,
      sourceRequestModelState: requestModelData.currentState,
      founderContextSummary: requestModelData.founderContextSummary,
      approvalRequestQueueSummary: {
        queueReady,
        queuedRequestCount: queueRows.length,
        blockedQueuedRequestCount: queueRows.length,
        submittableQueuedRequestCount: 0,
        capturableQueuedRequestCount: 0,
        persistedQueuedRequestCount: 0,
        writableQueuedRequestCount: 0,
        executableQueuedRequestCount: 0,
        dispatchableQueuedRequestCount: 0,
        projectMutationQueuedRequestCount: 0,
        hostedDbMutationQueuedRequestCount: 0,
        providerSpendQueuedRequestCount: 0,
      },
      queueSections,
      queueRows,
      requiredEvidence: [...P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE],
      forbiddenActions: [...P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS],
      nextAction: queueReady
        ? "Render P106.4 Command Center approval request queue visibility on non-chat founder pages without approval or execution controls."
        : "Complete P106.2 approval request records before queue preview assembly.",
      blockers: [
        "Queue preview is local and read-only.",
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
        "P106.3 is a local approval request queue preview only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Request Boundary",
      evidenceRefs: [
        "reports/p1063-founder-live-approval-request-queue-preview-report.md",
        ...(requestModelData.evidenceRefs || []),
      ],
      activityLocation: requestModelData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic approval-request queue preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
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
      "reports/p1063-founder-live-approval-request-queue-preview-report.md",
      "reports/p1062-founder-live-approval-request-model-report.md",
      "reports/p1061-founder-live-approval-request-boundary-contract-report.md",
      "contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json",
    ],
    warnings: [
      "P106.3 does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalRequestQueuePreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P106_FOUNDER_LIVE_APPROVAL_REQUEST_QUEUE_PREVIEW_PHASE) errors.push("phase must be P106.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceRequestModelPhase",
    "founderContextSummary",
    "approvalRequestQueueSummary",
    "queueSections",
    "queueRows",
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
  if (!Array.isArray(data.queueRows) || data.queueRows.length < 5) errors.push("queueRows must cover approval request records");
  if (!Array.isArray(data.queueSections) || data.queueSections.length < 1) errors.push("queueSections must describe queue display groups");
  for (const countField of [
    "submittableQueuedRequestCount",
    "capturableQueuedRequestCount",
    "persistedQueuedRequestCount",
    "writableQueuedRequestCount",
    "executableQueuedRequestCount",
    "dispatchableQueuedRequestCount",
    "projectMutationQueuedRequestCount",
    "hostedDbMutationQueuedRequestCount",
    "providerSpendQueuedRequestCount",
  ]) {
    if (data.approvalRequestQueueSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of ["approvalRequestSubmitted", "approvalSubmitted", "approvalCaptured", "approvalPersisted", "approvalRequestSubmissionAllowed", "approvalRequestCaptureAllowed", "approvalRequestPersistenceAllowed", "approvalRequestWriteAllowed", "approvalRequestCanUnlockExecution", "approvalRequestRuntimeAdmissionAllowed", "approvalCanUnlockExecution", "approvalWriteAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.queueRows || []) {
    for (const field of ["queueItemKey", "displayLabel", "sourceRequestLabel", "sourceBoundaryLabel", "proposedAgentLane", "queuePosition", "queueState", "evidenceStatus", "requiredEvidence", "missingEvidence", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.evidenceStatus?.approvalRequestSubmitted !== false) errors.push(`${row.displayLabel}.evidenceStatus.approvalRequestSubmitted must be false`);
    if (row.evidenceStatus?.approvalCaptured !== false) errors.push(`${row.displayLabel}.evidenceStatus.approvalCaptured must be false`);
    if (row.evidenceStatus?.approvalPersisted !== false) errors.push(`${row.displayLabel}.evidenceStatus.approvalPersisted must be false`);
    if (row.evidenceStatus?.executionUnlockAllowed !== false) errors.push(`${row.displayLabel}.evidenceStatus.executionUnlockAllowed must be false`);
    if (row.evidenceStatus?.runtimeAdmissionAllowed !== false) errors.push(`${row.displayLabel}.evidenceStatus.runtimeAdmissionAllowed must be false`);
    for (const flag of ["approvalRequestSubmitted", "approvalSubmitted", "approvalCaptured", "approvalPersisted", "approvalRequestSubmissionAllowed", "approvalRequestCaptureAllowed", "approvalRequestPersistenceAllowed", "approvalRequestWriteAllowed", "approvalRequestCanUnlockExecution", "approvalRequestRuntimeAdmissionAllowed", "approvalRequestDispatchAllowed", "approvalRequestWorkerExecutionAllowed", "approvalRequestToolExecutionAllowed", "approvalRequestProjectMutationAllowed", "approvalRequestHostedDbMutationAllowed", "approvalRequestDeployAllowed", "approvalRequestSpendAllowed", "approvalWriteAllowed", "executionUnlockAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("queue preview must not expose raw private IDs");
  if (/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey)/.test(serialized)) errors.push("queue preview must not expose raw approval packet keys");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("queue preview must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("queue preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
