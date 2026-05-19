import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildBusinessBuildWorkstreams } from "../business-build/businessBuildWorkstreams.js";
import { createPassResult } from "../shared/resultEnvelope.js";
import { buildWorkerExecutionGate } from "./workerExecutionGate.js";

export const P84_AGENT_PLAN_ADMISSION_PHASE = "P84.3";

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

const DEFAULT_FOUNDER_ANSWERS = Object.freeze({
  founderIdea: "A founder wants NEXUS to validate a startup idea and coordinate the path from PRD to business launch.",
  targetCustomer: "startup founder",
  problem: "founders need a governed way to turn an idea into a complete business without losing execution evidence",
  currentAlternatives: "manual planning, disconnected contractors, and untracked validation work",
  proposedSolution: "NEXUS interviews the founder, creates a PRD, and plans agent workstreams with visible blockers and evidence",
  businessModel: "subscription with founder operating tiers",
  goToMarket: "founder-led validation with staged launch support",
  constraints: "no live providers, no project mutation, and no spend until explicit admission is complete",
  successCriteria: "validated PRD, admitted agent plan, visible blockers, and no hidden execution",
});

const REQUIRED_PREREQUISITES = Object.freeze([
  "validated local PRD draft",
  "owner capability mapping",
  "agent dispatch admission",
  "worker execution gate",
  "project mutation admission",
  "activity and evidence ledger",
  "cost guardrail",
  "rollback plan",
  "validation commands",
]);

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function buildAgentPlanRows(workstreamPlan, prdReady) {
  return (workstreamPlan.workstreams || []).map((workstream) => ({
    lane: workstream.workstream,
    ownerCapability: workstream.ownerCapability,
    objective: workstream.objective,
    currentState: prdReady ? "admitted_for_local_planning" : "blocked_on_prd",
    readinessLabel: prdReady ? "Planning admitted" : "Blocked on PRD",
    nextAction: prdReady
      ? "Keep this lane in local planning until explicit dispatch, worker, project, DB, deploy, and cost admission is complete."
      : `Complete ${workstream.inputsNeeded?.[0] || "the missing PRD field"} before admitting this lane.`,
    prerequisites: [...REQUIRED_PREREQUISITES],
    blockers: [...normalizeList(workstream.blockers)],
    disabledReason:
      "P84.3 admits the agent plan as a local planning record only. Dispatch, provider calls, tools, workers, project mutation, DB writes, deploy, release, export, package creation, and spend remain disabled.",
    evidenceRefs: [...new Set(["reports/p843-agent-plan-admission-preview-report.md", ...normalizeList(workstream.evidenceRefs)])],
    activityLocation: "os-roadmap/phase-status.json#P84.3",
    costImpact: "No provider calls, agent dispatch, worker runtime, project writes, DB writes, deploy, release, export, package creation, or provider spend.",
    ...falseRuntimeFlags(),
  }));
}

export function buildFounderAgentPlanAdmission(input = {}) {
  const prdDraft =
    input.prdDraft ||
    createBusinessBuildPrdDraft({
      founderIdeaSummary: DEFAULT_FOUNDER_ANSWERS.founderIdea,
      answers: { ...DEFAULT_FOUNDER_ANSWERS, ...(input.answers || {}) },
      evidenceRefs: input.evidenceRefs,
      activityRefs: input.activityRefs,
    });
  const workstreamPlan = input.workstreamPlan || buildBusinessBuildWorkstreams({ prdDraft });
  const workerGate = input.workerGate || buildWorkerExecutionGate({ prdDraft, workstreamPlan });
  const prdReady = prdDraft.data?.readyForWorkstreams === true;
  const agentPlan = buildAgentPlanRows(workstreamPlan, prdReady);
  const blockers = [...new Set(agentPlan.flatMap((row) => row.blockers))];

  return createPassResult({
    phase: P84_AGENT_PLAN_ADMISSION_PHASE,
    mode: input.mode || "live",
    source: "live-ready/founderAgentPlanAdmission.js",
    summary: "Founder agent workstream plan is admitted for local planning; dispatch and execution remain disabled.",
    data: {
      currentState: prdReady ? "agent_plan_admitted_for_local_planning" : "agent_plan_blocked_on_prd",
      readinessLabel: prdReady ? "Planning admitted" : "Blocked on PRD",
      nextAction: "Surface this admitted local agent plan in the P84.4 runtime readiness UX without enabling execution.",
      ownerCapability: "NEXUS Founder Agent Plan Admission",
      prerequisites: [...REQUIRED_PREREQUISITES],
      blockers,
      disabledReason:
        "Agent planning is local only in P84.3. Provider/model calls, agent dispatch, tools, workers, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain disabled.",
      evidenceRefs: ["reports/p843-agent-plan-admission-preview-report.md", "reports/os-phase-status-report.md"],
      activityLocation: "os-roadmap/phase-status.json#P84.3",
      costImpact: "No runtime, provider, worker, project, DB, deploy, release, export, package, network, or spend impact.",
      workstreamCount: agentPlan.length,
      ownerCapabilities: [...new Set(agentPlan.map((row) => row.ownerCapability))],
      agentPlan,
      workerGateSummary: {
        currentState: workerGate.data?.currentState,
        readinessLabel: workerGate.data?.readinessLabel,
        executionEnabled: workerGate.data?.runtimeSummary?.executionEnabled === true,
        workerExecutionAllowed: workerGate.data?.workerExecutionAllowed === true,
      },
      commandCenterVisible: true,
      ...falseRuntimeFlags(),
    },
    warnings: ["This admits local planning only. No agent, worker, provider, project, DB, deploy, export, package, or spend action is runnable."],
    evidence: ["reports/p843-agent-plan-admission-preview-report.md", "contracts/os-roadmap/p84-execution-contracts.json"],
  });
}

export function validateFounderAgentPlanAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  const rows = data.agentPlan || [];
  if (envelope.phase !== P84_AGENT_PLAN_ADMISSION_PHASE) errors.push("phase must be P84.3");
  if (data.currentState !== "agent_plan_admitted_for_local_planning") errors.push("currentState must be agent_plan_admitted_for_local_planning");
  if (data.readinessLabel !== "Planning admitted") errors.push("readinessLabel must be Planning admitted");
  for (const field of [
    "nextAction",
    "ownerCapability",
    "prerequisites",
    "blockers",
    "disabledReason",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
    "ownerCapabilities",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(rows) || rows.length !== 8) errors.push("agentPlan must cover 8 business build workstreams");
  if (data.workstreamCount !== rows.length) errors.push("workstreamCount must match agentPlan length");
  if (data.workerGateSummary?.executionEnabled !== false) errors.push("workerGateSummary.executionEnabled must be false");
  if (data.workerGateSummary?.workerExecutionAllowed !== false) errors.push("workerGateSummary.workerExecutionAllowed must be false");
  if (data.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of rows) {
    for (const field of ["lane", "ownerCapability", "objective", "currentState", "readinessLabel", "nextAction", "prerequisites", "blockers", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.lane || "unknown"}.${field} missing`);
    }
    if (row.readinessLabel !== "Planning admitted") errors.push(`${row.lane}.readinessLabel must be Planning admitted`);
    if (!Array.isArray(row.prerequisites) || row.prerequisites.length === 0) errors.push(`${row.lane}.prerequisites must be present`);
    if (!Array.isArray(row.blockers)) errors.push(`${row.lane}.blockers must be an array`);
    if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0) errors.push(`${row.lane}.evidenceRefs must be present`);
    for (const flag of RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.lane}.${flag} must be false`);
    }
  }
  if (/dispatch now|run agent|execute worker|call provider now|write project now|deploy now|spend now|generate prd now/i.test(JSON.stringify(envelope))) {
    errors.push("envelope must not imply fake runnable actions");
  }
  return { valid: errors.length === 0, errors };
}
