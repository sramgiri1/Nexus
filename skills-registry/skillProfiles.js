export const SKILL_PROFILE_VERSION = "1.0";

const BASE_TEST_REQUIREMENTS = [
  "npm run check:skill-registry",
  "npm run check:command-center-ux",
  "npm run check:format-readability",
];

const ALL_TEMPLATE_IDS = [
  "plan-mission",
  "create-project-brief",
  "review-plan",
  "run-qa-gate",
  "fix-failing-test-plan",
  "prepare-release-review",
  "retro-and-lessons-learned",
  "guard-freeze-scope",
  "explain-current-state",
];

export const STACK_SKILL_PROFILES = [
  {
    profileId: "saas-node-fastify",
    label: "SaaS Node / Fastify",
    stackTags: ["node", "fastify", "api", "saas"],
    compatibleSkillIds: ALL_TEMPLATE_IDS,
    unavailableSkillIds: [],
    unavailableReasons: {},
    requiredFutureAdapters: ["project test command adapter", "API validation runner"],
    projectProfileRequirements: ["runtime", "testCommands", "servicePorts", "riskBoundary"],
    testRequirements: [...BASE_TEST_REQUIREMENTS, "npm run check:live-local-api"],
    executionEnabled: false,
  },
  {
    profileId: "web-react",
    label: "Web React",
    stackTags: ["web", "react", "dashboard", "frontend"],
    compatibleSkillIds: ALL_TEMPLATE_IDS,
    unavailableSkillIds: [],
    unavailableReasons: {},
    requiredFutureAdapters: ["browser QA adapter", "frontend build/test runner"],
    projectProfileRequirements: ["packageManager", "buildCommand", "testCommands", "publicSafetyBoundary"],
    testRequirements: [...BASE_TEST_REQUIREMENTS, "cd dashboard && npm run build && npm run test:unit"],
    executionEnabled: false,
  },
  {
    profileId: "ios-swift-xcode",
    label: "iOS Swift / Xcode",
    stackTags: ["ios", "swift", "xcode"],
    compatibleSkillIds: [
      "plan-mission",
      "create-project-brief",
      "review-plan",
      "run-qa-gate",
      "prepare-release-review",
      "retro-and-lessons-learned",
      "guard-freeze-scope",
      "explain-current-state",
    ],
    unavailableSkillIds: ["fix-failing-test-plan"],
    unavailableReasons: {
      "fix-failing-test-plan": "Requires a governed iOS implementation adapter and Xcode runner.",
    },
    requiredFutureAdapters: ["Xcode validation runner", "iOS implementation bridge"],
    projectProfileRequirements: ["xcodeWorkspace", "scheme", "simulatorTarget", "signingBoundary"],
    testRequirements: [...BASE_TEST_REQUIREMENTS, "xcodebuild validation remains external and disabled"],
    executionEnabled: false,
  },
  {
    profileId: "android-gradle-placeholder",
    label: "Android Gradle Placeholder",
    stackTags: ["android", "gradle", "placeholder"],
    compatibleSkillIds: [
      "plan-mission",
      "create-project-brief",
      "review-plan",
      "retro-and-lessons-learned",
      "explain-current-state",
    ],
    unavailableSkillIds: [
      "run-qa-gate",
      "fix-failing-test-plan",
      "prepare-release-review",
      "guard-freeze-scope",
    ],
    unavailableReasons: {
      "run-qa-gate": "Requires a governed Android validation adapter.",
      "fix-failing-test-plan": "Requires a governed Android implementation adapter.",
      "prepare-release-review": "Requires release readiness integration for Android projects.",
      "guard-freeze-scope": "Requires runtime scope lock controls.",
    },
    requiredFutureAdapters: ["Gradle validation runner", "Android implementation bridge"],
    projectProfileRequirements: ["gradleProject", "testCommands", "deviceTarget", "releaseBoundary"],
    testRequirements: BASE_TEST_REQUIREMENTS,
    executionEnabled: false,
  },
  {
    profileId: "docs-architecture",
    label: "Docs / Architecture",
    stackTags: ["docs", "architecture", "markdown"],
    compatibleSkillIds: [
      "plan-mission",
      "create-project-brief",
      "review-plan",
      "run-qa-gate",
      "retro-and-lessons-learned",
      "guard-freeze-scope",
      "explain-current-state",
    ],
    unavailableSkillIds: ["fix-failing-test-plan", "prepare-release-review"],
    unavailableReasons: {
      "fix-failing-test-plan": "Docs work should use controlled documentation review before source mutation.",
      "prepare-release-review": "Release bridge is not enabled for docs-only work.",
    },
    requiredFutureAdapters: ["docs link checker helper", "architecture diagram validator"],
    projectProfileRequirements: ["docsRoot", "publicSafetyBoundary", "linkPolicy"],
    testRequirements: [...BASE_TEST_REQUIREMENTS, "npm run check:docs-coverage"],
    executionEnabled: false,
  },
  {
    profileId: "nexus-os-platform",
    label: "NEXUS OS Platform",
    stackTags: ["nexus-os", "platform", "governance"],
    compatibleSkillIds: ALL_TEMPLATE_IDS,
    unavailableSkillIds: [],
    unavailableReasons: {},
    requiredFutureAdapters: ["OS phase status helper", "governed command runner", "activity logger"],
    projectProfileRequirements: ["osPhase", "allowedFiles", "validationPlan", "safetyBoundary"],
    testRequirements: [
      ...BASE_TEST_REQUIREMENTS,
      "npm run check:os-phase-status",
      "npm run check:public-safety",
    ],
    executionEnabled: false,
  },
];

export function getSkillProfiles() {
  return STACK_SKILL_PROFILES.map((profile) => ({
    ...profile,
    compatibleSkillIds: [...profile.compatibleSkillIds],
    unavailableSkillIds: [...profile.unavailableSkillIds],
    unavailableReasons: { ...profile.unavailableReasons },
    requiredFutureAdapters: [...profile.requiredFutureAdapters],
    projectProfileRequirements: [...profile.projectProfileRequirements],
    testRequirements: [...profile.testRequirements],
  }));
}

export function getSkillProfileById(profileId) {
  return getSkillProfiles().find((profile) => profile.profileId === profileId) || null;
}

export function validateSkillProfiles(profiles = getSkillProfiles()) {
  const errors = [];
  const seen = new Set();
  for (const profile of profiles) {
    for (const field of ["profileId", "label"]) {
      if (!profile?.[field]) errors.push(`${profile?.profileId || "unknown"} missing ${field}`);
    }
    for (const field of [
      "stackTags",
      "compatibleSkillIds",
      "unavailableSkillIds",
      "requiredFutureAdapters",
      "projectProfileRequirements",
      "testRequirements",
    ]) {
      if (!Array.isArray(profile?.[field])) errors.push(`${profile?.profileId || "unknown"} missing ${field}`);
    }
    if (profile?.executionEnabled !== false) errors.push(`${profile?.profileId} executionEnabled must be false`);
    if (profile?.unavailableReasons && typeof profile.unavailableReasons !== "object") {
      errors.push(`${profile?.profileId} unavailableReasons must be an object`);
    }
    for (const skillId of profile.unavailableSkillIds || []) {
      if (!profile.unavailableReasons?.[skillId]) {
        errors.push(`${profile.profileId} missing unavailable reason for ${skillId}`);
      }
    }
    if (seen.has(profile.profileId)) errors.push(`Duplicate profileId: ${profile.profileId}`);
    seen.add(profile.profileId);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeSkillProfiles(profiles = getSkillProfiles()) {
  return {
    profileVersion: SKILL_PROFILE_VERSION,
    profileCount: profiles.length,
    executionEnabledCount: profiles.filter((profile) => profile.executionEnabled === true).length,
    compatibleSkillLinks: profiles.reduce((count, profile) => count + profile.compatibleSkillIds.length, 0),
    unavailableSkillLinks: profiles.reduce((count, profile) => count + profile.unavailableSkillIds.length, 0),
  };
}
