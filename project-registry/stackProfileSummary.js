import {
  getStackCapabilities,
  getStackDbPolicy,
  getStackTestSuites,
  normalizeStackProfile,
} from "./stackProfileModel.js";
import { validateStackProfile } from "./stackProfileValidator.js";

export function summarizeStackProfile(profile = {}) {
  const normalized = normalizeStackProfile(profile);
  const validation = validateStackProfile(normalized);
  return {
    stackId: normalized.stackId,
    label: normalized.label,
    projectType: normalized.projectType,
    componentAreas: Object.keys(normalized.components),
    capabilities: getStackCapabilities(normalized),
    testSuites: getStackTestSuites(normalized),
    dbPolicy: getStackDbPolicy(normalized),
    forbiddenActions: normalized.forbiddenActions,
    warnings: validation.warnings,
    valid: validation.valid,
    errors: validation.errors,
    adapterRuntimeEnabled: false,
    commandExecutionAllowed: false,
    dbAccessAllowed: false,
  };
}
