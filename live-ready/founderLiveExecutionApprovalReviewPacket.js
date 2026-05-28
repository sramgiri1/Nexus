import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveExecutionApprovalPlanModel } from "./founderLiveExecutionApprovalPlanModel.js";
import {
  P105_EXECUTION_APPROVAL_BLOCKED_FLAGS,
  P105_EXECUTION_APPROVAL_REQUIRED_GATES,
} from "./founderLiveExecutionApprovalPlanning.js";

export const P105_FOUNDER_LIVE_EXECUTION_APPROVAL_REVIEW_PACKET_PHASE = "P105.3";

export const P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES = Object.freeze({
  DRY_RUN_PACKET_READY_EXECUTION_BLOCKED: "founder_live_execution_approval_review_packet_ready_execution_blocked",
  NEEDS_APPROVAL_PLAN_ROWS: "founder_live_execution_approval_review_packet_needs_approval_plan_rows",
});

function blockedFlags() {
  return Object.fromEntries(P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function packetRowIdFor(plan = {}, index = 0) {
  const base = plan.approvalPlanId || plan.displayLabel || `review-packet-${index + 1}`;
  return `review-packet-${String(base).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildReviewPacketRow(plan = {}, index = 0) {
  const missingGates = Array.isArray(plan.missingGates) ? plan.missingGates : [];
  return {
    reviewPacketId: packetRowIdFor(plan, index),
    displayLabel: plan.displayLabel || `Approval Review ${index + 1}`,
    sourceApprovalPlanKey: plan.approvalPlanId || `approval-plan-${index + 1}`,
    sourceBoundaryKey: plan.sourceBoundaryKey || `boundary-${index + 1}`,
    sourceWorkOrderLabel: plan.sourceWorkOrderLabel || plan.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: plan.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: plan.proposedOutcome || "Prepare governed work for later approval review.",
    packetState: P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES.DRY_RUN_PACKET_READY_EXECUTION_BLOCKED,
    requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
    missingGates,
    gateSummary: {
      requiredGateCount: P105_EXECUTION_APPROVAL_REQUIRED_GATES.length,
      missingGateCount: missingGates.length,
      readyGateCount: Math.max(P105_EXECUTION_APPROVAL_REQUIRED_GATES.length - missingGates.length, 0),
      approvalCaptured: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    reviewQuestions: plan.reviewQuestions || [],
    validationCommands: [
      "npm run check:p1053-founder-live-execution-approval-review-packet",
      ...(plan.validationCommands || []),
    ],
    nextAction: "Review unresolved gates locally before any later phase can add non-runnable Command Center visibility.",
    blockers: [
      "This review packet is dry-run only.",
      "Approval submission is not available.",
      "Approval writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(plan.blockers || []),
    ],
    disabledReason:
      "P105.3 creates local dry-run review packets only. It cannot submit approvals, write approval state, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Execution Approval Planning",
    evidenceRefs: [
      "reports/p1053-founder-live-execution-approval-review-packet-report.md",
      ...(plan.evidenceRefs || []),
    ],
    activityLocation: plan.activityLocation || "reports/os-phase-status-report.md",
    costImpact: plan.costImpact || "Local dry-run review packet only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    approvalSubmitted: false,
    approvalCaptured: false,
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

export function buildFounderLiveExecutionApprovalReviewPacket(input = {}) {
  const approvalPlanEnvelope = input.approvalPlanEnvelope || buildFounderLiveExecutionApprovalPlanModel(input);
  const approvalPlanData = approvalPlanEnvelope.data || {};
  const reviewPacketRows = (approvalPlanData.approvalPlanRows || []).map(buildReviewPacketRow);
  const reviewPacketReady = reviewPacketRows.length > 0;

  return createPassResult({
    phase: P105_FOUNDER_LIVE_EXECUTION_APPROVAL_REVIEW_PACKET_PHASE,
    mode: "founder-live-execution-approval-review-packet-dry-run",
    source: "live-ready/founderLiveExecutionApprovalReviewPacket.js",
    summary: "Founder live execution approval review packets are assembled locally from P105 approval-plan rows; approval submission and execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: reviewPacketReady
        ? P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES.DRY_RUN_PACKET_READY_EXECUTION_BLOCKED
        : P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES.NEEDS_APPROVAL_PLAN_ROWS,
      sourceApprovalPlanPhase: approvalPlanEnvelope.phase,
      sourceApprovalPlanState: approvalPlanData.currentState,
      founderContextSummary: approvalPlanData.founderContextSummary,
      reviewPacketReadiness: {
        reviewPacketReady,
        reviewPacketRowCount: reviewPacketRows.length,
        blockedReviewPacketCount: reviewPacketRows.length,
        submittedApprovalCount: 0,
        capturedApprovalCount: 0,
        approvalUnlockCount: 0,
        runtimeAdmissionCount: 0,
        executableReviewPacketCount: 0,
        dispatchableReviewPacketCount: 0,
        projectMutationReviewPacketCount: 0,
        hostedDbMutationReviewPacketCount: 0,
      },
      reviewPacketRows,
      requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
      nextAction: reviewPacketReady
        ? "Render P105.4 dry-run approval review visibility on non-chat Command Center pages without approval controls."
        : "Complete P105.2 approval-plan rows before review packet assembly.",
      blockers: [
        "Approval submission remains blocked.",
        "Approval capture remains blocked.",
        "Approval writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P105.3 is a local dry-run review packet only. It does not submit approvals, capture approvals, write approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Execution Approval Planning",
      evidenceRefs: [
        "reports/p1053-founder-live-execution-approval-review-packet-report.md",
        ...(approvalPlanData.evidenceRefs || []),
      ],
      activityLocation: approvalPlanData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic dry-run review packet only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      approvalSubmitted: false,
      approvalCaptured: false,
      approvalWriteAllowed: false,
      approvalCanUnlockExecution: false,
      runtimeAdmissionAllowed: false,
      runtimeTransitionAllowed: false,
      liveModeEscalationAllowed: false,
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
      "reports/p1053-founder-live-execution-approval-review-packet-report.md",
      "reports/p1052-founder-live-execution-approval-plan-model-report.md",
      "contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json",
    ],
    warnings: [
      "P105.3 does not submit approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveExecutionApprovalReviewPacket(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P105_FOUNDER_LIVE_EXECUTION_APPROVAL_REVIEW_PACKET_PHASE) errors.push("phase must be P105.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceApprovalPlanPhase",
    "founderContextSummary",
    "reviewPacketReadiness",
    "reviewPacketRows",
    "requiredGates",
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
  if (!Array.isArray(data.reviewPacketRows) || data.reviewPacketRows.length < 5) errors.push("reviewPacketRows must cover approval plan rows");
  for (const countField of [
    "submittedApprovalCount",
    "capturedApprovalCount",
    "approvalUnlockCount",
    "runtimeAdmissionCount",
    "executableReviewPacketCount",
    "dispatchableReviewPacketCount",
    "projectMutationReviewPacketCount",
    "hostedDbMutationReviewPacketCount",
  ]) {
    if (data.reviewPacketReadiness?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of ["approvalSubmitted", "approvalCaptured", "approvalWriteAllowed", "approvalCanUnlockExecution", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of P105_EXECUTION_APPROVAL_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.reviewPacketRows || []) {
    for (const field of ["reviewPacketId", "displayLabel", "sourceApprovalPlanKey", "sourceBoundaryKey", "proposedAgentLane", "packetState", "requiredGates", "missingGates", "gateSummary", "reviewQuestions", "validationCommands", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.gateSummary?.approvalCaptured !== false) errors.push(`${row.displayLabel}.gateSummary.approvalCaptured must be false`);
    if (row.gateSummary?.executionUnlockAllowed !== false) errors.push(`${row.displayLabel}.gateSummary.executionUnlockAllowed must be false`);
    if (row.gateSummary?.runtimeAdmissionAllowed !== false) errors.push(`${row.displayLabel}.gateSummary.runtimeAdmissionAllowed must be false`);
    for (const flag of ["approvalSubmitted", "approvalCaptured", "approvalWriteAllowed", "executionUnlockAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of P105_EXECUTION_APPROVAL_BLOCKED_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("review packet must not expose raw private IDs");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("review packet must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("review packet must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
