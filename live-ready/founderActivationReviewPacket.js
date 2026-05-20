import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderWorkstreamActivationPlan } from "./founderWorkstreamActivationPlan.js";

export const P91_FOUNDER_ACTIVATION_REVIEW_PACKET_PHASE = "P91.3";

const UNSAFE_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "DB writes",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(UNSAFE_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildReviewItems(workstreamLanes = []) {
  return workstreamLanes.map((lane) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    status: lane.status,
    objective: lane.objective,
    requiredEvidence: lane.requiredEvidence,
    blocker: lane.missingEvidence?.[0] ? `${lane.lane} requires ${lane.missingEvidence[0]}.` : "No blocker for local operator review.",
    activationAllowed: false,
    nextAction: "Operator reviews this lane before any later activation-enabling phase.",
    disabledReason: "Review item is local-only. Agent dispatch, project mutation, provider/model calls, DB writes, deploy, package, network calls, and spend remain blocked.",
  }));
}

export function buildFounderActivationReviewPacket(input = {}) {
  const plan = input.activationPlan || buildFounderWorkstreamActivationPlan(input);
  const planData = plan.data || {};
  const reviewItems = buildReviewItems(planData.workstreamLanes || []);
  const blockers = reviewItems.filter((item) => item.blocker !== "No blocker for local operator review.").map((item) => item.blocker);

  return createPassResult({
    phase: P91_FOUNDER_ACTIVATION_REVIEW_PACKET_PHASE,
    mode: "local-founder-activation-review-packet",
    source: "live-ready/founderActivationReviewPacket.js",
    summary: "Founder activation review packet built locally from workstream activation planning; unsafe runtime operations remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: blockers.length === 0
        ? "local_activation_review_packet_ready_for_operator_review"
        : "local_activation_review_packet_has_blockers",
      packetMode: "local-review-only",
      sourcePrd: planData.sourcePrd,
      reviewItems,
      reviewReadiness: {
        ready: blockers.length === 0,
        readyItemCount: reviewItems.length - blockers.length,
        totalItemCount: reviewItems.length,
        blockerCount: blockers.length,
      },
      operatorChecklist: [
        "Confirm PRD assumptions remain valid.",
        "Confirm each workstream owner capability and objective.",
        "Confirm unsafe runtime operations remain blocked.",
        "Confirm a later phase explicitly scopes any activation, dispatch, project mutation, or spend.",
      ],
      allowedLocalOperations: [
        "assemble local activation review packet",
        "review workstream owners and blockers",
        "prepare operator checklist",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: blockers.length === 0
        ? "Implement P91.4 Command Center UX for local activation review visibility."
        : blockers[0],
      blockers,
      disabledReason:
        "P91.3 only builds a local activation review packet. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Activation Review Governance",
      evidenceRefs: [
        "reports/p913-founder-activation-review-packet-report.md",
        "reports/p912-founder-workstream-activation-model-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local review packet only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p913-founder-activation-review-packet-report.md",
      "contracts/os-roadmap/p91-execution-contracts.json",
    ],
    warnings: ["P91.3 creates a local review packet only. It does not dispatch agents, mutate projects, or spend."],
  });
}

export function validateFounderActivationReviewPacket(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P91_FOUNDER_ACTIVATION_REVIEW_PACKET_PHASE) errors.push("phase must be P91.3");
  for (const field of ["schemaVersion", "currentState", "packetMode", "sourcePrd", "reviewItems", "reviewReadiness", "operatorChecklist", "allowedLocalOperations", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.packetMode !== "local-review-only") errors.push("packetMode must stay local-review-only");
  if (!Array.isArray(data.reviewItems) || data.reviewItems.length === 0) errors.push("reviewItems must be present");
  if (!Array.isArray(data.operatorChecklist) || data.operatorChecklist.length < 3) errors.push("operatorChecklist must be present");
  for (const item of data.reviewItems || []) {
    if (item.activationAllowed !== false) errors.push(`${item.lane} activationAllowed must be false`);
  }
  for (const flag of UNSAFE_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("review packet must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("review packet must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
