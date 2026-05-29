import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE = "P129.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES = [
  "acceptanceCaptureStoreRecord",
  "acceptanceCaptureStoreIndex",
  "acceptanceCaptureStoreEvidenceLink",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadataAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRecordAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreIndexAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreEvidenceLinkAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCreateAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreReadAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreUpdateAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDeleteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreListAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbReadAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRuntimeWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreSqlAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES = [
  {
    entityName: "acceptanceCaptureStoreRecord",
    publicLabel: "Acceptance capture store record",
    purpose: "Display-safe metadata for a future local store record for acceptance capture persistence.",
    primaryKeyLabel: "store record reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      storeRecordReference: "display-safe string",
      sourcePersistenceDraftReference: "display-safe string",
      captureSummary: "display-safe string",
      storeState: "display-safe string",
      readState: "display-safe string",
      writeState: "display-safe string",
      nextAction: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      activityLabels: "display-safe string array",
      costImpactLabel: "display-safe string",
      createdAtLabel: "display-safe string",
      updatedAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS },
  },
  {
    entityName: "acceptanceCaptureStoreIndex",
    publicLabel: "Acceptance capture store index",
    purpose: "Display-safe metadata for future local lookup labels over acceptance capture store records.",
    primaryKeyLabel: "store index reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      storeIndexReference: "display-safe string",
      storeRecordReference: "display-safe string",
      indexLabel: "display-safe string",
      lookupState: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS },
  },
  {
    entityName: "acceptanceCaptureStoreEvidenceLink",
    publicLabel: "Acceptance capture store evidence link",
    purpose: "Display-safe metadata for future local evidence links associated with acceptance capture store records.",
    primaryKeyLabel: "store evidence reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      storeEvidenceReference: "display-safe string",
      storeRecordReference: "display-safe string",
      evidenceLabel: "display-safe string",
      evidenceType: "display-safe string",
      evidenceLocationLabel: "display-safe string",
      retainedForAudit: "boolean",
      redactionRequired: "boolean",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata() {
  const persistenceBoundaryMetadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE,
    sourcePersistenceBoundaryPhase: persistenceBoundaryMetadata.phaseId,
    sourcePersistenceBoundaryVersion: persistenceBoundaryMetadata.metadataVersion,
    sourceCapturePhase: persistenceBoundaryMetadata.sourceCapturePhase,
    metadataOnly: true,
    schemaOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    storePolicy: {
      mode: "metadata-only",
      disabledReason: "P129.2 defines acceptance capture persistence store metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS,
    },
    sourcePersistenceBoundary: {
      phaseId: persistenceBoundaryMetadata.phaseId,
      metadataVersion: persistenceBoundaryMetadata.metadataVersion,
      metadataOnly: persistenceBoundaryMetadata.metadataOnly === true,
      schemaOnly: persistenceBoundaryMetadata.schemaOnly === true,
      localOnly: persistenceBoundaryMetadata.localOnly === true,
      commandCenterVisible: persistenceBoundaryMetadata.commandCenterVisible === false,
      entityNames: [...persistenceBoundaryMetadata.entityNames],
      authorityFlags: { ...persistenceBoundaryMetadata.persistencePolicy },
    },
    entityNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES],
    entities: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES.map((entity) => ({
      ...entity,
      fields: { ...entity.fields },
      authorityFlags: { ...entity.authorityFlags },
    })),
    blockers: [
      "Acceptance capture persistence store CRUD is not allowed.",
      "No DB schema, migration, table, index, raw SQL interface, read, write, or runtime record is created.",
      "Acceptance capture, handoff acceptance, authority handoff, authority grant, activation, approval application, and approve/reject recording remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P129.2 metadata into P129.3 local store repository intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Guard",
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata(metadata = {}) {
  const errors = [];
  if (metadata.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION) {
    errors.push("Unexpected acceptance capture persistence store metadata version.");
  }
  if (metadata.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE) {
    errors.push("Unexpected acceptance capture persistence store metadata phase.");
  }
  if (metadata.sourcePersistenceBoundaryPhase !== "P128.2" || metadata.sourcePersistenceBoundaryVersion !== "1.0") {
    errors.push("Acceptance capture persistence store metadata must reuse P128.2 persistence boundary metadata.");
  }
  if (metadata.sourceCapturePhase !== "P127.2") {
    errors.push("Acceptance capture persistence store metadata must preserve P127.2 capture metadata lineage.");
  }
  if (metadata.metadataOnly !== true || metadata.schemaOnly !== true || metadata.localOnly !== true || metadata.commandCenterVisible !== false) {
    errors.push("Acceptance capture persistence store metadata must remain local schema metadata and hidden from primary UX.");
  }
  if (metadata.storePolicy?.mode !== "metadata-only") {
    errors.push("Acceptance capture persistence store policy must remain metadata-only.");
  }
  const policyValues = Object.values(metadata.storePolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Acceptance capture persistence store policy booleans must remain false.");
  }
  if (!Array.isArray(metadata.entities) || metadata.entities.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES.length) {
    errors.push("Acceptance capture persistence store entities are incomplete.");
  }
  for (const entity of metadata.entities || []) {
    if (!entity.entityName || !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES.includes(entity.entityName)) {
      errors.push("Acceptance capture persistence store entity name must be allowlisted.");
    }
    const values = Object.values(entity.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!values.every((value) => value === false)) {
      errors.push(`${entity.entityName || "entity"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(metadata.blockers) || metadata.blockers.length < 4) {
    errors.push("Acceptance capture persistence store blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
