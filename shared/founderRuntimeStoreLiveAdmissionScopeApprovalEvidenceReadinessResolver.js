import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionScopeRequestModel,
  validateFounderRuntimeStoreLiveAdmissionScopeRequestModel,
} from "./founderRuntimeStoreLiveAdmissionScopeRequestModel.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_PHASE = "P131.3";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_NAMES = [
  "admissionIntentEvidenceReadiness",
  "operatorApprovalEvidenceReadiness",
  "writeBoundaryEvidenceReadiness",
  "rollbackEvidenceReadiness",
  "auditEvidenceReadiness",
  "validationEvidenceReadiness",
  "runtimeScopeEvidenceReadiness",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_FLAGS = {
  ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
  founderRuntimeStoreLiveAdmissionScopeApprovalEvidenceResolverAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReady: false,
  founderRuntimeStoreLiveAdmissionScopeApprovalEvidenceExecutable: false,
  founderRuntimeStoreLiveAdmissionScopeApprovalCaptureAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDecisionPersistenceAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeLiveAdmissionAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeLiveCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbReadAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeRuntimeWriteAllowed: false,
};

const DISABLED_REASON = "P131.3 resolves approval evidence readiness only; approval capture, decision persistence, and live store admission remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Admission Evidence Readiness Guard";

const READINESS_ROWS = [
  {
    readinessName: "admissionIntentEvidenceReadiness",
    requestFieldName: "admissionIntent",
    publicLabel: "Admission intent evidence",
    blocker: "Admission intent evidence is unresolved for live admission.",
    evidenceLabels: ["P131.2 admission intent request field"],
    activityLabels: ["Admission intent readiness resolved locally"],
  },
  {
    readinessName: "operatorApprovalEvidenceReadiness",
    requestFieldName: "operatorApprovalEvidence",
    publicLabel: "Operator approval evidence",
    blocker: "Operator approval evidence is unresolved for live admission.",
    evidenceLabels: ["Operator approval evidence pending"],
    activityLabels: ["Operator approval readiness resolved locally"],
  },
  {
    readinessName: "writeBoundaryEvidenceReadiness",
    requestFieldName: "writeBoundaryEvidence",
    publicLabel: "Write boundary evidence",
    blocker: "Write boundary evidence is unresolved for live admission.",
    evidenceLabels: ["Write boundary evidence pending"],
    activityLabels: ["Write boundary readiness resolved locally"],
  },
  {
    readinessName: "rollbackEvidenceReadiness",
    requestFieldName: "rollbackEvidence",
    publicLabel: "Rollback evidence",
    blocker: "Rollback evidence is unresolved for live admission.",
    evidenceLabels: ["Rollback evidence pending"],
    activityLabels: ["Rollback readiness resolved locally"],
  },
  {
    readinessName: "auditEvidenceReadiness",
    requestFieldName: "auditEvidence",
    publicLabel: "Audit evidence",
    blocker: "Audit evidence is unresolved for live admission.",
    evidenceLabels: ["Audit evidence pending"],
    activityLabels: ["Audit readiness resolved locally"],
  },
  {
    readinessName: "validationEvidenceReadiness",
    requestFieldName: "validationEvidence",
    publicLabel: "Validation evidence",
    blocker: "Validation evidence is unresolved for live admission.",
    evidenceLabels: ["Validation evidence pending"],
    activityLabels: ["Validation readiness resolved locally"],
  },
  {
    readinessName: "runtimeScopeEvidenceReadiness",
    requestFieldName: "runtimeScopeEvidence",
    publicLabel: "Runtime scope evidence",
    blocker: "Runtime scope evidence is unresolved for live admission.",
    evidenceLabels: ["Runtime scope evidence pending"],
    activityLabels: ["Runtime scope readiness resolved locally"],
  },
];

function sourceFieldFor(requestModel, requestFieldName) {
  return (requestModel.requestFields || []).find((field) => field.fieldName === requestFieldName) || {};
}

function withBlockedReadinessRow(requestModel, row) {
  const sourceField = sourceFieldFor(requestModel, row.requestFieldName);
  return {
    ...row,
    readinessState: "blocked",
    sourceRequestFieldPresent: sourceField.fieldName === row.requestFieldName,
    sourceRequestFieldState: sourceField.requestState || "missing",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P131.4 write boundary and rollback readiness preview before any live admission can be considered.",
    costImpactLabel: "No provider spend",
    evidenceReady: false,
    canResolveForSubmission: false,
    canSubmitRequest: false,
    canPersistRequest: false,
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
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver() {
  const requestModel = buildFounderRuntimeStoreLiveAdmissionScopeRequestModel();
  const requestModelValidation = validateFounderRuntimeStoreLiveAdmissionScopeRequestModel(requestModel);
  const readinessRows = READINESS_ROWS.map((row) => withBlockedReadinessRow(requestModel, row));

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_PHASE,
    sourceRequestModelPhase: requestModel.phaseId,
    sourceRequestModelVersion: requestModel.metadataVersion,
    sourceSafeDryRunPhase: requestModel.sourceSafeDryRunPhase,
    sourceApprovalGatePhase: requestModel.sourceApprovalGatePhase,
    sourcePrerequisitesPhase: requestModel.sourcePrerequisitesPhase,
    sourceStoreSafeDryRunPhase: requestModel.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: requestModel.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: requestModel.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: requestModel.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: requestModel.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: requestModel.sourceCapturePhase,
    sourceRequestModelValid: requestModelValidation.valid,
    modelOnly: true,
    readinessResolverOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    readinessPolicy: {
      mode: "approval-evidence-readiness-resolver-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_FLAGS,
    },
    readinessNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_NAMES],
    readinessRows,
    readinessRowCount: readinessRows.length,
    blockedReadinessRowCount: readinessRows.length,
    readyEvidenceRowCount: 0,
    approvalCaptureCandidateCount: 0,
    decisionPersistenceCandidateCount: 0,
    requestSubmissionCandidateCount: 0,
    requestPersistenceCandidateCount: 0,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Approval evidence readiness is unresolved for every live admission evidence row.",
      "Approval capture, approve/reject decision persistence, request submission, and request persistence are not allowed.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P131.3 approval evidence readiness into P131.4 write boundary and rollback readiness preview.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P131.3 approval evidence readiness resolver"],
    activityLabels: ["Store live admission approval evidence readiness resolved locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_VERSION) {
    errors.push("Unexpected store live admission approval evidence readiness resolver version.");
  }
  if (model.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_RESOLVER_PHASE) {
    errors.push("Unexpected store live admission approval evidence readiness resolver phase.");
  }
  if (model.sourceRequestModelPhase !== "P131.2" || model.sourceRequestModelVersion !== "1.0") {
    errors.push("Approval evidence readiness resolver must reuse the P131.2 request model.");
  }
  if (model.sourceSafeDryRunPhase !== "P130.4" || model.sourceApprovalGatePhase !== "P130.3" || model.sourcePrerequisitesPhase !== "P130.2" || model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Approval evidence readiness resolver must preserve store lineage.");
  }
  if (model.modelOnly !== true || model.readinessResolverOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Approval evidence readiness resolver must remain local model metadata and hidden from primary UX.");
  }
  if (model.readinessPolicy?.mode !== "approval-evidence-readiness-resolver-only") {
    errors.push("Approval evidence readiness policy must remain resolver-only.");
  }
  const policyValues = Object.values(model.readinessPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Approval evidence readiness policy booleans must remain false.");
  }
  if (!Array.isArray(model.readinessRows) || model.readinessRows.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_NAMES.length) {
    errors.push("Approval evidence readiness rows are incomplete.");
  }
  if (model.readinessRowCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_NAMES.length || model.blockedReadinessRowCount !== model.readinessRowCount || model.readyEvidenceRowCount !== 0) {
    errors.push("Approval evidence readiness row counts must remain fully blocked.");
  }
  for (const countKey of ["approvalCaptureCandidateCount", "decisionPersistenceCandidateCount", "requestSubmissionCandidateCount", "requestPersistenceCandidateCount", "liveAdmissionCandidateCount", "liveCrudCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const row of model.readinessRows || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_NAMES.includes(row.readinessName)) {
      errors.push("Approval evidence readiness name must be allowlisted.");
    }
    if (row.readinessState !== "blocked" || row.disabledReason !== DISABLED_REASON) {
      errors.push(`${row.readinessName || "readiness row"} must remain blocked with the expected disabled reason.`);
    }
    if (row.sourceRequestFieldPresent !== true || row.sourceRequestFieldState !== "blocked") {
      errors.push(`${row.readinessName || "readiness row"} must reference a blocked P131.2 request field.`);
    }
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false || value === true)) {
      errors.push(`${row.readinessName || "readiness row"} contains unexpected boolean values.`);
    }
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "boolean" && key !== "sourceRequestFieldPresent" && value !== false) {
        errors.push(`${row.readinessName || "readiness row"} boolean ${key} must remain false.`);
      }
    }
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${row.readinessName || "readiness row"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Approval evidence readiness blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
