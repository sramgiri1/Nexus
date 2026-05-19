import { LIVE_EXECUTION_REQUIRED_EVIDENCE } from "../live-execution/liveExecutionGate.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P82_PROVIDER_TOOL_GATE_PHASE = "P82.2";

export const PROVIDER_TOOL_READINESS_LABELS = ["Ready", "Needs setup", "Blocked by policy"];

const COMMON_EVIDENCE = [
  "reports/p822-provider-tool-gates-report.md",
  "reports/os-phase-status-report.md",
  "contracts/os-roadmap/p82-execution-contracts.json",
];

const PROVIDER_TOOL_GATE_PROFILES = [
  {
    id: "provider-calls",
    label: "Provider Calls",
    surface: "provider",
    capability: "providerCalls",
    readinessLabel: "Needs setup",
    currentState: "needs_setup",
    ownerCapability: "NEXUS Provider Governance",
    nextAction: "Attach provider policy, secret reference, budget limit, approval, and redaction evidence before any provider call can be admitted.",
    blockers: [
      "providerPolicyProfile",
      "secretReference",
      "budgetLimit",
      "operatorApproval",
      "redactionCheck",
      "costLedger",
    ],
    disabledReason: "Provider calls are not live-ready until credentials, policy, budget, redaction, activity, and cost evidence exist.",
    evidenceRefs: [...COMMON_EVIDENCE],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Potential provider spend remains blocked; no provider call or spend occurs in P82.2.",
  },
  {
    id: "provider-spend",
    label: "Provider Spend",
    surface: "provider",
    capability: "providerSpend",
    readinessLabel: "Blocked by policy",
    currentState: "blocked_by_policy",
    ownerCapability: "NEXUS Cost Governance",
    nextAction: "Complete explicit budget admission and cost ledger validation before spend can move out of blocked policy state.",
    blockers: [
      "budgetLimit",
      "costLedger",
      "operatorApproval",
      "approvalExpiry",
      "rollbackPlan",
    ],
    disabledReason: "Provider spend is policy-blocked until a later activation phase creates a bounded spend admission flow.",
    evidenceRefs: [...COMMON_EVIDENCE],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Zero spend in P82.2; spend remains disabled.",
  },
  {
    id: "read-only-tool-contracts",
    label: "Read-only Tool Contracts",
    surface: "tool",
    capability: "toolExecution",
    readinessLabel: "Needs setup",
    currentState: "needs_setup",
    ownerCapability: "NEXUS Tool Governance",
    nextAction: "Register selected read-only tool contracts with allowlist scope, audit evidence, redaction rules, and validation before execution admission.",
    blockers: [
      "toolContractRegistry",
      "toolAllowlistScope",
      "activityLedger",
      "redactionCheck",
      "operatorApproval",
    ],
    disabledReason: "Tool execution is not live-ready until selected tool contracts and audit evidence are present.",
    evidenceRefs: [...COMMON_EVIDENCE],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No direct spend in P82.2; downstream provider/tool costs remain blocked.",
  },
  {
    id: "mutation-capable-tools",
    label: "Mutation-capable Tools",
    surface: "tool",
    capability: "projectMutation",
    readinessLabel: "Blocked by policy",
    currentState: "blocked_by_policy",
    ownerCapability: "NEXUS Scope Boundary",
    nextAction: "Complete P82.4 project/DB mutation admission before mutation-capable tools can be considered for live use.",
    blockers: [
      "projectScope",
      "rollbackPlan",
      "backupEvidence",
      "operatorApproval",
      "validationCommands",
    ],
    disabledReason: "Mutation-capable tools are policy-blocked until project scope, rollback, backup, and validation gates exist.",
    evidenceRefs: [...COMMON_EVIDENCE],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No spend in P82.2; mutation-capable tools remain disabled.",
  },
];

function buildSummary(profiles) {
  return PROVIDER_TOOL_READINESS_LABELS.reduce((acc, label) => {
    acc[label] = profiles.filter((profile) => profile.readinessLabel === label).length;
    return acc;
  }, {});
}

export function buildProviderToolGateProfiles(options = {}) {
  const mode = options.mode || "live";
  const profiles = PROVIDER_TOOL_GATE_PROFILES.map((profile) => ({
    ...profile,
    requiredEvidence: [...LIVE_EXECUTION_REQUIRED_EVIDENCE],
    executionEnabled: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployExecutionAllowed: false,
    providerSpendAllowed: false,
    commandCenterVisible: true,
  }));

  return createPassResult({
    phase: P82_PROVIDER_TOOL_GATE_PHASE,
    mode,
    source: "live-ready/providerToolGateProfiles.js",
    summary: "Provider and tool live-readiness gate profiles are available; execution remains blocked.",
    data: {
      currentState: "provider_tool_live_readiness_gates_ready",
      nextAction: "Implement P82.3 worker execution gate, then expose combined live-readiness states in Command Center.",
      readinessSummary: buildSummary(profiles),
      profiles,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
    warnings: ["Readiness profiles are not execution admission. Provider calls and tool execution remain disabled."],
    evidence: [...COMMON_EVIDENCE],
  });
}

export function validateProviderToolGateProfiles(envelope = {}) {
  const errors = [];
  const profiles = envelope.data?.profiles || [];
  if (envelope.phase !== P82_PROVIDER_TOOL_GATE_PHASE) errors.push("phase must be P82.2");
  if (!Array.isArray(profiles) || profiles.length < 4) errors.push("profiles must include provider and tool surfaces");
  for (const profile of profiles) {
    if (!PROVIDER_TOOL_READINESS_LABELS.includes(profile.readinessLabel)) errors.push(`${profile.id} has invalid readinessLabel`);
    if (!profile.currentState) errors.push(`${profile.id} missing currentState`);
    if (!profile.nextAction) errors.push(`${profile.id} missing nextAction`);
    if (!profile.disabledReason) errors.push(`${profile.id} missing disabledReason`);
    if (!profile.ownerCapability) errors.push(`${profile.id} missing ownerCapability`);
    if (!Array.isArray(profile.blockers)) errors.push(`${profile.id} blockers must be an array`);
    if (!Array.isArray(profile.evidenceRefs)) errors.push(`${profile.id} evidenceRefs must be an array`);
    if (!profile.activityLocation) errors.push(`${profile.id} missing activityLocation`);
    if (!profile.costImpact) errors.push(`${profile.id} missing costImpact`);
    if (profile.executionEnabled !== false) errors.push(`${profile.id} executionEnabled must be false`);
    for (const flag of [
      "providerCallsAllowed",
      "toolExecutionAllowed",
      "projectMutationAllowed",
      "dbWritesAllowed",
      "deployExecutionAllowed",
      "providerSpendAllowed",
    ]) {
      if (profile[flag] !== false) errors.push(`${profile.id} ${flag} must be false`);
    }
  }
  return { valid: errors.length === 0, errors };
}
