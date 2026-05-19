import { buildBusinessBuildPlan } from "../../../business-build/businessBuildPlan.js";

export const BUSINESS_BUILD_ROUTE_ID = "business-build";

function toTitle(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD")
    .replace(/\bDb\b/g, "DB");
}

export function buildBusinessBuildViewModel() {
  const plan = buildBusinessBuildPlan({
    founderIdeaSummary: "Founder wants to validate a workflow automation startup.",
    answers: {
      targetCustomer: "operations leaders",
      problem: "manual handoffs slow launches",
      currentAlternatives: "spreadsheets and status meetings",
      proposedSolution: "guided automation workspace",
      businessModel: "seat-based SaaS",
      goToMarket: "founder-led sales to operations teams",
      constraints: "small founding team and limited budget",
      successCriteria: "reduce launch handoff time by 30 percent",
    },
    evidenceRefs: ["Business build plan evidence report"],
    activityRefs: ["OS phase status evidence report"],
  });
  const data = plan.data;
  const readinessPercent = Math.round((data.prdReadiness.score || 0) * 100);

  return {
    routeId: BUSINESS_BUILD_ROUTE_ID,
    pageTitle: "Business Build",
    whatChanged: "Command Center now shows the founder idea to PRD to workstream to dry-run business build path.",
    currentState: "Dry-run business build plan is ready for operator review. Runtime execution remains disabled.",
    nextAction: data.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: data.ownerCapability,
    evidenceLocation: "Business build plan evidence report",
    activityLocation: "OS phase status evidence report",
    costImpact: data.costImpact,
    disabledReason: "Business Build is a dry-run planning surface. Provider calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
    readinessCards: [
      { label: "PRD readiness", value: `${readinessPercent}%`, tone: "pass", detail: "Local PRD fields are complete for dry-run planning." },
      { label: "Workstreams", value: String(data.workstreams.length), tone: "teal", detail: "Owner lanes are planned locally without dispatching agents." },
      { label: "Milestones", value: String(data.milestones.length), tone: "amber", detail: "Milestones are ready for review, not execution." },
      { label: "Cost", value: "No spend", tone: "pass", detail: "No provider, worker, project, DB, deploy, or spend path is invoked." },
    ],
    prdReadiness: {
      ready: data.prdReadiness.readyForWorkstreams,
      score: readinessPercent,
      missingFields: data.prdReadiness.missingFields,
      source: "Founder intake answers mapped to local PRD fields.",
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
    blockers: data.blockers.length > 0 ? data.blockers : ["Runtime execution remains disabled until a later governed enablement phase."],
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
