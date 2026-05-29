import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionPersistenceSchemaMetadata,
} from "./founderApprovalDecisionPersistenceSchemaMetadata.js";

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE = "P120.3";
export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES = [
  "review_only",
  "persistence_blocked",
  "ready_for_safe_dry_run",
  "blocked_no_persistence_authority",
];

const DEFAULT_BLOCKERS = [
  "Approval decision persistence is not enabled.",
  "DB and runtime writes remain blocked.",
  "Approve/reject decision recording remains blocked.",
  "Execution unlock remains blocked.",
];

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeIntentState(value) {
  return FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES.includes(value)
    ? value
    : "persistence_blocked";
}

function buildReadinessRows(intentState) {
  const dryRunReady = intentState === "ready_for_safe_dry_run";
  return [
    {
      label: "Persistence draft readiness",
      state: dryRunReady ? "ready for safe dry run" : "review only",
      nextAction: dryRunReady
        ? "Preview the persistence boundary without writing records."
        : "Review the local persistence intent before dry-run planning.",
      disabledReason: "P120.3 models intent only; it does not save approval decisions.",
      ownerCapability: "NEXUS Approval Decision Persistence Boundary",
      canPersist: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
    {
      label: "Decision persistence write readiness",
      state: "blocked",
      nextAction: "Keep DB and runtime writes disabled until a later approved persistence phase.",
      disabledReason: "No local or hosted DB write authority exists in P120.3.",
      ownerCapability: "NEXUS Persistence Guard",
      canPersist: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
    {
      label: "Execution unlock readiness",
      state: "blocked",
      nextAction: "Route any future unlock request through governed approval and execution controls.",
      disabledReason: "Approval decision persistence cannot unlock runtime execution in P120.3.",
      ownerCapability: "NEXUS Runtime Guard",
      canPersist: false,
      canWriteDb: false,
      canUnlockExecution: false,
    },
  ];
}

export function buildFounderApprovalDecisionPersistenceIntentModel(input = {}) {
  const schemaMetadata = buildFounderApprovalDecisionPersistenceSchemaMetadata();
  const intentState = normalizeIntentState(input.intentState);
  const founderIdeaSummary = cleanText(
    input.founderIdeaSummary,
    "Future founder approval decision persistence review",
  );
  const blockers = Array.isArray(input.blockers) && input.blockers.length > 0
    ? input.blockers.map((blocker) => cleanText(blocker, "Approval decision persistence remains blocked."))
    : DEFAULT_BLOCKERS;

  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE,
    sourceSchemaPhase: schemaMetadata.phaseId,
    sourceSchemaVersion: schemaMetadata.schemaVersion,
    modelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    intentState,
    currentState: intentState === "ready_for_safe_dry_run"
      ? "Ready for safe dry-run planning"
      : "Approval decision persistence unavailable",
    founderIdeaSummary,
    persistenceCandidateCount: 0,
    persistableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    approvalDecisionRecordableCandidateCount: 0,
    runtimeExecutableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    readinessRows: buildReadinessRows(intentState),
    blockers,
    nextAction: cleanText(input.nextAction, "Preview the persistence boundary in P120.4 before any write path exists."),
    disabledReason: cleanText(input.disabledReason, "P120.3 models approval decision persistence intent only; it does not write records."),
    ownerCapability: cleanText(input.ownerCapability, "NEXUS Approval Decision Persistence Boundary"),
    evidenceLabels: Array.isArray(input.evidenceLabels) && input.evidenceLabels.length > 0
      ? input.evidenceLabels.map((label) => cleanText(label, "P120 approval persistence evidence"))
      : ["P120.2 schema metadata", "P120.3 intent model report"],
    activityLabels: Array.isArray(input.activityLabels) && input.activityLabels.length > 0
      ? input.activityLabels.map((label) => cleanText(label, "P120 approval persistence activity"))
      : ["P120.3 local model validation"],
    costImpactLabel: cleanText(input.costImpactLabel, "No provider spend"),
    approvalDecisionPersisted: false,
    approvalDecisionRecorded: false,
    approvalDecisionAccepted: false,
    approvalDecisionRejected: false,
    dbWritePerformed: false,
    runtimeWritePerformed: false,
    executionUnlocked: false,
    providerCallPerformed: false,
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS },
    schemaEntityLabels: schemaMetadata.entities.map((entity) => entity.publicLabel),
  };
}

export function validateFounderApprovalDecisionPersistenceIntentModel(model = {}) {
  const errors = [];
  if (model.schemaVersion !== FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION) {
    errors.push("Unexpected approval decision persistence intent model version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE) {
    errors.push("Unexpected approval decision persistence intent model phase.");
  }
  if (model.sourceSchemaPhase !== "P120.2" || model.sourceSchemaVersion !== "1.0") {
    errors.push("Approval decision persistence intent model must reuse P120.2 schema metadata.");
  }
  if (!FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES.includes(model.intentState)) {
    errors.push("Approval decision persistence intent state is not allowlisted.");
  }
  if (model.modelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Approval decision persistence intent model must remain local and hidden from primary UX.");
  }
  for (const key of [
    "persistenceCandidateCount",
    "persistableCandidateCount",
    "dbWritableCandidateCount",
    "approvalDecisionRecordableCandidateCount",
    "runtimeExecutableCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (model[key] !== 0) errors.push(`${key} must remain zero.`);
  }
  if (
    model.approvalDecisionPersisted !== false
    || model.approvalDecisionRecorded !== false
    || model.approvalDecisionAccepted !== false
    || model.approvalDecisionRejected !== false
    || model.dbWritePerformed !== false
    || model.runtimeWritePerformed !== false
    || model.executionUnlocked !== false
    || model.providerCallPerformed !== false
  ) {
    errors.push("Approval decision persistence, writes, approvals, execution, and provider calls must remain blocked in P120.3.");
  }
  if (!model.authorityFlags || Object.values(model.authorityFlags).some((value) => value !== false)) {
    errors.push("All approval decision persistence authority flags must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== 3) {
    errors.push("Three readiness rows are required.");
  } else if (model.readinessRows.some((row) => row.canPersist !== false || row.canWriteDb !== false || row.canUnlockExecution !== false)) {
    errors.push("Readiness rows must not grant persistence, DB writes, or execution unlock.");
  }
  for (const key of ["founderIdeaSummary", "nextAction", "disabledReason", "ownerCapability", "costImpactLabel"]) {
    if (!model[key]) errors.push(`Missing ${key}.`);
  }
  if (!Array.isArray(model.blockers) || model.blockers.length === 0) {
    errors.push("Blockers are required.");
  }
  if (!Array.isArray(model.evidenceLabels) || model.evidenceLabels.length === 0) {
    errors.push("Evidence labels are required.");
  }
  if (!Array.isArray(model.activityLabels) || model.activityLabels.length === 0) {
    errors.push("Activity labels are required.");
  }
  if (!Array.isArray(model.schemaEntityLabels) || model.schemaEntityLabels.length !== 3) {
    errors.push("Display-safe schema entity labels are required.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
