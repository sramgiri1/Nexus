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
export const P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PREVIEW_PHASE = "P115.4";

export const P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES = Object.freeze({
  LOCAL_PREVIEW_READY_EXECUTION_BLOCKED: "founder_runtime_admission_readiness_preview_ready_execution_blocked",
  NEEDS_DISPATCH_CONTEXT: "founder_runtime_admission_readiness_preview_needs_dispatch_context",
});

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

function runtimeAdmissionPreviewLanes(input = {}) {
  return input.previewLanes || [
    {
      lane: "Founder Runtime Gate",
      displayLabel: "Founder runtime readiness gate",
      proposedOutcome: "Review whether the founder intent, PRD readiness, dispatch evidence, and local safety gates are complete enough for a later runtime admission request.",
      ownerCapability: "NEXUS Founder Runtime Admission Review",
    },
    {
      lane: "Product Scope Gate",
      displayLabel: "Product scope readiness gate",
      proposedOutcome: "Check product scope, data boundaries, acceptance criteria, and platform constraints before any later runtime handoff.",
      ownerCapability: "NEXUS Product Scope Review",
    },
    {
      lane: "Execution Boundary Gate",
      displayLabel: "Execution boundary readiness gate",
      proposedOutcome: "Confirm local-only execution boundaries, validation commands, rollback evidence, and blocked mutation authority before any later runtime transition.",
      ownerCapability: "NEXUS Execution Boundary Review",
    },
  ];
}

function buildPreviewAdmissionRow(lane, index, input = {}) {
  const dispatchSummary = sourceDispatchSummary(input);
  const admissionRecord = buildSafeRuntimeAdmissionDbRecord("founder_runtime_admission_readiness_items", {
    ...input,
    admissionLane: lane.lane,
    publicLabel: lane.displayLabel,
    admissionSummary: lane.proposedOutcome,
    ownerCapability: lane.ownerCapability,
  });

  return {
    displayHandle: `runtime-preview-${index + 1}-${safeSlug(lane.lane)}`,
    displayLabel: lane.displayLabel,
    sourceDispatchLabel: dispatchSummary.publicLabel,
    sourceDispatchLane: dispatchSummary.dispatchLane,
    sourceDispatchState: dispatchSummary.dispatchState,
    proposedAdmissionLane: lane.lane,
    proposedOutcome: lane.proposedOutcome || admissionRecord.admissionSummary,
    admissionPosition: index + 1,
    admissionState: P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED,
    previewMode: "local-only-dry-run",
    localPreviewReady: true,
    admissionSummary: lane.proposedOutcome || admissionRecord.admissionSummary,
    nextAction: "Review this local runtime admission readiness candidate before any later explicitly approved runtime phase.",
    blockers: [
      "Runtime admission readiness preview is local and read-only.",
      "Local readiness writes require a separate approved CRUD request.",
      "Runtime admission remains blocked.",
      "Execution unlock remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project creation and mutation remain blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider/model calls remain blocked.",
      "Deploy, release, export, and package actions remain blocked.",
      "Network calls and provider spend remain blocked.",
    ],
    disabledReason:
      "P115.4 previews runtime admission readiness candidates only. It cannot admit runtime work, unlock execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: lane.ownerCapability || admissionRecord.ownerCapability,
    evidenceRefs: [
      "reports/p1154-founder-live-runtime-admission-readiness-report.md",
      "reports/p1153-founder-live-runtime-admission-readiness-report.md",
    ],
    auditRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic runtime admission readiness preview only. No runtime admission, provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    localCrudAllowed: false,
    dbWriteAllowed: false,
    sqliteWriteAllowed: false,
    hostedDbMutationAllowed: false,
    runtimeAdmissionAllowed: false,
    runtimeTransitionAllowed: false,
    executionAllowed: false,
    executionUnlockAllowed: false,
    dispatchAllowed: false,
    agentDispatchAllowed: false,
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
  };
}

function buildPreviewAdmissionSections(admissionRows = []) {
  return [
    {
      sectionHandle: "runtime-readiness-candidates",
      displayLabel: "Runtime readiness candidates",
      candidateCount: admissionRows.length,
      blockedCount: admissionRows.length,
      nextAction: "Show these candidates in P115.5 without admission, execution, provider, project, or deploy controls.",
      disabledReason: "This section is read-only runtime admission readiness preview data.",
    },
    {
      sectionHandle: "approval-gates",
      displayLabel: "Runtime gates",
      candidateCount: admissionRows.length,
      blockedCount: admissionRows.length,
      nextAction: "Keep operator approval, rollback, audit, validation, sqlite-live, and local write evidence separate from the preview.",
      disabledReason: "Preview data cannot satisfy or bypass local CRUD or runtime admission gates.",
    },
    {
      sectionHandle: "blocked-authority",
      displayLabel: "Blocked authority",
      candidateCount: admissionRows.length,
      blockedCount: admissionRows.length,
      nextAction: "Keep runtime authority blocked until a later explicitly scoped phase changes the contract.",
      disabledReason: "Runtime admission, execution, provider/model calls, dispatch, project mutation, hosted DB writes, deploy, release, export, package, network calls, and spend are blocked.",
    },
  ];
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

export function buildRuntimeAdmissionReadinessViewModel(input = {}) {
  const contractEnvelope = input.contractEnvelope || buildFounderLiveRuntimeAdmissionReadinessContract(input);
  const dispatchSummary = sourceDispatchSummary(input);
  const admissionRows = runtimeAdmissionPreviewLanes(input).map((lane, index) => buildPreviewAdmissionRow(lane, index, input));
  const admissionSections = buildPreviewAdmissionSections(admissionRows);
  const previewReady = admissionRows.length > 0;

  return createPassResult({
    phase: P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PREVIEW_PHASE,
    mode: "founder-live-runtime-admission-readiness-preview",
    source: "live-ready/founderLiveRuntimeAdmissionReadiness.js",
    summary: "Founder live runtime admission readiness preview is assembled locally from display-safe dispatch context; runtime admission and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED
        : P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES.NEEDS_DISPATCH_CONTEXT,
      sourceContractPhase: contractEnvelope.phase,
      sourceContractState: contractEnvelope.data?.currentState || "",
      previewMode: "local-only-dry-run",
      sourceDispatchSummary: dispatchSummary,
      runtimeAdmissionReadinessSummary: {
        previewReady,
        candidateCount: admissionRows.length,
        blockedCandidateCount: admissionRows.length,
        writableCandidateCount: 0,
        persistedCandidateCount: 0,
        runtimeAdmissibleCandidateCount: 0,
        executableCandidateCount: 0,
        dispatchableCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      admissionSections,
      admissionRows,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: previewReady
        ? "Render P115.5 Command Center runtime admission readiness preview on non-chat founder pages without admission or execution controls."
        : "Complete display-safe dispatch readiness context before runtime admission readiness preview assembly.",
      blockers: [
        "Runtime admission readiness preview is local and read-only.",
        "Local readiness writes require explicit operator approval gates in a separate CRUD request.",
        "Runtime admission remains blocked.",
        "Execution unlock remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project creation and mutation remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Deploy, release, export, and package actions remain blocked.",
        "Network calls and provider spend remain blocked.",
      ],
      disabledReason:
        "P115.4 is a local runtime admission readiness preview only. It does not admit runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Runtime Admission Readiness Preview",
      evidenceRefs: [
        "reports/p1154-founder-live-runtime-admission-readiness-report.md",
        "reports/p1153-founder-live-runtime-admission-readiness-report.md",
      ],
      auditRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic runtime admission readiness preview only. No runtime admission, provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      localCrudAllowed: false,
      dbWriteAllowed: false,
      sqliteWriteAllowed: false,
      hostedDbMutationAllowed: false,
      runtimeAdmissionAllowed: false,
      runtimeTransitionAllowed: false,
      executionAllowed: false,
      executionUnlockAllowed: false,
      dispatchAllowed: false,
      agentDispatchAllowed: false,
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
      "reports/p1154-founder-live-runtime-admission-readiness-report.md",
      "reports/p1153-founder-live-runtime-admission-readiness-report.md",
      "contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json",
    ],
    warnings: [
      "P115.4 does not admit runtime work, unlock execution, call providers, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateRuntimeAdmissionReadinessViewModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PREVIEW_PHASE) errors.push("phase must be P115.4");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceContractPhase",
    "sourceContractState",
    "previewMode",
    "sourceDispatchSummary",
    "runtimeAdmissionReadinessSummary",
    "admissionSections",
    "admissionRows",
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
  if (!Array.isArray(data.admissionRows) || data.admissionRows.length < 3) errors.push("admissionRows must include runtime admission readiness candidates");
  if (!Array.isArray(data.admissionSections) || data.admissionSections.length < 3) errors.push("admissionSections must describe candidate, gate, and blocked authority groups");
  for (const countField of [
    "writableCandidateCount",
    "persistedCandidateCount",
    "runtimeAdmissibleCandidateCount",
    "executableCandidateCount",
    "dispatchableCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (data.runtimeAdmissionReadinessSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of [
    "localCrudAllowed",
    "dbWriteAllowed",
    "sqliteWriteAllowed",
    "hostedDbMutationAllowed",
    "runtimeAdmissionAllowed",
    "runtimeTransitionAllowed",
    "executionAllowed",
    "executionUnlockAllowed",
    "dispatchAllowed",
    "agentDispatchAllowed",
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
  for (const row of data.admissionRows || []) {
    for (const field of ["displayHandle", "displayLabel", "sourceDispatchLabel", "proposedAdmissionLane", "proposedOutcome", "admissionPosition", "admissionState", "previewMode", "admissionSummary", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.previewMode !== "local-only-dry-run") errors.push(`${row.displayLabel}.previewMode must be local-only-dry-run`);
    for (const flag of [
      "localCrudAllowed",
      "dbWriteAllowed",
      "sqliteWriteAllowed",
      "hostedDbMutationAllowed",
      "runtimeAdmissionAllowed",
      "runtimeTransitionAllowed",
      "executionAllowed",
      "executionUnlockAllowed",
      "dispatchAllowed",
      "agentDispatchAllowed",
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
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("runtime admission readiness preview must not expose raw private IDs");
  if (/(runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(serialized)) errors.push("runtime admission readiness preview must not expose raw record keys or DB table names");
  if (/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(serialized)) errors.push("runtime admission readiness preview must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("runtime admission readiness preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
