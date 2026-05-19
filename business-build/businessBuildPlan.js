import { createPassResult } from "../shared/resultEnvelope.js";
import { createBusinessBuildPrdDraft } from "./businessBuildPrdSchema.js";
import { buildBusinessBuildWorkstreams } from "./businessBuildWorkstreams.js";

export const BUSINESS_BUILD_PLAN_PHASE = "P81.4";

export const BUSINESS_BUILD_DISABLED_ACTIONS = Object.freeze([
  "provider_calls",
  "agent_dispatch",
  "tool_execution",
  "worker_execution",
  "project_creation",
  "project_mutation",
  "db_writes",
  "network_calls",
  "deploy_execution",
  "release_execution",
  "export_execution",
  "package_creation",
  "auth_session_user_workspace_mutation",
  "provider_spend",
]);

export const BUSINESS_BUILD_MILESTONES = Object.freeze([
  {
    milestone: "prd-readiness-review",
    ownerCapability: "NEXUS.businessBuildPrd",
    objective: "Confirm PRD draft completeness, blockers, and evidence references.",
  },
  {
    milestone: "workstream-scope-plan",
    ownerCapability: "NEXUS.businessBuildWorkstreams",
    objective: "Confirm product, design, engineering, go-to-market, finance, operations, legal, and support lanes.",
  },
  {
    milestone: "mvp-release-slice-plan",
    ownerCapability: "FORGE.implementationPlanning",
    objective: "Map validated PRD fields into a local MVP release-slice outline.",
  },
  {
    milestone: "launch-learning-plan",
    ownerCapability: "BEACON.marketStrategy",
    objective: "Map launch assumptions, learning goals, and feedback checkpoints.",
  },
  {
    milestone: "risk-cost-review",
    ownerCapability: "WARDEN.operatingSystem",
    objective: "Confirm blocked execution actions, safety posture, cost posture, and approval requirements.",
  },
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "prdGenerationAllowed",
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

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function buildMilestones(prdDraft, workstreamPlan) {
  const blockers = unique([
    ...(prdDraft.data?.blockers || []),
    ...(workstreamPlan.blockers || []),
  ]);
  const ready = blockers.length === 0 && workstreamPlan.currentState === "workstreams_ready_for_dry_run";

  return BUSINESS_BUILD_MILESTONES.map((entry, index) => ({
    ...entry,
    order: index + 1,
    status: ready ? "ready_for_operator_review" : "blocked_on_prd_or_workstreams",
    inputs: index === 0 ? ["Local PRD draft readiness", "missing field list"] : ["Local PRD draft", "local workstream records"],
    blockers,
    disabledReason:
      "P81.4 assembles a dry-run plan only. Provider calls, agents, tools, workers, project changes, DB writes, deploy, and provider spend remain blocked.",
  }));
}

export function buildBusinessBuildPlan(input = {}) {
  const prdDraft = input.prdDraft || createBusinessBuildPrdDraft(input);
  const workstreamPlan = input.workstreamPlan || buildBusinessBuildWorkstreams({ ...input, prdDraft });
  const runtimeFlags = Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
  const milestones = buildMilestones(prdDraft, workstreamPlan);
  const blockers = unique([
    ...(prdDraft.data?.blockers || []),
    ...(workstreamPlan.blockers || []),
    ...milestones.flatMap((entry) => entry.blockers || []),
  ]);
  const ready = blockers.length === 0 && workstreamPlan.currentState === "workstreams_ready_for_dry_run";
  const currentState = ready ? "dry_run_business_build_plan_ready" : "dry_run_business_build_plan_blocked";

  return createPassResult({
    phase: BUSINESS_BUILD_PLAN_PHASE,
    mode: "live",
    source: "business-build/businessBuildPlan.js",
    summary: "Business build plan is a local dry-run outline. Runtime execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState,
      readyForCommandCenter: ready,
      prdReadiness: {
        draftId: prdDraft.data?.draftId || "business-build-prd-draft",
        readyForWorkstreams: Boolean(prdDraft.data?.readyForWorkstreams),
        score: prdDraft.data?.readiness?.score || 0,
        missingFields: [...(prdDraft.data?.missingFields || [])],
      },
      workstreams: workstreamPlan.workstreams || [],
      milestones,
      blockers,
      disabledActions: [...BUSINESS_BUILD_DISABLED_ACTIONS],
      ownerCapability: "NEXUS.businessBuildPlan",
      nextAction: ready ? "Surface dry-run plan in Command Center business build UX." : blockers[0] || "Complete PRD readiness.",
      disabledReason:
        "P81.4 is a dry-run business build plan only. Provider calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
      evidenceRefs: unique([
        ...normalizeList(input.evidenceRefs),
        ...(prdDraft.data?.evidenceRefs || []),
        "reports/p814-business-build-plan-report.md",
      ]),
      activityRefs: unique([
        ...normalizeList(input.activityRefs),
        ...(prdDraft.data?.activityRefs || []),
        "os-roadmap/phase-status.json#P81.4",
      ]),
      costImpact: "No provider calls, agent dispatch, worker runtime, project writes, DB writes, deploy, release, export, package creation, or provider spend.",
      ...runtimeFlags,
    },
    evidence: ["reports/p814-business-build-plan-report.md"],
    warnings: ["This is a dry-run plan outline, not runtime business build execution."],
  });
}

export function validateBusinessBuildPlan(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  for (const field of ["currentState", "prdReadiness", "workstreams", "milestones", "blockers", "disabledActions", "costImpact"]) {
    if (!(field in data)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(data.workstreams)) errors.push("workstreams must be an array");
  if (!Array.isArray(data.milestones)) errors.push("milestones must be an array");
  if (!Array.isArray(data.blockers)) errors.push("blockers must be an array");
  if (!Array.isArray(data.disabledActions)) errors.push("disabledActions must be an array");
  if (data.disabledActions?.length !== BUSINESS_BUILD_DISABLED_ACTIONS.length) {
    errors.push("disabledActions must cover all blocked execution surfaces");
  }
  if (!data.disabledReason || /run now|create project|dispatch agent|deploy now|execute now/i.test(data.disabledReason)) {
    errors.push("disabledReason must not imply runnable actions");
  }
  for (const milestone of data.milestones || []) {
    for (const field of ["milestone", "ownerCapability", "objective", "status", "inputs", "blockers", "disabledReason"]) {
      if (!(field in milestone)) errors.push(`${milestone.milestone || "unknown"}.${field} missing`);
    }
    if (!Array.isArray(milestone.inputs)) errors.push(`${milestone.milestone}.inputs must be an array`);
    if (!Array.isArray(milestone.blockers)) errors.push(`${milestone.milestone}.blockers must be an array`);
    if (/run now|create project|dispatch agent|deploy now|execute now/i.test(milestone.disabledReason || "")) {
      errors.push(`${milestone.milestone}.disabledReason must not imply runnable actions`);
    }
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  return { valid: errors.length === 0, errors };
}
