import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { validateProjectProfile } from "./projectProfileValidator.js";
import { buildProjectProfileSummary } from "./projectProfileSummary.js";

const REPO_ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const DEFAULT_APPROVED_ROOTS = ["project-registry/examples", "project-registry/fixtures", "project-registry"];
const BLOCKED_SEGMENTS = [".git", "node_modules"];
const BLOCKED_PATTERNS = [".env", "secret", "secrets", ".pem", ".p12", ".key"];

function normalizeProfile(profile = {}) {
  const projectLabel = profile.projectLabel || profile.label || "Unknown Project";
  return {
    ...profile,
    projectLabel,
    label: profile.label || projectLabel,
    root: profile.root || profile.metadata?.root || ".",
    allowedRoots: profile.allowedRoots || profile.allowedPaths || [],
    forbiddenPatterns: profile.forbiddenPatterns || profile.forbiddenPaths || [],
    adapterRuntimeEnabled: profile.adapterRuntimeEnabled === true ? true : false,
    projectSelectorEnabled: profile.projectSelectorEnabled === true ? true : false,
    projectMutationAllowed: profile.projectMutationAllowed === true ? true : false,
    providerCallsAllowed: profile.providerCallsAllowed === true ? true : false,
    dbAccessAllowed: profile.dbAccessAllowed === true ? true : false,
  };
}

function toRepoPath(relativePath) {
  return normalize(join(REPO_ROOT, relativePath));
}

function isUnderAllowedRoot(profilePath, approvedRoots) {
  const fullPath = toRepoPath(profilePath);
  return approvedRoots.some((approvedRoot) => {
    const fullRoot = toRepoPath(approvedRoot);
    const rel = relative(fullRoot, fullPath);
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/") && !rel.includes(".."));
  });
}

function validateProfilePath(profilePath, options = {}) {
  const errors = [];
  const approvedRoots = options.approvedRoots || DEFAULT_APPROVED_ROOTS;

  if (!profilePath || typeof profilePath !== "string") errors.push("Profile path is required.");
  if (profilePath?.startsWith("/") || profilePath?.startsWith("~")) errors.push("Absolute profile paths are blocked.");
  if (profilePath?.includes("..") || profilePath?.includes("\\")) errors.push("Profile path traversal is blocked.");
  if (!profilePath?.endsWith(".json")) errors.push("Only JSON project profiles can be loaded.");

  const segments = profilePath?.split("/") || [];
  if (segments.some((segment) => BLOCKED_SEGMENTS.includes(segment))) {
    errors.push("Blocked path segment in project profile path.");
  }
  if (BLOCKED_PATTERNS.some((pattern) => profilePath?.toLowerCase().includes(pattern))) {
    errors.push("Secret-like project profile paths are blocked.");
  }
  if (!isUnderAllowedRoot(profilePath, approvedRoots)) {
    errors.push("Project profile path must be under an approved root.");
  }

  return { valid: errors.length === 0, errors };
}

function failure(profilePath, errors, warnings = []) {
  return {
    ok: false,
    profilePath,
    projectId: "",
    projectLabel: "",
    visibility: "",
    projectType: "",
    normalized: null,
    summary: null,
    warnings,
    errors,
  };
}

export function normalizeProjectProfile(profile, options = {}) {
  return normalizeProfile(profile, options);
}

export function summarizeLoadedProjectProfile(profile) {
  return buildProjectProfileSummary(profile);
}

export function loadProjectProfileFromObject(profile, options = {}) {
  const warnings = [];
  const normalized = normalizeProfile(profile);
  const validation = validateProjectProfile(normalized, options);
  const summary = buildProjectProfileSummary({
    ...normalized,
    profileValid: validation.valid,
  });

  return {
    ok: validation.valid,
    profilePath: options.profilePath || "",
    projectId: normalized.projectId || "",
    projectLabel: normalized.projectLabel || "",
    visibility: normalized.visibility || "",
    projectType: normalized.projectType || "",
    normalized,
    summary,
    warnings,
    errors: validation.errors,
  };
}

export function loadProjectProfile(profilePath, options = {}) {
  const pathValidation = validateProfilePath(profilePath, options);
  if (!pathValidation.valid) return failure(profilePath, pathValidation.errors);

  const fullPath = toRepoPath(profilePath);
  if (!existsSync(fullPath)) return failure(profilePath, ["Project profile does not exist."]);
  if (!statSync(fullPath).isFile()) return failure(profilePath, ["Project profile path is not a file."]);

  try {
    const source = readFileSync(fullPath, "utf8");
    const profile = JSON.parse(source);
    return loadProjectProfileFromObject(profile, { ...options, profilePath });
  } catch (error) {
    return failure(profilePath, [`Project profile JSON could not be loaded: ${error.message}`]);
  }
}

export const PROJECT_PROFILE_APPROVED_ROOTS = DEFAULT_APPROVED_ROOTS;
