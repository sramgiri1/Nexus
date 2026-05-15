export const TOOL_PERMISSION_POLICY = Object.freeze({
  version: "1.0",
  phase: "P52.6",
  metadataOnly: true,
  defaultDeny: true,
  executionAllowed: false,
  privateToolsInDemoAllowed: false,
  approvalRequiredForHighRisk: true,
  providerCallsAllowed: false,
  externalNetworkAllowed: false,
  dbWritesAllowed: false,
  projectMutationAllowed: false,
});

export function summarizeToolPermissionPolicy(policy = TOOL_PERMISSION_POLICY) {
  return {
    metadataOnly: policy.metadataOnly,
    defaultDeny: policy.defaultDeny,
    executionAllowed: policy.executionAllowed,
    privateToolsInDemoAllowed: policy.privateToolsInDemoAllowed,
    approvalRequiredForHighRisk: policy.approvalRequiredForHighRisk,
  };
}
