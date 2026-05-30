import {
  describeSqliteCrudEntity,
  listSqliteCrudEntities,
  validateSqliteCrudRepository,
} from "../db/sqliteCrudRepository.js";

export const DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE = "P134.2";
export const DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION = "1.0";

export const DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES = [
  "founderIdeaToPrd",
  "businessBuild",
  "agentWorkOrders",
  "agentWorkQueue",
  "agentAssignments",
  "agentDispatch",
  "runtimeAdmission",
  "runtimeExecution",
  "executionApprovalEvidence",
];

export const DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES = [
  "prepareCreateIntent",
  "prepareReadIntent",
  "prepareUpdateIntent",
  "prepareUpsertIntent",
  "prepareListIntent",
  "prepareDeleteIntent",
];

export const DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS = {
  durableDbCrudRuntimeSchemaModelAllowed: false,
  durableDbCrudRuntimeRepositoryModelAllowed: false,
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
  durableDbCrudRuntimeWritePlanAllowed: false,
  durableDbCrudRuntimeRuntimeWriteAllowed: false,
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

const DISABLED_REASON = "P134.2 defines schema and repository model metadata only; DB reads, DB writes, CRUD execution, migrations, runtime writes, provider calls, agent dispatch, project mutation, deploy, release, export, package, network, and spend remain blocked.";
const OWNER_CAPABILITY = "NEXUS Durable DB CRUD Runtime Schema Guard";

const ENTITY_GROUPS = [
  {
    groupName: "founderIdeaToPrd",
    publicLabel: "Founder idea to PRD",
    purpose: "Founder conversation, PRD readiness, and local workstream planning records.",
    entityNames: ["founder_sessions", "founder_qna_turns", "founder_prd_artifacts", "founder_workstream_plans"],
  },
  {
    groupName: "businessBuild",
    publicLabel: "Business build planning",
    purpose: "Business build sessions, execution requests, agent lanes, and PRD snapshots.",
    entityNames: ["business_build_sessions", "business_build_execution_requests", "business_build_agent_lanes", "business_build_prd_snapshots"],
  },
  {
    groupName: "agentWorkOrders",
    publicLabel: "Agent work orders",
    purpose: "Governed work order records, events, and evidence references before dispatch.",
    entityNames: ["founder_agent_work_orders", "founder_agent_work_order_events", "founder_agent_work_order_evidence_refs"],
  },
  {
    groupName: "agentWorkQueue",
    publicLabel: "Agent work queue",
    purpose: "Governed queue records, queue events, and evidence references.",
    entityNames: ["founder_agent_work_queue_items", "founder_agent_work_queue_events", "founder_agent_work_queue_evidence_refs"],
  },
  {
    groupName: "agentAssignments",
    publicLabel: "Agent assignments",
    purpose: "Governed assignment records, assignment events, and evidence references.",
    entityNames: ["founder_agent_work_assignments", "founder_agent_work_assignment_events", "founder_agent_work_assignment_evidence_refs"],
  },
  {
    groupName: "agentDispatch",
    publicLabel: "Agent dispatch readiness",
    purpose: "Dispatch readiness records, dispatch events, and evidence references.",
    entityNames: ["founder_agent_dispatch_readiness_items", "founder_agent_dispatch_readiness_events", "founder_agent_dispatch_readiness_evidence_refs"],
  },
  {
    groupName: "runtimeAdmission",
    publicLabel: "Runtime admission",
    purpose: "Runtime admission readiness records, events, and evidence references.",
    entityNames: ["founder_runtime_admission_readiness_items", "founder_runtime_admission_events", "founder_runtime_admission_evidence_refs"],
  },
  {
    groupName: "runtimeExecution",
    publicLabel: "Runtime execution readiness",
    purpose: "Runtime execution readiness records, events, and evidence references before execution authority.",
    entityNames: ["founder_runtime_execution_readiness_items", "founder_runtime_execution_events", "founder_runtime_execution_evidence_refs"],
  },
  {
    groupName: "executionApprovalEvidence",
    publicLabel: "Execution approval evidence",
    purpose: "Display-safe execution approval evidence records, events, and evidence references.",
    entityNames: ["founder_runtime_execution_approval_evidence_items", "founder_runtime_execution_approval_events", "founder_runtime_execution_approval_evidence_refs"],
  },
];

const OPERATION_ROWS = [
  {
    operationName: "prepareCreateIntent",
    publicLabel: "Create intent",
    operationKind: "create-intent",
  },
  {
    operationName: "prepareReadIntent",
    publicLabel: "Read intent",
    operationKind: "read-intent",
  },
  {
    operationName: "prepareUpdateIntent",
    publicLabel: "Update intent",
    operationKind: "update-intent",
  },
  {
    operationName: "prepareUpsertIntent",
    publicLabel: "Upsert intent",
    operationKind: "upsert-intent",
  },
  {
    operationName: "prepareListIntent",
    publicLabel: "List intent",
    operationKind: "list-intent",
  },
  {
    operationName: "prepareDeleteIntent",
    publicLabel: "Delete intent",
    operationKind: "delete-intent",
  },
];

function labelFromEntityName(entityName = "") {
  return String(entityName)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function withBlockedAuthority(row) {
  return {
    ...row,
    currentState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P134.3 DB write plan preview before any DB action can be considered.",
    evidenceLabels: ["P134.2 schema and repository model"],
    activityLabels: ["Repository operation intent modeled locally"],
    costImpactLabel: "No provider spend",
    canCreateSchema: false,
    canRunMigration: false,
    canReadDb: false,
    canWriteDb: false,
    canCreateRecord: false,
    canReadRecord: false,
    canUpdateRecord: false,
    canUpsertRecord: false,
    canListRecords: false,
    canDeleteRecord: false,
    canRunCrud: false,
    canWriteRuntime: false,
    canPreviewWritePlan: false,
    canCaptureApproval: false,
    canPersistDecision: false,
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
    authorityFlags: { ...DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS },
  };
}

function buildEntityRecord(entityName) {
  const descriptor = describeSqliteCrudEntity(entityName);
  return {
    entityName,
    publicLabel: labelFromEntityName(entityName),
    primaryKey: descriptor.primaryKey,
    fieldCount: Object.keys(descriptor.fields || {}).length,
    requiredFieldCount: (descriptor.requiredFields || []).length,
    schemaSource: "db/schema.json",
    repositorySource: "db/sqliteCrudRepository.js",
    currentState: "schema_described_repository_blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    canCreateSchema: false,
    canRunMigration: false,
    canReadDb: false,
    canWriteDb: false,
    canRunCrud: false,
    canWriteRuntime: false,
    canDispatchAgent: false,
    canMutateProject: false,
    canSpend: false,
    authorityFlags: { ...DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS },
  };
}

export function buildDurableDbCrudRuntimeSchemaModel() {
  const sqliteRepositoryValidation = validateSqliteCrudRepository();
  const sqliteEntities = listSqliteCrudEntities();
  const sqliteEntityNames = new Set(sqliteEntities.map((entity) => entity.name));
  const entityGroups = ENTITY_GROUPS.map((group) => ({
    ...group,
    entityCount: group.entityNames.length,
    missingEntityNames: group.entityNames.filter((entityName) => !sqliteEntityNames.has(entityName)),
    entities: group.entityNames.map(buildEntityRecord),
    currentState: "schema_described_repository_blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Use P134.3 to preview DB write-plan prerequisites without running CRUD.",
    evidenceLabels: ["P134.2 schema and repository model"],
    activityLabels: ["Durable DB entity group modeled locally"],
    costImpactLabel: "No provider spend",
    authorityFlags: { ...DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS },
  }));
  const repositoryOperationRows = OPERATION_ROWS.map(withBlockedAuthority);

  return {
    metadataVersion: DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION,
    phaseId: DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE,
    sourceSchemaPath: "db/schema.json",
    sourceSqlSchemaPath: "db/schema.sql",
    sourceRepositoryPath: "db/sqliteCrudRepository.js",
    sourceRepositoryValidationPhase: sqliteRepositoryValidation.phase,
    sourceRepositoryEntityCount: sqliteRepositoryValidation.entityCount,
    modelOnly: true,
    schemaModelOnly: true,
    repositoryModelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    schemaPolicy: {
      mode: "schema-repository-model-only",
      disabledReason: DISABLED_REASON,
      ...DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS,
    },
    entityGroupNames: [...DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES],
    entityGroups,
    entityGroupCount: entityGroups.length,
    modeledEntityCount: entityGroups.reduce((sum, group) => sum + group.entityCount, 0),
    missingEntityCount: entityGroups.reduce((sum, group) => sum + group.missingEntityNames.length, 0),
    repositoryOperationNames: [...DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES],
    repositoryOperationRows,
    repositoryOperationCount: repositoryOperationRows.length,
    blockedRepositoryOperationCount: repositoryOperationRows.length,
    executableRepositoryOperationCount: 0,
    schemaCreationCandidateCount: 0,
    migrationCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    crudExecutableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
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
      "P134.2 models schema and repository intent only.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is run.",
      "Provider/model calls, agent dispatch, tool/worker execution, project mutation, hosted DB mutation, deploy, release, export, package, network, and spend remain blocked.",
    ],
    nextAction: "Route P134.2 into P134.3 DB write plan preview.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P134.2 schema and repository model"],
    activityLabels: ["Durable DB CRUD runtime schema model created locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateDurableDbCrudRuntimeSchemaModel(model = {}) {
  const errors = [];
  if (model.metadataVersion !== DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION) {
    errors.push("Unexpected durable DB CRUD runtime schema model version.");
  }
  if (model.phaseId !== DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE) {
    errors.push("Unexpected durable DB CRUD runtime schema model phase.");
  }
  if (model.sourceSchemaPath !== "db/schema.json" || model.sourceRepositoryPath !== "db/sqliteCrudRepository.js") {
    errors.push("Durable DB CRUD runtime model must reuse the existing DB schema and SQLite repository descriptors.");
  }
  if (model.modelOnly !== true || model.schemaModelOnly !== true || model.repositoryModelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Durable DB CRUD runtime model must stay local, model-only, and hidden from primary UX.");
  }
  if (model.schemaPolicy?.mode !== "schema-repository-model-only") {
    errors.push("Schema policy must remain schema-repository-model-only.");
  }
  const policyValues = Object.values(model.schemaPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Schema policy booleans must remain false.");
  }
  if (!Array.isArray(model.entityGroups) || model.entityGroups.length !== DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES.length) {
    errors.push("Entity groups are incomplete.");
  }
  if (model.missingEntityCount !== 0) {
    errors.push("All modeled entity groups must resolve to existing SQLite schema descriptors.");
  }
  for (const group of model.entityGroups || []) {
    if (!DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES.includes(group.groupName)) {
      errors.push("Entity group name must be allowlisted.");
    }
    if (!Array.isArray(group.entities) || group.entities.length !== group.entityCount) {
      errors.push(`${group.groupName || "group"} entity list is incomplete.`);
    }
    const groupValues = Object.values(group.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!groupValues.every((value) => value === false)) {
      errors.push(`${group.groupName || "group"} authority flags must remain false.`);
    }
    for (const entity of group.entities || []) {
      const entityValues = Object.values(entity).filter((value) => typeof value === "boolean");
      const authorityValues = Object.values(entity.authorityFlags || {}).filter((value) => typeof value === "boolean");
      if (!entityValues.every((value) => value === false) || !authorityValues.every((value) => value === false)) {
        errors.push(`${entity.entityName || "entity"} booleans must remain false.`);
      }
    }
  }
  if (!Array.isArray(model.repositoryOperationRows) || model.repositoryOperationRows.length !== DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES.length) {
    errors.push("Repository operation rows are incomplete.");
  }
  for (const row of model.repositoryOperationRows || []) {
    if (!DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES.includes(row.operationName)) {
      errors.push("Repository operation name must be allowlisted.");
    }
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false) || !authorityValues.every((value) => value === false)) {
      errors.push(`${row.operationName || "operation"} booleans must remain false.`);
    }
  }
  for (const key of [
    "executableRepositoryOperationCount",
    "schemaCreationCandidateCount",
    "migrationCandidateCount",
    "dbReadableCandidateCount",
    "dbWritableCandidateCount",
    "crudExecutableCandidateCount",
    "runtimeWritableCandidateCount",
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
    if (model[key] !== 0) errors.push(`${key} must stay 0.`);
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 3) {
    errors.push("Schema model blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
