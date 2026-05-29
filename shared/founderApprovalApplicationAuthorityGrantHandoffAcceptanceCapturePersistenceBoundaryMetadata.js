import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE = "P128.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES = [
  "acceptanceCapturePersistenceDraft",
  "acceptanceCapturePersistenceEvent",
  "acceptanceCapturePersistenceEvidence",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceMetadataAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceDraftAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceEventAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceEvidenceAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceDbWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceRuntimeWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceMigrationAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSqlAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES = [
  {
    entityName: "acceptanceCapturePersistenceDraft",
    publicLabel: "Acceptance capture persistence draft",
    purpose: "Display-safe metadata for a future local draft of acceptance capture persistence requirements.",
    primaryKeyLabel: "persistence draft reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceDraftReference: "display-safe string",
      sourceCaptureLabel: "display-safe string",
      captureSummary: "display-safe string",
      persistenceState: "display-safe string",
      nextAction: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      activityLabels: "display-safe string array",
      costImpactLabel: "display-safe string",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS },
  },
  {
    entityName: "acceptanceCapturePersistenceEvent",
    publicLabel: "Acceptance capture persistence event",
    purpose: "Display-safe metadata for future acceptance capture persistence review events.",
    primaryKeyLabel: "persistence event reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceEventReference: "display-safe string",
      persistenceDraftReference: "display-safe string",
      eventTypeLabel: "display-safe string",
      eventState: "display-safe string",
      actorLabel: "display-safe string",
      eventSummary: "display-safe string",
      rollbackLabel: "display-safe string",
      evidenceLabels: "display-safe string array",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS },
  },
  {
    entityName: "acceptanceCapturePersistenceEvidence",
    publicLabel: "Acceptance capture persistence evidence",
    purpose: "Display-safe metadata for future acceptance capture persistence evidence references.",
    primaryKeyLabel: "persistence evidence reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceEvidenceReference: "display-safe string",
      persistenceDraftReference: "display-safe string",
      evidenceLabel: "display-safe string",
      evidenceType: "display-safe string",
      evidenceLocationLabel: "display-safe string",
      redactionRequired: "boolean",
      retainedForAudit: "boolean",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata() {
  const captureMetadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE,
    sourceCapturePhase: captureMetadata.phaseId,
    sourceCaptureVersion: captureMetadata.metadataVersion,
    metadataOnly: true,
    schemaOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    persistencePolicy: {
      mode: "metadata-only",
      disabledReason: "P128.2 defines acceptance capture persistence schema metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
    },
    sourceCaptureBoundary: {
      phaseId: captureMetadata.phaseId,
      metadataVersion: captureMetadata.metadataVersion,
      metadataOnly: captureMetadata.metadataOnly === true,
      localOnly: captureMetadata.localOnly === true,
      commandCenterVisible: captureMetadata.commandCenterVisible === false,
      sectionLabels: captureMetadata.sections.map((section) => section.publicLabel),
      authorityFlags: { ...captureMetadata.capturePolicy },
    },
    entityNames: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES],
    entities: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES.map((entity) => ({
      ...entity,
      fields: { ...entity.fields },
      authorityFlags: { ...entity.authorityFlags },
    })),
    blockers: [
      "Acceptance capture persistence is not allowed.",
      "No DB schema, migration, table, or runtime record is created.",
      "Acceptance capture, handoff acceptance, authority handoff, authority grant, activation, approval application, and approve/reject recording remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P128.2 metadata into P128.3 local acceptance capture persistence intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Persistence Guard",
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata(metadata = {}) {
  const errors = [];
  if (metadata.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION) {
    errors.push("Unexpected acceptance capture persistence metadata version.");
  }
  if (metadata.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE) {
    errors.push("Unexpected acceptance capture persistence metadata phase.");
  }
  if (metadata.sourceCapturePhase !== "P127.2" || metadata.sourceCaptureVersion !== "1.0") {
    errors.push("Acceptance capture persistence metadata must reuse P127.2 capture metadata.");
  }
  if (metadata.metadataOnly !== true || metadata.schemaOnly !== true || metadata.localOnly !== true || metadata.commandCenterVisible !== false) {
    errors.push("Acceptance capture persistence metadata must remain local schema metadata and hidden from primary UX.");
  }
  if (metadata.persistencePolicy?.mode !== "metadata-only") {
    errors.push("Acceptance capture persistence policy must remain metadata-only.");
  }
  const policyValues = Object.values(metadata.persistencePolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Acceptance capture persistence policy booleans must remain false.");
  }
  if (!Array.isArray(metadata.entities) || metadata.entities.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES.length) {
    errors.push("Acceptance capture persistence entities are incomplete.");
  }
  for (const entity of metadata.entities || []) {
    if (!entity.entityName || !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES.includes(entity.entityName)) {
      errors.push("Acceptance capture persistence entity name must be allowlisted.");
    }
    const values = Object.values(entity.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!values.every((value) => value === false)) {
      errors.push(`${entity.entityName || "entity"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(metadata.blockers) || metadata.blockers.length < 4) {
    errors.push("Acceptance capture persistence blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
