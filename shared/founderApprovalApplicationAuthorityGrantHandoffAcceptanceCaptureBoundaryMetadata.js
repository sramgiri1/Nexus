import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata,
} from "./founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_PHASE = "P127.2";
export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_VERSION = "1.0";

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_STATES = [
  "acceptance_capture_not_allowed",
  "missing_prior_acceptance_boundary",
  "missing_operator_capture_scope",
  "missing_runtime_capture_guard",
  "ready_for_local_acceptance_capture_intent_model_only",
];

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS = {
  ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureRecordAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureWriteAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureRuntimeAdmissionAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureOperatorOverrideAllowed: false,
  approvalApplicationAuthorityGrantHandoffAcceptanceCaptureSpendAllowed: false,
};

export const FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SECTIONS = [
  {
    sectionKey: "prior_acceptance_boundary",
    publicLabel: "Prior acceptance boundary",
    purpose: "Confirms the P126 acceptance boundary metadata exists before any acceptance capture intent is modeled.",
    defaultState: "missing_prior_acceptance_boundary",
    nextAction: "Reuse P126 acceptance metadata as the read-only source for P127 capture intent planning.",
    blocker: "P127.2 does not capture acceptance or create capture records.",
    evidenceLabels: ["P126.2 acceptance metadata", "P126.7 final validation"],
    activityLabels: ["P127.2 metadata validation"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "capture_scope",
    publicLabel: "Capture scope",
    purpose: "Describes the future operator questions required before acceptance capture can be considered.",
    defaultState: "acceptance_capture_not_allowed",
    nextAction: "Model acceptance capture intent locally in P127.3 before any dry-run or UX work.",
    blocker: "No acceptance is captured in P127.2.",
    evidenceLabels: ["P127.1 contract report", "P127.2 metadata report"],
    activityLabels: ["Acceptance capture metadata review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "runtime_capture_guard",
    publicLabel: "Runtime capture guard",
    purpose: "Keeps DB writes, runtime writes, execution unlock, dispatch, provider calls, and spend unavailable during acceptance capture metadata work.",
    defaultState: "missing_runtime_capture_guard",
    nextAction: "Keep runtime writes and execution blocked until a later explicit phase grants narrow authority.",
    blocker: "DB/runtime writes, execution unlock, dispatch, provider calls, network calls, and spend remain unavailable.",
    evidenceLabels: ["OS phase status report", "P127.2 metadata report"],
    activityLabels: ["Runtime capture guard review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS },
  },
  {
    sectionKey: "operator_capture_evidence",
    publicLabel: "Operator capture evidence",
    purpose: "Defines display-safe labels for future operator capture review without creating evidence rows, audit rows, approval rows, or runtime events.",
    defaultState: "acceptance_capture_not_allowed",
    nextAction: "Carry display-safe capture evidence labels into the P127.3 local acceptance capture intent model.",
    blocker: "P127.2 is metadata-only and does not create or mutate records.",
    evidenceLabels: ["P127.2 metadata report"],
    activityLabels: ["Operator capture evidence label review"],
    authorityFlags: { ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS },
  },
];

export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata() {
  const priorAcceptanceBoundary = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata();

  return {
    metadataVersion: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_VERSION,
    phaseId: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_PHASE,
    sourceAcceptancePhase: priorAcceptanceBoundary.phaseId,
    sourceAcceptanceVersion: priorAcceptanceBoundary.metadataVersion,
    metadataOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    capturePolicy: {
      mode: "metadata-only",
      disabledReason: "P127.2 defines approval application authority grant handoff acceptance capture eligibility metadata only.",
      ...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS,
    },
    captureStates: [...FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_STATES],
    priorAcceptanceBoundary: {
      phaseId: priorAcceptanceBoundary.phaseId,
      metadataVersion: priorAcceptanceBoundary.metadataVersion,
      metadataOnly: priorAcceptanceBoundary.metadataOnly === true,
      localOnly: priorAcceptanceBoundary.localOnly === true,
      commandCenterVisible: priorAcceptanceBoundary.commandCenterVisible === false,
      sectionLabels: priorAcceptanceBoundary.sections.map((section) => section.publicLabel),
      authorityFlags: { ...priorAcceptanceBoundary.acceptancePolicy },
    },
    sections: FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SECTIONS.map((section) => ({
      ...section,
      evidenceLabels: [...section.evidenceLabels],
      activityLabels: [...section.activityLabels],
      authorityFlags: { ...section.authorityFlags },
    })),
    blockers: [
      "Acceptance capture is not allowed.",
      "Handoff acceptance, authority handoff, authority grant, activation, approval application, and approve/reject recording remain blocked.",
      "DB and runtime writes remain blocked.",
      "Runtime execution, execution unlock, provider/model calls, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P127.2 metadata into P127.3 local acceptance capture intent modeling.",
    ownerCapability: "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Guard",
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata(metadata = {}) {
  const errors = [];
  if (metadata.metadataVersion !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_VERSION) {
    errors.push("Unexpected acceptance capture metadata version.");
  }
  if (metadata.phaseId !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_PHASE) {
    errors.push("Unexpected acceptance capture metadata phase.");
  }
  if (metadata.sourceAcceptancePhase !== "P126.2" || metadata.sourceAcceptanceVersion !== "1.0") {
    errors.push("Acceptance capture metadata must reuse P126.2 acceptance metadata.");
  }
  if (metadata.metadataOnly !== true || metadata.localOnly !== true || metadata.commandCenterVisible !== false) {
    errors.push("Acceptance capture metadata must remain local metadata and hidden from primary UX.");
  }
  if (metadata.capturePolicy?.mode !== "metadata-only") {
    errors.push("Acceptance capture policy must remain metadata-only.");
  }
  if (!Array.isArray(metadata.captureStates) || metadata.captureStates.some((state) => !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_STATES.includes(state))) {
    errors.push("Acceptance capture states must be allowlisted.");
  }
  const booleanPolicyValues = Object.values(metadata.capturePolicy || {}).filter((value) => typeof value === "boolean");
  if (!booleanPolicyValues.every((value) => value === false)) {
    errors.push("Acceptance capture policy booleans must remain false.");
  }
  if (!Array.isArray(metadata.sections) || metadata.sections.length !== FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SECTIONS.length) {
    errors.push("Acceptance capture sections are incomplete.");
  }
  for (const section of metadata.sections || []) {
    const values = Object.values(section.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!values.every((value) => value === false)) {
      errors.push(`${section.sectionKey || "section"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(metadata.blockers) || metadata.blockers.length < 4) {
    errors.push("Acceptance capture blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
