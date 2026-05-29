import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntent.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE = "P129.4";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES = [
  "storeRecordContainerPreview",
  "storeIndexLookupPreview",
  "storeEvidenceLinkPreview",
  "storeRetentionAuditPreview",
  "storeRollbackPlanPreview",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreviewAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreSchemaContainerPreviewAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreIndexPreviewAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreEvidenceLinkPreviewAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRetentionPreviewAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRollbackPreviewAllowed: false,
};

const DISABLED_REASON = "P129.4 previews migration readiness only; store migration execution remains blocked.";
const OWNER_CAPABILITY = "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Migration Guard";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS = [
  {
    previewAreaName: "storeRecordContainerPreview",
    publicLabel: "Store record container preview",
    targetEntityName: "acceptanceCaptureStoreRecord",
    previewState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.5 store CRUD safe dry run before any local store action can be considered.",
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store record container preview modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    previewAreaName: "storeIndexLookupPreview",
    publicLabel: "Store index lookup preview",
    targetEntityName: "acceptanceCaptureStoreIndex",
    previewState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.5 store CRUD safe dry run before any local store action can be considered.",
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store index lookup preview modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    previewAreaName: "storeEvidenceLinkPreview",
    publicLabel: "Store evidence link preview",
    targetEntityName: "acceptanceCaptureStoreEvidenceLink",
    previewState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.5 store CRUD safe dry run before any local store action can be considered.",
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store evidence link preview modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    previewAreaName: "storeRetentionAuditPreview",
    publicLabel: "Store retention audit preview",
    targetEntityName: "acceptanceCaptureStoreRecord",
    previewState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.5 store CRUD safe dry run before any local store action can be considered.",
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store retention audit preview modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    previewAreaName: "storeRollbackPlanPreview",
    publicLabel: "Store rollback plan preview",
    targetEntityName: "acceptanceCaptureStoreRecord",
    previewState: "blocked",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.5 store CRUD safe dry run before any local store action can be considered.",
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store rollback plan preview modeled locally"],
    costImpactLabel: "No provider spend",
  },
];

function withBlockedPreviewAuthority(item) {
  return {
    ...item,
    canCreateSchemaContainer: false,
    canPrepareMigrationFile: false,
    canRunMigration: false,
    canReadDb: false,
    canWriteDb: false,
    canWriteRuntime: false,
    canPersistCapture: false,
    canRunCrud: false,
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
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS },
  };
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview() {
  const repositoryIntentModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel();
  const repositoryIntentValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel(repositoryIntentModel);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE,
    sourceRepositoryIntentPhase: repositoryIntentModel.phaseId,
    sourceRepositoryIntentVersion: repositoryIntentModel.metadataVersion,
    sourceStoreMetadataPhase: repositoryIntentModel.sourceStoreMetadataPhase,
    sourcePersistenceBoundaryPhase: repositoryIntentModel.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: repositoryIntentModel.sourceCapturePhase,
    sourceRepositoryIntentValid: repositoryIntentValidation.valid,
    previewOnly: true,
    migrationPreviewOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    migrationPolicy: {
      mode: "preview-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS,
    },
    previewAreaNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES],
    previewItems: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS.map((item) => ({
      ...withBlockedPreviewAuthority(item),
      evidenceLabels: [...item.evidenceLabels],
      activityLabels: [...item.activityLabels],
    })),
    blockers: [
      "Acceptance capture persistence store migration execution is not allowed.",
      "No DB schema file, migration file, raw SQL interface, read, write, or runtime record is created.",
      "Store CRUD remains represented as blocked local preview metadata only.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P129.4 migration preview into P129.5 store CRUD safe dry run modeling.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P129.4 migration preview"],
    activityLabels: ["Store migration preview modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview(preview = {}) {
  const errors = [];
  if (preview.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION) {
    errors.push("Unexpected acceptance capture persistence store migration preview version.");
  }
  if (preview.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE) {
    errors.push("Unexpected acceptance capture persistence store migration preview phase.");
  }
  if (preview.sourceRepositoryIntentPhase !== "P129.3" || preview.sourceRepositoryIntentVersion !== "1.0") {
    errors.push("Migration preview must reuse P129.3 repository intent model.");
  }
  if (preview.sourceStoreMetadataPhase !== "P129.2" || preview.sourcePersistenceBoundaryPhase !== "P128.2" || preview.sourceCapturePhase !== "P127.2") {
    errors.push("Migration preview must preserve store metadata, persistence boundary, and capture lineage.");
  }
  if (preview.previewOnly !== true || preview.migrationPreviewOnly !== true || preview.localOnly !== true || preview.commandCenterVisible !== false) {
    errors.push("Migration preview must remain local preview metadata and hidden from primary UX.");
  }
  if (preview.migrationPolicy?.mode !== "preview-only") {
    errors.push("Migration policy must remain preview-only.");
  }
  const policyValues = Object.values(preview.migrationPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Migration policy booleans must remain false.");
  }
  if (!Array.isArray(preview.previewItems) || preview.previewItems.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS.length) {
    errors.push("Migration preview items are incomplete.");
  }
  for (const item of preview.previewItems || []) {
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES.includes(item.previewAreaName)) {
      errors.push("Migration preview area name must be allowlisted.");
    }
    const itemValues = Object.values(item).filter((value) => typeof value === "boolean");
    if (!itemValues.every((value) => value === false)) {
      errors.push(`${item.previewAreaName || "preview item"} booleans must remain false.`);
    }
    const authorityValues = Object.values(item.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${item.previewAreaName || "preview item"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 4) {
    errors.push("Migration preview blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
