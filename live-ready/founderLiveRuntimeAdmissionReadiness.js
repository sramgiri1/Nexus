import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeAgentDispatchDbRecord } from "./founderLiveAgentDispatchReadiness.js";

export const P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE = "P115.3";

export const P115_RUNTIME_ADMISSION_DB_ENTITIES = Object.freeze([
  "founder_runtime_admission_readiness_items",
  "founder_runtime_admission_events",
  "founder_runtime_admission_evidence_refs",
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
  "runtime admission",
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

function safeSlug(value = "runtime-admission-readiness") {
  return String(value || "runtime-admission-readiness")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "runtime-admission-readiness";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedRuntimeAdmissionEntity(entityName = "") {
  return P115_RUNTIME_ADMISSION_DB_ENTITIES.includes(entityName);
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
    phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
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
    runtimeAdmissionAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

function admissionKey(input = {}) {
  return input.admissionKey || input.dispatchKey || "founder-runtime-admission-readiness";
}

function sourceDispatchRecord(input = {}) {
  return input.dispatchRecord || buildSafeAgentDispatchDbRecord("founder_agent_dispatch_readiness_items", input);
}

function sourceDispatchSummary(input = {}) {
  const dispatchRecord = sourceDispatchRecord(input);
  return {
    publicLabel: dispatchRecord.publicLabel || "Founder agent dispatch readiness item",
    dispatchLane: dispatchRecord.dispatchLane || "Founder Strategy Dispatch",
    dispatchState: dispatchRecord.dispatchState || "dispatch readiness reviewed locally",
    dispatchSummary: dispatchRecord.dispatchSummary || "Display-safe founder dispatch readiness summary.",
    assignedAgent: dispatchRecord.assignedAgent || "NEXUS Founder Strategy Agent",
    nextAction: dispatchRecord.nextAction || "Review runtime admission readiness before any later explicit runtime phase.",
    ownerCapability: dispatchRecord.ownerCapability || "NEXUS Founder Agent Dispatch Readiness DB",
  };
}

export function buildSafeRuntimeAdmissionDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const key = admissionKey(input);
  const dispatchRecord = sourceDispatchRecord(input);
  const runtimeAdmissionId = input.runtimeAdmissionId || safeId("p1153-runtime-admission", key);
  const dispatchReadinessId = input.dispatchReadinessId || dispatchRecord.dispatchReadinessId || safeId("p1153-dispatch", key);
  const assignmentId = input.assignmentId || dispatchRecord.assignmentId || safeId("p1153-assignment", key);
  const queueItemId = input.queueItemId || dispatchRecord.queueItemId || safeId("p1153-queue-item", key);
  const workOrderId = input.workOrderId || dispatchRecord.workOrderId || safeId("p1153-work-order", key);

  switch (entityName) {
    case "founder_runtime_admission_readiness_items":
      return {
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder runtime admission readiness item",
        admissionLane: input.admissionLane || dispatchRecord.dispatchLane || "Founder Runtime Readiness",
        admissionState: input.admissionState || "runtime_admission_readiness_recorded_locally",
        admissionSummary: input.admissionSummary || "Display-safe runtime admission readiness summary recorded locally without runtime admission.",
        runtimeTarget: input.runtimeTarget || "Local governed runtime admission readiness preview",
        ownerCapability: input.ownerCapability || "NEXUS Founder Runtime Admission Readiness DB",
        nextAction: input.nextAction || "Review readiness evidence before any later explicitly approved runtime admission phase.",
        disabledReason: "P115.3 records local runtime admission readiness metadata only; runtime admission and execution remain blocked.",
        operatorApprovalRequired: true,
        operatorApproved: input.operatorApproved === true,
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        runtimeAdmissionAllowed: false,
        executionAllowed: false,
        workerExecutionAllowed: false,
        providerCallAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1153-founder-live-runtime-admission-readiness-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_runtime_admission_events":
      return {
        runtimeAdmissionEventId: safeId("p1153-runtime-admission-event", input.eventKey || key),
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Runtime Admission Readiness DB",
        eventSummary: input.eventSummary || "Governed local runtime admission readiness CRUD event recorded without runtime admission or execution authority.",
        rollbackAvailable: true,
        runtimeAdmissionAllowed: false,
        executionAllowed: false,
        workerExecutionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p1153-founder-live-runtime-admission-readiness-report.md"],
        createdAt: timestamp,
      };
    case "founder_runtime_admission_evidence_refs":
      return {
        runtimeAdmissionEvidenceRefId: safeId("p1153-runtime-admission-evidence", input.evidenceKey || key),
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P115.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1153-founder-live-runtime-admission-readiness-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P115.3 founder runtime admission readiness CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `runtime-admission-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Runtime Admission Readiness DB",
    requestedOperation: "create_or_update_local_founder_runtime_admission_readiness_record",
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
    runtimeAdmissionAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    validationCommands: [
      "npm run check:p1153-founder-live-runtime-admission-readiness",
      "npm run check:p1152-founder-live-runtime-admission-readiness",
    ],
    evidenceRefs: ["reports/p1153-founder-live-runtime-admission-readiness-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No runtime admission, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedRuntimeAdmissionDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedRuntimeAdmissionEntity(entity)) {
    return blockedResult(request, "Entity is outside the P115.3 founder runtime admission readiness CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P115.3.", ["Delete is outside the P115.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P115.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P115.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P115.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
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
        runtimeAdmissionAllowed: false,
        executionAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedRuntimeFlags(),
      };
    }

    const record = input.record || buildSafeRuntimeAdmissionDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
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
        runtimeAdmissionAllowed: false,
        executionAllowed: false,
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
      return blockedResult(request, "Operation is outside the P115.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
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
      runtimeAdmissionAllowed: false,
      executionAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
      ...blockedRuntimeFlags(),
    };
  } catch (error) {
    return blockedResult(request, "P115.3 local founder runtime admission readiness CRUD failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveRuntimeAdmissionReadinessContract(input = {}) {
  const requests = P115_RUNTIME_ADMISSION_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;
  const dispatchSummary = sourceDispatchSummary(input);

  return createPassResult({
    phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
    mode: "governed-founder-runtime-admission-readiness-db-crud",
    source: "live-ready/founderLiveRuntimeAdmissionReadiness.js",
    summary: "Founder runtime admission readiness is modeled for governed local SQLite CRUD only.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_runtime_admission_readiness_db_crud_ready_for_approved_local_admission"
        : "founder_runtime_admission_readiness_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-runtime-admission-readiness",
      dbMode: config.mode,
      sourceDispatchItem: sourceDispatchRecord(input),
      sourceDispatchSummary: dispatchSummary,
      admissionItem: buildSafeRuntimeAdmissionDbRecord("founder_runtime_admission_readiness_items", input),
      admissionEvents: [buildSafeRuntimeAdmissionDbRecord("founder_runtime_admission_events", input)],
      evidenceRefs: [buildSafeRuntimeAdmissionDbRecord("founder_runtime_admission_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P115.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedRuntimeAdmissionDbCrudRequest for approved local readiness records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local readiness CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P115.3 local CRUD admission.`),
      disabledReason:
        "P115.3 only admits governed local SQLite CRUD for founder runtime admission readiness OS records. Runtime admission, execution unlock, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Runtime Admission Readiness DB CRUD",
      auditRefs: ["reports/p1153-founder-live-runtime-admission-readiness-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No runtime admission, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1153-founder-live-runtime-admission-readiness-report.md",
      "contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json",
    ],
    warnings: [
      "P115.3 does not admit runtime work, call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveRuntimeAdmissionReadinessContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE) errors.push("phase must be P115.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceDispatchItem", "sourceDispatchSummary", "admissionItem", "admissionEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P115_RUNTIME_ADMISSION_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder runtime admission readiness DB entities");
  for (const entity of P115_RUNTIME_ADMISSION_DB_ENTITIES) {
    if (!data.localCrudRequests?.some((request) => request.sqliteEntity === entity)) errors.push(`missing request for ${entity}`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const request of data.localCrudRequests || []) {
    if (request.requestCanExecute !== false) errors.push(`${request.sqliteEntity}.requestCanExecute must be false`);
    if (request.runtimeAdmissionAllowed !== false) errors.push(`${request.sqliteEntity}.runtimeAdmissionAllowed must be false`);
    if (request.executionAllowed !== false) errors.push(`${request.sqliteEntity}.executionAllowed must be false`);
    if (request.projectMutationAllowed !== false) errors.push(`${request.sqliteEntity}.projectMutationAllowed must be false`);
    if (request.providerSpendAllowed !== false) errors.push(`${request.sqliteEntity}.providerSpendAllowed must be false`);
    if (request.hostedDbWritesAllowed !== false) errors.push(`${request.sqliteEntity}.hostedDbWritesAllowed must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder runtime admission readiness CRUD model must not expose raw private IDs");
  if (/admit runtime now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Founder runtime admission readiness CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
