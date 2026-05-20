import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalFounderWorkstreamRuntimeEnvelope } from "./localFounderWorkstreamRuntimeEnvelope.js";

export const P89_LOCAL_FOUNDER_WORKSTREAM_DRY_RUN_PHASE = "P89.3";

export const P89_DRY_RUN_TRANSITION_STEPS = Object.freeze([
  "captureFounderIdea",
  "askClarifyingQuestions",
  "draftPrdReadinessPacket",
  "mapAgentLanePlan",
  "prepareOperatorReview",
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
  "dryRunCanMutate",
  "dryRunCanExecute",
  "activationAllowed",
  "executionAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function dryRunKey(workstreamKey = "") {
  return `dry-run-${String(workstreamKey).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildDryRun(workstream = {}) {
  return {
    dryRunKey: dryRunKey(workstream.workstreamKey),
    label: workstream.label,
    ownerCapability: workstream.ownerCapability,
    sourceWorkstreamKey: workstream.workstreamKey,
    currentState: workstream.founderInteractionState,
    previewNextState: "local_preview_ready_for_operator_review",
    transitionSteps: [...P89_DRY_RUN_TRANSITION_STEPS],
    founderInputsNeeded: ["problem", "targetCustomer", "solution", "businessModel", "constraints"],
    previewOutputs: ["clarifying question plan", "PRD readiness packet outline", "agent lane plan", "operator review checklist"],
    blockers: ["founder answers missing", "operator approval missing", "runtime policy review missing"],
    dryRunCanMutate: false,
    dryRunCanExecute: false,
    nextAction: "Implement P89.4 Command Center UX so the founder can see local dry-run state and blockers.",
    disabledReason:
      "P89.3 previews local workstream transitions only. It does not dispatch agents, run executors, mutate projects, write DB state, call providers, use network calls, deploy, package, or spend.",
    validationCommands: [
      "npm run check:p893-local-founder-workstream-dry-run",
      "npm run check:p892-local-founder-workstream-runtime-envelope",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p893-local-founder-workstream-dry-run-report.md", ...(workstream.evidenceRefs || [])],
    activityLocation: workstream.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(dryRuns) {
  return dryRuns.reduce((acc, run) => {
    acc[run.previewNextState] = (acc[run.previewNextState] || 0) + 1;
    return acc;
  }, {});
}

export function buildLocalFounderWorkstreamDryRun(input = {}) {
  const envelope = input.envelope || buildLocalFounderWorkstreamRuntimeEnvelope(input);
  const dryRuns = (envelope.data?.workstreams || []).map(buildDryRun);

  return createPassResult({
    phase: P89_LOCAL_FOUNDER_WORKSTREAM_DRY_RUN_PHASE,
    mode: "local-founder-workstream-dry-run",
    source: "live-ready/localFounderWorkstreamDryRun.js",
    summary: "Local founder workstream dry runs are defined; no dry run can mutate or execute.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_founder_workstream_dry_run_ready_blocked",
      readinessLabel: "Founder workstream dry run ready",
      dryRunMode: "local-only-preview",
      sourcePhase: envelope.phase,
      dryRunCount: dryRuns.length,
      dryRunSummary: summarize(dryRuns),
      transitionSteps: [...P89_DRY_RUN_TRANSITION_STEPS],
      dryRuns,
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Implement P89.4 Command Center UX for founder dry-run state and agent lane visibility.",
      blockers: ["founderAnswers", "operatorApproval", "runtimePolicyReview", "postRunReviewPlan"],
      disabledReason:
        "P89.3 is a local dry-run preview only. Provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Workstream Dry Run Governance",
      evidenceRefs: [
        "reports/p893-local-founder-workstream-dry-run-report.md",
        "reports/p892-local-founder-workstream-runtime-envelope-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p893-local-founder-workstream-dry-run-report.md",
      "contracts/os-roadmap/p89-execution-contracts.json",
    ],
    warnings: ["P89.3 previews local transitions only. It does not mutate or execute."],
  });
}

export function validateLocalFounderWorkstreamDryRun(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P89_LOCAL_FOUNDER_WORKSTREAM_DRY_RUN_PHASE) errors.push("phase must be P89.3");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "dryRunMode", "sourcePhase", "dryRunCount", "dryRuns", "transitionSteps", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.dryRunMode !== "local-only-preview") errors.push("dryRunMode must stay local-only-preview");
  if (!Array.isArray(data.dryRuns) || data.dryRuns.length !== 3) errors.push("dryRuns must cover three P89.2 workstreams");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  for (const run of data.dryRuns || []) {
    for (const field of ["dryRunKey", "label", "ownerCapability", "sourceWorkstreamKey", "currentState", "previewNextState", "transitionSteps", "founderInputsNeeded", "previewOutputs", "blockers", "dryRunCanMutate", "dryRunCanExecute", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in run)) errors.push(`${run.label || "dryRun"}.${field} missing`);
    }
    if (run.dryRunCanMutate !== false || run.dryRunCanExecute !== false) errors.push(`${run.label}.dryRun flags must remain false`);
    for (const flag of RUNTIME_FLAGS) {
      if (run[flag] !== false) errors.push(`${run.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local founder workstream dry run must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("local founder workstream dry run must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
