import {
  createFounderIntakeSessionEnvelope,
  FOUNDER_INTAKE_REQUIRED_FIELDS,
  validateFounderIntakeSession,
} from "./founderIntakeSchema.js";

export const FOUNDER_INTAKE_SESSION_PHASE = "P80.2";

function cloneAnswers(answers = {}) {
  return Object.fromEntries(
    Object.entries(answers || {})
      .filter(([field, value]) => FOUNDER_INTAKE_REQUIRED_FIELDS.includes(field) && value !== undefined && value !== null && String(value).trim())
      .map(([field, value]) => [field, String(value).trim()]),
  );
}

function buildState(input = {}, stageOverride = "") {
  const envelope = createFounderIntakeSessionEnvelope(input);
  const validation = validateFounderIntakeSession(envelope);
  const data = envelope.data || {};
  const missingFields = data.answerState?.missingFields || [];
  const stage = stageOverride || (missingFields.length === 0 ? "ready_for_comprehension" : "collecting_answers");
  return {
    safeSessionKey: data.session?.safeSessionKey || "founder-intake-session",
    stage,
    founderIdeaSummary: data.session?.founderIdeaSummary || "",
    answers: data.answerState?.answers || {},
    answeredFields: data.answerState?.answeredFields || [],
    missingFields,
    readiness: {
      readyForComprehension: data.answerState?.readyForComprehension === true,
      score: data.comprehensionScore?.score || 0,
      threshold: data.comprehensionScore?.threshold || 0.8,
      reasons: data.comprehensionScore?.reasons || [],
    },
    approvalState: data.approvalState || {},
    evidenceRefs: data.evidenceRefs || [],
    activityRefs: data.activityRefs || [],
    costImpact: data.costImpact || "",
    disabledReason: data.disabledReason || "",
    nextAction: missingFields.length === 0 ? "Route to P80.3 guided Q&A comprehension validation." : `Collect ${missingFields[0]}.`,
    ownerCapability: data.ownerCapability || "NEXUS.founderIntakeRuntime",
    validation,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployExecutionAllowed: false,
    providerSpendAllowed: false,
  };
}

export function createFounderIntakeSession(input = {}) {
  return buildState({
    safeSessionKey: input.safeSessionKey,
    founderIdeaSummary: input.founderIdeaSummary,
    answers: cloneAnswers(input.answers),
    approval: input.approval,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
}

export function advanceFounderIntakeSession(session = {}, transition = {}) {
  const field = String(transition.field || "").trim();
  const answer = transition.answer;
  if (!FOUNDER_INTAKE_REQUIRED_FIELDS.includes(field) || answer === undefined || answer === null || !String(answer).trim()) {
    return {
      ...session,
      lastTransition: {
        status: "blocked",
        disabledReason: "Transition must provide a supported founder intake field and a non-empty answer.",
      },
      providerCallsAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    };
  }
  const answers = {
    ...cloneAnswers(session.answers),
    [field]: String(answer).trim(),
  };
  return {
    ...buildState({
      safeSessionKey: session.safeSessionKey,
      founderIdeaSummary: session.founderIdeaSummary,
      answers,
      approval: session.approvalState,
      evidenceRefs: session.evidenceRefs,
      activityRefs: session.activityRefs,
    }),
    lastTransition: {
      status: "applied",
      field,
      providerCallsAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export function summarizeFounderIntakeSession(session = {}) {
  const missingFields = Array.isArray(session.missingFields) ? session.missingFields : [];
  return {
    safeSessionKey: session.safeSessionKey || "founder-intake-session",
    currentState: session.stage || "collecting_answers",
    nextAction: session.nextAction || (missingFields.length ? `Collect ${missingFields[0]}.` : "Review comprehension readiness."),
    blockers: missingFields.map((field) => `${field} is missing.`),
    disabledReason: session.disabledReason || "Founder intake session is local only; execution and mutation remain blocked.",
    ownerCapability: session.ownerCapability || "NEXUS.founderIntakeRuntime",
    evidenceLocation: session.evidenceRefs?.[0] || "reports/p802-founder-intake-session-report.md",
    activityLocation: session.activityRefs?.[0] || "os-roadmap/phase-status.json#P80.2",
    costImpact: session.costImpact || "No provider spend.",
    readiness: session.readiness || { readyForComprehension: false, score: 0, threshold: 0.8, reasons: [] },
    answeredCount: Array.isArray(session.answeredFields) ? session.answeredFields.length : 0,
    missingCount: missingFields.length,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployExecutionAllowed: false,
    providerSpendAllowed: false,
  };
}
