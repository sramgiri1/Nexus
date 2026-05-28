import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeAgentWorkOrderDbRecord } from "./founderLiveAgentWorkOrderPersistence.js";

export const P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE = "P112.3";
export const P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_PHASE = "P112.4";

export const P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES = Object.freeze({
  LOCAL_PREVIEW_READY_EXECUTION_BLOCKED: "founder_agent_work_queue_admission_preview_ready_execution_blocked",
  NEEDS_WORK_ORDER_CONTEXT: "founder_agent_work_queue_admission_preview_needs_work_order_context",
});

export const P112_AGENT_WORK_QUEUE_DB_ENTITIES = Object.freeze([
  "founder_agent_work_queue_items",
  "founder_agent_work_queue_events",
  "founder_agent_work_queue_evidence_refs",
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

function safeSlug(value = "agent-work-queue") {
  return String(value || "agent-work-queue")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "agent-work-queue";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedQueueEntity(entityName = "") {
  return P112_AGENT_WORK_QUEUE_DB_ENTITIES.includes(entityName);
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
    phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE,
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

function sourceWorkOrder(input = {}) {
  return input.workOrderRecord || buildSafeAgentWorkOrderDbRecord("founder_agent_work_orders", input);
}

function sourceWorkOrderSummary(input = {}) {
  const workOrder = sourceWorkOrder(input);
  return {
    publicLabel: workOrder.publicLabel || "Founder agent work order",
    sourceHandoffLabel: workOrder.sourceHandoffLabel || "Founder live handoff work order",
    sourceAdmissionLabel: workOrder.sourceAdmissionLabel || "Founder live work admission",
    proposedAgent: workOrder.proposedAgent || "Product Strategy",
    proposedWork: workOrder.proposedWork || "Prepare governed founder work for later review.",
    workOrderSummary: workOrder.workOrderSummary || "Display-safe founder agent work order summary.",
    nextAction: workOrder.nextAction || "Review queue admission preview before local queue CRUD.",
  };
}

function previewLanes(input = {}) {
  return input.previewLanes || [
    {
      lane: "Product Strategy",
      displayLabel: "Business validation queue candidate",
      proposedOutcome: "Clarify founder problem, target user, value promise, and PRD readiness.",
      ownerCapability: "NEXUS Founder Strategy Agent",
    },
    {
      lane: "Technical Planning",
      displayLabel: "Technical scope queue candidate",
      proposedOutcome: "Map architecture, data needs, platform constraints, and build risks.",
      ownerCapability: "NEXUS Technical Planning Agent",
    },
    {
      lane: "Go-to-Market",
      displayLabel: "Launch planning queue candidate",
      proposedOutcome: "Outline positioning, validation experiments, pricing questions, and launch blockers.",
      ownerCapability: "NEXUS Go-to-Market Agent",
    },
  ];
}

function buildPreviewQueueRow(lane, index, input = {}) {
  const workOrder = sourceWorkOrderSummary(input);
  const queueRecord = buildSafeAgentWorkQueueDbRecord("founder_agent_work_queue_items", {
    ...input,
    queueLane: lane.lane,
    publicLabel: lane.displayLabel,
    queueSummary: lane.proposedOutcome,
    ownerCapability: lane.ownerCapability,
  });

  return {
    displayHandle: `queue-preview-${index + 1}-${safeSlug(lane.lane, "lane")}`,
    displayLabel: lane.displayLabel,
    sourceWorkOrderLabel: workOrder.publicLabel,
    sourceHandoffLabel: workOrder.sourceHandoffLabel,
    sourceAdmissionLabel: workOrder.sourceAdmissionLabel,
    proposedAgentLane: lane.lane,
    proposedOutcome: lane.proposedOutcome || queueRecord.queueSummary,
    queuePosition: index + 1,
    queueState: P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED,
    previewMode: "local-only-dry-run",
    localPreviewReady: true,
    queueSummary: lane.proposedOutcome || queueRecord.queueSummary,
    nextAction: "Review this local queue candidate in Command Center before any later approved local queue CRUD.",
    blockers: [
      "Queue admission preview is local and read-only.",
      "Local queue writes require a later explicit approved CRUD request.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project creation and mutation remain blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider/model calls remain blocked.",
      "Deploy, release, export, and package actions remain blocked.",
      "Provider spend remains blocked.",
    ],
    disabledReason:
      "P112.4 previews queue admission candidates only. It cannot write queue records, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: lane.ownerCapability || queueRecord.ownerCapability,
    evidenceRefs: [
      "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md",
      "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
    ],
    auditRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic queue admission preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    queueWriteAllowed: false,
    localCrudAllowed: false,
    dbWriteAllowed: false,
    sqliteWriteAllowed: false,
    hostedDbMutationAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeAdmissionAllowed: false,
    runtimeTransitionAllowed: false,
    projectCreationAllowed: false,
    projectMutationAllowed: false,
    deployAllowed: false,
    releaseAllowed: false,
    exportAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

function buildPreviewQueueSections(queueRows = []) {
  return [
    {
      sectionHandle: "queue-candidates",
      displayLabel: "Queue candidates",
      candidateCount: queueRows.length,
      blockedCount: queueRows.length,
      nextAction: "Show these candidates in P112.5 without write, dispatch, execution, provider, project, or deploy controls.",
      disabledReason: "This section is read-only queue admission preview data.",
    },
    {
      sectionHandle: "approval-gates",
      displayLabel: "Admission gates",
      candidateCount: queueRows.length,
      blockedCount: queueRows.length,
      nextAction: "Keep operator approval, rollback, audit, validation, sqlite-live, and local write evidence separate from the preview.",
      disabledReason: "Preview data cannot satisfy or bypass local CRUD admission gates.",
    },
    {
      sectionHandle: "blocked-authority",
      displayLabel: "Blocked authority",
      candidateCount: queueRows.length,
      blockedCount: queueRows.length,
      nextAction: "Keep runtime authority blocked until a later explicitly scoped phase changes the contract.",
      disabledReason: "Provider/model calls, dispatch, execution, project mutation, hosted DB writes, deploy, release, export, package, network calls, and spend are blocked.",
    },
  ];
}

export function buildSafeAgentWorkQueueDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const queueKey = input.queueKey || "founder-agent-work-queue";
  const queueItemId = safeId("p1123-queue-item", queueKey);
  const workOrder = sourceWorkOrder(input);
  const workOrderId = input.workOrderId || workOrder.workOrderId || safeId("p1123-work-order", queueKey);

  switch (entityName) {
    case "founder_agent_work_queue_items":
      return {
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder agent work queue item",
        queueLane: input.queueLane || workOrder.proposedAgent || "Product Strategy",
        queueState: input.queueState || "queued_locally_after_operator_gate",
        queueSummary: input.queueSummary || "Display-safe founder agent work queue admission summary.",
        priorityLabel: input.priorityLabel || "normal",
        nextAction: input.nextAction || "Review queue admission preview before any future dispatch consideration.",
        disabledReason: "P112.3 records local queue metadata only; dispatch and execution remain blocked.",
        ownerCapability: input.ownerCapability || "NEXUS Founder Agent Work Queue DB",
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        dispatchAllowed: false,
        executionAllowed: false,
        workerExecutionAllowed: false,
        runtimeAdmissionAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1123-founder-live-agent-work-queue-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_agent_work_queue_events":
      return {
        queueEventId: safeId("p1123-queue-event", input.eventKey || queueKey),
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Agent Work Queue DB",
        eventSummary: input.eventSummary || "Governed local queue CRUD event recorded without dispatch or execution authority.",
        rollbackAvailable: true,
        dispatchAllowed: false,
        executionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p1123-founder-live-agent-work-queue-crud-model-report.md"],
        createdAt: timestamp,
      };
    case "founder_agent_work_queue_evidence_refs":
      return {
        queueEvidenceRefId: safeId("p1123-queue-evidence", input.evidenceKey || queueKey),
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P112.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P112.3 founder agent work queue CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `agent-work-queue-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Agent Work Queue DB",
    requestedOperation: "create_or_update_local_founder_agent_work_queue_record",
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
      "npm run check:p1123-founder-live-agent-work-queue-crud-model",
      "npm run check:p1122-founder-live-agent-work-queue-schema",
    ],
    evidenceRefs: ["reports/p1123-founder-live-agent-work-queue-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedAgentWorkQueueDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedQueueEntity(entity)) {
    return blockedResult(request, "Entity is outside the P112.3 founder agent work queue CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P112.3.", ["Delete is outside the P112.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P112.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P112.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P112.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE,
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

    const record = input.record || buildSafeAgentWorkQueueDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE,
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
      return blockedResult(request, "Operation is outside the P112.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE,
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
    return blockedResult(request, "P112.3 local founder agent work queue CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveAgentWorkQueueAdmissionContract(input = {}) {
  const requests = P112_AGENT_WORK_QUEUE_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE,
    mode: "governed-founder-agent-work-queue-db-crud",
    source: "live-ready/founderLiveAgentWorkQueueAdmission.js",
    summary: "Founder agent work queue admission is modeled for governed local SQLite CRUD admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_agent_work_queue_db_crud_ready_for_approved_local_admission"
        : "founder_agent_work_queue_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-agent-work-queue",
      dbMode: config.mode,
      queueItem: buildSafeAgentWorkQueueDbRecord("founder_agent_work_queue_items", input),
      queueEvents: [buildSafeAgentWorkQueueDbRecord("founder_agent_work_queue_events", input)],
      evidenceRefs: [buildSafeAgentWorkQueueDbRecord("founder_agent_work_queue_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P112.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedAgentWorkQueueDbCrudRequest for approved local queue records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local queue CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P112.3 local CRUD admission.`),
      disabledReason:
        "P112.3 only admits governed local SQLite CRUD for founder agent work queue OS records. Hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Agent Work Queue DB CRUD",
      auditRefs: ["reports/p1123-founder-live-agent-work-queue-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
      "contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json",
    ],
    warnings: [
      "P112.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, admit runtime execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveAgentWorkQueueAdmissionContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE) errors.push("phase must be P112.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "queueItem", "queueEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P112_AGENT_WORK_QUEUE_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder agent work queue DB entities");
  for (const entity of P112_AGENT_WORK_QUEUE_DB_ENTITIES) {
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder agent work queue CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Founder agent work queue CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}

export function buildFounderLiveAgentWorkQueueAdmissionPreview(input = {}) {
  const contractEnvelope = input.contractEnvelope || buildFounderLiveAgentWorkQueueAdmissionContract(input);
  const workOrder = sourceWorkOrderSummary(input);
  const queueRows = previewLanes(input).map((lane, index) => buildPreviewQueueRow(lane, index, input));
  const queueSections = buildPreviewQueueSections(queueRows);
  const previewReady = queueRows.length > 0;

  return createPassResult({
    phase: P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_PHASE,
    mode: "founder-live-agent-work-queue-admission-preview",
    source: "live-ready/founderLiveAgentWorkQueueAdmission.js",
    summary: "Founder live agent work queue admission preview is assembled locally from display-safe work order context; queue writes and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED
        : P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES.NEEDS_WORK_ORDER_CONTEXT,
      sourceContractPhase: contractEnvelope.phase,
      sourceContractState: contractEnvelope.data?.currentState || "",
      previewMode: "local-only-dry-run",
      sourceWorkOrderSummary: workOrder,
      queueAdmissionSummary: {
        previewReady,
        candidateCount: queueRows.length,
        blockedCandidateCount: queueRows.length,
        writableCandidateCount: 0,
        persistedCandidateCount: 0,
        dispatchableCandidateCount: 0,
        executableCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      queueSections,
      queueRows,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: previewReady
        ? "Render P112.5 Command Center queue admission preview on non-chat founder pages without write or execution controls."
        : "Complete display-safe founder work order context before queue admission preview assembly.",
      blockers: [
        "Queue admission preview is local and read-only.",
        "Local queue writes require explicit operator approval gates in a separate CRUD request.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project creation and mutation remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Deploy, release, export, and package actions remain blocked.",
        "Network calls and provider spend remain blocked.",
      ],
      disabledReason:
        "P112.4 is a local queue admission preview only. It does not write queue records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Agent Work Queue Admission Preview",
      evidenceRefs: [
        "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md",
        "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
      ],
      auditRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic queue admission preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      queueWriteAllowed: false,
      localCrudAllowed: false,
      dbWriteAllowed: false,
      sqliteWriteAllowed: false,
      hostedDbMutationAllowed: false,
      runtimeAdmissionAllowed: false,
      runtimeTransitionAllowed: false,
      executionAllowed: false,
      dispatchAllowed: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      projectCreationAllowed: false,
      projectMutationAllowed: false,
      deployAllowed: false,
      releaseAllowed: false,
      exportAllowed: false,
      packageAllowed: false,
      spendAllowed: false,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md",
      "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
      "contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json",
    ],
    warnings: [
      "P112.4 does not write queue records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveAgentWorkQueueAdmissionPreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_PHASE) errors.push("phase must be P112.4");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceContractPhase",
    "sourceContractState",
    "previewMode",
    "sourceWorkOrderSummary",
    "queueAdmissionSummary",
    "queueSections",
    "queueRows",
    "forbiddenOperations",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "auditRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.previewMode !== "local-only-dry-run") errors.push("previewMode must be local-only-dry-run");
  if (!Array.isArray(data.queueRows) || data.queueRows.length < 3) errors.push("queueRows must include founder agent queue candidates");
  if (!Array.isArray(data.queueSections) || data.queueSections.length < 3) errors.push("queueSections must describe candidate, gate, and blocked authority groups");
  for (const countField of [
    "writableCandidateCount",
    "persistedCandidateCount",
    "dispatchableCandidateCount",
    "executableCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (data.queueAdmissionSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of [
    "queueWriteAllowed",
    "localCrudAllowed",
    "dbWriteAllowed",
    "sqliteWriteAllowed",
    "hostedDbMutationAllowed",
    "runtimeAdmissionAllowed",
    "runtimeTransitionAllowed",
    "executionAllowed",
    "dispatchAllowed",
    "workerExecutionAllowed",
    "toolExecutionAllowed",
    "projectCreationAllowed",
    "projectMutationAllowed",
    "deployAllowed",
    "releaseAllowed",
    "exportAllowed",
    "packageAllowed",
    "spendAllowed",
  ]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.queueRows || []) {
    for (const field of ["displayHandle", "displayLabel", "sourceWorkOrderLabel", "proposedAgentLane", "proposedOutcome", "queuePosition", "queueState", "previewMode", "queueSummary", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.previewMode !== "local-only-dry-run") errors.push(`${row.displayLabel}.previewMode must be local-only-dry-run`);
    for (const flag of [
      "queueWriteAllowed",
      "localCrudAllowed",
      "dbWriteAllowed",
      "sqliteWriteAllowed",
      "hostedDbMutationAllowed",
      "dispatchAllowed",
      "executionAllowed",
      "workerExecutionAllowed",
      "toolExecutionAllowed",
      "runtimeAdmissionAllowed",
      "projectCreationAllowed",
      "projectMutationAllowed",
      "deployAllowed",
      "releaseAllowed",
      "exportAllowed",
      "packageAllowed",
      "spendAllowed",
    ]) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("queue admission preview must not expose raw private IDs");
  if (/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(serialized)) errors.push("queue admission preview must not expose raw queue record keys or DB table names");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(serialized)) errors.push("queue admission preview must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("queue admission preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
