import { buildBusinessBuildPlan } from "../../../business-build/businessBuildPlan.js";
import { buildFounderRuntimeEnvelope } from "../../../live-ready/founderRuntimeEnvelope.js";

export const BUSINESS_BUILD_ROUTE_ID = "business-build";
export const DEFAULT_BUSINESS_BUILD_IDEA =
  "I have a startup idea. Validate if it is feasible and tell me what you need next.";

function toTitle(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD")
    .replace(/\bDb\b/g, "DB");
}

function toBusinessBuildAnswers(prdFields = {}) {
  return {
    founderIdea: prdFields.founderIdea,
    targetCustomer: prdFields.targetCustomer,
    problem: prdFields.problem,
    proposedSolution: prdFields.solution,
    businessModel: prdFields.businessModel,
    goToMarket: prdFields.goToMarket,
    constraints: prdFields.risks,
    successCriteria: prdFields.successCriteria,
  };
}

function buildFounderHighlights(prdFields = {}) {
  return [
    {
      label: "Idea",
      value: prdFields.founderIdea || "Founder idea not captured yet.",
      detail: "NEXUS uses this as the current business build scope.",
    },
    {
      label: "Customer",
      value: prdFields.targetCustomer || "Target customer needs confirmation.",
      detail: "Agent lanes use this customer definition for product, design, GTM, and support planning.",
    },
    {
      label: "Problem",
      value: prdFields.problem || "Problem statement needs confirmation.",
      detail: "This is the pain or market gap the plan is trying to validate.",
    },
    {
      label: "Solution",
      value: prdFields.solution || "Solution direction needs confirmation.",
      detail: "This is the MVP direction agents will plan around before any execution is enabled.",
    },
  ];
}

const FOUNDER_WORKSTREAM_DRY_RUN_ROWS = [
  {
    label: "Local founder task orchestration",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["clarifying question plan", "PRD readiness packet outline", "agent lane plan", "operator review checklist"],
    blockers: ["founder answers missing", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Founder Runtime",
  },
  {
    label: "Generated workspace boundary",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["PRD readiness packet outline", "solution architecture checklist", "agent lane plan", "workspace boundary review"],
    blockers: ["source/test boundary review", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Generated Workspace Governance",
  },
  {
    label: "Live unlock review",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["risk checklist", "cost review packet", "agent lane plan", "operator review checklist"],
    blockers: ["cost evidence missing", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Live Activation Governance",
  },
];

export function buildBusinessBuildViewModel(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const founderEnvelope = buildFounderRuntimeEnvelope({ founderIdeaSummary }).data;
  const prdFields = founderEnvelope.prdDraft?.fields || {};
  const plan = buildBusinessBuildPlan({
    founderIdeaSummary: prdFields.founderIdea,
    answers: toBusinessBuildAnswers(prdFields),
    evidenceRefs: ["Business build plan evidence report"],
    activityRefs: ["OS phase status evidence report"],
  });
  const data = plan.data;
  const readinessPercent = Math.round((data.prdReadiness.score || 0) * 100);
  const nextAgentLane = founderEnvelope.agentFlow?.[0];
  const founderHighlights = buildFounderHighlights(prdFields);

  return {
    routeId: BUSINESS_BUILD_ROUTE_ID,
    pageTitle: "Business Build",
    founderIdea: prdFields.founderIdea,
    targetCustomer: prdFields.targetCustomer,
    problem: prdFields.problem,
    solution: prdFields.solution,
    founderHighlights,
    feasibilityVerdict: data.prdReadiness.readyForWorkstreams
      ? "Feasible enough for local MVP planning"
      : "Needs more founder answers before MVP planning",
    founderNextStep: founderEnvelope.chat?.nextAction || data.nextAction,
    agentPlanSummary: nextAgentLane
      ? `${nextAgentLane.lane} starts with ${nextAgentLane.nextAction}`
      : "NEXUS will map the PRD to owner lanes after intake is complete.",
    safetySummary: "Planning is live-local. Execution, spend, project writes, DB writes, and deploy remain blocked.",
    whatChanged: "Business Build now follows the founder idea from Chat with NEXUS into PRD readiness, workstreams, and milestones.",
    currentState: "Founder plan is ready for local review. Runtime execution remains disabled.",
    nextAction: data.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: data.ownerCapability,
    evidenceLocation: "Business build plan evidence report",
    activityLocation: "OS phase status evidence report",
    costImpact: data.costImpact,
    disabledReason: "Business Build is a dry-run planning surface. Provider calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
    readinessCards: [
      { label: "Founder idea", value: "Captured", tone: "pass", detail: prdFields.founderIdea },
      { label: "PRD readiness", value: `${readinessPercent}%`, tone: "pass", detail: "Local PRD fields are complete for planning." },
      { label: "Agent lanes", value: String(data.workstreams.length), tone: "teal", detail: "Product, design, engineering, GTM, finance, operations, legal, and support lanes are mapped." },
      { label: "Execution", value: "Blocked", tone: "disabled", detail: "No provider, worker, project, DB, deploy, or spend path is invoked." },
    ],
    prdReadiness: {
      ready: data.prdReadiness.readyForWorkstreams,
      score: readinessPercent,
      missingFields: data.prdReadiness.missingFields,
      source: "Founder intake answers mapped to local PRD fields.",
      fields: prdFields,
    },
    workstreamRows: data.workstreams.map((entry) => ({
      label: toTitle(entry.workstream),
      ownerCapability: entry.ownerCapability,
      status: toTitle(entry.status),
      objective: entry.objective,
      nextInput: entry.inputsNeeded[0] || "Validated PRD draft",
      blocker: entry.blockers[0] || "No blocker",
    })),
    milestoneRows: data.milestones.map((entry) => ({
      label: toTitle(entry.milestone),
      ownerCapability: entry.ownerCapability,
      status: toTitle(entry.status),
      objective: entry.objective,
      blocker: entry.blockers[0] || "No blocker",
    })),
    founderWorkstreamDryRun: {
      currentState: "Local Founder Workstream Dry Run Ready Blocked",
      nextAction: "Use the dry-run preview to complete founder Q&A and PRD readiness before any later execution review.",
      disabledReason: "Founder Dry Run is display-only. It does not dispatch agents, run executors, mutate projects, write DB state, call providers, use network calls, deploy, package, or spend.",
      ownerCapability: "NEXUS Founder Workstream Dry Run Governance",
      evidenceLocation: "reports/p893-local-founder-workstream-dry-run-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      rows: FOUNDER_WORKSTREAM_DRY_RUN_ROWS.map((run) => ({
        ...run,
        nextAction: "Complete founder answers and operator review evidence before any execution-enabling phase.",
        disabledReason: "Dry-run row is display-only and cannot execute or mutate.",
        evidenceLocation: "reports/p893-local-founder-workstream-dry-run-report.md",
        activityLocation: "reports/os-phase-status-report.md",
        costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      })),
    },
    blockers: data.blockers,
    disabledActions: data.disabledActions.map((action) => ({
      label: toTitle(action),
      reason: "Unavailable from Business Build until explicit approval, scope, budget, rollback, activity, cost, and redaction evidence exist.",
    })),
    safety: {
      executionEnabled: false,
      providerCallsAllowed: false,
      agentDispatchAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export const businessBuildViewModel = buildBusinessBuildViewModel();
