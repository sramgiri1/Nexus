/**
 * test-suite/index.js
 * Public entry point for the NEXUS Test Suite Manager.
 * Registry/visibility only — no test execution.
 */

export {
  getTestRegistrySchema,
  validateTestRegistrySchema,
  getSupportedTestScopes,
  getSupportedTestTools,
  normalizeTestSuiteRecord,
  validateTestSuiteRecord,
} from "./testRegistrySchema.js";

export {
  TEST_SCOPES,
  TEST_LAYERS,
  TEST_TOOLS,
  RISK_LEVELS,
  COST_CLASSES,
  RUN_MODES,
  RESULT_STATUSES,
} from "./testTypes.js";
