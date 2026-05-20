import { createPassResult } from "../shared/resultEnvelope.js";
import { getSqliteRuntimeConfig } from "../db/sqliteRuntime.js";
import {
  P94_FOUNDER_RUNTIME_DB_ENTITIES,
  buildFounderRuntimeDbCrudWorkflow,
} from "./founderRuntimeDbCrudWorkflow.js";

export const P95_FOUNDER_PERSISTENCE_CONTROLS_PHASE = "P95.2";

export const P95_FOUNDER_PERSISTENCE_ACTIONS = Object.freeze([
  "save_founder_session",
  "read_founder_session",
  "update_prd_artifact",
  "list_workstream_plans",
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

const APPROVAL_EVIDENCE_KEYS = Object.freeze([
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

function safeApprovalEvidence(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  return {
    operatorApproval: input.operatorApproval === true,
    rollbackAccepted: input.rollbackAccepted === true,
    auditAccepted: input.auditAccepted === true,
    validationCommandsAccepted: input.validationCommandsAccepted === true,
    sqliteLiveMode: config.sqliteLiveAllowed === true,
    sqliteWritesEnabled: config.dbWritesEnabled === true || input.dbWritesEnabled === true,
  };
}

function missingApprovalEvidence(evidence = {}) {
  return APPROVAL_EVIDENCE_KEYS.filter((key) => evidence[key] !== true);
}

function approvalState(evidence = {}) {
  const missing = missingApprovalEvidence(evidence);
  return {
    label: missing.length === 0 ? "Approved for local persistence review" : "Needs approval evidence",
    complete: missing.length === 0,
    missingEvidence: missing,
    writeGate: missing.length === 0 ? "local_sqlite_write_gate_ready" : "local_sqlite_write_gate_blocked",
  };
}

function summarizeEntities(workflowData = {}) {
  const entityLabels = {
    founder_sessions: "Founder session",
    founder_qna_turns: "Founder Q&A turns",
    founder_prd_artifacts: "Founder PRD artifact",
    founder_workstream_plans: "Founder workstream plans",
  };

  return P94_FOUNDER_RUNTIME_DB_ENTITIES.map((entity) => {
    const label = entityLabels[entity] || "Founder workflow record";
    return {
      entity,
      label,
      currentState: workflowData.currentState || "founder_runtime_db_crud_blocked_until_local_admission_evidence",
      persistenceState: "local_sqlite_controlled",
      displaySafe: true,
      rawIdsHidden: true,
    };
  });
}

function buildPendingControlActions(evidence = {}) {
  const missing = missingApprovalEvidence(evidence);
  const ready = missing.length === 0;
  return [
    {
      actionKey: "save-founder-session",
      label: "Save founder session locally",
      entity: "founder_sessions",
      operation: "upsert",
      controlState: ready ? "ready_for_operator_confirmed_local_write" : "blocked_until_approval_evidence",
      disabledReason: ready ? "" : "Local persistence requires approval, rollback, audit, validation, sqlite-live mode, and local write evidence.",
    },
    {
      actionKey: "read-founder-session",
      label: "Read founder session locally",
      entity: "founder_sessions",
      operation: "read",
      controlState: ready ? "ready_for_operator_confirmed_local_read" : "blocked_until_approval_evidence",
      disabledReason: ready ? "" : "Local persistence reads remain grouped behind the P95 operator control state.",
    },
    {
      actionKey: "update-prd-artifact",
      label: "Update local PRD artifact",
      entity: "founder_prd_artifacts",
      operation: "update",
      controlState: ready ? "ready_for_operator_confirmed_local_update" : "blocked_until_approval_evidence",
      disabledReason: ready ? "" : "Local PRD persistence requires the complete approval evidence set.",
    },
    {
      actionKey: "list-workstream-plans",
      label: "List local workstream plans",
      entity: "founder_workstream_plans",
      operation: "list",
      controlState: ready ? "ready_for_operator_confirmed_local_list" : "blocked_until_approval_evidence",
      disabledReason: ready ? "" : "Local workstream persistence requires the complete approval evidence set.",
    },
  ];
}

export function buildFounderPersistenceOperatorControls(input = {}) {
  const workflow = buildFounderRuntimeDbCrudWorkflow(input);
  const workflowData = workflow.data || {};
  const config = getSqliteRuntimeConfig(input);
  const approvalEvidence = safeApprovalEvidence(input);
  const state = approvalState(approvalEvidence);
  const blockers = state.missingEvidence.map((key) => `${key} is required before approved local founder persistence controls can run.`);

  return createPassResult({
    phase: P95_FOUNDER_PERSISTENCE_CONTROLS_PHASE,
    mode: "founder-persistence-operator-controls",
    source: "live-ready/founderPersistenceOperatorControls.js",
    summary: "Founder persistence operator controls are modeled for display-safe local SQLite approval.",
    data: {
      schemaVersion: "1.0",
      currentState: state.complete
        ? "founder_persistence_controls_ready_for_operator_confirmed_local_crud"
        : "founder_persistence_controls_blocked_until_approval_evidence",
      runtimeMode: "local-sqlite-founder-persistence-controls",
      dbMode: config.mode,
      approvalState: state,
      approvalEvidence,
      localEntitySummaries: summarizeEntities(workflowData),
      pendingControlActions: buildPendingControlActions(approvalEvidence),
      allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      rollbackPlan: {
        required: true,
        state: approvalEvidence.rollbackAccepted ? "accepted" : "required",
        summary: "Use local SQLite backup/restore procedures before approved local founder persistence writes.",
      },
      auditRefs: ["reports/p952-founder-persistence-control-model-report.md"],
      evidenceRefs: [
        "reports/p952-founder-persistence-control-model-report.md",
        "reports/p943-founder-runtime-crud-model-report.md",
      ],
      activityRefs: ["reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      nextAction: state.complete
        ? "Route P95.3 to the approved local persistence adapter."
        : "Collect the missing approval evidence before local founder persistence controls can run.",
      blockers,
      disabledReason:
        "P95.2 models local SQLite founder persistence controls only. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Persistence Controls",
      costImpact: "Local deterministic control model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p952-founder-persistence-control-model-report.md",
      "contracts/os-roadmap/p95-execution-contracts.json",
    ],
    warnings: [
      "P95.2 is a model only. It does not write SQLite state, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderPersistenceOperatorControls(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P95_FOUNDER_PERSISTENCE_CONTROLS_PHASE) errors.push("phase must be P95.2");
  for (const field of ["schemaVersion", "currentState", "runtimeMode", "dbMode", "approvalState", "approvalEvidence", "localEntitySummaries", "pendingControlActions", "allowedLocalCrudOperations", "forbiddenOperations", "rollbackPlan", "auditRefs", "evidenceRefs", "activityRefs", "activityLocation", "nextAction", "blockers", "disabledReason", "ownerCapability", "costImpact", "commandCenterVisible"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  for (const key of APPROVAL_EVIDENCE_KEYS) {
    if (typeof data.approvalEvidence?.[key] !== "boolean") errors.push(`approvalEvidence.${key} must be boolean`);
  }
  if (!Array.isArray(data.localEntitySummaries) || data.localEntitySummaries.length !== P94_FOUNDER_RUNTIME_DB_ENTITIES.length) errors.push("localEntitySummaries must cover founder workflow entities");
  for (const entity of P94_FOUNDER_RUNTIME_DB_ENTITIES) {
    if (!data.localEntitySummaries?.some((summary) => summary.entity === entity && summary.displaySafe === true && summary.rawIdsHidden === true)) errors.push(`missing display-safe summary for ${entity}`);
  }
  if (!Array.isArray(data.pendingControlActions) || data.pendingControlActions.length !== P95_FOUNDER_PERSISTENCE_ACTIONS.length) errors.push("pendingControlActions must cover P95 actions");
  for (const action of data.pendingControlActions || []) {
    if (!action.actionKey || !action.label || !action.entity || !action.operation || !action.controlState) errors.push("pending control action is missing display fields");
    if (!P94_FOUNDER_RUNTIME_DB_ENTITIES.includes(action.entity)) errors.push(`${action.actionKey} uses a non-allowlisted entity`);
    if (action.operation === "delete") errors.push(`${action.actionKey} must not use delete`);
  }
  if (data.rollbackPlan?.required !== true) errors.push("rollbackPlan.required must be true");
  if (!Array.isArray(data.auditRefs) || data.auditRefs.length === 0) errors.push("auditRefs must be present");
  if (!Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0) errors.push("evidenceRefs must be present");
  if (!Array.isArray(data.activityRefs) || data.activityRefs.length === 0) errors.push("activityRefs must be present");
  if (data.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("P95.2 controls must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|generate app now/i.test(serialized)) errors.push("P95.2 controls must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
