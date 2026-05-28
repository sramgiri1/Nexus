import { createPassResult } from "../shared/resultEnvelope.js";
import { P103_WORK_ADMISSION_SAFETY_FLAGS } from "./founderLiveWorkAdmission.js";

export const P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE = "P104.2";

export const P104_EXECUTION_BOUNDARY_STATES = Object.freeze({
  SCHEMA_READY_EXECUTION_BLOCKED: "founder_live_execution_boundary_schema_ready_execution_blocked",
  NEEDS_WORK_ADMISSION_SCHEMA: "founder_live_execution_boundary_needs_work_admission_schema",
});

export const P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P103_WORK_ADMISSION_SAFETY_FLAGS,
    "liveExecutionAllowed",
    "executionApprovalAllowed",
    "agentDispatchExecutionAllowed",
    "workerExecutionAdmissionAllowed",
    "toolExecutionAdmissionAllowed",
    "projectMutationExecutionAllowed",
    "hostedDbMutationExecutionAllowed",
    "deployExecutionAllowed",
    "releaseExecutionAllowed",
    "exportExecutionAllowed",
    "packageCreationAllowed",
    "networkExecutionAllowed",
    "providerSpendAllowed",
  ]),
]);

export const P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE = Object.freeze([
  "founderIntentAccepted",
  "prdAcceptanceCriteriaAccepted",
  "workAdmissionApproved",
  "operatorApprovalCaptured",
  "rollbackPlanAccepted",
  "auditTrailAccepted",
  "costLimitAccepted",
  "validationCommandsAccepted",
  "redactionReviewAccepted",
  "scopeBoundaryAccepted",
]);

export const P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "project source mutation",
  "hosted DB mutation",
  "deploy/release/export/package",
  "network calls",
  "provider spend",
]);

function blockedFlags() {
  return Object.fromEntries(P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildBoundaryRecordShape() {
  return {
    boundaryId: "display-safe-boundary-key",
    displayLabel: "Founder execution boundary",
    sourcePhase: "P103",
    sourceAdmissionId: "display-safe-admission-key",
    boundaryState: P104_EXECUTION_BOUNDARY_STATES.SCHEMA_READY_EXECUTION_BLOCKED,
    requiredEvidence: [...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE],
    approvalPredicates: [
      "All required evidence is present.",
      "Operator approval is explicit and auditable.",
      "Rollback and recovery path is accepted.",
      "Cost ceiling is accepted before spend is possible.",
      "Validation commands are local and reviewable.",
      "Scope boundary excludes project mutation unless a later phase explicitly allows it.",
    ],
    blockedFlags: blockedFlags(),
    forbiddenActions: [...P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS],
    validationCommands: ["npm run check:p1042-founder-live-execution-boundary-schema"],
    ownerCapability: "NEXUS Founder Live Execution Boundary",
    evidenceRefs: ["reports/p1042-founder-live-execution-boundary-schema-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
  };
}

function buildLaneRecordShape() {
  return {
    laneKey: "display-safe-agent-lane",
    displayLabel: "Founder work lane",
    proposedAgentLane: "Display-safe owner lane",
    sourceWorkAdmissionState: "local_review_ready_execution_blocked",
    executionBoundaryState: P104_EXECUTION_BOUNDARY_STATES.SCHEMA_READY_EXECUTION_BLOCKED,
    executionAllowed: false,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    hostedDbMutationAllowed: false,
    deployAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    missingEvidence: [...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE],
    nextAction: "Use this schema to build P104.3 local boundary records without granting execution authority.",
    disabledReason:
      "P104.2 defines local execution-boundary schemas only. It cannot approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveExecutionBoundarySchema() {
  const boundaryRecordShape = buildBoundaryRecordShape();
  const laneRecordShape = buildLaneRecordShape();

  return createPassResult({
    phase: P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE,
    mode: "founder-live-execution-boundary-schema",
    source: "live-ready/founderLiveExecutionBoundarySchema.js",
    summary: "Founder live execution boundary schema is defined locally; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: P104_EXECUTION_BOUNDARY_STATES.SCHEMA_READY_EXECUTION_BLOCKED,
      sourceWorkAdmissionPhase: "P103.2",
      sourceApprovalEnvelopePhase: "P103.3",
      boundaryRecordShape,
      laneRecordShape,
      requiredEvidence: [...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE],
      forbiddenActions: [...P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS],
      approvalPredicateCount: boundaryRecordShape.approvalPredicates.length,
      executionAllowed: false,
      dispatchAllowed: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      projectMutationAllowed: false,
      hostedDbMutationAllowed: false,
      deployAllowed: false,
      packageAllowed: false,
      spendAllowed: false,
      nextAction: "Build P104.3 deterministic local execution-boundary records from P103 work admissions.",
      blockers: [
        "Execution approval is not granted.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P104.2 is schema-only. It does not approve execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Execution Boundary",
      evidenceRefs: ["reports/p1042-founder-live-execution-boundary-schema-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local schema only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1042-founder-live-execution-boundary-schema-report.md",
      "contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json",
    ],
    warnings: [
      "P104.2 does not approve execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveExecutionBoundarySchema(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE) errors.push("phase must be P104.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceWorkAdmissionPhase",
    "sourceApprovalEnvelopePhase",
    "boundaryRecordShape",
    "laneRecordShape",
    "requiredEvidence",
    "forbiddenActions",
    "approvalPredicateCount",
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
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 8) errors.push("requiredEvidence must define execution gates");
  if (!Array.isArray(data.forbiddenActions) || data.forbiddenActions.length < 6) errors.push("forbiddenActions must define blocked actions");
  if (data.approvalPredicateCount < 5) errors.push("approvalPredicateCount must cover operator review");
  for (const flag of P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.boundaryRecordShape?.blockedFlags?.[flag] !== false) errors.push(`boundaryRecordShape.blockedFlags.${flag} must be false`);
    if (data.laneRecordShape?.[flag] !== false) errors.push(`laneRecordShape.${flag} must be false`);
  }
  for (const flag of ["executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.laneRecordShape?.[flag] !== false) errors.push(`laneRecordShape.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("schema must not expose raw private IDs");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("schema must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("schema must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
