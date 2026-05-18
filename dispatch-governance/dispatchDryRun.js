import { createDispatchEnvelope, validateDispatchEnvelope } from "./dispatchEnvelope.js";
import { evaluateDispatchPolicy, validateDispatchPolicyDecision } from "./dispatchPolicy.js";
import { buildDispatchReadinessMatrix } from "./dispatchReadinessMatrix.js";

function findReadinessRecord(envelope, matrix) {
  if (envelope.providerId) {
    return matrix.records.find((record) => record.kind === "provider" && record.providerId === envelope.providerId);
  }
  if (envelope.toolId) {
    return matrix.records.find((record) => record.kind === "tool" && record.toolId === envelope.toolId);
  }
  return null;
}

export function buildDispatchDryRun(input = {}) {
  const envelope = input.envelope || createDispatchEnvelope(input);
  const envelopeValidation = validateDispatchEnvelope(envelope);
  const policyDecision = evaluateDispatchPolicy({ envelope, identityContext: input.identityContext });
  const policyValidation = validateDispatchPolicyDecision(policyDecision);
  const readinessMatrix = input.readinessMatrix || buildDispatchReadinessMatrix();
  const readiness = findReadinessRecord(envelope, readinessMatrix);
  const costEstimate = envelope.costEstimate || {};

  return {
    phaseId: "P64.4",
    dispatchId: envelope.dispatchId,
    previewOnly: true,
    dryRunOnly: true,
    executed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    requestType: envelope.requestType,
    displayTitle: envelope.safeSummary?.title || "Governed dispatch dry run",
    currentState: policyDecision.state,
    readinessState: readiness?.readinessState || "blocked_not_enabled",
    disabledReason: policyDecision.disabledReason || envelope.disabledReason,
    blocker: policyDecision.disabledReason || "Dispatch execution is not enabled.",
    nextAction: policyDecision.nextAction,
    ownerCapability: readiness?.ownerCapability || envelope.capabilityId,
    evidenceLocation: input.evidenceLocation || "reports/p64-dispatch-dry-run-report.md",
    activityLocation: input.activityLocation || "local-state/runtime/activity.jsonl",
    approvalRequired: policyDecision.approvalRequired === true,
    costImpact: {
      estimateRequired: true,
      estimatedUsd: costEstimate.estimatedUsd ?? null,
      pricingKnown: costEstimate.pricingKnown === true,
      warning: costEstimate.unknownCostWarning || "",
    },
    envelopeValidation,
    policyValidation,
    readinessFound: Boolean(readiness),
  };
}

export function validateDispatchDryRun(dryRun = {}) {
  const errors = [];
  for (const field of [
    "phaseId",
    "dispatchId",
    "requestType",
    "displayTitle",
    "currentState",
    "readinessState",
    "disabledReason",
    "blocker",
    "nextAction",
    "ownerCapability",
    "evidenceLocation",
    "activityLocation",
    "costImpact",
  ]) {
    if (!dryRun[field]) errors.push(`Missing ${field}`);
  }
  for (const field of [
    "previewOnly",
    "dryRunOnly",
    "approvalRequired",
  ]) {
    if (typeof dryRun[field] !== "boolean") errors.push(`${field} must be boolean`);
  }
  for (const field of [
    "executed",
    "executionAllowed",
    "providerDispatchAllowed",
    "toolExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
  ]) {
    if (dryRun[field] !== false) errors.push(`${field} must remain false`);
  }
  if (dryRun.previewOnly !== true) errors.push("previewOnly must be true");
  if (dryRun.dryRunOnly !== true) errors.push("dryRunOnly must be true");
  if (dryRun.envelopeValidation?.valid !== true) errors.push("envelopeValidation must be valid");
  if (dryRun.policyValidation?.valid !== true) errors.push("policyValidation must be valid");
  if (dryRun.readinessFound !== true) errors.push("readiness record must be found");
  if (dryRun.displayTitle.includes("projects/") || dryRun.disabledReason.includes("projects/")) {
    errors.push("Primary dry-run labels must not expose project paths");
  }
  if (dryRun.costImpact?.estimateRequired !== true) errors.push("cost estimate must be required");
  return { valid: errors.length === 0, errors };
}
