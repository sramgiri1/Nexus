/**
 * test-suite/testSelectionPreview.js
 * Build a test selection preview from changed files and context.
 * No test execution occurs from this module.
 */

import { mapChangedFilesToTestSuites } from "./changedFileTestMapper.js";

/**
 * Build a test selection preview.
 * Input: { changedFiles: string[], context: object }
 * Returns: preview object with selectedSuites, totalSuites, executionEnabled, reasons, riskSummary
 */
export function buildTestSelectionPreview(input = {}) {
  const { changedFiles = [], context = {} } = input;

  const matches = mapChangedFilesToTestSuites(changedFiles, context);

  const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const match of matches) {
    const risk = match.riskLevel || "low";
    riskCounts[risk] = (riskCounts[risk] || 0) + 1;
  }

  const highestRisk = matches.length === 0
    ? "none"
    : (riskCounts.critical > 0 ? "critical"
      : riskCounts.high > 0 ? "high"
        : riskCounts.medium > 0 ? "medium"
          : "low");

  return {
    executionEnabled: false,
    selectedSuites: matches.length,
    selectedSuiteIds: matches.map((m) => m.suiteId),
    changedFilesCount: changedFiles.length,
    reasons: matches.map((m) => ({ suiteId: m.suiteId, reason: m.reason, triggeredBy: m.triggeredBy })),
    riskSummary: {
      highest: highestRisk,
      counts: riskCounts,
    },
    matches,
    note: matches.length === 0
      ? "No changed files in current snapshot match any registered test suite patterns."
      : `${matches.length} suite(s) selected based on changed file patterns. Execution is not enabled.`,
  };
}

/**
 * Validate a test selection preview object.
 */
export function validateTestSelectionPreview(preview) {
  const errors = [];
  if (!preview || typeof preview !== "object") {
    errors.push("Preview must be a non-null object.");
    return { valid: false, errors };
  }
  if (preview.executionEnabled !== false) {
    errors.push("executionEnabled must be false.");
  }
  if (typeof preview.selectedSuites !== "number") {
    errors.push("selectedSuites must be a number.");
  }
  if (!Array.isArray(preview.selectedSuiteIds)) {
    errors.push("selectedSuiteIds must be an array.");
  }
  if (!Array.isArray(preview.reasons)) {
    errors.push("reasons must be an array.");
  }
  if (!preview.riskSummary || typeof preview.riskSummary !== "object") {
    errors.push("riskSummary must be an object.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Summarize a test selection preview.
 */
export function summarizeTestSelectionPreview(preview) {
  if (!preview) return { selectedSuites: 0, executionEnabled: false };
  return {
    selectedSuites: preview.selectedSuites || 0,
    changedFilesCount: preview.changedFilesCount || 0,
    executionEnabled: false,
    highestRisk: preview.riskSummary?.highest || "none",
    note: preview.note || "",
  };
}
