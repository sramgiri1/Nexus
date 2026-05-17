/**
 * test-suite/projectTestSuites.js
 * Preview-only project-scoped test suite records.
 * All suites have executionEnabled: false and are display-only.
 * No test execution occurs from this module.
 */

import { normalizeTestSuiteRecord, validateTestSuiteRecord } from "./testRegistrySchema.js";

const DEFAULT_PROJECT_ID = "careloop";

/**
 * Build the list of project test suite records for the given context.
 * Returns an array of normalized suite records.
 */
export function buildProjectTestSuites(context = {}) {
  const projectId = context.projectId || DEFAULT_PROJECT_ID;

  const suites = [
    {
      suiteId: `${projectId}-backend-validation`,
      projectId,
      scope: "project",
      layer: "backend",
      tool: "npm",
      commandPreview: "npm test",
      description: "Backend unit and integration tests via npm test. Covers Fastify routes, Prisma queries, and auth middleware.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "medium",
      costClass: "low",
      evidenceTypes: ["test-result", "coverage-report"],
      ownerAgent: "CORE",
      changedFilePatterns: ["projects/careloop/src/**", "projects/careloop/prisma/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-smoke-gate`,
      projectId,
      scope: "project",
      layer: "runtime",
      tool: "custom",
      commandPreview: "scripts/careloop-test-runner.sh smoke",
      description: "Fast CareLoop pre-commit gate. Runs backend domain smoke checks plus the highest-value onboarding, circle directory, receiver home, and snooze UI journeys.",
      requiresApproval: true,
      requiresRunner: true,
      riskLevel: "medium",
      costClass: "medium",
      evidenceTypes: ["test-result", "xcode-test-result"],
      ownerAgent: "SENTINEL",
      changedFilePatterns: ["projects/careloop/**", "projects/careloop-ios/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-backend-auth`,
      projectId,
      scope: "project",
      layer: "backend",
      tool: "node-script",
      commandPreview: "scripts/careloop-test-runner.sh backend:auth",
      description: "Focused backend auth tests for signup, login, logout, OAuth, reset password, and pending invitation session behavior.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "medium",
      costClass: "low",
      evidenceTypes: ["test-result"],
      ownerAgent: "CORE",
      changedFilePatterns: ["projects/careloop/src/**/auth/**", "projects/careloop/src/**", "projects/careloop/test/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-backend-circles`,
      projectId,
      scope: "project",
      layer: "backend",
      tool: "node-script",
      commandPreview: "scripts/careloop-test-runner.sh backend:circles",
      description: "Focused backend circle lifecycle tests for create, invite, accept, decline, expire, role management, receiver management, and deletion.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "medium",
      costClass: "low",
      evidenceTypes: ["test-result"],
      ownerAgent: "CORE",
      changedFilePatterns: ["projects/careloop/src/**", "projects/careloop/test/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-backend-reminders`,
      projectId,
      scope: "project",
      layer: "backend",
      tool: "node-script",
      commandPreview: "scripts/careloop-test-runner.sh backend:reminders",
      description: "Focused backend reminder tests for scheduling, snooze, escalation, push payloads, email fallback, and digest simulation.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "high",
      costClass: "low",
      evidenceTypes: ["test-result"],
      ownerAgent: "CORE",
      changedFilePatterns: ["projects/careloop/src/**", "projects/careloop/prisma/**", "projects/careloop/test/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-backend-scale-isolation`,
      projectId,
      scope: "project",
      layer: "backend",
      tool: "node-script",
      commandPreview: "scripts/careloop-test-runner.sh backend:scale",
      description: "Backend E2E simulations for 50 dummy users and one account participating in multiple circles with different roles.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "high",
      costClass: "medium",
      evidenceTypes: ["test-result"],
      ownerAgent: "CORE",
      changedFilePatterns: ["projects/careloop/src/**", "projects/careloop/test/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-ios-readiness`,
      projectId,
      scope: "project",
      layer: "ios",
      tool: "custom",
      commandPreview: "scripts/careloop-test-runner.sh ios",
      description: "iOS unit and UI tests via xcodebuild. Requires Xcode and iOS simulator runner.",
      requiresApproval: true,
      requiresRunner: true,
      riskLevel: "high",
      costClass: "medium",
      evidenceTypes: ["xcode-test-result", "simulator-log"],
      ownerAgent: "SWIFT",
      changedFilePatterns: ["projects/careloop-ios/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "planned",
    },
    {
      suiteId: `${projectId}-ios-onboarding`,
      projectId,
      scope: "project",
      layer: "ios",
      tool: "custom",
      commandPreview: "scripts/careloop-test-runner.sh ios:onboarding",
      description: "Focused iOS onboarding and circle directory suite for auth contracts, keychain/session basics, and create/join entry points.",
      requiresApproval: true,
      requiresRunner: true,
      riskLevel: "medium",
      costClass: "medium",
      evidenceTypes: ["xcode-test-result", "simulator-log"],
      ownerAgent: "SWIFT",
      changedFilePatterns: ["projects/careloop-ios/CareLoop/Views/Onboarding/**", "projects/careloop-ios/CareLoop/Views/Circles/**", "projects/careloop-ios/CareLoopTests/**", "projects/careloop-ios/CareLoopUITests/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-ios-personas`,
      projectId,
      scope: "project",
      layer: "ios",
      tool: "custom",
      commandPreview: "scripts/careloop-test-runner.sh ios:personas",
      description: "Focused iOS persona suite for organizer, caregiver, care receiver dashboards, and multi-circle role recalculation.",
      requiresApproval: true,
      requiresRunner: true,
      riskLevel: "medium",
      costClass: "medium",
      evidenceTypes: ["xcode-test-result", "simulator-log"],
      ownerAgent: "SWIFT",
      changedFilePatterns: ["projects/careloop-ios/CareLoop/Views/Circles/**", "projects/careloop-ios/CareLoop/Models/**", "projects/careloop-ios/CareLoopTests/**", "projects/careloop-ios/CareLoopUITests/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-ios-reminders`,
      projectId,
      scope: "project",
      layer: "ios",
      tool: "custom",
      commandPreview: "scripts/careloop-test-runner.sh ios:reminders",
      description: "Focused iOS reminder suite for scheduling policy, push deep-link state, and task detail snooze UI.",
      requiresApproval: true,
      requiresRunner: true,
      riskLevel: "high",
      costClass: "medium",
      evidenceTypes: ["xcode-test-result", "simulator-log"],
      ownerAgent: "SWIFT",
      changedFilePatterns: ["projects/careloop-ios/CareLoop/**", "projects/careloop-ios/CareLoopTests/**", "projects/careloop-ios/CareLoopUITests/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-premium-plan`,
      projectId,
      scope: "project",
      layer: "policy",
      tool: "node-script",
      commandPreview: "npm run check:careloop-premium-phase-plan",
      description: "CareLoop premium phase contract check. Verifies PRD, Nexus project status, roadmap, project profile, and suite metadata for receiver-scoped premium implementation.",
      requiresApproval: false,
      requiresRunner: false,
      riskLevel: "low",
      costClass: "free",
      evidenceTypes: ["policy-check-result"],
      ownerAgent: "PRISM",
      changedFilePatterns: [
        "projects/careloop/docs/PRD.md",
        "projects/careloop/docs/PREMIUM_PHASE_PLAN.md",
        "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
        "project-roadmap/careloop-*.json",
        "projects/careloop/nexus.project.json",
        "test-suite/projectTestSuites.js",
      ],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "ready",
    },
    {
      suiteId: `${projectId}-prd-acceptance`,
      projectId,
      scope: "project",
      layer: "policy",
      tool: "none",
      commandPreview: "(manual PRD acceptance checklist review)",
      description: "PRD acceptance checklist: verifies that implemented features match locked PRD decisions.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "medium",
      costClass: "free",
      evidenceTypes: ["prd-acceptance-record"],
      ownerAgent: "ATLAS",
      changedFilePatterns: ["projects/careloop/**", "projects/careloop-ios/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["external"],
      status: "planned",
    },
    {
      suiteId: `${projectId}-privacy-compliance`,
      projectId,
      scope: "project",
      layer: "policy",
      tool: "none",
      commandPreview: "(review-only: Privacy Policy, FTC Health Breach Notification Rule compliance checklist)",
      description: "Privacy and compliance review: FTC Health Breach Notification Rule. Not HIPAA. Review-only.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "high",
      costClass: "free",
      evidenceTypes: ["compliance-review-record"],
      ownerAgent: "WARDEN",
      changedFilePatterns: ["projects/careloop/**", "projects/careloop-ios/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["external"],
      status: "planned",
    },
    {
      suiteId: `${projectId}-release-readiness`,
      projectId,
      scope: "project",
      layer: "release",
      tool: "none",
      commandPreview: "(release readiness gate: all AUDITOR, SENTINEL, WARDEN gates must be PASS)",
      description: "Release readiness: all verification gates pass, evidence collected, App Store metadata reviewed.",
      requiresApproval: true,
      requiresRunner: false,
      riskLevel: "critical",
      costClass: "free",
      evidenceTypes: ["release-gate-record"],
      ownerAgent: "SENTINEL",
      changedFilePatterns: ["projects/careloop/**", "projects/careloop-ios/**"],
      forbiddenInDemo: true,
      dataClassification: "private",
      executionEnabled: false,
      allowedInMode: ["controlled"],
      status: "planned",
    },
  ];

  return suites.map((s) => normalizeTestSuiteRecord(s));
}

/**
 * Load and return preview suite records for a specific projectId.
 */
export function loadProjectTestSuitePreview(projectId) {
  return buildProjectTestSuites({ projectId });
}

/**
 * Validate an array of project test suite records.
 * Returns { valid, errors }.
 */
export function validateProjectTestSuites(suites) {
  const errors = [];
  if (!Array.isArray(suites)) {
    errors.push("suites must be an array.");
    return { valid: false, errors };
  }
  for (const suite of suites) {
    const result = validateTestSuiteRecord(suite);
    if (!result.valid) {
      errors.push(...result.errors.map((e) => `[${suite.suiteId || "unknown"}] ${e}`));
    }
    if (suite.executionEnabled !== false) {
      errors.push(`[${suite.suiteId}] executionEnabled must be false.`);
    }
    if (suite.scope === "project" && suite.forbiddenInDemo !== true) {
      errors.push(`[${suite.suiteId}] private project suites must have forbiddenInDemo: true.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Summarize a list of project test suite records.
 */
export function summarizeProjectTestSuites(suites) {
  if (!Array.isArray(suites)) return { total: 0, byLayer: {}, byStatus: {}, executionEnabled: false };
  const byLayer = {};
  const byStatus = {};
  for (const suite of suites) {
    byLayer[suite.layer] = (byLayer[suite.layer] || 0) + 1;
    byStatus[suite.status || "planned"] = (byStatus[suite.status || "planned"] || 0) + 1;
  }
  return {
    total: suites.length,
    byLayer,
    byStatus,
    executionEnabled: false,
    projectIds: [...new Set(suites.map((s) => s.projectId).filter(Boolean))],
  };
}
