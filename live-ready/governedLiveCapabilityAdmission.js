import { createPassResult } from "../shared/resultEnvelope.js";
import { buildProviderToolGateProfiles } from "./providerToolGateProfiles.js";
import { buildWorkerExecutionGate } from "./workerExecutionGate.js";
import { buildProjectDbAdmissionGate } from "./projectDbAdmission.js";
import { buildDeployReleaseAdmissionGate } from "./deployReleaseAdmission.js";
import { buildLocalProjectCreationAdmission } from "./localProjectCreationAdmission.js";
import { buildFounderTaskBoardAdmission } from "./enterpriseFounderTaskBoardAdmission.js";

export const P86_LIVE_CAPABILITY_ADMISSION_PHASE = "P86.1";

export const LIVE_CAPABILITY_REQUIRED_GATES = Object.freeze([
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
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeAdmissionRow(input) {
  const missingGates = unique([...(input.missingGates || []), ...LIVE_CAPABILITY_REQUIRED_GATES.filter((gate) => !(input.availableGates || []).includes(gate))]);
  return {
    capabilityId: input.capabilityId,
    label: input.label,
    ownerCapability: input.ownerCapability,
    currentState: missingGates.length === 0 ? "ready_for_operator_activation_review" : "blocked_on_live_admission",
    readinessLabel: missingGates.length === 0 ? "Ready for review" : "Needs setup",
    requiredGates: [...LIVE_CAPABILITY_REQUIRED_GATES],
    availableGates: unique(input.availableGates || []),
    missingGates,
    nextAction: input.nextAction,
    blockers: missingGates,
    disabledReason: input.disabledReason,
    evidenceRefs: unique(input.evidenceRefs || []),
    activityLocation: input.activityLocation || "reports/os-phase-status-report.md",
    costImpact: input.costImpact,
    commandCenterVisible: true,
    sourcePhase: input.sourcePhase,
    source: input.source,
    ...blockedRuntimeFlags(),
  };
}

function countByReadiness(rows) {
  return rows.reduce((acc, row) => {
    acc[row.readinessLabel] = (acc[row.readinessLabel] || 0) + 1;
    return acc;
  }, {});
}

export function buildGovernedLiveCapabilityAdmission(input = {}) {
  const providerTools = buildProviderToolGateProfiles({ mode: "live" });
  const workerGate = buildWorkerExecutionGate({ mode: "live" });
  const projectDbGate = buildProjectDbAdmissionGate({ mode: "live" });
  const deployGate = buildDeployReleaseAdmissionGate({ mode: "live" });
  const projectCreation = buildLocalProjectCreationAdmission({
    projectName: input.projectName || "Founder Build",
    projectType: input.projectType || "generated-app",
    approval: input.generatedProjectApproval || {},
  });
  const taskBoard = buildFounderTaskBoardAdmission(input.taskBoardInput || {});

  const providerRows = (providerTools.data?.profiles || []).map((profile) => normalizeAdmissionRow({
    capabilityId: profile.id,
    label: profile.label,
    ownerCapability: profile.ownerCapability,
    availableGates: ["policyProfile", "activityEvidence", "redactionCheck"],
    missingGates: profile.blockers,
    nextAction: profile.nextAction,
    disabledReason: profile.disabledReason,
    evidenceRefs: profile.evidenceRefs,
    activityLocation: profile.activityLocation,
    costImpact: profile.costImpact,
    sourcePhase: providerTools.phase,
    source: providerTools.source,
  }));

  const coreRows = [
    normalizeAdmissionRow({
      capabilityId: "agent-dispatch-worker-execution",
      label: "Agent Dispatch / Worker Execution",
      ownerCapability: workerGate.data?.ownerCapability,
      availableGates: ["activityEvidence", "costEvidence", "validationCommands"],
      missingGates: workerGate.data?.blockers,
      nextAction: workerGate.data?.nextAction,
      disabledReason: workerGate.data?.disabledReason,
      evidenceRefs: workerGate.data?.evidenceRefs,
      activityLocation: workerGate.data?.activityLocation,
      costImpact: workerGate.data?.costImpact,
      sourcePhase: workerGate.phase,
      source: workerGate.source,
    }),
    normalizeAdmissionRow({
      capabilityId: "project-db-mutation",
      label: "Project / DB Mutation",
      ownerCapability: projectDbGate.data?.ownerCapability,
      availableGates: ["scopeBoundary", "activityEvidence", "costEvidence", "rollbackPlan", "validationCommands"],
      missingGates: projectDbGate.data?.blockers,
      nextAction: projectDbGate.data?.nextAction,
      disabledReason: projectDbGate.data?.disabledReason,
      evidenceRefs: projectDbGate.data?.evidenceRefs,
      activityLocation: projectDbGate.data?.activityLocation,
      costImpact: projectDbGate.data?.costImpact,
      sourcePhase: projectDbGate.phase,
      source: projectDbGate.source,
    }),
    normalizeAdmissionRow({
      capabilityId: "generated-project-creation",
      label: "Generated Project Creation",
      ownerCapability: projectCreation.data?.ownerCapability,
      availableGates: projectCreation.data?.projectCreationAllowed ? [...LIVE_CAPABILITY_REQUIRED_GATES] : ["scopeBoundary"],
      missingGates: projectCreation.data?.blockers,
      nextAction: projectCreation.data?.nextAction,
      disabledReason: projectCreation.data?.disabledReason,
      evidenceRefs: projectCreation.data?.evidenceRefs,
      activityLocation: projectCreation.data?.activityLocation,
      costImpact: projectCreation.data?.costImpact,
      sourcePhase: projectCreation.phase,
      source: projectCreation.source,
    }),
    normalizeAdmissionRow({
      capabilityId: "deploy-release-package",
      label: "Deploy / Release / Package",
      ownerCapability: deployGate.data?.ownerCapability,
      availableGates: ["activityEvidence", "costEvidence", "redactionCheck"],
      missingGates: deployGate.data?.blockers,
      nextAction: deployGate.data?.nextAction,
      disabledReason: deployGate.data?.disabledReason,
      evidenceRefs: deployGate.data?.evidenceRefs,
      activityLocation: deployGate.data?.activityLocation,
      costImpact: deployGate.data?.costImpact,
      sourcePhase: deployGate.phase,
      source: deployGate.source,
    }),
    normalizeAdmissionRow({
      capabilityId: "founder-task-board-dispatch",
      label: "Founder Task Board Dispatch",
      ownerCapability: taskBoard.data?.ownerCapability,
      availableGates: ["activityEvidence", "costEvidence", "redactionCheck", "validationCommands"],
      missingGates: ["agentDispatchAdmission", "workerExecutionAdmission", "projectMutationAdmission"],
      nextAction: "Use P86.2 to resolve whether each local task-board lane has complete live admission evidence before dispatch can be considered.",
      disabledReason: taskBoard.data?.disabledReason,
      evidenceRefs: taskBoard.data?.evidenceRefs,
      activityLocation: taskBoard.data?.activityLocation,
      costImpact: taskBoard.data?.costImpact,
      sourcePhase: taskBoard.phase,
      source: taskBoard.source,
    }),
  ];

  const capabilities = [...providerRows, ...coreRows];

  return createPassResult({
    phase: P86_LIVE_CAPABILITY_ADMISSION_PHASE,
    mode: "live-admission",
    source: "live-ready/governedLiveCapabilityAdmission.js",
    summary: "Governed live capability admission inventory is available; runtime execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "live_capability_admission_inventory_ready",
      readinessLabel: "Needs setup",
      requiredGates: [...LIVE_CAPABILITY_REQUIRED_GATES],
      capabilityCount: capabilities.length,
      readinessSummary: countByReadiness(capabilities),
      capabilities,
      nextAction: "Implement P86.2 capability state resolver before any operator activation review.",
      blockers: ["capabilityStateResolver", "operatorActivationReview", "runtimeLock", "perCapabilityValidation"],
      disabledReason:
        "P86.1 defines live capability admission metadata only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Live Capability Governance",
      evidenceRefs: ["reports/p861-live-capability-admission-report.md", "reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: ["reports/p861-live-capability-admission-report.md", "contracts/os-roadmap/p86-execution-contracts.json"],
    warnings: ["P86.1 is admission inventory only. It does not unlock or execute live capabilities."],
  });
}

export function validateGovernedLiveCapabilityAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P86_LIVE_CAPABILITY_ADMISSION_PHASE) errors.push("phase must be P86.1");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "requiredGates", "capabilities", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.requiredGates) || data.requiredGates.length !== LIVE_CAPABILITY_REQUIRED_GATES.length) errors.push("requiredGates must cover live capability gates");
  if (!Array.isArray(data.capabilities) || data.capabilities.length < 8) errors.push("capabilities must cover provider, tool, worker, project, DB, deploy, and task-board surfaces");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.capabilities || []) {
    for (const field of ["capabilityId", "label", "ownerCapability", "currentState", "readinessLabel", "requiredGates", "missingGates", "nextAction", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.capabilityId || "capability"}.${field} missing`);
    }
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.capabilityId}.${flag} must be false`);
    }
    if (!Array.isArray(row.requiredGates) || row.requiredGates.length !== LIVE_CAPABILITY_REQUIRED_GATES.length) errors.push(`${row.capabilityId}.requiredGates incomplete`);
    if (!Array.isArray(row.missingGates)) errors.push(`${row.capabilityId}.missingGates must be an array`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("admission inventory must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("admission inventory must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
