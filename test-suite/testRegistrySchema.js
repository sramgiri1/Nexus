/**
 * test-suite/testRegistrySchema.js
 * Schema definition and validation for the Test Suite Manager registry.
 * Registry/visibility only — no test execution.
 */

import { TEST_SCOPES, TEST_LAYERS, TEST_TOOLS, RISK_LEVELS, COST_CLASSES } from "./testTypes.js";

const SCHEMA_VERSION = "1.0.0";

/**
 * Returns the canonical schema definition object for a test suite record.
 */
export function getTestRegistrySchema() {
  return {
    version: SCHEMA_VERSION,
    description: "NEXUS Test Suite Manager registry schema. Registry and visibility only — no execution.",
    fields: {
      suiteId: { type: "string", required: true, description: "Unique identifier for this test suite." },
      projectId: { type: "string", required: false, description: "Project identifier when scope is 'project'." },
      osScope: { type: "string", required: false, description: "OS scope identifier when scope is 'os' or 'cross_cutting'." },
      scope: { type: "string", required: true, enum: TEST_SCOPES, description: "Scope: project, os, or cross_cutting." },
      layer: { type: "string", required: true, enum: TEST_LAYERS, description: "Technical layer this suite covers." },
      tool: { type: "string", required: true, enum: TEST_TOOLS, description: "Test tool used for this suite." },
      commandPreview: { type: "string", required: true, description: "Display-only command preview string. Never executed." },
      allowedInMode: { type: "array", required: false, description: "Modes in which this suite is allowed (display only)." },
      requiresApproval: { type: "boolean", required: true, description: "Whether approval is required before execution." },
      requiresRunner: { type: "boolean", required: true, description: "Whether a specialized runner (Xcode, Android, etc.) is required." },
      riskLevel: { type: "string", required: true, enum: RISK_LEVELS, description: "Risk level of running this suite." },
      costClass: { type: "string", required: true, enum: COST_CLASSES, description: "Cost class for running this suite." },
      evidenceTypes: { type: "array", required: true, description: "Array of evidence type identifiers produced by this suite." },
      ownerAgent: { type: "string", required: true, description: "Primary owning agent for this test suite." },
      changedFilePatterns: { type: "array", required: true, description: "Glob patterns for files that trigger this suite." },
      forbiddenInDemo: { type: "boolean", required: true, description: "If true, this suite must not appear in Demo Mode." },
      dataClassification: { type: "string", required: true, description: "Data classification: public, demo, or private." },
      executionEnabled: { type: "boolean", required: true, description: "Always false in registry-only mode." },
      status: { type: "string", required: false, description: "Suite readiness status: planned, ready, active, disabled." },
      description: { type: "string", required: false, description: "Human-readable description of this test suite." },
    },
  };
}

/**
 * Validate that a schema object matches the expected shape.
 */
export function validateTestRegistrySchema(schema) {
  const errors = [];
  if (!schema || typeof schema !== "object") {
    errors.push("Schema must be a non-null object.");
    return { valid: false, errors };
  }
  if (!schema.version) errors.push("Schema missing 'version' field.");
  if (!schema.fields || typeof schema.fields !== "object") errors.push("Schema missing 'fields' object.");
  return { valid: errors.length === 0, errors };
}

/**
 * Returns the list of supported test scopes.
 */
export function getSupportedTestScopes() {
  return ["project", "os", "cross_cutting"];
}

/**
 * Returns the list of supported test tools.
 */
export function getSupportedTestTools() {
  return ["npm", "playwright", "xcodebuild", "gradle", "pytest", "jest", "node-script", "custom", "none"];
}

/**
 * Fill in defaults for a test suite record, returning a normalized copy.
 */
export function normalizeTestSuiteRecord(record) {
  if (!record || typeof record !== "object") return {};
  return {
    executionEnabled: false,
    forbiddenInDemo: record.scope === "project" ? true : false,
    dataClassification: record.scope === "project" ? "private" : "public",
    allowedInMode: [],
    requiresApproval: true,
    requiresRunner: false,
    riskLevel: "medium",
    costClass: "low",
    evidenceTypes: [],
    changedFilePatterns: [],
    status: "planned",
    ...record,
    executionEnabled: false, // always forced to false
  };
}

/**
 * Validate a single test suite record against the schema.
 */
export function validateTestSuiteRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") {
    errors.push("Record must be a non-null object.");
    return { valid: false, errors };
  }

  const requiredStrings = ["suiteId", "scope", "layer", "tool", "commandPreview", "ownerAgent", "dataClassification"];
  for (const field of requiredStrings) {
    if (!record[field] || typeof record[field] !== "string") {
      errors.push(`Missing or invalid required field: '${field}'.`);
    }
  }

  if (!TEST_SCOPES.includes(record.scope)) {
    errors.push(`Invalid scope: '${record.scope}'. Must be one of: ${TEST_SCOPES.join(", ")}.`);
  }
  if (!TEST_LAYERS.includes(record.layer)) {
    errors.push(`Invalid layer: '${record.layer}'. Must be one of: ${TEST_LAYERS.join(", ")}.`);
  }
  if (!TEST_TOOLS.includes(record.tool)) {
    errors.push(`Invalid tool: '${record.tool}'. Must be one of: ${TEST_TOOLS.join(", ")}.`);
  }
  if (!RISK_LEVELS.includes(record.riskLevel)) {
    errors.push(`Invalid riskLevel: '${record.riskLevel}'.`);
  }
  if (!COST_CLASSES.includes(record.costClass)) {
    errors.push(`Invalid costClass: '${record.costClass}'.`);
  }
  if (typeof record.requiresApproval !== "boolean") {
    errors.push("'requiresApproval' must be boolean.");
  }
  if (typeof record.requiresRunner !== "boolean") {
    errors.push("'requiresRunner' must be boolean.");
  }
  if (typeof record.forbiddenInDemo !== "boolean") {
    errors.push("'forbiddenInDemo' must be boolean.");
  }
  if (!Array.isArray(record.evidenceTypes)) {
    errors.push("'evidenceTypes' must be an array.");
  }
  if (!Array.isArray(record.changedFilePatterns)) {
    errors.push("'changedFilePatterns' must be an array.");
  }
  if (record.executionEnabled !== false) {
    errors.push("'executionEnabled' must always be false in registry-only mode.");
  }
  if (record.scope === "project" && !record.projectId) {
    errors.push("Project-scoped suite must have 'projectId'.");
  }

  return { valid: errors.length === 0, errors };
}
