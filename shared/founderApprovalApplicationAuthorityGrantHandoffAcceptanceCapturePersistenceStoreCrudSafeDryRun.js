import { createBlockedResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE = "P129.5";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES = [
  "dryRunStoreRecordCreate",
  "dryRunStoreRecordRead",
  "dryRunStoreRecordModify",
  "dryRunStoreRecordRemove",
  "dryRunStoreRecordList",
  "dryRunStoreEvidenceLink",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunCreateAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunReadAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunModifyAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunRemoveAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunListAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunEvidenceLinkAllowed: false,
};

const DISABLED_REASON = "P129.5 models blocked safe dry-run envelopes only; store CRUD execution remains blocked.";
const OWNER_CAPABILITY = "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Safe Dry Run Guard";

const DRY_RUN_ACTIONS = [
  {
    actionName: "dryRunStoreRecordCreate",
    publicLabel: "Store record create dry run",
    targetEntityName: "acceptanceCaptureStoreRecord",
  },
  {
    actionName: "dryRunStoreRecordRead",
    publicLabel: "Store record read dry run",
    targetEntityName: "acceptanceCaptureStoreRecord",
  },
  {
    actionName: "dryRunStoreRecordModify",
    publicLabel: "Store record modify dry run",
    targetEntityName: "acceptanceCaptureStoreRecord",
  },
  {
    actionName: "dryRunStoreRecordRemove",
    publicLabel: "Store record remove dry run",
    targetEntityName: "acceptanceCaptureStoreRecord",
  },
  {
    actionName: "dryRunStoreRecordList",
    publicLabel: "Store record list dry run",
    targetEntityName: "acceptanceCaptureStoreIndex",
  },
  {
    actionName: "dryRunStoreEvidenceLink",
    publicLabel: "Store evidence link dry run",
    targetEntityName: "acceptanceCaptureStoreEvidenceLink",
  },
];

function buildBlockedDryRunEnvelope(action) {
  return createBlockedResult({
    phase: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE,
    mode: "safe-dry-run",
    source: "nexus-os",
    summary: `${action.publicLabel} is blocked until a later explicit live persistence phase.`,
    data: {
      actionName: action.actionName,
      publicLabel: action.publicLabel,
      targetEntityName: action.targetEntityName,
      dryRunState: "blocked",
      disabledReason: DISABLED_REASON,
      ownerCapability: OWNER_CAPABILITY,
      nextAction: "Route to P129.6 Command Center store UX before any live persistence action can be considered.",
      evidenceLabels: ["P129.5 CRUD safe dry run"],
      activityLabels: [`${action.publicLabel} modeled locally`],
      costImpactLabel: "No provider spend",
      canRunCrud: false,
      canCreateStoreRecord: false,
      canReadStoreRecord: false,
      canModifyStoreRecord: false,
      canRemoveStoreRecord: false,
      canListStoreRecords: false,
      canLinkEvidence: false,
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
      authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS },
    },
    warnings: ["Safe dry run remains blocked by P129.5 policy."],
    evidence: ["P129.5 CRUD safe dry run"],
  });
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun() {
  const migrationPreview = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview();
  const migrationPreviewValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview(migrationPreview);
  const dryRunEnvelopes = DRY_RUN_ACTIONS.map(buildBlockedDryRunEnvelope);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE,
    sourceMigrationPreviewPhase: migrationPreview.phaseId,
    sourceMigrationPreviewVersion: migrationPreview.metadataVersion,
    sourceRepositoryIntentPhase: migrationPreview.sourceRepositoryIntentPhase,
    sourceStoreMetadataPhase: migrationPreview.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: migrationPreview.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: migrationPreview.sourceCapturePhase,
    sourceMigrationPreviewValid: migrationPreviewValidation.valid,
    safeDryRunOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    dryRunPolicy: {
      mode: "safe-dry-run-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS,
    },
    actionNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES],
    dryRunEnvelopes,
    blockers: [
      "Acceptance capture persistence store CRUD execution is not allowed.",
      "No DB read, DB write, runtime write, schema, migration, or raw SQL interface is used.",
      "Store CRUD is represented as blocked local safe dry-run envelopes only.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P129.5 safe dry-run envelopes into P129.6 Command Center store UX.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P129.5 CRUD safe dry run"],
    activityLabels: ["Store CRUD safe dry-run envelopes modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun(dryRun = {}) {
  const errors = [];
  if (dryRun.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION) {
    errors.push("Unexpected acceptance capture persistence store CRUD safe dry-run version.");
  }
  if (dryRun.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE) {
    errors.push("Unexpected acceptance capture persistence store CRUD safe dry-run phase.");
  }
  if (dryRun.sourceMigrationPreviewPhase !== "P129.4" || dryRun.sourceMigrationPreviewVersion !== "1.0") {
    errors.push("CRUD safe dry run must reuse P129.4 migration preview.");
  }
  if (dryRun.sourceRepositoryIntentPhase !== "P129.3" || dryRun.sourceStoreMetadataPhase !== "P129.2" || dryRun.sourcePersistenceBoundaryPhase !== "P128.2" || dryRun.sourceCapturePhase !== "P127.2") {
    errors.push("CRUD safe dry run must preserve repository, store metadata, persistence boundary, and capture lineage.");
  }
  if (dryRun.safeDryRunOnly !== true || dryRun.localOnly !== true || dryRun.commandCenterVisible !== false) {
    errors.push("CRUD safe dry run must remain local dry-run metadata and hidden from primary UX.");
  }
  if (dryRun.dryRunPolicy?.mode !== "safe-dry-run-only") {
    errors.push("CRUD safe dry-run policy must remain safe-dry-run-only.");
  }
  const policyValues = Object.values(dryRun.dryRunPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("CRUD safe dry-run policy booleans must remain false.");
  }
  if (!Array.isArray(dryRun.dryRunEnvelopes) || dryRun.dryRunEnvelopes.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES.length) {
    errors.push("CRUD safe dry-run envelopes are incomplete.");
  }
  for (const envelope of dryRun.dryRunEnvelopes || []) {
    const envelopeValidation = validateResultEnvelope(envelope);
    if (!envelopeValidation.valid) {
      errors.push(...envelopeValidation.errors);
    }
    if (envelope.status !== "BLOCKED" || envelope.ok !== false || envelope.mode !== "safe-dry-run") {
      errors.push("CRUD safe dry-run envelopes must remain blocked.");
    }
    const data = envelope.data || {};
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES.includes(data.actionName)) {
      errors.push("CRUD safe dry-run action name must be allowlisted.");
    }
    const dataValues = Object.values(data).filter((value) => typeof value === "boolean");
    if (!dataValues.every((value) => value === false)) {
      errors.push(`${data.actionName || "dry-run action"} booleans must remain false.`);
    }
    const authorityValues = Object.values(data.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${data.actionName || "dry-run action"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(dryRun.blockers) || dryRun.blockers.length < 4) {
    errors.push("CRUD safe dry-run blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
