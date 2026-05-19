import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "./founderIntakeSchema.js";
import { advanceFounderIntakeSession } from "./founderIntakeSession.js";

export const FOUNDER_QUESTION_PROMPTS = Object.freeze({
  targetCustomer: "Who is the first specific customer segment with this problem?",
  problem: "What painful workflow or job breaks for that customer today?",
  currentAlternatives: "What do they use now, and why is it not good enough?",
  proposedSolution: "What product or service will solve the problem?",
  businessModel: "How will the business charge and what is the first pricing hypothesis?",
  goToMarket: "How will the startup reach the first customers?",
  constraints: "What budget, timeline, compliance, data, or integration limits matter?",
  successCriteria: "What measurable outcome proves the idea is working?",
});

function normalizeMissing(session = {}) {
  return Array.isArray(session.missingFields) ? session.missingFields.filter((field) => FOUNDER_INTAKE_REQUIRED_FIELDS.includes(field)) : [];
}

function buildQuestion(field, session = {}) {
  return {
    questionId: `founder-${field}`,
    field,
    prompt: FOUNDER_QUESTION_PROMPTS[field] || `Clarify ${field}.`,
    answer: session.answers?.[field] || "",
    missingFields: normalizeMissing(session),
    confidence: session.answers?.[field] ? 1 : 0,
    nextAction: session.answers?.[field] ? "Review the next missing founder intake field." : `Ask the founder: ${FOUNDER_QUESTION_PROMPTS[field] || field}`,
    providerCallsAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
  };
}

export function selectNextFounderQuestion(session = {}) {
  const [field] = normalizeMissing(session);
  if (!field) {
    return {
      questionId: "founder-intake-ready",
      field: "",
      prompt: "Founder intake has enough structured answers for comprehension review.",
      answer: "",
      missingFields: [],
      confidence: 1,
      nextAction: "Score founder intake comprehension.",
      providerCallsAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
    };
  }
  return buildQuestion(field, session);
}

export function mergeFounderAnswer(session = {}, input = {}) {
  const field = input.field || input.question?.field || "";
  const questionId = input.questionId || input.question?.questionId || `founder-${field}`;
  const answer = input.answer || "";
  const nextSession = advanceFounderIntakeSession(session, { field, answer });
  const applied = nextSession.lastTransition?.status === "applied";
  return {
    questionId,
    field,
    answer: applied ? nextSession.answers?.[field] || "" : "",
    session: nextSession,
    missingFields: nextSession.missingFields || session.missingFields || [],
    confidence: applied ? Math.min(1, Math.max(0.25, String(answer).trim().length / 80)) : 0,
    nextAction: applied ? selectNextFounderQuestion(nextSession).nextAction : nextSession.lastTransition?.disabledReason,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployExecutionAllowed: false,
    providerSpendAllowed: false,
  };
}
