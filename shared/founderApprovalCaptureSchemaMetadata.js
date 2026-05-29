export const FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE = "P118.2";
export const FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION = "1.0";

export const FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES = [
  "founderApprovalCaptureRequests",
  "founderApprovalCaptureEvents",
  "founderApprovalCaptureEvidenceRefs",
];

export const FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS = {
  approvalCaptureAllowed: false,
  approvalPersistenceAllowed: false,
  approvalDecisionRecordingAllowed: false,
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

export const FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES = [
  {
    entityName: "founderApprovalCaptureRequests",
    publicLabel: "Approval capture request",
    purpose: "Display-safe metadata for a future founder approval capture request.",
    primaryKeyLabel: "capture request reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      captureRequestRef: "display-safe string",
      sourceGateLabel: "display-safe string",
      founderQuestion: "display-safe string",
      requestedDecisionLabel: "display-safe string",
      currentState: "display-safe string",
      nextAction: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      activityLabels: "display-safe string array",
      costImpactLabel: "display-safe string",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalCaptureEvents",
    publicLabel: "Approval capture event",
    purpose: "Display-safe metadata for future approval capture boundary events.",
    primaryKeyLabel: "capture event reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      captureEventRef: "display-safe string",
      captureRequestRef: "display-safe string",
      eventType: "display-safe string",
      eventState: "display-safe string",
      actorLabel: "display-safe string",
      eventSummary: "display-safe string",
      rollbackLabel: "display-safe string",
      evidenceLabels: "display-safe string array",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalCaptureEvidenceRefs",
    publicLabel: "Approval capture evidence",
    purpose: "Display-safe metadata for future approval capture evidence references.",
    primaryKeyLabel: "capture evidence reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      captureEvidenceRef: "display-safe string",
      captureRequestRef: "display-safe string",
      evidenceLabel: "display-safe string",
      evidenceType: "display-safe string",
      evidenceLocationLabel: "display-safe string",
      redactionRequired: "boolean",
      retainedForAudit: "boolean",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS },
  },
];

export function buildFounderApprovalCaptureSchemaMetadata() {
  return {
    schemaVersion: FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION,
    phaseId: FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE,
    schemaOnly: true,
    commandCenterVisible: false,
    writePolicy: {
      mode: "metadata-only",
      disabledReason: "P118.2 defines approval capture schema metadata only.",
      ...FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS,
    },
    entities: FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES.map((entity) => ({
      ...entity,
      authorityFlags: { ...entity.authorityFlags },
    })),
  };
}
