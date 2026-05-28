import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveWorkAdmission } from "./founderLiveWorkAdmission.js";
import {
  P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS,
  P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE,
  P104_EXECUTION_BOUNDARY_STATES,
  buildFounderLiveExecutionBoundarySchema,
} from "./founderLiveExecutionBoundarySchema.js";

export const P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE = "P104.3";

export const P104_EXECUTION_BOUNDARY_MODEL_STATES = Object.freeze({
  LOCAL_BOUNDARY_READY_EXECUTION_BLOCKED: "founder_live_execution_boundary_model_ready_execution_blocked",
  NEEDS_WORK_ADMISSION_ROWS: "founder_live_execution_boundary_model_needs_work_admission_rows",
});

function blockedFlags() {
  return Object.fromEntries(P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function missingEvidenceFor(admission = {}) {
  const existing = Array.isArray(admission.missingEvidence) ? admission.missingEvidence : [];
  return [...new Set([...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE, ...existing])];
}

function boundaryIdFor(admission = {}, index = 0) {
  const base = admission.admissionId || admission.displayLabel || `boundary-${index + 1}`;
  return `execution-boundary-${String(base).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildBoundaryRow(admission = {}, index = 0) {
  const missingEvidence = missingEvidenceFor(admission);
  return {
    boundaryId: boundaryIdFor(admission, index),
    displayLabel: admission.displayLabel || `Execution Boundary ${index + 1}`,
    sourceAdmissionId: admission.admissionId || `admission-${index + 1}`,
    sourceWorkOrderLabel: admission.sourceWorkOrderLabel || admission.displayLabel || `Work Order ${index + 1}`,
    proposedAgentLane: admission.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: admission.proposedOutcome || "Prepare governed work for later execution-boundary review.",
    boundaryState: P104_EXECUTION_BOUNDARY_MODEL_STATES.LOCAL_BOUNDARY_READY_EXECUTION_BLOCKED,
    schemaState: P104_EXECUTION_BOUNDARY_STATES.SCHEMA_READY_EXECUTION_BLOCKED,
    requiredEvidence: [...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE],
    missingEvidence,
    approvalPredicates: [
      "Work admission approval evidence is complete.",
      "Operator explicitly accepts execution boundary.",
      "Rollback and audit evidence are accepted.",
      "Cost and validation gates are accepted.",
      "Scope boundary permits the requested lane in a later phase.",
    ],
    validationCommands: [
      "npm run check:p1043-founder-live-execution-boundary-model",
      ...(admission.validationCommands || []),
    ],
    nextAction: "Review missing evidence before any later phase can request execution approval.",
    blockers: [
      "Execution approval is not granted.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(admission.blockers || []),
    ],
    disabledReason:
      "P104.3 records local execution-boundary rows only. It cannot approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: admission.ownerCapability || "NEXUS Founder Live Execution Boundary",
    evidenceRefs: [
      "reports/p1043-founder-live-execution-boundary-model-report.md",
      ...(admission.evidenceRefs || []),
    ],
    activityLocation: admission.activityLocation || "reports/os-phase-status-report.md",
    costImpact: admission.costImpact || "Local boundary row only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
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

export function buildFounderLiveExecutionBoundaryModel(input = {}) {
  const schemaEnvelope = input.schemaEnvelope || buildFounderLiveExecutionBoundarySchema();
  const workAdmissionEnvelope = input.workAdmissionEnvelope || buildFounderLiveWorkAdmission(input);
  const workAdmissionData = workAdmissionEnvelope.data || {};
  const boundaryRows = (workAdmissionData.workAdmissions || []).map(buildBoundaryRow);
  const boundaryReady = boundaryRows.length > 0;

  return createPassResult({
    phase: P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE,
    mode: "founder-live-execution-boundary-local-model",
    source: "live-ready/founderLiveExecutionBoundaryModel.js",
    summary: "Founder live execution-boundary rows are assembled locally from P103 work admissions; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: boundaryReady
        ? P104_EXECUTION_BOUNDARY_MODEL_STATES.LOCAL_BOUNDARY_READY_EXECUTION_BLOCKED
        : P104_EXECUTION_BOUNDARY_MODEL_STATES.NEEDS_WORK_ADMISSION_ROWS,
      sourceSchemaPhase: schemaEnvelope.phase,
      sourceWorkAdmissionPhase: workAdmissionEnvelope.phase,
      sourceWorkAdmissionState: workAdmissionData.currentState,
      founderContextSummary: workAdmissionData.founderContextSummary,
      boundaryReadiness: {
        boundaryReady,
        boundaryRowCount: boundaryRows.length,
        blockedBoundaryCount: boundaryRows.length,
        executableBoundaryCount: 0,
        dispatchableBoundaryCount: 0,
        projectMutationBoundaryCount: 0,
        hostedDbMutationBoundaryCount: 0,
        approvedBoundaryCount: 0,
      },
      boundaryRows,
      requiredEvidence: [...P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE],
      nextAction: boundaryReady
        ? "Render P104.4 execution-boundary readiness on non-chat Command Center pages without execution controls."
        : "Complete P103 work admission rows before execution-boundary modeling.",
      blockers: [
        "Execution approval remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P104.3 is a local execution-boundary model only. It does not approve execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Execution Boundary",
      evidenceRefs: [
        "reports/p1043-founder-live-execution-boundary-model-report.md",
        ...(workAdmissionData.evidenceRefs || []),
      ],
      activityLocation: workAdmissionData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic execution-boundary model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
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
      "reports/p1043-founder-live-execution-boundary-model-report.md",
      "reports/p1042-founder-live-execution-boundary-schema-report.md",
      "contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json",
    ],
    warnings: [
      "P104.3 does not approve execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveExecutionBoundaryModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE) errors.push("phase must be P104.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceSchemaPhase",
    "sourceWorkAdmissionPhase",
    "founderContextSummary",
    "boundaryReadiness",
    "boundaryRows",
    "requiredEvidence",
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
  if (!Array.isArray(data.boundaryRows) || data.boundaryRows.length < 5) errors.push("boundaryRows must cover work admissions");
  if (data.boundaryReadiness?.executableBoundaryCount !== 0) errors.push("executableBoundaryCount must be 0");
  if (data.boundaryReadiness?.dispatchableBoundaryCount !== 0) errors.push("dispatchableBoundaryCount must be 0");
  if (data.boundaryReadiness?.projectMutationBoundaryCount !== 0) errors.push("projectMutationBoundaryCount must be 0");
  if (data.boundaryReadiness?.hostedDbMutationBoundaryCount !== 0) errors.push("hostedDbMutationBoundaryCount must be 0");
  if (data.boundaryReadiness?.approvedBoundaryCount !== 0) errors.push("approvedBoundaryCount must be 0");
  for (const flag of ["executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const flag of P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of data.boundaryRows || []) {
    for (const field of ["boundaryId", "displayLabel", "sourceAdmissionId", "proposedAgentLane", "boundaryState", "requiredEvidence", "missingEvidence", "approvalPredicates", "validationCommands", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.displayLabel || "row"}.${field} missing`);
    }
    for (const flag of ["executionAllowed", "dispatchAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "projectMutationAllowed", "hostedDbMutationAllowed", "deployAllowed", "packageAllowed", "spendAllowed"]) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
    for (const flag of P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.displayLabel}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized)) errors.push("model must not expose fake unsafe runnable actions");
  if (/raw JSON|raw logs|raw policy dump/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
