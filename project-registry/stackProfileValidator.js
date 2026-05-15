import { getSupportedStackTypes } from "./stackProfiles.js";
import { normalizeStackProfile } from "./stackProfileModel.js";

export function validateStackProfile(profile = {}) {
  const normalized = normalizeStackProfile(profile);
  const supportedTypes = new Set(getSupportedStackTypes());
  const errors = [];
  const warnings = [...normalized.warnings];

  if (!normalized.stackId || normalized.stackId === "unknown-stack") errors.push("stackId is required.");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(normalized.stackId)) errors.push("stackId must be lowercase kebab-case.");
  if (!normalized.projectType || normalized.projectType === "unknown") warnings.push("projectType is not classified.");

  for (const area of Object.keys(normalized.components)) {
    if (!supportedTypes.has(area)) errors.push(`Unsupported stack area: ${area}`);
  }

  if (Object.keys(normalized.components).length === 0) {
    warnings.push("No stack areas declared.");
  }

  for (const [area, component] of Object.entries(normalized.components)) {
    if (component?.execute === true || component?.runtimeEnabled === true) {
      errors.push(`Stack component ${area} cannot enable runtime execution.`);
    }
    if (component?.defaultAccess && component.defaultAccess !== "disabled") {
      errors.push(`Stack component ${area} must keep default access disabled.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    profile: normalized,
  };
}
