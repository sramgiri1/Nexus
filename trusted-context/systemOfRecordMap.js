import { getDataSourceById } from "./dataSourceRegistry.js";

const SYSTEM_OF_RECORD_ENTRIES = [
  {
    domain: "project_requirements",
    primarySourceId: "private-project-docs",
    fallbackSourceIds: ["project-profile-pattern", "validation-reports"],
    owner: "Project Owner",
    freshnessRequirement: "manual_verified",
    allowedScopes: ["project", "mission", "task"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Use redacted summaries only; raw project docs are not included in packets.",
    staleIfChanged: ["project docs", "project profile", "mission plan"],
    warnings: [],
    errors: [],
  },
  {
    domain: "project_profile",
    primarySourceId: "project-profile-pattern",
    fallbackSourceIds: ["project-registry"],
    owner: "Project Owner",
    freshnessRequirement: "project_profile_verified",
    allowedScopes: ["project"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Project profile governs stack, tests, and project metadata.",
    staleIfChanged: ["nexus.project.json", "project registry"],
    warnings: [],
    errors: [],
  },
  {
    domain: "project_registry",
    primarySourceId: "project-registry",
    fallbackSourceIds: [],
    owner: "NEXUS",
    freshnessRequirement: "checker_verified",
    allowedScopes: ["portfolio", "project"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Registry is local-private and must not populate demo/public context.",
    staleIfChanged: ["project-registry/projects.json"],
    warnings: [],
    errors: [],
  },
  {
    domain: "os_roadmap",
    primarySourceId: "nexus-os-roadmap",
    fallbackSourceIds: ["os-phase-status"],
    owner: "NEXUS",
    freshnessRequirement: "manual_verified",
    allowedScopes: ["os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "OS roadmap is platform context, not project progress.",
    staleIfChanged: ["NEXUS_PLATFORM_ROADMAP.md", "phase-status.json"],
    warnings: [],
    errors: [],
  },
  {
    domain: "task_state",
    primarySourceId: "runtime-tasks",
    fallbackSourceIds: ["activity-ledger", "audit-ledger"],
    owner: "NEXUS",
    freshnessRequirement: "runtime_snapshot",
    allowedScopes: ["task", "mission", "project"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Task state is read-only metadata until governed runtime execution exists.",
    staleIfChanged: ["tasks.json", "activity ledger"],
    warnings: [],
    errors: [],
  },
  {
    domain: "evidence",
    primarySourceId: "evidence-ledger",
    fallbackSourceIds: ["validation-reports"],
    owner: "AUDITOR",
    freshnessRequirement: "append_only_ledger",
    allowedScopes: ["task", "mission", "project", "os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Evidence summaries may be referenced; raw payloads stay excluded.",
    staleIfChanged: ["evidence ledger", "validation reports"],
    warnings: [],
    errors: [],
  },
  {
    domain: "audit",
    primarySourceId: "audit-ledger",
    fallbackSourceIds: ["safety-reports"],
    owner: "AUDITOR",
    freshnessRequirement: "append_only_ledger",
    allowedScopes: ["safety", "task", "project", "os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Audit context is redacted and read-only.",
    staleIfChanged: ["audit ledger", "safety reports"],
    warnings: [],
    errors: [],
  },
  {
    domain: "activity",
    primarySourceId: "activity-ledger",
    fallbackSourceIds: ["event-ledger"],
    owner: "NEXUS",
    freshnessRequirement: "append_only_ledger",
    allowedScopes: ["runtime", "task", "project", "os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Activity entries are operator-visible summaries, not raw logs.",
    staleIfChanged: ["activity ledger", "event ledger"],
    warnings: [],
    errors: [],
  },
  {
    domain: "validation_result",
    primarySourceId: "validation-reports",
    fallbackSourceIds: ["evidence-ledger"],
    owner: "SENTINEL",
    freshnessRequirement: "generated_at_required",
    allowedScopes: ["task", "project", "os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Validation results must include generated-at metadata.",
    staleIfChanged: ["report regenerated", "test command changes"],
    warnings: [],
    errors: [],
  },
  {
    domain: "release_decision",
    primarySourceId: "audit-ledger",
    fallbackSourceIds: ["validation-reports", "safety-reports"],
    owner: "AUDITOR",
    freshnessRequirement: "manual_verified",
    allowedScopes: ["project", "os"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Release execution is not enabled; decisions are metadata only.",
    staleIfChanged: ["validation report", "safety report", "release gate"],
    warnings: ["Release action bridge is not enabled."],
    errors: [],
  },
  {
    domain: "agent_capability",
    primarySourceId: "agent-registry",
    fallbackSourceIds: ["module-registry"],
    owner: "WARDEN",
    freshnessRequirement: "checker_verified",
    allowedScopes: ["os", "project", "task"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Agent registry is metadata-only and does not grant runtime permissions.",
    staleIfChanged: ["agent registry", "boundary compiler"],
    warnings: [],
    errors: [],
  },
  {
    domain: "policy",
    primarySourceId: "policy-files",
    fallbackSourceIds: ["safety-reports"],
    owner: "WARDEN",
    freshnessRequirement: "manual_verified",
    allowedScopes: ["safety", "os", "project", "task"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Policy context is summarized; raw policy JSON is not primary UI content.",
    staleIfChanged: ["policy file", "safety report"],
    warnings: [],
    errors: [],
  },
  {
    domain: "cost_state",
    primarySourceId: "cost-ledger-future",
    fallbackSourceIds: [],
    owner: "NEXUS",
    freshnessRequirement: "future_cost_center",
    allowedScopes: ["portfolio", "project", "task"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Cost ledger is planned; do not infer provider spend.",
    staleIfChanged: ["future cost center"],
    warnings: ["Cost ledger is planned for a later phase."],
    errors: [],
  },
  {
    domain: "memory",
    primarySourceId: "scoped-memory-stores",
    fallbackSourceIds: ["module-registry"],
    owner: "NEXUS",
    freshnessRequirement: "memory_freshness_policy",
    allowedScopes: ["os", "project", "mission", "task", "session"],
    allowedModes: ["local-private"],
    agentAccessNotes: "Scoped memory is packet-preview only and is not injected into runtime agents.",
    staleIfChanged: ["memory store", "memory freshness model"],
    warnings: [],
    errors: [],
  },
];

export function getSystemOfRecordMap() {
  return {
    mapVersion: "1.0",
    mode: "local-private",
    domains: SYSTEM_OF_RECORD_ENTRIES.map((entry) => ({ ...entry })),
  };
}

export function getSystemOfRecord(domain, context = {}) {
  const entry = getSystemOfRecordMap().domains.find((item) => item.domain === domain);
  if (!entry) return null;
  const mode = context.mode || "local-private";
  const scope = context.scope;
  const modeAllowed = entry.allowedModes.includes(mode);
  const scopeAllowed = !scope || entry.allowedScopes.includes(scope);
  return {
    ...entry,
    modeAllowed,
    scopeAllowed,
    primarySource: getDataSourceById(entry.primarySourceId),
  };
}

export function listSystemOfRecordDomains() {
  return getSystemOfRecordMap().domains.map((entry) => entry.domain);
}

export function validateSystemOfRecordEntry(entry) {
  const errors = [];
  for (const field of [
    "domain",
    "primarySourceId",
    "fallbackSourceIds",
    "owner",
    "freshnessRequirement",
    "allowedScopes",
    "allowedModes",
    "agentAccessNotes",
    "staleIfChanged",
    "warnings",
    "errors",
  ]) {
    if (!(field in entry)) errors.push(`Missing required field: ${field}`);
  }
  if (!Array.isArray(entry.fallbackSourceIds)) errors.push("fallbackSourceIds must be an array");
  if (!Array.isArray(entry.allowedScopes) || entry.allowedScopes.length === 0) errors.push("allowedScopes must be non-empty");
  if (!Array.isArray(entry.allowedModes) || !entry.allowedModes.includes("local-private")) errors.push("allowedModes must include local-private");
  if (!Array.isArray(entry.staleIfChanged)) errors.push("staleIfChanged must be an array");
  if (!Array.isArray(entry.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(entry.errors)) errors.push("errors must be an array");
  if (entry.primarySourceId !== "cost-ledger-future" && entry.primarySourceId !== "scoped-memory-stores" && !getDataSourceById(entry.primarySourceId)) {
    errors.push(`Unknown primary source: ${entry.primarySourceId}`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateSystemOfRecordMap(map = getSystemOfRecordMap()) {
  const errors = [];
  if (map.mapVersion !== "1.0") errors.push("mapVersion must be 1.0");
  if (map.mode !== "local-private") errors.push("mode must be local-private");
  if (!Array.isArray(map.domains)) errors.push("domains must be an array");
  const seen = new Set();
  for (const entry of map.domains || []) {
    if (seen.has(entry.domain)) errors.push(`Duplicate domain: ${entry.domain}`);
    seen.add(entry.domain);
    const result = validateSystemOfRecordEntry(entry);
    errors.push(...result.errors.map((error) => `${entry.domain}: ${error}`));
  }
  return { ok: errors.length === 0, errors };
}
