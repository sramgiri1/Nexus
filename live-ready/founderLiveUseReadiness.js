import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderRuntimeAdmission } from "./founderRuntimeAdmission.js";
import { buildFounderPrdSafeAuthoring } from "./founderPrdSafeAuthoring.js";
import {
  buildFounderBusinessBuildDryRunAdmission,
  buildFounderBusinessBuildPersistenceSnapshot,
} from "./founderBusinessBuildExecutionReadiness.js";
import { buildLocalFounderWorkstreamRuntimeEnvelope } from "./localFounderWorkstreamRuntimeEnvelope.js";

export const P101_FOUNDER_LIVE_USE_PHASE = "P101.2";

export const P101_LIVE_USE_HARDENING_STATES = Object.freeze({
  LOCAL_REVIEW_READY_EXECUTION_BLOCKED: "founder_live_use_local_review_ready_execution_blocked",
  NEEDS_FOUNDER_CONTEXT: "founder_live_use_needs_founder_context",
  BLOCKED_BY_SAFETY: "founder_live_use_blocked_by_safety",
});

export const P101_LIVE_USE_SAFETY_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "executionAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "local executor runs",
  "project creation",
  "project mutation",
  "hosted DB mutation",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedSafetyFlags() {
  return Object.fromEntries(P101_LIVE_USE_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function humanize(value = "") {
  return String(value || "not_ready")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function defaultRuntimeApproval() {
  return {
    operatorApproval: true,
    scopeBoundary: true,
    redactionCheck: true,
    activityEvidence: true,
    costEvidence: true,
    rollbackPlan: true,
    validationCommands: true,
  };
}

function defaultLocalEvidence() {
  return {
    operatorApproval: true,
    rollbackAccepted: true,
    auditAccepted: true,
    validationCommandsAccepted: true,
    mode: "sqlite-live",
    enableWrites: true,
  };
}

function laneFromSource({ laneKey, label, sourceEnvelope, sourceState, ownerCapability, evidenceRefs = [], readyForFounderReview = true, nextAction }) {
  return {
    laneKey,
    label,
    currentState: humanize(sourceState || sourceEnvelope?.data?.currentState),
    ownerCapability,
    readyForFounderReview,
    executionAllowed: false,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    nextAction,
    blocker: readyForFounderReview ? "Execution remains blocked by safety contract." : "Founder context or local evidence is still required.",
    disabledReason:
      "Founder live-use readiness is local review only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    evidenceRefs,
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic readiness only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    ...blockedSafetyFlags(),
  };
}

function buildSourceEnvelopes(input = {}) {
  const runtimeAdmission = input.runtimeAdmission || buildFounderRuntimeAdmission({
    ...input,
    approval: input.runtimeApproval || defaultRuntimeApproval(),
  });
  const prdAuthoring = input.prdAuthoring || buildFounderPrdSafeAuthoring(input);
  const businessBuildReadiness = input.businessBuildReadiness || buildFounderBusinessBuildPersistenceSnapshot({
    ...defaultLocalEvidence(),
    ...input,
  });
  const dryRunAdmission = input.dryRunAdmission || buildFounderBusinessBuildDryRunAdmission({
    snapshot: businessBuildReadiness,
    ...input,
  });
  const workstreamEnvelope = input.workstreamEnvelope || buildLocalFounderWorkstreamRuntimeEnvelope(input);

  return {
    runtimeAdmission,
    prdAuthoring,
    businessBuildReadiness,
    dryRunAdmission,
    workstreamEnvelope,
  };
}

function buildLiveUseLanes(sources) {
  const runtimeData = sources.runtimeAdmission.data || {};
  const prdData = sources.prdAuthoring.data || {};
  const readinessData = sources.businessBuildReadiness.data || {};
  const dryRunData = sources.dryRunAdmission.data || {};
  const workstreamData = sources.workstreamEnvelope.data || {};
  const liveReadinessSourceState = "full_command_center_founder_safe_live_readiness_visible";

  return [
    laneFromSource({
      laneKey: "founder-intake-qna",
      label: "Founder Q&A",
      sourceEnvelope: sources.runtimeAdmission,
      sourceState: runtimeData.currentState,
      ownerCapability: runtimeData.ownerCapability || "NEXUS Founder Runtime Admission",
      evidenceRefs: runtimeData.evidenceRefs,
      readyForFounderReview: runtimeData.currentState === "founder_runtime_local_admitted",
      nextAction: "Ask the next founder question locally and keep execution controls blocked.",
    }),
    laneFromSource({
      laneKey: "local-prd",
      label: "Local PRD",
      sourceEnvelope: sources.prdAuthoring,
      sourceState: prdData.currentState,
      ownerCapability: prdData.ownerCapability || "NEXUS Founder PRD Safe Authoring",
      evidenceRefs: prdData.evidenceRefs,
      readyForFounderReview: prdData.prdArtifact?.reviewState === "ready_for_operator_review",
      nextAction: "Review the local PRD artifact before workstream review.",
    }),
    laneFromSource({
      laneKey: "agent-workstream-plan",
      label: "Agent Workstream Plan",
      sourceEnvelope: sources.workstreamEnvelope,
      sourceState: workstreamData.currentState,
      ownerCapability: workstreamData.ownerCapability || "NEXUS Founder Workstream Runtime Governance",
      evidenceRefs: workstreamData.evidenceRefs,
      readyForFounderReview: Array.isArray(workstreamData.workstreams) && workstreamData.workstreams.length > 0,
      nextAction: "Review agent lane ownership and blockers before any later dispatch phase.",
    }),
    laneFromSource({
      laneKey: "local-db-readiness",
      label: "Local DB Readiness",
      sourceEnvelope: sources.businessBuildReadiness,
      sourceState: readinessData.currentState,
      ownerCapability: readinessData.ownerCapability || "NEXUS Business Build Local Execution Readiness",
      evidenceRefs: readinessData.evidenceRefs,
      readyForFounderReview: readinessData.executionReadiness?.approvalEvidenceComplete === true,
      nextAction: "Keep local DB records reviewable and block hosted DB mutation.",
    }),
    laneFromSource({
      laneKey: "execution-admission-review",
      label: "Execution Admission Review",
      sourceEnvelope: sources.dryRunAdmission,
      sourceState: dryRunData.currentState,
      ownerCapability: dryRunData.ownerCapability || "NEXUS Business Build Dry-Run Admission",
      evidenceRefs: dryRunData.evidenceRefs,
      readyForFounderReview: dryRunData.laneCount > 0,
      nextAction: "Show dry-run admission state while execution remains blocked.",
    }),
    laneFromSource({
      laneKey: "live-readiness-gate",
      label: "Live Readiness Gate",
      sourceState: liveReadinessSourceState,
      ownerCapability: "NEXUS Live Readiness Governance",
      evidenceRefs: ["reports/p1007-founder-command-center-final-report.md"],
      readyForFounderReview: true,
      nextAction: "Carry this readiness model into the P101.3 review packet.",
    }),
  ];
}

export function buildFounderLiveUseReadiness(input = {}) {
  const sources = buildSourceEnvelopes(input);
  const liveUseLanes = buildLiveUseLanes(sources);
  const readyLaneCount = liveUseLanes.filter((lane) => lane.readyForFounderReview).length;
  const localReviewReady = readyLaneCount === liveUseLanes.length;
  const laneBlockers = liveUseLanes
    .filter((lane) => lane.readyForFounderReview !== true)
    .map((lane) => `${lane.label}: ${lane.blocker}`);
  const blockers = [
    ...laneBlockers,
    "Agent dispatch is blocked.",
    "Worker/tool execution is blocked.",
    "Project mutation is blocked.",
    "Hosted DB mutation is blocked.",
    "Provider spend is blocked.",
  ];

  return createPassResult({
    phase: P101_FOUNDER_LIVE_USE_PHASE,
    mode: "founder-live-use-hardening-local-readiness",
    source: "live-ready/founderLiveUseReadiness.js",
    summary: "Founder live-use readiness is assembled locally from existing founder runtime, PRD, workstream, DB, admission, and Live Readiness evidence.",
    data: {
      schemaVersion: "1.0",
      currentState: localReviewReady
        ? P101_LIVE_USE_HARDENING_STATES.LOCAL_REVIEW_READY_EXECUTION_BLOCKED
        : P101_LIVE_USE_HARDENING_STATES.NEEDS_FOUNDER_CONTEXT,
      founderLiveUseMode: "local-governed-readiness-only",
      founderWorkflowReadiness: {
        localReviewReady,
        readyLaneCount,
        totalLaneCount: liveUseLanes.length,
        executableLaneCount: 0,
        dispatchableLaneCount: 0,
        projectMutationLaneCount: 0,
      },
      sourceEvidence: {
        founderRuntimeAdmissionPhase: sources.runtimeAdmission.phase,
        prdAuthoringPhase: sources.prdAuthoring.phase,
        workstreamEnvelopePhase: sources.workstreamEnvelope.phase,
        dbReadinessPhase: sources.businessBuildReadiness.phase,
        dryRunAdmissionPhase: sources.dryRunAdmission.phase,
        liveReadinessEvidence: "P100 full Command Center founder-safe Live Readiness page",
      },
      liveUseLanes,
      safetyFlags: blockedSafetyFlags(),
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      nextAction: localReviewReady
        ? "Build the P101.3 founder live-use review packet for Command Center rendering."
        : laneBlockers[0] || "Collect founder context before review packet generation.",
      blockers,
      disabledReason:
        "P101.2 is a local readiness model only. Provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Use Hardening",
      evidenceRefs: [
        "reports/p1012-founder-live-use-readiness-model-report.md",
        "reports/p1011-founder-live-use-contract-report.md",
        "reports/p1007-founder-command-center-final-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic readiness only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1012-founder-live-use-readiness-model-report.md",
      "contracts/os-roadmap/p101-execution-contracts.json",
    ],
    warnings: [
      "P101.2 does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
    ],
  });
}

export function validateFounderLiveUseReadiness(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P101_FOUNDER_LIVE_USE_PHASE) errors.push("phase must be P101.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "founderLiveUseMode",
    "founderWorkflowReadiness",
    "liveUseLanes",
    "safetyFlags",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
    "commandCenterVisible",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.founderLiveUseMode !== "local-governed-readiness-only") errors.push("founderLiveUseMode must stay local-governed-readiness-only");
  if (!Array.isArray(data.liveUseLanes) || data.liveUseLanes.length < 5) errors.push("liveUseLanes must cover founder workflow lanes");
  if (data.founderWorkflowReadiness?.executableLaneCount !== 0) errors.push("executableLaneCount must be 0");
  if (data.founderWorkflowReadiness?.dispatchableLaneCount !== 0) errors.push("dispatchableLaneCount must be 0");
  if (data.founderWorkflowReadiness?.projectMutationLaneCount !== 0) errors.push("projectMutationLaneCount must be 0");
  for (const lane of data.liveUseLanes || []) {
    for (const field of ["laneKey", "label", "currentState", "ownerCapability", "readyForFounderReview", "nextAction", "blocker", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    for (const flag of P101_LIVE_USE_SAFETY_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  for (const flag of P101_LIVE_USE_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("founder live-use readiness must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized)) errors.push("founder live-use readiness must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
