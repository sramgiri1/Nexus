import { createPassResult } from "../shared/resultEnvelope.js";

export const P85_FOUNDER_PRD_REVIEW_GATE_PHASE = "P85.3";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
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
  "authSessionUserWorkspaceMutationAllowed",
  "providerSpendAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeDecision(value = "pending") {
  return ["pending", "approved", "needs_revision"].includes(value) ? value : "pending";
}

function toDisplayName(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD");
}

function buildReviewState({ missingFields, founderDecision }) {
  if (missingFields.length > 0) return "Needs founder answers";
  if (founderDecision === "approved") return "Founder approved locally";
  if (founderDecision === "needs_revision") return "Founder requested revision";
  return "Ready for founder review";
}

export function buildFounderPrdReviewGate(input = {}) {
  const qnaState = input.qnaState?.data || input.qnaState || {};
  const prdDraft = input.prdDraft || qnaState.prdDraft || {};
  const prdFields = prdDraft.fields || prdDraft.prdFields || {};
  const answeredFields = Array.isArray(prdDraft.answeredFields) ? prdDraft.answeredFields : Object.entries(prdFields).filter(([, value]) => Boolean(value)).map(([field]) => field);
  const missingFields = Array.isArray(prdDraft.missingFields)
    ? prdDraft.missingFields
    : Object.entries(prdFields).filter(([, value]) => !value).map(([field]) => field);
  const founderDecision = normalizeDecision(input.founderDecision);
  const complete = missingFields.length === 0;
  const reviewState = buildReviewState({ missingFields, founderDecision });
  const versionNumber = Math.max(1, Number(input.versionNumber || 1));
  const versionLabel = `PRD v${versionNumber}`;
  const blockers = [
    ...missingFields.map((field) => `${toDisplayName(field)} needs a founder answer.`),
    ...(complete && founderDecision !== "approved" ? ["Founder must review and approve the local PRD before task-board admission."] : []),
  ];
  const data = {
    schemaVersion: "1.0",
    versionLabel,
    reviewState,
    founderDecision,
    prdFields,
    answeredFields,
    missingFields,
    blockers,
    nextAction: blockers.length ? blockers[0] : "Route approved local PRD to P85.4 task-board admission.",
    downstreamPlanningAllowed: complete && founderDecision === "approved",
    executionAllowed: false,
    disabledReason:
      "P85.3 is a local PRD review gate only. Provider/model PRD generation, agent dispatch, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
    ownerCapability: "NEXUS Founder PRD Review Gate",
    evidenceRefs: input.evidenceRefs || ["reports/p853-prd-review-gate-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local PRD review only. No provider/model calls, worker runtime, project writes, DB writes, deploy, package creation, network calls, or provider spend.",
    commandCenterVisible: true,
    safety: {
      localPrdReviewAllowed: true,
      ...blockedRuntimeFlags(),
    },
    ...blockedRuntimeFlags(),
  };
  return createPassResult({
    phase: P85_FOUNDER_PRD_REVIEW_GATE_PHASE,
    mode: "live-local",
    source: "live-ready/enterpriseFounderPrdReviewGate.js",
    summary: "Local PRD versions are gated by founder review before downstream task planning.",
    data,
    evidence: data.evidenceRefs,
    warnings: ["P85.3 does not generate PRDs with providers, dispatch agents, mutate projects, write DB state, deploy, package, export, or spend."],
  });
}

export function validateFounderPrdReviewGate(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P85_FOUNDER_PRD_REVIEW_GATE_PHASE) errors.push("phase must be P85.3");
  for (const field of ["schemaVersion", "versionLabel", "reviewState", "founderDecision", "prdFields", "answeredFields", "missingFields", "blockers", "nextAction", "downstreamPlanningAllowed", "executionAllowed", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact", "safety"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!/^PRD v\d+/.test(data.versionLabel || "")) errors.push("versionLabel must be display-safe");
  if (!Array.isArray(data.answeredFields) || !Array.isArray(data.missingFields) || !Array.isArray(data.blockers)) errors.push("review arrays must be present");
  if (data.executionAllowed !== false) errors.push("executionAllowed must be false");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safety?.[flag] !== false) errors.push(`safety.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("review gate must not expose raw private IDs");
  if (/generate PRD now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(serialized)) errors.push("review gate must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
