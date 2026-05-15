import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStackProfileById, STACK_PROFILE_LIBRARY } from "./stackProfiles.js";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(MODULE_DIR, "projects.json");

const CAPABILITY_LIBRARY = [
  {
    capabilityId: "mission-planning",
    label: "Mission planning",
    status: "available",
    source: "mission-composer",
    reason: "Mission planning is available through governed Command Center planning surfaces.",
  },
  {
    capabilityId: "task-activation",
    label: "Task activation",
    status: "available",
    source: "task-activation-bridge",
    reason: "Planned tasks can be activated through existing governed task activation flows.",
  },
  {
    capabilityId: "agent-workbench",
    label: "Agent Workbench",
    status: "available",
    source: "agent-workbench",
    reason: "Activated task review is available through the Agent Workbench.",
  },
  {
    capabilityId: "controlled-implementation",
    label: "Controlled implementation",
    status: "available_limited",
    source: "implementation-workflow",
    reason: "Scoped and documentation-only implementation paths are available when prerequisites are met.",
  },
  {
    capabilityId: "backend-validation",
    label: "Backend validation",
    status: "available",
    source: "validation-checkers",
    reason: "Approved local validation checkers can be run from a terminal.",
  },
  {
    capabilityId: "ios-validation",
    label: "iOS validation",
    status: "requires_runner",
    source: "stack-profile",
    reason: "Requires iOS/Xcode runner.",
  },
  {
    capabilityId: "provider-dispatch",
    label: "Provider dispatch",
    status: "not_enabled",
    source: "policy",
    reason: "Provider dispatch is not enabled.",
  },
  {
    capabilityId: "worker-runtime",
    label: "Worker runtime",
    status: "not_enabled",
    source: "policy",
    reason: "Worker runtime is not enabled.",
  },
  {
    capabilityId: "mcp-tools",
    label: "MCP/tools",
    status: "not_enabled",
    source: "policy",
    reason: "MCP/tool execution is not enabled.",
  },
  {
    capabilityId: "adapter-runtime",
    label: "Adapter runtime",
    status: "disabled_by_policy",
    source: "project-registry-policy",
    reason: "Adapter Runtime disabled by policy.",
  },
];

function normalizeStatus(status) {
  return status || "unknown";
}

function resolveStackProfile(project) {
  const stackProfile = getStackProfileById(project?.stackProfileId);
  if (stackProfile) return stackProfile;
  if (project?.scope === "os") return getStackProfileById("nexus-os-platform");
  if (project?.scope === "demo") return getStackProfileById("react-vite-demo");
  return getStackProfileById("node-fastify-prisma-ios") || STACK_PROFILE_LIBRARY[0];
}

function readRegistryProjects() {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8")).projects || [];
}

function toSafeProjectSummary(project) {
  return {
    projectId: project.projectId,
    label: project.publicSafeLabel || project.displayLabel || project.label,
    scope: project.scope,
    visibility: project.visibility,
    status: project.status,
    projectType: project.projectType,
    demoOnly: Boolean(project.demoOnly),
    adapterId: project.adapterId || "not-enabled",
    stackProfileId: project.stackProfileId || "not-enabled",
  };
}

function getRegistryProject(projectId) {
  const project = readRegistryProjects().find((entry) => entry.projectId === projectId);
  return project ? toSafeProjectSummary(project) : null;
}

function buildCapabilityEntry(baseCapability, stackProfile) {
  const stackCapabilities = Array.isArray(stackProfile?.capabilities) ? stackProfile.capabilities : [];
  const stackTestSuites = Array.isArray(stackProfile?.testSuites) ? stackProfile.testSuites : [];
  const supportedByStack =
    stackCapabilities.includes(baseCapability.capabilityId) ||
    stackTestSuites.includes(baseCapability.capabilityId) ||
    baseCapability.source === "policy" ||
    baseCapability.capabilityId === "adapter-runtime" ||
    baseCapability.capabilityId === "controlled-implementation";

  return {
    ...baseCapability,
    status: normalizeStatus(baseCapability.status),
    supportedByStack,
  };
}

export function buildProjectCapabilityMatrix(options = {}) {
  const projectId = options.projectId || "private-project-01";
  const project = getRegistryProject(projectId) || getRegistryProject("private-project-01");
  const stackProfile = resolveStackProfile(project);
  const capabilities = CAPABILITY_LIBRARY.map((capability) => buildCapabilityEntry(capability, stackProfile));

  return {
    matrixVersion: "1.0",
    phase: "P42.6",
    generatedAt: new Date().toISOString(),
    project: {
      projectId: project?.projectId || "private-project-01",
      label: project?.label || "Private Project",
      scope: project?.scope || "project",
      visibility: project?.visibility || "local-private",
      adapterId: project?.adapterId || "not-enabled",
      stackProfileId: project?.stackProfileId || stackProfile?.stackId || "planned-stack-profile",
    },
    stackProfile: {
      stackId: stackProfile?.stackId || "unknown-stack",
      label: stackProfile?.label || "Unknown Stack",
      projectType: stackProfile?.projectType || project?.projectType || "unknown",
    },
    capabilities,
    adapterRuntimeEnabled: false,
    projectMutationAllowed: false,
    providerDispatchEnabled: false,
    workerRuntimeEnabled: false,
    mcpToolsEnabled: false,
    dbWritesAllowed: false,
  };
}

export function listProjectCapabilityMatrices() {
  return readRegistryProjects()
    .map(toSafeProjectSummary)
    .filter((project) => project.demoOnly !== true)
    .map((project) => buildProjectCapabilityMatrix({ projectId: project.projectId }));
}

export function validateProjectCapabilityMatrix(matrix = {}) {
  const errors = [];
  const capabilities = Array.isArray(matrix.capabilities) ? matrix.capabilities : [];

  if (matrix.matrixVersion !== "1.0") errors.push("matrixVersion must be 1.0");
  if (matrix.phase !== "P42.6") errors.push("phase must be P42.6");
  if (!matrix.project?.projectId) errors.push("project.projectId is required");
  if (!capabilities.length) errors.push("capabilities are required");
  if (matrix.adapterRuntimeEnabled !== false) errors.push("Adapter runtime must remain disabled.");
  if (matrix.projectMutationAllowed !== false) errors.push("Project mutation must remain disabled.");
  if (matrix.providerDispatchEnabled !== false) errors.push("Provider dispatch must remain disabled.");
  if (matrix.workerRuntimeEnabled !== false) errors.push("Worker runtime must remain disabled.");
  if (matrix.mcpToolsEnabled !== false) errors.push("MCP/tools must remain disabled.");
  if (matrix.dbWritesAllowed !== false) errors.push("DB writes must remain disabled.");

  for (const required of ["mission-planning", "task-activation", "agent-workbench", "adapter-runtime"]) {
    if (!capabilities.some((capability) => capability.capabilityId === required)) {
      errors.push(`Missing capability: ${required}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getCapabilityStatusCounts(matrix = {}) {
  return (matrix.capabilities || []).reduce((counts, capability) => {
    const status = normalizeStatus(capability.status);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}
