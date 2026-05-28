import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteEntityRecords,
  updateSqliteEntity,
} from "../db/sqliteCrudRepository.js";
import { buildFounderLiveOperatorDecisionLedgerAuditPreview } from "./founderLiveOperatorDecisionLedgerAuditPreview.js";

export const P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE = "P110.3";

export const P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES = Object.freeze([
  "operator_decision_ledger_entries",
  "operator_decision_ledger_events",
  "operator_decision_ledger_evidence_refs",
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

function safeSlug(value = "operator-decision-ledger") {
  return String(value || "operator-decision-ledger")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "operator-decision-ledger";
}

function safeId(prefix, key = "") {
  return `${prefix}-${safeSlug(key)}`;
}

function requestEntity(request = {}) {
  return request.sqliteEntity || request.entity || "";
}

function isAllowedLedgerEntity(entityName = "") {
  return P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.includes(entityName);
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
    phase: P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
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

function firstAuditRow(input = {}) {
  const auditPreview = input.decisionLedgerAuditPreviewEnvelope || buildFounderLiveOperatorDecisionLedgerAuditPreview(input);
  return auditPreview.data?.auditRows?.[0] || {};
}

export function buildSafeOperatorDecisionLedgerDbRecord(entityName = "", input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const ledgerKey = input.ledgerKey || "founder-operator-decision";
  const ledgerEntryId = safeId("p1103-ledger-entry", ledgerKey);
  const row = input.auditRow || firstAuditRow(input);

  switch (entityName) {
    case "operator_decision_ledger_entries":
      return {
        ledgerEntryId,
        publicLabel: input.publicLabel || "Operator decision ledger entry",
        sourceCandidateLabel: input.sourceCandidateLabel || row.sourceCandidateLabel || "Decision Ledger Candidate",
        sourceReviewLabel: input.sourceReviewLabel || row.sourceReviewLabel || "Operator Review Audit",
        proposedAgentLane: input.proposedAgentLane || row.proposedAgentLane || "Product Strategy",
        proposedOutcome: input.proposedOutcome || row.proposedOutcome || "Prepare governed work for later review.",
        decisionState: input.decisionState || "recorded_locally_after_operator_gate",
        decisionSummary: input.decisionSummary || "Display-safe operator decision ledger summary.",
        nextAction: input.nextAction || "Review Command Center persistence UX before broader runtime admission.",
        disabledReason: "P110.3 records local ledger metadata only; execution remains blocked.",
        ownerCapability: input.ownerCapability || "NEXUS Operator Decision Ledger DB",
        ledgerWriteAllowed: true,
        dbWriteAllowed: true,
        hostedDbMutationAllowed: false,
        replayAllowed: false,
        executionUnlockAllowed: false,
        runtimeAdmissionAllowed: false,
        dispatchAllowed: false,
        projectMutationAllowed: false,
        providerSpendAllowed: false,
        evidenceRefs: ["reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md"],
        activityRefs: ["reports/os-phase-status-report.md"],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    case "operator_decision_ledger_events":
      return {
        ledgerEventId: safeId("p1103-ledger-event", input.eventKey || ledgerKey),
        ledgerEntryId,
        eventType: input.eventType || "local_crud_admission",
        eventState: input.eventState || "recorded_locally",
        actorLabel: input.actorLabel || "NEXUS Operator Decision Ledger DB",
        eventSummary: input.eventSummary || "Governed local CRUD event recorded without replay or execution authority.",
        rollbackAvailable: true,
        replayAllowed: false,
        executionUnlockAllowed: false,
        runtimeAdmissionAllowed: false,
        evidenceRefs: ["reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md"],
        createdAt: timestamp,
      };
    case "operator_decision_ledger_evidence_refs":
      return {
        evidenceRefId: safeId("p1103-ledger-evidence", input.evidenceKey || ledgerKey),
        ledgerEntryId,
        evidenceLabel: input.evidenceLabel || "P110.3 CRUD model report",
        evidenceType: input.evidenceType || "validation_report",
        evidenceLocation: input.evidenceLocation || "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md",
        redactionRequired: true,
        retainedForAudit: true,
        createdAt: timestamp,
      };
    default:
      throw new Error(`Entity is not allowed for P110.3 operator decision ledger CRUD: ${entityName}`);
  }
}

function buildRequest(entityName, input = {}) {
  return {
    requestKey: `operator-decision-ledger-crud-${safeSlug(entityName)}`,
    sqliteEntity: entityName,
    ownerCapability: "NEXUS Operator Decision Ledger DB",
    requestedOperation: "create_or_update_local_operator_decision_ledger_record",
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
      "npm run check:p1103-founder-live-operator-decision-ledger-crud-model",
      "npm run check:p1102-founder-live-operator-decision-ledger-schema",
    ],
    evidenceRefs: ["reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite request only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function executeApprovedOperatorDecisionLedgerDbCrudRequest(request = {}, input = {}) {
  const entity = requestEntity(request);
  const operation = input.operation || "upsert";
  if (!isAllowedLedgerEntity(entity)) {
    return blockedResult(request, "Entity is outside the P110.3 operator decision ledger CRUD allowlist.", [`Entity not allowed: ${entity}`]);
  }
  if (operation === "delete") {
    return blockedResult(request, "Delete is not admitted in P110.3.", ["Delete is outside the P110.3 allowed operation set"]);
  }
  if (input.execute !== true) {
    return blockedResult(request, "P110.3 requires execute=true before local SQLite CRUD can be attempted.");
  }
  if (!approvalReady(input)) {
    return blockedResult(request, "P110.3 requires operator approval, rollback acceptance, audit acceptance, and validation command acceptance.");
  }

  const config = getSqliteRuntimeConfig(input);
  if (!config.sqliteLiveAllowed || !config.dbWritesEnabled) {
    return blockedResult(request, "P110.3 local CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.");
  }

  try {
    if (operation === "list") {
      return {
        ok: true,
        phase: P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
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

    const record = input.record || buildSafeOperatorDecisionLedgerDbRecord(entity, input);
    const primaryKey = primaryKeyForEntity(entity);
    const id = input.id || record[primaryKey];
    if (operation === "read") {
      return {
        ok: true,
        phase: P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
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
      return blockedResult(request, "Operation is outside the P110.3 allowed operation set.", [`Operation not allowed: ${operation}`]);
    }

    return {
      ok: true,
      phase: P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
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
    return blockedResult(request, "P110.3 local operator decision ledger CRUD admission failed during guarded SQLite repository access.", [error.message || String(error)]);
  }
}

export function buildFounderLiveOperatorDecisionLedgerPersistenceContract(input = {}) {
  const requests = P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.map((entity) => buildRequest(entity, input));
  const missing = missingEvidence(input);
  const config = getSqliteRuntimeConfig(input);
  const canAttemptLocalCrud = missing.length === 0 && config.sqliteLiveAllowed && config.dbWritesEnabled;

  return createPassResult({
    phase: P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
    mode: "governed-operator-decision-ledger-db-crud",
    source: "live-ready/founderLiveOperatorDecisionLedgerPersistence.js",
    summary: "Operator decision ledger persistence is modeled for governed local SQLite CRUD admission.",
    data: {
      schemaVersion: "1.0",
      currentState: canAttemptLocalCrud
        ? "operator_decision_ledger_db_crud_ready_for_approved_local_admission"
        : "operator_decision_ledger_db_crud_blocked_until_local_admission_evidence",
      runtimeMode: "local-sqlite-operator-decision-ledger",
      dbMode: config.mode,
      ledgerEntry: buildSafeOperatorDecisionLedgerDbRecord("operator_decision_ledger_entries", input),
      ledgerEvents: [buildSafeOperatorDecisionLedgerDbRecord("operator_decision_ledger_events", input)],
      evidenceRefs: [buildSafeOperatorDecisionLedgerDbRecord("operator_decision_ledger_evidence_refs", input)],
      localCrudRequests: requests,
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate: "P110.3 local SQLite CRUD requires execute=true, operator approval, rollback acceptance, audit acceptance, validation command acceptance, sqlite-live mode, and local write flags.",
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: canAttemptLocalCrud
        ? "Use executeApprovedOperatorDecisionLedgerDbCrudRequest for approved local ledger records."
        : "Collect operator approval, rollback, audit, validation, sqlite-live, and local write evidence before local ledger CRUD.",
      blockers: missing.map((requirement) => `${requirement} is required before P110.3 local CRUD admission.`),
      disabledReason:
        "P110.3 only admits governed local SQLite CRUD for operator decision ledger OS records. Hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Operator Decision Ledger DB CRUD",
      auditRefs: ["reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md"],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md",
      "contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json",
    ],
    warnings: [
      "P110.3 does not call providers, dispatch agents, mutate projects, use hosted DBs, unlock execution, admit runtime execution, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveOperatorDecisionLedgerPersistenceContract(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE) errors.push("phase must be P110.3");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "ledgerEntry", "ledgerEvents", "evidenceRefs", "localCrudRequests", "allowedLocalCrudOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "auditRefs", "activityRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.localCrudRequests) || data.localCrudRequests.length !== P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.length) errors.push("localCrudRequests must cover operator decision ledger DB entities");
  for (const entity of P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES) {
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
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("Operator decision ledger CRUD model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("Operator decision ledger CRUD model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
