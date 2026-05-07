import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALLOWED_SOURCE_DIRS, BLOCKED_SOURCE_DIRS } from "./schema.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOCKED_BASENAMES = new Set([".env", ".env.local"]);
const BLOCKED_EXTENSIONS = new Set([".pem", ".key", ".p12"]);

function normalizeRelativePath(relativePath) {
  return String(relativePath || "")
    .replaceAll("\\", "/")
    .trim();
}

function pathStartsWith(normalizedPath, prefix) {
  return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
}

function getSafePath(relativePath) {
  const normalizedInput = normalizeRelativePath(relativePath);

  if (!normalizedInput) {
    return { ok: false, error: "Path is required." };
  }

  if (path.isAbsolute(normalizedInput)) {
    return { ok: false, error: "Absolute paths are not allowed." };
  }

  const normalizedPath = path.posix.normalize(normalizedInput);

  if (
    normalizedPath === ".." ||
    normalizedPath.startsWith("../") ||
    normalizedPath.includes("/../")
  ) {
    return { ok: false, error: "Path traversal is not allowed." };
  }

  if (
    BLOCKED_SOURCE_DIRS.some((blockedDir) =>
      pathStartsWith(normalizedPath, blockedDir)
    )
  ) {
    return { ok: false, error: "Path is inside a blocked directory." };
  }

  const basename = path.posix.basename(normalizedPath);
  if (BLOCKED_BASENAMES.has(basename)) {
    return { ok: false, error: "Secret-like files are not allowed." };
  }

  const extension = path.posix.extname(normalizedPath).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, error: "Secret-like file extensions are not allowed." };
  }

  if (
    !ALLOWED_SOURCE_DIRS.some((allowedDir) =>
      pathStartsWith(normalizedPath, allowedDir)
    )
  ) {
    return { ok: false, error: "Path is outside approved local-state directories." };
  }

  const absolutePath = path.resolve(REPO_ROOT, normalizedPath);
  if (absolutePath !== REPO_ROOT && !absolutePath.startsWith(`${REPO_ROOT}${path.sep}`)) {
    return { ok: false, error: "Resolved path escapes repo root." };
  }

  return { ok: true, absolutePath, normalizedPath };
}

export function getRepoRoot() {
  return REPO_ROOT;
}

export function isPathAllowed(relativePath) {
  return getSafePath(relativePath).ok;
}

export function readJsonSafe(relativePath) {
  const safePath = getSafePath(relativePath);
  if (!safePath.ok) {
    return {
      ok: false,
      path: normalizeRelativePath(relativePath),
      data: null,
      error: safePath.error,
    };
  }

  try {
    const raw = fs.readFileSync(safePath.absolutePath, "utf8");
    return {
      ok: true,
      path: safePath.normalizedPath,
      data: JSON.parse(raw),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      path: safePath.normalizedPath,
      data: null,
      error: error instanceof Error ? error.message : "Failed to read JSON.",
    };
  }
}

export function readTextSafe(relativePath) {
  const safePath = getSafePath(relativePath);
  if (!safePath.ok) {
    return {
      ok: false,
      path: normalizeRelativePath(relativePath),
      text: "",
      error: safePath.error,
    };
  }

  try {
    return {
      ok: true,
      path: safePath.normalizedPath,
      text: fs.readFileSync(safePath.absolutePath, "utf8"),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      path: safePath.normalizedPath,
      text: "",
      error: error instanceof Error ? error.message : "Failed to read text.",
    };
  }
}

export function listFilesSafe(relativeDir, options = {}) {
  const { recursive = false, extensions = [] } = options;
  const safePath = getSafePath(relativeDir);

  if (!safePath.ok) {
    return {
      ok: false,
      path: normalizeRelativePath(relativeDir),
      files: [],
      error: safePath.error,
    };
  }

  try {
    const files = [];
    const visit = (absoluteDir, relativeBase) => {
      const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
      for (const entry of entries) {
        const childRelative = path.posix.join(relativeBase, entry.name);
        if (!isPathAllowed(childRelative)) {
          continue;
        }

        const childAbsolute = path.resolve(absoluteDir, entry.name);
        if (entry.isDirectory()) {
          if (recursive) {
            visit(childAbsolute, childRelative);
          }
          continue;
        }

        if (
          extensions.length &&
          !extensions.includes(path.posix.extname(childRelative).toLowerCase())
        ) {
          continue;
        }

        files.push(childRelative);
      }
    };

    visit(safePath.absolutePath, safePath.normalizedPath);

    return {
      ok: true,
      path: safePath.normalizedPath,
      files: files.sort(),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      path: safePath.normalizedPath,
      files: [],
      error: error instanceof Error ? error.message : "Failed to list files.",
    };
  }
}
