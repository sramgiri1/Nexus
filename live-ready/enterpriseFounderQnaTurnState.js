import { createPassResult } from "../shared/resultEnvelope.js";
import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "../founder-intake/founderIntakeSchema.js";
import { createFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { mergeFounderAnswer, selectNextFounderQuestion } from "../founder-intake/founderIntakeQuestions.js";
import { buildEnterpriseFounderBusinessRuntime } from "./enterpriseFounderBusinessRuntime.js";

export const P85_FOUNDER_QNA_TURN_STATE_PHASE = "P85.2";

const DEFAULT_FOUNDER_IDEA = "I have a startup idea. Validate if it is feasible and tell me what you need next.";

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

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeText(value = "", fallback = "") {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  return trimmed || fallback;
}

function sanitizeTurns(turns = []) {
  return turns
    .filter((turn) => ["founder", "nexus"].includes(turn?.speaker) && normalizeText(turn?.message))
    .map((turn, index) => ({
      turnNumber: index + 1,
      speaker: turn.speaker,
      label: turn.speaker === "founder" ? "Founder" : "NEXUS",
      message: normalizeText(turn.message),
    }));
}

function toDisplayName(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD");
}

function inferFieldFromMessage(message = "", fallbackField = "") {
  const text = message.toLowerCase();
  const keywordMap = [
    ["targetCustomer", /\b(customers?|users?|players?|buyers?|audience|segments?|market)\b/],
    ["problem", /\b(problem|pain|workflow|job|need|struggle|issue)\b/],
    ["currentAlternatives", /\b(alternative|currently|today|competitor|existing|use now)\b/],
    ["proposedSolution", /\b(solution|product|app|service|feature|build|create|game)\b/],
    ["businessModel", /\b(price|pricing|charge|revenue|subscription|paid|free|ads|business model)\b/],
    ["goToMarket", /\b(go to market|launch|reach|channel|marketing|app store|sell|distribution)\b/],
    ["constraints", /\b(constraint|budget|timeline|limit|compliance|data|integration|scope)\b/],
    ["successCriteria", /\b(success|metric|outcome|kpi|prove|goal|measure)\b/],
  ];
  const match = keywordMap.find(([, pattern]) => pattern.test(text));
  return match?.[0] || fallbackField || FOUNDER_INTAKE_REQUIRED_FIELDS[0];
}

function mergeMessageIntoAnswers(session, message) {
  const currentQuestion = selectNextFounderQuestion(session);
  const field = inferFieldFromMessage(message, currentQuestion.field);
  const result = mergeFounderAnswer(session, {
    question: { field, questionId: `founder-${field}` },
    answer: message,
  });
  if (result.session?.lastTransition?.status === "applied") return result.session;
  return session;
}

function buildNexusReply(session, previousMissingCount) {
  const nextQuestion = selectNextFounderQuestion(session);
  const capturedField = session.lastTransition?.field ? toDisplayName(session.lastTransition.field) : "Founder idea";
  if (!session.missingFields?.length) {
    return "I have enough structured answers to draft the local PRD and map governed agent lanes. Execution still waits for explicit live gates.";
  }
  if (previousMissingCount > session.missingFields.length) {
    return `Captured ${capturedField}. Next question: ${nextQuestion.prompt}`;
  }
  return `I captured that context. Next question: ${nextQuestion.prompt}`;
}

function buildState({ founderIdeaSummary, answers = {}, turns = [], evidenceRefs, activityRefs }) {
  const safeFounderIdea = normalizeText(founderIdeaSummary, DEFAULT_FOUNDER_IDEA);
  const session = createFounderIntakeSession({
    founderIdeaSummary: safeFounderIdea,
    answers,
    evidenceRefs,
    activityRefs,
  });
  const runtime = buildEnterpriseFounderBusinessRuntime({
    founderIdeaSummary: safeFounderIdea,
    answers: session.answers,
    evidenceRefs,
    activityRefs,
  });
  const nextQuestion = selectNextFounderQuestion(session);
  const safeTurns = sanitizeTurns(turns);
  const normalizedTurns = safeTurns.length
    ? safeTurns
    : sanitizeTurns([
        { speaker: "founder", message: safeFounderIdea },
        { speaker: "nexus", message: `I understand the idea. Next question: ${nextQuestion.prompt}` },
      ]);

  return {
    schemaVersion: "1.0",
    currentState: session.missingFields.length ? "founder_qna_collecting_answers" : "founder_qna_ready_for_prd_review",
    readinessLabel: session.missingFields.length ? "Collecting answers" : "PRD ready",
    founderIdeaSummary: safeFounderIdea,
    turns: normalizedTurns,
    suggestedPrompts: [
      "The first customers are casual iPhone players who want a clean arcade game.",
      "The problem is existing Snake games are cluttered with ads and weak touch controls.",
      "The business model starts free with an optional ad-free paid version.",
      "Success means playable MVP, passing tests, and a clear App Store checklist.",
    ],
    answers: session.answers,
    answeredFields: session.answeredFields,
    missingFields: session.missingFields,
    nextQuestion,
    prdDraft: runtime.data.prdDraft,
    agentFlow: runtime.data.agentPlan,
    disabledActions: [
      { label: "Provider calls", reason: "Provider/model calls remain disabled until explicit budget, policy, and approval gates exist." },
      { label: "Agent dispatch", reason: "Agent lanes are planned locally; no agents are dispatched in P85.2." },
      { label: "Project mutation", reason: "No project files, DB records, deploys, exports, or packages are created from Lite." },
    ],
    safety: {
      localQnaAllowed: true,
      localPrdDraftAllowed: true,
      localWorkstreamPlanningAllowed: true,
      ...blockedRuntimeFlags(),
    },
    blockers: session.missingFields.map((field) => `${toDisplayName(field)} needs a founder answer.`),
    nextAction: session.missingFields.length
      ? `Ask the founder: ${nextQuestion.prompt}`
      : "Review local PRD readiness and route to P85.3 safe PRD review.",
    disabledReason:
      "P85.2 stores local founder Q&A turns only. Provider/model calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
    ownerCapability: "NEXUS Founder Q&A Turn State",
    evidenceRefs: evidenceRefs || ["reports/p852-founder-turn-state-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local browser state only. No provider calls, worker runtime, project writes, DB writes, deploy, package creation, network calls, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

export function createFounderQnaTurnState(input = {}) {
  const data = buildState({
    founderIdeaSummary: input.founderIdeaSummary,
    answers: input.answers,
    turns: input.turns,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  return createPassResult({
    phase: P85_FOUNDER_QNA_TURN_STATE_PHASE,
    mode: "live-local",
    source: "live-ready/enterpriseFounderQnaTurnState.js",
    summary: "Founder Q&A turns are tracked locally and mapped to PRD readiness without unsafe execution.",
    data,
    evidence: data.evidenceRefs,
    warnings: ["P85.2 does not call providers, dispatch agents, execute tools or workers, mutate projects, write DB state, deploy, package, export, or spend."],
  });
}

export function appendFounderQnaTurn(state = {}, message = "") {
  const current = state.data || state;
  const safeMessage = normalizeText(message);
  if (!safeMessage) return createFounderQnaTurnState(current);
  const session = createFounderIntakeSession({
    founderIdeaSummary: current.founderIdeaSummary || DEFAULT_FOUNDER_IDEA,
    answers: current.answers,
    evidenceRefs: current.evidenceRefs,
    activityRefs: current.activityRefs,
  });
  const previousMissingCount = session.missingFields.length;
  const nextSession = mergeMessageIntoAnswers(session, safeMessage);
  const reply = buildNexusReply(nextSession, previousMissingCount);
  return createFounderQnaTurnState({
    founderIdeaSummary: current.founderIdeaSummary || safeMessage,
    answers: nextSession.answers,
    evidenceRefs: current.evidenceRefs,
    activityRefs: current.activityRefs,
    turns: [
      ...(current.turns || []),
      { speaker: "founder", message: safeMessage },
      { speaker: "nexus", message: reply },
    ],
  });
}

export function resetFounderQnaTurnState(input = {}) {
  return createFounderQnaTurnState({
    founderIdeaSummary: input.founderIdeaSummary || DEFAULT_FOUNDER_IDEA,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
}

export function validateFounderQnaTurnState(state = {}) {
  const envelope = state.data ? state : { data: state, phase: P85_FOUNDER_QNA_TURN_STATE_PHASE };
  const data = envelope.data || {};
  const errors = [];
  if (envelope.phase !== P85_FOUNDER_QNA_TURN_STATE_PHASE) errors.push("phase must be P85.2");
  for (const field of ["schemaVersion", "currentState", "turns", "suggestedPrompts", "answers", "missingFields", "nextQuestion", "prdDraft", "agentFlow", "disabledActions", "safety", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.turns) || data.turns.length < 2) errors.push("turns must include founder and NEXUS messages");
  if (!Array.isArray(data.suggestedPrompts) || data.suggestedPrompts.length < 4) errors.push("suggestedPrompts must guide founder Q&A");
  if (!Array.isArray(data.agentFlow) || data.agentFlow.length < 4) errors.push("agentFlow must include planned lanes");
  if (!Array.isArray(data.disabledActions) || data.disabledActions.length < 3) errors.push("disabledActions must explain blocked execution");
  for (const turn of data.turns || []) {
    if (!["founder", "nexus"].includes(turn.speaker) || !turn.message || /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(turn.message)) {
      errors.push("turns must be display-safe founder/NEXUS messages");
    }
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safety?.[flag] !== false) errors.push(`safety.${flag} must be false`);
  }
  if (/call provider now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(JSON.stringify(data))) {
    errors.push("state must not expose fake unsafe runnable actions");
  }
  return { valid: errors.length === 0, errors };
}
