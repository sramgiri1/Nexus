import { createPassResult } from "../shared/resultEnvelope.js";
import { createDbRuntimePrimaryContract, validateDbRuntimePrimaryContract } from "./p72-2-placeholder.js";

export const P72_3_REQUIRED_FIELDS = Object.freeze([
  "migrationPreviewId",
  "runtimeId",
  "migrationState",
  "migrationFileCreated",
  "schemaFileChanged",
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
  "affectedStores",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createDbMigrationPreview(input = {}) {
  const contract = input.contract || createDbRuntimePrimaryContract(input);
  const contractValidation = validateDbRuntimePrimaryContract(contract);
  return {
    migrationPreviewId: input.migrationPreviewId || "db-migration-preview",
    runtimeId: contract.runtimeId,
    migrationState: input.migrationState || "preview_ready_for_review",
    migrationFileCreated: false,
    schemaFileChanged: false,
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
    affectedStores: [
      "tasks runtime store",
      "evidence runtime store",
      "audit runtime store",
      "activity runtime store",
    ],
    blockedOperations: [
      "DB writes",
      "Migration file creation",
      "Schema mutation",
      "Runtime storage mutation",
    ],
    disabledReason: "P72.3 records migration previews only; DB writes, migration file creation, and schema mutation remain disabled.",
    blockers: [
      "Migration file creation is disabled.",
      "Schema mutation and DB writes are disabled.",
      "File-backed runtime remains primary.",
      "Project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...(contractValidation.valid ? [] : contractValidation.errors),
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), ...contract.evidenceRefs, "reports/p723-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), ...contract.activityRefs, "os-roadmap/phase-status.json#P72.3"])],
    costImpact: "No DB service calls, DB writes, migration execution, schema mutation, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.dbMigrationPreview",
    nextAction: input.nextAction || "Route this migration preview through P72.4 DB readiness gate.",
    commandCenterVisible: true,
  };
}

export function validateDbMigrationPreview(preview = {}) {
  const errors = [];
  for (const field of P72_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  if (preview.migrationFileCreated !== false || preview.schemaFileChanged !== false) errors.push("migration/schema files must not be created or changed");
  if (preview.dbWritesAllowed !== false || preview.migrationsAllowed !== false || preview.schemaMutationAllowed !== false) errors.push("DB writes, migrations, and schema mutation must be false");
  if (preview.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (preview.providerDispatchAllowed !== false || preview.toolExecutionAllowed !== false || preview.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (preview.networkCallsAllowed !== false || preview.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (preview.deployExecutionAllowed !== false || preview.releaseExecutionAllowed !== false || preview.exportExecutionAllowed !== false || preview.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!Array.isArray(preview.affectedStores) || preview.affectedStores.length < 4) errors.push("affectedStores must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 4) errors.push("blockedOperations must be visible");
  if (!preview.disabledReason || /migrate now|write now|schema now|run db|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildDbMigrationPreviewEnvelope(input = {}) {
  const preview = createDbMigrationPreview(input);
  return createPassResult({
    phase: "P72.3",
    mode: "preview-only",
    source: "db-runtime/p72-3-placeholder.js",
    summary: "DB migration preview recorded without creating migrations, changing schema, or enabling DB writes.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P72_3_SAMPLE_PREVIEWS = Object.freeze([
  createDbMigrationPreview({
    evidenceRefs: ["reports/p723-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P72.3"],
  }),
]);
