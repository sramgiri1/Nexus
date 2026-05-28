import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P107_APPROVAL_CAPTURE_BLOCKED_FLAGS,
  P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS,
  P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalCaptureBoundary.js";
import { buildFounderLiveApprovalCaptureModel } from "./founderLiveApprovalCaptureModel.js";

export const P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE = "P107.3";

export const P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES = Object.freeze({
  AUDIT_PREVIEW_READY_EXECUTION_BLOCKED: "founder_live_approval_capture_audit_preview_ready_execution_blocked",
  NEEDS_CAPTURE_RECORDS: "founder_live_approval_capture_audit_preview_needs_capture_records",
});

function blockedFlags() {
  return Object.fromEntries(P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function auditRowFor(record = {}, index = 0) {
  return {
    auditPreviewKey: `approval-capture-audit-preview-${index + 1}`,
    displayLabel: record.displayLabel || `Approval Capture Audit ${index + 1}`,
    sourceCaptureLabel: record.displayLabel || `Approval Capture Record ${index + 1}`,
    sourceQueueLabel: record.sourceQueueLabel,
    proposedAgentLane: record.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: record.proposedOutcome || "Prepare governed work for later capture audit review.",
    auditState: P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES.AUDIT_PREVIEW_READY_EXECUTION_BLOCKED,
    queuePosition: record.queuePosition || index + 1,
    evidenceStatus: {
      requiredEvidenceCount: P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length,
      readyEvidenceCount: 0,
      approvalCaptured: false,
      approvalPersisted: false,
      captureWriteAllowed: false,
      executionUnlockAllowed: false,
      runtimeAdmissionAllowed: false,
    },
    requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    missingEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
    auditQuestions: [
      record.approvalDecisionPrompt || "Which founder decision would be reviewed later?",
      record.operatorDecisionPrompt || "Which operator evidence would be reviewed later?",
      "What audit evidence must exist before any future capture can be considered?",
    ],
    nextAction: "Keep this audit preview local and read-only until a later explicit UX phase renders it without capture controls.",
    blockers: [
      "Audit preview is local and read-only.",
      "Approval capture is not available.",
      "Approval persistence is not available.",
      "Approval capture writes cannot unlock execution.",
      "Runtime admission remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(record.blockers || []),
    ],
    disabledReason:
      "P107.3 builds a local approval capture audit preview only. It cannot capture approvals, persist approval state, write approval decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
    evidenceRefs: [
      "reports/p1073-founder-live-approval-capture-audit-preview-report.md",
      ...(record.evidenceRefs || []),
    ],
    activityLocation: record.activityLocation || "reports/os-phase-status-report.md",
    costImpact: record.costImpact || "Local approval capture audit preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    approvalCaptured: false,
    approvalPersisted: false,
    approvalDecisionCaptureAllowed: false,
    approvalDecisionPersistenceAllowed: false,
    approvalCaptureWriteAllowed: false,
    approvalCaptureCanUnlockExecution: false,
    approvalCaptureRuntimeAdmissionAllowed: false,
    approvalWriteAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    runtimeTransitionAllowed: false,
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

function buildAuditSections(auditRows = []) {
  return [
    {
      sectionKey: "local-capture-audit-ready-execution-blocked",
      displayLabel: "Local capture audit ready",
      auditPreviewCount: auditRows.length,
      blockedCount: auditRows.length,
      nextAction: "Render this section in P107.4 without capture controls, execution controls, raw IDs, logs, or policy dumps.",
      disabledReason: "This audit section is read-only and cannot capture, persist, write, or unlock approvals.",
    },
  ];
}

export function buildFounderLiveApprovalCaptureAuditPreview(input = {}) {
  const captureModelEnvelope = input.captureModelEnvelope || buildFounderLiveApprovalCaptureModel(input);
  const captureModelData = captureModelEnvelope.data || {};
  const auditRows = (captureModelData.approvalCaptureRecords || []).map(auditRowFor);
  const auditPreviewReady = auditRows.length > 0;
  const auditSections = buildAuditSections(auditRows);

  return createPassResult({
    phase: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE,
    mode: "founder-live-approval-capture-audit-preview",
    source: "live-ready/founderLiveApprovalCaptureAuditPreview.js",
    summary: "Founder live approval capture audit preview is assembled locally; capture, persistence, writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: auditPreviewReady
        ? P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES.AUDIT_PREVIEW_READY_EXECUTION_BLOCKED
        : P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES.NEEDS_CAPTURE_RECORDS,
      sourceCaptureModelPhase: captureModelEnvelope.phase,
      sourceCaptureModelState: captureModelData.currentState,
      founderContextSummary: captureModelData.founderContextSummary,
      approvalCaptureAuditSummary: {
        auditPreviewReady,
        auditPreviewCount: auditRows.length,
        blockedAuditPreviewCount: auditRows.length,
        capturableDecisionCount: 0,
        persistedDecisionCount: 0,
        writableDecisionCount: 0,
        executableDecisionCount: 0,
        dispatchableDecisionCount: 0,
        projectMutationDecisionCount: 0,
        hostedDbMutationDecisionCount: 0,
        providerSpendDecisionCount: 0,
      },
      auditSections,
      auditRows,
      requiredEvidence: [...P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE],
      forbiddenActions: [...P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS],
      nextAction: auditPreviewReady
        ? "Render P107.4 Command Center approval capture boundary visibility on non-chat founder pages without capture or execution controls."
        : "Complete P107.2 approval capture records before audit preview assembly.",
      blockers: [
        "Audit preview is local and read-only.",
        "Approval capture remains blocked.",
        "Approval persistence remains blocked.",
        "Approval capture writes cannot unlock execution.",
        "Runtime admission remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P107.3 is a local approval capture audit preview only. It does not capture approvals, persist approval state, write approvals, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Approval Capture Boundary",
      evidenceRefs: [
        "reports/p1073-founder-live-approval-capture-audit-preview-report.md",
        ...(captureModelData.evidenceRefs || []),
      ],
      activityLocation: captureModelData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local deterministic approval-capture audit preview only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1073-founder-live-approval-capture-audit-preview-report.md",
      "reports/p1072-founder-live-approval-capture-model-report.md",
      "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
      "contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json",
    ],
    warnings: [
      "P107.3 does not capture approvals, persist approval state, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveApprovalCaptureAuditPreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE) errors.push("phase must be P107.3");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES).includes(data.currentState)) errors.push("currentState must be a P107 approval capture audit preview state");
  if (!data.approvalCaptureAuditSummary) errors.push("approvalCaptureAuditSummary is required");
  if (!Array.isArray(data.auditRows) || data.auditRows.length === 0) errors.push("auditRows are required");
  if (!Array.isArray(data.auditSections) || data.auditSections.length === 0) errors.push("auditSections are required");
  for (const flag of P107_APPROVAL_CAPTURE_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const row of data.auditRows || []) {
      if (row[flag] !== false) errors.push(`auditRows.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P107.3");
  return { valid: errors.length === 0, errors };
}
