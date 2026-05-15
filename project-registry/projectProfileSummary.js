import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(MODULE_DIR, "projects.json");

function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

function profileLabel(profile = {}) {
  return profile.projectLabel || profile.label || "Unknown Project";
}

function stackEntries(profile = {}) {
  return Object.entries(profile.stacks || {}).map(([id, value]) => ({ id, ...(value || {}) }));
}

export function buildProjectProfileSummary(profile = {}) {
  const allowedRoots = profile.allowedRoots || profile.allowedPaths || [];
  const forbiddenPatterns = profile.forbiddenPatterns || profile.forbiddenPaths || [];
  const stacks = stackEntries(profile);

  return {
    projectId: profile.projectId || "unknown",
    projectLabel: profileLabel(profile),
    visibility: profile.visibility || "unknown",
    projectType: profile.projectType || "unknown",
    profileLoaded: Boolean(profile.projectId),
    profileValid: profile.valid === true || profile.profileValid === true,
    stackCount: stacks.length,
    stacks: stacks.map((stack) => stack.id),
    testSuiteCount: Array.isArray(profile.testSuites) ? profile.testSuites.length : 0,
    testSuites: (profile.testSuites || []).map((suite) => suite.id || suite.label).filter(Boolean),
    agentGroups: Object.keys(profile.agents || {}),
    allowedRootCount: allowedRoots.length,
    allowedRoots,
    forbiddenPatternCount: forbiddenPatterns.length,
    forbiddenPatterns,
  };
}

export function buildProjectProfileCapabilitySummary(profile = {}) {
  return {
    projectId: profile.projectId || "unknown",
    projectLabel: profileLabel(profile),
    projectSelectorEnabled: false,
    adapterRuntimeEnabled: false,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    dbAccessAllowed: false,
    demoFallbackAllowed: false,
    nextPhase: "P42.3 - Stack Profile Model",
  };
}

export function buildProjectRegistryReadinessSummary(options = {}) {
  const registry = options.registry || loadRegistry();
  const profiles = options.profiles || [];
  const validProfiles = profiles.filter((profile) => profile.ok === true || profile.valid === true);

  return {
    projectProfileLoader: "ready",
    profilesDiscovered: profiles.length,
    profilesValid: validProfiles.length,
    registryProjects: Array.isArray(registry.projects) ? registry.projects.length : 0,
    projectSelectorEnabled: false,
    adapterRuntimeEnabled: false,
    projectMutationAllowed: false,
    demoFallbackAllowed: false,
    nextPhase: "P42.3 - Stack Profile Model",
  };
}
