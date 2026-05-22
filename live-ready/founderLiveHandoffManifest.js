import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P101_LIVE_USE_SAFETY_FLAGS,
  buildFounderLiveUseReadiness,
} from "./founderLiveUseReadiness.js";
import { buildFounderLiveUseReviewPacket } from "./founderLiveUseReviewPacket.js";

export const P102_FOUNDER_LIVE_HANDOFF_PHASE = "P102.2";

export const P102_HANDOFF_STATES = Object.freeze({
  LOCAL_MANIFEST_READY_EXECUTION_BLOCKED: "founder_live_handoff_manifest_ready_execution_blocked",
  NEEDS_FOUNDER_REVIEW_CONTEXT: "founder_live_handoff_needs_founder_review_context",
  BLOCKED_BY_SAFETY: "founder_live_handoff_blocked_by_safety",
});

export const P102_HANDOFF_SAFETY_FLAGS = Object.freeze([
  ...P101_LIVE_USE_SAFETY_FLAGS,
  "agentWorkOrderCreationAllowed",
  "agentWorkOrderDispatchAllowed",
  "prdGenerationExecutionAllowed",
  "businessBuildExecutionAllowed",
]);

function blockedSafetyFlags() {
  return Object.fromEntries(P102_HANDOFF_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function humanize(value = "") {
  return String(value || "not_ready")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildFounderContextSummary(input = {}, reviewData = {}) {
  const founderIdea = String(input.founderIdea || input.idea || "Founder idea captured locally for governed review.").trim();
  return {
    founderIdea,
    understoodEnoughForReview: reviewData.ready === true,
    qnaState: "local-founder-review-context",
    prdState: reviewData.checklist?.some((item) => item.key === "founder-context" && item.complete)
      ? "local-prd-reviewable"
      : "local-prd-needs-founder-context",
    nextQuestion: reviewData.ready
      ? "Confirm the first governed workstream priority before any later execution phase."
      : "Clarify the target customer, problem, business model, and launch platform before handoff review.",
  };
}

function buildApprovalBoundary() {
  return {
    approvalState: "execution_not_requested",
    operatorApprovalRequired: true,
    rollbackApprovalRequired: true,
    auditApprovalRequired: true,
    validationApprovalRequired: true,
    costApprovalRequired: true,
    providerApprovalRequired: true,
    dispatchApprovalRequired: true,
    projectMutationApprovalRequired: true,
    disabledReason:
      "P102.2 prepares a local handoff manifest only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and provider spend remain blocked.",
    ...blockedSafetyFlags(),
  };
}

function buildHandoffLane(lane = {}, index = 0) {
  return {
    laneKey: lane.laneKey || `handoff-lane-${index + 1}`,
    label: lane.label || `Handoff Lane ${index + 1}`,
    handoffState: lane.reviewState === "ready_for_founder_review"
      ? "ready_for_governed_handoff_review"
      : "needs_context_or_evidence",
    currentState: lane.currentState || "Not Ready",
    ownerCapability: lane.ownerCapability || "NEXUS Founder Live Handoff Governance",
    agentWorkAllowed: false,
    dispatchAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    prdGenerationExecutionAllowed: false,
    nextAction: lane.reviewState === "ready_for_founder_review"
      ? `Prepare a governed local work-order dry run for ${lane.label || "this lane"} in P102.3.`
      : lane.nextAction || "Collect founder context before local handoff review.",
    blocker: lane.blocker || "Execution remains blocked by the P102 safety contract.",
    disabledReason: lane.disabledReason || buildApprovalBoundary().disabledReason,
    evidenceRefs: lane.evidenceRefs || [],
    activityLocation: lane.activityLocation || "reports/os-phase-status-report.md",
    costImpact: lane.costImpact || "Local handoff manifest only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedSafetyFlags(),
  };
}

export function buildFounderLiveHandoffManifest(input = {}) {
  const readinessEnvelope = input.readinessEnvelope || buildFounderLiveUseReadiness(input);
  const reviewEnvelope = input.reviewEnvelope || buildFounderLiveUseReviewPacket({
    ...input,
    readinessEnvelope,
  });
  const reviewData = reviewEnvelope.data || {};
  const handoffLanes = (reviewData.laneReviews || []).map(buildHandoffLane);
  const readyLaneCount = handoffLanes.filter((lane) => lane.handoffState === "ready_for_governed_handoff_review").length;
  const manifestReady = reviewData.ready === true && readyLaneCount === handoffLanes.length;
  const laneBlockers = handoffLanes
    .filter((lane) => lane.handoffState !== "ready_for_governed_handoff_review")
    .map((lane) => `${lane.label}: ${lane.blocker}`);
  const blockers = [
    ...laneBlockers,
    "Provider/model calls remain blocked.",
    "Agent dispatch remains blocked.",
    "Worker/tool execution remains blocked.",
    "Project mutation remains blocked.",
    "Hosted DB mutation remains blocked.",
    "Provider spend remains blocked.",
  ];

  return createPassResult({
    phase: P102_FOUNDER_LIVE_HANDOFF_PHASE,
    mode: "founder-live-handoff-local-manifest",
    source: "live-ready/founderLiveHandoffManifest.js",
    summary: "Founder live handoff manifest is assembled locally from P101 readiness and review evidence; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: manifestReady
        ? P102_HANDOFF_STATES.LOCAL_MANIFEST_READY_EXECUTION_BLOCKED
        : P102_HANDOFF_STATES.NEEDS_FOUNDER_REVIEW_CONTEXT,
      founderContextSummary: buildFounderContextSummary(input, reviewData),
      prdReadiness: {
        readyForReview: reviewData.checklist?.some((item) => item.key === "founder-context" && item.complete) === true,
        sourceReviewPhase: reviewEnvelope.phase,
        sourceReadinessPhase: readinessEnvelope.phase,
      },
      handoffReadiness: {
        manifestReady,
        readyLaneCount,
        totalLaneCount: handoffLanes.length,
        executableLaneCount: 0,
        dispatchableLaneCount: 0,
        projectMutationLaneCount: 0,
        workOrderDryRunCount: 0,
      },
      handoffLanes,
      approvalBoundary: buildApprovalBoundary(),
      nextAction: manifestReady
        ? "Build P102.3 governed work-order dry-run rows without dispatching agents or mutating projects."
        : laneBlockers[0] || "Collect founder context before work-order dry-run planning.",
      blockers,
      disabledReason:
        "P102.2 is a local handoff manifest only. Provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Handoff Governance",
      evidenceRefs: [
        "reports/p1022-founder-live-handoff-manifest-report.md",
        ...(reviewData.evidenceRefs || []),
      ],
      activityLocation: reviewData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic handoff manifest only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1022-founder-live-handoff-manifest-report.md",
      "reports/p1013-founder-live-use-review-packet-report.md",
      "contracts/os-roadmap/p102-founder-live-handoff-contracts.json",
    ],
    warnings: [
      "P102.2 does not dispatch agents, create live work orders, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveHandoffManifest(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P102_FOUNDER_LIVE_HANDOFF_PHASE) errors.push("phase must be P102.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "founderContextSummary",
    "prdReadiness",
    "handoffReadiness",
    "handoffLanes",
    "approvalBoundary",
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
  if (!Array.isArray(data.handoffLanes) || data.handoffLanes.length < 5) errors.push("handoffLanes must cover founder review lanes");
  if (data.handoffReadiness?.executableLaneCount !== 0) errors.push("executableLaneCount must be 0");
  if (data.handoffReadiness?.dispatchableLaneCount !== 0) errors.push("dispatchableLaneCount must be 0");
  if (data.handoffReadiness?.projectMutationLaneCount !== 0) errors.push("projectMutationLaneCount must be 0");
  if (data.handoffReadiness?.workOrderDryRunCount !== 0) errors.push("workOrderDryRunCount must be 0 in P102.2");
  for (const lane of data.handoffLanes || []) {
    for (const field of ["laneKey", "label", "handoffState", "currentState", "ownerCapability", "nextAction", "blocker", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.agentWorkAllowed !== false) errors.push(`${lane.label}.agentWorkAllowed must be false`);
    if (lane.dispatchAllowed !== false) errors.push(`${lane.label}.dispatchAllowed must be false`);
    if (lane.toolExecutionAllowed !== false) errors.push(`${lane.label}.toolExecutionAllowed must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.label}.projectMutationAllowed must be false`);
    for (const flag of P102_HANDOFF_SAFETY_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  for (const flag of P102_HANDOFF_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.approvalBoundary?.[flag] !== false) errors.push(`approvalBoundary.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("manifest must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("manifest must not expose fake unsafe runnable actions");
  if (/raw json|raw logs|raw policy dump/i.test(serialized)) errors.push("manifest must not expose raw dumps");
  if (String(humanize(data.currentState)).length === 0) errors.push("currentState must be displayable");
  return { valid: errors.length === 0, errors };
}
