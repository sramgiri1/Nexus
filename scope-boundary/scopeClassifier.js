import {
  CHANGE_TYPES,
  SCOPE_DATA_CLASSIFICATIONS,
  SCOPE_RISK_LEVELS,
  SCOPE_STATUS,
  SCOPE_TYPES,
  isValidChangeType,
  isValidScopeType,
} from "./scopeTypes.js";

const SCOPE_VERSION = "1.0";

const NEXUS_OS_ROOTS = [
  "agents/",
  "orchestrator/",
  "local-api/",
  "db/",
  "dashboard/",
  "scope-boundary/",
  "project-registry/",
  "os-roadmap/",
  "policy/",
  "scripts/",
  "docs/architecture/",
  "docs/codebase/",
  "docs/usage/",
  "reports/",
  "README.md",
  "package.json",
  "nexus.services.json",
];

const DEMO_ROOTS = [
  "demo/",
  "docs/demo",
  "public/demo",
];

function normalizePath(inputPath) {
  return String(inputPath || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .trim();
}

function startsWithRoot(inputPath, root) {
  if (!root) return false;
  const normalizedRoot = normalizePath(root);
  if (normalizedRoot === ".") return false;
  if (normalizedRoot.endsWith("/")) return inputPath.startsWith(normalizedRoot);
  return inputPath === normalizedRoot || inputPath.startsWith(`${normalizedRoot}/`);
}

function projectRootsFromContext(context = {}) {
  const registryProjects = Array.isArray(context.projectRegistry?.projects)
    ? context.projectRegistry.projects
    : [];
  const configuredRoots = registryProjects.flatMap((project) => {
    const roots = [
      project.root,
      ...(Array.isArray(project.allowedRoots) ? project.allowedRoots : []),
    ].filter(Boolean);
    return roots.map((root) => ({
      root: normalizePath(root),
      projectId: project.projectId || null,
    }));
  });

  return configuredRoots.filter((entry) => entry.root && entry.root !== ".");
}

function genericProjectRoot(inputPath) {
  const match = inputPath.match(/^projects\/[^/]+(?:\/|$)/);
  return match ? match[0].replace(/\/$/, "") : "";
}

function baseClassification(overrides = {}) {
  const scopeType = overrides.scopeType || SCOPE_TYPES.UNKNOWN;
  const changeType = overrides.changeType || CHANGE_TYPES.UNKNOWN_CHANGE;
  const requiresReview = Boolean(
    overrides.requiresReview
      || scopeType === SCOPE_TYPES.CROSS_CUTTING
      || scopeType === SCOPE_TYPES.UNKNOWN,
  );

  return {
    scopeVersion: SCOPE_VERSION,
    scopeType,
    changeType,
    projectId: overrides.projectId || null,
    matchedRoots: overrides.matchedRoots || [],
    unmatchedPaths: overrides.unmatchedPaths || [],
    requiresReview,
    requiresProjectBoundaryCheck: Boolean(
      overrides.requiresProjectBoundaryCheck || scopeType === SCOPE_TYPES.PROJECT,
    ),
    requiresOsBoundaryCheck: Boolean(
      overrides.requiresOsBoundaryCheck || scopeType === SCOPE_TYPES.NEXUS_OS,
    ),
    packagingRisk: overrides.packagingRisk || SCOPE_RISK_LEVELS.HIGH,
    dataClassification: overrides.dataClassification || SCOPE_DATA_CLASSIFICATIONS.INTERNAL,
    status: requiresReview ? SCOPE_STATUS.REQUIRES_REVIEW : SCOPE_STATUS.CLASSIFIED,
    warnings: overrides.warnings || [],
    errors: overrides.errors || [],
  };
}

export function classifyPath(path, context = {}) {
  const inputPath = normalizePath(path);
  if (!inputPath) {
    return baseClassification({
      unmatchedPaths: [path],
      warnings: ["Path is empty or missing."],
    });
  }

  const demoRoot = DEMO_ROOTS.find((root) => startsWithRoot(inputPath, root));
  if (demoRoot) {
    return baseClassification({
      scopeType: SCOPE_TYPES.DEMO,
      changeType: CHANGE_TYPES.DEMO_CHANGE,
      matchedRoots: [demoRoot],
      packagingRisk: SCOPE_RISK_LEVELS.LOW,
      dataClassification: SCOPE_DATA_CLASSIFICATIONS.PUBLIC,
    });
  }

  const projectRoot = projectRootsFromContext(context).find((entry) => startsWithRoot(inputPath, entry.root));
  if (projectRoot) {
    return baseClassification({
      scopeType: SCOPE_TYPES.PROJECT,
      changeType: CHANGE_TYPES.PROJECT_CHANGE,
      projectId: projectRoot.projectId,
      matchedRoots: [projectRoot.root],
      packagingRisk: SCOPE_RISK_LEVELS.MEDIUM,
      dataClassification: SCOPE_DATA_CLASSIFICATIONS.CONFIDENTIAL,
    });
  }

  const genericRoot = genericProjectRoot(inputPath);
  if (genericRoot) {
    return baseClassification({
      scopeType: SCOPE_TYPES.PROJECT,
      changeType: CHANGE_TYPES.PROJECT_CHANGE,
      projectId: context.projectId || "unregistered-project",
      matchedRoots: [genericRoot],
      packagingRisk: SCOPE_RISK_LEVELS.MEDIUM,
      dataClassification: SCOPE_DATA_CLASSIFICATIONS.CONFIDENTIAL,
      warnings: ["Project path is not registered yet; project boundary review is required."],
    });
  }

  const osRoot = NEXUS_OS_ROOTS.find((root) => startsWithRoot(inputPath, root));
  if (osRoot) {
    return baseClassification({
      scopeType: SCOPE_TYPES.NEXUS_OS,
      changeType: CHANGE_TYPES.NEXUS_OS_CHANGE,
      matchedRoots: [osRoot],
      packagingRisk: SCOPE_RISK_LEVELS.LOW,
      dataClassification: SCOPE_DATA_CLASSIFICATIONS.INTERNAL,
    });
  }

  return baseClassification({
    unmatchedPaths: [inputPath],
    warnings: ["Path does not match a known NEXUS OS, project, or demo root."],
  });
}

function combineClassifications(classifications) {
  const scopeTypes = new Set(classifications.map((entry) => entry.scopeType));
  const matchedRoots = [...new Set(classifications.flatMap((entry) => entry.matchedRoots))];
  const unmatchedPaths = [...new Set(classifications.flatMap((entry) => entry.unmatchedPaths))];
  const warnings = classifications.flatMap((entry) => entry.warnings);
  const errors = classifications.flatMap((entry) => entry.errors);

  if (scopeTypes.has(SCOPE_TYPES.NEXUS_OS) && scopeTypes.has(SCOPE_TYPES.PROJECT)) {
    return baseClassification({
      scopeType: SCOPE_TYPES.CROSS_CUTTING,
      changeType: CHANGE_TYPES.CROSS_CUTTING_CHANGE,
      matchedRoots,
      unmatchedPaths,
      requiresProjectBoundaryCheck: true,
      requiresOsBoundaryCheck: true,
      packagingRisk: SCOPE_RISK_LEVELS.HIGH,
      dataClassification: SCOPE_DATA_CLASSIFICATIONS.CONFIDENTIAL,
      warnings: ["File set crosses NEXUS OS and project boundaries."],
      errors,
    });
  }

  if (scopeTypes.size === 1) {
    return {
      ...classifications[0],
      matchedRoots,
      unmatchedPaths,
      warnings,
      errors,
    };
  }

  if (scopeTypes.has(SCOPE_TYPES.UNKNOWN)) {
    return baseClassification({
      scopeType: SCOPE_TYPES.UNKNOWN,
      changeType: CHANGE_TYPES.UNKNOWN_CHANGE,
      matchedRoots,
      unmatchedPaths,
      packagingRisk: SCOPE_RISK_LEVELS.HIGH,
      warnings: ["File set includes at least one unknown scope."],
      errors,
    });
  }

  return baseClassification({
    scopeType: SCOPE_TYPES.CROSS_CUTTING,
    changeType: CHANGE_TYPES.CROSS_CUTTING_CHANGE,
    matchedRoots,
    unmatchedPaths,
    requiresProjectBoundaryCheck: true,
    requiresOsBoundaryCheck: true,
    packagingRisk: SCOPE_RISK_LEVELS.HIGH,
    dataClassification: SCOPE_DATA_CLASSIFICATIONS.CONFIDENTIAL,
    warnings: ["File set spans multiple scope categories."],
    errors,
  });
}

export function classifyFileSet(paths = [], context = {}) {
  const normalizedPaths = Array.isArray(paths) ? paths : [];
  if (normalizedPaths.length === 0) {
    return baseClassification({
      unmatchedPaths: [],
      warnings: ["No paths were provided for classification."],
    });
  }

  const classifications = normalizedPaths.map((path) => classifyPath(path, context));
  return combineClassifications(classifications);
}

function pathsFromWorkItem(workItem = {}) {
  return [
    workItem.path,
    ...(Array.isArray(workItem.paths) ? workItem.paths : []),
    ...(Array.isArray(workItem.files) ? workItem.files : []),
    ...(Array.isArray(workItem.targetPaths) ? workItem.targetPaths : []),
    ...(Array.isArray(workItem.allowedPaths) ? workItem.allowedPaths : []),
    ...(Array.isArray(workItem.changedFiles) ? workItem.changedFiles : []),
  ].filter(Boolean);
}

export function classifyTaskScope(task = {}, context = {}) {
  return {
    ...classifyFileSet(pathsFromWorkItem(task), context),
    taskId: task.taskId || task.id || null,
  };
}

export function classifyActionScope(action = {}, context = {}) {
  return {
    ...classifyFileSet(pathsFromWorkItem(action), context),
    actionId: action.actionId || action.id || null,
  };
}

export function summarizeScopeClassification(classification = {}) {
  return {
    scopeType: classification.scopeType || SCOPE_TYPES.UNKNOWN,
    changeType: classification.changeType || CHANGE_TYPES.UNKNOWN_CHANGE,
    status: classification.status || SCOPE_STATUS.UNCLASSIFIED,
    requiresReview: Boolean(classification.requiresReview),
    requiresProjectBoundaryCheck: Boolean(classification.requiresProjectBoundaryCheck),
    requiresOsBoundaryCheck: Boolean(classification.requiresOsBoundaryCheck),
    packagingRisk: classification.packagingRisk || SCOPE_RISK_LEVELS.HIGH,
    matchedRootCount: Array.isArray(classification.matchedRoots) ? classification.matchedRoots.length : 0,
    unmatchedPathCount: Array.isArray(classification.unmatchedPaths) ? classification.unmatchedPaths.length : 0,
  };
}

export function validateScopeClassification(classification = {}) {
  const errors = [];
  if (classification.scopeVersion !== SCOPE_VERSION) errors.push("scopeVersion must be 1.0");
  if (!isValidScopeType(classification.scopeType)) errors.push("scopeType is invalid");
  if (!isValidChangeType(classification.changeType)) errors.push("changeType is invalid");
  if (!Array.isArray(classification.matchedRoots)) errors.push("matchedRoots must be an array");
  if (!Array.isArray(classification.unmatchedPaths)) errors.push("unmatchedPaths must be an array");
  if (!Array.isArray(classification.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(classification.errors)) errors.push("errors must be an array");

  return {
    valid: errors.length === 0,
    errors,
  };
}
