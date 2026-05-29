import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE = "P126.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES = [
  "acceptance_not_allowed",
  "missing_prior_handoff_boundary",
  "missing_operator_acceptance_scope",
  "missing_runtime_acceptance_guard",
  "ready_for_local_acceptance_intent_model_only",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptancePersistenceAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceRuntimeAdmissionAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceOperatorOverrideAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceSpendAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS = [
  {
    sectionKey: "prior_handoff_boundary",
    publicLabel: "Prior handoff boundary",
    purpose: "Confirms the P125 handoff metadata exists before any acceptance intent is modeled.",
    defaultState: "missing_prior_handoff_boundary",
    nextAction: "Reuse P125 handoff metadata as the read-only source for P126 acceptance intent planning.",
    blocker: "P126.2 does not accept handoff or capture acceptance.",
    evidenceLabels: ["P125.2 handoff metadata", "P125.7 final validation"],
    activityLabels: ["P126.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "acceptance_scope",
    publicLabel: "Acceptance scope",
    purpose: "Describes the future operator questions required before grant handoff acceptance can be considered.",
    defaultState: "acceptance_not_allowed",
    nextAction: "Model acceptance intent locally in P126.3 before any dry-run or UX work.",
    blocker: "No approval application authority grant handoff is accepted in P126.2.",
    evidenceLabels: ["P126.1 contract report", "P126.2 metadata report"],
    activityLabels: ["Acceptance metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "runtime_acceptance_guard",
    publicLabel: "Runtime acceptance guard",
    purpose: "Keeps DB writes, runtime writes, execution unlock, dispatch, provider calls, and spend unavailable during acceptance metadata work.",
    defaultState: "missing_runtime_acceptance_guard",
    nextAction: "Keep runtime writes and execution blocked until a later explicit phase grants narrow authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network calls, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P126.2 metadata report"],
    activityLabels: ["Runtime acceptance guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "operator_acceptance_evidence",
    publicLabel: "Operator acceptance evidence",
    purpose: "Defines display-safe labels for future operator acceptance review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "acceptance_not_allowed",
    nextAction: "Carry display-safe acceptance evidence labels into the P126.3 local acceptance intent model.",
    blocker: "P126.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P126.2 metadata report"],
    activityLabels: ["Operator acceptance evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata() {
  const priorHandoffBoundary = buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE,
    sourceHandoffPhase: priorHandoffBoundary.phaseId,
    sourceHandoffVersion: priorHandoffBoundary.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    acceptancePolicy: {
      mode: "metadata-only",
      disabledReason: "P126.2 defines approval application authority grant handoff acceptance eligibility metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS,
    },
    acceptanceStates: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES],
    priorHandoffBoundary: {
      phaseId: priorHandoffBoundary.phaseId,
      metadataVersion: priorHandoffBoundary.metadataVersion,
      metadataOnly: priorHandoffBoundary.metadataOnly === true,
      localOnly: priorHandoffBoundary.localOnly === true,
      commandCenterVisible: priorHandoffBoundary.commandCenterVisible === false,
      sectionLabels: priorHandoffBoundary.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorHandoffBoundary.handoffPolicy },
    },
    sections: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Approval application authority grant handoff acceptance is not allowed.",
      "Authority handoff, authority grant, activation, approval application, and approve/reject recording remain blocked.",
      "DB and runtime writes remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P126.2 metadata into P126.3 local acceptance intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Handoff Acceptance Guard",
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata(metadata = {}) {
  const errors = [];
  if (metadata.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION) {
    errors.push("Unexpected acceptance boundary metadata version.");
  }
  if (metadata.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE) {
    errors.push("Unexpected acceptance boundary metadata phase.");
  }
  if (metadata.sourceHandoffPhase !== "P125.2" || metadata.sourceHandoffVersion !== "1.0") {
    errors.push("Acceptance boundary metadata must reuse P125.2 handoff metadata.");
  }
  if (metadata.metadataOnly !== true || metadata.localOnly !== true || metadata.commandCenterVisible !== false) {
    errors.push("Acceptance boundary metadata must remain local metadata and hidden from primary UX.");
  }
  if (metadata.acceptancePolicy?.mode !== "metadata-only") {
    errors.push("Acceptance boundary policy must remain metadata-only.");
  }
  if (!Array.isArray(metadata.acceptanceStates) || metadata.acceptanceStates.some((state) => !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES.includes(state))) {
    errors.push("Acceptance boundary states must be allowlisted.");
  }
  const booleanPolicyValues = Object.values(metadata.acceptancePolicy || {}).filter((value) => typeof value === "boolean");
  if (!booleanPolicyValues.every((value) => value === false)) {
    errors.push("Acceptance boundary policy booleans must remain false.");
  }
  if (!Array.isArray(metadata.sections) || metadata.sections.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS.length) {
    errors.push("Acceptance boundary sections are incomplete.");
  }
  for (const section of metadata.sections || []) {
    const values = Object.values(section.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!values.every((value) => value === false)) {
      errors.push(`${section.sectionKey || "section"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(metadata.blockers) || metadata.blockers.length < 4) {
    errors.push("Acceptance boundary blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
