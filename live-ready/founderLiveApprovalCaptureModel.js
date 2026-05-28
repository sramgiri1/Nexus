import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveApprovalRequestQueuePreview } from "./founderLiveApprovalRequestQueuePreview.js";
import {
  P107_APPROVAL_CAPTURE_BLOCKED_FLAGS,
  P107_APPROVAL_CAPTURE_BOUNDARY_STATES,
  P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS,
  P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE,
  buildFounderLiveApprovalCaptureBoundarySchema,
} from "./founderLiveApprovalCaptureBoundary.js";

export const P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE = "P107.2";

export const P107_APPROVAL_CAPTURE_MODEL_STATES = Object.freeze({
  CAPTURE_RECORDS_READY_EXECUTION_BLOCKED: "founder_live_approval_capture_records_ready_execution_blocked",
  NEEDS_CAPTURE_BOUNDARY: "founder_live_approval_capture_model_needs_capture_boundary",
});

function blockedFlags() {
  return Object.fromEntries(P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function slugFor(value = "", fallback = "approval-capture") {
  const slug = String(value || fallback)
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function captureRecordKeyFor(row = {}, index = 0) {
  return `approval-capture-record-${index + 1}-${slugFor(row.displayLabel, "item")}`;
}

function buildCaptureRecord(row = {}, index = 0) {
  return {
    approvalCaptureRecordKey: captureRecordKeyFor(row, index),
    displayLabel: `${row.displayLabel || `Approval Request ${index + 1}`} capture review`,
    sourceQueueLabel: row.displayLabel || `Approval Queue Item ${index + 1}`,
    sourceBoundaryLabel: row.sourceBoundaryLabel || row.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: row.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: row.proposedOutcome || "Prepare governed work for later approval capture review.",
    captureState: P107_APPROVAL_CAPTURE_MODEL_STATES.CAPTURE_RECORDS_READY_EXECUTION_BLOCKED,
    sourceQueueState: row.queueState,
    queuePosition: row.queuePosition || index + 1,
    localCaptureReviewReady: true,
    approvalDecisionPrompt: row.founderDecisionPrompt || "Approval capture is not available in P107.2.",
    operatorDecisionPrompt: row.operatorDecisionPrompt || "Operator approval capture is not available in P107.2.",
    decisionOptions: ["not_available_in_p107_2"],
    requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    missingEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    evidenceSummary: {
      requiredEvidenceCount: P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length,
      readyEvidenceCount: 0,
      approvalCaptured: false,
      approvalPersisted: false,
      captureWriteAllowed: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    validationCommands: ["npm run check:p1072-founder-live-approval-capture-model"],
    nextAction: "Keep this as a local capture-review record until a later explicit phase defines preview/audit behavior without capture controls.",
    blockers: [
      "Capture review record is local and read-only.",
      "Approval capture is not available.",
      "Approval persistence is not available.",
      "Approval capture writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(row.blockers || []),
    ],
    disabledReason:
      "P107.2 builds local approval capture review records only. It cannot capture approvals, persist approval state, write approval decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
    evidenceRefs: [
      "reports/p1072-founder-live-approval-capture-model-report.md",
      ...(row.evidenceRefs || []),
    ],
    activityLocation: row.activityLocation || "reports/os-phase-status-report.md",
    costImpact: row.costImpact || "Local approval capture model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    approvalCaptured: false,
    approvalPersisted: false,
    approvalDecisionCaptureAllowed: false,
    approvalDecisionPersistenceAllowed: false,
    approvalCaptureWriteAllowed: false,
    approvalCaptureCanUnlockExecution: false,
    approvalCaptureRuntimeAdmissionAllowed: false,
    approvalCaptureDispatchAllowed: false,
    approvalCaptureWorkerExecutionAllowed: false,
    approvalCaptureToolExecutionAllowed: false,
    approvalCaptureProjectMutationAllowed: false,
    approvalCaptureHostedDbMutationAllowed: false,
    approvalCaptureDeployAllowed: false,
    approvalCaptureSpendAllowed: false,
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

export function buildFounderLiveApprovalCaptureModel(input = {}) {
  const captureBoundaryEnvelope = input.captureBoundaryEnvelope || buildFounderLiveApprovalCaptureBoundarySchema(input);
  const captureBoundaryData = captureBoundaryEnvelope.data || {};
  const queuePreviewEnvelope = input.queuePreviewEnvelope || buildFounderLiveApprovalRequestQueuePreview(input);
  const queuePreviewData = queuePreviewEnvelope.data || {};
  const queueRows = queuePreviewData.queueRows || [];
  const approvalCaptureRecords = queueRows.map(buildCaptureRecord);
  const captureRecordCount = approvalCaptureRecords.length;
  const captureReady = captureBoundaryData.currentState === P107_APPROVAL_CAPTURE_BOUNDARY_STATES.CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED && captureRecordCount > 0;

  return createPassResult({
    phase: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE,
    mode: "founder-live-approval-capture-model",
    source: "live-ready/founderLiveApprovalCaptureModel.js",
    summary: "Founder live approval capture review records are assembled locally; capture, persistence, writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: captureReady
        ? P107_APPROVAL_CAPTURE_MODEL_STATES.CAPTURE_RECORDS_READY_EXECUTION_BLOCKED
        : P107_APPROVAL_CAPTURE_MODEL_STATES.NEEDS_CAPTURE_BOUNDARY,
      sourceCaptureBoundaryPhase: captureBoundaryEnvelope.phase,
      sourceCaptureBoundaryState: captureBoundaryData.currentState,
      sourceQueuePreviewPhase: queuePreviewEnvelope.phase,
      sourceQueuePreviewState: queuePreviewData.currentState,
      founderContextSummary: queuePreviewData.founderContextSummary || captureBoundaryData.founderContextSummary,
      approvalCaptureReadiness: {
        captureReady,
        captureRecordCount,
        blockedCaptureRecordCount: captureRecordCount,
        capturedDecisionCount: 0,
        persistedDecisionCount: 0,
        writableDecisionCount: 0,
        approvalCaptureWriteCount: 0,
        approvalCaptureUnlockCount: 0,
        runtimeAdmissionCaptureCount: 0,
        executableCaptureRecordCount: 0,
        dispatchableCaptureRecordCount: 0,
        projectMutationCaptureRecordCount: 0,
        hostedDbMutationCaptureRecordCount: 0,
        providerSpendCaptureRecordCount: 0,
      },
      approvalCaptureRecords,
      requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
      forbiddenActions: [...P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS],
      nextAction: captureReady
        ? "Use these local records to build P107.3 capture audit preview without capture, persistence, writes, or execution authority."
        : "Complete P107.1 approval capture boundary and P106 queue preview before capture record construction.",
      blockers: [
        "Capture review records are local and read-only.",
        "Approval capture remains blocked.",
        "Approval persistence remains blocked.",
        "Approval capture writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P107.2 is a local approval capture model only. It does not capture approvals, persist approval state, write approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
      evidenceRefs: [
        "reports/p1072-founder-live-approval-capture-model-report.md",
        ...(captureBoundaryData.evidenceRefs || []),
      ],
      activityLocation: captureBoundaryData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic approval-capture model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1072-founder-live-approval-capture-model-report.md",
      "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
      "contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json",
    ],
    warnings: [
      "P107.2 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalCaptureModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE) errors.push("phase must be P107.2");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P107_APPROVAL_CAPTURE_MODEL_STATES).includes(data.currentState)) errors.push("currentState must be a P107 approval capture model state");
  if (!data.approvalCaptureReadiness) errors.push("approvalCaptureReadiness is required");
  if (!Array.isArray(data.approvalCaptureRecords) || data.approvalCaptureRecords.length === 0) errors.push("approvalCaptureRecords are required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 24) errors.push("requiredEvidence must include P107 capture evidence");
  for (const flag of P107_APPROVAL_CAPTURE_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const record of data.approvalCaptureRecords || []) {
      if (record[flag] !== false) errors.push(`approvalCaptureRecords.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P107.2");
  return { valid: errors.length === 0, errors };
}
