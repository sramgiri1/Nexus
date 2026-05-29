export const FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE = "P121.2";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_STATES = [
  "application_not_allowed",
  "missing_persisted_decision",
  "missing_runtime_authority",
  "ready_for_safe_dry_run_only",
];

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS = {
  approvalDecisionApplicationAllowed: false,
  approvalCaptureAllowed: false,
  approvalPersistenceAllowed: false,
  approvalDecisionRecordingAllowed: false,
  approveDecisionAllowed: false,
  rejectDecisionAllowed: false,
  dbWriteAllowed: false,
  hostedDbMutationAllowed: false,
  runtimeWriteAllowed: false,
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

export const FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_SECTIONS = [
  {
    sectionKey: "decision_source",
    publicLabel: "Decision source",
    purpose: "Display-safe metadata describing whether a future persisted approval decision could be considered for application.",
    defaultState: "missing_persisted_decision",
    nextAction: "Define read-only eligibility inputs before any application behavior is considered.",
    blocker: "P121.2 defines metadata only and does not read or persist approval decisions.",
    evidenceLabels: ["P121.2 metadata report", "P120 final validation report"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS },
  },
  {
    sectionKey: "runtime_authority",
    publicLabel: "Runtime authority",
    purpose: "Display-safe metadata describing whether a future approval application could affect runtime admission.",
    defaultState: "missing_runtime_authority",
    nextAction: "Keep runtime admission blocked until a later contract explicitly grants narrow authority.",
    blocker: "Runtime writes, execution, and execution unlock remain unavailable.",
    evidenceLabels: ["OS phase status report", "P121.2 metadata report"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS },
  },
  {
    sectionKey: "operator_evidence",
    publicLabel: "Operator evidence",
    purpose: "Display-safe metadata describing future evidence needed before approval application can be evaluated.",
    defaultState: "application_not_allowed",
    nextAction: "Collect only display-safe evidence labels in later preview phases.",
    blocker: "P121.2 does not create evidence records, DB rows, runtime events, or audit entries.",
    evidenceLabels: ["P121.2 metadata report"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS },
  },
];

export function buildFounderApprovalDecisionApplicationEligibilityMetadata() {
  return {
    metadataVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE,
    metadataOnly: true,
    commandCenterVisible: false,
    writePolicy: {
      mode: "metadata-only",
      disabledReason: "P121.2 defines approval decision application eligibility metadata only.",
      ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
    },
    eligibilityStates: [...FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_STATES],
    sections: FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
  };
}
