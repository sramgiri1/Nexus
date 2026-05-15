import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DATA_CLASSIFICATIONS,
  DATA_SOURCE_TYPES,
  REQUIRED_DATA_SOURCE_FIELDS,
  TRUSTED_CONTEXT_SCOPES,
} from "./dataSourceSchema.js";

const ROOT = process.cwd();

function sourceExists(path) {
  return Boolean(path && !path.includes("*") && existsSync(join(ROOT, path)));
}

function withStatus(source) {
  return {
    ...source,
    sourceExists: sourceExists(source.path),
    rawContentIncluded: false,
  };
}

const SOURCES = [
  {
    sourceId: "nexus-os-roadmap",
    label: "NEXUS OS Roadmap",
    type: "roadmap",
    scope: "os",
    projectId: null,
    path: "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "SHEPHERD", "AUDITOR"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "os-phase-status",
    label: "OS Phase Status Registry",
    type: "phase_status",
    scope: "os",
    projectId: null,
    path: "os-roadmap/phase-status.json",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "SHEPHERD", "AUDITOR"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "checker_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "architecture-docs",
    label: "Architecture Docs",
    type: "architecture_doc",
    scope: "os",
    projectId: null,
    path: "docs/architecture",
    systemOfRecord: false,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "SHEPHERD", "AUDITOR", "PRISM"],
    forbiddenModes: ["public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "agent-registry",
    label: "Agent Registry",
    type: "architecture_doc",
    scope: "os",
    projectId: null,
    path: "agent-registry",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "WARDEN", "AUDITOR"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "checker_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "module-registry",
    label: "Codebase Module Registry",
    type: "module_registry",
    scope: "os",
    projectId: null,
    path: "docs/codebase/MODULE_REGISTRY.md",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "SHEPHERD", "AUDITOR", "PRISM"],
    forbiddenModes: ["public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "project-registry",
    label: "Project Registry",
    type: "project_registry",
    scope: "portfolio",
    projectId: null,
    path: "project-registry/projects.json",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "SHEPHERD", "WARDEN"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "checker_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "project-profile-pattern",
    label: "Project Profile Files",
    type: "project_profile",
    scope: "project",
    projectId: "selected-project",
    path: "projects/*/nexus.project.json",
    systemOfRecord: true,
    owner: "Project Owner",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "SHEPHERD", "CORE", "AUDITOR", "WARDEN"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "project_profile_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "private-project-docs",
    label: "Private Project PRD and Docs",
    type: "project_doc",
    scope: "project",
    projectId: "private-project",
    path: "projects/*/docs",
    systemOfRecord: false,
    owner: "Project Owner",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "SHEPHERD", "CORE", "AUDITOR", "PRISM"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "validation-reports",
    label: "Validation Reports",
    type: "validation_report",
    scope: "runtime",
    projectId: null,
    path: "reports",
    systemOfRecord: false,
    owner: "SENTINEL",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "SENTINEL", "AUDITOR"],
    forbiddenModes: ["public"],
    freshnessPolicy: "generated_at_required",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "runtime-tasks",
    label: "Runtime Task State",
    type: "runtime_state",
    scope: "task",
    projectId: null,
    path: "local-state/runtime/tasks.json",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "SHEPHERD", "CORE", "AUDITOR"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "runtime_snapshot",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "evidence-ledger",
    label: "Evidence Ledger",
    type: "evidence_ledger",
    scope: "task",
    projectId: null,
    path: "local-state/runtime/evidence.jsonl",
    systemOfRecord: true,
    owner: "AUDITOR",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "AUDITOR", "SENTINEL"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "append_only_ledger",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "audit-ledger",
    label: "Audit Ledger",
    type: "audit_ledger",
    scope: "safety",
    projectId: null,
    path: "local-state/runtime/audit.jsonl",
    systemOfRecord: true,
    owner: "AUDITOR",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "AUDITOR", "WARDEN"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "append_only_ledger",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "event-ledger",
    label: "Event Ledger",
    type: "activity_ledger",
    scope: "runtime",
    projectId: null,
    path: "local-state/runtime/events.jsonl",
    systemOfRecord: false,
    owner: "NEXUS",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "AUDITOR", "SENTINEL"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "append_only_ledger",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "activity-ledger",
    label: "Activity Ledger",
    type: "activity_ledger",
    scope: "runtime",
    projectId: null,
    path: "local-state/runtime/activity.jsonl",
    systemOfRecord: true,
    owner: "NEXUS",
    dataClassification: "local-private",
    allowedAgents: ["NEXUS", "AUDITOR", "SENTINEL"],
    forbiddenModes: ["demo", "public"],
    freshnessPolicy: "append_only_ledger",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "policy-files",
    label: "Policy Files",
    type: "policy",
    scope: "safety",
    projectId: null,
    path: "policy",
    systemOfRecord: true,
    owner: "WARDEN",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "WARDEN", "AUDITOR", "SENTINEL"],
    forbiddenModes: ["public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
  {
    sourceId: "safety-reports",
    label: "Public and Boundary Safety Reports",
    type: "safety_report",
    scope: "safety",
    projectId: null,
    path: "reports/public-safety-report.md",
    systemOfRecord: true,
    owner: "WARDEN",
    dataClassification: "internal",
    allowedAgents: ["NEXUS", "WARDEN", "AUDITOR"],
    forbiddenModes: ["public"],
    freshnessPolicy: "checker_verified",
    redactionRequired: true,
    lineageRequired: true,
  },
];

export function getDataSourceRegistry() {
  return {
    registryVersion: "1.0",
    mode: "local-private",
    sources: SOURCES.map(withStatus),
  };
}

export function getDataSourceById(sourceId) {
  return getDataSourceRegistry().sources.find((source) => source.sourceId === sourceId) || null;
}

export function listDataSourcesByProject(projectId) {
  return getDataSourceRegistry().sources.filter((source) => source.projectId === projectId);
}

export function listDataSourcesByScope(scope) {
  return getDataSourceRegistry().sources.filter((source) => source.scope === scope);
}

export function validateDataSource(source) {
  const errors = [];
  for (const field of REQUIRED_DATA_SOURCE_FIELDS) {
    if (!(field in source)) errors.push(`Missing required field: ${field}`);
  }
  if (!DATA_SOURCE_TYPES.includes(source.type)) errors.push(`Invalid source type: ${source.type}`);
  if (!TRUSTED_CONTEXT_SCOPES.includes(source.scope)) errors.push(`Invalid scope: ${source.scope}`);
  if (!DATA_CLASSIFICATIONS.includes(source.dataClassification)) {
    errors.push(`Invalid data classification: ${source.dataClassification}`);
  }
  if (!Array.isArray(source.allowedAgents) || source.allowedAgents.length === 0) {
    errors.push("allowedAgents must be a non-empty array");
  }
  if (!Array.isArray(source.forbiddenModes)) errors.push("forbiddenModes must be an array");
  if (source.dataClassification === "local-private" && !source.forbiddenModes.includes("public")) {
    errors.push("local-private sources must be forbidden in public mode");
  }
  if (source.dataClassification === "local-private" && !source.redactionRequired) {
    errors.push("local-private sources require redaction");
  }
  if (!source.lineageRequired) errors.push("trusted context sources require lineage");
  return { ok: errors.length === 0, errors };
}

export function validateDataSourceRegistry(registry = getDataSourceRegistry()) {
  const errors = [];
  if (registry.registryVersion !== "1.0") errors.push("registryVersion must be 1.0");
  if (registry.mode !== "local-private") errors.push("registry mode must be local-private");
  if (!Array.isArray(registry.sources)) errors.push("sources must be an array");
  const seen = new Set();
  for (const source of registry.sources || []) {
    if (seen.has(source.sourceId)) errors.push(`Duplicate sourceId: ${source.sourceId}`);
    seen.add(source.sourceId);
    const result = validateDataSource(source);
    errors.push(...result.errors.map((error) => `${source.sourceId}: ${error}`));
  }
  return { ok: errors.length === 0, errors };
}
