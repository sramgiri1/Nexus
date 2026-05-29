import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE = "P129.3";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES = [
  "prepareStoreRecordCreateIntent",
  "prepareStoreRecordReadIntent",
  "prepareStoreRecordModifyIntent",
  "prepareStoreRecordRemoveIntent",
  "prepareStoreRecordListIntent",
  "prepareStoreEvidenceLinkIntent",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryCreateIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryReadIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryModifyIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryRemoveIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryListIntentAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryEvidenceLinkIntentAllowed: false,
};

const BASE_DISABLED_REASON = "P129.3 models repository intent only; store execution remains blocked.";
const OWNER_CAPABILITY = "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Repository Guard";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS = [
  {
    operationName: "prepareStoreRecordCreateIntent",
    publicLabel: "Store record create intent",
    operationKind: "create-intent",
    targetEntityName: "acceptanceCaptureStoreRecord",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store record create intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    operationName: "prepareStoreRecordReadIntent",
    publicLabel: "Store record read intent",
    operationKind: "read-intent",
    targetEntityName: "acceptanceCaptureStoreRecord",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store record read intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    operationName: "prepareStoreRecordModifyIntent",
    publicLabel: "Store record modify intent",
    operationKind: "modify-intent",
    targetEntityName: "acceptanceCaptureStoreRecord",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store record modify intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    operationName: "prepareStoreRecordRemoveIntent",
    publicLabel: "Store record remove intent",
    operationKind: "remove-intent",
    targetEntityName: "acceptanceCaptureStoreRecord",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store record remove intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    operationName: "prepareStoreRecordListIntent",
    publicLabel: "Store record list intent",
    operationKind: "list-intent",
    targetEntityName: "acceptanceCaptureStoreIndex",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store record list intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
  {
    operationName: "prepareStoreEvidenceLinkIntent",
    publicLabel: "Store evidence link intent",
    operationKind: "evidence-link-intent",
    targetEntityName: "acceptanceCaptureStoreEvidenceLink",
    currentState: "blocked",
    disabledReason: BASE_DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P129.4 migration preview before any local store action can be considered.",
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Store evidence link intent modeled locally"],
    costImpactLabel: "No provider spend",
  },
];

function withBlockedAuthority(row) {
  return {
    ...row,
    canCreateStoreRecord: false,
    canReadStoreRecord: false,
    canModifyStoreRecord: false,
    canRemoveStoreRecord: false,
    canListStoreRecords: false,
    canLinkEvidence: false,
    canCreateSchema: false,
    canRunMigration: false,
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
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS },
  };
}

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel() {
  const storeMetadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata();
  const storeMetadataValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata(storeMetadata);

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE,
    sourceStoreMetadataPhase: storeMetadata.phaseId,
    sourceStoreMetadataVersion: storeMetadata.metadataVersion,
    sourcePersistenceBoundaryPhase: storeMetadata.sourcePersistenceBoundaryPhase,
    sourceCapturePhase: storeMetadata.sourceCapturePhase,
    sourceStoreMetadataValid: storeMetadataValidation.valid,
    modelOnly: true,
    intentOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    repositoryPolicy: {
      mode: "intent-only",
      disabledReason: BASE_DISABLED_REASON,
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS,
    },
    storeEntityNames: [...storeMetadata.entityNames],
    operationNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES],
    intentRows: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS.map((row) => ({
      ...withBlockedAuthority(row),
      evidenceLabels: [...row.evidenceLabels],
      activityLabels: [...row.activityLabels],
    })),
    blockers: [
      "Acceptance capture persistence store repository CRUD is not allowed.",
      "No DB schema, migration, table, index, raw SQL interface, read, write, or runtime record is created.",
      "Store repository operations are represented as blocked local intent rows only.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P129.3 intent rows into P129.4 store migration preview.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P129.3 repository intent model"],
    activityLabels: ["Repository intent rows modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel(model = {}) {
  const errors = [];
  if (model.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION) {
    errors.push("Unexpected acceptance capture persistence store repository intent version.");
  }
  if (model.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE) {
    errors.push("Unexpected acceptance capture persistence store repository intent phase.");
  }
  if (model.sourceStoreMetadataPhase !== "P129.2" || model.sourceStoreMetadataVersion !== "1.0") {
    errors.push("Repository intent model must reuse P129.2 store metadata.");
  }
  if (model.sourcePersistenceBoundaryPhase !== "P128.2" || model.sourceCapturePhase !== "P127.2") {
    errors.push("Repository intent model must preserve persistence boundary and capture lineage.");
  }
  if (model.modelOnly !== true || model.intentOnly !== true || model.localOnly !== true || model.commandCenterVisible !== false) {
    errors.push("Repository intent model must remain local intent metadata and hidden from primary UX.");
  }
  if (model.repositoryPolicy?.mode !== "intent-only") {
    errors.push("Repository policy must remain intent-only.");
  }
  const policyValues = Object.values(model.repositoryPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Repository policy booleans must remain false.");
  }
  if (!Array.isArray(model.intentRows) || model.intentRows.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS.length) {
    errors.push("Repository intent rows are incomplete.");
  }
  for (const row of model.intentRows || []) {
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES.includes(row.operationName)) {
      errors.push("Repository intent operation name must be allowlisted.");
    }
    if (!FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES.includes(row.targetEntityName)) {
      errors.push("Repository intent target entity must be allowlisted.");
    }
    const rowValues = Object.values(row).filter((value) => typeof value === "boolean");
    if (!rowValues.every((value) => value === false)) {
      errors.push(`${row.operationName || "operation"} booleans must remain false.`);
    }
    const authorityValues = Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${row.operationName || "operation"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) {
    errors.push("Repository intent blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
