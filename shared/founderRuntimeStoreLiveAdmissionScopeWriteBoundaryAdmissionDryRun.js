import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver,
  validateFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver,
} from "./founderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_PHASE = "P131.4";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES = [
  "requestPersistenceBoundaryDryRun",
  "decisionPersistenceBoundaryDryRun",
  "rollbackBoundaryDryRun",
  "auditBoundaryDryRun",
  "liveCrudBoundaryDryRun",
  "dbWriteBoundaryDryRun",
  "runtimeWriteBoundaryDryRun",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS = {
  ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_APPROVAL_EVIDENCE_READINESS_FLAGS,
  founderRuntimeStoreLiveAdmissionScopeWriteBoundaryDryRunAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeWriteBoundaryDryRunReady: false,
  founderRuntimeStoreLiveAdmissionScopeWriteBoundaryDryRunExecutable: false,
  founderRuntimeStoreLiveAdmissionScopeRequestPersistenceAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDecisionPersistenceAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeRollbackAccepted: false,
  founderRuntimeStoreLiveAdmissionScopeAuditAccepted: false,
  founderRuntimeStoreLiveAdmissionScopeLiveCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbReadAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeDbWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionScopeRuntimeWriteAllowed: false,
};

const DISABLED_REASON = "P131.4 models write-boundary admission dry-run rows only; DB/runtime writes, request persistence, decision persistence, and live CRUD remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Admission Write Boundary Dry Run Guard";

const DRY_RUN_ROWS = [
  {
    dryRunName: "requestPersistenceBoundaryDryRun",
    sourceReadinessName: "operatorApprovalEvidenceReadiness",
    publicLabel: "Request persistence boundary",
    blocker: "Request persistence remains blocked until operator approval evidence and write-boundary evidence are resolved.",
    evidenceLabels: ["P131.3 operator approval readiness"],
    activityLabels: ["Request persistence boundary dry-run modeled locally"],
  },
  {
    dryRunName: "decisionPersistenceBoundaryDryRun",
    sourceReadinessName: "operatorApprovalEvidenceReadiness",
    publicLabel: "Decision persistence boundary",
    blocker: "Decision persistence remains blocked until approval evidence is resolved.",
    evidenceLabels: ["P131.3 operator approval readiness"],
    activityLabels: ["Decision persistence boundary dry-run modeled locally"],
  },
  {
    dryRunName: "rollbackBoundaryDryRun",
    sourceReadinessName: "rollbackEvidenceReadiness",
    publicLabel: "Rollback boundary",
    blocker: "Rollback evidence remains unresolved for live admission.",
    evidenceLabels: ["P131.3 rollback readiness"],
    activityLabels: ["Rollback boundary dry-run modeled locally"],
  },
  {
    dryRunName: "auditBoundaryDryRun",
    sourceReadinessName: "auditEvidenceReadiness",
    publicLabel: "Audit boundary",
    blocker: "Audit evidence remains unresolved for live admission.",
    evidenceLabels: ["P131.3 audit readiness"],
    activityLabels: ["Audit boundary dry-run modeled locally"],
  },
  {
    dryRunName: "liveCrudBoundaryDryRun",
    sourceReadinessName: "writeBoundaryEvidenceReadiness",
    publicLabel: "Live CRUD boundary",
    blocker: "Live CRUD remains blocked by unresolved write-boundary evidence.",
    evidenceLabels: ["P131.3 write boundary readiness"],
    activityLabels: ["Live CRUD boundary dry-run modeled locally"],
  },
  {
    dryRunName: "dbWriteBoundaryDryRun",
    sourceReadinessName: "writeBoundaryEvidenceReadiness",
    publicLabel: "DB write boundary",
    blocker: "DB writes remain blocked by unresolved write-boundary evidence.",
    evidenceLabels: ["P131.3 write boundary readiness"],
    activityLabels: ["DB write boundary dry-run modeled locally"],
  },
  {
    dryRunName: "runtimeWriteBoundaryDryRun",
    sourceReadinessName: "runtimeScopeEvidenceReadiness",
    publicLabel: "Runtime write boundary",
    blocker: "Runtime writes remain blocked by unresolved runtime scope evidence.",
    evidenceLabels: ["P131.3 runtime scope readiness"],
    activityLabels: ["Runtime write boundary dry-run modeled locally"],
  },
];

function sourceReadinessFor(resolver, sourceReadinessName) {
  return (resolver.readinessRows || []).find((row) => row.readinessName === sourceReadinessName) || {};
}

function withBlockedDryRunRow(resolver, row) {
  const sourceReadiness = sourceReadinessFor(resolver, row.sourceReadinessName);
  return {
    ...row,
    dryRunState: "blocked",
    sourceReadinessPresent: sourceReadiness.readinessName === row.sourceReadinessName,
    sourceReadinessState: sourceReadiness.readinessState || "missing",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P131.5 Command Center admission scope UX after this dry-run remains blocked.",
    costImpactLabel: "No provider spend",
    dryRunReady: false,
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
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun() {
  const readinessResolver = buildFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver();
  const readinessValidation = validateFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver(readinessResolver);
  const dryRunRows = DRY_RUN_ROWS.map((row) => withBlockedDryRunRow(readinessResolver, row));

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_PHASE,
    sourceReadinessResolverPhase: readinessResolver.phaseId,
    sourceReadinessResolverVersion: readinessResolver.metadataVersion,
    sourceRequestModelPhase: readinessResolver.sourceRequestModelPhase,
    sourceSafeDryRunPhase: readinessResolver.sourceSafeDryRunPhase,
    sourceApprovalGatePhase: readinessResolver.sourceApprovalGatePhase,
    sourcePrerequisitesPhase: readinessResolver.sourcePrerequisitesPhase,
    sourceStoreSafeDryRunPhase: readinessResolver.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: readinessResolver.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: readinessResolver.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: readinessResolver.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: readinessResolver.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: readinessResolver.sourceCapturePhase,
    sourceReadinessResolverValid: readinessValidation.valid,
    modelOnly: true,
    dryRunOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    dryRunPolicy: {
      mode: "write-boundary-admission-dry-run-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS,
    },
    dryRunNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES],
    dryRunRows,
    dryRunRowCount: dryRunRows.length,
    blockedDryRunRowCount: dryRunRows.length,
    readyDryRunRowCount: 0,
    requestPersistenceCandidateCount: 0,
    approvalCaptureCandidateCount: 0,
    decisionPersistenceCandidateCount: 0,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Write-boundary dry-run rows remain blocked because source readiness evidence is unresolved.",
      "Request persistence, approval capture, approve/reject decision persistence, live admission, live CRUD, DB writes, and runtime writes are not allowed.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P131.4 write-boundary dry-run results into P131.5 Command Center admission scope UX.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P131.4 write-boundary admission dry run"],
    activityLabels: ["Store live admission write-boundary dry-run modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_VERSION) {
    errors.push("Unexpected store live admission write-boundary dry-run version.");
  }
  if (model.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_PHASE) {
    errors.push("Unexpected store live admission write-boundary dry-run phase.");
  }
  if (model.sourceReadinessResolverPhase !== "P131.3" || model.sourceReadinessResolverVersion !== "1.0") {
    errors.push("Write-boundary dry run must reuse the P131.3 readiness resolver.");
  }
  if (model.sourceRequestModelPhase !== "P131.2" || model.sourceSafeDryRunPhase !== "P130.4" || model.sourceApprovalGatePhase !== "P130.3" || model.sourcePrerequisitesPhase !== "P130.2" || model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Write-boundary dry run must preserve store lineage.");
  }
  if (model.modelOnly !== true || model.dryRunOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Write-boundary dry run must remain local model metadata and hidden from primary UX.");
  }
  if (model.dryRunPolicy?.mode !== "write-boundary-admission-dry-run-only") {
    errors.push("Write-boundary dry-run policy must remain dry-run-only.");
  }
  const policyValues = Object.values(model.dryRunPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Write-boundary dry-run policy booleans must remain false.");
  }
  if (!Array.isArray(model.dryRunRows) || model.dryRunRows.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES.length) {
    errors.push("Write-boundary dry-run rows are incomplete.");
  }
  if (model.dryRunRowCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES.length || model.blockedDryRunRowCount !== model.dryRunRowCount || model.readyDryRunRowCount !== 0) {
    errors.push("Write-boundary dry-run row counts must remain fully blocked.");
  }
  for (const countKey of ["requestPersistenceCandidateCount", "approvalCaptureCandidateCount", "decisionPersistenceCandidateCount", "liveAdmissionCandidateCount", "liveCrudCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const row of model.dryRunRows || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES.includes(row.dryRunName)) {
      errors.push("Write-boundary dry-run name must be allowlisted.");
    }
    if (row.dryRunState !== "blocked" || row.disabledReason !== DISABLED_REASON) {
      errors.push(`${row.dryRunName || "dry-run row"} must remain blocked with the expected disabled reason.`);
    }
    if (row.sourceReadinessPresent !== true || row.sourceReadinessState !== "blocked") {
      errors.push(`${row.dryRunName || "dry-run row"} must reference a blocked P131.3 readiness row.`);
    }
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "boolean" && key !== "sourceReadinessPresent" && value !== false) {
        errors.push(`${row.dryRunName || "dry-run row"} boolean ${key} must remain false.`);
      }
    }
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${row.dryRunName || "dry-run row"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Write-boundary dry-run blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
