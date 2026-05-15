import {
  getProjectExportAllowRules,
  getProjectExportDenyRules,
  matchProjectExportRule,
} from "./exportRules.js";

const DEFAULT_PROJECT_ID = "private-project";

function normalizePath(pathname) {
  return String(pathname || "").replaceAll("\\", "/").replace(/^\.\//, "").trim();
}

function candidatePathsFromInput(input = {}) {
  if (Array.isArray(input.candidatePaths)) return input.candidatePaths;
  if (Array.isArray(input.paths)) return input.paths;
  return [];
}

function isDemoAllowed(context = {}) {
  return context.mode === "demo" || context.demoExport === true;
}

function resultForPath(pathname, context = {}) {
  const normalizedPath = normalizePath(pathname);
  const denyRule = matchProjectExportRule(normalizedPath, getProjectExportDenyRules());

  if (denyRule && !(denyRule.category === "demo_data" && isDemoAllowed(context))) {
    return {
      path: normalizedPath,
      allowed: false,
      category: denyRule.category,
      reason: denyRule.reason,
      requiresRedaction: false,
    };
  }

  const allowRule = matchProjectExportRule(normalizedPath, getProjectExportAllowRules());
  if (allowRule) {
    return {
      path: normalizedPath,
      allowed: true,
      category: allowRule.category,
      reason: allowRule.description,
      requiresRedaction: allowRule.requiresRedaction === true,
    };
  }

  return {
    path: normalizedPath,
    allowed: false,
    category: "not_allow_listed",
    reason: "Path is not allow-listed for dry-run project export.",
    requiresRedaction: false,
  };
}

export function isPathExportAllowed(pathname, context = {}) {
  return resultForPath(pathname, context).allowed;
}

export function evaluateProjectExportSafety(input = {}) {
  const mode = input.mode || "local-private";
  const projectId = input.projectId || DEFAULT_PROJECT_ID;
  const candidatePaths = candidatePathsFromInput(input);
  const pathResults = candidatePaths.map((pathname) => resultForPath(pathname, { ...input, mode }));
  const allowedPaths = pathResults.filter((entry) => entry.allowed);
  const blockedPaths = pathResults.filter((entry) => !entry.allowed);
  const blockedReasons = [...new Set(blockedPaths.map((entry) => entry.reason))];
  const requiresRedaction = allowedPaths.filter((entry) => entry.requiresRedaction).map((entry) => entry.path);

  return {
    exportSafetyVersion: "1.0",
    projectId,
    mode,
    exportAllowed: false,
    dryRunOnly: true,
    allowedPaths,
    blockedPaths,
    blockedReasons,
    requiresRedaction,
    nexusInternalsDetected: blockedPaths.some((entry) =>
      [
        "nexus_agents",
        "nexus_skills",
        "nexus_hooks",
        "nexus_tools",
        "nexus_policy",
        "os_roadmap",
        "providers",
        "orchestrator",
        "db",
        "command_center",
      ].includes(entry.category),
    ),
    secretsDetected: blockedPaths.some((entry) => entry.category === "secrets" || entry.category === "secret_extensions"),
    demoDataDetected: blockedPaths.some((entry) => entry.category === "demo_data"),
    warnings: [
      "P43.3 is dry-run only. No package is created.",
      ...(blockedPaths.length > 0 ? ["One or more candidate paths are blocked from project export."] : []),
    ],
    errors: [],
  };
}

export function createProjectExportSafetyPlan(input = {}) {
  return evaluateProjectExportSafety(input);
}

export function summarizeExportSafety(result = {}) {
  const allowedPaths = Array.isArray(result.allowedPaths) ? result.allowedPaths : [];
  const blockedPaths = Array.isArray(result.blockedPaths) ? result.blockedPaths : [];

  return {
    projectId: result.projectId || DEFAULT_PROJECT_ID,
    mode: result.mode || "local-private",
    exportAllowed: result.exportAllowed === true,
    dryRunOnly: result.dryRunOnly !== false,
    allowedPathCount: allowedPaths.length,
    blockedPathCount: blockedPaths.length,
    nexusInternalsDetected: result.nexusInternalsDetected === true,
    secretsDetected: result.secretsDetected === true,
    demoDataDetected: result.demoDataDetected === true,
  };
}
