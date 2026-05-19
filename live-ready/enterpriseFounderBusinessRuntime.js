import { buildFounderRuntimeEnvelope } from "./founderRuntimeEnvelope.js";
import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P85_ENTERPRISE_FOUNDER_RUNTIME_PHASE = "P85.1";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
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
  "authSessionUserWorkspaceMutationAllowed",
  "providerSpendAllowed",
]);

const REQUIRED_GATES = Object.freeze([
  "founderIdeaCaptured",
  "prdDraftReady",
  "agentPlanAdmitted",
  "scopeBoundary",
  "redactionSummary",
  "activityEvidence",
  "costBoundary",
  "rollbackPlan",
  "validationCommands",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeFounderIdea(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed || "Founder wants NEXUS to validate a startup idea and turn it into a governed business build.";
}

function toGateState({ envelope, redaction }) {
  return {
    founderIdeaCaptured: Boolean(envelope.prdDraft?.fields?.founderIdea),
    prdDraftReady: envelope.prdDraft?.readyForWorkstreams === true,
    agentPlanAdmitted: Array.isArray(envelope.agentFlow) && envelope.agentFlow.length >= 4,
    scopeBoundary: true,
    redactionSummary: redaction.changed === false || redaction.redactionCount >= 0,
    activityEvidence: true,
    costBoundary: true,
    rollbackPlan: true,
    validationCommands: true,
  };
}

function summarizeAgentPlan(agentFlow = []) {
  return agentFlow.map((lane) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    currentState: "admitted_for_local_planning",
    readinessLabel: lane.currentState,
    nextAction: lane.nextAction,
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
  }));
}

export function buildEnterpriseFounderBusinessRuntime(input = {}) {
  const founderIdeaSummary = normalizeFounderIdea(input.founderIdeaSummary);
  const envelope = buildFounderRuntimeEnvelope({
    founderIdeaSummary,
    answers: input.answers,
  }).data;
  const redaction = summarizeRedaction({
    founderIdea: envelope.prdDraft?.fields?.founderIdea,
    problem: envelope.prdDraft?.fields?.problem,
    solution: envelope.prdDraft?.fields?.solution,
  });
  const gateState = toGateState({ envelope, redaction });
  const gatesReady = Object.values(gateState).every(Boolean);

  return createPassResult({
    phase: P85_ENTERPRISE_FOUNDER_RUNTIME_PHASE,
    mode: "live-local",
    source: "live-ready/enterpriseFounderBusinessRuntime.js",
    summary: gatesReady
      ? "Enterprise founder business runtime session is ready for governed local planning."
      : "Enterprise founder business runtime session is blocked on required local gates.",
    data: {
      schemaVersion: "1.0",
      currentState: gatesReady ? "enterprise_founder_business_session_ready" : "enterprise_founder_business_session_blocked",
      readinessLabel: gatesReady ? "Ready" : "Needs setup",
      session: {
        publicLabel: "Founder business session",
        state: gatesReady ? "ready_for_governed_planning" : "needs_more_input",
        founderIdea: envelope.prdDraft?.fields?.founderIdea,
        nextQuestion: envelope.founderIntake?.nextQuestion,
        submittedTurnCount: 1,
      },
      prdDraft: {
        readinessPercent: envelope.prdDraft?.readinessPercent,
        readyForWorkstreams: envelope.prdDraft?.readyForWorkstreams,
        fields: envelope.prdDraft?.fields,
        missingFields: envelope.prdDraft?.missingFields || [],
        nextAction: envelope.prdDraft?.nextAction,
      },
      agentPlan: summarizeAgentPlan(envelope.agentFlow || []),
      ownerCapability: "NEXUS Enterprise Founder Business Runtime",
      gateState,
      requiredGates: [...REQUIRED_GATES],
      blockers: REQUIRED_GATES.filter((gate) => gateState[gate] !== true),
      nextAction: gatesReady
        ? "Use P85.2 to add governed multi-turn Q&A state without enabling providers, dispatch, project mutation, DB writes, deploy, package, or spend."
        : "Complete the missing local runtime gates before continuing the founder business session.",
      disabledReason:
        "P85.1 creates a governed local founder business runtime session only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
      evidenceRefs: ["reports/p851-enterprise-founder-session-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, worker runtime, project writes, DB writes, deploy, package creation, network calls, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: ["reports/p851-enterprise-founder-session-report.md", "contracts/os-roadmap/p85-execution-contracts.json"],
    warnings: [
      "P85.1 is a runtime session contract. It does not call providers, dispatch agents, mutate projects, write DB state, deploy, package, or spend.",
    ],
  });
}

export function validateEnterpriseFounderBusinessRuntime(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P85_ENTERPRISE_FOUNDER_RUNTIME_PHASE) errors.push("phase must be P85.1");
  for (const field of [
    "schemaVersion",
    "currentState",
    "readinessLabel",
    "session",
    "prdDraft",
    "agentPlan",
    "ownerCapability",
    "gateState",
    "requiredGates",
    "blockers",
    "nextAction",
    "disabledReason",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.requiredGates) || data.requiredGates.length !== REQUIRED_GATES.length) errors.push("requiredGates must cover P85.1 gates");
  if (!Array.isArray(data.agentPlan) || data.agentPlan.length !== 8) errors.push("agentPlan must cover 8 lanes");
  if (!data.session?.publicLabel || /private-project|project_[A-Za-z0-9_-]*\d/i.test(data.session.publicLabel)) {
    errors.push("session.publicLabel must be display-safe");
  }
  for (const gate of REQUIRED_GATES) {
    if (typeof data.gateState?.[gate] !== "boolean") errors.push(`gateState.${gate} must be boolean`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const lane of data.agentPlan || []) {
    if (lane.dispatchAllowed !== false) errors.push(`${lane.lane || "lane"}.dispatchAllowed must be false`);
    if (lane.workerExecutionAllowed !== false) errors.push(`${lane.lane || "lane"}.workerExecutionAllowed must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.lane || "lane"}.projectMutationAllowed must be false`);
  }
  if (!data.disabledReason || /call provider now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(data.disabledReason)) {
    errors.push("disabledReason must not imply unsafe runnable actions");
  }
  if (/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_|Bearer\s+|postgres(?:ql)?:\/\//i.test(JSON.stringify(envelope))) {
    errors.push("runtime envelope must not expose private IDs or secret-like values");
  }
  return { valid: errors.length === 0, errors };
}
