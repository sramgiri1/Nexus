import { buildModeGuardResult, isLiveMode } from "../shared/modeGuard.js";
import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";

export const LIVE_EXECUTION_PHASE = "P79.1";

export const LIVE_EXECUTION_CAPABILITIES = [
  "founderIntakeRuntime",
  "autonomousQna",
  "prdGeneration",
  "agentDispatch",
  "providerCalls",
  "toolExecution",
  "workerExecution",
  "projectMutation",
  "dbWrites",
  "networkCalls",
  "deployExecution",
  "releaseExecution",
  "exportExecution",
  "packageCreation",
  "authMutation",
  "providerSpend",
];

export const LIVE_EXECUTION_REQUIRED_EVIDENCE = [
  "operatorApproval",
  "budgetLimit",
  "scopeBoundary",
  "rollbackPlan",
  "activityLedger",
  "costLedger",
  "redactionCheck",
];

const DEFAULT_DISABLED_REASON = "Live capability is blocked until an explicit live subphase enables it with approval, scope, budget, evidence, and rollback records.";

export function createLiveExecutionCapabilityGate(capability, overrides = {}) {
  return {
    capability,
    status: overrides.status || "blocked",
    enabled: overrides.enabled === true,
    modeRequired: "live",
    ownerCapability: overrides.ownerCapability || "NEXUS OS Runtime Governance",
    disabledReason: overrides.disabledReason || DEFAULT_DISABLED_REASON,
    nextAction: overrides.nextAction || "Complete the matching live runtime subphase and attach approval evidence.",
    blockers: overrides.blockers || [...LIVE_EXECUTION_REQUIRED_EVIDENCE],
    evidenceLocation: overrides.evidenceLocation || "reports/live-execution-gate-report.md",
    activityLocation: overrides.activityLocation || "reports/os-phase-status-report.md",
    costImpact: overrides.costImpact || "No spend in P79.1; cost gate remains blocked.",
    approvalRequired: overrides.approvalRequired !== false,
    rollbackRequired: overrides.rollbackRequired !== false,
    commandCenterVisible: overrides.commandCenterVisible !== false,
  };
}

export function buildLiveExecutionGate(options = {}) {
  const mode = options.mode || "unknown";
  const modeGuard = buildModeGuardResult(mode, ["live"]);
  const capabilityOverrides = options.capabilityOverrides || {};
  const capabilities = LIVE_EXECUTION_CAPABILITIES.map((capability) =>
    createLiveExecutionCapabilityGate(capability, capabilityOverrides[capability] || {}),
  );
  const enabledCapabilities = capabilities.filter((gate) => gate.enabled);
  const dangerousEnabled = enabledCapabilities.filter((gate) =>
    [
      "providerCalls",
      "toolExecution",
      "workerExecution",
      "projectMutation",
      "dbWrites",
      "networkCalls",
      "deployExecution",
      "releaseExecution",
      "exportExecution",
      "packageCreation",
      "authMutation",
      "providerSpend",
    ].includes(gate.capability),
  );
  const ok = isLiveMode(mode) && dangerousEnabled.length === 0;
  const envelopeFactory = ok ? createPassResult : createBlockedResult;

  return envelopeFactory({
    phase: LIVE_EXECUTION_PHASE,
    mode,
    source: "live-execution/liveExecutionGate.js",
    summary: ok
      ? "Live mode is recognized, but runtime capabilities remain blocked by default."
      : "Live execution is blocked until mode and capability gates are satisfied.",
    data: {
      modeGuard,
      capabilities,
      requiredEvidence: LIVE_EXECUTION_REQUIRED_EVIDENCE,
      dangerousEnabled: dangerousEnabled.map((gate) => gate.capability),
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
    warnings: ok ? [] : [modeGuard.reason || DEFAULT_DISABLED_REASON],
    evidence: ["contracts/os-roadmap/p79-execution-contracts.json", "docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md"],
  });
}
