import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  buildFounderApprovalDecisionApplicationEligibilityMetadata,
} from "./founderApprovalDecisionApplicationEligibilityMetadata.js";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE = "P122.2";
export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_VERSION = "1.0";

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES = [
  "handoff_not_allowed",
  "missing_prior_boundary_review",
  "missing_runtime_authority_scope",
  "ready_for_local_intent_model_only",
];

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS = {
  ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  approvalApplicationAuthorityHandoffAllowed: false,
  approvalApplicationRuntimeAdmissionAllowed: false,
  approvalApplicationStateMutationAllowed: false,
  approvalApplicationOperatorOverrideAllowed: false,
};

export const FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS = [
  {
    sectionKey: "prior_boundary",
    publicLabel: "Prior boundary",
    purpose: "Confirms the P121 approval decision application boundary exists before authority handoff modeling begins.",
    defaultState: "missing_prior_boundary_review",
    nextAction: "Reuse P121 application eligibility metadata as the read-only source for P122 local intent planning.",
    blocker: "P122.2 does not apply decisions or read persisted approval decisions.",
    evidenceLabels: ["P121.2 eligibility metadata", "P121.7 final validation"],
    activityLabels: ["P122.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS },
  },
  {
    sectionKey: "authority_scope",
    publicLabel: "Authority scope",
    purpose: "Describes the future authority questions that must stay explicit before any approval application path can be considered.",
    defaultState: "handoff_not_allowed",
    nextAction: "Model authority intent locally in P122.3 before any safe dry-run or UX work.",
    blocker: "No authority handoff is granted in P122.2.",
    evidenceLabels: ["P122.1 contract report", "P122.2 metadata report"],
    activityLabels: ["Authority metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS },
  },
  {
    sectionKey: "runtime_guard",
    publicLabel: "Runtime guard",
    purpose: "Keeps runtime admission, writes, execution unlock, dispatch, and provider spend unavailable during authority handoff metadata work.",
    defaultState: "missing_runtime_authority_scope",
    nextAction: "Keep runtime execution blocked until a later explicit phase grants narrow runtime authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P122.2 metadata report"],
    activityLabels: ["Runtime guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS },
  },
  {
    sectionKey: "operator_evidence",
    publicLabel: "Operator evidence",
    purpose: "Defines display-safe labels for future operator review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "handoff_not_allowed",
    nextAction: "Carry display-safe evidence labels into the P122.3 local authority intent model.",
    blocker: "P122.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P122.2 metadata report"],
    activityLabels: ["Operator evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS },
  },
];

export function buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata() {
  const priorBoundary = buildFounderApprovalDecisionApplicationEligibilityMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_VERSION,
    phaseId: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE,
    sourceBoundaryPhase: priorBoundary.phaseId,
    sourceBoundaryVersion: priorBoundary.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    handoffPolicy: {
      mode: "metadata-only",
      disabledReason: "P122.2 defines approval decision application authority handoff eligibility metadata only.",
      ...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
    },
    handoffStates: [...FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES],
    priorBoundary: {
      phaseId: priorBoundary.phaseId,
      metadataVersion: priorBoundary.metadataVersion,
      metadataOnly: priorBoundary.metadataOnly === true,
      commandCenterVisible: priorBoundary.commandCenterVisible === true,
      sectionLabels: priorBoundary.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorBoundary.writePolicy },
    },
    sections: FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Approval decision application authority is not granted.",
      "DB and runtime writes remain blocked.",
      "Runtime execution and execution unlock remain blocked.",
      "Provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P122.2 metadata into P122.3 local authority intent modeling.",
    ownerCapability: "NEXUS Approval Decision Application Authority Guard",
    costImpactLabel: "No provider spend",
  };
}
