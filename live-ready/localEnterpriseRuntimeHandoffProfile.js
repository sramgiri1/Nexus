import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalExecutorAdmission } from "./localExecutorAdmission.js";

export const P89_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PROFILE_PHASE = "P89.1";

export const P89_ENTERPRISE_HANDOFF_REQUIRED_GATES = Object.freeze([
  "operatorApproval",
  "localExecutorAdmission",
  "founderWorkstreamContract",
  "selectedAgentLane",
  "scopedContextPacket",
  "readOnlyPreflight",
  "activityEvidence",
  "costEvidence",
  "rollbackPlan",
  "postRunReviewPlan",
  "validationCommands",
]);

const RUNTIME_FLAGS = Object.freeze([
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
  "handoffCanExecute",
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
  "existing project mutation",
  "generated app Sources/Tests mutation",
  "DB writes",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function handoffLaneKey(admissionKey = "") {
  return `enterprise-handoff-${String(admissionKey).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildHandoffLane(admission = {}) {
  return {
    laneKey: handoffLaneKey(admission.admissionKey),
    label: admission.label,
    ownerCapability: admission.ownerCapability,
    sourceAdmissionKey: admission.admissionKey,
    handoffState: "handoff_profile_defined_not_executable",
    handoffCanExecute: false,
    allowedFutureOperations: [
      "local founder workstream contract review",
      "read-only preflight evidence aggregation",
      "scoped context packet preparation",
      "post-run review packet preparation",
    ],
    forbiddenOperations: [...FORBIDDEN_OPERATIONS],
    requiredGates: [...P89_ENTERPRISE_HANDOFF_REQUIRED_GATES],
    missingEvidence: [
      "founderWorkstreamContract",
      "selectedAgentLane",
      "scopedContextPacket",
      "operatorApproval",
      "localRuntimePolicyReview",
      "postRunReviewPlan",
    ],
    nextAction: "Implement P89.2 as a local founder workstream runtime envelope without dispatching agents or running an executor.",
    disabledReason:
      "P89.1 defines a local enterprise runtime handoff profile only. It cannot execute, dispatch agents, call providers, mutate projects, write DB state, deploy, package, use network calls, or spend.",
    validationCommands: [
      "npm run check:p891-local-enterprise-runtime-handoff-profile",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p891-local-enterprise-runtime-handoff-profile-report.md", ...(admission.evidenceRefs || [])],
    activityLocation: admission.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(lanes) {
  return lanes.reduce((acc, lane) => {
    acc[lane.handoffState] = (acc[lane.handoffState] || 0) + 1;
    return acc;
  }, {});
}

export function buildLocalEnterpriseRuntimeHandoffProfile(input = {}) {
  const executorAdmission = input.executorAdmission || buildLocalExecutorAdmission(input);
  const handoffLanes = (executorAdmission.data?.admissions || []).map(buildHandoffLane);

  return createPassResult({
    phase: P89_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PROFILE_PHASE,
    mode: "local-enterprise-runtime-handoff-profile",
    source: "live-ready/localEnterpriseRuntimeHandoffProfile.js",
    summary: "Local enterprise runtime handoff profile is defined; runtime execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_enterprise_runtime_handoff_profile_ready_blocked",
      readinessLabel: "Runtime handoff profile ready",
      handoffMode: "local-only-profile",
      sourcePhase: executorAdmission.phase,
      handoffLaneCount: handoffLanes.length,
      handoffSummary: summarize(handoffLanes),
      handoffLanes,
      requiredGates: [...P89_ENTERPRISE_HANDOFF_REQUIRED_GATES],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Implement P89.2 local founder workstream runtime envelope without dispatching agents or running an executor.",
      blockers: [
        "founderWorkstreamContract",
        "selectedAgentLane",
        "scopedContextPacket",
        "operatorApproval",
        "localRuntimePolicyReview",
        "postRunReviewPlan",
      ],
      disabledReason:
        "P89.1 is a schema and policy handoff profile only. Provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Governed Local Runtime Handoff",
      evidenceRefs: [
        "reports/p891-local-enterprise-runtime-handoff-profile-report.md",
        "reports/p887-final-validation-report.md",
        "reports/p883-local-executor-admission-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p891-local-enterprise-runtime-handoff-profile-report.md",
      "contracts/os-roadmap/p89-execution-contracts.json",
    ],
    warnings: ["P89.1 defines a handoff profile only. It does not import, wire, or run an executor."],
  });
}

export function validateLocalEnterpriseRuntimeHandoffProfile(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P89_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PROFILE_PHASE) errors.push("phase must be P89.1");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "handoffMode", "sourcePhase", "handoffLaneCount", "handoffLanes", "requiredGates", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.handoffMode !== "local-only-profile") errors.push("handoffMode must stay local-only-profile");
  if (!Array.isArray(data.handoffLanes) || data.handoffLanes.length !== 3) errors.push("handoffLanes must cover three P88 executor admissions");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const lane of data.handoffLanes || []) {
    for (const field of ["laneKey", "label", "ownerCapability", "sourceAdmissionKey", "handoffState", "handoffCanExecute", "allowedFutureOperations", "forbiddenOperations", "requiredGates", "missingEvidence", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.handoffState !== "handoff_profile_defined_not_executable") errors.push(`${lane.label}.handoffState must stay not executable`);
    if (lane.handoffCanExecute !== false) errors.push(`${lane.label}.handoffCanExecute must be false`);
    for (const flag of RUNTIME_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local enterprise runtime handoff profile must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("local enterprise runtime handoff profile must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
