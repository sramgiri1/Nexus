import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeAgentWorkQueueDbRecord } from "./founderLiveAgentWorkQueueAdmission.js";

export const P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE = "P113.3";
export const P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE = "P113.4";

export const P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES = Object.freeze({
  LOCAL_PREVIEW_READY_EXECUTION_BLOCKED: "founder_agent_work_assignment_readiness_preview_ready_execution_blocked",
  NEEDS_QUEUE_CONTEXT: "founder_agent_work_assignment_readiness_preview_needs_queue_context",
});

export const P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES = Object.freeze([
  "founder_agent_work_assignments",
  "founder_agent_work_assignment_events",
  "founder_agent_work_assignment_evidence_refs",
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

function safeSlug(value = "agent-work-assignment") {
  return String(value || "agent-work-assignment")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "agent-work-assignment";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedAssignmentEntity(entityName = "") {
  return P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES.includes(entityName);
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
    phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE,
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

function sourceQueueRecord(input = {}) {
  return input.queueRecord || buildSafeAgentWorkQueueDbRecord("founder_agent_work_queue_items", input);
}

function sourceQueueSummary(input = {}) {
  const queueRecord = sourceQueueRecord(input);
  return {
    publicLabel: queueRecord.publicLabel || "Founder agent work queue item",
    queueLane: queueRecord.queueLane || "Product Strategy",
    queueState: queueRecord.queueState || "queued locally after operator gate",
    queueSummary: queueRecord.queueSummary || "Display-safe founder agent work queue admission summary.",
    nextAction: queueRecord.nextAction || "Review assignment readiness preview before any future dispatch consideration.",
    ownerCapability: queueRecord.ownerCapability || "NEXUS Founder Agent Work Queue DB",
  };
}

function assignmentKey(input = {}) {
  return input.assignmentKey || input.queueKey || "founder-agent-work-assignment";
}

function previewLanes(input = {}) {
  return input.previewLanes || [
    {
      lane: "Founder Strategy",
      displayLabel: "Founder strategy assignment",
      proposedOutcome: "Clarify business feasibility, customer pain, value promise, and PRD readiness.",
      ownerCapability: "NEXUS Founder Strategy Agent",
    },
    {
      lane: "Product Architecture",
      displayLabel: "Product architecture assignment",
      proposedOutcome: "Map product scope, data boundaries, platform constraints, and build risks.",
      ownerCapability: "NEXUS Product Architecture Agent",
    },
    {
      lane: "Launch Operations",
      displayLabel: "Launch operations assignment",
      proposedOutcome: "Plan validation experiments, go-to-market blockers, pricing questions, and launch readiness.",
      ownerCapability: "NEXUS Launch Operations Agent",
    },
  ];
}

function buildPreviewAssignmentRow(lane, index, input = {}) {
  const queueSummary = sourceQueueSummary(input);
  const assignmentRecord = buildSafeAgentWorkAssignmentDbRecord("founder_agent_work_assignments", {
    ...input,
    assignmentLane: lane.lane,
    publicLabel: lane.displayLabel,
    assignmentSummary: lane.proposedOutcome,
    assignedAgent: lane.ownerCapability,
    ownerCapability: lane.ownerCapability,
  });

  return {
    displayHandle: `assignment-preview-${index + 1}-${safeSlug(lane.lane)}`,
    displayLabel: lane.displayLabel,
    sourceQueueLabel: queueSummary.publicLabel,
    sourceQueueLane: queueSummary.queueLane,
    sourceQueueState: queueSummary.queueState,
    proposedAgentLane: lane.lane,
    proposedOutcome: lane.proposedOutcome || assignmentRecord.assignmentSummary,
    assignmentPosition: index + 1,
    assignmentState: P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED,
    previewMode: "local-only-dry-run",
    localPreviewReady: true,
    assignmentSummary: lane.proposedOutcome || assignmentRecord.assignmentSummary,
    nextAction: "Review this local assignment candidate in Command Center before any later approved dispatch or execution phase.",
    blockers: [
      "Assignment readiness preview is local and read-only.",
      "Local assignment writes require a separate approved CRUD request.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project creation and mutation remain blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider/model calls remain blocked.",
      "Deploy, release, export, and package actions remain blocked.",
      "Provider spend remains blocked.",
    ],
    disabledReason:
      "P113.4 previews assignment readiness only. It cannot write assignment records, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: lane.ownerCapability || assignmentRecord.ownerCapability,
    evidenceRefs: [
      "reports/p1134-founder-live-agent-work-assignment-preview-report.md",
      "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
    ],
    auditRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic assignment readiness preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    assignmentWriteAllowed: false,
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

function buildPreviewAssignmentSections(assignmentRows = []) {
  return [
    {
      sectionHandle: "assignment-candidates",
      displayLabel: "Assignment candidates",
      candidateCount: assignmentRows.length,
      blockedCount: assignmentRows.length,
      nextAction: "Show these candidates in P113.5 without write, dispatch, execution, provider, project, or deploy controls.",
      disabledReason: "This section is read-only assignment readiness preview data.",
    },
    {
      sectionHandle: "approval-gates",
      displayLabel: "Assignment gates",
      candidateCount: assignmentRows.length,
      blockedCount: assignmentRows.length,
      nextAction: "Keep operator approval, rollback, audit, validation, sqlite-live, and local write evidence separate from the preview.",
      disabledReason: "Preview data cannot satisfy or bypass local CRUD or dispatch gates.",
    },
    {
      sectionHandle: "blocked-authority",
      displayLabel: "Blocked authority",
      candidateCount: assignmentRows.length,
      blockedCount: assignmentRows.length,
      nextAction: "Keep runtime authority blocked until a later explicitly scoped phase changes the contract.",
      disabledReason: "Provider/model calls, dispatch, execution, project mutation, hosted DB writes, deploy, release, export, package, network calls, and spend are blocked.",
    },
  ];
}

export function buildSafeAgentWorkAssignmentDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const key = assignmentKey(input);
  const queueRecord = sourceQueueRecord(input);
  const assignmentId = input.assignmentId || safeId("p1133-assignment", key);
  const queueItemId = input.queueItemId || queueRecord.queueItemId || safeId("p1133-queue-item", key);
  const workOrderId = input.workOrderId || queueRecord.workOrderId || safeId("p1133-work-order", key);

  switch (entityName) {
    case "founder_agent_work_assignments":
      return {
        assignmentId,
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder agent work assignment readiness item",
        assignmentLane: input.assignmentLane || queueRecord.queueLane || "Product Strategy",
        assignmentState: input.assignmentState || "assignment_ready_after_operator_gate",
        assignmentSummary: input.assignmentSummary || "Display-safe founder agent work assignment readiness summary.",
        assignedAgent: input.assignedAgent || queueRecord.queueLane || "Product Strategy",
        ownerCapability: input.ownerCapability || "NEXUS Founder Agent Work Assignment DB",
        nextAction: input.nextAction || "Review assignment readiness before any future dispatch consideration.",
        disabledReason: "P113.3 records local assignment metadata only; dispatch and execution remain blocked.",
        operatorApprovalRequired: true,
        operatorApproved: input.operatorApproved === true,
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        dispatchAllowed: false,
        executionAllowed: false,
        workerExecutionAllowed: false,
        runtimeAdmissionAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1133-founder-live-agent-work-assignment-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_agent_work_assignment_events":
      return {
        assignmentEventId: safeId("p1133-assignment-event", input.eventKey || key),
        assignmentId,
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Agent Work Assignment DB",
        eventSummary: input.eventSummary || "Governed local assignment CRUD event recorded without dispatch or execution authority.",
        rollbackAvailable: true,
        dispatchAllowed: false,
        executionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p1133-founder-live-agent-work-assignment-crud-model-report.md"],
        createdAt: timestamp,
      };
    case "founder_agent_work_assignment_evidence_refs":
      return {
        assignmentEvidenceRefId: safeId("p1133-assignment-evidence", input.evidenceKey || key),
        assignmentId,
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P113.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P113.3 founder agent work assignment CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `agent-work-assignment-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Agent Work Assignment DB",
    requestedOperation: "create_or_update_local_founder_agent_work_assignment_record",
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
      "npm run check:p1133-founder-live-agent-work-assignment-crud-model",
      "npm run check:p1132-founder-live-agent-work-assignment-schema",
    ],
    evidenceRefs: ["reports/p1133-founder-live-agent-work-assignment-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedAgentWorkAssignmentDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedAssignmentEntity(entity)) {
    return blockedResult(request, "Entity is outside the P113.3 founder agent work assignment CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P113.3.", ["Delete is outside the P113.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P113.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P113.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P113.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE,
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

    const record = input.record || buildSafeAgentWorkAssignmentDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE,
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
      return blockedResult(request, "Operation is outside the P113.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE,
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
    return blockedResult(request, "P113.3 local founder agent work assignment CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveAgentWorkAssignmentReadinessContract(input = {}) {
  const requests = P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE,
    mode: "governed-founder-agent-work-assignment-db-crud",
    source: "live-ready/founderLiveAgentWorkAssignmentReadiness.js",
    summary: "Founder agent work assignment readiness is modeled for governed local SQLite CRUD admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_agent_work_assignment_db_crud_ready_for_approved_local_admission"
        : "founder_agent_work_assignment_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-agent-work-assignment",
      dbMode: config.mode,
      sourceQueueItem: sourceQueueRecord(input),
      assignmentItem: buildSafeAgentWorkAssignmentDbRecord("founder_agent_work_assignments", input),
      assignmentEvents: [buildSafeAgentWorkAssignmentDbRecord("founder_agent_work_assignment_events", input)],
      evidenceRefs: [buildSafeAgentWorkAssignmentDbRecord("founder_agent_work_assignment_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P113.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedAgentWorkAssignmentDbCrudRequest for approved local assignment records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local assignment CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P113.3 local CRUD admission.`),
      disabledReason:
        "P113.3 only admits governed local SQLite CRUD for founder agent work assignment OS records. Hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Agent Work Assignment DB CRUD",
      auditRefs: ["reports/p1133-founder-live-agent-work-assignment-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
      "contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json",
    ],
    warnings: [
      "P113.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, admit runtime execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveAgentWorkAssignmentReadinessContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE) errors.push("phase must be P113.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceQueueItem", "assignmentItem", "assignmentEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder agent work assignment DB entities");
  for (const entity of P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES) {
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder agent work assignment CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Founder agent work assignment CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}

export function buildAgentWorkAssignmentReadinessViewModel(input = {}) {
  const contractEnvelope = input.contractEnvelope || buildFounderLiveAgentWorkAssignmentReadinessContract(input);
  const queueSummary = sourceQueueSummary(input);
  const assignmentRows = previewLanes(input).map((lane, index) => buildPreviewAssignmentRow(lane, index, input));
  const assignmentSections = buildPreviewAssignmentSections(assignmentRows);
  const previewReady = assignmentRows.length > 0;

  return createPassResult({
    phase: P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE,
    mode: "founder-live-agent-work-assignment-readiness-preview",
    source: "live-ready/founderLiveAgentWorkAssignmentReadiness.js",
    summary: "Founder live agent work assignment readiness preview is assembled locally from display-safe queue context; assignment writes and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED
        : P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES.NEEDS_QUEUE_CONTEXT,
      sourceContractPhase: contractEnvelope.phase,
      sourceContractState: contractEnvelope.data?.currentState || "",
      previewMode: "local-only-dry-run",
      sourceQueueSummary: queueSummary,
      assignmentReadinessSummary: {
        previewReady,
        candidateCount: assignmentRows.length,
        blockedCandidateCount: assignmentRows.length,
        writableCandidateCount: 0,
        persistedCandidateCount: 0,
        dispatchableCandidateCount: 0,
        executableCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      assignmentSections,
      assignmentRows,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: previewReady
        ? "Render P113.5 Command Center assignment readiness preview on non-chat founder pages without write or execution controls."
        : "Complete display-safe founder queue context before assignment readiness preview assembly.",
      blockers: [
        "Assignment readiness preview is local and read-only.",
        "Local assignment writes require explicit operator approval gates in a separate CRUD request.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project creation and mutation remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Deploy, release, export, and package actions remain blocked.",
        "Network calls and provider spend remain blocked.",
      ],
      disabledReason:
        "P113.4 is a local assignment readiness preview only. It does not write assignment records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Agent Work Assignment Readiness Preview",
      evidenceRefs: [
        "reports/p1134-founder-live-agent-work-assignment-preview-report.md",
        "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
      ],
      auditRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic assignment readiness preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      assignmentWriteAllowed: false,
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
      "reports/p1134-founder-live-agent-work-assignment-preview-report.md",
      "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
      "contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json",
    ],
    warnings: [
      "P113.4 does not write assignment records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateAgentWorkAssignmentReadinessViewModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE) errors.push("phase must be P113.4");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceContractPhase",
    "sourceContractState",
    "previewMode",
    "sourceQueueSummary",
    "assignmentReadinessSummary",
    "assignmentSections",
    "assignmentRows",
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
  if (!Array.isArray(data.assignmentRows) || data.assignmentRows.length < 3) errors.push("assignmentRows must include founder agent assignment candidates");
  if (!Array.isArray(data.assignmentSections) || data.assignmentSections.length < 3) errors.push("assignmentSections must describe candidate, gate, and blocked authority groups");
  for (const countField of [
    "writableCandidateCount",
    "persistedCandidateCount",
    "dispatchableCandidateCount",
    "executableCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (data.assignmentReadinessSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of [
    "assignmentWriteAllowed",
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
  for (const row of data.assignmentRows || []) {
    for (const field of ["displayHandle", "displayLabel", "sourceQueueLabel", "proposedAgentLane", "proposedOutcome", "assignmentPosition", "assignmentState", "previewMode", "assignmentSummary", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.previewMode !== "local-only-dry-run") errors.push(`${row.displayLabel}.previewMode must be local-only-dry-run`);
    for (const flag of [
      "assignmentWriteAllowed",
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("assignment readiness preview must not expose raw private IDs");
  if (/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(serialized)) errors.push("assignment readiness preview must not expose raw assignment record keys or DB table names");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(serialized)) errors.push("assignment readiness preview must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("assignment readiness preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
