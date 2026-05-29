import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildSafeRuntimeExecutionDbRecord } from "./founderLiveRuntimeExecutionReadiness.js";

export const P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE = "P117.3";
export const P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE = "P117.4";

export const P117_APPROVAL_GATE_PREVIEW_STATES = Object.freeze({
  LOCAL_PREVIEW_READY_APPROVAL_CAPTURE_BLOCKED: "founder_runtime_execution_approval_preview_ready_capture_blocked",
  NEEDS_APPROVAL_EVIDENCE_CONTEXT: "founder_runtime_execution_approval_preview_needs_evidence_context",
});

export const P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES = Object.freeze([
  "founder_runtime_execution_approval_evidence_items",
  "founder_runtime_execution_approval_events",
  "founder_runtime_execution_approval_evidence_refs",
]);

const REVIEW_REQUIREMENTS = Object.freeze([
  "operatorReviewAccepted",
  "rollbackAccepted",
  "auditAccepted",
  "validationCommandsAccepted",
  "sqliteLiveMode",
  "sqliteWritesEnabled",
]);

const BLOCKED_AUTHORITY_FLAGS = Object.freeze([
  "approvalCaptureAllowed",
  "approvalPersistenceAllowed",
  "approvalDecisionRecorded",
  "runtimeApprovalAllowed",
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
  "approve",
  "reject",
  "raw SQL",
  "hosted DB mutation",
  "approval capture",
  "approval persistence",
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

function blockedAuthorityFlags() {
  return Object.fromEntries(BLOCKED_AUTHORITY_FLAGS.map((flag) => [flag, false]));
}

function safeSlug(value = "runtime-execution-approval-gate") {
  return String(value || "runtime-execution-approval-gate")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "runtime-execution-approval-gate";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedApprovalEvidenceEntity(entityName = "") {
  return P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES.includes(entityName);
}

function primaryKeyForEntity(entityName) {
  return describeSqliteCrudEntity(entityName).primaryKey;
}

function reviewReady(input = {}) {
  return input.operatorReviewAccepted === true
    && input.rollbackAccepted === true
    && input.auditAccepted === true
    && input.validationCommandsAccepted === true;
}

function reviewEvidence(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  return {
    operatorReviewAccepted: input.operatorReviewAccepted === true,
    rollbackAccepted: input.rollbackAccepted === true,
    auditAccepted: input.auditAccepted === true,
    validationCommandsAccepted: input.validationCommandsAccepted === true,
    sqliteLiveMode: config.sqliteLiveAllowed === true,
    sqliteWritesEnabled: config.dbWritesEnabled === true,
  };
}

function missingEvidence(input = {}) {
  const evidence = reviewEvidence(input);
  return REVIEW_REQUIREMENTS.filter((requirement) => evidence[requirement] !== true);
}

function blockedResult(request, disabledReason, errors = []) {
  return {
    ok: errors.length === 0,
    phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
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
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    approvalDecisionRecorded: false,
    runtimeExecutionAllowed: false,
    executionAllowed: false,
    executionUnlockAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedAuthorityFlags(),
  };
}

function evidenceKey(input = {}) {
  return input.evidenceKey || input.executionKey || "founder-runtime-execution-approval-gate";
}

function sourceExecutionRecord(input = {}) {
  return input.executionRecord || buildSafeRuntimeExecutionDbRecord("founder_runtime_execution_readiness_items", input);
}

function sourceExecutionSummary(input = {}) {
  const executionRecord = sourceExecutionRecord(input);
  return {
    publicLabel: executionRecord.publicLabel || "Founder runtime execution readiness item",
    executionLane: executionRecord.executionLane || "Founder Runtime Execution Readiness",
    executionState: executionRecord.executionState || "runtime execution readiness recorded locally",
    executionSummary: executionRecord.executionSummary || "Display-safe runtime execution readiness summary.",
    nextAction: executionRecord.nextAction || "Review approval evidence before any later explicit runtime execution phase.",
    ownerCapability: executionRecord.ownerCapability || "NEXUS Founder Runtime Execution Readiness DB",
  };
}

function approvalPreviewLanes(input = {}) {
  return input.previewLanes || [
    {
      lane: "Founder Intent Evidence",
      displayLabel: "Founder intent evidence",
      proposedOutcome: "Review whether the founder idea, PRD readiness, target customer, and business objective are sufficiently clear for later approval review.",
      ownerCapability: "NEXUS Founder Intent Review",
    },
    {
      lane: "Implementation Boundary Evidence",
      displayLabel: "Implementation boundary evidence",
      proposedOutcome: "Check implementation scope, acceptance criteria, local file boundaries, and validation commands before any later runtime approval request.",
      ownerCapability: "NEXUS Implementation Boundary Review",
    },
    {
      lane: "Runtime Safety Evidence",
      displayLabel: "Runtime safety evidence",
      proposedOutcome: "Confirm rollback evidence, audit evidence, provider/tool limits, deploy/package restrictions, network limits, and blocked spend authority before any later runtime transition.",
      ownerCapability: "NEXUS Runtime Safety Review",
    },
  ];
}

function buildPreviewApprovalGateRow(lane, index, input = {}) {
  const reviewSummary = input.reviewSummary || sourceExecutionSummary(input);
  return {
    displayHandle: `approval-preview-${index + 1}-${safeSlug(lane.lane)}`,
    displayLabel: lane.displayLabel,
    sourceRuntimeLabel: reviewSummary.publicLabel,
    sourceRuntimeLane: reviewSummary.executionLane,
    sourceRuntimeState: reviewSummary.executionState,
    proposedApprovalLane: lane.lane,
    proposedOutcome: lane.proposedOutcome,
    approvalPosition: index + 1,
    approvalGateState: P117_APPROVAL_GATE_PREVIEW_STATES.LOCAL_PREVIEW_READY_APPROVAL_CAPTURE_BLOCKED,
    previewMode: "local-only-dry-run",
    localPreviewReady: true,
    nextAction: "Review this local approval-gate evidence candidate before any later explicitly approved runtime execution phase.",
    blockers: [
      "Approval gate preview is local and read-only.",
      "Local approval evidence writes require a separate approved CRUD request.",
      "Approval capture remains blocked.",
      "Approval persistence remains blocked.",
      "Approve/reject decision recording remains blocked.",
      "Runtime execution remains blocked.",
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
      "P117.4 previews runtime execution approval gate candidates only. It cannot capture approvals, persist approval decisions, record approve/reject decisions, execute runtime work, unlock execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: lane.ownerCapability,
    evidenceRefs: [
      "reports/p1174-founder-runtime-execution-approval-gate-report.md",
      "reports/p1173-founder-runtime-execution-approval-gate-report.md",
    ],
    auditRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic approval gate preview only. No approval capture, runtime execution, provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    localCrudAllowed: false,
    dbWriteAllowed: false,
    sqliteWriteAllowed: false,
    hostedDbMutationAllowed: false,
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    approvalDecisionRecorded: false,
    runtimeApprovalAllowed: false,
    runtimeExecutionAllowed: false,
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
    ...blockedAuthorityFlags(),
  };
}

function buildApprovalGatePreviewSections(approvalRows = []) {
  return [
    {
      sectionHandle: "approval-evidence-candidates",
      displayLabel: "Approval evidence candidates",
      candidateCount: approvalRows.length,
      blockedCount: approvalRows.length,
      nextAction: "Show these candidates in P117.5 without approval capture, approve/reject, execution, provider, project, deploy, package, or spend controls.",
      disabledReason: "This section is read-only approval gate preview data.",
    },
    {
      sectionHandle: "review-gates",
      displayLabel: "Review gates",
      candidateCount: approvalRows.length,
      blockedCount: approvalRows.length,
      nextAction: "Keep operator review, rollback, audit, validation, sqlite-live, and local write evidence separate from the preview.",
      disabledReason: "Preview data cannot satisfy or bypass local CRUD, approval capture, or runtime execution gates.",
    },
    {
      sectionHandle: "blocked-authority",
      displayLabel: "Blocked authority",
      candidateCount: approvalRows.length,
      blockedCount: approvalRows.length,
      nextAction: "Keep approval capture and runtime authority blocked until a later explicitly scoped phase changes the contract.",
      disabledReason: "Approval capture, approval persistence, approve/reject recording, runtime execution, execution unlock, provider/model calls, dispatch, project mutation, hosted DB writes, deploy, release, export, package, network calls, and spend are blocked.",
    },
  ];
}

export function buildSafeRuntimeExecutionApprovalEvidenceRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const key = evidenceKey(input);
  const executionRecord = sourceExecutionRecord(input);
  const approvalEvidenceId = input.approvalEvidenceId || safeId("p1173-approval-evidence", key);
  const runtimeExecutionId = input.runtimeExecutionId || executionRecord.runtimeExecutionId || safeId("p1173-runtime-execution", key);
  const runtimeAdmissionId = input.runtimeAdmissionId || executionRecord.runtimeAdmissionId || safeId("p1173-runtime-admission", key);
  const dispatchReadinessId = input.dispatchReadinessId || executionRecord.dispatchReadinessId || safeId("p1173-dispatch", key);
  const assignmentId = input.assignmentId || executionRecord.assignmentId || safeId("p1173-assignment", key);
  const queueItemId = input.queueItemId || executionRecord.queueItemId || safeId("p1173-queue-item", key);
  const workOrderId = input.workOrderId || executionRecord.workOrderId || safeId("p1173-work-order", key);

  switch (entityName) {
    case "founder_runtime_execution_approval_evidence_items":
      return {
        approvalEvidenceId,
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        publicLabel: input.publicLabel || "Founder runtime execution approval evidence",
        approvalGateState: input.approvalGateState || "approval_evidence_review_model_ready",
        evidenceState: input.evidenceState || "local_evidence_review_ready",
        approvalQuestion: input.approvalQuestion || "Should this future runtime execution request be eligible for governed operator review?",
        evidenceSummary: input.evidenceSummary || "Display-safe approval evidence model recorded locally without capturing an approval decision.",
        ownerCapability: input.ownerCapability || "NEXUS Runtime Approval Gate",
        nextAction: input.nextAction || "Preview the approval gate evidence in P117.4 before any Command Center UX work.",
        disabledReason: "P117.3 records local approval evidence review metadata only; approval capture and runtime execution remain blocked.",
        operatorDecisionRequired: true,
        operatorDecisionRecorded: false,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        localCrudAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
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
        evidenceRefs: ["reports/p1173-founder-runtime-execution-approval-gate-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_runtime_execution_approval_events":
      return {
        approvalEvidenceEventId: safeId("p1173-approval-evidence-event", input.eventKey || key),
        approvalEvidenceId,
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        eventType: input.eventType || "local_approval_evidence_review_model",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Runtime Approval Gate",
        eventSummary: input.eventSummary || "Governed local approval evidence review event recorded without approval capture.",
        rollbackAvailable: true,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        runtimeExecutionAllowed: false,
        executionUnlockAllowed: false,
        workerExecutionAllowed: false,
        toolExecutionAllowed: false,
        providerCallAllowed: false,
        agentDispatchAllowed: false,
        projectMutationAllowed: false,
        networkCallAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1173-founder-runtime-execution-approval-gate-report.md"],
        createdAt: timestamp,
      };
    case "founder_runtime_execution_approval_evidence_refs":
      return {
        approvalEvidenceRefId: safeId("p1173-approval-evidence-ref", input.refKey || key),
        approvalEvidenceId,
        runtimeExecutionId,
        runtimeAdmissionId,
        dispatchReadinessId,
        assignmentId,
        queueItemId,
        workOrderId,
        evidenceLabel: input.evidenceLabel || "P117.3 approval evidence review model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1173-founder-runtime-execution-approval-gate-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P117.3 runtime execution approval gate model: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `runtime-approval-evidence-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Runtime Approval Gate",
    requestedOperation: "create_or_update_local_runtime_execution_approval_evidence_record",
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
    requiredEvidence: [...REVIEW_REQUIREMENTS],
    missingEvidence: missingEvidence(input),
    operatorReviewRequired: true,
    rollbackRequired: true,
    auditRequired: true,
    validationRequired: true,
    requestCanExecute: false,
    sqliteWriteAllowed: false,
    dbWritesAllowed: false,
    hostedDbWritesAllowed: false,
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    approvalDecisionRecorded: false,
    runtimeExecutionAllowed: false,
    executionUnlockAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    validationCommands: [
      "npm run check:p1173-founder-runtime-execution-approval-gate",
      "npm run check:p1172-founder-runtime-execution-approval-gate",
    ],
    evidenceRefs: ["reports/p1173-founder-runtime-execution-approval-gate-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite evidence review request only. No approval capture, runtime execution, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedAuthorityFlags(),
  };
}

export function executeApprovedRuntimeExecutionApprovalGateCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedApprovalEvidenceEntity(entity)) {
    return blockedResult(request, "Entity is outside the P117.3 runtime execution approval evidence allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P117.3.", ["Delete is outside the P117.3 allowed operation set"]);
  }
  if (operation === "approve" || operation === "reject") {
    return blockedResult(request, "P117.3 does not record approve or reject decisions.", ["Approval decision capture is outside P117.3"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P117.3 requires execute=true before local SQLite evidence CRUD can be attempted.");
  }
  if (!reviewReady(input)) {
    return blockedResult(request, "P117.3 requires operator review acceptance, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P117.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        records: listSqliteEntityRecords(entity, { limit: input.limit || 25 }, input),
        sqliteWriteAllowed: true,
        hostedDbWritesAllowed: false,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        approvalDecisionRecorded: false,
        runtimeExecutionAllowed: false,
        executionAllowed: false,
        executionUnlockAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedAuthorityFlags(),
      };
    }
    if (operation === "read") {
      return {
        ok: true,
        phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: false,
        read: true,
        record: getSqliteEntityById(entity, input.id, input),
        sqliteWriteAllowed: true,
        hostedDbWritesAllowed: false,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        approvalDecisionRecorded: false,
        runtimeExecutionAllowed: false,
        executionAllowed: false,
        executionUnlockAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedAuthorityFlags(),
      };
    }
    if (operation === "update") {
      const record = updateSqliteEntity(entity, input.id, {
        ...input.patch,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        runtimeExecutionAllowed: false,
        executionUnlockAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
      }, input);
      return {
        ok: true,
        phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
        requestKey: request.requestKey,
        entity,
        operation,
        admitted: true,
        written: true,
        read: true,
        record,
        sqliteWriteAllowed: true,
        hostedDbWritesAllowed: false,
        approvalCaptureAllowed: false,
        approvalPersistenceAllowed: false,
        approvalDecisionRecorded: false,
        runtimeExecutionAllowed: false,
        executionAllowed: false,
        executionUnlockAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        ...blockedAuthorityFlags(),
      };
    }

    const candidate = input.record || buildSafeRuntimeExecutionApprovalEvidenceRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const existing = getSqliteEntityById(entity, candidate[primaryKey], input);
    const record = existing
      ? updateSqliteEntity(entity, candidate[primaryKey], candidate, input)
      : insertSqliteEntity(entity, candidate, input);
    return {
      ok: true,
      phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
      requestKey: request.requestKey,
      entity,
      operation,
      admitted: true,
      written: true,
      read: true,
      record,
      sqliteWriteAllowed: true,
      hostedDbWritesAllowed: false,
      approvalCaptureAllowed: false,
      approvalPersistenceAllowed: false,
      approvalDecisionRecorded: false,
      runtimeExecutionAllowed: false,
      executionAllowed: false,
      executionUnlockAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
      ...blockedAuthorityFlags(),
    };
  } catch (error) {
    return blockedResult(request, "P117.3 local runtime execution approval evidence CRUD failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderRuntimeExecutionApprovalGateContract(input = {}) {
  const requests = P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;
  const executionSummary = sourceExecutionSummary(input);

  return createPassResult({
    phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
    mode: "governed-founder-runtime-execution-approval-evidence-model",
    source: "live-ready/founderRuntimeExecutionApprovalGate.js",
    summary: "Founder runtime execution approval gate is modeled for governed local evidence review only.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_runtime_execution_approval_evidence_model_ready_for_approved_local_metadata"
        : "founder_runtime_execution_approval_evidence_model_blocked_until_local_review_evidence",
      runtimeMode: "local-sqlite-founder-runtime-execution-approval-evidence",
      dbMode: config.mode,
      sourceRuntimeExecutionItem: sourceExecutionRecord(input),
      sourceRuntimeExecutionSummary: executionSummary,
      approvalEvidenceItem: buildSafeRuntimeExecutionApprovalEvidenceRecord("founder_runtime_execution_approval_evidence_items", input),
      approvalEvents: [buildSafeRuntimeExecutionApprovalEvidenceRecord("founder_runtime_execution_approval_events", input)],
      evidenceRefs: [buildSafeRuntimeExecutionApprovalEvidenceRecord("founder_runtime_execution_approval_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P117.3 local SQLite CRUD requires execute=true, operator review acceptance, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      authorityFlags: blockedAuthorityFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedRuntimeExecutionApprovalGateCrudRequest for approved local evidence metadata only."
        : "Collect operator review acceptance, rollback, audit, validation, sqlite-live, and local write evidence before local approval-evidence CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P117.3 local CRUD admission.`),
      disabledReason:
        "P117.3 only admits governed local SQLite CRUD for founder runtime execution approval evidence OS records. Approval capture, approval persistence, approve/reject decisions, runtime execution, execution unlock, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Runtime Approval Gate",
      auditRefs: ["reports/p1173-founder-runtime-execution-approval-gate-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after review gates. No approval capture, runtime execution, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedAuthorityFlags(),
    },
    evidence: [
      "reports/p1173-founder-runtime-execution-approval-gate-report.md",
      "contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json",
    ],
    warnings: [
      "P117.3 does not capture approval decisions, persist approvals, execute runtime work, call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderRuntimeExecutionApprovalGateContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE) errors.push("phase must be P117.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "sourceRuntimeExecutionItem", "sourceRuntimeExecutionSummary", "approvalEvidenceItem", "approvalEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "authorityFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES.length) errors.push("localCrudRequests must cover founder runtime execution approval evidence DB entities");
  for (const entity of P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES) {
    if (!data.localCrudRequests?.some((request) => request.sqliteEntity === entity)) errors.push(`missing request for ${entity}`);
  }
  for (const flag of BLOCKED_AUTHORITY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.authorityFlags?.[flag] !== false) errors.push(`authorityFlags.${flag} must be false`);
  }
  for (const request of data.localCrudRequests || []) {
    if (request.requestCanExecute !== false) errors.push(`${request.sqliteEntity}.requestCanExecute must be false`);
    if (request.approvalCaptureAllowed !== false) errors.push(`${request.sqliteEntity}.approvalCaptureAllowed must be false`);
    if (request.approvalPersistenceAllowed !== false) errors.push(`${request.sqliteEntity}.approvalPersistenceAllowed must be false`);
    if (request.approvalDecisionRecorded !== false) errors.push(`${request.sqliteEntity}.approvalDecisionRecorded must be false`);
    if (request.runtimeExecutionAllowed !== false) errors.push(`${request.sqliteEntity}.runtimeExecutionAllowed must be false`);
    if (request.executionAllowed !== false) errors.push(`${request.sqliteEntity}.executionAllowed must be false`);
    if (request.executionUnlockAllowed !== false) errors.push(`${request.sqliteEntity}.executionUnlockAllowed must be false`);
    if (request.projectMutationAllowed !== false) errors.push(`${request.sqliteEntity}.projectMutationAllowed must be false`);
    if (request.providerSpendAllowed !== false) errors.push(`${request.sqliteEntity}.providerSpendAllowed must be false`);
    if (request.hostedDbWritesAllowed !== false) errors.push(`${request.sqliteEntity}.hostedDbWritesAllowed must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Runtime execution approval gate model must not expose raw private IDs");
  if (/approve now|reject now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute runtime now|execute now/i.test(serialized)) errors.push("Runtime execution approval gate model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}

export function buildRuntimeExecutionApprovalGatePreviewModel(input = {}) {
  const contractEnvelope = input.contractEnvelope || buildFounderRuntimeExecutionApprovalGateContract(input);
  const reviewSummary = contractEnvelope.data?.sourceRuntimeExecutionSummary || sourceExecutionSummary(input);
  const approvalRows = approvalPreviewLanes(input).map((lane, index) => buildPreviewApprovalGateRow(lane, index, { ...input, reviewSummary }));
  const approvalSections = buildApprovalGatePreviewSections(approvalRows);
  const previewReady = approvalRows.length > 0;

  return createPassResult({
    phase: P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE,
    mode: "founder-runtime-execution-approval-gate-preview",
    source: "live-ready/founderRuntimeExecutionApprovalGate.js",
    summary: "Founder runtime execution approval gate preview is assembled locally from display-safe evidence context; approval capture and runtime execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? P117_APPROVAL_GATE_PREVIEW_STATES.LOCAL_PREVIEW_READY_APPROVAL_CAPTURE_BLOCKED
        : P117_APPROVAL_GATE_PREVIEW_STATES.NEEDS_APPROVAL_EVIDENCE_CONTEXT,
      sourceContractPhase: contractEnvelope.phase,
      sourceContractState: contractEnvelope.data?.currentState || "unknown",
      previewMode: "local-only-dry-run",
      sourceReviewSummary: reviewSummary,
      approvalGateSummary: {
        candidateCount: approvalRows.length,
        blockedCandidateCount: approvalRows.length,
        writableCandidateCount: 0,
        persistedCandidateCount: 0,
        approvalCaptureCandidateCount: 0,
        approvalPersistenceCandidateCount: 0,
        approveRejectCandidateCount: 0,
        runtimeExecutableCandidateCount: 0,
        executableCandidateCount: 0,
        executionUnlockCandidateCount: 0,
        projectMutationCandidateCount: 0,
        hostedDbMutationCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      approvalSections,
      approvalRows,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: previewReady
        ? "Render P117.5 Command Center approval gate preview on scoped non-chat founder pages without approval or execution controls."
        : "Complete display-safe approval evidence context before approval gate preview assembly.",
      blockers: previewReady ? [] : ["Approval evidence context is required before preview assembly."],
      disabledReason:
        "P117.4 only previews runtime execution approval gate candidates. Approval capture, approval persistence, approve/reject recording, runtime execution, execution unlock, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Runtime Approval Gate Preview",
      evidenceRefs: [
        "reports/p1174-founder-runtime-execution-approval-gate-report.md",
        "reports/p1173-founder-runtime-execution-approval-gate-report.md",
      ],
      auditRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run approval gate preview only. No approval capture, runtime execution, provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      localCrudAllowed: false,
      dbWriteAllowed: false,
      sqliteWriteAllowed: false,
      hostedDbMutationAllowed: false,
      approvalCaptureAllowed: false,
      approvalPersistenceAllowed: false,
      approvalDecisionRecorded: false,
      runtimeApprovalAllowed: false,
      runtimeExecutionAllowed: false,
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
      ...blockedAuthorityFlags(),
    },
    evidence: [
      "reports/p1174-founder-runtime-execution-approval-gate-report.md",
      "contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json",
    ],
    warnings: [
      "P117.4 is a dry-run preview. It does not capture approvals, persist approval decisions, execute runtime work, call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, deploy, package, or spend.",
    ],
  });
}

export function validateRuntimeExecutionApprovalGatePreviewModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE) errors.push("phase must be P117.4");
  for (const field of ["schemaVersion", "currentState", "sourceContractPhase", "sourceContractState", "previewMode", "sourceReviewSummary", "approvalGateSummary", "approvalSections", "approvalRows", "forbiddenOperations", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityLocation", "costImpact", "commandCenterVisible"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.previewMode !== "local-only-dry-run") errors.push("previewMode must be local-only-dry-run");
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must remain false until P117.5");
  if (!Array.isArray(data.approvalRows) || data.approvalRows.length === 0) errors.push("approvalRows required");
  if (!Array.isArray(data.approvalSections) || data.approvalSections.length === 0) errors.push("approvalSections required");
  for (const flag of BLOCKED_AUTHORITY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const field of ["localCrudAllowed", "dbWriteAllowed", "sqliteWriteAllowed", "hostedDbMutationAllowed", "dispatchAllowed", "deployAllowed", "releaseAllowed", "exportAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[field] !== false) errors.push(`${field} must be false`);
  }
  for (const row of data.approvalRows || []) {
    for (const flag of BLOCKED_AUTHORITY_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayHandle}.${flag} must be false`);
    }
    for (const field of ["localCrudAllowed", "dbWriteAllowed", "sqliteWriteAllowed", "hostedDbMutationAllowed", "dispatchAllowed", "deployAllowed", "releaseAllowed", "exportAllowed", "packageAllowed", "spendAllowed"]) {
      if (row[field] !== false) errors.push(`${row.displayHandle}.${field} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_approval_evidence_items|founder_runtime_execution_approval_events|founder_runtime_execution_approval_evidence_refs)/.test(serialized)) errors.push("Preview model must not expose raw approval evidence record keys or table names");
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Preview model must not expose raw private IDs");
  if (/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serialized)) errors.push("Preview model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
