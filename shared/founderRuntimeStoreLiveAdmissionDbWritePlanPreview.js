import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate,
  validateFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate,
} from "./founderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_PHASE = "P132.4";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES = [
  "targetDataBoundary",
  "writeIntent",
  "schemaPrecondition",
  "migrationPrecondition",
  "rollbackPrecondition",
  "auditPrecondition",
  "validationPrecondition",
  "approvalPrecondition",
  "costPrecondition",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS = {
  ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_FLAGS,
  founderRuntimeStoreLiveAdmissionDbWritePlanPreviewAllowed: false,
  founderRuntimeStoreLiveAdmissionDbWritePlanPreviewReady: false,
  founderRuntimeStoreLiveAdmissionDbWritePlanPreviewSatisfied: false,
  founderRuntimeStoreLiveAdmissionDbWritePlanPersistable: false,
  founderRuntimeStoreLiveAdmissionDbSchemaAllowed: false,
  founderRuntimeStoreLiveAdmissionDbMigrationAllowed: false,
  founderRuntimeStoreLiveAdmissionDbTableAllowed: false,
  founderRuntimeStoreLiveAdmissionDbReadAllowed: false,
  founderRuntimeStoreLiveAdmissionDbWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionDbCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionRuntimeRecordAllowed: false,
  founderRuntimeStoreLiveAdmissionProviderCallAllowed: false,
  founderRuntimeStoreLiveAdmissionAgentDispatchAllowed: false,
  founderRuntimeStoreLiveAdmissionProjectMutationAllowed: false,
  founderRuntimeStoreLiveAdmissionDeployAllowed: false,
  founderRuntimeStoreLiveAdmissionReleaseAllowed: false,
  founderRuntimeStoreLiveAdmissionExportAllowed: false,
  founderRuntimeStoreLiveAdmissionPackageAllowed: false,
  founderRuntimeStoreLiveAdmissionNetworkAllowed: false,
  founderRuntimeStoreLiveAdmissionSpendAllowed: false,
};

const DISABLED_REASON = "P132.4 previews DB write-plan prerequisites only; DB access and write execution remain blocked.";
const OWNER_CAPABILITY = "NEXUS DB Write Plan Preview Guard";

const WRITE_PLAN_STEPS = [
  {
    stepName: "targetDataBoundary",
    publicLabel: "Target data boundary",
    blocker: "A display-safe data boundary must be approved before any future write plan can be considered.",
    evidenceLabels: ["Target data boundary evidence pending"],
    activityLabels: ["Target data boundary preview modeled"],
  },
  {
    stepName: "writeIntent",
    publicLabel: "Write intent",
    blocker: "Write intent can be described locally, but it cannot create or mutate records.",
    evidenceLabels: ["Write intent evidence pending"],
    activityLabels: ["Write intent preview modeled"],
  },
  {
    stepName: "schemaPrecondition",
    publicLabel: "Schema precondition",
    blocker: "Schema evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Schema precondition evidence pending"],
    activityLabels: ["Schema precondition preview modeled"],
  },
  {
    stepName: "migrationPrecondition",
    publicLabel: "Migration precondition",
    blocker: "Migration safety evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Migration precondition evidence pending"],
    activityLabels: ["Migration precondition preview modeled"],
  },
  {
    stepName: "rollbackPrecondition",
    publicLabel: "Rollback precondition",
    blocker: "Rollback evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Rollback precondition evidence pending"],
    activityLabels: ["Rollback precondition preview modeled"],
  },
  {
    stepName: "auditPrecondition",
    publicLabel: "Audit precondition",
    blocker: "Audit evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Audit precondition evidence pending"],
    activityLabels: ["Audit precondition preview modeled"],
  },
  {
    stepName: "validationPrecondition",
    publicLabel: "Validation precondition",
    blocker: "Validation evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Validation precondition evidence pending"],
    activityLabels: ["Validation precondition preview modeled"],
  },
  {
    stepName: "approvalPrecondition",
    publicLabel: "Approval precondition",
    blocker: "Approval evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Approval precondition evidence pending"],
    activityLabels: ["Approval precondition preview modeled"],
  },
  {
    stepName: "costPrecondition",
    publicLabel: "Cost precondition",
    blocker: "Cost evidence must exist before any future write plan can be considered.",
    evidenceLabels: ["Cost precondition evidence pending"],
    activityLabels: ["Cost precondition preview modeled"],
  },
];

function withBlockedWritePlanStep(step) {
  return {
    ...step,
    previewState: "blocked",
    readinessState: "missing_evidence",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P132.5 Command Center execution scope UX only after write-plan prerequisites are modeled.",
    costImpactLabel: "No provider spend",
    stepSatisfied: false,
    writePlanCandidate: false,
    canPreviewWritePlan: false,
    canPersistWritePlan: false,
    canCreateSchema: false,
    canRunMigration: false,
    canCreateTable: false,
    canReadDb: false,
    canWriteDb: false,
    canRunCrud: false,
    canWriteRuntime: false,
    canSelectAdapter: false,
    canConnectAdapter: false,
    canPersistRequest: false,
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
    evidenceLabels: [...step.evidenceLabels],
    activityLabels: [...step.activityLabels],
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview() {
  const adapterCapabilityGate = buildFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate();
  const adapterCapabilityGateValidation = validateFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate(adapterCapabilityGate);
  const writePlanSteps = WRITE_PLAN_STEPS.map(withBlockedWritePlanStep);

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_PHASE,
    sourceAdapterCapabilityGatePhase: adapterCapabilityGate.phaseId,
    sourceAdapterCapabilityGateVersion: adapterCapabilityGate.metadataVersion,
    sourceExecutionRequestEnvelopePhase: adapterCapabilityGate.sourceExecutionRequestEnvelopePhase,
    sourceAdmissionRequestPhase: adapterCapabilityGate.sourceAdmissionRequestPhase,
    sourceSafeDryRunPhase: adapterCapabilityGate.sourceSafeDryRunPhase,
    sourceStoreSafeDryRunPhase: adapterCapabilityGate.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: adapterCapabilityGate.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: adapterCapabilityGate.sourceRepositoryIntentPhase,
    sourcePersistenceBoundaryPhase: adapterCapabilityGate.sourcePersistenceBoundaryPhase,
    sourceAdapterCapabilityGateValid: adapterCapabilityGateValidation.valid,
    modelOnly: true,
    previewOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    writePlanPolicy: {
      mode: "db-write-plan-preview-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS,
    },
    writePlanStepNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES],
    writePlanSteps,
    writePlanStepCount: writePlanSteps.length,
    blockedWritePlanStepCount: writePlanSteps.length,
    satisfiedWritePlanStepCount: 0,
    writePlanPreviewCandidateCount: 0,
    writePlanPersistenceCandidateCount: 0,
    schemaCandidateCount: 0,
    migrationCandidateCount: 0,
    tableCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    liveCrudCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    adapterSelectionCandidateCount: 0,
    adapterConnectionCandidateCount: 0,
    providerCallCandidateCount: 0,
    agentDispatchCandidateCount: 0,
    projectMutationCandidateCount: 0,
    deployCandidateCount: 0,
    releaseCandidateCount: 0,
    exportCandidateCount: 0,
    packageCandidateCount: 0,
    networkCandidateCount: 0,
    providerSpendCandidateCount: 0,
    writePlanBoundaries: [
      "Write-plan prerequisites are modeled separately from DB write authority.",
      "No schema, migration, table, query, or runtime record is created.",
      "Adapter selection, provider calls, agent dispatch, project mutation, deploy, release, export, package, network, and spend remain outside the write-plan preview.",
    ],
    blockers: [
      "DB write-plan prerequisites are not satisfied.",
      "No schema, migration, table, query, runtime record, selected adapter, connected adapter, or CRUD executor is used.",
      "Write-plan preview is not persistable.",
      "Runtime execution, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P132.4 DB write-plan preview into P132.5 Command Center execution scope UX.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P132.4 DB write-plan preview model", "P132.3 store adapter capability gate model"],
    activityLabels: ["DB write-plan prerequisites previewed locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionDbWritePlanPreview(preview = {}) {
  const errors = [];
  if (preview.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_VERSION) {
    errors.push("Unexpected DB write-plan preview version.");
  }
  if (preview.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_PHASE) {
    errors.push("Unexpected DB write-plan preview phase.");
  }
  if (preview.sourceAdapterCapabilityGatePhase !== "P132.3" || preview.sourceAdapterCapabilityGateVersion !== "1.0") {
    errors.push("DB write-plan preview must reuse P132.3 adapter capability gate evidence.");
  }
  if (preview.sourceExecutionRequestEnvelopePhase !== "P132.2" || preview.sourceAdmissionRequestPhase !== "P131.2" || preview.sourceSafeDryRunPhase !== "P130.4" || preview.sourceStoreSafeDryRunPhase !== "P129.5" || preview.sourceMigrationPreviewPhase !== "P129.4" || preview.sourceRepositoryIntentPhase !== "P129.3" || preview.sourcePersistenceBoundaryPhase !== "P128.2") {
    errors.push("DB write-plan preview must preserve store/admission lineage.");
  }
  if (preview.modelOnly !== true || preview.previewOnly !== true || preview.localOnly !== true || preview.commandCenterVisible !== false) {
    errors.push("DB write-plan preview must remain local hidden preview metadata.");
  }
  if (preview.writePlanPolicy?.mode !== "db-write-plan-preview-only") {
    errors.push("DB write-plan preview policy must remain preview-only.");
  }
  const policyValues = Object.values(preview.writePlanPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("DB write-plan preview policy booleans must remain false.");
  }
  if (!Array.isArray(preview.writePlanSteps) || preview.writePlanSteps.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES.length) {
    errors.push("DB write-plan preview steps are incomplete.");
  }
  if (preview.writePlanStepCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES.length || preview.blockedWritePlanStepCount !== preview.writePlanStepCount || preview.satisfiedWritePlanStepCount !== 0) {
    errors.push("DB write-plan preview step counts must remain fully blocked.");
  }
  for (const countKey of [
    "writePlanPreviewCandidateCount",
    "writePlanPersistenceCandidateCount",
    "schemaCandidateCount",
    "migrationCandidateCount",
    "tableCandidateCount",
    "dbReadableCandidateCount",
    "dbWritableCandidateCount",
    "liveCrudCandidateCount",
    "runtimeWritableCandidateCount",
    "adapterSelectionCandidateCount",
    "adapterConnectionCandidateCount",
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
    if (preview[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const step of preview.writePlanSteps || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES.includes(step.stepName)) {
      errors.push("DB write-plan preview step name must be allowlisted.");
    }
    if (step.previewState !== "blocked" || step.readinessState !== "missing_evidence" || step.disabledReason !== DISABLED_REASON) {
      errors.push(`${step.stepName || "write-plan step"} must remain blocked with the expected disabled reason.`);
    }
    const stepValues = Object.values(step).filter((value) => typeof value === "boolean");
    if (!stepValues.every((value) => value === false)) {
      errors.push(`${step.stepName || "write-plan step"} booleans must remain false.`);
    }
    const authorityValues = Object.values(step.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${step.stepName || "write-plan step"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(preview.writePlanBoundaries) || preview.writePlanBoundaries.length < 3) {
    errors.push("DB write-plan preview boundaries are incomplete.");
  }
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 4) {
    errors.push("DB write-plan preview blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
