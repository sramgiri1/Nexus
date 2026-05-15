export const REPO_REGISTRY_VERSION = "1.0";

export const REPO_TYPES = [
  "backend",
  "frontend",
  "mobile-ios",
  "mobile-android",
  "infra",
  "docs",
  "os",
  "unknown",
];

export const REPO_VISIBILITIES = ["local-private", "demo", "public-safe"];

export const REPO_STATUSES = ["active", "planned", "archived", "unavailable"];

export const PACKAGE_BOUNDARIES = ["os", "project", "demo", "external", "unknown"];

const REQUIRED_REPO_FIELDS = [
  "repoId",
  "projectId",
  "label",
  "root",
  "repoType",
  "visibility",
  "status",
  "ownerTeam",
  "ownerAgent",
  "allowedScopes",
  "protectedPaths",
  "forbiddenPaths",
  "defaultBranch",
  "currentBranch",
  "packageBoundary",
];

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateStringArray(value, fieldName, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`);
    return;
  }

  for (const item of value) {
    if (typeof item !== "string") {
      errors.push(`${fieldName} entries must be strings`);
      return;
    }
  }
}

export function validateRepoEntry(entry) {
  const errors = [];

  for (const field of REQUIRED_REPO_FIELDS) {
    if (!(field in (entry || {}))) errors.push(`${field} is required`);
  }

  if (!isString(entry?.repoId)) errors.push("repoId must be a non-empty string");
  if (!isString(entry?.projectId)) errors.push("projectId must be a non-empty string");
  if (!isString(entry?.label)) errors.push("label must be a non-empty string");
  if (!isString(entry?.root)) errors.push("root must be a non-empty string");
  if (!REPO_TYPES.includes(entry?.repoType)) errors.push(`repoType is invalid: ${entry?.repoType}`);
  if (!REPO_VISIBILITIES.includes(entry?.visibility)) errors.push(`visibility is invalid: ${entry?.visibility}`);
  if (!REPO_STATUSES.includes(entry?.status)) errors.push(`status is invalid: ${entry?.status}`);
  if (!isString(entry?.ownerTeam)) errors.push("ownerTeam must be a non-empty string");
  if (!isString(entry?.ownerAgent)) errors.push("ownerAgent must be a non-empty string");
  if (!isString(entry?.defaultBranch)) errors.push("defaultBranch must be a non-empty string");
  if (!isString(entry?.currentBranch)) errors.push("currentBranch must be a non-empty string");
  if (!PACKAGE_BOUNDARIES.includes(entry?.packageBoundary)) {
    errors.push(`packageBoundary is invalid: ${entry?.packageBoundary}`);
  }

  validateStringArray(entry?.allowedScopes, "allowedScopes", errors);
  validateStringArray(entry?.protectedPaths, "protectedPaths", errors);
  validateStringArray(entry?.forbiddenPaths, "forbiddenPaths", errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRepoRegistry(registry) {
  const errors = [];
  const repos = Array.isArray(registry?.repos) ? registry.repos : [];
  const repoIds = new Set();

  if (registry?.registryVersion !== REPO_REGISTRY_VERSION) {
    errors.push(`registryVersion must be ${REPO_REGISTRY_VERSION}`);
  }
  if (registry?.source !== "nexus-repo-workspace") {
    errors.push("source must be nexus-repo-workspace");
  }
  if (!Array.isArray(registry?.repos)) {
    errors.push("repos must be an array");
  }

  for (const repo of repos) {
    const result = validateRepoEntry(repo);
    for (const error of result.errors) {
      errors.push(`${repo?.repoId || "unknown"}: ${error}`);
    }
    if (repoIds.has(repo.repoId)) errors.push(`Duplicate repoId: ${repo.repoId}`);
    repoIds.add(repo.repoId);
  }

  if (!repoIds.has("nexus-os")) errors.push("nexus-os repo entry is required");
  if (!repos.some((repo) => repo.projectId === "private-project-01")) {
    errors.push("private project repo reference is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    repoCount: repos.length,
  };
}
