import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(MODULE_DIR, "projects.json");

function readRegistryJson() {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

function toSafeProjectSummary(project) {
  return {
    projectId: project.projectId,
    label: project.publicSafeLabel || project.displayLabel || project.label,
    displayLabel: project.publicSafeLabel || project.displayLabel || project.label,
    scope: project.scope,
    visibility: project.visibility,
    status: project.status,
    projectType: project.projectType,
    demoOnly: Boolean(project.demoOnly),
    localPrivateOnly: Boolean(project.localPrivateOnly),
    adapterId: project.adapterId || "not-enabled",
    stackProfileId: project.stackProfileId || "not-enabled",
  };
}

export function loadProjectRegistry() {
  return readRegistryJson();
}

export function validateProjectRegistry(registry = loadProjectRegistry()) {
  const errors = [];
  const projects = Array.isArray(registry?.projects) ? registry.projects : [];
  const byId = new Map(projects.map((project) => [project.projectId, project]));

  if (registry?.registryVersion !== "1.0") errors.push("registryVersion must be 1.0");
  if (registry?.source !== "nexus-project-registry") errors.push("source must be nexus-project-registry");
  if (!byId.has("nexus-os")) errors.push("nexus-os entry is required");
  if (!byId.has("private-project-01")) errors.push("private-project-01 entry is required");
  if (!byId.has("demoapp")) errors.push("demoapp entry is required");
  if (registry?.defaultProjectId === "demoapp") errors.push("DemoApp cannot be the default project");
  if (byId.get("demoapp")?.demoOnly !== true) errors.push("DemoApp must be demoOnly");
  if (byId.get("private-project-01")?.publicSafeLabel !== "Private Project") {
    errors.push("Private project placeholder must use public-safe label");
  }

  return {
    valid: errors.length === 0,
    errors,
    projectCount: projects.length,
  };
}

export function listRegistryProjects() {
  return loadProjectRegistry().projects.map(toSafeProjectSummary);
}

export function getRegistryProject(projectId) {
  const project = loadProjectRegistry().projects.find((entry) => entry.projectId === projectId);
  return project ? toSafeProjectSummary(project) : null;
}

export function getDefaultProjectId() {
  return loadProjectRegistry().defaultProjectId;
}

export function getDemoProject() {
  return getRegistryProject("demoapp");
}

export function getPrivateProjectPlaceholder() {
  return getRegistryProject("private-project-01");
}

export function summarizeProjectRegistry() {
  const registry = loadProjectRegistry();
  const projects = registry.projects || [];
  return {
    registryVersion: registry.registryVersion,
    source: registry.source,
    defaultProjectId: registry.defaultProjectId,
    projectCount: projects.length,
    osProjects: projects.filter((project) => project.scope === "os").length,
    privateProjects: projects.filter((project) => project.visibility === "local-private").length,
    demoProjects: projects.filter((project) => project.demoOnly === true).length,
    projectSelectorEnabled: false,
    adapterRuntimeEnabled: false,
  };
}
