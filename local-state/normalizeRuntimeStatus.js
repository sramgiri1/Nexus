import { readJsonSafe, readTextSafe } from "./safeFileReader.js";
import { parseReportStatus } from "./normalizeReports.js";

function readPolicy(relativePath) {
  const result = readJsonSafe(relativePath);
  return result.ok ? result.data : null;
}

export function getRuntimeTrafficPlaneStatus() {
  const reportResult = readTextSafe("reports/runtime-traffic-plane-report.md");
  const identityPolicy = readPolicy("policy/identity-propagation-policy.json");
  const accountabilityPolicy = readPolicy("policy/accountability-policy.json");
  const behaviorPolicy = readPolicy("policy/behavior-baseline-policy.json");

  const status = reportResult.ok ? parseReportStatus(reportResult.text).status : "UNKNOWN";

  return {
    status,
    identityPropagation:
      identityPolicy?.originatingUserRequired && identityPolicy?.sessionRequired
        ? "ready"
        : "not_ready",
    policyDecision: readPolicy("policy/runtime-traffic-policy.json")?.requirePolicyDecision
      ? "ready"
      : "not_ready",
    evidenceRecords: accountabilityPolicy?.evidenceRecordPerCall ? "ready" : "not_ready",
    behaviorBaseline: behaviorPolicy?.trackChainDepth ? "ready" : "not_ready",
    dispatchWiring: "not_wired",
  };
}

export function getCapabilityStatus() {
  const result = readJsonSafe("capabilities/registry.json");
  if (!result.ok || !Array.isArray(result.data?.capabilities)) {
    return { count: 0, enabled: 0, critical: 0 };
  }

  const capabilities = result.data.capabilities;
  return {
    count: capabilities.length,
    enabled: capabilities.filter((capability) => capability.status === "enabled").length,
    critical: capabilities.filter((capability) => capability.riskLevel === "critical").length,
  };
}

export function getPolicyStatus() {
  return {
    runtimeTraffic: Boolean(readPolicy("policy/runtime-traffic-policy.json")),
    securityBoundary: Boolean(readPolicy("policy/security-boundary-policy.json")),
    dataProtection: Boolean(readPolicy("policy/data-classification-policy.json")),
    domainOwnership: Boolean(readPolicy("policy/domain-ownership-policy.json")),
  };
}

export function getReadinessSummary() {
  return {
    runtimeTrafficPlane: getRuntimeTrafficPlaneStatus(),
    capabilities: getCapabilityStatus(),
    policies: getPolicyStatus(),
  };
}
