import { buildFounderLiveHandoffWorkOrders } from "../live-ready/founderLiveHandoffWorkOrders.js";
import { buildFounderLiveWorkAdmission } from "../live-ready/founderLiveWorkAdmission.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const AGENT_WORK_ORDER_RUNTIME_PHASE = "P137.2";
export const AGENT_WORK_ORDER_RUNTIME_VERSION = "1.0";

export const AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES = Object.freeze([
  "taskContract",
  "selectedProjectProfile",
  "scopedMemoryPacket",
  "trustedContextPacket",
  "selectedSkillToolContracts",
  "budgetPolicyLimits",
  "policyLimits",
  "evidenceRefs",
]);

export const AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES = Object.freeze([
  "fullToolRegistryLoaded",
  "fullMcpSchemaRegistryLoaded",
  "fullSkillRegistryLoaded",
  "fullAgentRegistryLoaded",
  "fullPolicyRegistryLoaded",
  "fullMemoryLoaded",
  "secretValuesReadable",
  "providerPayloadPrepared",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "mcpServerStartupAllowed",
  "agentDispatchAllowed",
  "dbRuntimeWritesAllowed",
  "projectMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
]);

const OWNER_CAPABILITY = "NEXUS Agent Work Order Runtime Guard";
const DISABLED_REASON = "P137.2 defines read-only scoped agent work order packets. Provider/model calls, tool execution, MCP startup, agent dispatch, DB/runtime writes, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";
const DEFAULT_FOUNDER_IDEA = "Founder wants NEXUS to validate a startup idea, draft a PRD, and map governed agent work without live execution.";

function blockedSafetyFlags() {
  return Object.fromEntries(AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeFounderIdea(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed || DEFAULT_FOUNDER_IDEA;
}

function inferTaskContract(founderIdeaSummary) {
  const snakeGame = /snake|ios|iphone|app store|game/i.test(founderIdeaSummary);
  return {
    title: snakeGame ? "iOS Snake game startup validation" : "Founder business idea validation",
    founderIntent: founderIdeaSummary,
    workOrderIntent: snakeGame
      ? "Validate the iOS Snake game concept, draft product requirements, and map safe local build lanes."
      : "Validate the business concept, draft product requirements, and map safe local build lanes.",
    acceptanceCriteria: snakeGame
      ? [
          "Feasibility is stated for a small iOS game MVP.",
          "PRD-ready scope includes controls, scoring, persistence, and App Store readiness.",
          "Agent lanes are scoped without dispatch or project mutation.",
        ]
      : [
          "Founder problem, customer, solution, business model, and constraints are summarized.",
          "PRD-ready scope is mapped to owner lanes.",
          "Agent lanes are scoped without dispatch or project mutation.",
        ],
    allowedActions: ["read scoped packet", "summarize assigned work", "return next planning step"],
    forbiddenActions: [
      "load full registries",
      "call providers or models",
      "execute tools",
      "dispatch agents",
      "write DB/runtime state",
      "mutate projects",
      "deploy, release, export, package, use network calls, or spend",
    ],
  };
}

function buildSelectedProjectProfile(founderIdeaSummary) {
  return {
    profileLabel: /snake|ios|iphone|app store|game/i.test(founderIdeaSummary)
      ? "Selected founder app concept"
      : "Selected founder business concept",
    scopeLabel: "NEXUS OS planning surface",
    source: "display-safe founder idea summary",
    privateRawIdVisible: false,
    projectMutationAllowed: false,
    dbRuntimeWritesAllowed: false,
    deployAllowed: false,
    packageCreationAllowed: false,
    nextAction: "Keep project-specific source changes blocked until a future explicit mutation phase grants authority.",
  };
}

function buildScopedMemoryPacket(founderIdeaSummary, workOrdersData = {}) {
  const laneLabels = (workOrdersData.workOrderRows || []).slice(0, 4).map((row) => row.proposedAgent).filter(Boolean);
  return {
    memoryScope: "current founder summary and selected work-order labels only",
    founderSummary: founderIdeaSummary,
    retainedFacts: [
      "Founder intent has been summarized.",
      "Work-order rows are planning artifacts only.",
      "Execution remains blocked until future explicit authority.",
      ...laneLabels.map((label) => `Candidate lane: ${label}`),
    ],
    omittedContext: [
      "full memory store",
      "all agent definitions",
      "all policies",
      "unredacted private identifiers",
      "unredacted logs and structured payload dumps",
    ],
    fullMemoryLoaded: false,
  };
}

function buildTrustedContextPacket(workOrdersEnvelope = {}, workAdmissionEnvelope = {}) {
  return {
    contextScope: "selected trusted evidence only",
    sourcePhases: [workOrdersEnvelope.phase, workAdmissionEnvelope.phase].filter(Boolean),
    evidenceLabels: [
      "P102 work-order planning evidence",
      "P103 work admission evidence",
      "P136 provider/tool governance boundary",
      "P137.1 runtime context safety boundary",
    ],
    evidenceLocations: [
      "reports/p1023-founder-live-handoff-work-orders-report.md",
      "reports/p1032-founder-live-work-admission-model-report.md",
      "reports/p1367-secrets-providers-tool-governance-final-validation-report.md",
      "reports/p1371-agent-work-order-runtime-report.md",
    ],
    rawLogsIncluded: false,
    rawJsonIncluded: false,
    rawPolicyDumpIncluded: false,
  };
}

function buildSelectedSkillToolContracts() {
  return [
    {
      label: "Founder discovery skill",
      selectedFor: "Founder Q&A and requirements clarification",
      contractScope: "selected skill contract summary only",
      allowedUse: "summarize next founder question",
      executionAllowed: false,
      fullToolRegistryLoaded: false,
    },
    {
      label: "PRD drafting skill",
      selectedFor: "PRD field completion and acceptance criteria",
      contractScope: "selected skill contract summary only",
      allowedUse: "draft local PRD outline from scoped packet",
      executionAllowed: false,
      fullToolRegistryLoaded: false,
    },
    {
      label: "Validation planning tool contract",
      selectedFor: "Validation command planning",
      contractScope: "selected tool contract summary only",
      allowedUse: "list validation command names for operator review",
      executionAllowed: false,
      fullToolRegistryLoaded: false,
    },
  ];
}

function buildBudgetPolicyLimits() {
  return {
    maxUsdPerRun: 0,
    maxUsdPerTask: 0,
    maxUsdPerDay: 0,
    maxTokensPerRun: 0,
    requiresOperatorApprovalAboveUsd: 0,
    spendAllowed: false,
    providerDispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    costImpact: "No provider calls, model calls, tool execution, network calls, deploy, package creation, or provider spend.",
  };
}

function buildPolicyLimits() {
  return {
    runtimeOwnsFullRegistries: true,
    agentReceivesOnly: [...AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES],
    forbiddenContext: [
      "all tools",
      "all MCP schemas",
      "all skills",
      "all agents",
      "all policies",
      "all memory",
      "secret values",
      "provider payloads",
      "unredacted private IDs",
      "unredacted structured payload dumps",
      "unredacted logs",
      "policy dump contents",
    ],
    approvalRequiredBeforeDispatch: true,
    dispatchAllowed: false,
    executionAllowed: false,
    mutationAllowed: false,
    networkAllowed: false,
    spendAllowed: false,
  };
}

function buildWorkOrderPackets(workOrdersData = {}, admissionData = {}) {
  const admissionsByLabel = new Map(
    (admissionData.workAdmissions || []).map((entry) => [entry.sourceWorkOrderLabel, entry]),
  );

  return (workOrdersData.workOrderRows || []).map((row, index) => {
    const admission = admissionsByLabel.get(row.title) || {};
    return {
      packetLabel: row.title || `Agent work packet ${index + 1}`,
      ownerAgentCapability: row.ownerCapability || OWNER_CAPABILITY,
      proposedAgent: row.proposedAgent || admission.proposedAgentLane || "NEXUS planning agent",
      taskSummary: row.proposedWork || admission.proposedOutcome || "Prepare governed planning work from scoped context.",
      selectedContextRefs: [
        "taskContract",
        "selectedProjectProfile",
        "scopedMemoryPacket",
        "trustedContextPacket",
        "selectedSkillToolContracts",
        "budgetPolicyLimits",
        "policyLimits",
        "evidenceRefs",
      ],
      nextAction: admission.nextAction || row.nextAction || "Review scoped packet before P137.3 dry-run planning.",
      blocker: admission.blockers?.[0] || row.blocker || "Dispatch remains blocked by P137 safety boundary.",
      disabledReason: DISABLED_REASON,
      evidenceRefs: [...new Set([...(row.evidenceRefs || []), ...(admission.evidenceRefs || [])])],
      activityLocation: admission.activityLocation || row.activityLocation || "reports/os-phase-status-report.md",
      costImpact: admission.costImpact || row.costImpact || "No provider spend.",
      dispatchAllowed: false,
      executionAllowed: false,
      toolExecutionAllowed: false,
      providerCallsAllowed: false,
      dbRuntimeWritesAllowed: false,
      projectMutationAllowed: false,
      networkCallsAllowed: false,
      spendAllowed: false,
      fullRegistryLoaded: false,
    };
  });
}

export function buildAgentWorkOrderRuntimeModel(input = {}) {
  const founderIdeaSummary = normalizeFounderIdea(input.founderIdeaSummary);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const workOrdersEnvelope = input.workOrdersEnvelope || buildFounderLiveHandoffWorkOrders({ founderIdea: founderIdeaSummary });
  const workAdmissionEnvelope = input.workAdmissionEnvelope || buildFounderLiveWorkAdmission({
    founderIdea: founderIdeaSummary,
    workOrdersEnvelope,
  });
  const workOrdersData = workOrdersEnvelope.data || {};
  const admissionData = workAdmissionEnvelope.data || {};
  const taskContract = inferTaskContract(founderIdeaSummary);
  const selectedProjectProfile = buildSelectedProjectProfile(founderIdeaSummary);
  const scopedMemoryPacket = buildScopedMemoryPacket(founderIdeaSummary, workOrdersData);
  const trustedContextPacket = buildTrustedContextPacket(workOrdersEnvelope, workAdmissionEnvelope);
  const selectedSkillToolContracts = buildSelectedSkillToolContracts();
  const budgetPolicyLimits = buildBudgetPolicyLimits();
  const policyLimits = buildPolicyLimits();
  const workOrderPackets = buildWorkOrderPackets(workOrdersData, admissionData);
  const packetPayload = {
    taskContract,
    selectedProjectProfile,
    scopedMemoryPacket,
    trustedContextPacket,
    selectedSkillToolContracts,
    budgetPolicyLimits,
    policyLimits,
    workOrderPackets,
  };
  const redactionSummary = summarizeRedaction(packetPayload);

  return {
    phase: AGENT_WORK_ORDER_RUNTIME_PHASE,
    version: AGENT_WORK_ORDER_RUNTIME_VERSION,
    mode: "agent-work-order-runtime-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    currentState: "scoped_work_order_model_ready_execution_blocked",
    sourceWorkOrderPhase: workOrdersEnvelope.phase,
    sourceWorkAdmissionPhase: workAdmissionEnvelope.phase,
    modeGuard,
    runtimeOwnsFullRegistries: true,
    agentReceivesOnly: [...AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES],
    taskContract,
    selectedProjectProfile,
    scopedMemoryPacket,
    trustedContextPacket,
    selectedSkillToolContracts,
    budgetPolicyLimits,
    policyLimits,
    workOrderPackets,
    packetCount: workOrderPackets.length,
    dispatchablePacketCount: 0,
    executablePacketCount: 0,
    mutationCandidateCount: 0,
    providerSpendCandidateCount: 0,
    evidenceRefs: [
      "reports/p1372-agent-work-order-runtime-report.md",
      ...(trustedContextPacket.evidenceLocations || []),
    ],
    auditRefs: ["reports/p1372-agent-work-order-runtime-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    ownerAgentCapability: OWNER_CAPABILITY,
    nextAction: "Route this scoped model to P137.3 dispatch dry-run planning without dispatching agents.",
    blockers: [
      "Full registries are runtime-owned and not loaded into agent context.",
      "Provider/model calls remain blocked.",
      "Tool execution and MCP startup remain blocked.",
      "Agent dispatch remains blocked.",
      "DB/runtime writes and project mutation remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    costImpact: "Zero-spend scoped packet model. No provider calls, model calls, tool execution, network calls, deploy, package creation, or provider spend.",
    redaction: {
      changed: redactionSummary.changed,
      redactionCount: redactionSummary.redactionCount,
    },
    safetyFlags: blockedSafetyFlags(),
    ...blockedSafetyFlags(),
  };
}

export function validateAgentWorkOrderRuntimeModel(model = {}) {
  const errors = [];
  if (model.phase !== AGENT_WORK_ORDER_RUNTIME_PHASE) errors.push("phase must be P137.2");
  if (model.version !== AGENT_WORK_ORDER_RUNTIME_VERSION) errors.push("version must be 1.0");
  if (model.mode !== "agent-work-order-runtime-model") errors.push("mode must be agent-work-order-runtime-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain read-only local model metadata");
  if (model.runtimeOwnsFullRegistries !== true) errors.push("runtime must own full registries");
  if (!Array.isArray(model.agentReceivesOnly) || !AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => model.agentReceivesOnly.includes(name))) {
    errors.push("agentReceivesOnly must include only scoped packet names");
  }
  for (const field of AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES) {
    if (!(field in model)) errors.push(`${field} missing`);
  }
  if (!model.taskContract?.title || !Array.isArray(model.taskContract?.acceptanceCriteria)) errors.push("taskContract must include title and acceptance criteria");
  if (model.selectedProjectProfile?.privateRawIdVisible !== false || model.selectedProjectProfile?.projectMutationAllowed !== false) errors.push("selectedProjectProfile must hide raw IDs and block mutation");
  if (model.scopedMemoryPacket?.fullMemoryLoaded !== false) errors.push("scopedMemoryPacket must not load full memory");
  if (model.trustedContextPacket?.rawLogsIncluded !== false || model.trustedContextPacket?.rawJsonIncluded !== false || model.trustedContextPacket?.rawPolicyDumpIncluded !== false) errors.push("trustedContextPacket must avoid raw dumps");
  if (!Array.isArray(model.selectedSkillToolContracts) || model.selectedSkillToolContracts.length < 3) errors.push("selectedSkillToolContracts must include selected summaries");
  if (!model.selectedSkillToolContracts?.every((entry) => entry.executionAllowed === false && entry.fullToolRegistryLoaded === false)) errors.push("selected contracts must not execute or load full tool registry");
  if (model.budgetPolicyLimits?.spendAllowed !== false || model.budgetPolicyLimits?.maxUsdPerRun !== 0 || model.budgetPolicyLimits?.maxTokensPerRun !== 0) errors.push("budget limits must remain zero-authority");
  if (model.policyLimits?.dispatchAllowed !== false || model.policyLimits?.executionAllowed !== false || model.policyLimits?.mutationAllowed !== false) errors.push("policy limits must block dispatch, execution, and mutation");
  if (!Array.isArray(model.workOrderPackets) || model.workOrderPackets.length < 5) errors.push("workOrderPackets must cover existing work-order rows");
  if (model.packetCount !== model.workOrderPackets?.length || model.dispatchablePacketCount !== 0 || model.executablePacketCount !== 0 || model.mutationCandidateCount !== 0 || model.providerSpendCandidateCount !== 0) errors.push("packet counts must remain blocked");
  for (const packet of model.workOrderPackets || []) {
    for (const field of ["packetLabel", "ownerAgentCapability", "proposedAgent", "taskSummary", "selectedContextRefs", "nextAction", "blocker", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in packet)) errors.push(`${packet.packetLabel || "packet"}.${field} missing`);
    }
    if (!AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => packet.selectedContextRefs?.includes(name))) errors.push(`${packet.packetLabel || "packet"} missing scoped context refs`);
    for (const flag of ["dispatchAllowed", "executionAllowed", "toolExecutionAllowed", "providerCallsAllowed", "dbRuntimeWritesAllowed", "projectMutationAllowed", "networkCallsAllowed", "spendAllowed", "fullRegistryLoaded"]) {
      if (packet[flag] !== false) errors.push(`${packet.packetLabel || "packet"}.${flag} must be false`);
    }
  }
  for (const flag of AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must be false`);
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!Array.isArray(model.evidenceRefs) || !Array.isArray(model.auditRefs) || !Array.isArray(model.activityRefs)) errors.push("evidenceRefs, auditRefs, and activityRefs must be arrays");
  if (!model.ownerAgentCapability || !model.nextAction || !model.disabledReason || !model.costImpact) errors.push("operator-facing summary fields are required");
  if (typeof model.redaction?.changed !== "boolean" || typeof model.redaction?.redactionCount !== "number") errors.push("model redaction summary is required");

  const serialized = JSON.stringify(model);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serialized)) errors.push("model must not expose fake runnable work-order actions");
  if (/raw json|raw logs|raw policy dump|raw registry dump|raw memory dump|raw tool dump/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildAgentWorkOrderRuntimeEnvelope(input = {}) {
  const model = buildAgentWorkOrderRuntimeModel(input);
  const validation = validateAgentWorkOrderRuntimeModel(model);
  const envelope = createPassResult({
    phase: AGENT_WORK_ORDER_RUNTIME_PHASE,
    mode: "agent-work-order-runtime-model",
    source: "shared/agentWorkOrderRuntimeModel.js",
    summary: "Scoped agent work order runtime model is ready for dry-run planning while dispatch and execution remain blocked.",
    data: model,
    evidence: model.evidenceRefs,
    warnings: [
      "P137.2 is read-only model work. It does not dispatch agents, execute tools, call providers/models, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
    ],
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    errors: [
      ...(envelope.errors || []),
      ...validation.errors,
      ...envelopeValidation.errors,
    ],
  };
}
