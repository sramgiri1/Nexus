import { getRepoRegistry } from "./repoRegistry.js";

export function buildRepoOwnershipMap(registry = getRepoRegistry()) {
  const repos = Array.isArray(registry?.repos) ? registry.repos : [];
  const owners = repos.map((repo) => ({
    repoId: repo.repoId,
    projectId: repo.projectId,
    label: repo.label,
    ownerTeam: repo.ownerTeam,
    ownerAgent: repo.ownerAgent,
    visibility: repo.visibility,
    packageBoundary: repo.packageBoundary,
    escalation: repo.packageBoundary === "os" ? "NEXUS platform review" : "Project boundary review",
    writesAllowed: false,
  }));

  return {
    mapVersion: "1.0",
    phase: "P44.2",
    generatedFrom: "repo-registry",
    readOnly: true,
    owners,
  };
}

export function validateRepoOwnershipMap(map) {
  const errors = [];
  const owners = Array.isArray(map?.owners) ? map.owners : [];
  if (map?.mapVersion !== "1.0") errors.push("mapVersion must be 1.0");
  if (map?.phase !== "P44.2") errors.push("phase must be P44.2");
  if (map?.readOnly !== true) errors.push("ownership map must be read-only");
  if (!owners.length) errors.push("owners must not be empty");
  for (const owner of owners) {
    for (const field of ["repoId", "projectId", "label", "ownerTeam", "ownerAgent", "packageBoundary"]) {
      if (!owner[field]) errors.push(`${owner.repoId || "unknown"} missing ${field}`);
    }
    if (owner.writesAllowed !== false) errors.push(`${owner.repoId} must keep writes disabled`);
  }
  return { valid: errors.length === 0, errors, ownerCount: owners.length };
}
