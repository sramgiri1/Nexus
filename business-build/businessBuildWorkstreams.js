import { createBusinessBuildPrdDraft } from "./businessBuildPrdSchema.js";

export const BUSINESS_BUILD_WORKSTREAM_PHASE = "P81.3";

export const BUSINESS_BUILD_WORKSTREAMS = Object.freeze([
  { workstream: "product", ownerCapability: "ATLAS.productArchitecture", objective: "Turn PRD draft into product scope, acceptance criteria, and release slices." },
  { workstream: "design", ownerCapability: "ORION.experienceDesign", objective: "Plan user journeys, interface states, and usability checks." },
  { workstream: "engineering", ownerCapability: "FORGE.implementationPlanning", objective: "Plan technical architecture, milestones, validation, and integration boundaries." },
  { workstream: "goToMarket", ownerCapability: "BEACON.marketStrategy", objective: "Plan positioning, target channels, launch messaging, and sales learning loops." },
  { workstream: "finance", ownerCapability: "LEDGER.businessModeling", objective: "Plan pricing assumptions, cost posture, revenue model, and funding checkpoints." },
  { workstream: "operations", ownerCapability: "WARDEN.operatingSystem", objective: "Plan operating cadence, evidence records, support handoffs, and owner responsibilities." },
  { workstream: "legal", ownerCapability: "COUNSEL.riskReview", objective: "Plan policy, compliance, terms, data handling, and approval checkpoints." },
  { workstream: "support", ownerCapability: "HARBOR.customerSuccess", objective: "Plan onboarding, support loops, knowledge base needs, and feedback capture." },
]);

const RUNTIME_FLAGS = Object.freeze([
  "agentDispatchAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function buildInputsNeeded(workstream, prdDraft) {
  const missingFields = prdDraft.data?.missingFields || [];
  if (missingFields.length > 0) return missingFields.map((field) => `Complete PRD field: ${field}`);
  if (workstream === "finance") return ["Pricing assumptions", "cost constraints", "revenue milestone"];
  if (workstream === "legal") return ["Data categories", "risk notes", "approval boundary"];
  if (workstream === "engineering") return ["MVP scope", "acceptance criteria", "integration boundary"];
  return ["Validated PRD draft", "success criteria", "evidence references"];
}

export function buildBusinessBuildWorkstreams(input = {}) {
  const prdDraft = input.prdDraft || createBusinessBuildPrdDraft(input);
  const missingFields = prdDraft.data?.missingFields || [];
  const runtimeFlags = Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
  const workstreams = BUSINESS_BUILD_WORKSTREAMS.map((entry) => ({
    ...entry,
    status: missingFields.length === 0 ? "ready_for_dry_run" : "blocked_on_prd",
    inputsNeeded: buildInputsNeeded(entry.workstream, prdDraft),
    blockers: missingFields.length === 0 ? [] : missingFields.map((field) => `${field} is required before ${entry.workstream} planning.`),
    disabledReason:
      "P81.3 creates local workstream records only. Agent dispatch, provider calls, tools, workers, project mutation, DB writes, deploy, and provider spend remain blocked.",
    costImpact: "No provider calls, agent dispatch, worker runtime, project writes, DB writes, deploy, or provider spend.",
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p813-agent-workstreams-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P81.3"])],
    ...runtimeFlags,
  }));

  return {
    phase: BUSINESS_BUILD_WORKSTREAM_PHASE,
    schemaVersion: "1.0",
    sourceDraftId: prdDraft.data?.draftId || "business-build-prd-draft",
    currentState: missingFields.length === 0 ? "workstreams_ready_for_dry_run" : "workstreams_blocked_on_prd",
    nextAction: missingFields.length === 0 ? "Route workstreams to P81.4 dry-run business build plan." : `Complete PRD field ${missingFields[0]}.`,
    ownerCapability: "NEXUS.businessBuildWorkstreams",
    workstreams,
    blockers: [...new Set(workstreams.flatMap((entry) => entry.blockers))],
    disabledReason: "Business build workstreams are local planning records. No agents are dispatched in P81.3.",
    costImpact: "No provider calls or provider spend.",
    ...runtimeFlags,
  };
}

export function validateBusinessBuildWorkstreams(plan = {}) {
  const errors = [];
  if (!Array.isArray(plan.workstreams) || plan.workstreams.length !== BUSINESS_BUILD_WORKSTREAMS.length) {
    errors.push("workstreams must cover every required business lane");
  }
  for (const entry of plan.workstreams || []) {
    for (const field of ["workstream", "ownerCapability", "objective", "inputsNeeded", "blockers", "disabledReason", "costImpact"]) {
      if (!(field in entry)) errors.push(`${entry.workstream || "unknown"}.${field} missing`);
    }
    if (!Array.isArray(entry.inputsNeeded)) errors.push(`${entry.workstream}.inputsNeeded must be an array`);
    if (!Array.isArray(entry.blockers)) errors.push(`${entry.workstream}.blockers must be an array`);
    for (const flag of RUNTIME_FLAGS) {
      if (entry[flag] !== false) errors.push(`${entry.workstream}.${flag} must be false`);
    }
    if (/dispatch now|run agent|execute now|create project|deploy now/i.test(entry.disabledReason || "")) {
      errors.push(`${entry.workstream}.disabledReason must not imply runnable action`);
    }
  }
  for (const flag of RUNTIME_FLAGS) {
    if (plan[flag] !== false) errors.push(`${flag} must be false`);
  }
  return { valid: errors.length === 0, errors };
}
