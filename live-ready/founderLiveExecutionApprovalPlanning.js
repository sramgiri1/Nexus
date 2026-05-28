import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS,
  P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE,
  P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS,
} from "./founderLiveExecutionBoundarySchema.js";

export const P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE = "P105.1";

export const P105_EXECUTION_APPROVAL_STATES = Object.freeze({
  APPROVAL_PLANNING_READY_EXECUTION_BLOCKED: "founder_live_execution_approval_planning_ready_execution_blocked",
  NEEDS_EXECUTION_BOUNDARY: "founder_live_execution_approval_planning_needs_execution_boundary",
});

export const P105_EXECUTION_APPROVAL_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS,
    "approvalCanUnlockExecution",
    "approvalWriteAllowed",
    "runtimeAdmissionAllowed",
    "runtimeTransitionAllowed",
    "liveModeEscalationAllowed",
    "approvalDispatchAllowed",
    "approvalToolExecutionAllowed",
    "approvalProjectMutationAllowed",
    "approvalHostedDbMutationAllowed",
    "approvalDeployAllowed",
    "approvalSpendAllowed",
  ]),
]);

export const P105_EXECUTION_APPROVAL_REQUIRED_GATES = Object.freeze([
  "founderIntentConfirmed",
  "prdAcceptanceCriteriaConfirmed",
  "workAdmissionReviewed",
  "executionBoundaryReviewed",
  "operatorApprovalPolicyReviewed",
  "scopeBoundaryReviewed",
  "projectMutationPolicyReviewed",
  "hostedDbMutationPolicyReviewed",
  "providerToolAllowlistReviewed",
  "rollbackPlanReviewed",
  "auditRetentionReviewed",
  "costCeilingReviewed",
  "validationCommandsReviewed",
]);

export const P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS = Object.freeze([
  ...P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS,
  "approval writes that unlock execution",
  "runtime admission escalation",
  "live mode transition",
]);

function blockedFlags() {
  return Object.fromEntries(P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildApprovalGateShape() {
  return {
    gateKey: "display-safe-approval-gate",
    displayLabel: "Founder live approval gate",
    requiredEvidence: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
    sourceBoundaryState: "founder_live_execution_boundary_ready_execution_blocked",
    approvalState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
    approvalRequired: true,
    approvalCaptured: false,
    executionUnlockAllowed: false,
    missingEvidence: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
    validationCommands: ["npm run check:p1051-founder-live-execution-approval-planning-contract"],
    blockers: [
      "Approval planning is local and non-runnable.",
      "Execution authority is still blocked by P104 boundaries.",
      "Runtime admission is not available in P105.1.",
      "Provider/model calls and spend remain blocked.",
    ],
    disabledReason:
      "P105.1 defines approval-planning gates only. It cannot capture live approvals, unlock execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, package, use network calls, or spend.",
    ...blockedFlags(),
  };
}

function buildApprovalPlanShape() {
  return {
    planKey: "display-safe-live-approval-plan",
    displayLabel: "Founder live execution approval plan",
    sourcePhase: "P104",
    currentState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
    approvalGateShape: buildApprovalGateShape(),
    requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
    forbiddenActions: [...P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS],
    ownerCapability: "NEXUS Founder Live Execution Approval Planning",
    evidenceRefs: ["reports/p1051-founder-live-execution-approval-planning-contract-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local approval planning only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    nextAction: "Use this schema to build P105.2 deterministic approval-plan records without granting execution authority.",
    ...blockedFlags(),
  };
}

function buildRuntimeTransitionShape() {
  return {
    transitionKey: "display-safe-runtime-transition",
    displayLabel: "Live execution transition",
    sourceApprovalState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
    targetRuntimeState: "not_available_in_p105_1",
    transitionAllowed: false,
    executionAllowed: false,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    hostedDbMutationAllowed: false,
    deployAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    disabledReason: "Runtime transition is blocked until a later explicit phase defines admission and operator approval behavior.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveExecutionApprovalPlanningSchema() {
  const approvalPlanShape = buildApprovalPlanShape();
  const runtimeTransitionShape = buildRuntimeTransitionShape();

  return createPassResult({
    phase: P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE,
    mode: "founder-live-execution-approval-planning",
    source: "live-ready/founderLiveExecutionApprovalPlanning.js",
    summary: "Founder live execution approval planning schema is defined locally; live execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
      sourceBoundaryPhase: "P104",
      approvalPlanShape,
      approvalGateShape: approvalPlanShape.approvalGateShape,
      runtimeTransitionShape,
      requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
      forbiddenActions: [...P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS],
      approvalGateCount: P105_EXECUTION_APPROVAL_REQUIRED_GATES.length,
      approvalCanUnlockExecution: false,
      approvalWriteAllowed: false,
      runtimeAdmissionAllowed: false,
      runtimeTransitionAllowed: false,
      liveModeEscalationAllowed: false,
      executionAllowed: false,
      dispatchAllowed: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      projectMutationAllowed: false,
      hostedDbMutationAllowed: false,
      deployAllowed: false,
      packageAllowed: false,
      spendAllowed: false,
      nextAction: "Build P105.2 local approval-plan records from P104 execution boundaries.",
      blockers: [
        "P105.1 is contract/schema only.",
        "Approvals cannot be captured or persisted.",
        "Approval state cannot unlock runtime execution.",
        "Runtime admission is not available.",
        "Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, and spend remain blocked.",
      ],
      disabledReason:
        "P105.1 defines local approval-planning schema only. It does not capture approvals, unlock execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Execution Approval Planning",
      evidenceRefs: ["reports/p1051-founder-live-execution-approval-planning-contract-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1051-founder-live-execution-approval-planning-contract-report.md",
      "contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json",
    ],
    warnings: [
      "P105.1 does not capture live approvals, unlock execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveExecutionApprovalPlanningSchema(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE) errors.push("phase must be P105.1");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceBoundaryPhase",
    "approvalPlanShape",
    "approvalGateShape",
    "runtimeTransitionShape",
    "requiredGates",
    "forbiddenActions",
    "approvalGateCount",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.requiredGates) || data.requiredGates.length < 10) errors.push("requiredGates must define approval planning gates");
  if (!Array.isArray(data.forbiddenActions) || data.forbiddenActions.length < 8) errors.push("forbiddenActions must define blocked actions");
  if (data.approvalGateCount < 10) errors.push("approvalGateCount must cover operator review");
  for (const flag of P105_EXECUTION_APPROVAL_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.approvalPlanShape?.[flag] !== false) errors.push(`approvalPlanShape.${flag} must be false`);
    if (data.approvalGateShape?.[flag] !== false) errors.push(`approvalGateShape.${flag} must be false`);
    if (data.runtimeTransitionShape?.[flag] !== false) errors.push(`runtimeTransitionShape.${flag} must be false`);
  }
  for (const flag of ["executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeTransitionShape?.[flag] !== false) errors.push(`runtimeTransitionShape.${flag} must be false`);
  }
  if (data.approvalGateShape?.approvalCaptured !== false) errors.push("approvalGateShape.approvalCaptured must be false");
  if (data.approvalGateShape?.executionUnlockAllowed !== false) errors.push("approvalGateShape.executionUnlockAllowed must be false");
  if (data.runtimeTransitionShape?.transitionAllowed !== false) errors.push("runtimeTransitionShape.transitionAllowed must be false");
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("schema must not expose raw private IDs");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("schema must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("schema must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
