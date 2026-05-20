import { createPassResult } from "../shared/resultEnvelope.js";
import { buildGovernedLiveOperatorApprovalQueue } from "./governedLiveOperatorApprovalQueue.js";
import { buildScopedExecutionActivationProfile } from "./scopedExecutionActivationProfile.js";

export const P88_LOCAL_ACTIVATION_REQUEST_MODEL_PHASE = "P88.2";

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "requestCanExecute",
  "activationAllowed",
  "executionAllowed",
]);

const REQUEST_REQUIRED_EVIDENCE = Object.freeze([
  "operatorApproval",
  "selectedActivationProfile",
  "scopedTaskContract",
  "scopedContextPacket",
  "localOnlyMode",
  "activityEvidence",
  "costEvidence",
  "rollbackPlan",
  "validationCommands",
  "postRunReviewPlan",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function requestKey(laneId = "") {
  return `local-activation-request-${String(laneId).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildRequest(lane = {}) {
  return {
    requestKey: requestKey(lane.laneId),
    label: lane.label,
    ownerCapability: lane.ownerCapability,
    sourceLaneId: lane.laneId,
    requestState: "ready_for_operator_review_not_executable",
    approvalDecision: "not_requested",
    requestedOperations: lane.allowedFutureOperations || [],
    forbiddenOperations: lane.forbiddenOperations || [],
    requiredEvidence: [...REQUEST_REQUIRED_EVIDENCE],
    missingEvidence: ["operatorApproval", "activationRequestPolicy", "executorAdmission", "postRunReviewPlan"],
    requestCanExecute: false,
    activationAllowed: false,
    executionAllowed: false,
    nextAction: "Implement P88.3 local executor admission before this request can be connected to any executor.",
    disabledReason:
      "P88.2 creates a local activation request record only. It cannot execute, activate, dispatch agents, write files, call providers, or spend.",
    validationCommands: [
      "npm run check:p882-local-activation-request-model",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p882-local-activation-request-model-report.md", ...(lane.evidenceRefs || [])],
    activityLocation: lane.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
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

export function buildLocalActivationRequestModel(input = {}) {
  const profile = input.profile || buildScopedExecutionActivationProfile(input);
  const approvalQueue = input.approvalQueue || buildGovernedLiveOperatorApprovalQueue(input);
  const requests = (profile.data?.allowedFutureLanes || []).map(buildRequest);

  return createPassResult({
    phase: P88_LOCAL_ACTIVATION_REQUEST_MODEL_PHASE,
    mode: "local-activation-request-model",
    source: "live-ready/localActivationRequestModel.js",
    summary: "Local activation request records are defined for operator review; requests cannot execute.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_activation_request_model_ready",
      readinessLabel: "Request model ready",
      requestMode: "local-only-review",
      requestCount: requests.length,
      requestSummary: summarize(requests),
      requests,
      approvalQueuePhase: approvalQueue.phase,
      approvalQueueSummary: approvalQueue.data?.queueSummary || {},
      profilePhase: profile.phase,
      nextAction: "Implement P88.3 local executor admission without executing it.",
      blockers: ["executorAdmission", "operatorApproval", "activationRequestPolicy", "postRunReviewPlan"],
      disabledReason:
        "P88.2 is request-model only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Local Activation Governance",
      evidenceRefs: [
        "reports/p882-local-activation-request-model-report.md",
        "reports/p881-scoped-execution-activation-profile-report.md",
        "reports/p863-operator-approval-queue-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p882-local-activation-request-model-report.md",
      "contracts/os-roadmap/p88-execution-contracts.json",
    ],
    warnings: ["P88.2 creates request records only. It does not execute activation requests."],
  });
}

export function validateLocalActivationRequestModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P88_LOCAL_ACTIVATION_REQUEST_MODEL_PHASE) errors.push("phase must be P88.2");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "requestMode", "requestCount", "requests", "approvalQueuePhase", "profilePhase", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.requestMode !== "local-only-review") errors.push("requestMode must stay local-only-review");
  if (!Array.isArray(data.requests) || data.requests.length !== 3) errors.push("requests must cover the three P88.1 future lanes");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const request of data.requests || []) {
    for (const field of ["requestKey", "label", "ownerCapability", "sourceLaneId", "requestState", "approvalDecision", "requestedOperations", "forbiddenOperations", "requiredEvidence", "missingEvidence", "requestCanExecute", "activationAllowed", "executionAllowed", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in request)) errors.push(`${request.label || "request"}.${field} missing`);
    }
    if (request.requestState !== "ready_for_operator_review_not_executable") errors.push(`${request.label}.requestState must stay not executable`);
    if (request.requestCanExecute !== false || request.activationAllowed !== false || request.executionAllowed !== false) {
      errors.push(`${request.label}.request flags must remain false`);
    }
    if (!Array.isArray(request.requiredEvidence) || request.requiredEvidence.length !== REQUEST_REQUIRED_EVIDENCE.length) errors.push(`${request.label}.requiredEvidence incomplete`);
    for (const flag of RUNTIME_FLAGS) {
      if (request[flag] !== false) errors.push(`${request.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local activation request model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("local activation request model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
