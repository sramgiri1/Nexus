import { createPassResult } from "../shared/resultEnvelope.js";

export const P72_2_REQUIRED_FIELDS = Object.freeze([
  "runtimeId",
  "dbPrimaryState",
  "fallbackState",
  "migrationState",
  "allowedFiles",
  "forbiddenFiles",
  "dbWritesAllowed",
  "migrationsAllowed",
  "schemaMutationAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_ALLOWED_FILES = Object.freeze([
  "db-runtime/p72-2-placeholder.js",
  "scripts/check-p722.js",
  "reports/p722-report.md",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tool-governance/adapters/**",
  "worker-runtime/workerRunner.js",
  "worker-runtime/queueRunner.js",
  "deploy/**",
  "release/**",
  "scripts/db*.js",
  "scripts/migrate*.js",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasForbiddenWritePath(paths = []) {
  return normalizeList(paths).some((filePath) =>
    filePath.startsWith("projects/") ||
    filePath.startsWith("db/") ||
    filePath.startsWith("prisma/") ||
    filePath.startsWith("migrations/"),
  );
}

export function createDbRuntimePrimaryContract(input = {}) {
  return {
    runtimeId: input.runtimeId || "db-runtime-primary-preview",
    dbPrimaryState: input.dbPrimaryState || "contract_ready_for_review",
    fallbackState: input.fallbackState || "file_backed_runtime_remains_primary",
    migrationState: input.migrationState || "migration_preview_required",
    allowedFiles: normalizeList(input.allowedFiles).length > 0 ? normalizeList(input.allowedFiles) : [...DEFAULT_ALLOWED_FILES],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    dbWritesAllowed: false,
    migrationsAllowed: false,
    schemaMutationAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P72.2 records DB runtime primary contracts only; DB writes, migrations, and schema mutation remain disabled.",
    blockers: [
      "DB writes are disabled.",
      "Migrations and schema mutation are disabled.",
      "File-backed runtime remains primary until a future approved phase explicitly enables DB mutation.",
      "Project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p722-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P72.2"])],
    costImpact: "No DB service calls, provider calls, network calls, deploy/release/export execution, package creation, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.dbRuntimePrimaryPreview",
    nextAction: input.nextAction || "Route this DB runtime contract through P72.3 migration preview.",
    commandCenterVisible: true,
  };
}

export function validateDbRuntimePrimaryContract(contract = {}) {
  const errors = [];
  for (const field of P72_2_REQUIRED_FIELDS) {
    if (!(field in contract)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(contract.allowedFiles) || contract.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasForbiddenWritePath(contract.allowedFiles)) errors.push("allowedFiles must not include project, DB, Prisma, or migration paths");
  if (!Array.isArray(contract.forbiddenFiles) || !contract.forbiddenFiles.includes("db/**") || !contract.forbiddenFiles.includes("prisma/**")) errors.push("forbiddenFiles must include db/** and prisma/**");
  if (contract.dbWritesAllowed !== false || contract.migrationsAllowed !== false || contract.schemaMutationAllowed !== false) errors.push("DB writes, migrations, and schema mutation must be false");
  if (contract.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (contract.providerDispatchAllowed !== false || contract.toolExecutionAllowed !== false || contract.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (contract.networkCallsAllowed !== false || contract.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (contract.deployExecutionAllowed !== false || contract.releaseExecutionAllowed !== false || contract.exportExecutionAllowed !== false || contract.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!contract.disabledReason || /write now|migrate now|schema now|run db|execute now/i.test(contract.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(contract.blockers) || contract.blockers.length < 4) errors.push("blockers must be visible");
  if (!Array.isArray(contract.evidenceRefs) || contract.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(contract.activityRefs) || contract.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildDbRuntimePrimaryContractEnvelope(input = {}) {
  const contract = createDbRuntimePrimaryContract(input);
  return createPassResult({
    phase: "P72.2",
    mode: "preview-only",
    source: "db-runtime/p72-2-placeholder.js",
    summary: "DB runtime primary contract recorded without enabling DB writes, migrations, or schema mutation.",
    data: { contract },
    evidence: contract.evidenceRefs,
  });
}

export const P72_2_SAMPLE_CONTRACTS = Object.freeze([
  createDbRuntimePrimaryContract({
    evidenceRefs: ["reports/p722-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P72.2"],
  }),
]);
