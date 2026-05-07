import path from "node:path";
import {
  ALLOWED_WRITE_DIRS,
  BLOCKED_WRITE_DIRS,
  LOCAL_RUNTIME_DIR,
} from "./schema.js";

const BLOCKED_BASENAMES = new Set([".env", ".env.local"]);
const BLOCKED_EXTENSIONS = new Set([".pem", ".key", ".p12"]);
const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    ["sk", "-", "[A-Za-z0-9]{10,}"].join(""),
    ["sk", "-", "ant", "-", "[A-Za-z0-9_-]{6,}"].join(""),
    ["OPENAI", "_", "API", "_", "KEY", "="].join(""),
    ["ANTHROPIC", "_", "API", "_", "KEY", "="].join(""),
    ["DATABASE", "_", "URL", "="].join(""),
    ["-----BEGIN ", "[A-Z ]+", "PRIVATE KEY", "-----"].join(""),
  ].join("|")
);
const SENSITIVE_FIELD_NAMES = new Set(
  [
    "rawPrompt",
    "rawResponse",
    "rawRetrievedContext",
    "token",
    "accessToken",
    "refreshToken",
    "password",
    "secret",
    "apiKey",
    "privateKey",
  ].map((name) => name.toLowerCase())
);

function normalizeRelativePath(relativePath) {
  return String(relativePath || "")
    .replaceAll("\\", "/")
    .trim();
}

function pathStartsWith(normalizedPath, prefix) {
  return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
}

function serializeContent(content) {
  if (typeof content === "string") {
    return content;
  }

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) {
          return [key, "[REDACTED]"];
        }

        return [key, sanitizeValue(entryValue)];
      })
    );
  }

  return value;
}

export function createWriteGuardResult(ok, errors = [], warnings = []) {
  return {
    ok,
    errors,
    warnings,
  };
}

export function assertWritePathAllowed(relativePath) {
  const errors = [];
  const normalizedInput = normalizeRelativePath(relativePath);

  if (!normalizedInput) {
    errors.push("Write path is required.");
    return createWriteGuardResult(false, errors);
  }

  if (path.isAbsolute(normalizedInput)) {
    errors.push("Absolute write paths are not allowed.");
  }

  const normalizedPath = path.posix.normalize(normalizedInput);

  if (
    normalizedPath === ".." ||
    normalizedPath.startsWith("../") ||
    normalizedPath.includes("/../")
  ) {
    errors.push("Path traversal is not allowed.");
  }

  if (
    BLOCKED_WRITE_DIRS.some((blockedDir) =>
      pathStartsWith(normalizedPath, blockedDir)
    )
  ) {
    errors.push("Writes to this directory are blocked.");
  }

  const basename = path.posix.basename(normalizedPath);
  if (BLOCKED_BASENAMES.has(basename)) {
    errors.push("Secret-like files are blocked.");
  }

  const extension = path.posix.extname(normalizedPath).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    errors.push("Secret-like file extensions are blocked.");
  }

  if (
    !ALLOWED_WRITE_DIRS.some((allowedDir) =>
      pathStartsWith(normalizedPath, allowedDir)
    )
  ) {
    errors.push(`Writes are limited to ${LOCAL_RUNTIME_DIR}.`);
  }

  return createWriteGuardResult(errors.length === 0, errors);
}

export function assertNoSecretLikeContent(content) {
  const serializedContent = serializeContent(content);
  const errors = SECRET_PATTERN.test(serializedContent)
    ? ["Secret-like content is not allowed."]
    : [];
  return createWriteGuardResult(errors.length === 0, errors);
}

export function assertNoPrivateProjectReference(content) {
  const serializedContent = serializeContent(content);
  const errors = PRIVATE_NAME_PATTERN.test(serializedContent)
    ? ["Private project references are not allowed."]
    : [];
  return createWriteGuardResult(errors.length === 0, errors);
}

export function sanitizeRecord(record) {
  return sanitizeValue(record);
}
