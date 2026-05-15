import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_TYPES_PATH = join(MODULE_DIR, "project-types.json");
const POLICY_PATH = join(MODULE_DIR, "..", "policy", "project-profile-loader-policy.json");
const VALID_VISIBILITIES = new Set(["internal", "local-private", "demo", "public-safe"]);
const SECRET_PATTERNS = [".env", "*.pem", "*.key", "*.p12", "secrets/**"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function configuredProjectTypes() {
  try {
    return new Set((readJson(PROJECT_TYPES_PATH).types || []).map((type) => type.id));
  } catch {
    return new Set();
  }
}

function loaderPolicy() {
  try {
    return readJson(POLICY_PATH);
  } catch {
    return {};
  }
}

function addError(errors, message) {
  errors.push(message);
}

function isRelativeSafePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.startsWith("~") &&
    !value.includes("..") &&
    !value.includes("\\")
  );
}

function normalizeProfileShape(profile = {}) {
  return {
    ...profile,
    projectLabel: profile.projectLabel || profile.label,
    label: profile.label || profile.projectLabel,
    root: profile.root || profile.metadata?.root || ".",
    allowedRoots: profile.allowedRoots || profile.allowedPaths || [],
    forbiddenPatterns: profile.forbiddenPatterns || profile.forbiddenPaths || [],
  };
}

function collectErrors(...results) {
  return results.flatMap((result) => result.errors || []);
}

export function validateProjectProfileBoundaries(profile = {}, options = {}) {
  const normalized = normalizeProfileShape(profile);
  const errors = [];
  const allowedRoots = normalized.allowedRoots || [];
  const forbiddenPatterns = normalized.forbiddenPatterns || [];

  if (!isRelativeSafePath(normalized.root)) {
    addError(errors, "Project root must be a safe relative path.");
  }

  for (const allowedRoot of allowedRoots) {
    if (!isRelativeSafePath(allowedRoot)) {
      addError(errors, `Allowed root is not a safe relative path: ${allowedRoot}`);
    }
  }

  if (normalized.visibility === "demo") {
    const serialized = JSON.stringify({
      root: normalized.root,
      allowedRoots,
      docs: normalized.docs || [],
    });
    if (serialized.includes("projects/") || serialized.includes("private")) {
      addError(errors, "Demo profiles cannot reference private project roots.");
    }
  }

  if (normalized.visibility === "local-private") {
    const mode = options.mode || "local-private";
    if (mode === "demo" || mode === "public-safe") {
      addError(errors, "Local-private profiles cannot be loaded into demo or public-safe mode.");
    }
  }

  if (forbiddenPatterns.length === 0) {
    addError(errors, "Project profile must declare forbiddenPatterns or forbiddenPaths.");
  }

  for (const requiredPattern of SECRET_PATTERNS) {
    if (!forbiddenPatterns.includes(requiredPattern)) {
      addError(errors, `Forbidden patterns must include ${requiredPattern}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateProjectProfileStacks(profile = {}) {
  const errors = [];
  const stacks = profile.stacks || {};

  if (typeof stacks !== "object" || Array.isArray(stacks)) {
    addError(errors, "stacks must be an object.");
  }

  for (const [stackId, stack] of Object.entries(stacks || {})) {
    if (stack && typeof stack === "object" && stack.execute === true) {
      addError(errors, `Stack ${stackId} cannot enable execution in P42.2.`);
    }
    if (stack && typeof stack === "object" && stack.runtimeEnabled === true) {
      addError(errors, `Stack ${stackId} cannot enable runtime adapters in P42.2.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateProjectProfileTestSuites(profile = {}) {
  const errors = [];
  const testSuites = Array.isArray(profile.testSuites) ? profile.testSuites : [];

  if (!Array.isArray(profile.testSuites)) {
    addError(errors, "testSuites must be an array.");
  }

  for (const suite of testSuites) {
    if (suite?.execute === true || suite?.runtimeEnabled === true) {
      addError(errors, `Test suite ${suite.id || suite.label || "unknown"} cannot execute in P42.2.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateProjectProfileSafety(profile = {}) {
  const errors = [];
  const policy = loaderPolicy();

  if (profile.adapterRuntimeEnabled === true || policy.adapterRuntimeEnabled === true) {
    addError(errors, "Adapter runtime must remain disabled in P42.2.");
  }
  if (profile.projectSelectorEnabled === true || policy.projectSelectorEnabled === true) {
    addError(errors, "Project selector must remain disabled until P42.5.");
  }
  if (profile.projectMutationAllowed === true || policy.projectMutationAllowed === true) {
    addError(errors, "Project mutation must remain disabled.");
  }
  if (profile.providerCallsAllowed === true || policy.providerCallsAllowed === true) {
    addError(errors, "Provider calls must remain disabled.");
  }
  if (profile.dbAccessAllowed === true || policy.dbAccessAllowed === true) {
    addError(errors, "DB access must remain disabled for the profile loader.");
  }

  const databases = profile.databases || {};
  for (const [databaseId, database] of Object.entries(databases)) {
    if (database?.connect === true || database?.runtimeEnabled === true) {
      addError(errors, `Database adapter ${databaseId} cannot connect in P42.2.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateProjectProfile(profile = {}, options = {}) {
  const normalized = normalizeProfileShape(profile);
  const errors = [];
  const projectTypes = configuredProjectTypes();

  if (!normalized.projectId || typeof normalized.projectId !== "string") {
    addError(errors, "projectId is required.");
  }
  if (normalized.projectId && !/^[a-z0-9][a-z0-9-]*$/.test(normalized.projectId)) {
    addError(errors, "projectId must be stable lowercase kebab-case.");
  }
  if (!normalized.projectLabel || typeof normalized.projectLabel !== "string") {
    addError(errors, "projectLabel or label is required.");
  }
  if (!VALID_VISIBILITIES.has(normalized.visibility)) {
    addError(errors, "visibility must be internal, local-private, demo, or public-safe.");
  }
  if (!projectTypes.has(normalized.projectType)) {
    addError(errors, `projectType must map to project-registry/project-types.json: ${normalized.projectType}`);
  }

  const boundaryResult = validateProjectProfileBoundaries(normalized, options);
  const stackResult = validateProjectProfileStacks(normalized, options);
  const testSuiteResult = validateProjectProfileTestSuites(normalized, options);
  const safetyResult = validateProjectProfileSafety(normalized, options);
  errors.push(...collectErrors(boundaryResult, stackResult, testSuiteResult, safetyResult));

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    profile: normalized,
  };
}
