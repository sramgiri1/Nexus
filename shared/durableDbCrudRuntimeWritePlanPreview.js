import {
  DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES,
  DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES,
  DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE,
  DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION,
  buildDurableDbCrudRuntimeSchemaModel,
  validateDurableDbCrudRuntimeSchemaModel,
} from "./durableDbCrudRuntimeSchemaModel.js";

export const DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE = "P134.3";
export const DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION = "1.0";

export const DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES = [
  "scopeBoundary",
  "schemaEvidence",
  "writeIntent",
  "approvalEvidence",
  "rollbackEvidence",
  "auditEvidence",
  "validationEvidence",
  "costEvidence",
];

export const DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS = {
  durableDbCrudRuntimeWritePlanExecutable: false,
  durableDbCrudRuntimeSchemaCreationAllowed: false,
  durableDbCrudRuntimeMigrationAllowed: false,
  durableDbCrudRuntimeDbReadAllowed: false,
  durableDbCrudRuntimeDbWriteAllowed: false,
  durableDbCrudRuntimeCrudCreateAllowed: false,
  durableDbCrudRuntimeCrudReadAllowed: false,
  durableDbCrudRuntimeCrudUpdateAllowed: false,
  durableDbCrudRuntimeCrudUpsertAllowed: false,
  durableDbCrudRuntimeCrudListAllowed: false,
  durableDbCrudRuntimeCrudDeleteAllowed: false,
  durableDbCrudRuntimeRawSqlAllowed: false,
  durableDbCrudRuntimeRuntimeWriteAllowed: false,
  durableDbCrudRuntimeApprovalCaptureAllowed: false,
  durableDbCrudRuntimeDecisionPersistenceAllowed: false,
  durableDbCrudRuntimeProviderCallAllowed: false,
  durableDbCrudRuntimeAgentDispatchAllowed: false,
  durableDbCrudRuntimeToolExecutionAllowed: false,
  durableDbCrudRuntimeWorkerExecutionAllowed: false,
  durableDbCrudRuntimeProjectMutationAllowed: false,
  durableDbCrudRuntimeHostedDbMutationAllowed: false,
  durableDbCrudRuntimeDeployAllowed: false,
  durableDbCrudRuntimeReleaseAllowed: false,
  durableDbCrudRuntimeExportAllowed: false,
  durableDbCrudRuntimePackageAllowed: false,
  durableDbCrudRuntimeNetworkAllowed: false,
  durableDbCrudRuntimeSpendAllowed: false,
};

const DISABLED_REASON = "P134.3 previews the evidence required for future DB writes only; DB reads, DB writes, CRUD execution, migrations, raw SQL, runtime writes, provider calls, agent dispatch, project mutation, deploy, release, export, package, network, and spend remain blocked.";
const OWNER_CAPABILITY = "NEXUS Durable DB CRUD Runtime Write Plan Guard";

const STEP_DETAILS = {
  scopeBoundary: {
    publicLabel: "Scope boundary",
    purpose: "Confirm the request is OS-owned and never targets project-owned source.",
    requiredEvidence: ["OS-owned data boundary", "Forbidden project path confirmation"],
  },
  schemaEvidence: {
    publicLabel: "Schema evidence",
    purpose: "Confirm schema and repository descriptors are modeled before any write authority is considered.",
    requiredEvidence: ["P134.2 schema model validation", "Repository descriptor validation"],
  },
  writeIntent: {
    publicLabel: "Write intent",
    purpose: "Describe the future write intent without building an executable operation.",
    requiredEvidence: ["Public operation purpose", "Display-safe owner capability", "Blocked current state"],
  },
  approvalEvidence: {
    publicLabel: "Approval evidence",
    purpose: "Require explicit approval evidence before any future write, persistence, or dispatch path can be opened.",
    requiredEvidence: ["Approval owner", "Approval reason", "Disabled reason"],
  },
  rollbackEvidence: {
    publicLabel: "Rollback evidence",
    purpose: "Require a rollback and recovery explanation before any future durable mutation.",
    requiredEvidence: ["Rollback plan", "Recovery owner", "Validation gate"],
  },
  auditEvidence: {
    publicLabel: "Audit evidence",
    purpose: "Require evidence and activity locations before durable writes become candidates.",
    requiredEvidence: ["Evidence label", "Activity label", "Audit owner"],
  },
  validationEvidence: {
    publicLabel: "Validation evidence",
    purpose: "Require checker, unit, page, and status validation before future write authority.",
    requiredEvidence: ["Checker command", "Dashboard validation", "OS status validation"],
  },
  costEvidence: {
    publicLabel: "Cost evidence",
    purpose: "Confirm future writes do not imply provider calls or spend.",
    requiredEvidence: ["No provider spend", "No network call", "No hosted DB mutation"],
  },
};

function withBlockedAuthority(row) {
  return {
    ...row,
    currentState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P134.4 DB Runtime Command Center UX after this preview is validated.",
    evidenceLabels: ["P134.3 DB write plan preview"],
    activityLabels: ["DB write plan preview modeled locally"],
    costImpactLabel: "No provider spend",
    authorityFlags: { ...DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS },
    canCreateSchema: false,
    canRunMigration: false,
    canReadDb: false,
    canWriteDb: false,
    canRunCrud: false,
    canWriteRuntime: false,
    canCaptureApproval: false,
    canPersistDecision: false,
    canUseRawSql: false,
    canDispatchAgent: false,
    canExecuteTool: false,
    canExecuteWorker: false,
    canMutateProject: false,
    canUseHostedDb: false,
    canDeploy: false,
    canRelease: false,
    canExport: false,
    canPackage: false,
    canUseNetwork: false,
    canSpend: false,
  };
}

function buildStepRow(stepName) {
  return withBlockedAuthority({
    stepName,
    publicLabel: STEP_DETAILS[stepName].publicLabel,
    purpose: STEP_DETAILS[stepName].purpose,
    requiredEvidence: [...STEP_DETAILS[stepName].requiredEvidence],
  });
}

function buildEntityGroupWritePlanRow(group) {
  return withBlockedAuthority({
    groupName: group.groupName,
    publicLabel: group.publicLabel,
    entityCount: group.entityCount,
    purpose: group.purpose,
    previewKind: "entity-group-write-plan",
    requiredEvidence: [
      "Display-safe entity group model",
      "Blocked repository intent",
      "Rollback and audit evidence",
    ],
    writeIntentCandidateCount: 0,
    approvedWriteCandidateCount: 0,
    executableWriteCandidateCount: 0,
  });
}

function buildRepositoryWritePlanRow(row) {
  return withBlockedAuthority({
    operationName: row.operationName,
    publicLabel: row.publicLabel,
    operationKind: row.operationKind,
    previewKind: "repository-operation-write-plan",
    requiredEvidence: [
      "Operation purpose",
      "Approval evidence",
      "Checker evidence",
      "Rollback evidence",
    ],
    writeIntentCandidateCount: 0,
    approvedWriteCandidateCount: 0,
    executableWriteCandidateCount: 0,
  });
}

export function buildDurableDbCrudRuntimeWritePlanPreview() {
  const schemaModel = buildDurableDbCrudRuntimeSchemaModel();
  const schemaModelValidation = validateDurableDbCrudRuntimeSchemaModel(schemaModel);
  const writePlanSteps = DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES.map(buildStepRow);
  const entityGroupWritePlanRows = schemaModel.entityGroups.map(buildEntityGroupWritePlanRow);
  const repositoryWritePlanRows = schemaModel.repositoryOperationRows.map(buildRepositoryWritePlanRow);

  return {
    metadataVersion: DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION,
    phaseId: DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE,
    sourceSchemaModelPhase: DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE,
    sourceSchemaModelVersion: DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION,
    sourceSchemaModelEntityGroupCount: schemaModel.entityGroupCount,
    sourceSchemaModelEntityCount: schemaModel.modeledEntityCount,
    sourceSchemaModelRepositoryOperationCount: schemaModel.repositoryOperationCount,
    sourceSchemaModelValidation: schemaModelValidation.valid ? "valid" : "invalid",
    sourceSchemaModelErrors: [...schemaModelValidation.errors],
    previewOnly: true,
    writePlanPreviewOnly: true,
    dryRunOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    writePlanPolicy: {
      mode: "db-write-plan-preview-only",
      disabledReason: DISABLED_REASON,
      ...DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS,
    },
    stepNames: [...DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES],
    writePlanSteps,
    writePlanStepCount: writePlanSteps.length,
    entityGroupNames: [...DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES],
    entityGroupWritePlanRows,
    entityGroupWritePlanRowCount: entityGroupWritePlanRows.length,
    repositoryOperationNames: [...DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES],
    repositoryWritePlanRows,
    repositoryWritePlanRowCount: repositoryWritePlanRows.length,
    blockedWritePlanRowCount: writePlanSteps.length + entityGroupWritePlanRows.length + repositoryWritePlanRows.length,
    executableWritePlanRowCount: 0,
    schemaCreationCandidateCount: 0,
    migrationCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    crudExecutableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    approvalCaptureCandidateCount: 0,
    decisionPersistenceCandidateCount: 0,
    rawSqlCandidateCount: 0,
    providerCallCandidateCount: 0,
    agentDispatchCandidateCount: 0,
    projectMutationCandidateCount: 0,
    hostedDbMutationCandidateCount: 0,
    deployCandidateCount: 0,
    releaseCandidateCount: 0,
    exportCandidateCount: 0,
    packageCandidateCount: 0,
    networkCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "P134.3 is a DB write-plan preview only.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is run.",
      "Provider/model calls, agent dispatch, tool/worker execution, project mutation, hosted DB mutation, deploy, release, export, package, network, and spend remain blocked.",
    ],
    nextAction: "Route P134.3 into P134.4 DB Runtime Command Center UX.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P134.3 DB write plan preview"],
    activityLabels: ["Durable DB CRUD runtime write plan preview created locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateDurableDbCrudRuntimeWritePlanPreview(preview = {}) {
  const errors = [];
  if (preview.metadataVersion !== DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION) {
    errors.push("Unexpected durable DB CRUD runtime write-plan preview version.");
  }
  if (preview.phaseId !== DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE) {
    errors.push("Unexpected durable DB CRUD runtime write-plan preview phase.");
  }
  if (preview.sourceSchemaModelPhase !== DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE || preview.sourceSchemaModelVersion !== DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION) {
    errors.push("Write-plan preview must reuse the P134.2 schema model.");
  }
  if (preview.sourceSchemaModelValidation !== "valid" || preview.sourceSchemaModelErrors?.length !== 0) {
    errors.push("Source schema model must validate before write-plan preview.");
  }
  if (preview.previewOnly !== true || preview.writePlanPreviewOnly !== true || preview.dryRunOnly !== true || preview.localOnly !== true || preview.commandCenterVisible !== false) {
    errors.push("Write-plan preview must stay local, preview-only, dry-run-only, and hidden from primary UX.");
  }
  if (preview.writePlanPolicy?.mode !== "db-write-plan-preview-only") {
    errors.push("Write-plan policy must remain db-write-plan-preview-only.");
  }
  const policyValues = Object.values(preview.writePlanPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Write-plan policy booleans must remain false.");
  }
  if (!Array.isArray(preview.writePlanSteps) || preview.writePlanSteps.length !== DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES.length) {
    errors.push("Write-plan steps are incomplete.");
  }
  if (!Array.isArray(preview.entityGroupWritePlanRows) || preview.entityGroupWritePlanRows.length !== DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES.length) {
    errors.push("Entity group write-plan rows are incomplete.");
  }
  if (!Array.isArray(preview.repositoryWritePlanRows) || preview.repositoryWritePlanRows.length !== DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES.length) {
    errors.push("Repository write-plan rows are incomplete.");
  }
  for (const row of [
    ...(preview.writePlanSteps || []),
    ...(preview.entityGroupWritePlanRows || []),
    ...(preview.repositoryWritePlanRows || []),
  ]) {
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false) || !authorityValues.every((value) => value === false)) {
      errors.push(`${row.stepName || row.groupName || row.operationName || "write-plan row"} booleans must remain false.`);
    }
    if (row.currentState !== "blocked") {
      errors.push(`${row.stepName || row.groupName || row.operationName || "write-plan row"} must remain blocked.`);
    }
  }
  for (const key of [
    "executableWritePlanRowCount",
    "schemaCreationCandidateCount",
    "migrationCandidateCount",
    "dbReadableCandidateCount",
    "dbWritableCandidateCount",
    "crudExecutableCandidateCount",
    "runtimeWritableCandidateCount",
    "approvalCaptureCandidateCount",
    "decisionPersistenceCandidateCount",
    "rawSqlCandidateCount",
    "providerCallCandidateCount",
    "agentDispatchCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "deployCandidateCount",
    "releaseCandidateCount",
    "exportCandidateCount",
    "packageCandidateCount",
    "networkCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (preview[key] !== 0) errors.push(`${key} must stay 0.`);
  }
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 3) {
    errors.push("Write-plan preview blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
