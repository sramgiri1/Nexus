import process from "node:process";
import { getNexusMode, requireLocalPrivateMode } from "../private-mode/privateMode.js";
import {
  ACTION_TYPES,
  ALLOWED_ACTION_TYPES,
  APPROVAL_REQUIRED_TYPES,
  PRIVATE_ACTION_TYPES,
  validateActionSchema,
} from "./actionSchema.js";

const KNOWN_CAPABILITIES = new Set([
  "verification.code_quality_gate",
  "orchestration.plan_flow",
  "demo.noop",
]);

const GOVERNANCE_FLAGS = {
  trafficPlane: true,
  stateMachine: true,
  localWriteBoundary: true,
  providerCalls: false,
  networkCalls: false,
  dbAccess: false,
  apiServer: false,
};

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateModeBoundary(action, env) {
  const errors = [];
  const warnings = [];
  const mode = getNexusMode(env);
  const actionMode = normalizeString(action?.mode);

  if (actionMode !== mode) {
    warnings.push(`Action mode ${actionMode} differs from resolved runtime mode ${mode}.`);
  }

  if (PRIVATE_ACTION_TYPES.has(action?.actionType)) {
    const modeResult = requireLocalPrivateMode(mode);
    errors.push(...modeResult.errors);
    warnings.push(...modeResult.warnings);
  }

  return { mode, errors, warnings };
}

function validateCapability(action) {
  const errors = [];
  const warnings = [];
  const capabilityId = normalizeString(action?.target?.capabilityId);

  if (!capabilityId) {
    errors.push("target.capabilityId is required.");
    return { errors, warnings };
  }

  if (!KNOWN_CAPABILITIES.has(capabilityId)) {
    warnings.push(`Capability ${capabilityId} is not in the local known-capabilities list.`);
  }

  return { errors, warnings };
}

function detectApprovalRequirements(action) {
  const approvalRequired = APPROVAL_REQUIRED_TYPES.has(action?.actionType);
  return {
    approvalRequired,
    approvalDetected: approvalRequired,
    approvalBypassed: false,
  };
}

function validateNoDirectExecution(action) {
  const errors = [];

  if (action?.requestedCommand !== null) {
    errors.push("requestedCommand must be null — no direct command execution from action bridge.");
  }

  if (action?.mutationRequested === true) {
    errors.push("mutationRequested must be false.");
  }

  if (action?.source !== "command_center") {
    errors.push("source must be command_center.");
  }

  return { errors };
}

export function validateActionRequest(action, options = {}) {
  const env = options.env || process.env;
  const errors = [];
  const warnings = [];

  const schemaResult = validateActionSchema(action);
  errors.push(...schemaResult.errors);
  warnings.push(...schemaResult.warnings);

  const modeResult = validateModeBoundary(action, env);
  errors.push(...modeResult.errors);
  warnings.push(...modeResult.warnings);
  const mode = modeResult.mode;

  const capabilityResult = validateCapability(action);
  errors.push(...capabilityResult.errors);
  warnings.push(...capabilityResult.warnings);

  const executionResult = validateNoDirectExecution(action);
  errors.push(...executionResult.errors);

  const approvalResult = detectApprovalRequirements(action);

  const valid = errors.length === 0;

  return {
    valid,
    mode,
    status: valid ? (approvalResult.approvalRequired ? "validated" : "validated") : "blocked",
    approvalRequired: approvalResult.approvalRequired,
    governance: GOVERNANCE_FLAGS,
    errors,
    warnings,
  };
}

export function summarizeValidationResult(validationResult) {
  return {
    valid: validationResult.valid,
    status: validationResult.status,
    mode: validationResult.mode,
    approvalRequired: validationResult.approvalRequired,
    governanceFlags: validationResult.governance,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
  };
}
