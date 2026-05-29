import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_PHASE = "P131.2";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES = [
  "admissionIntent",
  "operatorApprovalEvidence",
  "writeBoundaryEvidence",
  "rollbackEvidence",
  "auditEvidence",
  "validationEvidence",
  "runtimeScopeEvidence",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS,
  founderRuntimeStoreLiveAdmissionScopeRequestModelAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeRequestReady: false,
  founderRuntimeStoreLiveAdmissionScopeRequestExecutable: false,
  founderRuntimeStoreLiveAdmissionScopeRequestPersistable: false,
  founderRuntimeStoreLiveAdmissionScopeLiveAdmissionAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeLiveCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbReadAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeRuntimeWriteAllowed: false,
};

const DISABLED_REASON = "P131.2 models a live admission request shape only; live store admission remains blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Admission Request Guard";

const REQUEST_FIELDS = [
  {
    fieldName: "admissionIntent",
    publicLabel: "Admission intent",
    blocker: "Admission intent can be described locally, but it cannot be submitted for live store admission.",
    evidenceLabels: ["P131.1 admission scope contract"],
    activityLabels: ["Admission intent field modeled locally"],
  },
  {
    fieldName: "operatorApprovalEvidence",
    publicLabel: "Operator approval evidence",
    blocker: "Operator approval evidence must be resolved before any future admission can be considered.",
    evidenceLabels: ["Operator approval evidence pending"],
    activityLabels: ["Operator approval request field modeled"],
  },
  {
    fieldName: "writeBoundaryEvidence",
    publicLabel: "Write boundary evidence",
    blocker: "Write boundary evidence must be resolved before DB/runtime writes can be considered.",
    evidenceLabels: ["Write boundary evidence pending"],
    activityLabels: ["Write boundary request field modeled"],
  },
  {
    fieldName: "rollbackEvidence",
    publicLabel: "Rollback evidence",
    blocker: "Rollback evidence must be resolved before any future live admission can be considered.",
    evidenceLabels: ["Rollback evidence pending"],
    activityLabels: ["Rollback request field modeled"],
  },
  {
    fieldName: "auditEvidence",
    publicLabel: "Audit evidence",
    blocker: "Audit evidence must be resolved before any future live admission can be considered.",
    evidenceLabels: ["Audit evidence pending"],
    activityLabels: ["Audit request field modeled"],
  },
  {
    fieldName: "validationEvidence",
    publicLabel: "Validation evidence",
    blocker: "Validation evidence must be resolved before any future live admission can be considered.",
    evidenceLabels: ["Validation evidence pending"],
    activityLabels: ["Validation request field modeled"],
  },
  {
    fieldName: "runtimeScopeEvidence",
    publicLabel: "Runtime scope evidence",
    blocker: "Runtime scope evidence must be resolved before execution can be considered.",
    evidenceLabels: ["Runtime scope evidence pending"],
    activityLabels: ["Runtime scope request field modeled"],
  },
];

function withBlockedRequestField(field) {
  return {
    ...field,
    requestState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P131.3 approval evidence readiness resolver before any live admission can be considered.",
    costImpactLabel: "No provider spend",
    requestFieldSatisfied: false,
    canSubmitRequest: false,
    canPersistRequest: false,
    canAdmitLiveStore: false,
    canRunCrud: false,
    canReadDb: false,
    canWriteDb: false,
    canWriteRuntime: false,
    canPersistCapture: false,
    canCaptureApproval: false,
    canPersistDecision: false,
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
    evidenceLabels: [...field.evidenceLabels],
    activityLabels: [...field.activityLabels],
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionScopeRequestModel() {
  const safeDryRun = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun();
  const safeDryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun(safeDryRun);
  const requestFields = REQUEST_FIELDS.map(withBlockedRequestField);

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_PHASE,
    sourceSafeDryRunPhase: safeDryRun.phaseId,
    sourceSafeDryRunVersion: safeDryRun.metadataVersion,
    sourceApprovalGatePhase: safeDryRun.sourceApprovalGatePhase,
    sourcePrerequisitesPhase: safeDryRun.sourcePrerequisitesPhase,
    sourceStoreSafeDryRunPhase: safeDryRun.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: safeDryRun.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: safeDryRun.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: safeDryRun.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: safeDryRun.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: safeDryRun.sourceCapturePhase,
    sourceSafeDryRunValid: safeDryRunValidation.valid,
    modelOnly: true,
    requestModelOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    requestPolicy: {
      mode: "live-admission-request-model-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
    },
    requestFieldNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES],
    requestFields,
    requestFieldCount: requestFields.length,
    blockedRequestFieldCount: requestFields.length,
    satisfiedRequestFieldCount: 0,
    requestSubmissionCandidateCount: 0,
    requestPersistenceCandidateCount: 0,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Live admission request model is not executable.",
      "Operator approval, write boundary, rollback, audit, validation, and runtime scope evidence are required before any future admission can be considered.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P131.2 request model into P131.3 approval evidence readiness resolver.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P131.2 store live admission request model"],
    activityLabels: ["Store live admission request model built locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionScopeRequestModel(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_VERSION) {
    errors.push("Unexpected store live admission request model version.");
  }
  if (model.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_PHASE) {
    errors.push("Unexpected store live admission request model phase.");
  }
  if (model.sourceSafeDryRunPhase !== "P130.4" || model.sourceSafeDryRunVersion !== "1.0") {
    errors.push("Store live admission request model must reuse P130.4 safe dry-run evidence.");
  }
  if (model.sourceApprovalGatePhase !== "P130.3" || model.sourcePrerequisitesPhase !== "P130.2" || model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Store live admission request model must preserve store lineage.");
  }
  if (model.modelOnly !== true || model.requestModelOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Store live admission request model must remain local model metadata and hidden from primary UX.");
  }
  if (model.requestPolicy?.mode !== "live-admission-request-model-only") {
    errors.push("Store live admission request policy must remain request-model-only.");
  }
  const policyValues = Object.values(model.requestPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Store live admission request policy booleans must remain false.");
  }
  if (!Array.isArray(model.requestFields) || model.requestFields.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES.length) {
    errors.push("Store live admission request fields are incomplete.");
  }
  if (model.requestFieldCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES.length || model.blockedRequestFieldCount !== model.requestFieldCount || model.satisfiedRequestFieldCount !== 0) {
    errors.push("Store live admission request field counts must remain fully blocked.");
  }
  for (const countKey of ["requestSubmissionCandidateCount", "requestPersistenceCandidateCount", "liveAdmissionCandidateCount", "liveCrudCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const field of model.requestFields || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES.includes(field.fieldName)) {
      errors.push("Store live admission request field name must be allowlisted.");
    }
    if (field.requestState !== "blocked" || field.disabledReason !== DISABLED_REASON) {
      errors.push(`${field.fieldName || "request field"} must remain blocked with the expected disabled reason.`);
    }
    const fieldValues = Object.values(field).filter((value) => typeof value === "boolean");
    if (!fieldValues.every((value) => value === false)) {
      errors.push(`${field.fieldName || "request field"} booleans must remain false.`);
    }
    const authorityValues = Object.values(field.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${field.fieldName || "request field"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Store live admission request blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
