export const BUDGET_SCOPE_TYPES = [
  "global",
  "project",
  "mission",
  "task",
  "agent",
  "skill",
  "hook",
  "tool",
  "trigger",
  "provider",
  "api_batch",
  "worker",
  "os_phase",
];

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBudgetPolicy(input = {}) {
  return {
    budgetPolicyId: input.budgetPolicyId || createId("budget"),
    version: "1.0",
    scopeType: input.scopeType || "global",
    scopeId: input.scopeId || "",
    mode: input.mode || "local-private",
    currency: input.currency || "USD",
    maxUsdPerRun: Number(input.maxUsdPerRun || 0),
    maxUsdPerTask: Number(input.maxUsdPerTask || 0),
    maxUsdPerDay: Number(input.maxUsdPerDay || 0),
    maxTokensPerRun: Number(input.maxTokensPerRun || 0),
    maxRetries: Number(input.maxRetries || 0),
    requiresApprovalAboveUsd: Number(input.requiresApprovalAboveUsd || 0),
    blockWhenExceeded: input.blockWhenExceeded !== false,
    allowEstimatesOnly: input.allowEstimatesOnly !== false,
    providerDispatchAllowed: input.providerDispatchAllowed === true,
    workerExecutionAllowed: input.workerExecutionAllowed === true,
    projectMutationAllowed: input.projectMutationAllowed === true,
    dataClassification: input.dataClassification || "internal",
    redacted: input.redacted !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateBudgetPolicy(policy = {}) {
  const errors = [];
  if (!policy.budgetPolicyId) errors.push("budgetPolicyId is required");
  if (policy.version !== "1.0") errors.push("version must be 1.0");
  if (!BUDGET_SCOPE_TYPES.includes(policy.scopeType)) errors.push(`invalid scopeType: ${policy.scopeType}`);
  if (!["local-private", "demo", "public-safe", "test"].includes(policy.mode)) errors.push(`invalid mode: ${policy.mode}`);
  if (policy.currency !== "USD") errors.push("only USD preview currency is supported");
  for (const key of ["maxUsdPerRun", "maxUsdPerTask", "maxUsdPerDay", "maxTokensPerRun", "maxRetries", "requiresApprovalAboveUsd"]) {
    if (Number(policy[key] || 0) < 0) errors.push(`${key} cannot be negative`);
  }
  if (policy.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must remain false in P57");
  if (policy.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must remain false in P57");
  if (policy.projectMutationAllowed !== false) errors.push("projectMutationAllowed must remain false in P57");
  if (policy.redacted !== true) errors.push("budget policies must be redacted");
  return { valid: errors.length === 0, errors };
}

function rankScope(scopeType) {
  return BUDGET_SCOPE_TYPES.indexOf(scopeType);
}

export function resolveBudgetForContext(context = {}, policies = []) {
  const candidates = policies
    .map((policy) => createBudgetPolicy(policy))
    .filter((policy) => {
      if (context.mode && policy.mode !== context.mode) return false;
      if (policy.scopeType === "global") return true;
      const contextKey = `${policy.scopeType}Id`;
      return policy.scopeId && context[contextKey] === policy.scopeId;
    })
    .sort((a, b) => rankScope(b.scopeType) - rankScope(a.scopeType));
  return candidates[0] || createBudgetPolicy({ scopeType: "global", scopeId: "default" });
}

export function summarizeBudgetPolicy(policy = {}) {
  const normalized = createBudgetPolicy(policy);
  return {
    budgetPolicyId: normalized.budgetPolicyId,
    scopeType: normalized.scopeType,
    scopeId: normalized.scopeId,
    mode: normalized.mode,
    maxUsdPerRun: normalized.maxUsdPerRun,
    maxUsdPerTask: normalized.maxUsdPerTask,
    maxUsdPerDay: normalized.maxUsdPerDay,
    maxTokensPerRun: normalized.maxTokensPerRun,
    requiresApprovalAboveUsd: normalized.requiresApprovalAboveUsd,
    allowEstimatesOnly: normalized.allowEstimatesOnly,
    providerDispatchAllowed: normalized.providerDispatchAllowed,
    workerExecutionAllowed: normalized.workerExecutionAllowed,
    projectMutationAllowed: normalized.projectMutationAllowed,
  };
}

export function summarizeBudgets(policies = []) {
  const normalized = policies.map((policy) => createBudgetPolicy(policy));
  return {
    count: normalized.length,
    byScope: normalized.reduce((acc, policy) => {
      acc[policy.scopeType] = (acc[policy.scopeType] || 0) + 1;
      return acc;
    }, {}),
    estimatesOnly: normalized.every((policy) => policy.allowEstimatesOnly === true),
    providerDispatchAllowed: normalized.some((policy) => policy.providerDispatchAllowed === true),
    workerExecutionAllowed: normalized.some((policy) => policy.workerExecutionAllowed === true),
    projectMutationAllowed: normalized.some((policy) => policy.projectMutationAllowed === true),
  };
}
