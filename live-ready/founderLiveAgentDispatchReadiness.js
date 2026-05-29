import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeAgentWorkAssignmentDbRecord } from "./founderLiveAgentWorkAssignmentReadiness.js";

export const P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE = "P114.3";
export const P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PREVIEW_PHASE = "P114.4";

export const P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES = Object.freeze({
  LOCAL_PREVIEW_READY_EXECUTION_BLOCKED: "founder_agent_dispatch_readiness_preview_ready_execution_blocked",
  NEEDS_ASSIGNMENT_CONTEXT: "founder_agent_dispatch_readiness_preview_needs_assignment_context",
});

export const P114_AGENT_DISPATCH_DB_ENTITIES = Object.freeze([
  "founder_agent_dispatch_readiness_items",
  "founder_agent_dispatch_readiness_events",
  "founder_agent_dispatch_readiness_evidence_refs",
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

function safeSlug(value = "agent-dispatch-readiness") {
  return String(value || "agent-dispatch-readiness")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "agent-dispatch-readiness";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedDispatchEntity(entityName = "") {
  return P114_AGENT_DISPATCH_DB_ENTITIES.includes(entityName);
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
    phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
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

function dispatchKey(input = {}) {
  return input.dispatchKey || input.assignmentKey || "founder-agent-dispatch-readiness";
}

function sourceAssignmentRecord(input = {}) {
  return input.assignmentRecord || buildSafeAgentWorkAssignmentDbRecord("founder_agent_work_assignments", input);
}

function sourceAssignmentSummary(input = {}) {
  const assignmentRecord = sourceAssignmentRecord(input);
  return {
    publicLabel: assignmentRecord.publicLabel || "Founder agent work assignment readiness item",
    assignmentLane: assignmentRecord.assignmentLane || "Founder Strategy",
    assignmentState: assignmentRecord.assignmentState || "assignment ready after operator gate",
    assignmentSummary: assignmentRecord.assignmentSummary || "Display-safe founder agent work assignment readiness summary.",
    assignedAgent: assignmentRecord.assignedAgent || "NEXUS Founder Strategy Agent",
    nextAction: assignmentRecord.nextAction || "Review dispatch readiness preview before any future live dispatch consideration.",
    ownerCapability: assignmentRecord.ownerCapability || "NEXUS Founder Agent Work Assignment DB",
  };
}

function dispatchPreviewLanes(input = {}) {
  return input.previewLanes || [
    {
      lane: "Founder Strategy Dispatch",
      displayLabel: "Founder strategy dispatch candidate",
      proposedOutcome: "Prepare the founder strategy agent lane to review feasibility, customer pain, value promise, and PRD gaps.",
      ownerCapability: "NEXUS Founder Strategy Agent",
    },
    {
      lane: "Product Architecture Dispatch",
      displayLabel: "Product architecture dispatch candidate",
      proposedOutcome: "Prepare the product architecture lane to map app scope, data boundaries, platform constraints, and build risks.",
      ownerCapability: "NEXUS Product Architecture Agent",
    },
    {
      lane: "Launch Operations Dispatch",
      displayLabel: "Launch operations dispatch candidate",
      proposedOutcome: "Prepare the launch operations lane to plan validation experiments, pricing questions, release blockers, and go-to-market needs.",
      ownerCapability: "NEXUS Launch Operations Agent",
    },
  ];
}

function buildPreviewDispatchRow(lane, index, input = {}) {
  const assignmentSummary = sourceAssignmentSummary(input);
  const dispatchRecord = buildSafeAgentDispatchDbRecord("founder_agent_dispatch_readiness_items", {
    ...input,
    dispatchLane: lane.lane,
    publicLabel: lane.displayLabel,
    dispatchSummary: lane.proposedOutcome,
    assignedAgent: lane.ownerCapability,
    ownerCapability: lane.ownerCapability,
  });

  return {
    displayHandle: `dispatch-preview-${index + 1}-${safeSlug(lane.lane)}`,
    displayLabel: lane.displayLabel,
    sourceAssignmentLabel: assignmentSummary.publicLabel,
    sourceAssignmentLane: assignmentSummary.assignmentLane,
    sourceAssignmentState: assignmentSummary.assignmentState,
    proposedDispatchLane: lane.lane,
    proposedOutcome: lane.proposedOutcome || dispatchRecord.dispatchSummary,
    dispatchPosition: index + 1,
    dispatchState: P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED,
    previewMode: "local-only-dry-run",
    localPreviewReady: true,
    dispatchSummary: lane.proposedOutcome || dispatchRecord.dispatchSummary,
    nextAction: "Review this local dispatch candidate in Command Center before any later explicitly approved dispatch phase.",
    blockers: [
      "Dispatch readiness preview is local and read-only.",
      "Local dispatch writes require a separate approved CRUD request.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project creation and mutation remain blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider/model calls remain blocked.",
      "Deploy, release, export, and package actions remain blocked.",
      "Provider spend remains blocked.",
    ],
    disabledReason:
      "P114.4 previews dispatch readiness candidates only. It cannot write dispatch records, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: lane.ownerCapability || dispatchRecord.ownerCapability,
    evidenceRefs: [
      "reports/p1144-founder-live-agent-dispatch-readiness-report.md",
      "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
    ],
    auditRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic dispatch readiness preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    dispatchWriteAllowed: false,
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

function buildPreviewDispatchSections(dispatchRows = []) {
  return [
    {
      sectionHandle: "dispatch-candidates",
      displayLabel: "Dispatch candidates",
      candidateCount: dispatchRows.length,
      blockedCount: dispatchRows.length,
      nextAction: "Show these candidates in P114.5 without write, dispatch, execution, provider, project, or deploy controls.",
      disabledReason: "This section is read-only dispatch readiness preview data.",
    },
    {
      sectionHandle: "approval-gates",
      displayLabel: "Dispatch gates",
      candidateCount: dispatchRows.length,
      blockedCount: dispatchRows.length,
      nextAction: "Keep operator approval, rollback, audit, validation, sqlite-live, and local write evidence separate from the preview.",
      disabledReason: "Preview data cannot satisfy or bypass local CRUD or dispatch gates.",
    },
    {
      sectionHandle: "blocked-authority",
      displayLabel: "Blocked authority",
      candidateCount: dispatchRows.length,
      blockedCount: dispatchRows.length,
      nextAction: "Keep runtime authority blocked until a later explicitly scoped phase changes the contract.",
      disabledReason: "Provider/model calls, dispatch, execution, project mutation, hosted DB writes, deploy, release, export, package, network calls, and spend are blocked.",
    },
  ];
}

export function buildSafeAgentDispatchDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const key = dispatchKey(input);
  const assignmentRecord = sourceAssignmentRecord(input);
  const dispatchReadinessId = input.dispatchReadinessId || safeId("p1143-dispatch", key);
  const assignmentId = input.assignmentId || assignmentRecord.assignmentId || safeId("p1143-assignment", key);
  const queueItemId = input.queueItemId || assignmentRecord.queueItemId || safeId("p1143-queue-item", key);
  const workOrderId = input.workOrderId || assignmentRecord.workOrderId || safeId("p1143-work-order", key);

  switch (entityName) {
    case "founder_agent_dispatch_readiness_items":
      return {
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder agent dispatch readiness item",
        dispatchLane: input.dispatchLane || assignmentRecord.assignmentLane || "Product Strategy",
        dispatchState: input.dispatchState || "dispatch_ready_after_operator_gate",
        dispatchSummary: input.dispatchSummary || "Display-safe founder agent dispatch readiness summary.",
        assignedAgent: input.assignedAgent || assignmentRecord.assignedAgent || "NEXUS Founder Strategy Agent",
        dispatchTarget: input.dispatchTarget || "Local governed dispatch readiness preview",
        ownerCapability: input.ownerCapability || "NEXUS Founder Agent Dispatch Readiness DB",
        nextAction: input.nextAction || "Review dispatch readiness before any future live dispatch consideration.",
        disabledReason: "P114.3 records local dispatch metadata only; agent dispatch and execution remain blocked.",
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
        evidenceRefs: ["reports/p1143-founder-live-agent-dispatch-readiness-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_agent_dispatch_readiness_events":
      return {
        dispatchEventId: safeId("p1143-dispatch-event", input.eventKey || key),
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Founder Agent Dispatch Readiness DB",
        eventSummary: input.eventSummary || "Governed local dispatch CRUD event recorded without dispatch or execution authority.",
        rollbackAvailable: true,
        dispatchAllowed: false,
        executionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p1143-founder-live-agent-dispatch-readiness-report.md"],
        createdAt: timestamp,
      };
    case "founder_agent_dispatch_readiness_evidence_refs":
      return {
        dispatchEvidenceRefId: safeId("p1143-dispatch-evidence", input.evidenceKey || key),
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P114.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P114.3 founder agent dispatch CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `agent-dispatch-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Agent Dispatch Readiness DB",
    requestedOperation: "create_or_update_local_founder_agent_dispatch_readiness_record",
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
      "npm run check:p1143-founder-live-agent-dispatch-readiness",
      "npm run check:p1142-founder-live-agent-dispatch-readiness",
    ],
    evidenceRefs: ["reports/p1143-founder-live-agent-dispatch-readiness-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedAgentDispatchDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedDispatchEntity(entity)) {
    return blockedResult(request, "Entity is outside the P114.3 founder agent dispatch CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P114.3.", ["Delete is outside the P114.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P114.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P114.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P114.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
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

    const record = input.record || buildSafeAgentDispatchDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
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
      return blockedResult(request, "Operation is outside the P114.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
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
    return blockedResult(request, "P114.3 local founder agent dispatch CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveAgentDispatchReadinessContract(input = {}) {
  const requests = P114_AGENT_DISPATCH_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
    mode: "governed-founder-agent-dispatch-db-crud",
    source: "live-ready/founderLiveAgentDispatchReadiness.js",
    summary: "Founder agent dispatch readiness is modeled for governed local SQLite CRUD admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_agent_dispatch_readiness_db_crud_ready_for_approved_local_admission"
        : "founder_agent_dispatch_readiness_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-agent-dispatch-readiness",
      dbMode: config.mode,
      sourceAssignmentItem: sourceAssignmentRecord(input),
      dispatchItem: buildSafeAgentDispatchDbRecord("founder_agent_dispatch_readiness_items", input),
      dispatchEvents: [buildSafeAgentDispatchDbRecord("founder_agent_dispatch_readiness_events", input)],
      evidenceRefs: [buildSafeAgentDispatchDbRecord("founder_agent_dispatch_readiness_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P114.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedAgentDispatchDbCrudRequest for approved local dispatch readiness records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local dispatch CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P114.3 local CRUD admission.`),
      disabledReason:
        "P114.3 only admits governed local SQLite CRUD for founder agent dispatch readiness OS records. Hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Agent Dispatch Readiness DB CRUD",
      auditRefs: ["reports/p1143-founder-live-agent-dispatch-readiness-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
      "contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json",
    ],
    warnings: [
      "P114.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, admit runtime execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveAgentDispatchReadinessContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE) errors.push("phase must be P114.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceAssignmentItem", "dispatchItem", "dispatchEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P114_AGENT_DISPATCH_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder agent dispatch DB entities");
  for (const entity of P114_AGENT_DISPATCH_DB_ENTITIES) {
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Founder agent dispatch CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Founder agent dispatch CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}

export function buildAgentDispatchReadinessViewModel(input = {}) {
  const contractEnvelope = input.contractEnvelope || buildFounderLiveAgentDispatchReadinessContract(input);
  const assignmentSummary = sourceAssignmentSummary(input);
  const dispatchRows = dispatchPreviewLanes(input).map((lane, index) => buildPreviewDispatchRow(lane, index, input));
  const dispatchSections = buildPreviewDispatchSections(dispatchRows);
  const previewReady = dispatchRows.length > 0;

  return createPassResult({
    phase: P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PREVIEW_PHASE,
    mode: "founder-live-agent-dispatch-readiness-preview",
    source: "live-ready/founderLiveAgentDispatchReadiness.js",
    summary: "Founder live agent dispatch readiness preview is assembled locally from display-safe assignment context; dispatch writes and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES.LOCAL_PREVIEW_READY_EXECUTION_BLOCKED
        : P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES.NEEDS_ASSIGNMENT_CONTEXT,
      sourceContractPhase: contractEnvelope.phase,
      sourceContractState: contractEnvelope.data?.currentState || "",
      previewMode: "local-only-dry-run",
      sourceAssignmentSummary: assignmentSummary,
      dispatchReadinessSummary: {
        previewReady,
        candidateCount: dispatchRows.length,
        blockedCandidateCount: dispatchRows.length,
        writableCandidateCount: 0,
        persistedCandidateCount: 0,
        dispatchableCandidateCount: 0,
        executableCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      dispatchSections,
      dispatchRows,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: previewReady
        ? "Render P114.5 Command Center dispatch readiness preview on non-chat founder pages without write or execution controls."
        : "Complete display-safe founder assignment context before dispatch readiness preview assembly.",
      blockers: [
        "Dispatch readiness preview is local and read-only.",
        "Local dispatch writes require explicit operator approval gates in a separate CRUD request.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project creation and mutation remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Deploy, release, export, and package actions remain blocked.",
        "Network calls and provider spend remain blocked.",
      ],
      disabledReason:
        "P114.4 is a local dispatch readiness preview only. It does not write dispatch records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Agent Dispatch Readiness Preview",
      evidenceRefs: [
        "reports/p1144-founder-live-agent-dispatch-readiness-report.md",
        "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
      ],
      auditRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic dispatch readiness preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      dispatchWriteAllowed: false,
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
      "reports/p1144-founder-live-agent-dispatch-readiness-report.md",
      "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
      "contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json",
    ],
    warnings: [
      "P114.4 does not write dispatch records, unlock execution, admit runtime execution, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateAgentDispatchReadinessViewModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PREVIEW_PHASE) errors.push("phase must be P114.4");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceContractPhase",
    "sourceContractState",
    "previewMode",
    "sourceAssignmentSummary",
    "dispatchReadinessSummary",
    "dispatchSections",
    "dispatchRows",
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
  if (!Array.isArray(data.dispatchRows) || data.dispatchRows.length < 3) errors.push("dispatchRows must include founder agent dispatch candidates");
  if (!Array.isArray(data.dispatchSections) || data.dispatchSections.length < 3) errors.push("dispatchSections must describe candidate, gate, and blocked authority groups");
  for (const countField of [
    "writableCandidateCount",
    "persistedCandidateCount",
    "dispatchableCandidateCount",
    "executableCandidateCount",
    "projectMutationCandidateCount",
    "hostedDbMutationCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (data.dispatchReadinessSummary?.[countField] !== 0) errors.push(`${countField} must be 0`);
  }
  for (const flag of [
    "dispatchWriteAllowed",
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
  for (const row of data.dispatchRows || []) {
    for (const field of ["displayHandle", "displayLabel", "sourceAssignmentLabel", "proposedDispatchLane", "proposedOutcome", "dispatchPosition", "dispatchState", "previewMode", "dispatchSummary", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    if (row.previewMode !== "local-only-dry-run") errors.push(`${row.displayLabel}.previewMode must be local-only-dry-run`);
    for (const flag of [
      "dispatchWriteAllowed",
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("dispatch readiness preview must not expose raw private IDs");
  if (/(dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_dispatch_readiness_items|founder_agent_dispatch_readiness_events|founder_agent_dispatch_readiness_evidence_refs)/.test(serialized)) errors.push("dispatch readiness preview must not expose raw dispatch record keys or DB table names");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(serialized)) errors.push("dispatch readiness preview must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("dispatch readiness preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
