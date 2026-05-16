import { createBudgetPolicy } from "./budgetModel.js";

export function createDefaultCostCenterPolicies() {
  return [
    createBudgetPolicy({
      budgetPolicyId: "budget_global_p57_preview",
      scopeType: "global",
      scopeId: "nexus",
      maxUsdPerRun: 1,
      maxUsdPerTask: 0.25,
      maxUsdPerDay: 5,
      maxTokensPerRun: 50000,
      requiresApprovalAboveUsd: 0.5,
    }),
    createBudgetPolicy({
      budgetPolicyId: "budget_provider_p57_disabled",
      scopeType: "provider",
      scopeId: "provider-dispatch",
      maxUsdPerRun: 0,
      requiresApprovalAboveUsd: 0,
      warnings: ["Provider dispatch remains disabled."],
    }),
  ];
}

export function summarizeCostCenterPolicy(policy = {}) {
  return {
    costEstimatesAllowed: policy.costEstimatesAllowed === true,
    actualCostRecordingAllowed: policy.actualCostRecordingAllowed || "preview_only",
    budgetBlockingAllowed: policy.budgetBlockingAllowed || "preview_only",
    realProviderSpendAllowed: policy.realProviderSpendAllowed === true,
    providerCallsAllowed: policy.providerCallsAllowed === true,
    externalNetworkCallsAllowed: policy.externalNetworkCallsAllowed === true,
    dbWritesAllowed: policy.dbWritesAllowed === true,
  };
}
