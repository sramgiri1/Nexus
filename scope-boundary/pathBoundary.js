import { CHANGE_TYPES, SCOPE_TYPES } from "./scopeTypes.js";

const BOUNDARY_PATH_RULES = Object.freeze([
  { category: "nexus_os", roots: ["agents/", "orchestrator/", "local-api/", "local-state/", "runtime/", "providers/", "tools/", "state-machine/", "command-execution/", "scope-boundary/", "project-registry/", "os-roadmap/", "db/", "observability/"] },
  { category: "dashboard", roots: ["dashboard/"] },
  { category: "policy", roots: ["policy/"] },
  { category: "project_ios", roots: ["projects/careloop-ios/", "projects/*-ios/"] },
  { category: "project", roots: ["projects/"] },
  { category: "docs", roots: ["docs/", "README.md"] },
  { category: "demo", roots: ["demo/"] },
  { category: "runtime_state", roots: ["local-state/runtime/", "runtime/"] },
  { category: "generated_report", roots: ["reports/", "artifacts/"] },
]);

const OS_CATEGORIES = new Set(["nexus_os", "dashboard", "policy"]);
const PROJECT_CATEGORIES = new Set(["project", "project_ios"]);

function normalizePath(pathname) {
  return String(pathname || "").replaceAll("\\", "/").replace(/^\.\//, "").trim();
}

function matchesRoot(pathname, root) {
  if (root.includes("*")) {
    const escaped = root.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("\\*", "[^/]+");
    return new RegExp(`^${escaped}`).test(pathname);
  }
  if (root.endsWith("/")) return pathname.startsWith(root);
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function getBoundaryPathRules() {
  return BOUNDARY_PATH_RULES.map((rule) => ({
    category: rule.category,
    roots: [...rule.roots],
  }));
}

export function classifyPathScope(pathname) {
  const normalizedPath = normalizePath(pathname);
  const matchedRule = BOUNDARY_PATH_RULES.find((rule) => rule.roots.some((root) => matchesRoot(normalizedPath, root)));
  const category = matchedRule?.category || "unknown";

  return {
    path: normalizedPath,
    category,
    matchedRoot: matchedRule?.roots.find((root) => matchesRoot(normalizedPath, root)) || "",
    isOs: OS_CATEGORIES.has(category),
    isProject: PROJECT_CATEGORIES.has(category),
    requiresReview: category === "unknown",
  };
}

function changeTypeForCategories(categories) {
  const hasProject = categories.some((category) => PROJECT_CATEGORIES.has(category));
  const hasOs = categories.some((category) => OS_CATEGORIES.has(category) || category === "docs" || category === "generated_report");
  const hasDemoOnly = categories.length > 0 && categories.every((category) => category === "demo");
  const hasUnknown = categories.includes("unknown");

  if (hasProject && hasOs) return CHANGE_TYPES.CROSS_CUTTING_CHANGE;
  if (hasUnknown) return CHANGE_TYPES.UNKNOWN_CHANGE;
  if (hasDemoOnly) return CHANGE_TYPES.DEMO_CHANGE;
  if (hasProject) return CHANGE_TYPES.PROJECT_CHANGE;
  if (hasOs) return CHANGE_TYPES.NEXUS_OS_CHANGE;
  return CHANGE_TYPES.UNKNOWN_CHANGE;
}

function scopeTypeForChangeType(changeType) {
  if (changeType === CHANGE_TYPES.NEXUS_OS_CHANGE) return SCOPE_TYPES.NEXUS_OS;
  if (changeType === CHANGE_TYPES.PROJECT_CHANGE) return SCOPE_TYPES.PROJECT;
  if (changeType === CHANGE_TYPES.CROSS_CUTTING_CHANGE) return SCOPE_TYPES.CROSS_CUTTING;
  if (changeType === CHANGE_TYPES.DEMO_CHANGE) return SCOPE_TYPES.DEMO;
  return SCOPE_TYPES.UNKNOWN;
}

export function classifyChangedPaths(paths = []) {
  const pathScopes = (Array.isArray(paths) ? paths : []).map(classifyPathScope);
  const categories = [...new Set(pathScopes.map((entry) => entry.category))];
  const changeType = changeTypeForCategories(categories);

  return {
    boundaryVersion: "1.0",
    changeScope: changeType,
    scopeType: scopeTypeForChangeType(changeType),
    paths: pathScopes.map((entry) => entry.path),
    pathScopes,
    categories,
    requiresReview: changeType === CHANGE_TYPES.CROSS_CUTTING_CHANGE || changeType === CHANGE_TYPES.UNKNOWN_CHANGE,
    warnings: changeType === CHANGE_TYPES.UNKNOWN_CHANGE ? ["One or more paths do not match known boundary rules."] : [],
    errors: [],
  };
}

export function summarizeBoundaryClassification(result = {}) {
  return {
    changeScope: result.changeScope || CHANGE_TYPES.UNKNOWN_CHANGE,
    pathCount: Array.isArray(result.paths) ? result.paths.length : 0,
    categories: result.categories || [],
    requiresReview: Boolean(result.requiresReview),
  };
}

export function validateBoundaryRules(rules = getBoundaryPathRules()) {
  const errors = [];
  if (!Array.isArray(rules) || rules.length === 0) errors.push("rules must be a non-empty array");
  for (const rule of rules) {
    if (!rule.category) errors.push("each rule needs category");
    if (!Array.isArray(rule.roots) || rule.roots.length === 0) errors.push(`${rule.category || "unknown"} needs roots`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
