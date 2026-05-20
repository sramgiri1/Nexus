import { createPassResult } from "../shared/resultEnvelope.js";
import { buildExplicitLiveActivationContract } from "./explicitLiveActivationContract.js";
import { buildLocalAgentDispatchAdmission } from "./localAgentDispatchAdmission.js";
import { buildGeneratedProjectWorkspaceAdmission } from "./generatedProjectWorkspaceAdmission.js";

export const P88_SCOPED_EXECUTION_ACTIVATION_PROFILE_PHASE = "P88.1";

export const P88_REQUIRED_ACTIVATION_GATES = Object.freeze([
  "operatorApproval",
  "scopedTaskContract",
  "localOnlyExecutionMode",
  "selectedAgentLane",
  "scopedContextPacket",
  "newGeneratedWorkspaceBoundary",
  "activityEvidence",
  "costEvidence",
  "rollbackPlan",
  "validationCommands",
  "postRunReview",
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
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
  "external network calls",
  "tool execution outside the selected local lane",
  "worker runtime execution",
  "existing project mutation",
  "generated app Sources/Tests mutation",
  "DB writes",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildFutureLane({ laneId, label, ownerCapability, objective, sourcePhase, evidenceRefs = [] }) {
  return {
    laneId,
    label,
    ownerCapability,
    objective,
    sourcePhase,
    activationState: "profile_defined_pending_executor",
    allowedFutureOperations: [
      "local orchestration state transition after explicit operator approval",
      "local agent lane planning with scoped context packet",
      "new generated workspace boundary preparation",
      "read-only validation evidence aggregation",
    ],
    forbiddenOperations: [...FORBIDDEN_OPERATIONS],
    requiredGates: [...P88_REQUIRED_ACTIVATION_GATES],
    requiredEvidence: [
      "approved P88 subphase contract",
      "operator approval record",
      "selected task contract",
      "scoped context packet",
      "activity evidence",
      "cost evidence",
      "rollback plan",
      "validation report",
    ],
    blockers: ["localExecutorNotWired", "postRunReviewNotWired", "perLaneOperatorApproval"],
    nextAction: "Implement P88.2 as a local-only activation request model before any executor is wired.",
    disabledReason:
      "P88.1 defines the scoped activation profile only. It does not execute the lane or mutate project/runtime state.",
    validationCommands: [
      "npm run check:p881-scoped-execution-activation-profile",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p881-scoped-execution-activation-profile-report.md", ...evidenceRefs],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Zero provider calls and zero provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function buildScopedExecutionActivationProfile(input = {}) {
  const activationContract = input.activationContract || buildExplicitLiveActivationContract(input);
  const dispatchAdmission = input.dispatchAdmission || buildLocalAgentDispatchAdmission(input);
  const workspaceAdmission = input.workspaceAdmission || buildGeneratedProjectWorkspaceAdmission(input);

  const lanes = [
    buildFutureLane({
      laneId: "p88-local-founder-task-orchestration",
      label: "Local founder task orchestration",
      ownerCapability: "NEXUS Founder Runtime",
      objective: "Prepare a local-only activation request for founder task planning without dispatching agents.",
      sourcePhase: dispatchAdmission.phase,
      evidenceRefs: ["reports/p873-local-agent-dispatch-admission-report.md"],
    }),
    buildFutureLane({
      laneId: "p88-generated-workspace-boundary",
      label: "Generated workspace boundary",
      ownerCapability: "NEXUS Generated Workspace Governance",
      objective: "Prepare a new generated workspace boundary without creating or mutating project files.",
      sourcePhase: workspaceAdmission.phase,
      evidenceRefs: ["reports/p874-generated-project-workspace-admission-report.md"],
    }),
    buildFutureLane({
      laneId: "p88-live-unlock-review",
      label: "Live unlock review",
      ownerCapability: "NEXUS Live Activation Governance",
      objective: "Prepare operator-reviewable activation state from P87 unlock lanes without enabling execution.",
      sourcePhase: activationContract.phase,
      evidenceRefs: ["reports/p871-explicit-live-activation-contract-report.md"],
    }),
  ];

  return createPassResult({
    phase: P88_SCOPED_EXECUTION_ACTIVATION_PROFILE_PHASE,
    mode: "scoped-execution-activation-profile",
    source: "live-ready/scopedExecutionActivationProfile.js",
    summary: "Scoped execution-capable activation profile is defined; executors remain blocked until later P88 subphases.",
    data: {
      schemaVersion: "1.0",
      currentState: "scoped_execution_activation_profile_ready",
      readinessLabel: "Activation profile ready",
      activationMode: "local-only-profile",
      parentActivationContractPhase: activationContract.phase,
      dispatchAdmissionPhase: dispatchAdmission.phase,
      workspaceAdmissionPhase: workspaceAdmission.phase,
      allowedFutureLaneCount: lanes.length,
      allowedFutureLanes: lanes,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      requiredGates: [...P88_REQUIRED_ACTIVATION_GATES],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Implement P88.2 as a local-only activation request model with operator approval and no execution.",
      blockers: ["localActivationRequestModel", "operatorApprovalRecord", "executorNotWired", "postRunReviewNotWired"],
      disabledReason:
        "P88.1 is profile-only. It does not call providers or models, dispatch agents, execute tools or workers, mutate projects, write DB state, use network calls, deploy, release, export, package, or spend.",
      ownerCapability: "NEXUS Scoped Live Activation Governance",
      evidenceRefs: [
        "reports/p881-scoped-execution-activation-profile-report.md",
        "reports/p877-final-validation-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p881-scoped-execution-activation-profile-report.md",
      "contracts/os-roadmap/p88-execution-contracts.json",
    ],
    warnings: ["P88.1 defines a profile only. It does not wire or run an executor."],
  });
}

export function validateScopedExecutionActivationProfile(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P88_SCOPED_EXECUTION_ACTIVATION_PROFILE_PHASE) errors.push("phase must be P88.1");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "activationMode", "allowedFutureLanes", "forbiddenOperations", "requiredGates", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.activationMode !== "local-only-profile") errors.push("activationMode must stay local-only-profile");
  if (!Array.isArray(data.allowedFutureLanes) || data.allowedFutureLanes.length !== 3) errors.push("allowedFutureLanes must include three scoped lanes");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const lane of data.allowedFutureLanes || []) {
    for (const field of ["laneId", "label", "ownerCapability", "objective", "sourcePhase", "activationState", "allowedFutureOperations", "forbiddenOperations", "requiredGates", "requiredEvidence", "blockers", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.activationState !== "profile_defined_pending_executor") errors.push(`${lane.label}.activationState must stay pending executor`);
    for (const flag of RUNTIME_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("scoped activation profile must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("scoped activation profile must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
