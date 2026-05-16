/**
 * test-suite/testTypes.js
 * Constants for the Test Suite Manager registry.
 * Registry/visibility only — no test execution.
 */

export const TEST_SCOPES = ["project", "os", "cross_cutting"];

export const TEST_LAYERS = [
  "backend",
  "frontend",
  "ios",
  "android",
  "db",
  "api",
  "ui",
  "policy",
  "docs",
  "runtime",
  "security",
  "release",
  "unknown",
];

export const TEST_TOOLS = [
  "npm",
  "playwright",
  "xcodebuild",
  "gradle",
  "pytest",
  "jest",
  "node-script",
  "custom",
  "none",
];

export const RISK_LEVELS = ["low", "medium", "high", "critical"];

export const COST_CLASSES = ["free", "low", "medium", "high"];

export const RUN_MODES = ["preview", "controlled", "external", "imported"];

export const RESULT_STATUSES = ["pass", "fail", "blocked", "skipped", "not_run"];
