import { createPassResult } from "../shared/resultEnvelope.js";
import { buildGovernedLiveCapabilityAdmission } from "./governedLiveCapabilityAdmission.js";

export const P86_CAPABILITY_STATE_RESOLVER_PHASE = "P86.2";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationRequestAllowed",
  "executionAllowed",
]);

const HIGH_RISK_GATES = new Set([
  "secretReference",
  "budgetLimit",
  "operatorApproval",
  "rollbackPlan",
  "projectMutationAdmission",
  "workerExecutionAdmission",
  "agentDispatchAdmission",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function resolveRisk(missingGates = []) {
  if (missingGates.some((gate) => HIGH_RISK_GATES.has(gate))) return "high";
  if (missingGates.length > 0) return "medium";
  return "review";
}

function resolveActivationState(row = {}) {
  if ((row.missingGates || []).length > 0) return "blocked_on_required_gates";
  return "ready_for_operator_review";
}

function buildState(row = {}) {
  const missingGates = row.missingGates || [];
  const activationState = resolveActivationState(row);
  const canRequestActivation = activationState === "ready_for_operator_review";
  return {
    capabilityId: row.capabilityId,
    label: row.label,
    ownerCapability: row.ownerCapability,
    activationState,
    readinessLabel: canRequestActivation ? "Ready for review" : "Blocked",
    riskLevel: resolveRisk(missingGates),
    canRequestActivation: false,
    executionAllowed: false,
    nextAction: canRequestActivation
      ? "Route this capability to P86.3 operator approval queue before any runtime action can be considered."
      : row.nextAction,
    stateReasons: missingGates.length > 0
      ? missingGates.map((gate) => `Missing ${gate}`)
      : ["All admission gates are present, but operator approval queue and runtime lock checks are still required."],
    requiredBeforeLive: canRequestActivation
      ? ["operatorApprovalQueue", "runtimeLock", "perCapabilityValidation", "rollbackConfirmation"]
      : missingGates,
    sourcePhase: row.sourcePhase,
    evidenceRefs: row.evidenceRefs || [],
    activityLocation: row.activityLocation,
    costImpact: row.costImpact,
    disabledReason: canRequestActivation
      ? "Activation review is not execution. P86.2 does not run providers, agents, tools, workers, project writes, DB writes, deploys, packages, or spend."
      : row.disabledReason,
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function countStates(states) {
  return states.reduce((acc, state) => {
    acc[state.activationState] = (acc[state.activationState] || 0) + 1;
    return acc;
  }, {});
}

export function buildGovernedLiveCapabilityStateResolver(input = {}) {
  const admission = input.admission || buildGovernedLiveCapabilityAdmission(input);
  const states = (admission.data?.capabilities || []).map(buildState);

  return createPassResult({
    phase: P86_CAPABILITY_STATE_RESOLVER_PHASE,
    mode: "live-admission",
    source: "live-ready/governedLiveCapabilityStateResolver.js",
    summary: "Governed live capability states are resolved for operator review; runtime execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "live_capability_states_resolved",
      readinessLabel: "Blocked",
      stateSummary: countStates(states),
      capabilityStates: states,
      activationRequestCount: states.filter((state) => state.canRequestActivation).length,
      nextAction: "Implement P86.3 operator approval queue before any activation request can be reviewed.",
      blockers: ["operatorApprovalQueue", "runtimeLock", "perCapabilityValidation", "rollbackConfirmation"],
      disabledReason:
        "P86.2 resolves live capability states only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Live Capability Governance",
      evidenceRefs: ["reports/p862-capability-state-resolver-report.md", "reports/p861-live-capability-admission-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: ["reports/p862-capability-state-resolver-report.md", "contracts/os-roadmap/p86-execution-contracts.json"],
    warnings: ["P86.2 is state resolution only. It does not request, unlock, or execute live capabilities."],
  });
}

export function validateGovernedLiveCapabilityStateResolver(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P86_CAPABILITY_STATE_RESOLVER_PHASE) errors.push("phase must be P86.2");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "stateSummary", "capabilityStates", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.capabilityStates) || data.capabilityStates.length < 8) errors.push("capabilityStates must resolve the P86.1 inventory");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const state of data.capabilityStates || []) {
    for (const field of ["capabilityId", "label", "ownerCapability", "activationState", "readinessLabel", "riskLevel", "canRequestActivation", "executionAllowed", "nextAction", "stateReasons", "requiredBeforeLive", "disabledReason"]) {
      if (!(field in state)) errors.push(`${state.capabilityId || "capability"}.${field} missing`);
    }
    if (state.canRequestActivation !== false) errors.push(`${state.capabilityId}.canRequestActivation must remain false in P86.2`);
    if (state.executionAllowed !== false) errors.push(`${state.capabilityId}.executionAllowed must remain false`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (state[flag] !== false) errors.push(`${state.capabilityId}.${flag} must be false`);
    }
    if (!Array.isArray(state.stateReasons) || state.stateReasons.length === 0) errors.push(`${state.capabilityId}.stateReasons required`);
    if (!Array.isArray(state.requiredBeforeLive)) errors.push(`${state.capabilityId}.requiredBeforeLive must be an array`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("state resolver must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("state resolver must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
