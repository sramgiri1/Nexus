import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderPrdSafeAuthoring } from "./founderPrdSafeAuthoring.js";

export const P91_FOUNDER_WORKSTREAM_ACTIVATION_PHASE = "P91.2";

export const P91_WORKSTREAM_ACTIVATION_LANES = Object.freeze([
  {
    lane: "product",
    ownerCapability: "NEXUS Product Strategy",
    objective: "Translate the PRD artifact into MVP scope and acceptance review.",
    requiredEvidence: ["founder idea", "problem", "solution", "success criteria"],
  },
  {
    lane: "design",
    ownerCapability: "NEXUS Experience Design",
    objective: "Identify UX flows, screen states, and usability review needs.",
    requiredEvidence: ["target customer", "solution", "success criteria"],
  },
  {
    lane: "engineering",
    ownerCapability: "NEXUS Engineering Planning",
    objective: "Plan technical scope, test surface, and build boundary without mutating project files.",
    requiredEvidence: ["solution", "success criteria", "risks"],
  },
  {
    lane: "goToMarket",
    ownerCapability: "NEXUS Go-To-Market Planning",
    objective: "Plan launch positioning and validation evidence.",
    requiredEvidence: ["target customer", "go-to-market", "business model"],
  },
  {
    lane: "finance",
    ownerCapability: "NEXUS Finance Planning",
    objective: "Review budget posture and monetization assumptions before spend.",
    requiredEvidence: ["business model", "risks"],
  },
  {
    lane: "operations",
    ownerCapability: "NEXUS Operations Planning",
    objective: "Plan operating checklist, support handoffs, and release readiness boundaries.",
    requiredEvidence: ["solution", "risks"],
  },
  {
    lane: "legal",
    ownerCapability: "NEXUS Legal Review Planning",
    objective: "Identify policy, store, privacy, and compliance review needs.",
    requiredEvidence: ["go-to-market", "risks"],
  },
  {
    lane: "support",
    ownerCapability: "NEXUS Support Planning",
    objective: "Plan support, feedback, and post-launch learning loops.",
    requiredEvidence: ["target customer", "success criteria"],
  },
]);

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

function sectionByField(prdArtifact = {}) {
  return new Map((prdArtifact.sections || []).map((section) => [section.sourceField, section]));
}

function statusForLane(requiredEvidence = [], sectionsByField = new Map()) {
  const missingEvidence = requiredEvidence.filter((label) => {
    const sourceField = label.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/\s+/g, "");
    const normalized = sourceField === "goToMarket" ? "goToMarket" : sourceField;
    return ![...sectionsByField.values()].some((section) => section.title.toLowerCase() === label || section.sourceField === normalized);
  });
  return {
    missingEvidence,
    status: missingEvidence.length === 0 ? "ready_for_operator_review" : "needs_prd_evidence",
  };
}

function buildWorkstreamLanes(prdArtifact = {}) {
  const sectionsByField = sectionByField(prdArtifact);
  return P91_WORKSTREAM_ACTIVATION_LANES.map((lane) => {
    const readiness = statusForLane(lane.requiredEvidence, sectionsByField);
    return {
      lane: lane.lane,
      ownerCapability: lane.ownerCapability,
      objective: lane.objective,
      status: readiness.status,
      requiredEvidence: lane.requiredEvidence,
      missingEvidence: readiness.missingEvidence,
      activationReviewAllowed: true,
      agentDispatchAllowed: false,
      projectMutationAllowed: false,
      nextAction: readiness.missingEvidence.length === 0
        ? "Review this workstream lane with the operator before any later activation phase."
        : `Confirm ${readiness.missingEvidence[0]} before workstream activation review.`,
      disabledReason: "This lane is local activation planning only. Agent dispatch, worker/tool execution, project creation, project mutation, provider/model calls, DB writes, deploy, release, export, package, network calls, and spend remain blocked.",
    };
  });
}

export function buildFounderWorkstreamActivationPlan(input = {}) {
  const prd = input.prdAuthoring || buildFounderPrdSafeAuthoring(input);
  const prdArtifact = prd.data?.prdArtifact || {};
  const workstreamLanes = buildWorkstreamLanes(prdArtifact);
  const readyLaneCount = workstreamLanes.filter((lane) => lane.status === "ready_for_operator_review").length;
  const blockers = workstreamLanes.flatMap((lane) => lane.missingEvidence.map((item) => `${lane.lane} requires ${item}.`));

  return createPassResult({
    phase: P91_FOUNDER_WORKSTREAM_ACTIVATION_PHASE,
    mode: "local-founder-workstream-activation-planning",
    source: "live-ready/founderWorkstreamActivationPlan.js",
    summary: "Founder workstream activation planning built locally from the PRD artifact; unsafe runtime operations remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: blockers.length === 0
        ? "local_workstream_activation_plan_ready_for_operator_review"
        : "local_workstream_activation_plan_needs_prd_evidence",
      activationMode: "local-planning-review-only",
      sourcePrd: {
        title: prdArtifact.title || "Local PRD Artifact",
        reviewState: prdArtifact.reviewState || "needs_founder_inputs",
        sectionCount: prdArtifact.sections?.length || 0,
        evidenceSnippets: (prdArtifact.sections || []).map((section) => ({
          title: section.title,
          content: section.content,
        })),
      },
      workstreamLanes,
      activationReadiness: {
        ready: blockers.length === 0,
        readyLaneCount,
        totalLaneCount: workstreamLanes.length,
        missingEvidenceCount: blockers.length,
      },
      allowedLocalOperations: [
        "map PRD artifact to workstream activation review lanes",
        "review owner capability and blockers",
        "prepare operator activation review checklist",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: blockers.length === 0
        ? "Prepare P91.3 safe activation review packet for operator review."
        : blockers[0],
      blockers,
      disabledReason:
        "P91.2 only builds local workstream activation planning data. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Workstream Activation Planning",
      evidenceRefs: [
        "reports/p912-founder-workstream-activation-model-report.md",
        "reports/p907-founder-prd-final-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local planning only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p912-founder-workstream-activation-model-report.md",
      "contracts/os-roadmap/p91-execution-contracts.json",
    ],
    warnings: ["P91.2 creates local activation planning data only. It does not dispatch agents, mutate projects, or spend."],
  });
}

export function validateFounderWorkstreamActivationPlan(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P91_FOUNDER_WORKSTREAM_ACTIVATION_PHASE) errors.push("phase must be P91.2");
  for (const field of ["schemaVersion", "currentState", "activationMode", "sourcePrd", "workstreamLanes", "activationReadiness", "allowedLocalOperations", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.activationMode !== "local-planning-review-only") errors.push("activationMode must stay local-planning-review-only");
  if (!Array.isArray(data.workstreamLanes) || data.workstreamLanes.length !== P91_WORKSTREAM_ACTIVATION_LANES.length) errors.push("workstreamLanes must cover required lanes");
  for (const lane of data.workstreamLanes || []) {
    if (lane.agentDispatchAllowed !== false) errors.push(`${lane.lane} agentDispatchAllowed must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.lane} projectMutationAllowed must be false`);
  }
  for (const flag of UNSAFE_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("activation plan must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("activation plan must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
