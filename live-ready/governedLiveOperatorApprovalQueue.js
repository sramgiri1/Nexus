import { createPassResult } from "../shared/resultEnvelope.js";
import { buildGovernedLiveCapabilityStateResolver } from "./governedLiveCapabilityStateResolver.js";

export const P86_OPERATOR_APPROVAL_QUEUE_PHASE = "P86.3";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "approvalCanExecute",
  "activationRequestAllowed",
  "executionAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function approvalKey(capabilityId = "") {
  return `approval-${String(capabilityId).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildQueueItem(state = {}) {
  const blocked = state.canRequestActivation !== true;
  return {
    approvalKey: approvalKey(state.capabilityId),
    capabilityId: state.capabilityId,
    label: state.label,
    ownerCapability: state.ownerCapability,
    queueState: blocked ? "not_requestable" : "ready_for_local_review",
    approvalDecision: "not_requested",
    approvalCanExecute: false,
    activationRequestAllowed: false,
    executionAllowed: false,
    expiresAfter: "requires explicit P86.4/P86.5 queue policy before expiry can be evaluated",
    rollbackRequired: true,
    validationRequired: true,
    requiredEvidence: [
      "operatorApproval",
      "approvalExpiry",
      "runtimeLock",
      "rollbackConfirmation",
      "perCapabilityValidation",
      "activityEvidence",
      "costEvidence",
      "redactionCheck",
    ],
    missingEvidence: blocked ? state.requiredBeforeLive || [] : ["operatorApprovalQueuePolicy", "runtimeLock"],
    nextAction: blocked
      ? state.nextAction
      : "Route this item through P86.4 Command Center queue UX before any dry-run activation intent.",
    disabledReason:
      "P86.3 creates a local approval queue record only. Approval does not execute providers, agents, tools, workers, project writes, DB writes, deploys, packages, or spend.",
    evidenceRefs: state.evidenceRefs || [],
    activityLocation: state.activityLocation,
    costImpact: state.costImpact,
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(items) {
  return items.reduce((acc, item) => {
    acc[item.queueState] = (acc[item.queueState] || 0) + 1;
    return acc;
  }, {});
}

export function buildGovernedLiveOperatorApprovalQueue(input = {}) {
  const resolver = input.resolver || buildGovernedLiveCapabilityStateResolver(input);
  const queueItems = (resolver.data?.capabilityStates || []).map(buildQueueItem);

  return createPassResult({
    phase: P86_OPERATOR_APPROVAL_QUEUE_PHASE,
    mode: "live-admission",
    source: "live-ready/governedLiveOperatorApprovalQueue.js",
    summary: "Local operator approval queue records are available; approvals cannot execute runtime actions.",
    data: {
      schemaVersion: "1.0",
      currentState: "operator_approval_queue_local_records_ready",
      readinessLabel: "Blocked",
      queueSummary: summarize(queueItems),
      queueItems,
      nextAction: "Implement P86.4 Command Center queue UX before activation dry-run records.",
      blockers: ["commandCenterQueueUx", "runtimeLock", "approvalExpiryPolicy", "activationDryRun"],
      disabledReason:
        "P86.3 creates local approval queue records only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Live Operator Approval Governance",
      evidenceRefs: ["reports/p863-operator-approval-queue-report.md", "reports/p862-capability-state-resolver-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: ["reports/p863-operator-approval-queue-report.md", "contracts/os-roadmap/p86-execution-contracts.json"],
    warnings: ["P86.3 approval queue records are not executable approvals."],
  });
}

export function validateGovernedLiveOperatorApprovalQueue(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P86_OPERATOR_APPROVAL_QUEUE_PHASE) errors.push("phase must be P86.3");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "queueSummary", "queueItems", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.queueItems) || data.queueItems.length < 8) errors.push("queueItems must cover resolved capabilities");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const item of data.queueItems || []) {
    for (const field of ["approvalKey", "capabilityId", "label", "ownerCapability", "queueState", "approvalDecision", "expiresAfter", "rollbackRequired", "validationRequired", "requiredEvidence", "missingEvidence", "nextAction", "disabledReason"]) {
      if (!(field in item)) errors.push(`${item.capabilityId || "approval"}.${field} missing`);
    }
    if (item.approvalCanExecute !== false || item.activationRequestAllowed !== false || item.executionAllowed !== false) {
      errors.push(`${item.capabilityId}.approval flags must remain false`);
    }
    if (item.rollbackRequired !== true || item.validationRequired !== true) errors.push(`${item.capabilityId}.rollback and validation must be required`);
    if (!Array.isArray(item.requiredEvidence) || item.requiredEvidence.length < 6) errors.push(`${item.capabilityId}.requiredEvidence incomplete`);
    if (!Array.isArray(item.missingEvidence)) errors.push(`${item.capabilityId}.missingEvidence must be an array`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (item[flag] !== false) errors.push(`${item.capabilityId}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("approval queue must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("approval queue must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
