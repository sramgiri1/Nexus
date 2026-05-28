import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS,
  P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS,
  P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE,
} from "./founderLiveOperatorDecisionLedgerBoundary.js";
import { buildFounderLiveOperatorDecisionLedgerModel } from "./founderLiveOperatorDecisionLedgerModel.js";

export const P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE = "P109.3";

export const P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES = Object.freeze({
  LEDGER_AUDIT_PREVIEW_READY_WRITES_BLOCKED: "founder_live_operator_decision_ledger_audit_preview_ready_writes_blocked",
  NEEDS_OPERATOR_DECISION_LEDGER_CANDIDATES: "founder_live_operator_decision_ledger_audit_preview_needs_candidates",
});

function blockedFlags() {
  return Object.fromEntries(P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function auditPreviewRowFor(candidate = {}, index = 0) {
  return {
    previewRef: `operator-decision-ledger-audit-preview-${index + 1}`,
    displayLabel: candidate.displayLabel || `Decision Ledger Candidate ${index + 1}`,
    sourceCandidateLabel: candidate.displayLabel || `Decision Ledger Candidate ${index + 1}`,
    sourceReviewLabel: candidate.sourceReviewLabel,
    sourceAuditLabel: candidate.sourceAuditLabel,
    sourceQueueLabel: candidate.sourceQueueLabel,
    proposedAgentLane: candidate.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: candidate.proposedOutcome || "Prepare governed work for later operator decision review.",
    auditPreviewState: P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES.LEDGER_AUDIT_PREVIEW_READY_WRITES_BLOCKED,
    previewPosition: candidate.ledgerPosition || index + 1,
    evidenceStatus: {
      requiredEvidenceCount: P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length,
      missingEvidenceCount: P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length,
      readyEvidenceCount: 0,
      operatorDecisionCaptured: false,
      operatorDecisionPersisted: false,
      operatorDecisionLedgerWriteAllowed: false,
      operatorDecisionLedgerDbWriteAllowed: false,
      runtimeAdmissionAllowed: false,
      executionUnlockAllowed: false,
    },
    requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    missingEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    auditQuestions: [
      candidate.founderDecisionQuestion || "Which founder decision would require future ledger evidence?",
      candidate.operatorDecisionQuestion || "Which operator decision would require future evidence review?",
      candidate.rollbackQuestion || "Which rollback and revocation path must exist before any future ledger write?",
      "What audit evidence must exist before any future operator decision ledger write can be considered?",
    ],
    nextAction: "Keep this audit preview local and read-only until a later explicit UX phase renders it without write controls.",
    blockers: [
      "Decision-ledger audit preview is local and read-only.",
      "Operator decision capture is not available.",
      "Operator decision persistence is not available.",
      "Operator decision ledger writes are not available.",
      "DB writes and hosted DB mutation are blocked.",
      "Decision replay is blocked.",
      "Runtime admission remains blocked.",
      "Execution unlock remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(candidate.blockers || []),
    ],
    disabledReason:
      "P109.3 builds a local decision-ledger audit preview only. It cannot capture operator decisions, persist approval state, write ledger records, write DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
    evidenceRefs: [
      "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md",
      ...(candidate.evidenceRefs || []),
    ],
    activityLocation: candidate.activityLocation || "reports/os-phase-status-report.md",
    costImpact:
      candidate.costImpact || "Local decision-ledger audit preview only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
    operatorDecisionCaptured: false,
    operatorDecisionPersisted: false,
    operatorDecisionCaptureAllowed: false,
    operatorDecisionPersistenceAllowed: false,
    operatorReviewWriteAllowed: false,
    operatorReviewCanUnlockExecution: false,
    operatorReviewRuntimeAdmissionAllowed: false,
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
      sectionRef: "local-decision-ledger-audit-ready-writes-blocked",
      displayLabel: "Local decision ledger audit ready",
      auditPreviewCount: auditRows.length,
      blockedCount: auditRows.length,
      nextAction: "Render this section in P109.4 without capture controls, write controls, execution controls, raw IDs, logs, or policy dumps.",
      disabledReason: "This audit section is read-only and cannot capture, persist, write ledger records, write DB records, replay decisions, or unlock execution.",
    },
  ];
}

export function buildFounderLiveOperatorDecisionLedgerAuditPreview(input = {}) {
  const decisionLedgerModelEnvelope = input.decisionLedgerModelEnvelope || buildFounderLiveOperatorDecisionLedgerModel(input);
  const decisionLedgerModelData = decisionLedgerModelEnvelope.data || {};
  const ledgerCandidates = decisionLedgerModelData.operatorDecisionLedgerCandidates || [];
  const auditRows = ledgerCandidates.map(auditPreviewRowFor);
  const auditPreviewReady = auditRows.length > 0;
  const auditSections = buildAuditSections(auditRows);

  return createPassResult({
    phase: P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE,
    mode: "founder-live-operator-decision-ledger-audit-preview",
    source: "live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js",
    summary:
      "Founder live operator decision ledger audit preview is assembled locally; capture, persistence, ledger writes, DB writes, replay, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: auditPreviewReady
        ? P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES.LEDGER_AUDIT_PREVIEW_READY_WRITES_BLOCKED
        : P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES.NEEDS_OPERATOR_DECISION_LEDGER_CANDIDATES,
      sourceDecisionLedgerModelPhase: decisionLedgerModelEnvelope.phase,
      sourceDecisionLedgerModelState: decisionLedgerModelData.currentState,
      founderContextSummary: decisionLedgerModelData.founderContextSummary,
      operatorDecisionLedgerAuditSummary: {
        auditPreviewReady,
        auditPreviewCount: auditRows.length,
        blockedAuditPreviewCount: auditRows.length,
        capturableOperatorDecisionCount: 0,
        capturedOperatorDecisionCount: 0,
        persistedOperatorDecisionCount: 0,
        writableLedgerDecisionCount: 0,
        ledgerWriteCount: 0,
        dbWriteCount: 0,
        hostedDbWriteCount: 0,
        replayableLedgerDecisionCount: 0,
        runtimeAdmissionLedgerDecisionCount: 0,
        executableLedgerDecisionCount: 0,
        dispatchableLedgerDecisionCount: 0,
        projectMutationLedgerDecisionCount: 0,
        providerSpendLedgerDecisionCount: 0,
      },
      auditSections,
      auditRows,
      requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
      forbiddenActions: [...P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS],
      nextAction: auditPreviewReady
        ? "Render P109.4 Command Center decision-ledger boundary visibility on non-chat founder pages without capture, write, DB, replay, or execution controls."
        : "Complete P109.2 decision-ledger candidates before audit preview assembly.",
      blockers: [
        "Decision-ledger audit preview is local and read-only.",
        "Operator decision capture remains blocked.",
        "Operator decision persistence remains blocked.",
        "Operator decision ledger writes remain blocked.",
        "DB writes remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Decision replay remains blocked.",
        "Runtime admission remains blocked.",
        "Execution unlock remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P109.3 is a local decision-ledger audit preview only. It does not capture operator decisions, persist approval state, write ledger records, write DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
      evidenceRefs: [
        "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md",
        ...(decisionLedgerModelData.evidenceRefs || []),
      ],
      activityLocation: decisionLedgerModelData.activityLocation || "reports/os-phase-status-report.md",
      costImpact:
        "Local deterministic decision-ledger audit preview only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md",
      "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
      "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
      "contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json",
    ],
    warnings: [
      "P109.3 does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveOperatorDecisionLedgerAuditPreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE) errors.push("phase must be P109.3");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES).includes(data.currentState)) {
    errors.push("currentState must be a P109 operator decision ledger audit preview state");
  }
  if (!data.operatorDecisionLedgerAuditSummary) errors.push("operatorDecisionLedgerAuditSummary is required");
  if (!Array.isArray(data.auditRows) || data.auditRows.length === 0) errors.push("auditRows are required");
  if (!Array.isArray(data.auditSections) || data.auditSections.length === 0) errors.push("auditSections are required");
  for (const flag of P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const row of data.auditRows || []) {
      if (row[flag] !== false) errors.push(`auditRows.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P109.3");
  return { valid: errors.length === 0, errors };
}
