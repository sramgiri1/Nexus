import { buildFounderLiveHandoffWorkOrders } from "../live-ready/founderLiveHandoffWorkOrders.js";
import { buildFounderLiveWorkAdmission } from "../live-ready/founderLiveWorkAdmission.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const AGENT_WORK_ORDER_RUNTIME_PHASE = "P137.2";
export const AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE = "P137.3";
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
const DISPATCH_DRY_RUN_OWNER = "NEXUS Agent Work Order Dispatch Dry Run";
const DISPATCH_DRY_RUN_DISABLED_REASON = "P137.3 is a non-runnable dispatch dry run. It prepares no provider payload, tool payload, executable command, runtime dispatch request, DB/runtime write, project mutation, deploy, release, export, package, network call, or spend.";
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

function buildDispatchDryRunRows(runtimeModel = {}) {
  return (runtimeModel.workOrderPackets || []).map((packet, index) => ({
    dryRunHandle: `agent-work-order-dispatch-dry-run-${index + 1}`,
    packetLabel: packet.packetLabel,
    proposedDispatchLane: packet.proposedAgent,
    taskSummary: packet.taskSummary,
    dispatchPosition: index + 1,
    dispatchState: "dry_run_ready_dispatch_blocked",
    dryRunReady: true,
    selectedContextRefs: [...AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES],
    ownerAgentCapability: packet.ownerAgentCapability || DISPATCH_DRY_RUN_OWNER,
    nextAction: "Review this dry-run row in P137.4 Agent Flow before any future explicit dispatch authority.",
    blockers: [
      packet.blocker || "Agent dispatch remains blocked.",
      "Provider/model calls remain blocked.",
      "Tool execution and MCP startup remain blocked.",
      "DB/runtime writes and project mutation remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISPATCH_DRY_RUN_DISABLED_REASON,
    evidenceRefs: [...new Set(["reports/p1373-agent-work-order-runtime-report.md", ...(packet.evidenceRefs || [])])],
    auditRefs: ["reports/p1373-agent-work-order-runtime-report.md"],
    activityLocation: packet.activityLocation || "reports/os-phase-status-report.md",
    costImpact: packet.costImpact || "No provider spend.",
    providerPayload: null,
    toolPayload: null,
    executableCommand: null,
    runtimeDispatchRequest: null,
    dispatchAllowed: false,
    executionAllowed: false,
    toolExecutionAllowed: false,
    providerCallsAllowed: false,
    modelCallsAllowed: false,
    mcpServerStartupAllowed: false,
    dbRuntimeWritesAllowed: false,
    projectMutationAllowed: false,
    networkCallsAllowed: false,
    spendAllowed: false,
    fullRegistryLoaded: false,
  }));
}

function buildDispatchGateRows(runtimeModel = {}) {
  return [
    {
      gateLabel: "Scoped context packet",
      currentState: "dry-run evidence ready",
      requiredBeforeDispatch: true,
      satisfiedForDryRun: runtimeModel.packetCount > 0,
      liveAuthoritySatisfied: false,
      bypassAllowed: false,
      nextAction: "Keep agent context limited to selected task, project, memory, trusted context, skill/tool, budget, policy, and evidence fields.",
      disabledReason: "Scoped packet readiness does not grant dispatch or execution authority.",
    },
    {
      gateLabel: "Provider and model boundary",
      currentState: "blocked",
      requiredBeforeDispatch: true,
      satisfiedForDryRun: true,
      liveAuthoritySatisfied: false,
      bypassAllowed: false,
      nextAction: "Keep provider/model calls blocked until a later explicit authority phase.",
      disabledReason: "Provider/model calls are not enabled by P137.3.",
    },
    {
      gateLabel: "Tool and MCP boundary",
      currentState: "blocked",
      requiredBeforeDispatch: true,
      satisfiedForDryRun: true,
      liveAuthoritySatisfied: false,
      bypassAllowed: false,
      nextAction: "Keep tool execution and MCP startup blocked until a later explicit authority phase.",
      disabledReason: "Tool execution and MCP startup are not enabled by P137.3.",
    },
    {
      gateLabel: "Runtime and project mutation boundary",
      currentState: "blocked",
      requiredBeforeDispatch: true,
      satisfiedForDryRun: true,
      liveAuthoritySatisfied: false,
      bypassAllowed: false,
      nextAction: "Keep DB/runtime writes and project mutation blocked until a later explicit authority phase.",
      disabledReason: "DB/runtime writes and project mutation are not enabled by P137.3.",
    },
    {
      gateLabel: "Cost and release boundary",
      currentState: "blocked",
      requiredBeforeDispatch: true,
      satisfiedForDryRun: true,
      liveAuthoritySatisfied: false,
      bypassAllowed: false,
      nextAction: "Keep deploy, release, export, package, network, and spend authority blocked.",
      disabledReason: "Deploy, release, export, package, network calls, and spend are not enabled by P137.3.",
    },
  ];
}

function buildBlockedAuthorityRows() {
  return AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.map((flag) => ({
    authorityFlag: flag,
    currentState: "blocked",
    allowed: false,
    candidateCount: 0,
    disabledReason: DISPATCH_DRY_RUN_DISABLED_REASON,
  }));
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

export function buildAgentWorkOrderDispatchDryRun(input = {}) {
  const runtimeModel = input.runtimeModel || buildAgentWorkOrderRuntimeModel(input);
  const sourceValidation = validateAgentWorkOrderRuntimeModel(runtimeModel);
  const dispatchRows = sourceValidation.valid ? buildDispatchDryRunRows(runtimeModel) : [];
  const gateRows = buildDispatchGateRows(runtimeModel);
  const blockedAuthorityRows = buildBlockedAuthorityRows();
  const dryRunPayload = {
    dispatchRows,
    gateRows,
    blockedAuthorityRows,
  };
  const redactionSummary = summarizeRedaction(dryRunPayload);

  return {
    phase: AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE,
    version: AGENT_WORK_ORDER_RUNTIME_VERSION,
    sourceModelPhase: runtimeModel.phase,
    sourceModelVersion: runtimeModel.version,
    sourceModelValidation: sourceValidation.valid ? "valid" : "invalid",
    sourceModelErrors: [...sourceValidation.errors],
    mode: "agent-work-order-dispatch-dry-run",
    dryRunOnly: true,
    nonRunnable: true,
    localOnly: true,
    commandCenterVisible: true,
    currentState: sourceValidation.valid
      ? "dispatch_dry_run_ready_dispatch_blocked"
      : "dispatch_dry_run_blocked_invalid_source_model",
    runtimeOwnsFullRegistries: true,
    agentReceivesOnly: [...AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES],
    dispatchSummary: {
      dryRunReady: sourceValidation.valid,
      sourcePacketCount: runtimeModel.packetCount || 0,
      dryRunCandidateCount: dispatchRows.length,
      blockedDryRunCandidateCount: dispatchRows.length,
      dispatchableCandidateCount: 0,
      executableCandidateCount: 0,
      providerCallCandidateCount: 0,
      modelCallCandidateCount: 0,
      toolExecutionCandidateCount: 0,
      mcpStartupCandidateCount: 0,
      dbRuntimeWriteCandidateCount: 0,
      projectMutationCandidateCount: 0,
      networkCallCandidateCount: 0,
      providerSpendCandidateCount: 0,
    },
    dispatchRows,
    gateRows,
    blockedAuthorityRows,
    evidenceRefs: [
      "reports/p1373-agent-work-order-runtime-report.md",
      ...(runtimeModel.evidenceRefs || []),
    ],
    auditRefs: [
      "reports/p1373-agent-work-order-runtime-report.md",
      ...(runtimeModel.auditRefs || []),
    ],
    activityRefs: runtimeModel.activityRefs || ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    ownerAgentCapability: DISPATCH_DRY_RUN_OWNER,
    nextAction: "Route this dry run to P137.4 Agent Flow UX without dispatching agents.",
    blockers: [
      "P137.3 dry-run rows are local and non-runnable.",
      "Agent dispatch remains blocked.",
      "Provider/model calls remain blocked.",
      "Tool execution and MCP startup remain blocked.",
      "DB/runtime writes and project mutation remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISPATCH_DRY_RUN_DISABLED_REASON,
    costImpact: "Zero-spend dispatch dry run. No provider calls, model calls, tool execution, network calls, deploy, package creation, or provider spend.",
    providerPayload: null,
    toolPayload: null,
    executableCommand: null,
    runtimeDispatchRequest: null,
    redaction: {
      changed: redactionSummary.changed,
      redactionCount: redactionSummary.redactionCount,
    },
    safetyFlags: blockedSafetyFlags(),
    candidateCounts: {
      providerCallCandidates: 0,
      modelCallCandidates: 0,
      toolExecutionCandidates: 0,
      mcpStartupCandidates: 0,
      dbRuntimeWriteCandidates: 0,
      agentDispatchCandidates: 0,
      projectMutationCandidates: 0,
      deployCandidates: 0,
      releaseCandidates: 0,
      exportCandidates: 0,
      packageCandidates: 0,
      networkCallCandidates: 0,
      providerSpendCandidates: 0,
    },
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

export function validateAgentWorkOrderDispatchDryRun(dryRun = {}) {
  const errors = [];
  if (dryRun.phase !== AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE) errors.push("phase must be P137.3");
  if (dryRun.version !== AGENT_WORK_ORDER_RUNTIME_VERSION) errors.push("version must be 1.0");
  if (dryRun.sourceModelPhase !== AGENT_WORK_ORDER_RUNTIME_PHASE) errors.push("source model phase must be P137.2");
  if (dryRun.sourceModelValidation !== "valid" || dryRun.sourceModelErrors?.length !== 0) errors.push("source model must validate");
  if (dryRun.mode !== "agent-work-order-dispatch-dry-run") errors.push("mode must be agent-work-order-dispatch-dry-run");
  if (dryRun.dryRunOnly !== true || dryRun.nonRunnable !== true || dryRun.localOnly !== true) errors.push("dry run must be local and non-runnable");
  if (dryRun.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (dryRun.runtimeOwnsFullRegistries !== true) errors.push("runtime must own full registries");
  if (!Array.isArray(dryRun.agentReceivesOnly) || !AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => dryRun.agentReceivesOnly.includes(name))) {
    errors.push("agentReceivesOnly must include scoped packet names");
  }
  if (dryRun.dispatchSummary?.dryRunReady !== true) errors.push("dispatch dry run must be ready only when source model validates");
  if (dryRun.dispatchSummary?.sourcePacketCount !== dryRun.dispatchRows?.length) errors.push("dry-run row count must match source packets");
  for (const countField of [
    "dispatchableCandidateCount",
    "executableCandidateCount",
    "providerCallCandidateCount",
    "modelCallCandidateCount",
    "toolExecutionCandidateCount",
    "mcpStartupCandidateCount",
    "dbRuntimeWriteCandidateCount",
    "projectMutationCandidateCount",
    "networkCallCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (dryRun.dispatchSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  if (!Array.isArray(dryRun.dispatchRows) || dryRun.dispatchRows.length < 5) errors.push("dispatchRows must cover source work-order packets");
  for (const row of dryRun.dispatchRows || []) {
    for (const field of ["dryRunHandle", "packetLabel", "proposedDispatchLane", "taskSummary", "dispatchPosition", "dispatchState", "selectedContextRefs", "ownerAgentCapability", "nextAction", "blockers", "disabledReason", "evidenceRefs", "auditRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.packetLabel || "dispatch row"}.${field} missing`);
    }
    if (!AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => row.selectedContextRefs?.includes(name))) errors.push(`${row.packetLabel || "dispatch row"} missing scoped context refs`);
    if (row.dispatchState !== "dry_run_ready_dispatch_blocked" || row.dryRunReady !== true) errors.push(`${row.packetLabel || "dispatch row"} must remain blocked dry-run ready`);
    if (row.providerPayload !== null || row.toolPayload !== null || row.executableCommand !== null || row.runtimeDispatchRequest !== null) errors.push(`${row.packetLabel || "dispatch row"} payloads and runtime request must be null`);
    for (const flag of ["dispatchAllowed", "executionAllowed", "toolExecutionAllowed", "providerCallsAllowed", "modelCallsAllowed", "mcpServerStartupAllowed", "dbRuntimeWritesAllowed", "projectMutationAllowed", "networkCallsAllowed", "spendAllowed", "fullRegistryLoaded"]) {
      if (row[flag] !== false) errors.push(`${row.packetLabel || "dispatch row"}.${flag} must be false`);
    }
  }
  if (!Array.isArray(dryRun.gateRows) || dryRun.gateRows.length < 5) errors.push("gateRows must describe dispatch gates");
  for (const gate of dryRun.gateRows || []) {
    if (gate.liveAuthoritySatisfied !== false || gate.bypassAllowed !== false) errors.push(`${gate.gateLabel || "gate"}.live authority and bypass must remain false`);
  }
  if (!Array.isArray(dryRun.blockedAuthorityRows) || dryRun.blockedAuthorityRows.length !== AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.length) errors.push("blockedAuthorityRows must cover safety flags");
  for (const row of dryRun.blockedAuthorityRows || []) {
    if (row.allowed !== false || row.candidateCount !== 0 || row.currentState !== "blocked") errors.push(`${row.authorityFlag || "authority"}.authority must remain blocked`);
  }
  for (const flag of AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES) {
    if (dryRun[flag] !== false) errors.push(`${flag} must be false`);
    if (dryRun.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (Object.values(dryRun.candidateCounts || {}).some((value) => value !== 0)) errors.push("all authority candidate counts must remain zero");
  if (!Array.isArray(dryRun.evidenceRefs) || !Array.isArray(dryRun.auditRefs) || !Array.isArray(dryRun.activityRefs)) errors.push("evidenceRefs, auditRefs, and activityRefs must be arrays");
  if (!dryRun.ownerAgentCapability || !dryRun.nextAction || !dryRun.disabledReason || !dryRun.costImpact) errors.push("operator-facing summary fields are required");
  if (dryRun.providerPayload !== null || dryRun.toolPayload !== null || dryRun.executableCommand !== null || dryRun.runtimeDispatchRequest !== null) errors.push("top-level payloads and runtime request must be null");
  if (typeof dryRun.redaction?.changed !== "boolean" || typeof dryRun.redaction?.redactionCount !== "number") errors.push("dry-run redaction summary is required");

  const serialized = JSON.stringify(dryRun);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("dry run must not expose raw private IDs");
  if (/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|sqliteEntity|recordRef|requestKey/i.test(serialized)) errors.push("dry run must not expose tokens, DB URLs, DB table names, or record keys");
  if (/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serialized)) errors.push("dry run must not expose fake runnable work-order actions");
  if (/raw JSON|raw logs|raw policy dump|raw registry dump|raw memory dump|raw tool dump/i.test(serialized)) errors.push("dry run must not expose raw dumps");
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

export function buildAgentWorkOrderDispatchDryRunEnvelope(input = {}) {
  const dryRun = buildAgentWorkOrderDispatchDryRun(input);
  const validation = validateAgentWorkOrderDispatchDryRun(dryRun);
  const envelope = createPassResult({
    phase: AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE,
    mode: "agent-work-order-dispatch-dry-run",
    source: "shared/agentWorkOrderRuntimeModel.js",
    summary: "Scoped agent work order dispatch dry run is ready for Agent Flow display while dispatch and execution remain blocked.",
    data: dryRun,
    evidence: dryRun.evidenceRefs,
    warnings: [
      "P137.3 is non-runnable dry-run work. It does not dispatch agents, execute tools, call providers/models, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
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
