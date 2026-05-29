import { createBlockedResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_PHASE = "P130.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES = [
  "dryRunStoreLiveAdmissionReview",
  "dryRunApprovalEvidenceAdmission",
  "dryRunWriteBoundaryAdmission",
  "dryRunRollbackAdmission",
  "dryRunAuditAdmission",
  "dryRunValidationAdmission",
  "dryRunFounderRuntimeAdmission",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_APPROVAL_GATE_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessAdmissionDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalEvidenceApplyAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessLocalWriteEnableAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessLiveDbReadAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessLiveDbWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessLiveCrudAllowed: false,
};

const DISABLED_REASON = "P130.4 models blocked store live admission safe dry-run envelopes only; live store admission and CRUD remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Live Admission Safe Dry Run Guard";

const ADMISSION_ACTIONS = [
  {
    actionName: "dryRunStoreLiveAdmissionReview",
    publicLabel: "Store live admission review",
    targetName: "store live admission",
    blocker: "Store live admission cannot proceed until explicit future live persistence authorization exists.",
    evidenceLabels: ["P130.4 admission safe dry run"],
    activityLabels: ["Store live admission review modeled locally"],
  },
  {
    actionName: "dryRunApprovalEvidenceAdmission",
    publicLabel: "Approval evidence admission",
    targetName: "approval evidence",
    blocker: "Approval evidence can be reviewed locally, but cannot be applied to unlock live store admission.",
    evidenceLabels: ["P130.3 approval evidence gate"],
    activityLabels: ["Approval evidence admission modeled locally"],
  },
  {
    actionName: "dryRunWriteBoundaryAdmission",
    publicLabel: "Write boundary admission",
    targetName: "local write boundary",
    blocker: "Local write flags and DB write boundaries remain blocked in this safe dry run.",
    evidenceLabels: ["Local write boundary evidence pending"],
    activityLabels: ["Write boundary admission modeled locally"],
  },
  {
    actionName: "dryRunRollbackAdmission",
    publicLabel: "Rollback admission",
    targetName: "rollback acceptance",
    blocker: "Rollback acceptance evidence remains a required blocker before live store admission can be considered.",
    evidenceLabels: ["Rollback acceptance evidence pending"],
    activityLabels: ["Rollback admission modeled locally"],
  },
  {
    actionName: "dryRunAuditAdmission",
    publicLabel: "Audit admission",
    targetName: "audit acceptance",
    blocker: "Audit acceptance evidence remains a required blocker before live store admission can be considered.",
    evidenceLabels: ["Audit acceptance evidence pending"],
    activityLabels: ["Audit admission modeled locally"],
  },
  {
    actionName: "dryRunValidationAdmission",
    publicLabel: "Validation admission",
    targetName: "validation acceptance",
    blocker: "Validation command evidence remains a required blocker before live store admission can be considered.",
    evidenceLabels: ["Validation command evidence pending"],
    activityLabels: ["Validation admission modeled locally"],
  },
  {
    actionName: "dryRunFounderRuntimeAdmission",
    publicLabel: "Founder runtime admission",
    targetName: "founder runtime store",
    blocker: "Founder runtime store admission remains blocked until a later explicit live phase enables it.",
    evidenceLabels: ["Founder runtime admission evidence pending"],
    activityLabels: ["Founder runtime admission modeled locally"],
  },
];

function buildBlockedAdmissionEnvelope(action) {
  return createBlockedResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_PHASE,
    mode: "store-live-admission-safe-dry-run",
    source: "nexus-os",
    summary: `${action.publicLabel} is blocked until a later explicit live persistence phase.`,
    data: {
      actionName: action.actionName,
      publicLabel: action.publicLabel,
      targetName: action.targetName,
      admissionState: "blocked",
      disabledReason: DISABLED_REASON,
      blocker: action.blocker,
      ownerCapability: OWNER_CAPABILITY,
      nextAction: "Route to P130.5 Command Center store live gate UX before any live store action can be considered.",
      evidenceLabels: [...action.evidenceLabels],
      activityLabels: [...action.activityLabels],
      costImpactLabel: "No provider spend",
      canAdmitLiveStore: false,
      canRunCrud: false,
      canCaptureApproval: false,
      canPersistDecision: false,
      canApplyApproval: false,
      canRecordDecision: false,
      canReadDb: false,
      canWriteDb: false,
      canWriteRuntime: false,
      canPersistCapture: false,
      canCaptureAcceptance: false,
      canAcceptHandoff: false,
      canHandoffAuthority: false,
      canGrantAuthority: false,
      canActivateAuthority: false,
      canUnlockExecution: false,
      canCallProvider: false,
      canDispatchAgent: false,
      canMutateProject: false,
      canUseNetwork: false,
      canSpend: false,
      authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS },
    },
    warnings: ["Store live admission safe dry run remains blocked by P130.4 policy."],
    evidence: ["P130.4 store live admission safe dry run", ...action.evidenceLabels],
  });
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun() {
  const approvalGate = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate();
  const approvalGateValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate(approvalGate);
  const safeDryRunEnvelopes = ADMISSION_ACTIONS.map(buildBlockedAdmissionEnvelope);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_PHASE,
    sourceApprovalGatePhase: approvalGate.phaseId,
    sourceApprovalGateVersion: approvalGate.metadataVersion,
    sourcePrerequisitesPhase: approvalGate.sourcePrerequisitesPhase,
    sourceStoreSafeDryRunPhase: approvalGate.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: approvalGate.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: approvalGate.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: approvalGate.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: approvalGate.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: approvalGate.sourceCapturePhase,
    sourceApprovalGateValid: approvalGateValidation.valid,
    safeDryRunOnly: true,
    admissionDryRunOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    admissionDryRunPolicy: {
      mode: "store-live-admission-safe-dry-run-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS,
    },
    actionNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES],
    safeDryRunEnvelopes,
    safeDryRunEnvelopeCount: safeDryRunEnvelopes.length,
    blockedSafeDryRunEnvelopeCount: safeDryRunEnvelopes.length,
    liveAdmissionCandidateCount: 0,
    liveCrudCandidateCount: 0,
    approvalCaptureCandidateCount: 0,
    decisionPersistenceCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerSpendCandidateCount: 0,
    blockers: [
      "Store live admission safe dry run is blocked.",
      "Approval evidence cannot be applied to unlock live store admission.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, or CRUD executor is used.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P130.4 store live admission safe dry run into P130.5 Command Center store live gate UX.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P130.4 store live admission safe dry run"],
    activityLabels: ["Store live admission safe dry-run envelopes modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_VERSION) {
    errors.push("Unexpected store live admission safe dry-run version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_PHASE) {
    errors.push("Unexpected store live admission safe dry-run phase.");
  }
  if (model.sourceApprovalGatePhase !== "P130.3" || model.sourceApprovalGateVersion !== "1.0") {
    errors.push("Store live admission safe dry run must reuse P130.3 approval evidence gate.");
  }
  if (model.sourcePrerequisitesPhase !== "P130.2" || model.sourceStoreSafeDryRunPhase !== "P129.5" || model.sourceMigrationPreviewPhase !== "P129.4" || model.sourceRepositoryIntentPhase !== "P129.3" || model.sourceStoreMetadataPhase !== "P129.2" || model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Store live admission safe dry run must preserve store lineage.");
  }
  if (model.safeDryRunOnly !== true || model.admissionDryRunOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Store live admission safe dry run must remain local dry-run metadata and hidden from primary UX.");
  }
  if (model.admissionDryRunPolicy?.mode !== "store-live-admission-safe-dry-run-only") {
    errors.push("Store live admission safe dry-run policy must remain safe-dry-run-only.");
  }
  const policyValues = Object.values(model.admissionDryRunPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Store live admission safe dry-run policy booleans must remain false.");
  }
  if (!Array.isArray(model.safeDryRunEnvelopes) || model.safeDryRunEnvelopes.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES.length) {
    errors.push("Store live admission safe dry-run envelopes are incomplete.");
  }
  if (model.safeDryRunEnvelopeCount !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES.length || model.blockedSafeDryRunEnvelopeCount !== model.safeDryRunEnvelopeCount) {
    errors.push("Store live admission safe dry-run envelope counts must remain fully blocked.");
  }
  for (const countKey of ["liveAdmissionCandidateCount", "liveCrudCandidateCount", "approvalCaptureCandidateCount", "decisionPersistenceCandidateCount", "dbReadableCandidateCount", "dbWritableCandidateCount", "runtimeWritableCandidateCount", "providerSpendCandidateCount"]) {
    if (model[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const envelope of model.safeDryRunEnvelopes || []) {
    const envelopeValidation = validateResultEnvelope(envelope);
    if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
    if (envelope.status !== "BLOCKED" || envelope.ok !== false || envelope.mode !== "store-live-admission-safe-dry-run") {
      errors.push("Store live admission safe dry-run envelopes must remain blocked.");
    }
    const data = envelope.data || {};
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES.includes(data.actionName)) {
      errors.push("Store live admission safe dry-run action name must be allowlisted.");
    }
    if (data.admissionState !== "blocked" || data.disabledReason !== DISABLED_REASON) {
      errors.push(`${data.actionName || "safe dry-run action"} must remain blocked with the expected disabled reason.`);
    }
    const dataValues = Object.values(data).filter((value) => typeof value === "boolean");
    if (!dataValues.every((value) => value === false)) {
      errors.push(`${data.actionName || "safe dry-run action"} booleans must remain false.`);
    }
    const authorityValues = Object.values(data.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${data.actionName || "safe dry-run action"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Store live admission safe dry-run blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
