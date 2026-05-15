import { generateProjectProfile } from "./projectProfileGenerator.js";
import { summarizeStackProfile, getStackProfileById } from "./index.js";

export function buildProjectOnboardingPlan(input = {}) {
  const profile = generateProjectProfile(input);
  const stackProfile = getStackProfileById(profile.stackProfileId) || getStackProfileById("generic-docs");
  const stackSummary = stackProfile ? summarizeStackProfile(stackProfile) : null;

  return {
    planVersion: "1.0",
    phase: "P42.4",
    dryRun: true,
    generatedAt: new Date().toISOString(),
    proposedProjectId: profile.projectId,
    proposedProjectLabel: profile.projectLabel,
    proposedProjectRoot: profile.root,
    proposedStackProfile: profile.stackProfileId,
    proposedProfile: profile,
    stackSummary,
    allowedRoots: profile.allowedRoots,
    forbiddenRoots: profile.forbiddenPatterns,
    testSuiteSuggestions: stackSummary?.testSuites || [],
    missingInfo: [
      "Repository root confirmation",
      "Stack-specific test commands",
      "Release boundary",
      "Approved project owner",
    ],
    nextSteps: [
      "Review the dry-run project profile.",
      "Confirm stack and test commands.",
      "Run a future governed onboarding phase to write nexus.project.json.",
    ],
    writesPlanned: ["reports/project-onboarding-plan.json", "reports/project-onboarding-report.md"],
    projectFileWritesAllowed: false,
  };
}

export function summarizeProjectOnboardingPlan(plan = {}) {
  return {
    dryRun: plan.dryRun === true,
    proposedProjectId: plan.proposedProjectId,
    proposedProjectRoot: plan.proposedProjectRoot,
    proposedStackProfile: plan.proposedStackProfile,
    missingInfoCount: Array.isArray(plan.missingInfo) ? plan.missingInfo.length : 0,
    projectFileWritesAllowed: false,
  };
}
