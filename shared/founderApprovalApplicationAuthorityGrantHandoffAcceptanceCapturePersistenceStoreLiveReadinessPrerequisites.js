import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_PHASE = "P130.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES = [
  "storeSafeDryRunEvidenceReady",
  "operatorApprovalEvidenceRequired",
  "rollbackEvidenceRequired",
  "auditEvidenceRequired",
  "validationEvidenceRequired",
  "sqliteLiveModeRequired",
  "localWriteFlagsRequired",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisitesAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSatisfied: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveAdmissionAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveCrudAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveDbReadAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveDbWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveRuntimeWriteAllowed: false,
};

const DISABLED_REASON = "P130.2 models live-readiness prerequisites only; live store actions remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Readiness Prerequisite Guard";

const REQUIREMENTS = [
  {
    requirementName: "storeSafeDryRunEvidenceReady",
    publicLabel: "Store safe dry-run evidence",
    blocker: "Safe dry-run evidence must be reviewed before live admission can be considered.",
    evidenceLabels: ["P129.5 store CRUD safe dry run"],
    activityLabels: ["Store safe dry-run evidence linked"],
  },
  {
    requirementName: "operatorApprovalEvidenceRequired",
    publicLabel: "Operator approval evidence",
    blocker: "Explicit operator approval evidence is required before live admission can be considered.",
    evidenceLabels: ["Operator approval evidence pending"],
    activityLabels: ["Operator approval prerequisite modeled"],
  },
  {
    requirementName: "rollbackEvidenceRequired",
    publicLabel: "Rollback evidence",
    blocker: "Rollback acceptance evidence is required before live admission can be considered.",
    evidenceLabels: ["Rollback evidence pending"],
    activityLabels: ["Rollback prerequisite modeled"],
  },
  {
    requirementName: "auditEvidenceRequired",
    publicLabel: "Audit evidence",
    blocker: "Audit acceptance evidence is required before live admission can be considered.",
    evidenceLabels: ["Audit evidence pending"],
    activityLabels: ["Audit prerequisite modeled"],
  },
  {
    requirementName: "validationEvidenceRequired",
    publicLabel: "Validation evidence",
    blocker: "Validation command acceptance evidence is required before live admission can be considered.",
    evidenceLabels: ["Validation evidence pending"],
    activityLabels: ["Validation prerequisite modeled"],
  },
  {
    requirementName: "sqliteLiveModeRequired",
    publicLabel: "SQLite live mode",
    blocker: "SQLite live mode must be explicitly selected before live admission can be considered.",
    evidenceLabels: ["SQLite live mode evidence pending"],
    activityLabels: ["SQLite mode prerequisite modeled"],
  },
  {
    requirementName: "localWriteFlagsRequired",
    publicLabel: "Local write flags",
    blocker: "Local write flags must be explicitly present before live admission can be considered.",
    evidenceLabels: ["Local write flag evidence pending"],
    activityLabels: ["Local write prerequisite modeled"],
  },
];

function withBlockedReadiness(requirement) {
  return {
    ...requirement,
    currentState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P130.3 approval evidence gate before any store live admission can be considered.",
    costImpactLabel: "No provider spend",
    prerequisiteSatisfied: false,
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
    evidenceLabels: [...requirement.evidenceLabels],
    activityLabels: [...requirement.activityLabels],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS },
  };
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites() {
  const safeDryRun = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun();
  const safeDryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun(safeDryRun);
  const requirementRows = REQUIREMENTS.map(withBlockedReadiness);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_PHASE,
    sourceStoreSafeDryRunPhase: safeDryRun.phaseId,
    sourceStoreSafeDryRunVersion: safeDryRun.metadataVersion,
    sourceMigrationPreviewPhase: safeDryRun.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: safeDryRun.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: safeDryRun.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: safeDryRun.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: safeDryRun.sourceCapturePhase,
    sourceStoreSafeDryRunValid: safeDryRunValidation.valid,
    modelOnly: true,
    prerequisitesOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    readinessPolicy: {
      mode: "prerequisite-model-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS,
    },
    requirementNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES],
    requirementRows,
    requirementCount: requirementRows.length,
    blockedRequirementCount: requirementRows.length,
    satisfiedRequirementCount: 0,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Store live readiness is not satisfied.",
      "Operator approval, rollback, audit, validation, sqlite-live mode, and local write flag evidence are required before any future live admission can be considered.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P130.2 prerequisites into P130.3 store live approval evidence gate.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P130.2 store live prerequisites"],
    activityLabels: ["Store live prerequisite model built locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_VERSION) {
    errors.push("Unexpected store live readiness prerequisite version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_PHASE) {
    errors.push("Unexpected store live readiness prerequisite phase.");
  }
  if (model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceStoreSafeDryRunVersion !== "1.0") {
    errors.push("Store live readiness prerequisites must reuse P129.5 store safe dry-run evidence.");
  }
  if (model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Store live readiness prerequisites must preserve store lineage.");
  }
  if (model.modelOnly !== true || model.prerequisitesOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Store live readiness prerequisites must remain local model metadata and hidden from primary UX.");
  }
  if (model.readinessPolicy?.mode !== "prerequisite-model-only") {
    errors.push("Store live readiness policy must remain prerequisite-model-only.");
  }
  const policyValues = Object.values(model.readinessPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Store live readiness policy booleans must remain false.");
  }
  if (!Array.isArray(model.requirementRows) || model.requirementRows.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES.length) {
    errors.push("Store live readiness requirement rows are incomplete.");
  }
  if (model.requirementCount !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES.length || model.blockedRequirementCount !== model.requirementCount || model.satisfiedRequirementCount !== 0) {
    errors.push("Store live readiness prerequisite counts must remain fully blocked.");
  }
  for (const countKey of ["liveAdmissionCandidateCount", "liveCrudCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const row of model.requirementRows || []) {
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES.includes(row.requirementName)) {
      errors.push("Store live readiness requirement name must be allowlisted.");
    }
    if (row.currentState !== "blocked" || row.disabledReason !== DISABLED_REASON) {
      errors.push(`${row.requirementName || "requirement"} must remain blocked with the expected disabled reason.`);
    }
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false)) {
      errors.push(`${row.requirementName || "requirement"} booleans must remain false.`);
    }
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${row.requirementName || "requirement"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Store live readiness blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
