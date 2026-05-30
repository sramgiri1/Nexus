import {
  PROVIDER_GOVERNANCE_FLAG_NAMES,
  PROVIDER_GOVERNANCE_MODEL_PHASE,
  PROVIDER_GOVERNANCE_MODEL_VERSION,
  buildProviderGovernanceModel,
  validateProviderGovernanceModel,
} from "./providerGovernanceModel.js";

export const PROVIDER_GOVERNANCE_DRY_RUN_PHASE = "P136.3";

const DRY_RUN_MODE = "provider-governance-dry-run";
const DEFAULT_REQUESTED_CAPABILITY = "Founder feasibility provider decision";
const DEFAULT_PROVIDER_CATEGORY = "model-assisted analysis";
const DEFAULT_TOOL_CATEGORY = "governed analysis tooling";

const ZERO_AUTHORITY_FLAGS = Object.freeze(
  PROVIDER_GOVERNANCE_FLAG_NAMES.reduce((acc, flag) => {
    acc[flag] = false;
    return acc;
  }, {
    dryRunExecutable: false,
    dryRunHasExecutableCommand: false,
    providerPayloadPrepared: false,
    toolPayloadPrepared: false,
    approvalWritePrepared: false,
    budgetSpendPrepared: false,
  }),
);

function displayText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildDecisionRows(model) {
  const providerRows = model.providerEligibilityRows.map((row) => ({
    lane: "provider eligibility",
    label: row.label,
    currentState: "blocked",
    eligibility: row.metadataReady ? "metadata-ready-execution-blocked" : "metadata-missing-execution-blocked",
    disabledReason: row.disabledReason,
    nextAction: row.nextAction,
    candidateCount: 0,
    executableCandidateCount: 0,
    providerCallsAllowed: false,
    modelCallsAllowed: false,
    toolExecutionAllowed: false,
    credentialValuesReadable: false,
  }));

  const modelRows = model.modelAccessRows.map((row) => ({
    lane: "model access",
    label: row.label,
    currentState: "blocked",
    eligibility: "model-access-blocked",
    disabledReason: row.disabledReason,
    nextAction: row.nextAction,
    candidateCount: 0,
    executableCandidateCount: 0,
    providerCallsAllowed: false,
    modelCallsAllowed: false,
    toolExecutionAllowed: false,
    credentialValuesReadable: false,
  }));

  const toolRows = model.toolContractRows.map((row) => ({
    lane: "tool contract",
    label: row.toolName,
    currentState: "blocked",
    eligibility: row.approvalRequired ? "requires-approval-execution-blocked" : "contract-metadata-execution-blocked",
    disabledReason: row.disabledReason,
    nextAction: row.nextAction,
    candidateCount: 0,
    executableCandidateCount: 0,
    providerCallsAllowed: false,
    modelCallsAllowed: false,
    toolExecutionAllowed: false,
    credentialValuesReadable: false,
  }));

  return [...providerRows, ...modelRows, ...toolRows];
}

function buildApprovalNeeds(model) {
  return model.approvalGateRows.map((row) => ({
    label: row.label,
    currentState: "blocked",
    approvalRequired: row.approvalRequired === true,
    approvalWritesAllowed: false,
    disabledReason: row.disabledReason,
    nextAction: row.nextAction,
  }));
}

function buildBudgetImpact(model) {
  return {
    mode: "estimate-only",
    budgetRowsReviewed: model.budgetPolicyRows.length,
    estimatedUsd: 0,
    maxUsdPerRun: 0,
    maxUsdPerTask: 0,
    maxUsdPerDay: 0,
    providerDispatchAllowed: false,
    workerExecutionAllowed: false,
    spendAllowed: false,
    disabledReason: "Provider/tool spend remains blocked; this dry run only explains future budget evidence needs.",
  };
}

export function buildProviderGovernanceDryRun(input = {}) {
  const sourceModel = input.providerGovernanceModel || buildProviderGovernanceModel();
  const sourceModelValidation = validateProviderGovernanceModel(sourceModel);
  const decisionRows = sourceModelValidation.valid ? buildDecisionRows(sourceModel) : [];
  const approvalNeeds = sourceModelValidation.valid ? buildApprovalNeeds(sourceModel) : [];
  const budgetImpact = sourceModelValidation.valid ? buildBudgetImpact(sourceModel) : buildBudgetImpact({ budgetPolicyRows: [] });

  return {
    phase: PROVIDER_GOVERNANCE_DRY_RUN_PHASE,
    sourceModelPhase: PROVIDER_GOVERNANCE_MODEL_PHASE,
    sourceModelVersion: PROVIDER_GOVERNANCE_MODEL_VERSION,
    sourceModelValidation: sourceModelValidation.valid ? "valid" : "invalid",
    sourceModelErrors: [...sourceModelValidation.errors],
    mode: DRY_RUN_MODE,
    dryRunOnly: true,
    nonRunnable: true,
    localOnly: true,
    commandCenterVisible: true,
    requestedCapability: displayText(input.requestedCapability, DEFAULT_REQUESTED_CAPABILITY),
    providerCategory: displayText(input.providerCategory, DEFAULT_PROVIDER_CATEGORY),
    toolCategory: displayText(input.toolCategory, DEFAULT_TOOL_CATEGORY),
    ownerCapability: "NEXUS Provider Governance Dry Run",
    currentState: "dry_run_ready_execution_blocked",
    eligibilityDecision: {
      status: "blocked",
      providerEligible: false,
      modelEligible: false,
      toolEligible: false,
      credentialValuesReadable: false,
      reason: "P136.3 explains provider/tool readiness only; live provider calls, model calls, tool execution, network calls, approvals, DB/runtime writes, agent dispatch, project mutation, deploy, release, export, package, and spend remain blocked.",
    },
    decisionRows,
    decisionRowCount: decisionRows.length,
    executableDecisionRowCount: 0,
    blockedReasons: [
      "Provider/model calls are not enabled.",
      "Tool execution and MCP server startup are not enabled.",
      "Credential values are not readable.",
      "Approval writes and budget spend are not enabled.",
      "DB/runtime writes, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend are not enabled.",
      ...sourceModel.blockers,
    ],
    approvalNeeds,
    approvalNeedCount: approvalNeeds.length,
    approvalWriteCandidateCount: 0,
    budgetImpact,
    evidenceRefs: [
      "reports/p1363-provider-dry-run-report.md",
      ...sourceModel.evidenceRefs,
    ],
    auditRefs: [
      "Activity Log > Provider Governance Dry Run",
      "OS Roadmap > P136.3",
      ...sourceModel.activityRefs,
    ],
    nextAction: "Route this dry run to P136.4 Provider Governance Command Center UX before any future live authority is considered.",
    disabledReason: "P136.3 is non-runnable dry-run work; it creates no provider payload, tool payload, approval write, budget spend, DB/runtime write, agent dispatch, project mutation, deploy, release, export, package, network call, or provider spend.",
    costImpact: "No provider/model call, tool execution, network call, deploy, package creation, or provider spend.",
    providerPayload: null,
    toolPayload: null,
    executableCommand: null,
    safetyFlags: { ...ZERO_AUTHORITY_FLAGS },
    candidateCounts: {
      providerCallCandidates: 0,
      modelCallCandidates: 0,
      toolExecutionCandidates: 0,
      mcpStartupCandidates: 0,
      approvalWriteCandidates: 0,
      budgetSpendCandidates: 0,
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
  };
}

export function validateProviderGovernanceDryRun(dryRun = buildProviderGovernanceDryRun()) {
  const errors = [];
  if (dryRun.phase !== PROVIDER_GOVERNANCE_DRY_RUN_PHASE) errors.push("phase must be P136.3");
  if (dryRun.sourceModelPhase !== PROVIDER_GOVERNANCE_MODEL_PHASE) errors.push("source model phase must be P136.2");
  if (dryRun.sourceModelVersion !== PROVIDER_GOVERNANCE_MODEL_VERSION) errors.push("source model version must be 1.0");
  if (dryRun.sourceModelValidation !== "valid" || dryRun.sourceModelErrors?.length !== 0) errors.push("source model must validate");
  if (dryRun.mode !== DRY_RUN_MODE) errors.push("mode must be provider-governance-dry-run");
  if (dryRun.dryRunOnly !== true || dryRun.nonRunnable !== true || dryRun.localOnly !== true) errors.push("dry run must be local and non-runnable");
  if (dryRun.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (dryRun.eligibilityDecision?.status !== "blocked") errors.push("eligibility decision must remain blocked");
  for (const key of ["providerEligible", "modelEligible", "toolEligible", "credentialValuesReadable"]) {
    if (dryRun.eligibilityDecision?.[key] !== false) errors.push(`eligibilityDecision.${key} must remain false`);
  }
  if (!Array.isArray(dryRun.decisionRows) || dryRun.decisionRows.length === 0) errors.push("decisionRows are required");
  if (!dryRun.decisionRows?.every((row) => row.currentState === "blocked" && row.executableCandidateCount === 0 && row.providerCallsAllowed === false && row.modelCallsAllowed === false && row.toolExecutionAllowed === false && row.credentialValuesReadable === false)) errors.push("decision rows must remain blocked");
  if (!Array.isArray(dryRun.blockedReasons) || dryRun.blockedReasons.length < 6) errors.push("blockedReasons must explain blocked authority");
  if (!Array.isArray(dryRun.approvalNeeds) || dryRun.approvalNeeds.length === 0) errors.push("approvalNeeds are required");
  if (dryRun.approvalNeeds?.some((row) => row.approvalWritesAllowed !== false || row.currentState !== "blocked")) errors.push("approval needs must not write approvals");
  if (dryRun.budgetImpact?.estimatedUsd !== 0 || dryRun.budgetImpact?.spendAllowed !== false || dryRun.budgetImpact?.providerDispatchAllowed !== false || dryRun.budgetImpact?.workerExecutionAllowed !== false) errors.push("budget impact must remain estimate-only and blocked");
  if (!dryRun.evidenceRefs?.includes("reports/p1363-provider-dry-run-report.md")) errors.push("dry-run report evidence is required");
  if (!dryRun.auditRefs?.includes("OS Roadmap > P136.3")) errors.push("OS Roadmap audit reference is required");
  if (!dryRun.ownerCapability || !dryRun.nextAction || !dryRun.disabledReason || !dryRun.costImpact) errors.push("operator fields are required");
  if (dryRun.providerPayload !== null || dryRun.toolPayload !== null || dryRun.executableCommand !== null) errors.push("payloads and executable command must remain null");
  const authorityFlags = Object.values(dryRun.safetyFlags || {}).filter((value) => typeof value === "boolean");
  if (!authorityFlags.length || !authorityFlags.every((value) => value === false)) errors.push("all safety flags must remain false");
  const candidateCounts = Object.values(dryRun.candidateCounts || {});
  if (!candidateCounts.length || !candidateCounts.every((value) => value === 0)) errors.push("all candidate counts must remain zero");
  const serialized = JSON.stringify(dryRun);
  if (/secret-ref-|sk-[A-Za-z0-9]|Bearer\s+|DATABASE_URL|providerBatchId|inputFileId|requestBody|headers/i.test(serialized)) errors.push("dry run must not expose secret references, tokens, provider payloads, or DB URLs");
  if (/call provider now|call model now|run tool now|execute tool now|start mcp now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(serialized)) errors.push("dry run must not expose fake runnable actions");
  return { valid: errors.length === 0, errors };
}
