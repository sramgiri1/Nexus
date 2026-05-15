import { buildProjectOnboardingPlan, summarizeProjectOnboardingPlan } from "./projectOnboardingPlan.js";

export function createProjectOnboardingDryRun(input = {}) {
  const plan = buildProjectOnboardingPlan(input);
  return {
    ok: true,
    plan,
    summary: summarizeProjectOnboardingPlan(plan),
    warnings: ["Dry-run only. No project files were written."],
    errors: [],
  };
}

export function validateProjectOnboardingRequest(input = {}) {
  const errors = [];
  if (!input.name || typeof input.name !== "string") errors.push("Project name is required.");
  if (input.write === true || input.dryRun === false) errors.push("Project onboarding writes are not enabled.");
  return {
    valid: errors.length === 0,
    errors,
  };
}
