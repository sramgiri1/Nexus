import { getRepoRegistry } from "./repoRegistry.js";

export const REPO_RELATIONSHIP_TYPES = [
  "consumes-api",
  "shares-package",
  "deployment-order",
  "test-dependency",
  "documentation-reference",
  "release-coupled",
  "unknown",
];

function hasRepo(registry, repoId) {
  return registry.repos.some((repo) => repo.repoId === repoId);
}

export function buildRepoDependencyMap(registry = getRepoRegistry()) {
  const relationships = [
    {
      fromRepoId: "private-project-ios",
      toRepoId: "private-project-backend",
      relationshipType: "consumes-api",
      direction: "project-to-project",
      reason: "The mobile project may consume project backend APIs when project adapters are enabled later.",
      runtimeCoupled: false,
      requiresReview: true,
    },
    {
      fromRepoId: "nexus-os",
      toRepoId: "private-project-backend",
      relationshipType: "documentation-reference",
      direction: "os-to-project-metadata",
      reason: "NEXUS OS may reference private project metadata without scanning source contents.",
      runtimeCoupled: false,
      requiresReview: true,
    },
    {
      fromRepoId: "nexus-os",
      toRepoId: "private-project-ios",
      relationshipType: "documentation-reference",
      direction: "os-to-project-metadata",
      reason: "NEXUS OS may reference private iOS project metadata without running Xcode commands.",
      runtimeCoupled: false,
      requiresReview: true,
    },
    {
      fromRepoId: "demo-project",
      toRepoId: "nexus-os",
      relationshipType: "documentation-reference",
      direction: "demo-to-os",
      reason: "Demo metadata can explain NEXUS capabilities without leaking local-private project details.",
      runtimeCoupled: false,
      requiresReview: false,
    },
  ].filter((relationship) => hasRepo(registry, relationship.fromRepoId) && hasRepo(registry, relationship.toRepoId));

  return {
    mapVersion: "1.0",
    phase: "P44.2",
    generatedFrom: "repo-registry",
    readOnly: true,
    privateSourceDetailedScanningAllowed: false,
    relationships,
  };
}

export function validateRepoDependencyMap(map) {
  const errors = [];
  const relationships = Array.isArray(map?.relationships) ? map.relationships : [];
  if (map?.mapVersion !== "1.0") errors.push("mapVersion must be 1.0");
  if (map?.phase !== "P44.2") errors.push("phase must be P44.2");
  if (map?.readOnly !== true) errors.push("dependency map must be read-only");
  if (map?.privateSourceDetailedScanningAllowed !== false) {
    errors.push("private source detailed scanning must be disabled");
  }
  if (!relationships.length) errors.push("relationships must not be empty");
  for (const relationship of relationships) {
    if (!relationship.fromRepoId) errors.push("relationship missing fromRepoId");
    if (!relationship.toRepoId) errors.push("relationship missing toRepoId");
    if (!REPO_RELATIONSHIP_TYPES.includes(relationship.relationshipType)) {
      errors.push(`invalid relationshipType: ${relationship.relationshipType}`);
    }
    if (relationship.runtimeCoupled !== false) {
      errors.push(`${relationship.fromRepoId}->${relationship.toRepoId} must not imply runtime coupling`);
    }
  }
  return { valid: errors.length === 0, errors, relationshipCount: relationships.length };
}

export function summarizeRepoBlastRadius(changeScope = {}, registry = getRepoRegistry()) {
  const dependencyMap = buildRepoDependencyMap(registry);
  const repoIds = Array.isArray(changeScope.repoIds) ? changeScope.repoIds : [];
  const touched = new Set(repoIds);
  const related = dependencyMap.relationships.filter(
    (relationship) => touched.has(relationship.fromRepoId) || touched.has(relationship.toRepoId),
  );
  const affectedRepoIds = new Set(repoIds);
  for (const relationship of related) {
    affectedRepoIds.add(relationship.fromRepoId);
    affectedRepoIds.add(relationship.toRepoId);
  }

  return {
    scopeVersion: "1.0",
    phase: "P44.2",
    inputRepoIds: repoIds,
    affectedRepoIds: [...affectedRepoIds],
    relationshipCount: related.length,
    requiresCrossRepoReview: related.some((relationship) => relationship.requiresReview),
    packageBoundaryReviewRequired: [...affectedRepoIds].some((repoId) => repoId === "nexus-os")
      && [...affectedRepoIds].some((repoId) => repoId.startsWith("private-project")),
    gitActionsAllowed: false,
  };
}
