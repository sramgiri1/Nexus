import path from "node:path";
import { readJsonSafe } from "../local-state/safeFileReader.js";
import {
  getNexusMode,
  isDemoMode,
  isLocalPrivateMode,
  isPublicMode,
} from "./privateMode.js";

const ALLOWLIST_PATH = "policy/private-project-allowlist.json";
const ALLOWED_PURPOSES = new Set(["inventory", "read"]);
const BLOCKED_PURPOSES = new Set([
  "write",
  "build",
  "test",
  "execute",
  "mutate",
  "deploy",
]);
const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  "node_modules",
  ".env",
  ".env.local",
  "config",
]);
const BLOCKED_EXTENSIONS = new Set([".pem", ".key", ".p12"]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProjectId(projectId) {
  return normalizeString(projectId).toLowerCase();
}

function normalizePurpose(purpose) {
  return normalizeString(purpose).toLowerCase() || "inventory";
}

function normalizeRelativePath(relativePath) {
  return normalizeString(relativePath).replaceAll("\\", "/");
}

function pathStartsWith(normalizedPath, prefix) {
  return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
}

function isBlockedPath(relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath);

  if (!normalizedPath) {
    return false;
  }

  if (path.isAbsolute(normalizedPath)) {
    return true;
  }

  const normalizedPosixPath = path.posix.normalize(normalizedPath);
  if (
    normalizedPosixPath === ".." ||
    normalizedPosixPath.startsWith("../") ||
    normalizedPosixPath.includes("/../")
  ) {
    return true;
  }

  const pathSegments = normalizedPosixPath.split("/");
  if (pathSegments.some((segment) => BLOCKED_PATH_SEGMENTS.has(segment))) {
    return true;
  }

  return BLOCKED_EXTENSIONS.has(
    path.posix.extname(normalizedPosixPath).toLowerCase()
  );
}

function getAllowlistedEntries() {
  const result = readJsonSafe(ALLOWLIST_PATH);
  if (!result.ok) {
    return {
      ok: false,
      entries: [],
      errors: [result.error || "Unable to read private project allowlist."],
      warnings: [],
    };
  }

  const entries = Array.isArray(result.data?.projects) ? result.data.projects : [];
  return {
    ok: true,
    entries,
    errors: [],
    warnings: [],
  };
}

function findProjectEntry(entries, projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);
  return entries.find(
    (entry) => normalizeProjectId(entry.projectId) === normalizedProjectId
  );
}

function findPathEntry(entries, relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath);
  return entries.find((entry) =>
    pathStartsWith(normalizedPath, normalizeRelativePath(entry.root))
  );
}

export function loadPrivateProjectAllowlist() {
  return getAllowlistedEntries();
}

export function isPrivateProjectAllowed(projectId, mode) {
  const allowlist = getAllowlistedEntries();
  if (!allowlist.ok) {
    return false;
  }

  const resolvedMode = getNexusMode({ NEXUS_MODE: mode });
  if (!isLocalPrivateMode(resolvedMode) && resolvedMode !== "test") {
    return false;
  }

  const projectEntry = findProjectEntry(allowlist.entries, projectId);
  return Boolean(
    projectEntry &&
      Array.isArray(projectEntry.allowedModes) &&
      projectEntry.allowedModes.includes(resolvedMode)
  );
}

export function isPrivatePathAllowed(relativePath, mode) {
  const allowlist = getAllowlistedEntries();
  if (!allowlist.ok || isBlockedPath(relativePath)) {
    return false;
  }

  const resolvedMode = getNexusMode({ NEXUS_MODE: mode });
  if (!isLocalPrivateMode(resolvedMode) && resolvedMode !== "test") {
    return false;
  }

  const pathEntry = findPathEntry(allowlist.entries, relativePath);
  return Boolean(
    pathEntry &&
      Array.isArray(pathEntry.allowedModes) &&
      pathEntry.allowedModes.includes(resolvedMode)
  );
}

export function validatePrivateProjectAccess(input = {}) {
  const errors = [];
  const warnings = [];
  const mode = getNexusMode({ NEXUS_MODE: input.mode });
  const projectId = normalizeProjectId(input.projectId);
  const relativePath = normalizeRelativePath(input.relativePath);
  const purpose = normalizePurpose(input.purpose);
  const actor = normalizeString(input.actor).toLowerCase() || "system";

  const allowlist = getAllowlistedEntries();
  if (!allowlist.ok) {
    return {
      allowed: false,
      reason: "Private project allowlist could not be loaded.",
      mode,
      projectId,
      relativePath,
      purpose,
      actor,
      errors: allowlist.errors,
      warnings,
      matchedProject: null,
    };
  }

  if (!projectId && !relativePath) {
    errors.push("projectId or relativePath is required.");
  }

  if (BLOCKED_PURPOSES.has(purpose)) {
    errors.push(`Purpose '${purpose}' is denied in this phase.`);
  }

  if (!ALLOWED_PURPOSES.has(purpose) && !BLOCKED_PURPOSES.has(purpose)) {
    errors.push(`Purpose '${purpose}' is not recognized by the private mode policy.`);
  }

  if (isBlockedPath(relativePath)) {
    errors.push("Path is blocked by the private mode boundary.");
  }

  if (isPublicMode(mode) || isDemoMode(mode)) {
    errors.push(`Mode '${mode}' blocks private project access.`);
  }

  const matchedProject =
    findProjectEntry(allowlist.entries, projectId) ||
    findPathEntry(allowlist.entries, relativePath) ||
    null;

  if (!matchedProject) {
    errors.push("Project or path is not in the private allowlist.");
  } else {
    if (
      !Array.isArray(matchedProject.allowedModes) ||
      !matchedProject.allowedModes.includes(mode)
    ) {
      errors.push(`Mode '${mode}' is not allowlisted for this private project.`);
    }

    if (
      !Array.isArray(matchedProject.allowedPurposes) ||
      !matchedProject.allowedPurposes.includes(purpose)
    ) {
      errors.push(`Purpose '${purpose}' is not allowlisted for this private project.`);
    }

    if (
      relativePath &&
      !pathStartsWith(relativePath, normalizeRelativePath(matchedProject.root))
    ) {
      errors.push("Path falls outside the allowlisted private project root.");
    }
  }

  if (mode === "test") {
    warnings.push("test mode is for validation only.");
  }

  return {
    allowed: errors.length === 0,
    reason:
      errors.length === 0
        ? `Private project access is allowed for ${purpose}.`
        : errors[0],
    mode,
    projectId,
    relativePath,
    purpose,
    actor,
    errors,
    warnings,
    matchedProject,
  };
}
