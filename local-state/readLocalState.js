import { LOCAL_STATE_VERSION } from "./schema.js";
import {
  readValidationReports,
  summarizeValidationReports,
} from "./normalizeReports.js";
import { summarizeDemoArtifacts } from "./normalizeDemoArtifacts.js";
import { getReadinessSummary } from "./normalizeRuntimeStatus.js";

const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    ["OPENAI", "_", "API", "_", "KEY", "="].join(""),
    ["ANTHROPIC", "_", "API", "_", "KEY", "="].join(""),
    ["DATABASE", "_", "URL", "="].join(""),
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);

export function readLocalStateSnapshot() {
  const validation = readValidationReports();
  const validationSummary = summarizeValidationReports(validation);
  const demo = summarizeDemoArtifacts();
  const runtimeReadiness = getReadinessSummary();
  const warnings = [...validation.warnings, ...demo.warnings];
  const errors = [...validation.errors, ...demo.errors];

  if (validationSummary.warnings > 0) {
    warnings.push(
      `Validation reports currently include ${validationSummary.warnings} warning entries.`
    );
  }

  return {
    snapshotVersion: LOCAL_STATE_VERSION,
    source: "local-files",
    readOnly: true,
    generatedAt: new Date().toISOString(),
    validation: {
      reports: validation.reports,
      summary: validationSummary,
    },
    demo: {
      contracts: demo.contracts,
      reports: demo.reports,
      scenario: demo.scenario,
      summary: demo.summary,
    },
    runtime: {
      runtimeTrafficPlane: runtimeReadiness.runtimeTrafficPlane,
    },
    capabilities: runtimeReadiness.capabilities,
    policies: runtimeReadiness.policies,
    errors,
    warnings,
  };
}

export function validateLocalStateSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  const localState = snapshot || {};

  if (localState.readOnly !== true) {
    errors.push("Snapshot must be read-only.");
  }

  if (localState.source !== "local-files") {
    errors.push("Snapshot source must be local-files.");
  }

  if (!localState.validation?.summary) {
    errors.push("Validation summary is missing.");
  }

  if (!localState.demo?.summary) {
    errors.push("Demo summary is missing.");
  }

  if (!localState.runtime?.runtimeTrafficPlane) {
    errors.push("Runtime status is missing.");
  }

  const serializedSnapshot = JSON.stringify(localState);

  if (PRIVATE_NAME_PATTERN.test(serializedSnapshot)) {
    errors.push("Snapshot contains a private project reference.");
  }

  if (SECRET_PATTERN.test(serializedSnapshot)) {
    errors.push("Snapshot contains secret-like content.");
  }

  if (
    Array.isArray(localState.errors) &&
    localState.errors.some((entry) => String(entry).toLowerCase().includes("blocked path"))
  ) {
    errors.push("Snapshot contains blocked path read errors.");
  }

  if ((localState.validation?.summary?.warnings || 0) > 0) {
    warnings.push(
      `Validation surface contains ${localState.validation.summary.warnings} warnings.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
