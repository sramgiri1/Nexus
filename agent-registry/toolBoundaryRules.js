export const TOOL_BOUNDARY_RULE_VERSION = "1.0";

export const TOOL_BOUNDARIES = {
  metadataOnly: true,
  dispatchEnabled: false,
  globallyForbiddenTools: [
    "mcp.execute",
    "provider.dispatch",
    "worker.execute",
    "production-db.write",
    "release.deploy",
    "xcodebuild.execute",
  ],
  allowedMetadataTools: [
    "read-local-report",
    "read-policy-metadata",
    "read-roadmap-status",
    "read-agent-registry",
  ],
};

export function getToolBoundaryForAgent() {
  return {
    allowedTools: TOOL_BOUNDARIES.allowedMetadataTools,
    forbiddenTools: TOOL_BOUNDARIES.globallyForbiddenTools,
    dispatchEnabled: false,
  };
}
