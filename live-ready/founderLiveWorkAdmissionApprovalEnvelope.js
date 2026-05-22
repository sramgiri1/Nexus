import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P103_WORK_ADMISSION_SAFETY_FLAGS,
  buildFounderLiveWorkAdmission,
} from "./founderLiveWorkAdmission.js";

export const P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE = "P103.3";

export const P103_WORK_ADMISSION_APPROVAL_STATES = Object.freeze({
  EVIDENCE_ENVELOPE_READY_APPROVAL_BLOCKED: "founder_live_work_admission_evidence_ready_approval_blocked",
  NEEDS_WORK_ADMISSION_MODEL: "founder_live_work_admission_evidence_needs_model",
});

function blockedSafetyFlags() {
  return Object.fromEntries(P103_WORK_ADMISSION_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function buildApprovalGate(admission = {}, index = 0) {
  const evidenceItems = Array.isArray(admission.requiredEvidence) ? admission.requiredEvidence : [];
  return {
    gateId: `approval-gate-${admission.admissionId || index + 1}`,
    displayLabel: admission.displayLabel || `Admission ${index + 1}`,
    gateState: "review_required_approval_blocked",
    approvalAllowed: false,
    executionAllowed: false,
    evidenceItems,
    missingEvidence: Array.isArray(admission.missingEvidence) ? admission.missingEvidence : evidenceItems,
    reviewQuestions: [
      "Does this work map to the founder intent and PRD acceptance criteria?",
      "Is rollback/recovery evidence sufficient for this lane?",
      "Are validation commands clear and local-only?",
      "Is cost impact still no-spend?",
    ],
    validationCommands: admission.validationCommands || ["npm run check:p1033-founder-live-work-admission-approval-envelope"],
    blockers: [
      "Operator approval is not granted.",
      "Approval envelope is non-runnable.",
      ...(admission.blockers || []),
    ],
    disabledReason:
      "P103.3 records approval evidence only. It cannot approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, package, or spend.",
    ownerCapability: admission.ownerCapability || "NEXUS Founder Live Work Admission Governance",
    evidenceRefs: admission.evidenceRefs || [],
    activityLocation: admission.activityLocation || "reports/os-phase-status-report.md",
    costImpact: admission.costImpact || "Local approval evidence only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedSafetyFlags(),
  };
}

export function buildFounderLiveWorkAdmissionApprovalEnvelope(input = {}) {
  const workAdmissionEnvelope = input.workAdmissionEnvelope || buildFounderLiveWorkAdmission(input);
  const workAdmissionData = workAdmissionEnvelope.data || {};
  const approvalGates = (workAdmissionData.workAdmissions || []).map(buildApprovalGate);
  const envelopeReady = approvalGates.length > 0 && workAdmissionData.admissionReadiness?.localAdmissionReady === true;

  return createPassResult({
    phase: P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE,
    mode: "founder-live-work-admission-approval-evidence-envelope",
    source: "live-ready/founderLiveWorkAdmissionApprovalEnvelope.js",
    summary: "Founder live work admission approval evidence envelope is assembled locally; approval and execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: envelopeReady
        ? P103_WORK_ADMISSION_APPROVAL_STATES.EVIDENCE_ENVELOPE_READY_APPROVAL_BLOCKED
        : P103_WORK_ADMISSION_APPROVAL_STATES.NEEDS_WORK_ADMISSION_MODEL,
      sourceWorkAdmissionPhase: workAdmissionEnvelope.phase,
      sourceWorkAdmissionState: workAdmissionData.currentState,
      founderContextSummary: workAdmissionData.founderContextSummary,
      approvalReadiness: {
        envelopeReady,
        approvalGateCount: approvalGates.length,
        approvedGateCount: 0,
        executableGateCount: 0,
        dispatchableGateCount: 0,
        projectMutationGateCount: 0,
        hostedDbMutationGateCount: 0,
      },
      approvalGates,
      nextAction: envelopeReady
        ? "Render P103.4 Command Center work admission UX without approval or execution controls."
        : "Complete P103.2 work admission model before approval evidence review.",
      blockers: [
        "Operator approval remains blocked.",
        "Approval controls remain blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P103.3 is a local approval evidence envelope only. It does not approve work, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Work Admission Governance",
      evidenceRefs: [
        "reports/p1033-founder-live-work-admission-approval-envelope-report.md",
        ...(workAdmissionData.evidenceRefs || []),
      ],
      activityLocation: workAdmissionData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local approval evidence only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1033-founder-live-work-admission-approval-envelope-report.md",
      "reports/p1032-founder-live-work-admission-model-report.md",
      "contracts/os-roadmap/p103-founder-live-work-admission-contracts.json",
    ],
    warnings: [
      "P103.3 does not approve work, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveWorkAdmissionApprovalEnvelope(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE) errors.push("phase must be P103.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceWorkAdmissionPhase",
    "founderContextSummary",
    "approvalReadiness",
    "approvalGates",
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
  if (!Array.isArray(data.approvalGates) || data.approvalGates.length < 5) errors.push("approvalGates must cover work admissions");
  if (data.approvalReadiness?.approvedGateCount !== 0) errors.push("approvedGateCount must be 0");
  if (data.approvalReadiness?.executableGateCount !== 0) errors.push("executableGateCount must be 0");
  if (data.approvalReadiness?.dispatchableGateCount !== 0) errors.push("dispatchableGateCount must be 0");
  if (data.approvalReadiness?.projectMutationGateCount !== 0) errors.push("projectMutationGateCount must be 0");
  if (data.approvalReadiness?.hostedDbMutationGateCount !== 0) errors.push("hostedDbMutationGateCount must be 0");
  for (const gate of data.approvalGates || []) {
    for (const field of ["gateId", "displayLabel", "gateState", "evidenceItems", "missingEvidence", "reviewQuestions", "validationCommands", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in gate)) errors.push(`${gate.displayLabel || "gate"}.${field} missing`);
    }
    if (gate.approvalAllowed !== false) errors.push(`${gate.displayLabel}.approvalAllowed must be false`);
    if (gate.executionAllowed !== false) errors.push(`${gate.displayLabel}.executionAllowed must be false`);
    for (const flag of P103_WORK_ADMISSION_SAFETY_FLAGS) {
      if (gate[flag] !== false) errors.push(`${gate.displayLabel}.${flag} must be false`);
    }
  }
  for (const flag of P103_WORK_ADMISSION_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("approval envelope must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now|approve now/i.test(serialized)) errors.push("approval envelope must not expose fake unsafe runnable actions");
  if (/raw json|raw logs|raw policy dump/i.test(serialized)) errors.push("approval envelope must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
