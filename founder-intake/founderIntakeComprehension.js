import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "./founderIntakeSchema.js";
import { selectNextFounderQuestion } from "./founderIntakeQuestions.js";

export function scoreFounderComprehension(session = {}) {
  const answeredFields = Array.isArray(session.answeredFields) ? session.answeredFields : Object.keys(session.answers || {});
  const missingFields = Array.isArray(session.missingFields)
    ? session.missingFields
    : FOUNDER_INTAKE_REQUIRED_FIELDS.filter((field) => !answeredFields.includes(field));
  const answeredRequired = FOUNDER_INTAKE_REQUIRED_FIELDS.filter((field) => answeredFields.includes(field));
  const comprehensionScore = answeredRequired.length / FOUNDER_INTAKE_REQUIRED_FIELDS.length;
  const ready = missingFields.length === 0 && comprehensionScore >= 1;
  const nextQuestion = selectNextFounderQuestion({ ...session, missingFields });

  return {
    missingFields,
    answeredFields: answeredRequired,
    confidence: comprehensionScore,
    comprehensionScore,
    ready,
    nextQuestion,
    nextAction: ready ? "Route founder intake to PRD readiness planning." : nextQuestion.nextAction,
    blockers: missingFields.map((field) => `${field} is missing.`),
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployExecutionAllowed: false,
    providerSpendAllowed: false,
  };
}
