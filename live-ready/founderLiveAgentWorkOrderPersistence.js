import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildFounderLiveHandoffWorkOrders } from "./founderLiveHandoffWorkOrders.js";
import { buildFounderLiveWorkAdmission } from "./founderLiveWorkAdmission.js";

export const P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE = "P111.3";

export const P111_AGENT_WORK_ORDER_DB_ENTITIES = Object.freeze([
  "founder_agent_work_orders",
  "founder_agent_work_order_events",
  "founder_agent_work_order_evidence_refs",
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
  "runtime admission",
  "execution unlock",
  "deploy/release/export/package",
  "network calls",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function safeSlug(value = "agent-work-order") {
  return String(value || "agent-work-order")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "agent-work-order";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedWorkOrderEntity(entityName = "") {
  return P111_AGENT_WORK_ORDER_DB_ENTITIES.includes(entityName);
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
    phase: P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
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

function firstWorkOrderRow(input = {}) {
  const workOrdersEnvelope = input.workOrdersEnvelope || buildFounderLiveHandoffWorkOrders(input);
  return workOrdersEnvelope.data?.workOrderRows?.[0] || {};
}

function firstWorkAdmission(input = {}) {
  const admissionEnvelope = input.workAdmissionEnvelope || buildFounderLiveWorkAdmission(input);
  return admissionEnvelope.data?.workAdmissions?.[0] || {};
}

export function buildSafeAgentWorkOrderDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const workOrderKey = input.workOrderKey || "founder-agent-work-order";
  const workOrderId = safeId("p1113-work-order", workOrderKey);
  const workOrderRow = input.workOrderRow || firstWorkOrderRow(input);
  const admission = input.workAdmission || firstWorkAdmission(input);

  switch (entityName) {
    case "founder_agent_work_orders":
      return {
        workOrderId,
        publicLabel: input.publicLabel || workOrderRow.title || "Founder agent work order",
        sourceHandoffLabel: input.sourceHandoffLabel || workOrderRow.title || "Founder live handoff work order",
        sourceAdmissionLabel: input.sourceAdmissionLabel || admission.displayLabel || "Founder live work admission",
        proposedAgent: input.proposedAgent || workOrderRow.proposedAgent || admission.proposedAgentLane || "Product Strategy",
        proposedWork: input.proposedWork || workOrderRow.proposedWork || admission.proposedOutcome || "Prepare governed work for later review.",
        workOrderState: input.workOrderState || "recorded_locally_after_operator_gate",
        workOrderSummary: input.workOrderSummary || "Display-safe founder agent work order summary.",
        nextAction: input.nextAction || "Review Command Center work order persistence UX before broader runtime admission.",
        disabledReason: "P111.3 records local work order metadata only; dispatch and execution remain blocked.",
        ownerCapability: input.ownerCapability || "NEXUS Founder Agent Work Order DB",
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        dispatchAllowed: false,
        executionAllowed: false,
        workerExecutionAllowed: false,
        runtimeAdmissionAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1113-founder-live-agent-work-order-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_agent_work_order_events":
      return {
        workOrderEventId: safeId("p1113-work-order-event", input.eventKey || workOrderKey),
        workOrderId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Agent Work Order DB",
        eventSummary: input.eventSummary || "Governed local CRUD event recorded without dispatch or execution authority.",
        rollbackAvailable: true,
        dispatchAllowed: false,
        executionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p1113-founder-live-agent-work-order-crud-model-report.md"],
        createdAt: timestamp,
      };
    case "founder_agent_work_order_evidence_refs":
      return {
        workOrderEvidenceRefId: safeId("p1113-work-order-evidence", input.evidenceKey || workOrderKey),
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P111.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1113-founder-live-agent-work-order-crud-model-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P111.3 founder agent work order CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `agent-work-order-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Agent Work Order DB",
    requestedOperation: "create_or_update_local_founder_agent_work_order_record",
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
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    validationCommands: [
      "npm run check:p1113-founder-live-agent-work-order-crud-model",
      "npm run check:p1112-founder-live-agent-work-order-schema",
    ],
    evidenceRefs: ["reports/p1113-founder-live-agent-work-order-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedAgentWorkOrderDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedWorkOrderEntity(entity)) {
    return blockedResult(request, "Entity is outside the P111.3 founder agent work order CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P111.3.", ["Delete is outside the P111.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P111.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P111.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P111.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
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

    const record = input.record || buildSafeAgentWorkOrderDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
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
      return blockedResult(request, "Operation is outside the P111.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
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
    return blockedResult(request, "P111.3 local founder agent work order CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveAgentWorkOrderPersistenceContract(input = {}) {
  const requests = P111_AGENT_WORK_ORDER_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
    mode: "governed-founder-agent-work-order-db-crud",
    source: "live-ready/founderLiveAgentWorkOrderPersistence.js",
    summary: "Founder agent work order persistence is modeled for governed local SQLite CRUD admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_agent_work_order_db_crud_ready_for_approved_local_admission"
        : "founder_agent_work_order_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-agent-work-order",
      dbMode: config.mode,
      workOrder: buildSafeAgentWorkOrderDbRecord("founder_agent_work_orders", input),
      workOrderEvents: [buildSafeAgentWorkOrderDbRecord("founder_agent_work_order_events", input)],
      evidenceRefs: [buildSafeAgentWorkOrderDbRecord("founder_agent_work_order_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P111.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedAgentWorkOrderDbCrudRequest for approved local work order records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local work order CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P111.3 local CRUD admission.`),
      disabledReason:
        "P111.3 only admits governed local SQLite CRUD for founder agent work order OS records. Hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Agent Work Order DB CRUD",
      auditRefs: ["reports/p1113-founder-live-agent-work-order-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1113-founder-live-agent-work-order-crud-model-report.md",
      "contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json",
    ],
    warnings: [
      "P111.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, admit runtime execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveAgentWorkOrderPersistenceContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE) errors.push("phase must be P111.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "workOrder", "workOrderEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P111_AGENT_WORK_ORDER_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder agent work order DB entities");
  for (const entity of P111_AGENT_WORK_ORDER_DB_ENTITIES) {
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
    if (request.hostedDbWritesAllowed !== false) errors.push(`${request.sqliteEntity}.hostedDbWritesAllowed must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder agent work order CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Founder agent work order CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
