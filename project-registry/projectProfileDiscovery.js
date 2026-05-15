import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadProjectProfile } from "./projectProfileLoader.js";

const DEFAULT_DISCOVERY_ROOTS = ["project-registry/examples", "project-registry/fixtures"];

function listJsonFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(root, entry.name));
}

export function discoverProfileCandidates(options = {}) {
  const roots = options.discoveryRoots || DEFAULT_DISCOVERY_ROOTS;
  const candidates = roots.flatMap((root) => listJsonFiles(root));

  return [
    ...candidates,
    {
      path: "projects/*/nexus.project.json",
      status: "planned",
      reason: "Future project profile root is reserved for P42.4 onboarding and later loader integration.",
    },
  ];
}

export function filterAllowedProfileCandidates(candidates, options = {}) {
  const allowedRoots = options.discoveryRoots || DEFAULT_DISCOVERY_ROOTS;
  return candidates.filter((candidate) => {
    const candidatePath = typeof candidate === "string" ? candidate : candidate.path;
    if (candidate.status === "planned") return true;
    return allowedRoots.some((root) => candidatePath.startsWith(`${root}/`));
  });
}

export function discoverProjectProfiles(options = {}) {
  const candidates = filterAllowedProfileCandidates(discoverProfileCandidates(options), options);
  const loadedProfiles = [];
  const plannedProfiles = [];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      plannedProfiles.push(candidate);
      continue;
    }
    loadedProfiles.push(loadProjectProfile(candidate, options));
  }

  return {
    ok: loadedProfiles.every((profile) => profile.ok),
    candidates,
    loadedProfiles,
    plannedProfiles,
    warnings: [],
    errors: loadedProfiles.flatMap((profile) => profile.errors || []),
  };
}

export function summarizeProjectProfileDiscovery(result) {
  return {
    candidates: result.candidates?.length || 0,
    profilesDiscovered: result.loadedProfiles?.length || 0,
    profilesValid: (result.loadedProfiles || []).filter((profile) => profile.ok).length,
    plannedProfileRoots: result.plannedProfiles?.length || 0,
    readOnly: true,
    boundedDiscovery: true,
  };
}
