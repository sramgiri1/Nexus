import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderActivationReviewPacket } from "./founderActivationReviewPacket.js";

export const P93_ENTERPRISE_LIVE_RUNTIME_PHASE = "P93.2";

export const P93_LIVE_RUNTIME_ENTITY_LANES = Object.freeze([
  {
    lane: "founderSession",
    ownerCapability: "NEXUS Founder Runtime",
    sqliteEntity: "runtime_events",
    objective: "Persist founder conversation and comprehension state as local runtime events.",
    requiredEvidence: ["founder idea", "operator checklist"],
  },
  {
    lane: "prdArtifact",
    ownerCapability: "NEXUS PRD Authoring",
    sqliteEntity: "contracts",
    objective: "Persist reviewed PRD artifacts as governed local contract records.",
    requiredEvidence: ["source PRD", "operator checklist"],
  },
  {
    lane: "workstreamPlan",
    ownerCapability: "NEXUS Workstream Planning",
    sqliteEntity: "mission_tasks",
    objective: "Persist planned workstream lanes as local mission task records.",
    requiredEvidence: ["review items", "owner capability"],
  },
  {
    lane: "activationReview",
    ownerCapability: "NEXUS Activation Governance",
    sqliteEntity: "actions",
    objective: "Persist activation review decisions as local action records without running them.",
    requiredEvidence: ["review items", "blocked operations"],
  },
  {
    lane: "runtimeTaskQueue",
    ownerCapability: "NEXUS Runtime Task Queue",
    sqliteEntity: "runtime_tasks",
    objective: "Persist approved runtime task queue items before any later executor phase.",
    requiredEvidence: ["next action", "disabled reason"],
  },
  {
    lane: "evidenceAudit",
    ownerCapability: "NEXUS Evidence Governance",
    sqliteEntity: "evidence",
    objective: "Persist evidence pointers for founder runtime decisions.",
    requiredEvidence: ["evidence refs", "activity location"],
  },
  {
    lane: "auditTrail",
    ownerCapability: "NEXUS Audit Trail",
    sqliteEntity: "audit_events",
    objective: "Persist governance audit events for approved local CRUD operations.",
    requiredEvidence: ["owner capability", "blocked operations"],
  },
  {
    lane: "commandCenterState",
    ownerCapability: "NEXUS Command Center Runtime State",
    sqliteEntity: "roadmap_phases",
    objective: "Reflect live-runtime readiness in Command Center without raw IDs or logs.",
    requiredEvidence: ["current state", "next action"],
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
  "hosted DB mutation",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(UNSAFE_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function evidenceAvailable(packetData = {}, label = "") {
  const normalized = label.toLowerCase();
  const sourceText = JSON.stringify({
    currentState: packetData.currentState,
    sourcePrd: packetData.sourcePrd,
    reviewItems: packetData.reviewItems,
    operatorChecklist: packetData.operatorChecklist,
    forbiddenOperations: packetData.forbiddenOperations,
    nextAction: packetData.nextAction,
    disabledReason: packetData.disabledReason,
    ownerCapability: packetData.ownerCapability,
    evidenceRefs: packetData.evidenceRefs,
    activityLocation: packetData.activityLocation,
  }).toLowerCase();
  return sourceText.includes(normalized.replace(/\s+/g, " ")) || sourceText.includes(normalized.split(" ")[0]);
}

function buildEntityLanes(packetData = {}) {
  return P93_LIVE_RUNTIME_ENTITY_LANES.map((lane) => {
    const missingEvidence = lane.requiredEvidence.filter((item) => !evidenceAvailable(packetData, item));
    return {
      lane: lane.lane,
      ownerCapability: lane.ownerCapability,
      sqliteEntity: lane.sqliteEntity,
      objective: lane.objective,
      status: missingEvidence.length === 0 ? "ready_for_governed_crud_request_model" : "needs_review_evidence",
      crudOperationsPlanned: ["create", "read", "update", "list"],
      currentReadAllowed: false,
      currentCreateAllowed: false,
      currentUpdateAllowed: false,
      currentDeleteAllowed: false,
      mutationRequestAllowed: false,
      projectMutationAllowed: false,
      providerCallAllowed: false,
      workerExecutionAllowed: false,
      requiredEvidence: lane.requiredEvidence,
      missingEvidence,
      nextAction: missingEvidence.length === 0
        ? "Prepare a governed local mutation request model before enabling any SQLite CRUD write."
        : `Confirm ${missingEvidence[0]} before this lane can enter mutation request planning.`,
      disabledReason: "P93.2 is a local CRUD plan only. SQLite writes, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DBs, network calls, deploy, release, export, package, and spend remain blocked.",
    };
  });
}

export function buildEnterpriseLiveRuntimeCrudPlan(input = {}) {
  const reviewPacket = input.reviewPacket || buildFounderActivationReviewPacket(input);
  const packetData = reviewPacket.data || {};
  const entityLanes = buildEntityLanes(packetData);
  const blockers = entityLanes.flatMap((lane) => lane.missingEvidence.map((item) => `${lane.lane} requires ${item}.`));
  const readyLaneCount = entityLanes.filter((lane) => lane.status === "ready_for_governed_crud_request_model").length;

  return createPassResult({
    phase: P93_ENTERPRISE_LIVE_RUNTIME_PHASE,
    mode: "enterprise-live-runtime-crud-plan",
    source: "live-ready/enterpriseLiveRuntimeCrudPlan.js",
    summary: "Enterprise live-runtime CRUD plan built locally; no mutations are executed.",
    data: {
      schemaVersion: "1.0",
      currentState: blockers.length === 0
        ? "enterprise_runtime_crud_plan_ready_for_request_model"
        : "enterprise_runtime_crud_plan_needs_review_evidence",
      runtimeMode: "local-planning-only",
      dbMode: "sqlite-live-planned",
      sourceReviewPacket: {
        currentState: packetData.currentState,
        packetMode: packetData.packetMode,
        ready: packetData.reviewReadiness?.ready === true,
        reviewItemCount: packetData.reviewItems?.length || 0,
      },
      entityLanes,
      crudReadiness: {
        ready: blockers.length === 0,
        readyLaneCount,
        totalLaneCount: entityLanes.length,
        blockerCount: blockers.length,
      },
      allowedLocalCrudOperations: [
        "plan DB-backed founder runtime lanes",
        "review SQLite entity mapping",
        "prepare governed mutation request model",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P93.2 does not enable SQLite writes. Later P93 subphases must explicitly scope and validate any local CRUD mutation.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: blockers.length === 0
        ? "Implement P93.3 governed runtime mutation request model."
        : blockers[0],
      blockers,
      disabledReason:
        "P93.2 only builds a local enterprise live-runtime CRUD plan. DB writes, provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DBs, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Enterprise Live Runtime Planning",
      evidenceRefs: [
        "reports/p932-enterprise-runtime-crud-plan-report.md",
        "reports/p931-enterprise-live-runtime-contract-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local planning only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p932-enterprise-runtime-crud-plan-report.md",
      "contracts/os-roadmap/p93-execution-contracts.json",
    ],
    warnings: ["P93.2 plans local CRUD only. It does not write SQLite records, dispatch agents, mutate projects, or spend."],
  });
}

export function validateEnterpriseLiveRuntimeCrudPlan(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P93_ENTERPRISE_LIVE_RUNTIME_PHASE) errors.push("phase must be P93.2");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceReviewPacket", "entityLanes", "crudReadiness", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.runtimeMode !== "local-planning-only") errors.push("runtimeMode must stay local-planning-only");
  if (!Array.isArray(data.entityLanes) || data.entityLanes.length !== P93_LIVE_RUNTIME_ENTITY_LANES.length) errors.push("entityLanes must cover required lanes");
  for (const lane of data.entityLanes || []) {
    if (lane.currentCreateAllowed !== false) errors.push(`${lane.lane} currentCreateAllowed must be false`);
    if (lane.currentUpdateAllowed !== false) errors.push(`${lane.lane} currentUpdateAllowed must be false`);
    if (lane.currentDeleteAllowed !== false) errors.push(`${lane.lane} currentDeleteAllowed must be false`);
    if (lane.mutationRequestAllowed !== false) errors.push(`${lane.lane} mutationRequestAllowed must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.lane} projectMutationAllowed must be false`);
    if (lane.providerCallAllowed !== false) errors.push(`${lane.lane} providerCallAllowed must be false`);
    if (lane.workerExecutionAllowed !== false) errors.push(`${lane.lane} workerExecutionAllowed must be false`);
  }
  for (const flag of UNSAFE_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("CRUD plan must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("CRUD plan must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
