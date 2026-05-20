import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalEnterpriseRuntimeHandoffProfile } from "./localEnterpriseRuntimeHandoffProfile.js";

export const P89_LOCAL_FOUNDER_WORKSTREAM_RUNTIME_ENVELOPE_PHASE = "P89.2";

export const P89_FOUNDER_WORKSTREAM_REQUIRED_EVIDENCE = Object.freeze([
  "founderIdeaSummary",
  "clarifyingQuestions",
  "prdReadinessChecklist",
  "agentLanePlan",
  "scopedContextPacket",
  "operatorApproval",
  "localRuntimePolicyReview",
  "activityEvidence",
  "costEvidence",
  "rollbackPlan",
  "validationCommands",
]);

const RUNTIME_FLAGS = Object.freeze([
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
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "workstreamCanRun",
  "activationAllowed",
  "executionAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "DB writes",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

const AGENT_LANE_BY_LABEL = Object.freeze({
  "Local founder task orchestration": ["Founder Intake", "Feasibility Analyst", "PRD Drafter"],
  "Generated workspace boundary": ["Solution Architect", "Implementation Planner", "QA Planner"],
  "Live unlock review": ["Runtime Warden", "Cost Governor", "Release Reviewer"],
});

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function workstreamKey(laneKey = "") {
  return `founder-workstream-${String(laneKey).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildWorkstream(lane = {}) {
  const agentLanePlan = AGENT_LANE_BY_LABEL[lane.label] || ["Founder Intake", "Runtime Warden"];
  return {
    workstreamKey: workstreamKey(lane.laneKey),
    label: lane.label,
    ownerCapability: lane.ownerCapability,
    sourceLaneKey: lane.laneKey,
    founderInteractionState: "local_envelope_defined_needs_founder_answers",
    prdState: "not_started_requires_founder_context",
    agentLanePlan,
    workstreamCanRun: false,
    allowedFutureOperations: [
      "collect founder Q&A locally",
      "draft PRD readiness packet locally",
      "map agent lane plan locally",
      "prepare read-only validation checklist",
    ],
    forbiddenOperations: [...FORBIDDEN_OPERATIONS],
    requiredEvidence: [...P89_FOUNDER_WORKSTREAM_REQUIRED_EVIDENCE],
    missingEvidence: [
      "founderIdeaSummary",
      "clarifyingQuestions",
      "prdReadinessChecklist",
      "operatorApproval",
      "localRuntimePolicyReview",
    ],
    nextAction: "Implement P89.3 safe dry run to simulate local founder workstream transitions without mutation.",
    disabledReason:
      "P89.2 defines local founder workstream envelope records only. It does not dispatch agents, run executors, call providers, mutate projects, write DB state, deploy, package, use network calls, or spend.",
    validationCommands: [
      "npm run check:p892-local-founder-workstream-runtime-envelope",
      "npm run check:p891-local-enterprise-runtime-handoff-profile",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p892-local-founder-workstream-runtime-envelope-report.md", ...(lane.evidenceRefs || [])],
    activityLocation: lane.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(workstreams) {
  return workstreams.reduce((acc, workstream) => {
    acc[workstream.founderInteractionState] = (acc[workstream.founderInteractionState] || 0) + 1;
    return acc;
  }, {});
}

export function buildLocalFounderWorkstreamRuntimeEnvelope(input = {}) {
  const handoffProfile = input.handoffProfile || buildLocalEnterpriseRuntimeHandoffProfile(input);
  const workstreams = (handoffProfile.data?.handoffLanes || []).map(buildWorkstream);

  return createPassResult({
    phase: P89_LOCAL_FOUNDER_WORKSTREAM_RUNTIME_ENVELOPE_PHASE,
    mode: "local-founder-workstream-runtime-envelope",
    source: "live-ready/localFounderWorkstreamRuntimeEnvelope.js",
    summary: "Local founder workstream runtime envelope is defined; no workstream can run.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_founder_workstream_envelope_ready_blocked",
      readinessLabel: "Founder workstream envelope ready",
      workstreamMode: "local-only-envelope",
      sourcePhase: handoffProfile.phase,
      workstreamCount: workstreams.length,
      workstreamSummary: summarize(workstreams),
      workstreams,
      requiredEvidence: [...P89_FOUNDER_WORKSTREAM_REQUIRED_EVIDENCE],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Implement P89.3 safe dry run for local founder workstream transitions without mutation.",
      blockers: [
        "founderIdeaSummary",
        "clarifyingQuestions",
        "prdReadinessChecklist",
        "operatorApproval",
        "localRuntimePolicyReview",
      ],
      disabledReason:
        "P89.2 is a local envelope model only. Provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Workstream Runtime Governance",
      evidenceRefs: [
        "reports/p892-local-founder-workstream-runtime-envelope-report.md",
        "reports/p891-local-enterprise-runtime-handoff-profile-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p892-local-founder-workstream-runtime-envelope-report.md",
      "contracts/os-roadmap/p89-execution-contracts.json",
    ],
    warnings: ["P89.2 defines a local envelope only. It does not dispatch agents or run an executor."],
  });
}

export function validateLocalFounderWorkstreamRuntimeEnvelope(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P89_LOCAL_FOUNDER_WORKSTREAM_RUNTIME_ENVELOPE_PHASE) errors.push("phase must be P89.2");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "workstreamMode", "sourcePhase", "workstreamCount", "workstreams", "requiredEvidence", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.workstreamMode !== "local-only-envelope") errors.push("workstreamMode must stay local-only-envelope");
  if (!Array.isArray(data.workstreams) || data.workstreams.length !== 3) errors.push("workstreams must cover three P89.1 handoff lanes");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const workstream of data.workstreams || []) {
    for (const field of ["workstreamKey", "label", "ownerCapability", "sourceLaneKey", "founderInteractionState", "prdState", "agentLanePlan", "workstreamCanRun", "allowedFutureOperations", "forbiddenOperations", "requiredEvidence", "missingEvidence", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in workstream)) errors.push(`${workstream.label || "workstream"}.${field} missing`);
    }
    if (workstream.founderInteractionState !== "local_envelope_defined_needs_founder_answers") errors.push(`${workstream.label}.founderInteractionState must need founder answers`);
    if (workstream.workstreamCanRun !== false) errors.push(`${workstream.label}.workstreamCanRun must be false`);
    if (!Array.isArray(workstream.agentLanePlan) || workstream.agentLanePlan.length === 0) errors.push(`${workstream.label}.agentLanePlan missing`);
    for (const flag of RUNTIME_FLAGS) {
      if (workstream[flag] !== false) errors.push(`${workstream.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local founder workstream envelope must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("local founder workstream envelope must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
