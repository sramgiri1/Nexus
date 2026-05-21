import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";

export const P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE = "P97.3";

export const P97_BUSINESS_BUILD_DB_ENTITIES = Object.freeze([
  "business_build_sessions",
  "business_build_execution_requests",
  "business_build_agent_lanes",
  "business_build_prd_snapshots",
]);

const APPROVAL_REQUIREMENTS = Object.freeze([
  "operatorApproval",
  "rollbackAccepted",
  "auditAccepted",
  "validationCommandsAccepted",
  "sqliteLiveMode",
  "sqliteWritesEnabled",
]);

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "delete",
  "raw SQL",
  "hosted DB mutation",
  "project mutation",
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "deploy/release/export/package",
  "network calls",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function safeSlug(value = "business-build") {
  return String(value || "business-build").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedBusinessBuildEntity(entityName = "") {
  return P97_BUSINESS_BUILD_DB_ENTITIES.includes(entityName);
}

function primaryKeyForEntity(entityName) {
  return describeSqliteCrudEntity(entityName).primaryKey;
}

function approvalReady(input = {}) {
  return input.operatorApproval === true
    && input.rollbackAccepted === true
    && input.auditAccepted === true
    && input.validationCommandsAccepted === true;
}

function readinessEvidence(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  return {
    operatorApproval: input.operatorApproval === true,
    rollbackAccepted: input.rollbackAccepted === true,
    auditAccepted: input.auditAccepted === true,
    validationCommandsAccepted: input.validationCommandsAccepted === true,
    sqliteLiveMode: config.sqliteLiveAllowed === true,
    sqliteWritesEnabled: config.dbWritesEnabled === true,
  };
}

function missingEvidence(input = {}) {
  const evidence = readinessEvidence(input);
  return APPROVAL_REQUIREMENTS.filter((requirement) => evidence[requirement] !== true);
}

function blockedResult(request, disabledReason, errors = []) {
  return {
    ok: errors.length === 0,
    phase: P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
    requestKey: request?.requestKey || "",
    entity: requestEntity(request),
    operation: "none",
    admitted: false,
    written: false,
    read: false,
    disabledReason,
    errors,
    dbWritesAllowed: false,
    sqliteWriteAllowed: false,
    hostedDbWritesAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

export function buildSafeBusinessBuildDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const buildSessionKey = input.buildSessionKey || "founder-business-build";
  const buildSessionId = safeId("p973-build", buildSessionKey);

  switch (entityName) {
    case "business_build_sessions":
      return {
        buildSessionId,
        publicLabel: "Business Build session",
        sessionId: input.sessionId || safeId("p973-founder-session", buildSessionKey),
        prdId: input.prdId || safeId("p973-prd", buildSessionKey),
        currentState: "planned_locally",
        readinessPercent: input.readinessPercent || 72,
        nextAction: "Review governed local CRUD admission before Command Center DB UX.",
        ownerCapability: "NEXUS Business Build DB",
        evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "business_build_execution_requests":
      return {
        requestId: safeId("p973-request", input.requestKey || "product"),
        buildSessionId,
        requestedLane: input.requestedLane || "product",
        requestedOperation: input.requestedOperation || "local_crud_review",
        requestState: "blocked_until_governed_admission",
        approvalState: "not_approved",
        disabledReason: "Execution remains blocked; P97.3 admits local CRUD metadata only.",
        validationCommands: ["npm run check:p973-business-build-crud-model"],
        executionAllowed: false,
        dispatchAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "business_build_agent_lanes":
      return {
        laneId: safeId("p973-lane", input.lane || "product"),
        buildSessionId,
        lane: input.lane || "product",
        ownerCapability: input.ownerCapability || "NEXUS Product Strategy",
        currentState: "planned_locally",
        nextAction: "Wait for P97.4 Command Center DB UX.",
        blockerSummary: "Agent dispatch, worker execution, and project mutation remain blocked.",
        dispatchAllowed: false,
        workerExecutionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "business_build_prd_snapshots":
      return {
        snapshotId: safeId("p973-snapshot", buildSessionKey),
        buildSessionId,
        prdId: input.prdId || safeId("p973-prd", buildSessionKey),
        title: input.title || "Business Build PRD Snapshot",
        problemSummary: input.problemSummary || "Founder needs a scoped product and business build plan.",
        customerSummary: input.customerSummary || "Target customer summary pending founder confirmation.",
        solutionSummary: input.solutionSummary || "NEXUS maps local PRD state to governed Business Build lanes.",
        businessModelSummary: input.businessModelSummary || "Business model assumption pending founder confirmation.",
        readinessPercent: input.readinessPercent || 72,
        snapshotState: "captured_locally",
        evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P97.3 Business Build DB CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `business-build-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Business Build DB",
    requestedOperation: "create_or_update_local_business_build_record",
    requestState: "ready_for_operator_review",
    payloadShape: {
      shapeMode: "display-safe-field-summary",
      sqliteEntity: entityName,
      primaryKey: primaryKeyForEntity(entityName),
      fields: Object.keys(describeSqliteCrudEntity(entityName).fields),
      redactionRules: [
        "Do not include raw private project IDs.",
        "Do not include provider tokens or secrets.",
        "Do not include raw logs or raw policy dumps.",
      ],
    },
    requiredEvidence: [...APPROVAL_REQUIREMENTS],
    missingEvidence: missingEvidence(input),
    operatorApprovalRequired: true,
    rollbackRequired: true,
    auditRequired: true,
    validationRequired: true,
    requestCanExecute: false,
    sqliteWriteAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    validationCommands: [
      "npm run check:p973-business-build-crud-model",
      "npm run check:p972-business-build-db-schema",
    ],
    evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedBusinessBuildDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedBusinessBuildEntity(entity)) {
    return blockedResult(request, "Entity is outside the P97.3 Business Build CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P97.3.", ["Delete is outside the P97.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P97.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P97.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P97.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        records: listSqliteEntityRecords(entity, { limit: input.limit || 25 }, input),
        errors: [],
        disabledReason: "",
        dbWritesAllowed: false,
        sqliteWriteAllowed: false,
        hostedDbWritesAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedRuntimeFlags(),
      };
    }

    const record = input.record || buildSafeBusinessBuildDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        record: getSqliteEntityById(entity, id, input),
        errors: [],
        disabledReason: "",
        dbWritesAllowed: false,
        sqliteWriteAllowed: false,
        hostedDbWritesAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedRuntimeFlags(),
      };
    }

    let persisted;
    if (operation === "create") {
      persisted = insertSqliteEntity(entity, record, input);
    } else if (operation === "update") {
      persisted = updateSqliteEntity(entity, id, input.patch || record, input);
    } else if (operation === "upsert") {
      const existing = getSqliteEntityById(entity, id, input);
      persisted = existing
        ? updateSqliteEntity(entity, id, input.patch || record, input)
        : insertSqliteEntity(entity, record, input);
    } else {
      return blockedResult(request, "Operation is outside the P97.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
      requestKey: request.requestKey,
      entity,
      operation,
      admitted: true,
      written: true,
      read: false,
      record: persisted,
      errors: [],
      disabledReason: "",
      dbWritesAllowed: true,
      sqliteWriteAllowed: true,
      hostedDbWritesAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
      ...blockedRuntimeFlags(),
    };
  } catch (error) {
    return blockedResult(request, "P97.3 local Business Build CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderBusinessBuildExecutionContract(input = {}) {
  const requests = P97_BUSINESS_BUILD_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
    mode: "governed-business-build-db-crud",
    source: "live-ready/founderBusinessBuildGovernedExecution.js",
    summary: "Business Build DB CRUD workflow is modeled for governed local SQLite admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "business_build_db_crud_ready_for_approved_local_admission"
        : "business_build_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-business-build",
      dbMode: config.mode,
      businessBuildSession: buildSafeBusinessBuildDbRecord("business_build_sessions", input),
      executionRequests: [buildSafeBusinessBuildDbRecord("business_build_execution_requests", input)],
      agentLanes: [
        buildSafeBusinessBuildDbRecord("business_build_agent_lanes", { ...input, lane: "product", ownerCapability: "NEXUS Product Strategy" }),
        buildSafeBusinessBuildDbRecord("business_build_agent_lanes", { ...input, lane: "engineering", ownerCapability: "NEXUS Engineering Strategy" }),
      ],
      prdSnapshots: [buildSafeBusinessBuildDbRecord("business_build_prd_snapshots", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P97.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedBusinessBuildDbCrudRequest for approved local Business Build records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local Business Build CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P97.3 local CRUD admission.`),
      disabledReason:
        "P97.3 only admits governed local SQLite CRUD for Business Build OS records. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Business Build DB CRUD",
      evidenceRefs: ["reports/p973-business-build-crud-model-report.md"],
      auditRefs: ["reports/p973-business-build-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p973-business-build-crud-model-report.md",
      "contracts/os-roadmap/p97-execution-contracts.json",
    ],
    warnings: [
      "P97.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateFounderBusinessBuildExecutionContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE) errors.push("phase must be P97.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "businessBuildSession", "executionRequests", "agentLanes", "prdSnapshots", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P97_BUSINESS_BUILD_DB_ENTITIES.length) errors.push("localCrudRequests must cover Business Build DB entities");
  for (const entity of P97_BUSINESS_BUILD_DB_ENTITIES) {
    if (!data.localCrudRequests?.some((request) => request.sqliteEntity === entity)) errors.push(`missing request for ${entity}`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const request of data.localCrudRequests || []) {
    if (request.requestCanExecute !== false) errors.push(`${request.sqliteEntity}.requestCanExecute must be false`);
    if (request.projectMutationAllowed !== false) errors.push(`${request.sqliteEntity}.projectMutationAllowed must be false`);
    if (request.providerSpendAllowed !== false) errors.push(`${request.sqliteEntity}.providerSpendAllowed must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Business Build CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Business Build CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
