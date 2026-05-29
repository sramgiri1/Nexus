import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityGrantEligibilityMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE = "P125.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES = [
  "handoff_not_allowed",
  "missing_prior_grant_boundary",
  "missing_operator_handoff_scope",
  "missing_runtime_handoff_guard",
  "ready_for_local_handoff_intent_model_only",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS,
  approvalApplicationAuthorityGrantHandoffAllowed: false,
  approvalApplicationAuthorityGrantHandoffWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffPersistenceAllowed: false,
  approvalApplicationAuthorityGrantHandoffRuntimeAdmissionAllowed: false,
  approvalApplicationAuthorityGrantHandoffOperatorOverrideAllowed: false,
  approvalApplicationAuthorityGrantHandoffSpendAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS = [
  {
    sectionKey: "prior_grant_boundary",
    publicLabel: "Prior grant boundary",
    purpose: "Confirms the P124 grant boundary metadata exists before any handoff intent is modeled.",
    defaultState: "missing_prior_grant_boundary",
    nextAction: "Reuse P124 grant metadata as the read-only source for P125 handoff intent planning.",
    blocker: "P125.2 does not hand off authority or grant authority.",
    evidenceLabels: ["P124.2 grant metadata", "P124.7 final validation"],
    activityLabels: ["P125.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS },
  },
  {
    sectionKey: "handoff_scope",
    publicLabel: "Handoff scope",
    purpose: "Describes the future operator questions required before approval application authority grant handoff can be considered.",
    defaultState: "handoff_not_allowed",
    nextAction: "Model handoff intent locally in P125.3 before any dry-run or UX work.",
    blocker: "No approval application authority grant is handed off in P125.2.",
    evidenceLabels: ["P125.1 contract report", "P125.2 metadata report"],
    activityLabels: ["Handoff metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS },
  },
  {
    sectionKey: "runtime_handoff_guard",
    publicLabel: "Runtime handoff guard",
    purpose: "Keeps DB writes, runtime writes, execution unlock, dispatch, provider calls, and spend unavailable during handoff metadata work.",
    defaultState: "missing_runtime_handoff_guard",
    nextAction: "Keep runtime writes and execution blocked until a later explicit phase grants narrow authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network calls, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P125.2 metadata report"],
    activityLabels: ["Runtime handoff guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS },
  },
  {
    sectionKey: "operator_handoff_evidence",
    publicLabel: "Operator handoff evidence",
    purpose: "Defines display-safe labels for future operator handoff review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "handoff_not_allowed",
    nextAction: "Carry display-safe handoff evidence labels into the P125.3 local handoff intent model.",
    blocker: "P125.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P125.2 metadata report"],
    activityLabels: ["Operator handoff evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata() {
  const priorGrantBoundary = buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE,
    sourceGrantPhase: priorGrantBoundary.phaseId,
    sourceGrantVersion: priorGrantBoundary.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    handoffPolicy: {
      mode: "metadata-only",
      disabledReason: "P125.2 defines approval application authority grant handoff eligibility metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
    },
    handoffStates: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES],
    priorGrantBoundary: {
      phaseId: priorGrantBoundary.phaseId,
      metadataVersion: priorGrantBoundary.metadataVersion,
      metadataOnly: priorGrantBoundary.metadataOnly === true,
      localOnly: priorGrantBoundary.localOnly === true,
      commandCenterVisible: priorGrantBoundary.commandCenterVisible === false,
      sectionLabels: priorGrantBoundary.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorGrantBoundary.grantPolicy },
    },
    sections: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Approval application authority grant handoff is not allowed.",
      "Authority grant, activation, approval application, and approve/reject recording remain blocked.",
      "DB and runtime writes remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P125.2 metadata into P125.3 local handoff intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Handoff Guard",
    costImpactLabel: "No provider spend",
  };
}
