import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata,
} from "./founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE = "P123.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES = [
  "activation_not_allowed",
  "missing_prior_authority_handoff",
  "missing_operator_activation_scope",
  "missing_runtime_activation_guard",
  "ready_for_local_activation_intent_model_only",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  approvalApplicationAuthorityActivationAllowed: false,
  approvalApplicationAuthorityGrantAllowed: false,
  approvalApplicationAuthorityActivationWriteAllowed: false,
  approvalApplicationAuthorityActivationPersistenceAllowed: false,
  approvalApplicationAuthorityActivationRuntimeAdmissionAllowed: false,
  approvalApplicationAuthorityActivationOperatorOverrideAllowed: false,
  approvalApplicationAuthorityActivationSpendAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS = [
  {
    sectionKey: "prior_handoff",
    publicLabel: "Prior handoff",
    purpose: "Confirms the P122 authority handoff metadata exists before any activation intent is modeled.",
    defaultState: "missing_prior_authority_handoff",
    nextAction: "Reuse P122 authority handoff metadata as the read-only source for P123 activation intent planning.",
    blocker: "P123.2 does not activate authority or apply approval decisions.",
    evidenceLabels: ["P122.2 authority metadata", "P122.7 final validation"],
    activityLabels: ["P123.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS },
  },
  {
    sectionKey: "activation_scope",
    publicLabel: "Activation scope",
    purpose: "Describes the future operator questions required before activation authority can be considered.",
    defaultState: "activation_not_allowed",
    nextAction: "Model activation intent locally in P123.3 before any dry-run or UX work.",
    blocker: "No activation authority is granted in P123.2.",
    evidenceLabels: ["P123.1 contract report", "P123.2 metadata report"],
    activityLabels: ["Activation metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS },
  },
  {
    sectionKey: "runtime_write_guard",
    publicLabel: "Runtime write guard",
    purpose: "Keeps DB writes, runtime writes, execution unlock, dispatch, provider calls, and spend unavailable during activation metadata work.",
    defaultState: "missing_runtime_activation_guard",
    nextAction: "Keep runtime writes and execution blocked until a later explicit phase grants narrow authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network calls, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P123.2 metadata report"],
    activityLabels: ["Runtime activation guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS },
  },
  {
    sectionKey: "operator_evidence",
    publicLabel: "Operator evidence",
    purpose: "Defines display-safe labels for future operator review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "activation_not_allowed",
    nextAction: "Carry display-safe evidence labels into the P123.3 local activation intent model.",
    blocker: "P123.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P123.2 metadata report"],
    activityLabels: ["Operator activation evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata() {
  const priorHandoff = buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE,
    sourceHandoffPhase: priorHandoff.phaseId,
    sourceHandoffVersion: priorHandoff.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    activationPolicy: {
      mode: "metadata-only",
      disabledReason: "P123.2 defines approval application authority activation eligibility metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
    },
    activationStates: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES],
    priorHandoff: {
      phaseId: priorHandoff.phaseId,
      metadataVersion: priorHandoff.metadataVersion,
      metadataOnly: priorHandoff.metadataOnly === true,
      localOnly: priorHandoff.localOnly === true,
      commandCenterVisible: priorHandoff.commandCenterVisible === false,
      sectionLabels: priorHandoff.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorHandoff.handoffPolicy },
    },
    sections: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Approval application authority activation is not granted.",
      "Authority grant, approval application, and approve/reject recording remain blocked.",
      "DB and runtime writes remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P123.2 metadata into P123.3 local activation intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Activation Guard",
    costImpactLabel: "No provider spend",
  };
}
