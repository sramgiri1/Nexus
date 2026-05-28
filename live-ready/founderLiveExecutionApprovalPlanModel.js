import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveExecutionBoundaryModel } from "./founderLiveExecutionBoundaryModel.js";
import {
  P105_EXECUTION_APPROVAL_BLOCKED_FLAGS,
  P105_EXECUTION_APPROVAL_REQUIRED_GATES,
  P105_EXECUTION_APPROVAL_STATES,
  buildFounderLiveExecutionApprovalPlanningSchema,
} from "./founderLiveExecutionApprovalPlanning.js";

export const P105_FOUNDER_LIVE_EXECUTION_APPROVAL_MODEL_PHASE = "P105.2";

export const P105_EXECUTION_APPROVAL_MODEL_STATES = Object.freeze({
  LOCAL_APPROVAL_PLAN_READY_EXECUTION_BLOCKED: "founder_live_execution_approval_plan_ready_execution_blocked",
  NEEDS_EXECUTION_BOUNDARY_ROWS: "founder_live_execution_approval_plan_needs_execution_boundary_rows",
});

function blockedFlags() {
  return Object.fromEntries(P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function approvalPlanIdFor(boundary = {}, index = 0) {
  const base = boundary.boundaryId || boundary.displayLabel || `approval-plan-${index + 1}`;
  return `approval-plan-${String(base).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function missingGatesFor(boundary = {}) {
  const boundaryEvidence = Array.isArray(boundary.missingEvidence) ? boundary.missingEvidence : [];
  return [...new Set([...P105_EXECUTION_APPROVAL_REQUIRED_GATES, ...boundaryEvidence])];
}

function buildApprovalPlanRow(boundary = {}, index = 0) {
  const missingGates = missingGatesFor(boundary);
  return {
    approvalPlanId: approvalPlanIdFor(boundary, index),
    displayLabel: boundary.displayLabel || `Approval Plan ${index + 1}`,
    sourceBoundaryKey: boundary.boundaryId || `boundary-${index + 1}`,
    sourceWorkOrderLabel: boundary.sourceWorkOrderLabel || boundary.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: boundary.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: boundary.proposedOutcome || "Prepare governed work for later approval planning.",
    approvalPlanState: P105_EXECUTION_APPROVAL_MODEL_STATES.LOCAL_APPROVAL_PLAN_READY_EXECUTION_BLOCKED,
    approvalSchemaState: P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED,
    requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
    missingGates,
    approvalCaptured: false,
    approvalWriteAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    runtimeTransitionAllowed: false,
    reviewQuestions: [
      "Has the founder accepted the exact scope and success criteria?",
      "Has the operator reviewed the execution boundary and rollback path?",
      "Are project mutation, hosted DB, provider/tool, deploy, and spend boundaries explicit?",
      "Are validation commands local, repeatable, and attached to evidence?",
    ],
    validationCommands: [
      "npm run check:p1052-founder-live-execution-approval-plan-model",
      ...(boundary.validationCommands || []),
    ],
    nextAction: "Resolve missing approval gates before any later phase can request runtime admission.",
    blockers: [
      "Approval capture is not available.",
      "Approval writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(boundary.blockers || []),
    ],
    disabledReason:
      "P105.2 records local approval-plan rows only. It cannot capture approvals, write approval state, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Execution Approval Planning",
    evidenceRefs: [
      "reports/p1052-founder-live-execution-approval-plan-model-report.md",
      ...(boundary.evidenceRefs || []),
    ],
    activityLocation: boundary.activityLocation || "reports/os-phase-status-report.md",
    costImpact: boundary.costImpact || "Local approval-plan row only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    executionAllowed: false,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    hostedDbMutationAllowed: false,
    deployAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    ...blockedFlags(),
  };
}

export function buildFounderLiveExecutionApprovalPlanModel(input = {}) {
  const schemaEnvelope = input.schemaEnvelope || buildFounderLiveExecutionApprovalPlanningSchema();
  const boundaryEnvelope = input.boundaryEnvelope || buildFounderLiveExecutionBoundaryModel(input);
  const boundaryData = boundaryEnvelope.data || {};
  const approvalPlanRows = (boundaryData.boundaryRows || []).map(buildApprovalPlanRow);
  const approvalPlanReady = approvalPlanRows.length > 0;

  return createPassResult({
    phase: P105_FOUNDER_LIVE_EXECUTION_APPROVAL_MODEL_PHASE,
    mode: "founder-live-execution-approval-plan-local-model",
    source: "live-ready/founderLiveExecutionApprovalPlanModel.js",
    summary: "Founder live execution approval-plan rows are assembled locally from P104 execution boundaries; approval capture and execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: approvalPlanReady
        ? P105_EXECUTION_APPROVAL_MODEL_STATES.LOCAL_APPROVAL_PLAN_READY_EXECUTION_BLOCKED
        : P105_EXECUTION_APPROVAL_MODEL_STATES.NEEDS_EXECUTION_BOUNDARY_ROWS,
      sourceSchemaPhase: schemaEnvelope.phase,
      sourceBoundaryPhase: boundaryEnvelope.phase,
      sourceBoundaryState: boundaryData.currentState,
      founderContextSummary: boundaryData.founderContextSummary,
      approvalPlanReadiness: {
        approvalPlanReady,
        approvalPlanRowCount: approvalPlanRows.length,
        blockedApprovalPlanCount: approvalPlanRows.length,
        capturedApprovalCount: 0,
        approvalUnlockCount: 0,
        runtimeAdmissionCount: 0,
        executableApprovalPlanCount: 0,
        dispatchableApprovalPlanCount: 0,
        projectMutationApprovalPlanCount: 0,
        hostedDbMutationApprovalPlanCount: 0,
      },
      approvalPlanRows,
      requiredGates: [...P105_EXECUTION_APPROVAL_REQUIRED_GATES],
      nextAction: approvalPlanReady
        ? "Build P105.3 dry-run review packets from these local approval-plan rows without approval controls."
        : "Complete P104 boundary rows before approval-plan modeling.",
      blockers: [
        "Approval capture remains blocked.",
        "Approval writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P105.2 is a local approval-plan model only. It does not capture approvals, write approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Execution Approval Planning",
      evidenceRefs: [
        "reports/p1052-founder-live-execution-approval-plan-model-report.md",
        ...(boundaryData.evidenceRefs || []),
      ],
      activityLocation: boundaryData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic approval-plan model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      approvalCaptured: false,
      approvalWriteAllowed: false,
      approvalCanUnlockExecution: false,
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
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1052-founder-live-execution-approval-plan-model-report.md",
      "reports/p1051-founder-live-execution-approval-planning-contract-report.md",
      "contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json",
    ],
    warnings: [
      "P105.2 does not capture approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveExecutionApprovalPlanModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P105_FOUNDER_LIVE_EXECUTION_APPROVAL_MODEL_PHASE) errors.push("phase must be P105.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceSchemaPhase",
    "sourceBoundaryPhase",
    "founderContextSummary",
    "approvalPlanReadiness",
    "approvalPlanRows",
    "requiredGates",
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
  if (!Array.isArray(data.approvalPlanRows) || data.approvalPlanRows.length < 5) errors.push("approvalPlanRows must cover boundary rows");
  if (data.approvalPlanReadiness?.capturedApprovalCount !== 0) errors.push("capturedApprovalCount must be 0");
  if (data.approvalPlanReadiness?.approvalUnlockCount !== 0) errors.push("approvalUnlockCount must be 0");
  if (data.approvalPlanReadiness?.runtimeAdmissionCount !== 0) errors.push("runtimeAdmissionCount must be 0");
  if (data.approvalPlanReadiness?.executableApprovalPlanCount !== 0) errors.push("executableApprovalPlanCount must be 0");
  if (data.approvalPlanReadiness?.dispatchableApprovalPlanCount !== 0) errors.push("dispatchableApprovalPlanCount must be 0");
  if (data.approvalPlanReadiness?.projectMutationApprovalPlanCount !== 0) errors.push("projectMutationApprovalPlanCount must be 0");
  if (data.approvalPlanReadiness?.hostedDbMutationApprovalPlanCount !== 0) errors.push("hostedDbMutationApprovalPlanCount must be 0");
  for (const flag of ["approvalCaptured", "approvalWriteAllowed", "approvalCanUnlockExecution", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of P105_EXECUTION_APPROVAL_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.approvalPlanRows || []) {
    for (const field of ["approvalPlanId", "displayLabel", "sourceBoundaryKey", "proposedAgentLane", "approvalPlanState", "requiredGates", "missingGates", "reviewQuestions", "validationCommands", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    for (const flag of ["approvalCaptured", "approvalWriteAllowed", "executionUnlockAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of P105_EXECUTION_APPROVAL_BLOCKED_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("model must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
