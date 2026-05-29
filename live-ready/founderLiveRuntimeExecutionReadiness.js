import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeRuntimeAdmissionDbRecord } from "./founderLiveRuntimeAdmissionReadiness.js";

export const P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE = "P116.3";

export const P116_RUNTIME_EXECUTION_DB_ENTITIES = Object.freeze([
  "founder_runtime_execution_readiness_items",
  "founder_runtime_execution_events",
  "founder_runtime_execution_evidence_refs",
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
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
  "runtimeExecutionAllowed",
  "executionAllowed",
  "executionUnlockAllowed",
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
  "runtime execution",
  "execution unlock",
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "project mutation",
  "deploy/release/export/package",
  "network calls",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function safeSlug(value = "runtime-execution-readiness") {
  return String(value || "runtime-execution-readiness")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "runtime-execution-readiness";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedRuntimeExecutionEntity(entityName = "") {
  return P116_RUNTIME_EXECUTION_DB_ENTITIES.includes(entityName);
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
    phase: P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
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
    runtimeExecutionAllowed: false,
    executionAllowed: false,
    executionUnlockAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

function executionKey(input = {}) {
  return input.executionKey || input.admissionKey || "founder-runtime-execution-readiness";
}

function sourceAdmissionRecord(input = {}) {
  return input.admissionRecord || buildSafeRuntimeAdmissionDbRecord("founder_runtime_admission_readiness_items", input);
}

function sourceAdmissionSummary(input = {}) {
  const admissionRecord = sourceAdmissionRecord(input);
  return {
    publicLabel: admissionRecord.publicLabel || "Founder runtime admission readiness item",
    admissionLane: admissionRecord.admissionLane || "Founder Runtime Readiness",
    admissionState: admissionRecord.admissionState || "runtime admission readiness reviewed locally",
    admissionSummary: admissionRecord.admissionSummary || "Display-safe founder runtime admission readiness summary.",
    nextAction: admissionRecord.nextAction || "Review execution readiness before any later explicit runtime execution phase.",
    ownerCapability: admissionRecord.ownerCapability || "NEXUS Founder Runtime Admission Readiness DB",
  };
}

export function buildSafeRuntimeExecutionDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const key = executionKey(input);
  const admissionRecord = sourceAdmissionRecord(input);
  const runtimeExecutionId = input.runtimeExecutionId || safeId("p1163-runtime-execution", key);
  const runtimeAdmissionId = input.runtimeAdmissionId || admissionRecord.runtimeAdmissionId || safeId("p1163-runtime-admission", key);
  const dispatchReadinessId = input.dispatchReadinessId || admissionRecord.dispatchReadinessId || safeId("p1163-dispatch", key);
  const assignmentId = input.assignmentId || admissionRecord.assignmentId || safeId("p1163-assignment", key);
  const queueItemId = input.queueItemId || admissionRecord.queueItemId || safeId("p1163-queue-item", key);
  const workOrderId = input.workOrderId || admissionRecord.workOrderId || safeId("p1163-work-order", key);

  switch (entityName) {
    case "founder_runtime_execution_readiness_items":
      return {
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder runtime execution readiness item",
        executionLane: input.executionLane || "Founder Runtime Execution Readiness",
        executionState: input.executionState || "runtime_execution_readiness_recorded_locally",
        executionSummary: input.executionSummary || "Display-safe runtime execution readiness summary recorded locally without execution.",
        executionTarget: input.executionTarget || "Local governed runtime execution readiness preview",
        ownerCapability: input.ownerCapability || "NEXUS Founder Runtime Execution Readiness DB",
        nextAction: input.nextAction || "Review execution evidence before any later explicitly approved runtime execution phase.",
        disabledReason: "P116.3 records local runtime execution readiness metadata only; execution remains blocked.",
        operatorApprovalRequired: true,
        operatorApproved: input.operatorApproved === true,
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        runtimeAdmissionRequired: true,
        runtimeAdmissionSatisfied: false,
        runtimeExecutionAllowed: false,
        executionUnlockAllowed: false,
        workerExecutionAllowed: false,
        toolExecutionAllowed: false,
        providerCallAllowed: false,
        agentDispatchAllowed: false,
        projectMutationAllowed: false,
        packageActionAllowed: false,
        deployActionAllowed: false,
        releaseActionAllowed: false,
        exportActionAllowed: false,
        networkCallAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1163-founder-live-runtime-execution-readiness-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_runtime_execution_events":
      return {
        runtimeExecutionEventId: safeId("p1163-runtime-execution-event", input.eventKey || key),
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_crud_execution_readiness",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Runtime Execution Readiness DB",
        eventSummary: input.eventSummary || "Governed local runtime execution readiness CRUD event recorded without execution authority.",
        rollbackAvailable: true,
        runtimeExecutionAllowed: false,
        executionUnlockAllowed: false,
        workerExecutionAllowed: false,
        toolExecutionAllowed: false,
        providerCallAllowed: false,
        agentDispatchAllowed: false,
        projectMutationAllowed: false,
        networkCallAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1163-founder-live-runtime-execution-readiness-report.md"],
        createdAt: timestamp,
      };
    case "founder_runtime_execution_evidence_refs":
      return {
        runtimeExecutionEvidenceRefId: safeId("p1163-runtime-execution-evidence", input.evidenceKey || key),
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P116.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1163-founder-live-runtime-execution-readiness-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P116.3 founder runtime execution readiness CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `runtime-execution-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Runtime Execution Readiness DB",
    requestedOperation: "create_or_update_local_founder_runtime_execution_readiness_record",
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
    hostedDbWritesAllowed: false,
    runtimeExecutionAllowed: false,
    executionUnlockAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    validationCommands: [
      "npm run check:p1163-founder-live-runtime-execution-readiness",
      "npm run check:p1162-founder-live-runtime-execution-readiness",
    ],
    evidenceRefs: ["reports/p1163-founder-live-runtime-execution-readiness-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No runtime execution, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedRuntimeExecutionDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedRuntimeExecutionEntity(entity)) {
    return blockedResult(request, "Entity is outside the P116.3 founder runtime execution readiness CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P116.3.", ["Delete is outside the P116.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P116.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P116.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P116.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
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
        runtimeExecutionAllowed: false,
        executionAllowed: false,
        executionUnlockAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedRuntimeFlags(),
      };
    }

    const record = input.record || buildSafeRuntimeExecutionDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
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
        runtimeExecutionAllowed: false,
        executionAllowed: false,
        executionUnlockAllowed: false,
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
      return blockedResult(request, "Operation is outside the P116.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
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
      runtimeExecutionAllowed: false,
      executionAllowed: false,
      executionUnlockAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
      ...blockedRuntimeFlags(),
    };
  } catch (error) {
    return blockedResult(request, "P116.3 local founder runtime execution readiness CRUD failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveRuntimeExecutionReadinessContract(input = {}) {
  const requests = P116_RUNTIME_EXECUTION_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;
  const admissionSummary = sourceAdmissionSummary(input);

  return createPassResult({
    phase: P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
    mode: "governed-founder-runtime-execution-readiness-db-crud",
    source: "live-ready/founderLiveRuntimeExecutionReadiness.js",
    summary: "Founder runtime execution readiness is modeled for governed local SQLite CRUD only.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_runtime_execution_readiness_db_crud_ready_for_approved_local_metadata"
        : "founder_runtime_execution_readiness_db_crud_blocked_until_local_evidence",
      runtimeMode: "local-sqlite-founder-runtime-execution-readiness",
      dbMode: config.mode,
      sourceAdmissionItem: sourceAdmissionRecord(input),
      sourceAdmissionSummary: admissionSummary,
      executionItem: buildSafeRuntimeExecutionDbRecord("founder_runtime_execution_readiness_items", input),
      executionEvents: [buildSafeRuntimeExecutionDbRecord("founder_runtime_execution_events", input)],
      evidenceRefs: [buildSafeRuntimeExecutionDbRecord("founder_runtime_execution_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P116.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedRuntimeExecutionDbCrudRequest for approved local readiness records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local execution-readiness CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P116.3 local CRUD admission.`),
      disabledReason:
        "P116.3 only admits governed local SQLite CRUD for founder runtime execution readiness OS records. Runtime execution, execution unlock, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Runtime Execution Readiness DB CRUD",
      auditRefs: ["reports/p1163-founder-live-runtime-execution-readiness-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No runtime execution, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1163-founder-live-runtime-execution-readiness-report.md",
      "contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json",
    ],
    warnings: [
      "P116.3 does not execute runtime work, call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveRuntimeExecutionReadinessContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE) errors.push("phase must be P116.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceAdmissionItem", "sourceAdmissionSummary", "executionItem", "executionEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P116_RUNTIME_EXECUTION_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder runtime execution readiness DB entities");
  for (const entity of P116_RUNTIME_EXECUTION_DB_ENTITIES) {
    if (!data.localCrudRequests?.some((request) => request.sqliteEntity === entity)) errors.push(`missing request for ${entity}`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const request of data.localCrudRequests || []) {
    if (request.requestCanExecute !== false) errors.push(`${request.sqliteEntity}.requestCanExecute must be false`);
    if (request.runtimeExecutionAllowed !== false) errors.push(`${request.sqliteEntity}.runtimeExecutionAllowed must be false`);
    if (request.executionAllowed !== false) errors.push(`${request.sqliteEntity}.executionAllowed must be false`);
    if (request.executionUnlockAllowed !== false) errors.push(`${request.sqliteEntity}.executionUnlockAllowed must be false`);
    if (request.projectMutationAllowed !== false) errors.push(`${request.sqliteEntity}.projectMutationAllowed must be false`);
    if (request.providerSpendAllowed !== false) errors.push(`${request.sqliteEntity}.providerSpendAllowed must be false`);
    if (request.hostedDbWritesAllowed !== false) errors.push(`${request.sqliteEntity}.hostedDbWritesAllowed must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder runtime execution readiness CRUD model must not expose raw private IDs");
  if (/run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute runtime now|execute now/i.test(serialized)) errors.push("Founder runtime execution readiness CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
