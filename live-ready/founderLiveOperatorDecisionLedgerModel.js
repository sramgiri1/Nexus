import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderLiveApprovalOperatorReviewAuditPreview } from "./founderLiveApprovalOperatorReviewAuditPreview.js";
import {
  P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS,
  P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS,
  P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE,
  P109_OPERATOR_DECISION_LEDGER_STATES,
  buildFounderLiveOperatorDecisionLedgerBoundary,
} from "./founderLiveOperatorDecisionLedgerBoundary.js";

export const P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE = "P109.2";

export const P109_OPERATOR_DECISION_LEDGER_MODEL_STATES = Object.freeze({
  LEDGER_CANDIDATES_READY_WRITES_BLOCKED: "founder_live_operator_decision_ledger_candidates_ready_writes_blocked",
  NEEDS_OPERATOR_DECISION_LEDGER_BOUNDARY: "founder_live_operator_decision_ledger_model_needs_boundary",
});

function blockedFlags() {
  return Object.fromEntries(P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function slugFor(value = "", fallback = "operator-decision-ledger") {
  const slug = String(value || fallback)
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function candidateKeyFor(row = {}, index = 0) {
  return `operator-decision-ledger-candidate-${index + 1}-${slugFor(row.displayLabel, "item")}`;
}

function buildLedgerCandidate(row = {}, index = 0) {
  return {
    candidateKey: candidateKeyFor(row, index),
    displayLabel: `${row.displayLabel || `Operator Review Audit ${index + 1}`} decision ledger candidate`,
    sourceReviewLabel: row.sourceReviewLabel || row.displayLabel || `Operator Review Audit ${index + 1}`,
    sourceAuditLabel: row.sourceAuditLabel,
    sourceQueueLabel: row.sourceQueueLabel,
    proposedAgentLane: row.proposedAgentLane || "Founder Workstream Agent",
    proposedOutcome: row.proposedOutcome || "Prepare governed work for later operator decision review.",
    ledgerCandidateState: P109_OPERATOR_DECISION_LEDGER_MODEL_STATES.LEDGER_CANDIDATES_READY_WRITES_BLOCKED,
    ledgerPosition: row.reviewPosition || index + 1,
    localDecisionLedgerCandidateReady: true,
    founderDecisionQuestion: row.auditQuestions?.[0] || "Which founder decision would require future ledger evidence?",
    operatorDecisionQuestion: row.auditQuestions?.[1] || "Which operator decision would require future evidence review?",
    rollbackQuestion: row.auditQuestions?.[2] || "Which rollback and revocation path must exist before any future ledger write?",
    decisionOptions: ["not_available_in_p109_2"],
    requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    missingEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    evidenceSummary: {
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
    validationCommands: ["npm run check:p1092-founder-live-operator-decision-ledger-model"],
    nextAction: "Keep this as a local decision-ledger candidate until a later explicit preview/UX phase renders it without write controls.",
    blockers: [
      "Decision-ledger candidate is local and read-only.",
      "Operator decision capture is not available.",
      "Operator decision persistence is not available.",
      "Operator decision ledger writes are not available.",
      "DB writes and hosted DB mutation are blocked.",
      "Runtime admission remains blocked.",
      "Execution unlock remains blocked.",
      "Agent dispatch remains blocked.",
      "Worker/tool execution remains blocked.",
      "Project mutation remains blocked.",
      "Provider spend remains blocked.",
      ...(row.blockers || []),
    ],
    disabledReason:
      "P109.2 builds local decision-ledger candidates only. It cannot capture operator decisions, persist approval state, write ledger records, write DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, run workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
    evidenceRefs: [
      "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
      ...(row.evidenceRefs || []),
    ],
    activityLocation: row.activityLocation || "reports/os-phase-status-report.md",
    costImpact: row.costImpact || "Local decision-ledger model only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
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

export function buildFounderLiveOperatorDecisionLedgerModel(input = {}) {
  const decisionLedgerBoundaryEnvelope =
    input.decisionLedgerBoundaryEnvelope || buildFounderLiveOperatorDecisionLedgerBoundary(input);
  const decisionLedgerBoundaryData = decisionLedgerBoundaryEnvelope.data || {};
  const operatorReviewAuditPreviewEnvelope =
    input.operatorReviewAuditPreviewEnvelope || buildFounderLiveApprovalOperatorReviewAuditPreview(input);
  const operatorReviewAuditPreviewData = operatorReviewAuditPreviewEnvelope.data || {};
  const auditRows = operatorReviewAuditPreviewData.auditRows || [];
  const operatorDecisionLedgerCandidates = auditRows.map(buildLedgerCandidate);
  const candidateCount = operatorDecisionLedgerCandidates.length;
  const boundaryReady =
    decisionLedgerBoundaryData.currentState === P109_OPERATOR_DECISION_LEDGER_STATES.LEDGER_BOUNDARY_READY_WRITES_BLOCKED;
  const modelReady = boundaryReady && candidateCount > 0;

  return createPassResult({
    phase: P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE,
    mode: "founder-live-operator-decision-ledger-model",
    source: "live-ready/founderLiveOperatorDecisionLedgerModel.js",
    summary:
      "Founder live operator decision ledger candidates are assembled locally; capture, persistence, ledger writes, DB writes, and live execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: modelReady
        ? P109_OPERATOR_DECISION_LEDGER_MODEL_STATES.LEDGER_CANDIDATES_READY_WRITES_BLOCKED
        : P109_OPERATOR_DECISION_LEDGER_MODEL_STATES.NEEDS_OPERATOR_DECISION_LEDGER_BOUNDARY,
      sourceDecisionLedgerBoundaryPhase: decisionLedgerBoundaryEnvelope.phase,
      sourceDecisionLedgerBoundaryState: decisionLedgerBoundaryData.currentState,
      sourceOperatorReviewAuditPreviewPhase: operatorReviewAuditPreviewEnvelope.phase,
      sourceOperatorReviewAuditPreviewState: operatorReviewAuditPreviewData.currentState,
      founderContextSummary:
        operatorReviewAuditPreviewData.founderContextSummary || decisionLedgerBoundaryData.founderContextSummary,
      operatorDecisionLedgerModelSummary: {
        modelReady,
        ledgerCandidateRecordCount: candidateCount,
        blockedLedgerCandidateRecordCount: candidateCount,
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
      operatorDecisionLedgerCandidates,
      requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
      forbiddenActions: [...P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS],
      nextAction: modelReady
        ? "Use these local decision-ledger candidates to build P109.3 audit preview without capture, persistence, DB writes, replay, or execution authority."
        : "Complete P109.1 decision-ledger boundary and P108.3 operator-review audit preview before model construction.",
      blockers: [
        "Decision-ledger candidates are local and read-only.",
        "Operator decision capture remains blocked.",
        "Operator decision persistence remains blocked.",
        "Operator decision ledger writes remain blocked.",
        "DB writes remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Runtime admission remains blocked.",
        "Execution unlock remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P109.2 is a local decision-ledger model only. It does not capture operator decisions, persist approval state, write ledger records, write DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
      evidenceRefs: [
        "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
        ...(decisionLedgerBoundaryData.evidenceRefs || []),
      ],
      activityLocation: decisionLedgerBoundaryData.activityLocation || "reports/os-phase-status-report.md",
      costImpact:
        "Local deterministic decision-ledger model only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
      "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
      "contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json",
    ],
    warnings: [
      "P109.2 does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveOperatorDecisionLedgerModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE) errors.push("phase must be P109.2");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P109_OPERATOR_DECISION_LEDGER_MODEL_STATES).includes(data.currentState)) {
    errors.push("currentState must be a P109 operator decision ledger model state");
  }
  if (!data.operatorDecisionLedgerModelSummary) errors.push("operatorDecisionLedgerModelSummary is required");
  if (!Array.isArray(data.operatorDecisionLedgerCandidates) || data.operatorDecisionLedgerCandidates.length === 0) {
    errors.push("operatorDecisionLedgerCandidates are required");
  }
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 40) {
    errors.push("requiredEvidence must include P109 operator decision ledger evidence");
  }
  for (const flag of P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    for (const candidate of data.operatorDecisionLedgerCandidates || []) {
      if (candidate[flag] !== false) errors.push(`operatorDecisionLedgerCandidates.${flag} must be false`);
    }
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P109.2");
  return { valid: errors.length === 0, errors };
}
