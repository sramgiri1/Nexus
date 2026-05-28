import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
  P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
} from "./founderLiveApprovalOperatorReviewBoundary.js";
import { buildFounderLiveApprovalOperatorReviewAuditPreview } from "./founderLiveApprovalOperatorReviewAuditPreview.js";

export const P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE = "P109.1";

export const P109_OPERATOR_DECISION_LEDGER_STATES = Object.freeze({
  LEDGER_BOUNDARY_READY_WRITES_BLOCKED: "founder_live_operator_decision_ledger_boundary_ready_writes_blocked",
  NEEDS_OPERATOR_REVIEW_AUDIT_PREVIEW: "founder_live_operator_decision_ledger_boundary_needs_operator_review_audit_preview",
});

export const P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS = Object.freeze([
  ...new Set([
    ...P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
    "operatorDecisionLedgerWriteAllowed",
    "operatorDecisionLedgerPersistenceAllowed",
    "operatorDecisionLedgerDbWriteAllowed",
    "operatorDecisionLedgerHostedDbWriteAllowed",
    "operatorDecisionLedgerReplayAllowed",
    "operatorDecisionLedgerExportAllowed",
    "operatorDecisionLedgerRuntimeAdmissionAllowed",
    "operatorDecisionLedgerExecutionUnlockAllowed",
    "operatorDecisionLedgerSpendAllowed",
  ]),
]);

export const P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE = Object.freeze([
  ...P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
  "operatorDecisionLedgerScopeConfirmed",
  "operatorDecisionLedgerWritePathReviewed",
  "operatorDecisionLedgerPersistenceBoundaryReviewed",
  "operatorDecisionLedgerDbWriteBoundaryReviewed",
  "operatorDecisionLedgerRollbackPathReviewed",
  "operatorDecisionLedgerRevocationPathReviewed",
  "operatorDecisionLedgerAuditTrailReviewed",
  "operatorDecisionLedgerReplayBoundaryReviewed",
]);

export const P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS = Object.freeze([
  ...P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  "operator decision ledger write",
  "operator decision ledger persistence",
  "operator decision ledger DB write",
  "operator decision ledger replay",
  "operator decision ledger export",
]);

function blockedFlags() {
  return Object.fromEntries(P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.map((flag) => [flag, false]));
}

function buildLedgerBoundaryShape(auditSummary = {}) {
  const auditPreviewCount = auditSummary.auditPreviewCount || 0;

  return {
    boundaryRef: "display-safe-operator-decision-ledger-boundary",
    displayLabel: "Founder live operator decision ledger boundary",
    sourceOperatorReviewPhase: "P108",
    currentState: P109_OPERATOR_DECISION_LEDGER_STATES.LEDGER_BOUNDARY_READY_WRITES_BLOCKED,
    sourceAuditPreviewCount: auditPreviewCount,
    ledgerCandidateCount: auditPreviewCount,
    writableLedgerDecisionCount: 0,
    persistedLedgerDecisionCount: 0,
    dbWriteCount: 0,
    hostedDbWriteCount: 0,
    replayableLedgerDecisionCount: 0,
    requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    missingEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
    forbiddenActions: [...P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS],
    validationCommands: ["npm run check:p1091-founder-live-operator-decision-ledger-contract"],
    reviewQuestions: [
      "Which operator decision would require ledger evidence before future capture?",
      "Which persistence boundary must be approved before any future ledger write?",
      "Which rollback and revocation path must exist before any future decision ledger can be used?",
    ],
    blockers: [
      "P109.1 is contract/schema only.",
      "Operator decisions cannot be captured.",
      "Operator decision ledger writes are blocked.",
      "Operator decision ledger persistence is blocked.",
      "DB writes and hosted DB mutation are blocked.",
      "Runtime admission and execution unlock remain blocked.",
      "Provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, package, network calls, and spend remain blocked.",
    ],
    disabledReason:
      "P109.1 defines the operator decision ledger readiness boundary only. It does not capture operator decisions, persist approval state, write ledger or DB records, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
    evidenceRefs: ["reports/p1091-founder-live-operator-decision-ledger-contract-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local schema only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
    ...blockedFlags(),
  };
}

export function buildFounderLiveOperatorDecisionLedgerBoundary(input = {}) {
  const operatorReviewAuditPreviewEnvelope =
    input.operatorReviewAuditPreviewEnvelope || buildFounderLiveApprovalOperatorReviewAuditPreview(input);
  const operatorReviewAuditPreviewData = operatorReviewAuditPreviewEnvelope.data || {};
  const auditSummary = operatorReviewAuditPreviewData.operatorReviewAuditSummary || {};
  const auditReady = auditSummary.auditPreviewReady === true && (auditSummary.auditPreviewCount || 0) > 0;
  const operatorDecisionLedgerShape = buildLedgerBoundaryShape(auditSummary);

  return createPassResult({
    phase: P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE,
    mode: "founder-live-operator-decision-ledger-boundary",
    source: "live-ready/founderLiveOperatorDecisionLedgerBoundary.js",
    summary:
      "Founder live operator decision ledger readiness boundary is defined locally; decision capture, persistence, DB writes, and execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: auditReady
        ? P109_OPERATOR_DECISION_LEDGER_STATES.LEDGER_BOUNDARY_READY_WRITES_BLOCKED
        : P109_OPERATOR_DECISION_LEDGER_STATES.NEEDS_OPERATOR_REVIEW_AUDIT_PREVIEW,
      sourceOperatorReviewAuditPreviewPhase: operatorReviewAuditPreviewEnvelope.phase,
      sourceOperatorReviewAuditPreviewState: operatorReviewAuditPreviewData.currentState,
      founderContextSummary: operatorReviewAuditPreviewData.founderContextSummary,
      operatorDecisionLedgerShape,
      operatorDecisionLedgerReadiness: {
        ledgerBoundaryReady: auditReady,
        sourceAuditPreviewCount: auditSummary.auditPreviewCount || 0,
        ledgerCandidateCount: auditSummary.auditPreviewCount || 0,
        blockedLedgerCandidateCount: auditSummary.auditPreviewCount || 0,
        capturableOperatorDecisionCount: 0,
        writableLedgerDecisionCount: 0,
        persistedLedgerDecisionCount: 0,
        dbWriteCount: 0,
        hostedDbWriteCount: 0,
        replayableLedgerDecisionCount: 0,
        executableLedgerDecisionCount: 0,
        providerSpendLedgerDecisionCount: 0,
      },
      requiredEvidence: [...P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE],
      forbiddenActions: [...P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS],
      requiredEvidenceCount: P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length,
      nextAction: auditReady
        ? "Use this schema to build P109.2 deterministic local ledger candidate records without persistence, DB writes, or execution authority."
        : "Complete P108 operator-review audit preview before operator decision ledger boundary construction.",
      blockers: [
        "P109.1 is contract/schema only.",
        "Operator decision capture remains blocked.",
        "Operator decision ledger writes remain blocked.",
        "Operator decision ledger persistence remains blocked.",
        "DB writes remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Runtime admission remains blocked.",
        "Execution unlock remains blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P109.1 is a local operator decision ledger readiness boundary only. It does not capture operator decisions, persist approval state, write ledger records, write DB records, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Operator Decision Ledger Boundary",
      evidenceRefs: [
        "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
        ...(operatorReviewAuditPreviewData.evidenceRefs || []),
      ],
      activityLocation: operatorReviewAuditPreviewData.activityLocation || "reports/os-phase-status-report.md",
      costImpact:
        "Local operator decision ledger schema only. No provider calls, model calls, network calls, DB writes, deploy, package creation, or provider spend.",
      commandCenterVisible: false,
      ...blockedFlags(),
    },
    evidence: [
      "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
      "reports/p1087-founder-live-approval-operator-review-final-report.md",
      "contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json",
    ],
    warnings: [
      "P109.1 does not capture operator decisions, persist approval state, write ledger or DB records, unlock execution, admit runtime execution, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveOperatorDecisionLedgerBoundary(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE) errors.push("phase must be P109.1");
  if (data.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (!Object.values(P109_OPERATOR_DECISION_LEDGER_STATES).includes(data.currentState)) {
    errors.push("currentState must be a P109 operator decision ledger state");
  }
  if (!data.operatorDecisionLedgerShape) errors.push("operatorDecisionLedgerShape is required");
  if (!data.operatorDecisionLedgerReadiness) errors.push("operatorDecisionLedgerReadiness is required");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length < 40) {
    errors.push("requiredEvidence must include P108 evidence plus decision-ledger evidence");
  }
  if (!Array.isArray(data.forbiddenActions) || !data.forbiddenActions.includes("operator decision ledger write")) {
    errors.push("forbiddenActions must block operator decision ledger writes");
  }
  for (const flag of P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.operatorDecisionLedgerShape?.[flag] !== false) errors.push(`operatorDecisionLedgerShape.${flag} must be false`);
  }
  if (data.commandCenterVisible !== false) errors.push("commandCenterVisible must be false in P109.1");
  return { valid: errors.length === 0, errors };
}
