import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionScopeRequestModel,
  validateFounderRuntimeStoreLiveAdmissionScopeRequestModel,
} from "./founderRuntimeStoreLiveAdmissionScopeRequestModel.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_PHASE = "P132.2";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES = [
  "executionIntent",
  "sourceAdmissionEvidence",
  "approvalReadinessEvidence",
  "adapterCapabilityEvidence",
  "writePlanEvidence",
  "rollbackEvidence",
  "auditEvidence",
  "validationEvidence",
  "costEvidence",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS = {
  ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
  founderRuntimeStoreLiveAdmissionExecutionEnvelopeAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionEnvelopeReady: false,
  founderRuntimeStoreLiveAdmissionExecutionEnvelopeExecutable: false,
  founderRuntimeStoreLiveAdmissionExecutionEnvelopePersistable: false,
  founderRuntimeStoreLiveAdmissionExecutionAdapterSelectable: false,
  founderRuntimeStoreLiveAdmissionExecutionWritePlanAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionDbReadAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionDbWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionRuntimeWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionProviderCallAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionAgentDispatchAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionProjectMutationAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionDeployAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionReleaseAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionExportAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionPackageAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionNetworkAllowed: false,
  founderRuntimeStoreLiveAdmissionExecutionSpendAllowed: false,
};

const DISABLED_REASON = "P132.2 models an execution request envelope only; live execution remains blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Execution Envelope Guard";

const ENVELOPE_FIELDS = [
  {
    fieldName: "executionIntent",
    publicLabel: "Execution intent",
    blocker: "Execution intent can be described locally, but it cannot run or unlock live execution.",
    evidenceLabels: ["P132.1 execution contract"],
    activityLabels: ["Execution intent envelope field modeled locally"],
  },
  {
    fieldName: "sourceAdmissionEvidence",
    publicLabel: "Source admission evidence",
    blocker: "Store live admission evidence must remain linked before any future execution review.",
    evidenceLabels: ["P131.2 admission request model"],
    activityLabels: ["Source admission evidence envelope field modeled"],
  },
  {
    fieldName: "approvalReadinessEvidence",
    publicLabel: "Approval readiness evidence",
    blocker: "Approval readiness must be resolved before any execution path can be considered.",
    evidenceLabels: ["Approval readiness pending"],
    activityLabels: ["Approval readiness envelope field modeled"],
  },
  {
    fieldName: "adapterCapabilityEvidence",
    publicLabel: "Adapter capability evidence",
    blocker: "Adapter capability gates must be resolved before any store adapter can be selected.",
    evidenceLabels: ["Adapter capability evidence pending"],
    activityLabels: ["Adapter capability envelope field modeled"],
  },
  {
    fieldName: "writePlanEvidence",
    publicLabel: "Write plan evidence",
    blocker: "A governed write plan preview is required before any DB/runtime write can be considered.",
    evidenceLabels: ["Write plan evidence pending"],
    activityLabels: ["Write plan envelope field modeled"],
  },
  {
    fieldName: "rollbackEvidence",
    publicLabel: "Rollback evidence",
    blocker: "Rollback evidence must be resolved before any future execution can be considered.",
    evidenceLabels: ["Rollback evidence pending"],
    activityLabels: ["Rollback envelope field modeled"],
  },
  {
    fieldName: "auditEvidence",
    publicLabel: "Audit evidence",
    blocker: "Audit evidence must be resolved before any future execution can be considered.",
    evidenceLabels: ["Audit evidence pending"],
    activityLabels: ["Audit envelope field modeled"],
  },
  {
    fieldName: "validationEvidence",
    publicLabel: "Validation evidence",
    blocker: "Validation evidence must be resolved before any future execution can be considered.",
    evidenceLabels: ["Validation evidence pending"],
    activityLabels: ["Validation envelope field modeled"],
  },
  {
    fieldName: "costEvidence",
    publicLabel: "Cost evidence",
    blocker: "Cost evidence must be resolved before provider, network, worker, package, or deploy spend can be considered.",
    evidenceLabels: ["Cost evidence pending"],
    activityLabels: ["Cost envelope field modeled"],
  },
];

function withBlockedEnvelopeField(field) {
  return {
    ...field,
    envelopeState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P132.3 store adapter capability gate before any execution adapter can be considered.",
    costImpactLabel: "No provider spend",
    envelopeFieldSatisfied: false,
    canPrepareEnvelope: false,
    canPersistEnvelope: false,
    canSelectAdapter: false,
    canPreviewWritePlan: false,
    canRunCrud: false,
    canReadDb: false,
    canWriteDb: false,
    canWriteRuntime: false,
    canCaptureApproval: false,
    canPersistDecision: false,
    canAcceptHandoff: false,
    canGrantAuthority: false,
    canUnlockExecution: false,
    canCallProvider: false,
    canDispatchAgent: false,
    canExecuteWorker: false,
    canExecuteTool: false,
    canMutateProject: false,
    canDeploy: false,
    canRelease: false,
    canExport: false,
    canPackage: false,
    canUseNetwork: false,
    canSpend: false,
    evidenceLabels: [...field.evidenceLabels],
    activityLabels: [...field.activityLabels],
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope() {
  const admissionRequestModel = buildFounderRuntimeStoreLiveAdmissionScopeRequestModel();
  const admissionRequestValidation = validateFounderRuntimeStoreLiveAdmissionScopeRequestModel(admissionRequestModel);
  const envelopeFields = ENVELOPE_FIELDS.map(withBlockedEnvelopeField);

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_PHASE,
    sourceAdmissionRequestPhase: admissionRequestModel.phaseId,
    sourceAdmissionRequestVersion: admissionRequestModel.metadataVersion,
    sourceSafeDryRunPhase: admissionRequestModel.sourceSafeDryRunPhase,
    sourceStoreSafeDryRunPhase: admissionRequestModel.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: admissionRequestModel.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: admissionRequestModel.sourceRepositoryIntentPhase,
    sourcePersistenceBoundaryPhase: admissionRequestModel.sourcePersistenceBoundaryPhase,
    sourceAdmissionRequestValid: admissionRequestValidation.valid,
    modelOnly: true,
    envelopeOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    envelopePolicy: {
      mode: "live-execution-request-envelope-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS,
    },
    envelopeFieldNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES],
    envelopeFields,
    envelopeFieldCount: envelopeFields.length,
    blockedEnvelopeFieldCount: envelopeFields.length,
    satisfiedEnvelopeFieldCount: 0,
    envelopePreparationCandidateCount: 0,
    envelopePersistenceCandidateCount: 0,
    adapterSelectionCandidateCount: 0,
    writePlanCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerCallCandidateCount: 0,
    agentDispatchCandidateCount: 0,
    projectMutationCandidateCount: 0,
    deployCandidateCount: 0,
    releaseCandidateCount: 0,
    exportCandidateCount: 0,
    packageCandidateCount: 0,
    networkCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Execution request envelope is not executable.",
      "Admission, approval, adapter, write plan, rollback, audit, validation, and cost evidence are required before any future execution can be considered.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, adapter, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P132.2 envelope model into P132.3 store adapter capability gate.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P132.2 execution request envelope model"],
    activityLabels: ["Execution request envelope modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope(envelope = {}) {
  const errors = [];
  if (envelope.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_VERSION) {
    errors.push("Unexpected execution request envelope version.");
  }
  if (envelope.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_PHASE) {
    errors.push("Unexpected execution request envelope phase.");
  }
  if (envelope.sourceAdmissionRequestPhase !== "P131.2" || envelope.sourceAdmissionRequestVersion !== "1.0") {
    errors.push("Execution request envelope must reuse P131.2 admission request model evidence.");
  }
  if (envelope.sourceSafeDryRunPhase !== "P130.4" || envelope.sourceStoreSafeDryRunPhase !== "P129.5" || envelope.sourceMigrationPreviewPhase !== "P129.4" || envelope.sourceRepositoryIntentPhase !== "P129.3" || envelope.sourcePersistenceBoundaryPhase !== "P128.2") {
    errors.push("Execution request envelope must preserve store/admission lineage.");
  }
  if (envelope.modelOnly !== true || envelope.envelopeOnly !== true || envelope.localOnly !== true || envelope.commandCenterVisible !== false) {
    errors.push("Execution request envelope must remain local envelope metadata and hidden from primary UX.");
  }
  if (envelope.envelopePolicy?.mode !== "live-execution-request-envelope-only") {
    errors.push("Execution request envelope policy must remain envelope-only.");
  }
  const policyValues = Object.values(envelope.envelopePolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Execution request envelope policy booleans must remain false.");
  }
  if (!Array.isArray(envelope.envelopeFields) || envelope.envelopeFields.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES.length) {
    errors.push("Execution request envelope fields are incomplete.");
  }
  if (envelope.envelopeFieldCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES.length || envelope.blockedEnvelopeFieldCount !== envelope.envelopeFieldCount || envelope.satisfiedEnvelopeFieldCount !== 0) {
    errors.push("Execution request envelope field counts must remain fully blocked.");
  }
  for (const countKey of [
    "envelopePreparationCandidateCount",
    "envelopePersistenceCandidateCount",
    "adapterSelectionCandidateCount",
    "writePlanCandidateCount",
    "liveCrudCandidateCount",
    "dbReadableCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "providerCallCandidateCount",
    "agentDispatchCandidateCount",
    "projectMutationCandidateCount",
    "deployCandidateCount",
    "releaseCandidateCount",
    "exportCandidateCount",
    "packageCandidateCount",
    "networkCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (envelope[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const field of envelope.envelopeFields || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES.includes(field.fieldName)) {
      errors.push("Execution request envelope field name must be allowlisted.");
    }
    if (field.envelopeState !== "blocked" || field.disabledReason !== DISABLED_REASON) {
      errors.push(`${field.fieldName || "envelope field"} must remain blocked with the expected disabled reason.`);
    }
    const fieldValues = Object.values(field).filter((value) => typeof value === "boolean");
    if (!fieldValues.every((value) => value === false)) {
      errors.push(`${field.fieldName || "envelope field"} booleans must remain false.`);
    }
    const authorityValues = Object.values(field.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${field.fieldName || "envelope field"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(envelope.blockers) || envelope.blockers.length < 4) {
    errors.push("Execution request envelope blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
