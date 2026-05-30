import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  evaluateProviderCredentialReadiness,
  getProviderCredentialBoundary,
  summarizeProviderCredentialBoundary,
} from "../secrets/providerCredentialBoundary.js";
import { getSecretAccessPolicy } from "../secrets/secretAccessPolicy.js";
import {
  getToolPermissionMatrix,
  summarizeToolPermissionMatrix,
  validateToolPermissionMatrix,
} from "../tool-governance/toolPermissionMatrix.js";
import { createBudgetPolicy, summarizeBudgetPolicy } from "../cost-center/budgetModel.js";

export const PROVIDER_GOVERNANCE_MODEL_PHASE = "P136.2";
export const PROVIDER_GOVERNANCE_MODEL_VERSION = "1.0";
export const PROVIDER_GOVERNANCE_FLAG_NAMES = Object.freeze([
  "secretValuesReadable",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "mcpServerStartupAllowed",
  "networkCallsAllowed",
  "dbRuntimeWritesAllowed",
  "approvalWritesAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

const BLOCKED_SAFETY_FLAGS = Object.freeze(
  PROVIDER_GOVERNANCE_FLAG_NAMES.reduce((acc, flag) => {
    acc[flag] = false;
    return acc;
  }, {}),
);

const MODEL_ACCESS_ROWS = Object.freeze([
  {
    label: "Founder feasibility analysis",
    category: "model_access",
    currentState: "blocked_until_provider_governance",
    modelCallsAllowed: false,
    disabledReason: "Provider/model calls remain blocked until secret references, budget authority, and approval gates are validated.",
    nextAction: "Use P136.3 dry run to show required provider and approval gates.",
  },
  {
    label: "PRD drafting assistance",
    category: "model_access",
    currentState: "blocked_until_provider_governance",
    modelCallsAllowed: false,
    disabledReason: "PRD drafting remains local/deterministic until live provider access is separately approved.",
    nextAction: "Map the provider candidate and cost posture in P136.3.",
  },
  {
    label: "Agent work planning",
    category: "model_access",
    currentState: "blocked_until_provider_governance",
    modelCallsAllowed: false,
    disabledReason: "Agent planning cannot call models or dispatch agents from this model.",
    nextAction: "Keep work-order execution blocked until P137 and later approval phases.",
  },
]);

const APPROVAL_GATE_ROWS = Object.freeze([
  {
    label: "Provider credential value access",
    currentState: "requires_future_approval_gate",
    approvalRequired: true,
    approvalWritesAllowed: false,
    disabledReason: "Credential value access is blocked; this model only records metadata readiness.",
    nextAction: "Define approval capture and persistence in a future governed authority phase.",
  },
  {
    label: "Provider/model spend",
    currentState: "requires_budget_and_operator_approval",
    approvalRequired: true,
    approvalWritesAllowed: false,
    disabledReason: "Spend remains disabled and estimate-only.",
    nextAction: "Keep budget rows at zero-authority until an explicit spend phase enables them.",
  },
  {
    label: "Tool execution",
    currentState: "requires_tool_contract_and_runtime_gate",
    approvalRequired: true,
    approvalWritesAllowed: false,
    disabledReason: "Tool execution is blocked; only tool permission metadata is summarized.",
    nextAction: "Use P136.3 to preview blocked tool contract decisions.",
  },
]);

function buildSecretReferencePolicy() {
  const policy = getSecretAccessPolicy();
  return {
    phase: policy.phase,
    valueAccessAllowed: policy.valueAccessAllowed === true,
    metadataActions: [...policy.metadataActions],
    blockedActions: [...policy.blockedActions],
    productionRequiresApproval: policy.productionRequiresApproval === true,
    demoPublicDenied: policy.demoPublicDenied === true,
    currentState: "metadata_only",
    disabledReason: "Secret values are not readable; only display-safe metadata posture is available.",
  };
}

function buildProviderEligibilityRows(boundary = getProviderCredentialBoundary()) {
  return boundary.references.map((reference) => {
    const readiness = evaluateProviderCredentialReadiness(reference.provider);
    return {
      label: reference.label,
      provider: reference.provider,
      purpose: reference.purpose,
      credentialState: readiness,
      metadataReady: readiness === "metadata_ready",
      providerCallsAllowed: false,
      credentialValuesReadable: false,
      disabledReason: readiness === "metadata_ready"
        ? "Credential metadata exists, but provider calls and credential value access remain blocked."
        : "Credential metadata is not ready and provider calls remain blocked.",
      nextAction: readiness === "metadata_ready"
        ? "Review provider eligibility through the P136.3 dry run."
        : "Record only metadata readiness in the future provider governance model.",
    };
  });
}

function buildToolContractRows(matrix = getToolPermissionMatrix()) {
  return matrix.map((entry) => ({
    toolName: entry.toolId,
    agentLane: entry.agentId,
    scope: entry.projectScope,
    permission: entry.permission,
    approvalRequired: entry.approvalRequired === true,
    executionAllowed: false,
    allowedScopes: [...entry.allowedScopes],
    allowedMethods: [...entry.allowedMethods],
    dataClassificationsAllowed: [...entry.dataClassificationsAllowed],
    disabledReason: "Tool permission metadata is available, but tool execution remains blocked.",
    nextAction: entry.approvalRequired
      ? "Keep approval-gated until a future runtime authority phase."
      : "Use the dry run to decide whether this remains metadata-only.",
  }));
}

function buildBudgetPolicyRows() {
  const policies = [
    createBudgetPolicy({
      budgetPolicyId: "provider-governance-budget",
      scopeType: "provider",
      scopeId: "provider-governance",
      maxUsdPerRun: 0,
      maxUsdPerTask: 0,
      maxUsdPerDay: 0,
      maxTokensPerRun: 0,
      requiresApprovalAboveUsd: 0,
      providerDispatchAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      createdAt: "2026-05-30T00:00:00.000Z",
    }),
    createBudgetPolicy({
      budgetPolicyId: "tool-governance-budget",
      scopeType: "tool",
      scopeId: "tool-governance",
      maxUsdPerRun: 0,
      maxUsdPerTask: 0,
      maxUsdPerDay: 0,
      maxTokensPerRun: 0,
      requiresApprovalAboveUsd: 0,
      providerDispatchAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      createdAt: "2026-05-30T00:00:00.000Z",
    }),
  ];

  return policies.map((policy) => ({
    ...summarizeBudgetPolicy(policy),
    budgetPolicyId: "redacted-policy-label",
    scopeId: "display-safe-governance-scope",
    spendAllowed: false,
    disabledReason: "Budget posture is estimate-only with zero provider dispatch authority.",
    nextAction: "Keep spend blocked until provider spend is explicitly approved by a future phase.",
  }));
}

export function buildProviderGovernanceModel(options = {}) {
  const boundary = options.providerCredentialBoundary || getProviderCredentialBoundary();
  const toolMatrix = options.toolPermissionMatrix || getToolPermissionMatrix();
  const providerSummary = summarizeProviderCredentialBoundary();
  const toolSummary = summarizeToolPermissionMatrix(toolMatrix);

  return {
    phase: PROVIDER_GOVERNANCE_MODEL_PHASE,
    version: PROVIDER_GOVERNANCE_MODEL_VERSION,
    mode: "provider-governance-model",
    commandCenterVisible: true,
    currentState: "model_ready_execution_blocked",
    ownerCapability: "NEXUS Provider Governance",
    nextAction: "Route this model to P136.3 provider dry-run planning before any live provider/tool authority is considered.",
    disabledReason: "P136.2 is read-only model work; secret values, provider/model calls, tool execution, network calls, DB/runtime writes, agent dispatch, project mutation, deploy, export, package, and spend remain blocked.",
    secretReferencePolicy: buildSecretReferencePolicy(),
    providerEligibilityRows: buildProviderEligibilityRows(boundary),
    modelAccessRows: MODEL_ACCESS_ROWS.map((row) => ({ ...row })),
    toolContractRows: buildToolContractRows(toolMatrix),
    budgetPolicyRows: buildBudgetPolicyRows(),
    approvalGateRows: APPROVAL_GATE_ROWS.map((row) => ({ ...row })),
    safetyFlags: { ...BLOCKED_SAFETY_FLAGS },
    blockers: [
      "Secret values are not readable.",
      "Provider/model calls are not enabled.",
      "Tool execution and MCP server startup are not enabled.",
      "Provider spend and budget writes are not enabled.",
      "Approval capture and approval persistence are not enabled.",
      "DB/runtime writes, project mutation, deploy, export, package, and network calls are not enabled.",
    ],
    evidenceRefs: [
      "reports/p1362-secret-provider-model-report.md",
      "reports/p1361-secrets-providers-tool-governance-report.md",
      "reports/provider-credential-boundary-report.md",
      "reports/secret-access-policy-report.md",
      "reports/tool-permission-matrix-report.md",
      "reports/budget-model-report.md",
    ],
    activityRefs: [
      "Activity Log > Provider Governance Model",
      "OS Roadmap > P136.2",
    ],
    costImpact: "No provider calls, model calls, tool execution, network calls, deploy, package creation, or provider spend.",
    summaries: {
      providers: {
        totalProviders: providerSummary.totalProviders,
        metadataReady: providerSummary.metadataReady,
        notConfigured: providerSummary.notConfigured,
        providerCallsAllowed: false,
        credentialValuesReadable: false,
      },
      tools: {
        permissionCount: toolSummary.permissionCount,
        approvalRequiredCount: toolSummary.approvalRequiredCount,
        executionAllowedCount: 0,
      },
      budgets: {
        estimatesOnly: true,
        spendAllowed: false,
        providerDispatchAllowed: false,
      },
    },
  };
}

export function validateProviderGovernanceModel(model = buildProviderGovernanceModel()) {
  const errors = [];
  if (model.phase !== PROVIDER_GOVERNANCE_MODEL_PHASE) errors.push("phase must be P136.2");
  if (model.version !== PROVIDER_GOVERNANCE_MODEL_VERSION) errors.push("version must be 1.0");
  if (model.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (!model.ownerCapability) errors.push("ownerCapability is required");
  if (!model.nextAction) errors.push("nextAction is required");
  if (!model.disabledReason?.includes("blocked")) errors.push("disabledReason must explain blocked authority");
  for (const flag of PROVIDER_GOVERNANCE_FLAG_NAMES) {
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!Array.isArray(model.providerEligibilityRows) || model.providerEligibilityRows.length === 0) errors.push("providerEligibilityRows are required");
  if (!Array.isArray(model.modelAccessRows) || model.modelAccessRows.length === 0) errors.push("modelAccessRows are required");
  if (!Array.isArray(model.toolContractRows) || model.toolContractRows.length === 0) errors.push("toolContractRows are required");
  if (!Array.isArray(model.budgetPolicyRows) || model.budgetPolicyRows.length === 0) errors.push("budgetPolicyRows are required");
  if (!Array.isArray(model.approvalGateRows) || model.approvalGateRows.length === 0) errors.push("approvalGateRows are required");
  if (model.secretReferencePolicy?.valueAccessAllowed !== false) errors.push("secret value access must remain false");
  if (model.providerEligibilityRows.some((row) => row.providerCallsAllowed !== false || row.credentialValuesReadable !== false)) errors.push("provider rows must block calls and credential values");
  if (model.modelAccessRows.some((row) => row.modelCallsAllowed !== false)) errors.push("model access rows must block model calls");
  if (model.toolContractRows.some((row) => row.executionAllowed !== false)) errors.push("tool rows must block execution");
  if (model.budgetPolicyRows.some((row) => row.providerDispatchAllowed !== false || row.spendAllowed !== false)) errors.push("budget rows must block dispatch and spend");
  if (model.approvalGateRows.some((row) => row.approvalWritesAllowed !== false)) errors.push("approval rows must not write approvals");
  const serialized = JSON.stringify(model);
  if (/secret-ref-|sk-[A-Za-z0-9]|Bearer\s+|DATABASE_URL|providerBatchId|inputFileId/i.test(serialized)) errors.push("model must not expose secret references, tokens, provider batch IDs, or DB URLs");
  if (/call provider now|call model now|run tool now|execute tool now|start mcp now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(serialized)) errors.push("model must not expose fake runnable actions");
  const toolValidation = validateToolPermissionMatrix();
  if (!toolValidation.valid) errors.push(...toolValidation.errors.map((error) => `tool matrix: ${error}`));
  return { valid: errors.length === 0, errors };
}

export function buildProviderGovernanceModelEnvelope(options = {}) {
  const model = buildProviderGovernanceModel(options);
  const validation = validateProviderGovernanceModel(model);
  const envelope = createPassResult({
    phase: PROVIDER_GOVERNANCE_MODEL_PHASE,
    mode: "provider-governance-model",
    source: "shared/providerGovernanceModel.js",
    summary: "P136.2 provider governance model is display-safe and execution-blocked.",
    data: model,
    evidence: model.evidenceRefs,
    errors: validation.errors,
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    ok: validation.valid && envelopeValidation.valid,
    status: validation.valid && envelopeValidation.valid ? "PASS" : "FAIL",
    errors: [...validation.errors, ...envelopeValidation.errors],
  };
}
