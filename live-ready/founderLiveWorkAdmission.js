import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P102_HANDOFF_SAFETY_FLAGS,
  buildFounderLiveHandoffManifest,
} from "./founderLiveHandoffManifest.js";
import { buildFounderLiveHandoffWorkOrders } from "./founderLiveHandoffWorkOrders.js";

export const P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE = "P103.2";

export const P103_WORK_ADMISSION_STATES = Object.freeze({
  LOCAL_ADMISSION_READY_EXECUTION_BLOCKED: "founder_live_work_admission_ready_execution_blocked",
  NEEDS_HANDOFF_WORK_ORDERS: "founder_live_work_admission_needs_handoff_work_orders",
  BLOCKED_BY_SAFETY: "founder_live_work_admission_blocked_by_safety",
});

export const P103_WORK_ADMISSION_SAFETY_FLAGS = Object.freeze([
  ...P102_HANDOFF_SAFETY_FLAGS,
  "workAdmissionApprovalAllowed",
  "agentWorkAdmissionExecutionAllowed",
  "projectWriteAdmissionAllowed",
  "toolRunAdmissionAllowed",
]);

function blockedSafetyFlags() {
  return Object.fromEntries(P103_WORK_ADMISSION_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function buildApprovalBoundary() {
  return {
    approvalState: "operator_review_required_execution_blocked",
    operatorApprovalRequired: true,
    evidenceReviewRequired: true,
    rollbackReviewRequired: true,
    costReviewRequired: true,
    validationReviewRequired: true,
    providerApprovalRequired: true,
    dispatchApprovalRequired: true,
    projectMutationApprovalRequired: true,
    disabledReason:
      "P103.2 defines local work admission records only. Approval, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and provider spend remain blocked.",
    ...blockedSafetyFlags(),
  };
}

function admissionIdFor(row = {}, index = 0) {
  const base = row.workOrderKey || row.laneKey || `work-order-${index + 1}`;
  return `admission-${String(base).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function requiredEvidenceFor(row = {}) {
  return [
    "Founder intent confirmed",
    "PRD/workstream acceptance criteria reviewed",
    "Rollback expectation documented",
    "Validation command reviewed",
    row.validationCommand || "P103 validation command required",
  ];
}

function buildWorkAdmission(row = {}, index = 0) {
  const requiredEvidence = requiredEvidenceFor(row);
  return {
    admissionId: admissionIdFor(row, index),
    displayLabel: row.title || `Work Admission ${index + 1}`,
    sourceWorkOrderLabel: row.title || `Work Order ${index + 1}`,
    proposedAgentLane: row.proposedAgent || "Founder Workstream Agent",
    proposedOutcome: row.proposedWork || "Prepare governed work for later operator review.",
    admissionState: "local_review_ready_execution_blocked",
    approvalState: "operator_review_required_execution_blocked",
    requiredEvidence,
    missingEvidence: requiredEvidence,
    validationCommands: ["npm run check:p1032-founder-live-work-admission-model", row.validationCommand].filter(Boolean),
    nextAction: "Review admission evidence before any future phase can request live execution authority.",
    blockers: [
      row.blocker || "Execution remains blocked by the P103 safety contract.",
      "Operator approval is not granted.",
      "Provider/model calls remain blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
    ],
    disabledReason:
      "This is a local work admission record only. It cannot dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: row.ownerCapability || "NEXUS Founder Live Work Admission Governance",
    evidenceRefs: row.evidenceRefs || [],
    activityLocation: row.activityLocation || "reports/os-phase-status-report.md",
    costImpact: row.costImpact || "Local admission record only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    executable: false,
    dispatchable: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallsAllowed: false,
    projectMutationAllowed: false,
    hostedDbMutationAllowed: false,
    deployAllowed: false,
    packageAllowed: false,
    spendAllowed: false,
    ...blockedSafetyFlags(),
  };
}

export function buildFounderLiveWorkAdmission(input = {}) {
  const manifestEnvelope = input.manifestEnvelope || buildFounderLiveHandoffManifest(input);
  const workOrdersEnvelope = input.workOrdersEnvelope || buildFounderLiveHandoffWorkOrders({
    ...input,
    manifestEnvelope,
  });
  const manifestData = manifestEnvelope.data || {};
  const workOrdersData = workOrdersEnvelope.data || {};
  const workAdmissions = (workOrdersData.workOrderRows || []).map(buildWorkAdmission);
  const localAdmissionReady = workAdmissions.length > 0 && workOrdersData.workOrderReadiness?.dryRunRowCount === workAdmissions.length;
  const approvalBoundary = buildApprovalBoundary();

  return createPassResult({
    phase: P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE,
    mode: "founder-live-work-admission-local-model",
    source: "live-ready/founderLiveWorkAdmission.js",
    summary: "Founder live work admission records are assembled locally from P102 handoff artifacts; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: localAdmissionReady
        ? P103_WORK_ADMISSION_STATES.LOCAL_ADMISSION_READY_EXECUTION_BLOCKED
        : P103_WORK_ADMISSION_STATES.NEEDS_HANDOFF_WORK_ORDERS,
      sourceHandoffPhase: manifestEnvelope.phase,
      sourceWorkOrderPhase: workOrdersEnvelope.phase,
      sourceHandoffState: manifestData.currentState,
      sourceWorkOrderState: workOrdersData.currentState,
      founderContextSummary: manifestData.founderContextSummary || workOrdersData.founderContextSummary,
      admissionReadiness: {
        localAdmissionReady,
        admittedWorkCount: workAdmissions.length,
        blockedWorkCount: workAdmissions.length,
        executableWorkCount: 0,
        dispatchableWorkCount: 0,
        projectMutationWorkCount: 0,
        hostedDbMutationWorkCount: 0,
        approvedWorkCount: 0,
      },
      workAdmissions,
      approvalBoundary,
      nextAction: localAdmissionReady
        ? "Build P103.3 approval evidence envelope without granting approval or execution authority."
        : "Complete P102 handoff work-order rows before local work admission review.",
      blockers: [
        "Operator approval remains blocked.",
        "Provider/model calls remain blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P103.2 is a local admission model only. It does not approve work, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Work Admission Governance",
      evidenceRefs: [
        "reports/p1032-founder-live-work-admission-model-report.md",
        ...(workOrdersData.evidenceRefs || []),
      ],
      activityLocation: workOrdersData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic work admission only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1032-founder-live-work-admission-model-report.md",
      "reports/p1023-founder-live-handoff-work-orders-report.md",
      "contracts/os-roadmap/p103-founder-live-work-admission-contracts.json",
    ],
    warnings: [
      "P103.2 does not approve work, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveWorkAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE) errors.push("phase must be P103.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceHandoffPhase",
    "sourceWorkOrderPhase",
    "founderContextSummary",
    "admissionReadiness",
    "workAdmissions",
    "approvalBoundary",
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
  if (!Array.isArray(data.workAdmissions) || data.workAdmissions.length < 5) errors.push("workAdmissions must cover founder handoff work orders");
  if (data.admissionReadiness?.executableWorkCount !== 0) errors.push("executableWorkCount must be 0");
  if (data.admissionReadiness?.dispatchableWorkCount !== 0) errors.push("dispatchableWorkCount must be 0");
  if (data.admissionReadiness?.projectMutationWorkCount !== 0) errors.push("projectMutationWorkCount must be 0");
  if (data.admissionReadiness?.hostedDbMutationWorkCount !== 0) errors.push("hostedDbMutationWorkCount must be 0");
  if (data.admissionReadiness?.approvedWorkCount !== 0) errors.push("approvedWorkCount must be 0");
  for (const admission of data.workAdmissions || []) {
    for (const field of ["admissionId", "displayLabel", "sourceWorkOrderLabel", "proposedAgentLane", "proposedOutcome", "admissionState", "approvalState", "requiredEvidence", "missingEvidence", "validationCommands", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in admission)) errors.push(`${admission.displayLabel || "admission"}.${field} missing`);
    }
    if (admission.executable !== false) errors.push(`${admission.displayLabel}.executable must be false`);
    if (admission.dispatchable !== false) errors.push(`${admission.displayLabel}.dispatchable must be false`);
    if (admission.projectMutationAllowed !== false) errors.push(`${admission.displayLabel}.projectMutationAllowed must be false`);
    if (admission.hostedDbMutationAllowed !== false) errors.push(`${admission.displayLabel}.hostedDbMutationAllowed must be false`);
    if (admission.spendAllowed !== false) errors.push(`${admission.displayLabel}.spendAllowed must be false`);
    for (const flag of P103_WORK_ADMISSION_SAFETY_FLAGS) {
      if (admission[flag] !== false) errors.push(`${admission.displayLabel}.${flag} must be false`);
    }
  }
  for (const flag of P103_WORK_ADMISSION_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.approvalBoundary?.[flag] !== false) errors.push(`approvalBoundary.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("work admission must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("work admission must not expose fake unsafe runnable actions");
  if (/raw json|raw logs|raw policy dump/i.test(serialized)) errors.push("work admission must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
