import { scoreFounderComprehension } from "../../../founder-intake/founderIntakeComprehension.js";
import { selectNextFounderQuestion } from "../../../founder-intake/founderIntakeQuestions.js";
import { createFounderIntakeSession, summarizeFounderIntakeSession } from "../../../founder-intake/founderIntakeSession.js";
import { buildFounderRuntimeDbViewModel } from "./businessBuild.js";

export const FOUNDER_INTAKE_ROUTE_ID = "founder-intake";

export function buildFounderIntakeViewModel() {
  const session = createFounderIntakeSession({
    founderIdeaSummary: "Founder wants to validate a workflow automation startup.",
    answers: {
      targetCustomer: "operations leaders",
      problem: "manual handoffs slow launches",
      currentAlternatives: "spreadsheets and status meetings",
      proposedSolution: "guided automation workspace",
    },
    evidenceRefs: ["reports/founder-intake-ux-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
  });
  const nextQuestion = selectNextFounderQuestion(session);
  const comprehension = scoreFounderComprehension(session);
  const summary = summarizeFounderIntakeSession(session);
  const founderDbWorkflow = buildFounderRuntimeDbViewModel(session.founderIdeaSummary);

  return {
    routeId: FOUNDER_INTAKE_ROUTE_ID,
    pageTitle: "Founder Intake",
    whatChanged: "Command Center now shows founder idea intake, next question, readiness, blockers, evidence, activity, and cost impact.",
    currentState: "Founder intake is collecting structured business answers locally.",
    nextAction: nextQuestion.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS OS Founder Intake Runtime",
    evidenceLocation: "reports/founder-intake-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, agent dispatch, project mutation, DB writes, deploy, or provider spend.",
    disabledReason: "Founder intake is local and governed. Provider calls, autonomous Q&A, PRD generation execution, agent dispatch, project creation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
    readinessCards: [
      { label: "Intake", value: "Local", tone: "pass", detail: "Session state is deterministic and stored as display-safe OS state." },
      { label: "Next question", value: "Ready", tone: "teal", detail: nextQuestion.prompt },
      { label: "Comprehension", value: `${Math.round(comprehension.comprehensionScore * 100)}%`, tone: "amber", detail: "More founder answers are needed before PRD readiness." },
      { label: "Cost", value: "No spend", tone: "pass", detail: "No provider or worker runtime is invoked by this view." },
    ],
    questionState: {
      questionId: nextQuestion.questionId,
      prompt: nextQuestion.prompt,
      missingFields: nextQuestion.missingFields,
      confidence: nextQuestion.confidence,
      nextAction: nextQuestion.nextAction,
    },
    answerRows: Object.entries(session.answers).map(([field, answer]) => ({
      field,
      answer,
      state: "Captured locally",
    })),
    readiness: {
      currentState: summary.currentState,
      answeredCount: summary.answeredCount,
      missingCount: summary.missingCount,
      blockers: comprehension.blockers,
      ready: comprehension.ready,
      score: comprehension.comprehensionScore,
    },
    founderDbWorkflow: {
      currentState: founderDbWorkflow.currentState,
      savedSessionState: founderDbWorkflow.savedSessionState,
      nextQuestion: founderDbWorkflow.nextQuestion,
      prdReadiness: founderDbWorkflow.prdReadiness,
      nextAction: founderDbWorkflow.nextAction,
      disabledReason: founderDbWorkflow.disabledReason,
      ownerCapability: founderDbWorkflow.ownerCapability,
      evidenceLocation: founderDbWorkflow.evidenceLocation,
      activityLocation: founderDbWorkflow.activityLocation,
      costImpact: founderDbWorkflow.costImpact,
      laneCount: founderDbWorkflow.lanes.length,
    },
    disabledActions: [
      { label: "Provider Calls", reason: "Provider calls require later approval, budget, activity, cost, and rollback evidence." },
      { label: "Autonomous Q&A", reason: "Questions are selected deterministically; autonomous provider execution is disabled." },
      { label: "PRD Generation", reason: "PRD generation execution starts only after founder comprehension is validated." },
      { label: "Agent Dispatch", reason: "Agents are not dispatched from founder intake in this phase." },
      { label: "Project Creation", reason: "Project mutation remains blocked until an explicit governed project phase." },
      { label: "DB / Deploy", reason: "DB writes and deploy execution are not available from founder intake." },
    ],
    safety: {
      executionEnabled: false,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export const founderIntakeViewModel = buildFounderIntakeViewModel();
