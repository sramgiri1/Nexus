import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";

export const P94_FOUNDER_RUNTIME_DB_CRUD_PHASE = "P94.3";

export const P94_FOUNDER_RUNTIME_DB_ENTITIES = Object.freeze([
  "founder_sessions",
  "founder_qna_turns",
  "founder_prd_artifacts",
  "founder_workstream_plans",
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

const APPROVAL_REQUIREMENTS = Object.freeze([
  "operatorApproval",
  "rollbackAccepted",
  "auditAccepted",
  "validationCommandsAccepted",
  "sqliteLiveMode",
  "sqliteWritesEnabled",
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
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function safeSlug(value = "runtime") {
  return String(value || "runtime").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedFounderEntity(entityName = "") {
  return P94_FOUNDER_RUNTIME_DB_ENTITIES.includes(entityName);
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
    phase: P94_FOUNDER_RUNTIME_DB_CRUD_PHASE,
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
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    ...blockedRuntimeFlags(),
  };
}

export function buildSafeFounderRuntimeDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const sessionKey = input.sessionKey || "founder-workflow";

  switch (entityName) {
    case "founder_sessions":
      return {
        sessionId: safeId("p943-session", sessionKey),
        publicLabel: "Founder session",
        founderIdeaSummary: input.founderIdeaSummary || "Founder wants NEXUS to validate an app idea and plan the business build.",
        currentState: "captured_locally",
        nextQuestion: input.nextQuestion || "Who is the target customer and what is the launch constraint?",
        readinessPercent: input.readinessPercent || 50,
        ownerCapability: "NEXUS Founder Runtime DB",
        evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_qna_turns":
      return {
        turnId: safeId("p943-turn", sessionKey),
        sessionId: safeId("p943-session", sessionKey),
        speaker: "founder",
        prompt: input.prompt || "Build a simple iOS Snake game for the App Store.",
        responseSummary: input.responseSummary || "Founder wants a scoped feasibility read and product plan.",
        turnState: "captured_locally",
        createdAt: timestamp,
      };
    case "founder_prd_artifacts":
      return {
        prdId: safeId("p943-prd", sessionKey),
        sessionId: safeId("p943-session", sessionKey),
        title: input.title || "Founder App PRD",
        problemSummary: input.problemSummary || "Founder needs feasibility, scope, and execution planning before build spend.",
        customerSummary: input.customerSummary || "Early target customer summary pending founder confirmation.",
        solutionSummary: input.solutionSummary || "NEXUS drafts a local PRD and maps agent workstreams.",
        businessModelSummary: input.businessModelSummary || "Business model assumption pending founder confirmation.",
        readinessPercent: input.prdReadinessPercent || 65,
        currentState: "drafted_locally",
        evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "founder_workstream_plans":
      return {
        planId: safeId("p943-plan", input.lane || "product"),
        sessionId: safeId("p943-session", sessionKey),
        prdId: safeId("p943-prd", sessionKey),
        lane: input.lane || "product",
        ownerCapability: input.ownerCapability || "NEXUS Product Strategy",
        currentState: "planned_locally",
        nextAction: input.nextAction || "Review workstream scope before dispatch is considered.",
        blockerSummary: "Agent dispatch and project mutation remain blocked.",
        dispatchAllowed: false,
        workerExecutionAllowed: false,
        projectMutationAllowed: false,
        evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P94.3 founder runtime DB CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `founder-db-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Founder Runtime DB",
    requestedOperation: "create_or_update_local_founder_record",
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
      "npm run check:p943-founder-runtime-crud-model",
      "npm run check:p942-founder-runtime-db-schema",
      "npm run check:p941-founder-runtime-db-crud-contract",
    ],
    evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedFounderRuntimeDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedFounderEntity(entity)) {
    return blockedResult(request, "Entity is outside the P94.3 founder workflow CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P94.3.", ["Delete is outside the P94.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P94.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P94.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P94.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P94_FOUNDER_RUNTIME_DB_CRUD_PHASE,
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

    const record = input.record || buildSafeFounderRuntimeDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P94_FOUNDER_RUNTIME_DB_CRUD_PHASE,
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
      return blockedResult(request, "Operation is outside the P94.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P94_FOUNDER_RUNTIME_DB_CRUD_PHASE,
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
    return blockedResult(request, "P94.3 local founder CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderRuntimeDbCrudWorkflow(input = {}) {
  const requests = P94_FOUNDER_RUNTIME_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;
  const founderSession = buildSafeFounderRuntimeDbRecord("founder_sessions", input);
  const qnaTurn = buildSafeFounderRuntimeDbRecord("founder_qna_turns", input);
  const prdArtifact = buildSafeFounderRuntimeDbRecord("founder_prd_artifacts", input);
  const workstreamPlan = buildSafeFounderRuntimeDbRecord("founder_workstream_plans", input);

  return createPassResult({
    phase: P94_FOUNDER_RUNTIME_DB_CRUD_PHASE,
    mode: "governed-founder-runtime-db-crud",
    source: "live-ready/founderRuntimeDbCrudWorkflow.js",
    summary: "Founder runtime DB CRUD workflow is modeled for governed local SQLite admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "founder_runtime_db_crud_ready_for_approved_local_admission"
        : "founder_runtime_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-founder-workflow",
      dbMode: config.mode,
      founderSession,
      qnaTurns: [qnaTurn],
      prdArtifact,
      workstreamPlan,
      activationReview: {
        currentState: "review_required_before_dispatch",
        dispatchAllowed: false,
        projectMutationAllowed: false,
        nextAction: "Review DB-backed founder workflow records before any later activation phase.",
      },
      runtimeTasks: [
        {
          title: "Persist founder session locally",
          ownerCapability: "NEXUS Founder Runtime DB",
          currentState: "ready_for_local_crud_review",
          executionAllowed: false,
        },
      ],
      mutationRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P94.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedFounderRuntimeDbCrudRequest for approved local founder workflow records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P94.3 local CRUD admission.`),
      disabledReason:
        "P94.3 only admits governed local SQLite CRUD for founder workflow OS records. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Runtime DB CRUD",
      evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
      auditRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p943-founder-runtime-crud-model-report.md",
      "contracts/os-roadmap/p94-execution-contracts.json",
    ],
    warnings: [
      "P94.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, deploy, package, or spend.",
    ],
  });
}

export function validateFounderRuntimeDbCrudWorkflow(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P94_FOUNDER_RUNTIME_DB_CRUD_PHASE) errors.push("phase must be P94.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "founderSession", "qnaTurns", "prdArtifact", "workstreamPlan", "activationReview", "runtimeTasks", "mutationRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.qnaTurns) || data.qnaTurns.length === 0) errors.push("qnaTurns must include at least one local turn");
  if (!Array.isArray(data.mutationRequests) || data.mutationRequests.length !== P94_FOUNDER_RUNTIME_DB_ENTITIES.length) errors.push("mutationRequests must cover founder runtime DB entities");
  for (const entity of P94_FOUNDER_RUNTIME_DB_ENTITIES) {
    if (!data.mutationRequests?.some((request) => request.sqliteEntity === entity)) errors.push(`missing request for ${entity}`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const request of data.mutationRequests || []) {
    if (request.requestCanExecute !== false || request.sqliteWriteAllowed !== false || request.dbWritesAllowed !== false) errors.push(`${request.sqliteEntity}.request flags must remain false in workflow model`);
    if (request.projectMutationAllowed !== false || request.providerSpendAllowed !== false) errors.push(`${request.sqliteEntity}.unsafe flags must remain false`);
    if (request.payloadShape?.shapeMode !== "display-safe-field-summary") errors.push(`${request.sqliteEntity}.payloadShape must be display-safe`);
  }
  if (data.activationReview?.dispatchAllowed !== false || data.activationReview?.projectMutationAllowed !== false) errors.push("activationReview must keep dispatch and project mutation blocked");
  if (data.workstreamPlan?.dispatchAllowed !== false || data.workstreamPlan?.workerExecutionAllowed !== false || data.workstreamPlan?.projectMutationAllowed !== false) errors.push("workstreamPlan execution flags must remain false");
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("founder DB CRUD workflow must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now|write sqlite now/i.test(serialized)) errors.push("founder DB CRUD workflow must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
