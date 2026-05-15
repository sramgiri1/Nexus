export const TOOL_GATEWAY_REQUEST_TYPES = Object.freeze([
  "tool.lookup",
  "tool.contract",
  "tool.execute.preview",
]);

export const TOOL_GATEWAY_DEFAULT_POLICY = Object.freeze({
  phase: "P52.3",
  metadataOnly: true,
  toolExecutionAllowed: false,
  mcpExecutionAllowed: false,
  shellExecutionAllowed: false,
  providerCallsAllowed: false,
  externalNetworkAllowed: false,
  projectMutationAllowed: false,
  dbWritesAllowed: false,
  workerRuntimeAllowed: false,
  maxCostEstimateUsd: 0,
  allowedModes: ["local-private", "test", "demo"],
  allowedRequestTypes: TOOL_GATEWAY_REQUEST_TYPES,
});

export function summarizeToolGatewayPolicy(policy = TOOL_GATEWAY_DEFAULT_POLICY) {
  return {
    phase: policy.phase,
    metadataOnly: policy.metadataOnly,
    toolExecutionAllowed: policy.toolExecutionAllowed,
    mcpExecutionAllowed: policy.mcpExecutionAllowed,
    shellExecutionAllowed: policy.shellExecutionAllowed,
    providerCallsAllowed: policy.providerCallsAllowed,
    externalNetworkAllowed: policy.externalNetworkAllowed,
    projectMutationAllowed: policy.projectMutationAllowed,
    dbWritesAllowed: policy.dbWritesAllowed,
    workerRuntimeAllowed: policy.workerRuntimeAllowed,
    maxCostEstimateUsd: policy.maxCostEstimateUsd,
  };
}
