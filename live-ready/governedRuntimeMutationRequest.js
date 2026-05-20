import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P93_LIVE_RUNTIME_ENTITY_LANES,
  buildEnterpriseLiveRuntimeCrudPlan,
} from "./enterpriseLiveRuntimeCrudPlan.js";

export const P93_GOVERNED_RUNTIME_MUTATION_REQUEST_PHASE = "P93.3";

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
  "dbWritesAllowed",
  "sqliteWriteAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
  "requestCanExecute",
]);

const REQUIRED_REQUEST_EVIDENCE = Object.freeze([
  "sourceCrudPlan",
  "laneReadiness",
  "payloadShapeReview",
  "operatorApprovalPolicy",
  "sqliteEntityMapping",
  "validationCommands",
  "rollbackPlan",
  "auditEvidence",
  "costEvidence",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "SQLite write execution",
  "hosted DB mutation",
  "provider/model calls",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function requestKey(lane = "") {
  return `runtime-mutation-request-${String(lane).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function payloadShapeForLane(lane = {}) {
  return {
    shapeMode: "field-summary-only",
    sqliteEntity: lane.sqliteEntity,
    fields: [
      "schemaVersion",
      "runtimeLane",
      "ownerCapability",
      "state",
      "summary",
      "evidenceRefs",
      "activityLocation",
      "createdAt",
      "updatedAt",
    ],
    redactionRules: [
      "Do not include raw project IDs.",
      "Do not include private workspace IDs.",
      "Do not include provider tokens or secrets.",
      "Do not include raw logs or raw policy dumps.",
    ],
  };
}

function missingRequestEvidence(lane = {}) {
  const missing = Array.isArray(lane.missingEvidence) ? [...lane.missingEvidence] : [];
  for (const required of ["operatorApprovalPolicy", "rollbackPlan", "auditEvidence"]) {
    if (!missing.includes(required)) missing.push(required);
  }
  return missing;
}

function buildMutationRequest(lane = {}) {
  const missingEvidence = missingRequestEvidence(lane);
  const laneReady = lane.status === "ready_for_governed_crud_request_model";

  return {
    requestKey: requestKey(lane.lane),
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    sqliteEntity: lane.sqliteEntity,
    sourceLaneStatus: lane.status,
    requestedOperation: "create_or_update_request_review",
    requestState: laneReady
      ? "ready_for_operator_review_not_executable"
      : "blocked_missing_review_evidence",
    payloadShape: payloadShapeForLane(lane),
    requiredEvidence: [...REQUIRED_REQUEST_EVIDENCE, ...(lane.requiredEvidence || [])],
    missingEvidence,
    operatorApprovalRequired: true,
    rollbackRequired: true,
    auditRequired: true,
    validationRequired: true,
    requestCanExecute: false,
    sqliteWriteAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    providerCallAllowed: false,
    workerExecutionAllowed: false,
    nextAction: laneReady
      ? "Route this local mutation request through P93.4 CRUD execution admission before any SQLite write can be considered."
      : lane.nextAction,
    disabledReason:
      "P93.3 defines governed mutation request envelopes only. SQLite writes, hosted DB mutation, provider/model calls, agent dispatch, tool/worker execution, project mutation, network calls, deploy, release, export, package, and spend remain blocked.",
    validationCommands: [
      "npm run check:p933-governed-runtime-mutation-request",
      "npm run check:p932-enterprise-runtime-crud-plan",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: [
      "reports/p933-governed-runtime-mutation-request-report.md",
      "reports/p932-enterprise-runtime-crud-plan-report.md",
    ],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local request envelope only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(requests) {
  return requests.reduce((acc, request) => {
    acc[request.requestState] = (acc[request.requestState] || 0) + 1;
    return acc;
  }, {});
}

export function buildGovernedRuntimeMutationRequest(input = {}) {
  const crudPlan = input.crudPlan || buildEnterpriseLiveRuntimeCrudPlan(input);
  const crudData = crudPlan.data || {};
  const mutationRequests = (crudData.entityLanes || []).map(buildMutationRequest);
  const blockers = mutationRequests.flatMap((request) =>
    request.missingEvidence.map((item) => `${request.lane} requires ${item}.`),
  );

  return createPassResult({
    phase: P93_GOVERNED_RUNTIME_MUTATION_REQUEST_PHASE,
    mode: "governed-runtime-mutation-request",
    source: "live-ready/governedRuntimeMutationRequest.js",
    summary: "Governed local mutation request envelopes are prepared; no SQLite writes are executed.",
    data: {
      schemaVersion: "1.0",
      currentState: "governed_runtime_mutation_requests_ready_for_admission_review",
      requestMode: "local-sqlite-mutation-request-review-only",
      sourceCrudPlan: {
        phase: crudPlan.phase,
        currentState: crudData.currentState,
        dbMode: crudData.dbMode,
        readyLaneCount: crudData.crudReadiness?.readyLaneCount || 0,
        totalLaneCount: crudData.crudReadiness?.totalLaneCount || 0,
      },
      mutationRequests,
      requestReadiness: {
        readyForReviewCount: mutationRequests.filter((request) =>
          request.requestState === "ready_for_operator_review_not_executable").length,
        blockedCount: mutationRequests.filter((request) =>
          request.requestState === "blocked_missing_review_evidence").length,
        totalRequestCount: mutationRequests.length,
      },
      allowedLocalOperations: [
        "prepare local SQLite mutation request envelopes",
        "review request payload shape summaries",
        "prepare validation commands for admission",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      mutationGate:
        "P93.3 does not execute SQLite writes. P93.4 must explicitly scope CRUD execution admission before any local write path can be used.",
      requestSummary: summarize(mutationRequests),
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Implement P93.4 local CRUD execution admission for approved OS runtime entities only.",
      blockers,
      disabledReason:
        "P93.3 creates governed local mutation request envelopes only. DB writes, hosted DB mutation, provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Enterprise Runtime Mutation Governance",
      evidenceRefs: [
        "reports/p933-governed-runtime-mutation-request-report.md",
        "reports/p932-enterprise-runtime-crud-plan-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local request modelling only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p933-governed-runtime-mutation-request-report.md",
      "contracts/os-roadmap/p93-execution-contracts.json",
    ],
    warnings: ["P93.3 prepares mutation request envelopes only. It does not write SQLite records or run executors."],
  });
}

export function validateGovernedRuntimeMutationRequest(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P93_GOVERNED_RUNTIME_MUTATION_REQUEST_PHASE) errors.push("phase must be P93.3");
  for (const field of ["schemaVersion", "currentState", "requestMode", "sourceCrudPlan", "mutationRequests", "requestReadiness", "allowedLocalOperations", "forbiddenOperations", "mutationGate", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.requestMode !== "local-sqlite-mutation-request-review-only") errors.push("requestMode must stay review-only");
  if (!Array.isArray(data.mutationRequests) || data.mutationRequests.length !== P93_LIVE_RUNTIME_ENTITY_LANES.length) {
    errors.push("mutationRequests must cover all P93 runtime entity lanes");
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const request of data.mutationRequests || []) {
    for (const field of ["requestKey", "lane", "ownerCapability", "sqliteEntity", "sourceLaneStatus", "requestedOperation", "requestState", "payloadShape", "requiredEvidence", "missingEvidence", "operatorApprovalRequired", "rollbackRequired", "auditRequired", "validationRequired", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in request)) errors.push(`${request.lane || "request"}.${field} missing`);
    }
    if (!["ready_for_operator_review_not_executable", "blocked_missing_review_evidence"].includes(request.requestState)) {
      errors.push(`${request.lane}.requestState is invalid`);
    }
    if (request.requestCanExecute !== false || request.sqliteWriteAllowed !== false || request.dbWritesAllowed !== false) {
      errors.push(`${request.lane}.write/execution flags must remain false`);
    }
    if (request.operatorApprovalRequired !== true || request.rollbackRequired !== true || request.auditRequired !== true || request.validationRequired !== true) {
      errors.push(`${request.lane}.approval, rollback, audit, and validation must be required`);
    }
    if (!Array.isArray(request.requiredEvidence) || request.requiredEvidence.length < REQUIRED_REQUEST_EVIDENCE.length) {
      errors.push(`${request.lane}.requiredEvidence incomplete`);
    }
    if (!Array.isArray(request.missingEvidence)) errors.push(`${request.lane}.missingEvidence must be an array`);
    if (request.payloadShape?.shapeMode !== "field-summary-only") errors.push(`${request.lane}.payloadShape must stay field-summary-only`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (request[flag] !== false) errors.push(`${request.lane}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) {
    errors.push("mutation request envelopes must not expose raw private IDs");
  }
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now|write sqlite now/i.test(serialized)) {
    errors.push("mutation request envelopes must not expose fake unsafe runnable actions");
  }
  return { valid: errors.length === 0, errors };
}
