export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_METADATA_PHASE = "P120.2";
export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_ENTITY_NAMES = [
  "founderApprovalDecisionPersistenceDrafts",
  "founderApprovalDecisionPersistenceEvents",
  "founderApprovalDecisionPersistenceEvidenceRefs",
];

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS = {
  approvalCaptureAllowed: false,
  approvalPersistenceAllowed: false,
  approvalDecisionRecordingAllowed: false,
  approveDecisionAllowed: false,
  rejectDecisionAllowed: false,
  decisionPersistenceAllowed: false,
  dbWriteAllowed: false,
  hostedDbMutationAllowed: false,
  runtimeExecutionAllowed: false,
  executionUnlockAllowed: false,
  providerCallAllowed: false,
  agentDispatchAllowed: false,
  workerExecutionAllowed: false,
  toolExecutionAllowed: false,
  projectMutationAllowed: false,
  deployActionAllowed: false,
  releaseActionAllowed: false,
  exportActionAllowed: false,
  packageActionAllowed: false,
  networkCallAllowed: false,
  providerSpendAllowed: false,
};

export const FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_ENTITIES = [
  {
    entityName: "founderApprovalDecisionPersistenceDrafts",
    publicLabel: "Approval decision persistence draft",
    purpose: "Display-safe metadata for a future founder approval decision persistence draft.",
    primaryKeyLabel: "persistence draft reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceDraftRef: "display-safe string",
      sourceDecisionLabel: "display-safe string",
      decisionSummary: "display-safe string",
      persistenceState: "display-safe string",
      nextAction: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      activityLabels: "display-safe string array",
      costImpactLabel: "display-safe string",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalDecisionPersistenceEvents",
    publicLabel: "Approval decision persistence event",
    purpose: "Display-safe metadata for future approval decision persistence boundary events.",
    primaryKeyLabel: "persistence event reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceEventRef: "display-safe string",
      persistenceDraftRef: "display-safe string",
      eventType: "display-safe string",
      eventState: "display-safe string",
      actorLabel: "display-safe string",
      eventSummary: "display-safe string",
      rollbackLabel: "display-safe string",
      evidenceLabels: "display-safe string array",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalDecisionPersistenceEvidenceRefs",
    publicLabel: "Approval decision persistence evidence",
    purpose: "Display-safe metadata for future approval decision persistence evidence references.",
    primaryKeyLabel: "persistence evidence reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      persistenceEvidenceRef: "display-safe string",
      persistenceDraftRef: "display-safe string",
      evidenceLabel: "display-safe string",
      evidenceType: "display-safe string",
      evidenceLocationLabel: "display-safe string",
      redactionRequired: "boolean",
      retainedForAudit: "boolean",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS },
  },
];

export function buildFounderApprovalDecisionPersistenceSchemaMetadata() {
  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_METADATA_PHASE,
    schemaOnly: true,
    commandCenterVisible: false,
    writePolicy: {
      mode: "metadata-only",
      disabledReason: "P120.2 defines approval decision persistence schema metadata only.",
      ...FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS,
    },
    entities: FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_ENTITIES.map((entity) => ({
      ...entity,
      authorityFlags: { ...entity.authorityFlags },
    })),
  };
}
