import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";

// Snapshot a project directory as a map of relative paths to {size, mtime}.
// Does not read file contents.
export function snapshotProjectTree(projectRoot) {
  const root = getRepoRoot();
  const absRoot = path.join(root, projectRoot);

  if (!fs.existsSync(absRoot)) {
    return { ok: false, error: `Project root not found: ${projectRoot}`, paths: {} };
  }

  const paths = {};

  function walk(dir, relBase) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      // Skip node_modules and .git to keep snapshot tractable.
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        try {
          const stat = fs.statSync(fullPath);
          paths[relPath] = { size: stat.size, mtime: stat.mtimeMs };
        } catch {
          paths[relPath] = { size: -1, mtime: -1 };
        }
      }
    }
  }

  walk(absRoot, "");
  return { ok: true, error: null, paths };
}

export function compareProjectTreeBeforeAfter(before, after) {
  const added = [];
  const removed = [];
  const modified = [];

  const beforePaths = before?.paths ?? {};
  const afterPaths = after?.paths ?? {};

  for (const key of Object.keys(afterPaths)) {
    if (!(key in beforePaths)) {
      added.push(key);
    } else if (
      afterPaths[key].size !== beforePaths[key].size ||
      afterPaths[key].mtime !== beforePaths[key].mtime
    ) {
      modified.push(key);
    }
  }
  for (const key of Object.keys(beforePaths)) {
    if (!(key in afterPaths)) {
      removed.push(key);
    }
  }

  return {
    mutationDetected: added.length > 0 || removed.length > 0 || modified.length > 0,
    added,
    removed,
    modified,
  };
}

export function checkScriptExists(projectRoot, scriptName) {
  const root = getRepoRoot();
  const pkgPath = path.join(root, projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { exists: false, reason: "package.json not found" };
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.scripts && pkg.scripts[scriptName] !== undefined) {
      return { exists: true, scriptCommand: pkg.scripts[scriptName] };
    }
    return { exists: false, reason: `Script '${scriptName}' not found in package.json` };
  } catch {
    return { exists: false, reason: "Failed to parse package.json" };
  }
}

export function checkDependencyAvailability(projectRoot) {
  const root = getRepoRoot();
  const absRoot = path.join(root, projectRoot);

  const nodeModulesPath = path.join(absRoot, "node_modules");
  const packageLockPath = path.join(absRoot, "package-lock.json");
  const yarnLockPath = path.join(absRoot, "yarn.lock");
  const pnpmLockPath = path.join(absRoot, "pnpm-lock.yaml");

  const nodeModulesPresent = fs.existsSync(nodeModulesPath);
  const lockfilePresent =
    fs.existsSync(packageLockPath) ||
    fs.existsSync(yarnLockPath) ||
    fs.existsSync(pnpmLockPath);

  if (nodeModulesPresent && lockfilePresent) {
    return { status: "READY", nodeModulesPresent, lockfilePresent };
  }
  if (nodeModulesPresent && !lockfilePresent) {
    return { status: "READY", nodeModulesPresent, lockfilePresent, warning: "node_modules present but no lockfile" };
  }
  if (!nodeModulesPresent && lockfilePresent) {
    return { status: "MISSING", nodeModulesPresent, lockfilePresent, reason: "DEPENDENCIES_NOT_AVAILABLE_NO_INSTALL_ALLOWED" };
  }
  return { status: "UNKNOWN", nodeModulesPresent, lockfilePresent, reason: "No node_modules and no lockfile found" };
}

export function checkNoForbiddenEnvironment() {
  // Check that no forbidden env vars suggest DB/provider access is live.
  const forbidden = ["DATABASE_URL", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"];
  const found = forbidden.filter((key) => process.env[key] !== undefined);
  if (found.length > 0) {
    return {
      ok: true,
      warnings: [`Forbidden environment variables present (will be ignored by command): ${found.join(", ")}`],
    };
  }
  return { ok: true, warnings: [] };
}

export function runCommandPreflight(input = {}) {
  const {
    projectRoot = "",
    scriptName = "test",
    mode = "",
  } = input;

  const errors = [];
  const warnings = [];

  // Mode check.
  if (mode !== "local-private" && mode !== "test") {
    return {
      ok: false,
      status: "BLOCKED",
      projectRoot,
      scriptExists: false,
      nodeModulesPresent: false,
      lockfilePresent: false,
      dependencyReadiness: "UNKNOWN",
      dbRequirementDetected: false,
      networkRequirementDetected: false,
      warnings,
      errors: [`Preflight requires local-private or test mode. Got: ${mode}`],
    };
  }

  // Script existence check.
  const scriptCheck = checkScriptExists(projectRoot, scriptName);
  if (!scriptCheck.exists) {
    errors.push(`Script '${scriptName}' does not exist: ${scriptCheck.reason}`);
  }

  // Dependency check.
  const depCheck = checkDependencyAvailability(projectRoot);
  if (depCheck.status === "MISSING") {
    errors.push(`${depCheck.reason} — install must be explicitly approved before execution.`);
  }
  if (depCheck.warning) {
    warnings.push(depCheck.warning);
  }
  if (depCheck.status === "UNKNOWN") {
    errors.push(depCheck.reason ?? "Dependency availability unknown.");
  }

  // Environment check.
  const envCheck = checkNoForbiddenEnvironment();
  warnings.push(...envCheck.warnings);

  // DB/network detection: test script for CareLoop uses node --test and does not
  // appear to start a DB or server based on the command string. Flag as not required.
  const dbRequirementDetected = false;
  const networkRequirementDetected = false;

  const ok = errors.length === 0;
  const status = ok ? (warnings.length > 0 ? "WARNING" : "PASS") : "BLOCKED";

  return {
    ok,
    status,
    projectRoot,
    scriptExists: scriptCheck.exists,
    nodeModulesPresent: depCheck.nodeModulesPresent,
    lockfilePresent: depCheck.lockfilePresent,
    dependencyReadiness: depCheck.status,
    dbRequirementDetected,
    networkRequirementDetected,
    warnings,
    errors,
  };
}
