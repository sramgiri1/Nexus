import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildGovernedRuntimeMutationRequest } from "./governedRuntimeMutationRequest.js";

export const P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE = "P93.4";

export const P93_ALLOWED_LOCAL_CRUD_ENTITIES = Object.freeze([
  "runtime_events",
  "contracts",
  "mission_tasks",
  "actions",
  "runtime_tasks",
  "evidence",
  "audit_events",
  "roadmap_phases",
]);

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
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

const APPROVAL_REQUIREMENTS = Object.freeze([
  "operatorApproval",
  "rollbackAccepted",
  "auditAccepted",
  "validationCommandsAccepted",
  "sqliteLiveMode",
  "sqliteWritesEnabled",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function admissionKey(requestKey = "") {
  return `local-crud-admission-${String(requestKey).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.payloadShape?.sqliteEntity || "";
}

function isAllowedEntity(entityName = "") {
  return P93_ALLOWED_LOCAL_CRUD_ENTITIES.includes(entityName);
}

function primaryKeyForEntity(entityName) {
  return describeSqliteCrudEntity(entityName).primaryKey;
}

function safeId(prefix, lane = "") {
  return `${prefix}-${String(lane).replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "runtime"}`;
}

export function buildSafeLocalCrudRecord(request = {}, input = {}) {
  const entity = requestEntity(request);
  const lane = request.lane || entity;
  const timestamp = input.timestamp || new Date().toISOString();
  const safeProject = "nexus-os";

  switch (entity) {
    case "runtime_events":
      return {
        eventId: safeId("p934-event", lane),
        taskId: safeId("p934-task", lane),
        eventType: "enterprise_runtime_admission",
        timestamp,
      };
    case "contracts":
      return {
        contractId: safeId("p934-contract", lane),
        contractType: "enterprise_runtime_prd_artifact",
        projectId: safeProject,
        targetAgent: request.ownerCapability || "NEXUS Enterprise Runtime",
        createdAt: timestamp,
      };
    case "mission_tasks":
      return {
        taskId: safeId("p934-mission-task", lane),
        missionId: "p93-enterprise-runtime",
        projectId: safeProject,
        title: "Enterprise runtime workstream plan",
        targetAgent: request.ownerCapability || "NEXUS Enterprise Runtime",
        capabilityId: "enterprise-runtime-crud",
        riskLevel: "low",
        state: "admission_reviewed",
        mutationAllowed: false,
        executionAllowed: false,
        createdAt: timestamp,
      };
    case "actions":
      return {
        actionId: safeId("p934-action", lane),
        actionType: "enterprise_runtime_crud_admission",
        projectId: safeProject,
        taskId: safeId("p934-task", lane),
        status: "reviewed",
        createdAt: timestamp,
      };
    case "runtime_tasks":
      return {
        taskId: safeId("p934-runtime-task", lane),
        missionId: "p93-enterprise-runtime",
        projectId: safeProject,
        title: "Enterprise runtime task queue item",
        targetAgent: request.ownerCapability || "NEXUS Enterprise Runtime",
        capabilityId: "enterprise-runtime-crud",
        riskLevel: "low",
        state: "admission_reviewed",
        mutationAllowed: false,
        executionAllowed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "evidence":
      return {
        evidenceId: safeId("p934-evidence", lane),
        taskId: safeId("p934-task", lane),
        type: "enterprise_runtime_admission",
        result: "PASS",
        createdAt: timestamp,
      };
    case "audit_events":
      return {
        auditId: safeId("p934-audit", lane),
        taskId: safeId("p934-task", lane),
        eventType: "enterprise_runtime_crud_admitted",
        agent: request.ownerCapability || "NEXUS Enterprise Runtime",
        timestamp,
      };
    case "roadmap_phases":
      return {
        phase: "P93.4",
        label: "Local CRUD Execution Admission",
        status: "complete",
        current: "P93.4",
        next: "P93.5",
      };
    default:
      throw new Error(`Entity is not allowed for P93.4 local CRUD admission: ${entity}`);
  }
}

function approvalReady(input = {}) {
  return input.operatorApproval === true
    && input.rollbackAccepted === true
    && input.auditAccepted === true
    && input.validationCommandsAccepted === true;
}

function blockedAdmissionResult(request, disabledReason, errors = []) {
  return {
    ok: errors.length === 0,
    phase: P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE,
    requestKey: request?.requestKey || "",
    entity: requestEntity(request),
    operation: "none",
    admitted: false,
    written: false,
    read: false,
    disabledReason,
    errors,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedLocalCrudMutationRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedEntity(entity)) {
    return blockedAdmissionResult(request, "Entity is outside the P93.4 OS runtime CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (request.requestState && !["ready_for_operator_review_not_executable", "blocked_missing_review_evidence"].includes(request.requestState)) {
    return blockedAdmissionResult(request, "Request state is not recognized by P93.4 admission.", [`Invalid request state: ${request.requestState}`]);
  }
  if (operation === "delete") {
    return blockedAdmissionResult(request, "Delete is not admitted in P93.4.", ["Delete is outside the P93.4 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedAdmissionResult(request, "P93.4 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedAdmissionResult(request, "P93.4 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedAdmissionResult(request, "P93.4 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        records: listSqliteEntityRecords(entity, { limit: input.limit || 25 }, input),
        errors: [],
        disabledReason: "",
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedRuntimeFlags(),
      };
    }

    const record = input.record || buildSafeLocalCrudRecord(request, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        record: getSqliteEntityById(entity, id, input),
        errors: [],
        disabledReason: "",
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
      return blockedAdmissionResult(request, "Operation is outside the P93.4 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE,
      requestKey: request.requestKey,
      entity,
      operation,
      admitted: true,
      written: true,
      read: false,
      record: persisted,
      errors: [],
      disabledReason: "",
      projectMutationAllowed: false,
      providerSpendAllowed: false,
      ...blockedRuntimeFlags(),
    };
  } catch (error) {
    return blockedAdmissionResult(request, "P93.4 local CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

function buildAdmissionEntry(request = {}, input = {}) {
  const entity = requestEntity(request);
  const config = getSqliteRuntimeConfig(input);
  const canAttempt = input.execute === true && approvalReady(input) && config.sqliteLiveAllowed && config.dbWritesEnabled && isAllowedEntity(entity);
  return {
    admissionKey: admissionKey(request.requestKey),
    requestKey: request.requestKey,
    lane: request.lane,
    ownerCapability: request.ownerCapability,
    sqliteEntity: entity,
    admittedOperations: ["create", "read", "update", "upsert", "list"],
    forbiddenOperations: ["delete", "raw SQL", "hosted DB mutation", "project mutation", "provider/model calls", "agent dispatch", "worker/tool execution", "deploy/release/export/package", "provider spend"],
    operatorApprovalRequired: true,
    rollbackRequired: true,
    auditRequired: true,
    validationRequired: true,
    localCrudExecutionAllowed: canAttempt,
    sqliteWriteAllowed: canAttempt,
    dbWritesAllowed: canAttempt,
    hostedDbWritesAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    requiredEvidence: [...APPROVAL_REQUIREMENTS],
    missingEvidence: APPROVAL_REQUIREMENTS.filter((requirement) => {
      if (requirement === "operatorApproval") return input.operatorApproval !== true;
      if (requirement === "rollbackAccepted") return input.rollbackAccepted !== true;
      if (requirement === "auditAccepted") return input.auditAccepted !== true;
      if (requirement === "validationCommandsAccepted") return input.validationCommandsAccepted !== true;
      if (requirement === "sqliteLiveMode") return config.sqliteLiveAllowed !== true;
      if (requirement === "sqliteWritesEnabled") return config.dbWritesEnabled !== true;
      return true;
    }),
    nextAction: canAttempt
      ? "Use executeApprovedLocalCrudMutationRequest with the reviewed record payload."
      : "Provide explicit operator approval and local SQLite write flags before admission can attempt CRUD.",
    disabledReason: canAttempt
      ? ""
      : "P93.4 admission is blocked until operator approval, rollback, audit, validation command acceptance, sqlite-live mode, and local write flags are present.",
    validationCommands: [
      "npm run check:p934-local-crud-execution-admission",
      "npm run check:p933-governed-runtime-mutation-request",
      "npm run check:p932-enterprise-runtime-crud-plan",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: [
      "reports/p934-local-crud-execution-admission-report.md",
      "reports/p933-governed-runtime-mutation-request-report.md",
    ],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite only when explicitly admitted. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function buildLocalCrudExecutionAdmission(input = {}) {
  const requestEnvelope = input.requestEnvelope || buildGovernedRuntimeMutationRequest(input);
  const config = getSqliteRuntimeConfig(input);
  const admissionEntries = (requestEnvelope.data?.mutationRequests || []).map((request) => buildAdmissionEntry(request, input));
  const admittedCount = admissionEntries.filter((entry) => entry.localCrudExecutionAllowed === true).length;

  return createPassResult({
    phase: P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE,
    mode: "local-crud-execution-admission",
    source: "live-ready/localCrudExecutionAdmission.js",
    summary: "Local CRUD execution admission is available for approved OS runtime SQLite entities.",
    data: {
      schemaVersion: "1.0",
      currentState: admittedCount > 0
        ? "local_crud_admission_ready_for_explicit_execution"
        : "local_crud_admission_blocked_until_explicit_approval_and_flags",
      dbMode: config.sqliteLiveAllowed ? "sqlite-live" : "not-sqlite-live",
      requestSourcePhase: requestEnvelope.phase,
      allowedEntities: [...P93_ALLOWED_LOCAL_CRUD_ENTITIES],
      admittedOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: ["delete", "raw SQL", "hosted DB mutation", "project mutation", "provider/model calls", "agent dispatch", "worker/tool execution", "deploy/release/export/package", "provider spend"],
      admissionEntries,
      admissionReadiness: {
        admittedCount,
        blockedCount: admissionEntries.length - admittedCount,
        totalEntryCount: admissionEntries.length,
        sqliteLiveAllowed: config.sqliteLiveAllowed,
        dbWritesEnabled: config.dbWritesEnabled,
      },
      mutationGate:
        "P93.4 admits local SQLite CRUD only for allowlisted OS runtime entities when explicit operator approval and local write flags are present.",
      nextAction: "Implement P93.5 Command Center live runtime UX for DB-backed admission state.",
      blockers: admissionEntries.flatMap((entry) => entry.missingEvidence.map((item) => `${entry.lane} requires ${item}.`)),
      disabledReason: admittedCount > 0
        ? ""
        : "Local CRUD execution admission requires operator approval, rollback, audit, validation command acceptance, sqlite-live mode, and local write flags.",
      ownerCapability: "NEXUS Enterprise Local CRUD Admission",
      evidenceRefs: [
        "reports/p934-local-crud-execution-admission-report.md",
        "reports/p933-governed-runtime-mutation-request-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p934-local-crud-execution-admission-report.md",
      "contracts/os-roadmap/p93-execution-contracts.json",
    ],
    warnings: ["P93.4 does not allow project mutation, provider calls, agent dispatch, hosted DB mutation, deploy, package creation, or spend."],
  });
}

export function validateLocalCrudExecutionAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P93_LOCAL_CRUD_EXECUTION_ADMISSION_PHASE) errors.push("phase must be P93.4");
  for (const field of ["schemaVersion", "currentState", "dbMode", "requestSourcePhase", "allowedEntities", "admittedOperations", "forbiddenOperations", "admissionEntries", "admissionReadiness", "mutationGate", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.allowedEntities) || data.allowedEntities.some((entity) => !P93_ALLOWED_LOCAL_CRUD_ENTITIES.includes(entity))) {
    errors.push("allowedEntities must stay scoped to P93 OS runtime entities");
  }
  if (data.admittedOperations?.includes("delete")) errors.push("delete must not be admitted in P93.4");
  if (!Array.isArray(data.admissionEntries) || data.admissionEntries.length !== P93_ALLOWED_LOCAL_CRUD_ENTITIES.length) {
    errors.push("admissionEntries must cover the P93.3 request lanes");
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const entry of data.admissionEntries || []) {
    for (const field of ["admissionKey", "requestKey", "lane", "ownerCapability", "sqliteEntity", "admittedOperations", "forbiddenOperations", "operatorApprovalRequired", "rollbackRequired", "auditRequired", "validationRequired", "localCrudExecutionAllowed", "sqliteWriteAllowed", "dbWritesAllowed", "hostedDbWritesAllowed", "projectMutationAllowed", "providerSpendAllowed", "requiredEvidence", "missingEvidence", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in entry)) errors.push(`${entry.lane || "entry"}.${field} missing`);
    }
    if (!P93_ALLOWED_LOCAL_CRUD_ENTITIES.includes(entry.sqliteEntity)) errors.push(`${entry.lane}.sqliteEntity is not allowlisted`);
    if (entry.admittedOperations?.includes("delete")) errors.push(`${entry.lane}.delete must not be admitted`);
    if (entry.operatorApprovalRequired !== true || entry.rollbackRequired !== true || entry.auditRequired !== true || entry.validationRequired !== true) {
      errors.push(`${entry.lane}.approval, rollback, audit, and validation must be required`);
    }
    if (entry.hostedDbWritesAllowed !== false || entry.projectMutationAllowed !== false || entry.providerSpendAllowed !== false) {
      errors.push(`${entry.lane}.unsafe mutation flags must remain false`);
    }
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (entry[flag] !== false) errors.push(`${entry.lane}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) {
    errors.push("local CRUD admission must not expose raw private IDs");
  }
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) {
    errors.push("local CRUD admission must not expose fake unsafe runnable actions");
  }
  return { valid: errors.length === 0, errors };
}
