export const FOUNDER_APPROVAL_DECISION_SCHEMA_METADATA_PHASE = "P119.2";
export const FOUNDER_APPROVAL_DECISION_SCHEMA_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_ENTITY_NAMES = [
  "founderApprovalDecisionRequests",
  "founderApprovalDecisionEvents",
  "founderApprovalDecisionEvidenceRefs",
];

export const FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS = {
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

export const FOUNDER_APPROVAL_DECISION_SCHEMA_ENTITIES = [
  {
    entityName: "founderApprovalDecisionRequests",
    publicLabel: "Approval decision request",
    purpose: "Display-safe metadata for a future founder approve/reject decision request.",
    primaryKeyLabel: "decision request reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      decisionRequestRef: "display-safe string",
      sourceCaptureLabel: "display-safe string",
      founderQuestion: "display-safe string",
      requestedDecisionLabel: "display-safe string",
      proposedDecisionLabel: "display-safe string",
      currentState: "display-safe string",
      nextAction: "display-safe string",
      disabledReason: "display-safe string",
      ownerCapability: "display-safe string",
      evidenceLabels: "display-safe string array",
      activityLabels: "display-safe string array",
      costImpactLabel: "display-safe string",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalDecisionEvents",
    publicLabel: "Approval decision event",
    purpose: "Display-safe metadata for future approval decision boundary events.",
    primaryKeyLabel: "decision event reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      decisionEventRef: "display-safe string",
      decisionRequestRef: "display-safe string",
      eventType: "display-safe string",
      eventState: "display-safe string",
      actorLabel: "display-safe string",
      eventSummary: "display-safe string",
      rollbackLabel: "display-safe string",
      evidenceLabels: "display-safe string array",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS },
  },
  {
    entityName: "founderApprovalDecisionEvidenceRefs",
    publicLabel: "Approval decision evidence",
    purpose: "Display-safe metadata for future approval decision evidence references.",
    primaryKeyLabel: "decision evidence reference",
    retentionClass: "local_os_metadata",
    piiRisk: "low",
    redactionRequired: true,
    fields: {
      decisionEvidenceRef: "display-safe string",
      decisionRequestRef: "display-safe string",
      evidenceLabel: "display-safe string",
      evidenceType: "display-safe string",
      evidenceLocationLabel: "display-safe string",
      redactionRequired: "boolean",
      retainedForAudit: "boolean",
      createdAtLabel: "display-safe string",
    },
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS },
  },
];

export function buildFounderApprovalDecisionSchemaMetadata() {
  return {
    schemaVersion: FOUNDER_APPROVAL_DECISION_SCHEMA_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_SCHEMA_METADATA_PHASE,
    schemaOnly: true,
    commandCenterVisible: false,
    writePolicy: {
      mode: "metadata-only",
      disabledReason: "P119.2 defines approval decision schema metadata only.",
      ...FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS,
    },
    entities: FOUNDER_APPROVAL_DECISION_SCHEMA_ENTITIES.map((entity) => ({
      ...entity,
      authorityFlags: { ...entity.authorityFlags },
    })),
  };
}
