import { createPassResult } from "../shared/resultEnvelope.js";
import { buildGovernedLiveActivationDryRun } from "./governedLiveActivationDryRun.js";

export const P87_EXPLICIT_LIVE_ACTIVATION_CONTRACT_PHASE = "P87.1";

export const LIVE_ACTIVATION_CONTRACT_GATES = Object.freeze([
  "operatorApproval",
  "scopeBoundary",
  "policyProfile",
  "secretReference",
  "budgetLimit",
  "activityEvidence",
  "costEvidence",
  "redactionCheck",
  "rollbackPlan",
  "validationCommands",
  "operatorConfirmation",
]);

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
  "activationAllowed",
  "executionAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function contractLaneId(label = "") {
  return `unlock-${String(label).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildContractLane(intent = {}) {
  return {
    laneId: contractLaneId(intent.label),
    label: intent.label,
    ownerCapability: intent.ownerCapability,
    unlockState: "contract_defined_pending_scoped_unlock",
    allowedOperations: [],
    forbiddenOperations: [
      "provider/model calls",
      "agent dispatch",
      "tool execution",
      "worker execution",
      "project creation or mutation",
      "DB writes",
      "network calls",
      "deploy/release/export/package actions",
      "provider spend",
    ],
    requiredGates: [...LIVE_ACTIVATION_CONTRACT_GATES],
    requiredEvidence: [
      "approved P87 subphase contract",
      "bounded operator approval",
      "scope boundary",
      "rollback plan",
      "validation report",
      "activity evidence",
      "cost evidence",
    ],
    blockers: ["scopedUnlockSubphase", "operatorApproval", "perLaneValidation", ...(intent.blockers || [])],
    nextAction: "Plan a dedicated P87 subphase for this lane before enabling any live action.",
    disabledReason:
      "P87.1 defines the explicit live activation contract only. It does not unlock or execute this lane.",
    rollbackRequired: true,
    validationCommands: [
      "npm run check:p871-explicit-live-activation-contract",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p871-explicit-live-activation-contract-report.md", ...(intent.evidenceRefs || [])],
    activityLocation: intent.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, worker runtime, deploy, package creation, network calls, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(lanes) {
  return lanes.reduce((acc, lane) => {
    acc[lane.unlockState] = (acc[lane.unlockState] || 0) + 1;
    return acc;
  }, {});
}

export function buildExplicitLiveActivationContract(input = {}) {
  const dryRun = input.dryRun || buildGovernedLiveActivationDryRun(input);
  const lanes = (dryRun.data?.intents || []).map(buildContractLane);

  return createPassResult({
    phase: P87_EXPLICIT_LIVE_ACTIVATION_CONTRACT_PHASE,
    mode: "live-activation-contract",
    source: "live-ready/explicitLiveActivationContract.js",
    summary: "Explicit live activation contract is defined; execution remains blocked until later scoped unlocks.",
    data: {
      schemaVersion: "1.0",
      currentState: "explicit_live_activation_contract_ready",
      readinessLabel: "Contract ready",
      laneSummary: summarize(lanes),
      lanes,
      nextAction: "Implement P87.2 secret and provider readiness without provider calls or spend.",
      blockers: ["perLaneUnlockContract", "operatorApproval", "runtimeExecutorPolicy", "costAdmission"],
      disabledReason:
        "P87.1 is a contract phase only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Live Activation Governance",
      evidenceRefs: ["reports/p871-explicit-live-activation-contract-report.md", "reports/p867-final-validation-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p871-explicit-live-activation-contract-report.md",
      "contracts/os-roadmap/p87-execution-contracts.json",
    ],
    warnings: ["P87.1 defines live activation contracts only. It does not unlock or execute live capabilities."],
  });
}

export function validateExplicitLiveActivationContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P87_EXPLICIT_LIVE_ACTIVATION_CONTRACT_PHASE) errors.push("phase must be P87.1");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "laneSummary", "lanes", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.lanes) || data.lanes.length < 8) errors.push("lanes must cover governed live activation intents");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const lane of data.lanes || []) {
    for (const field of ["laneId", "label", "ownerCapability", "unlockState", "allowedOperations", "forbiddenOperations", "requiredGates", "requiredEvidence", "blockers", "nextAction", "disabledReason", "rollbackRequired", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (!Array.isArray(lane.allowedOperations) || lane.allowedOperations.length !== 0) errors.push(`${lane.label}.allowedOperations must be empty`);
    if (!Array.isArray(lane.requiredGates) || lane.requiredGates.length !== LIVE_ACTIVATION_CONTRACT_GATES.length) errors.push(`${lane.label}.requiredGates incomplete`);
    if (lane.rollbackRequired !== true) errors.push(`${lane.label}.rollbackRequired must be true`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("activation contract must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("activation contract must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
