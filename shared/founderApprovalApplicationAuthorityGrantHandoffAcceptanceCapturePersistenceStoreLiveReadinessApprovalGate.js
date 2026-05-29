import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_PHASE = "P130.3";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_EVIDENCE_NAMES = [
  "storeSafeDryRunEvidenceReview",
  "operatorApprovalEvidenceReview",
  "rollbackAcceptanceEvidenceReview",
  "auditAcceptanceEvidenceReview",
  "validationCommandEvidenceReview",
  "sqliteLiveModeEvidenceReview",
  "localWriteFlagEvidenceReview",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGateAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessEvidenceSatisfied: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalCaptureAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDecisionPersistenceAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessAdmissionAllowed: false,
};

const DISABLED_REASON = "P130.3 models approval evidence gate rows only; approval capture and live store admission remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Approval Evidence Gate";

const EVIDENCE_ROWS = [
  {
    evidenceName: "storeSafeDryRunEvidenceReview",
    publicLabel: "Store safe dry-run review",
    blocker: "Safe dry-run evidence review is required before live admission can be considered.",
    evidenceLabels: ["P129.5 safe dry-run evidence"],
    activityLabels: ["Safe dry-run evidence gate modeled"],
  },
  {
    evidenceName: "operatorApprovalEvidenceReview",
    publicLabel: "Operator approval review",
    blocker: "Operator approval evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["Operator approval evidence pending"],
    activityLabels: ["Operator approval evidence gate modeled"],
  },
  {
    evidenceName: "rollbackAcceptanceEvidenceReview",
    publicLabel: "Rollback acceptance review",
    blocker: "Rollback acceptance evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["Rollback acceptance evidence pending"],
    activityLabels: ["Rollback evidence gate modeled"],
  },
  {
    evidenceName: "auditAcceptanceEvidenceReview",
    publicLabel: "Audit acceptance review",
    blocker: "Audit acceptance evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["Audit acceptance evidence pending"],
    activityLabels: ["Audit evidence gate modeled"],
  },
  {
    evidenceName: "validationCommandEvidenceReview",
    publicLabel: "Validation command review",
    blocker: "Validation command evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["Validation command evidence pending"],
    activityLabels: ["Validation evidence gate modeled"],
  },
  {
    evidenceName: "sqliteLiveModeEvidenceReview",
    publicLabel: "SQLite live-mode review",
    blocker: "SQLite live-mode evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["SQLite live-mode evidence pending"],
    activityLabels: ["SQLite mode evidence gate modeled"],
  },
  {
    evidenceName: "localWriteFlagEvidenceReview",
    publicLabel: "Local write-flag review",
    blocker: "Local write-flag evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["Local write-flag evidence pending"],
    activityLabels: ["Local write evidence gate modeled"],
  },
];

function withBlockedEvidenceGate(row) {
  return {
    ...row,
    evidenceState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P130.4 store live admission safe dry run before any live action can be considered.",
    costImpactLabel: "No provider spend",
    evidenceSatisfied: false,
    canCaptureApproval: false,
    canPersistDecision: false,
    canAdmitLiveStore: false,
    canRunCrud: false,
    canReadDb: false,
    canWriteDb: false,
    canWriteRuntime: false,
    canPersistCapture: false,
    canCaptureAcceptance: false,
    canAcceptHandoff: false,
    canHandoffAuthority: false,
    canGrantAuthority: false,
    canActivateAuthority: false,
    canApplyApproval: false,
    canRecordDecision: false,
    canUnlockExecution: false,
    canCallProvider: false,
    canDispatchAgent: false,
    canMutateProject: false,
    canUseNetwork: false,
    canSpend: false,
    evidenceLabels: [...row.evidenceLabels],
    activityLabels: [...row.activityLabels],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_FLAGS },
  };
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate() {
  const prerequisites = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites();
  const prerequisitesValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites(prerequisites);
  const evidenceRows = EVIDENCE_ROWS.map(withBlockedEvidenceGate);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_PHASE,
    sourcePrerequisitesPhase: prerequisites.phaseId,
    sourcePrerequisitesVersion: prerequisites.metadataVersion,
    sourceStoreSafeDryRunPhase: prerequisites.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: prerequisites.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: prerequisites.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: prerequisites.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: prerequisites.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: prerequisites.sourceCapturePhase,
    sourcePrerequisitesValid: prerequisitesValidation.valid,
    modelOnly: true,
    approvalGateOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    approvalGatePolicy: {
      mode: "approval-evidence-gate-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_FLAGS,
    },
    evidenceNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_EVIDENCE_NAMES],
    evidenceRows,
    evidenceRowCount: evidenceRows.length,
    blockedEvidenceRowCount: evidenceRows.length,
    satisfiedEvidenceRowCount: 0,
    approvalCaptureCandidateCount: 0,
    decisionPersistenceCandidateCount: 0,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Approval evidence gate is not satisfied.",
      "Approval capture and approve/reject decision persistence are not allowed.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P130.3 approval evidence gate into P130.4 store live admission safe dry run.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P130.3 store live approval evidence gate"],
    activityLabels: ["Store live approval evidence gate modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_VERSION) {
    errors.push("Unexpected store live approval evidence gate version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_PHASE) {
    errors.push("Unexpected store live approval evidence gate phase.");
  }
  if (model.sourcePrerequisitesPhase !== "P130.2" || model.sourcePrerequisitesVersion !== "1.0") {
    errors.push("Store live approval evidence gate must reuse P130.2 prerequisites.");
  }
  if (model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Store live approval evidence gate must preserve store lineage.");
  }
  if (model.modelOnly !== true || model.approvalGateOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Store live approval evidence gate must remain local model metadata and hidden from primary UX.");
  }
  if (model.approvalGatePolicy?.mode !== "approval-evidence-gate-only") {
    errors.push("Store live approval evidence gate policy must remain approval-evidence-gate-only.");
  }
  const policyValues = Object.values(model.approvalGatePolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Store live approval evidence gate policy booleans must remain false.");
  }
  if (!Array.isArray(model.evidenceRows) || model.evidenceRows.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_EVIDENCE_NAMES.length) {
    errors.push("Store live approval evidence rows are incomplete.");
  }
  if (model.evidenceRowCount !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_EVIDENCE_NAMES.length || model.blockedEvidenceRowCount !== model.evidenceRowCount || model.satisfiedEvidenceRowCount !== 0) {
    errors.push("Store live approval evidence counts must remain fully blocked.");
  }
  for (const countKey of ["approvalCaptureCandidateCount", "decisionPersistenceCandidateCount", "liveAdmissionCandidateCount", "liveCrudCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const row of model.evidenceRows || []) {
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_EVIDENCE_NAMES.includes(row.evidenceName)) {
      errors.push("Store live approval evidence name must be allowlisted.");
    }
    if (row.evidenceState !== "blocked" || row.disabledReason !== DISABLED_REASON) {
      errors.push(`${row.evidenceName || "evidence row"} must remain blocked with the expected disabled reason.`);
    }
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false)) {
      errors.push(`${row.evidenceName || "evidence row"} booleans must remain false.`);
    }
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${row.evidenceName || "evidence row"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Store live approval evidence blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
