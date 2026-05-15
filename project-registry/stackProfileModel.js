import { STACK_PROFILE_LIBRARY } from "./stackProfiles.js";

export function normalizeStackProfile(profile = {}) {
  return {
    stackId: profile.stackId || "unknown-stack",
    label: profile.label || profile.stackId || "Unknown Stack",
    projectType: profile.projectType || "unknown",
    components: profile.components || {},
    capabilities: Array.isArray(profile.capabilities) ? profile.capabilities : [],
    testSuites: Array.isArray(profile.testSuites) ? profile.testSuites : [],
    forbiddenActions: Array.isArray(profile.forbiddenActions) ? profile.forbiddenActions : [],
    warnings: Array.isArray(profile.warnings) ? profile.warnings : [],
    readOnly: true,
    commandExecutionAllowed: false,
    dbAccessAllowed: false,
  };
}

export function getStackCapabilities(profile = {}) {
  return normalizeStackProfile(profile).capabilities;
}

export function getStackTestSuites(profile = {}) {
  return normalizeStackProfile(profile).testSuites;
}

export function getStackDbPolicy(profile = {}) {
  const database = normalizeStackProfile(profile).components.database;
  if (!database) {
    return {
      present: false,
      defaultAccess: "disabled",
      requiresApproval: [],
      safeValidationCommands: [],
    };
  }
  return {
    present: true,
    type: database.type || "unknown",
    schemaPath: database.schemaPath || "",
    defaultAccess: database.defaultAccess || "disabled",
    requiresApproval: database.requiresApproval || [],
    safeValidationCommands: database.safeValidationCommands || [],
  };
}

export function listStackProfiles() {
  return STACK_PROFILE_LIBRARY.map(normalizeStackProfile);
}
