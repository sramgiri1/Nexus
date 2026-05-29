import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityActivationEligibilityMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_ELIGIBILITY_METADATA_PHASE = "P124.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_ELIGIBILITY_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_STATES = [
  "grant_not_allowed",
  "missing_prior_activation_boundary",
  "missing_operator_grant_scope",
  "missing_runtime_grant_guard",
  "ready_for_local_grant_intent_model_only",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  approvalApplicationAuthorityGrantAllowed: false,
  approvalApplicationAuthorityGrantWriteAllowed: false,
  approvalApplicationAuthorityGrantPersistenceAllowed: false,
  approvalApplicationAuthorityGrantRuntimeAdmissionAllowed: false,
  approvalApplicationAuthorityGrantOperatorOverrideAllowed: false,
  approvalApplicationAuthorityGrantSpendAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SECTIONS = [
  {
    sectionKey: "prior_activation_boundary",
    publicLabel: "Prior activation boundary",
    purpose: "Confirms the P123 activation boundary metadata exists before any grant intent is modeled.",
    defaultState: "missing_prior_activation_boundary",
    nextAction: "Reuse P123 activation boundary metadata as the read-only source for P124 grant intent planning.",
    blocker: "P124.2 does not grant authority or apply approval decisions.",
    evidenceLabels: ["P123.2 activation metadata", "P123.7 final validation"],
    activityLabels: ["P124.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS },
  },
  {
    sectionKey: "grant_scope",
    publicLabel: "Grant scope",
    purpose: "Describes the future operator questions required before approval application authority grant can be considered.",
    defaultState: "grant_not_allowed",
    nextAction: "Model grant intent locally in P124.3 before any dry-run or UX work.",
    blocker: "No approval application authority is granted in P124.2.",
    evidenceLabels: ["P124.1 contract report", "P124.2 metadata report"],
    activityLabels: ["Grant metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS },
  },
  {
    sectionKey: "runtime_write_guard",
    publicLabel: "Runtime write guard",
    purpose: "Keeps DB writes, runtime writes, execution unlock, dispatch, provider calls, and spend unavailable during grant metadata work.",
    defaultState: "missing_runtime_grant_guard",
    nextAction: "Keep runtime writes and execution blocked until a later explicit phase grants narrow authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network calls, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P124.2 metadata report"],
    activityLabels: ["Runtime grant guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS },
  },
  {
    sectionKey: "operator_evidence",
    publicLabel: "Operator evidence",
    purpose: "Defines display-safe labels for future operator review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "grant_not_allowed",
    nextAction: "Carry display-safe evidence labels into the P124.3 local grant intent model.",
    blocker: "P124.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P124.2 metadata report"],
    activityLabels: ["Operator grant evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata() {
  const priorActivationBoundary = buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_ELIGIBILITY_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_ELIGIBILITY_METADATA_PHASE,
    sourceActivationPhase: priorActivationBoundary.phaseId,
    sourceActivationVersion: priorActivationBoundary.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    grantPolicy: {
      mode: "metadata-only",
      disabledReason: "P124.2 defines approval application authority grant eligibility metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS,
    },
    grantStates: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_STATES],
    priorActivationBoundary: {
      phaseId: priorActivationBoundary.phaseId,
      metadataVersion: priorActivationBoundary.metadataVersion,
      metadataOnly: priorActivationBoundary.metadataOnly === true,
      localOnly: priorActivationBoundary.localOnly === true,
      commandCenterVisible: priorActivationBoundary.commandCenterVisible === false,
      sectionLabels: priorActivationBoundary.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorActivationBoundary.activationPolicy },
    },
    sections: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Approval application authority grant is not allowed.",
      "Activation, approval application, and approve/reject recording remain blocked.",
      "DB and runtime writes remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P124.2 metadata into P124.3 local grant intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Guard",
    costImpactLabel: "No provider spend",
  };
}
