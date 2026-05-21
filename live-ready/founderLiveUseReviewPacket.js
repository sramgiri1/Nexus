import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P101_LIVE_USE_SAFETY_FLAGS,
  buildFounderLiveUseReadiness,
} from "./founderLiveUseReadiness.js";

export const P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE = "P101.3";

function blockedSafetyFlags() {
  return Object.fromEntries(P101_LIVE_USE_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function humanize(value = "") {
  return String(value || "not_ready")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildLaneReview(lane = {}) {
  return {
    laneKey: lane.laneKey,
    label: lane.label,
    currentState: lane.currentState,
    reviewState: lane.readyForFounderReview ? "ready_for_founder_review" : "needs_context_or_evidence",
    ownerCapability: lane.ownerCapability,
    nextAction: lane.nextAction,
    blocker: lane.blocker,
    executable: false,
    dispatchable: false,
    projectMutationAllowed: false,
    disabledReason: lane.disabledReason,
    evidenceRefs: lane.evidenceRefs || [],
    activityLocation: lane.activityLocation,
    costImpact: lane.costImpact,
    ...blockedSafetyFlags(),
  };
}

function buildChecklist(readiness = {}, laneReviews = []) {
  return [
    {
      key: "founder-context",
      label: "Founder context and PRD are reviewable",
      complete: laneReviews.some((lane) => lane.laneKey === "local-prd" && lane.reviewState === "ready_for_founder_review"),
      ownerCapability: "NEXUS Founder PRD Safe Authoring",
      nextAction: "Review the local PRD artifact before execution admission.",
    },
    {
      key: "agent-lanes",
      label: "Agent lanes are mapped without dispatch",
      complete: laneReviews.some((lane) => lane.laneKey === "agent-workstream-plan" && lane.reviewState === "ready_for_founder_review"),
      ownerCapability: "NEXUS Founder Workstream Runtime Governance",
      nextAction: "Review agent lane owners, blockers, and evidence before any later dispatch phase.",
    },
    {
      key: "local-db",
      label: "Local DB readiness is reviewable",
      complete: laneReviews.some((lane) => lane.laneKey === "local-db-readiness" && lane.reviewState === "ready_for_founder_review"),
      ownerCapability: "NEXUS Business Build Local Execution Readiness",
      nextAction: "Keep local DB review separate from hosted DB mutation.",
    },
    {
      key: "execution-blocked",
      label: "Execution authority remains blocked",
      complete: readiness.executableLaneCount === 0
        && readiness.dispatchableLaneCount === 0
        && readiness.projectMutationLaneCount === 0,
      ownerCapability: "NEXUS Safety Governance",
      nextAction: "Do not expose runnable execution controls in Command Center.",
    },
  ];
}

export function buildFounderLiveUseReviewPacket(input = {}) {
  const readinessEnvelope = input.readinessEnvelope || buildFounderLiveUseReadiness(input);
  const readinessData = readinessEnvelope.data || {};
  const laneReviews = (readinessData.liveUseLanes || []).map(buildLaneReview);
  const checklist = buildChecklist(readinessData.founderWorkflowReadiness || {}, laneReviews);
  const readyItemCount = checklist.filter((item) => item.complete).length;
  const laneBlockers = laneReviews
    .filter((lane) => lane.reviewState !== "ready_for_founder_review")
    .map((lane) => `${lane.label}: ${lane.blocker}`);
  const blockers = [
    ...laneBlockers,
    "Provider/model calls remain blocked.",
    "Agent dispatch remains blocked.",
    "Worker/tool execution remains blocked.",
    "Project mutation remains blocked.",
    "Hosted DB mutation remains blocked.",
    "Deploy/release/export/package actions remain blocked.",
    "Provider spend remains blocked.",
  ];
  const ready = readinessData.founderWorkflowReadiness?.localReviewReady === true
    && readyItemCount === checklist.length;

  return createPassResult({
    phase: P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE,
    mode: "founder-live-use-display-safe-review-packet",
    source: "live-ready/founderLiveUseReviewPacket.js",
    summary: "Founder live-use review packet is assembled from local readiness evidence; runtime execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: ready ? "founder_live_use_review_packet_ready_execution_blocked" : "founder_live_use_review_packet_needs_context",
      reviewMode: "display-safe-local-review-only",
      sourceReadinessPhase: readinessEnvelope.phase,
      sourceReadinessState: readinessData.currentState,
      ready,
      readyItemCount,
      totalItemCount: checklist.length,
      laneReviewCount: laneReviews.length,
      executableLaneCount: 0,
      dispatchableLaneCount: 0,
      projectMutationLaneCount: 0,
      blockers,
      checklist,
      laneReviews,
      nextAction: ready
        ? "Render this packet in P101.4 Command Center UX without runnable execution controls."
        : laneBlockers[0] || "Collect founder context before Command Center packet rendering.",
      disabledReason:
        "P101.3 is a display-safe review packet only. Provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Use Review Governance",
      evidenceRefs: [
        "reports/p1013-founder-live-use-review-packet-report.md",
        ...(readinessData.evidenceRefs || []),
      ],
      activityLocation: readinessData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Display-safe local review only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1013-founder-live-use-review-packet-report.md",
      "reports/p1012-founder-live-use-readiness-model-report.md",
      "contracts/os-roadmap/p101-execution-contracts.json",
    ],
    warnings: [
      "P101.3 does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveUseReviewPacket(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE) errors.push("phase must be P101.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "reviewMode",
    "ready",
    "readyItemCount",
    "totalItemCount",
    "blockers",
    "checklist",
    "laneReviews",
    "nextAction",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.reviewMode !== "display-safe-local-review-only") errors.push("reviewMode must stay display-safe-local-review-only");
  if (data.executableLaneCount !== 0) errors.push("executableLaneCount must be 0");
  if (data.dispatchableLaneCount !== 0) errors.push("dispatchableLaneCount must be 0");
  if (data.projectMutationLaneCount !== 0) errors.push("projectMutationLaneCount must be 0");
  if (!Array.isArray(data.checklist) || data.checklist.length < 4) errors.push("checklist must contain review items");
  if (!Array.isArray(data.laneReviews) || data.laneReviews.length < 5) errors.push("laneReviews must cover readiness lanes");
  for (const item of data.checklist || []) {
    for (const field of ["key", "label", "complete", "ownerCapability", "nextAction"]) {
      if (!(field in item)) errors.push(`checklist.${item.key || "item"}.${field} missing`);
    }
  }
  for (const lane of data.laneReviews || []) {
    for (const field of ["laneKey", "label", "currentState", "reviewState", "ownerCapability", "nextAction", "blocker", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.executable !== false) errors.push(`${lane.label}.executable must be false`);
    if (lane.dispatchable !== false) errors.push(`${lane.label}.dispatchable must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.label}.projectMutationAllowed must be false`);
    for (const flag of P101_LIVE_USE_SAFETY_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  for (const flag of P101_LIVE_USE_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("review packet must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized)) errors.push("review packet must not expose fake unsafe runnable actions");
  if (/raw json|raw logs|raw policy dump/i.test(serialized)) errors.push("review packet must not expose raw dumps");
  if (String(humanize(data.currentState)).length === 0) errors.push("currentState must be displayable");
  return { valid: errors.length === 0, errors };
}
