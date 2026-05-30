import { createBusinessBuildPrdDraft, validateBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { scoreFounderComprehension } from "../founder-intake/founderIntakeComprehension.js";
import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "../founder-intake/founderIntakeSchema.js";
import { selectNextFounderQuestion } from "../founder-intake/founderIntakeQuestions.js";
import { createFounderIntakeSession, summarizeFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE = "P133.2";

export const P133_FOUNDATION_PRD_FIELDS = Object.freeze([
  "founderIdea",
  "problem",
  "targetCustomer",
  "solution",
  "businessModel",
  "goToMarket",
  "successCriteria",
  "risks",
]);

export const P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "executionAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "autonomous Q&A execution",
  "PRD generation execution",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "DB/runtime writes",
  "hosted DB mutation",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedSafetyFlags() {
  return Object.fromEntries(P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function normalizeAnswers(answers = {}) {
  return Object.fromEntries(
    Object.entries(answers || {})
      .filter(([field, value]) => FOUNDER_INTAKE_REQUIRED_FIELDS.includes(field) && value !== undefined && value !== null && String(value).trim())
      .map(([field, value]) => [field, String(value).trim()]),
  );
}

function defaultAnswers() {
  return {
    targetCustomer: "casual iPhone players",
    problem: "mobile players want a quick offline arcade game without account setup",
    currentAlternatives: "ad-heavy casual games and web clones",
    proposedSolution: "a polished iOS Snake game with touch controls, offline play, and score progression",
    businessModel: "free download with optional cosmetic upgrade after App Store validation",
    goToMarket: "App Store launch, short gameplay clips, and indie game community feedback",
    constraints: "solo founder, simple native iOS scope, no backend, privacy-safe offline gameplay",
    successCriteria: "ship an App Store-ready build and reach day-one retention above the founder baseline",
  };
}

function readinessState(missingCount, score) {
  if (missingCount === 0 && score >= 1) return "ready_for_safe_prd_preview";
  if (score >= 0.5) return "needs_targeted_founder_answers";
  return "needs_founder_discovery";
}

function buildFeasibilitySignals(prdFields = {}) {
  const checks = [
    ["problem", "Problem clarity"],
    ["targetCustomer", "Target customer"],
    ["solution", "Solution scope"],
    ["businessModel", "Business model"],
    ["goToMarket", "Go-to-market"],
    ["successCriteria", "Success criteria"],
    ["risks", "Constraints and risks"],
  ];

  return checks.map(([field, label]) => ({
    signalKey: field,
    label,
    state: prdFields[field] ? "ready_for_review" : "missing_founder_input",
    ownerCapability: "NEXUS Founder Idea-to-PRD Model",
    blocker: prdFields[field] ? "" : `${field} is required before feasibility review.`,
    evidenceRef: "reports/p1332-founder-idea-to-prd-model-report.md",
    providerCallsAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    providerSpendAllowed: false,
  }));
}

function buildPrdFieldRows(prdFields = {}) {
  return P133_FOUNDATION_PRD_FIELDS.map((field) => ({
    field,
    value: prdFields[field] || "",
    state: prdFields[field] ? "mapped_from_founder_answers" : "missing_founder_input",
    visibleInCommandCenter: true,
    rawPrivateIdsHidden: true,
  }));
}

export function buildFounderIdeaToPrdModel(input = {}) {
  const answers = normalizeAnswers(input.answers || defaultAnswers());
  const founderIdeaSummary = input.founderIdeaSummary || "Build a simple iOS Snake game for the App Store.";
  const intakeSession = createFounderIntakeSession({
    safeSessionKey: input.safeSessionKey,
    founderIdeaSummary,
    answers,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  const intakeSummary = summarizeFounderIntakeSession(intakeSession);
  const nextQuestion = selectNextFounderQuestion(intakeSession);
  const comprehension = scoreFounderComprehension(intakeSession);
  const prdDraft = createBusinessBuildPrdDraft({
    founderIdeaSummary,
    answers: intakeSession.answers,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  const prdValidation = validateBusinessBuildPrdDraft(prdDraft);
  const prdData = prdDraft.data || {};
  const prdFields = prdData.prdFields || {};
  const missingPrdFields = prdData.missingFields || [];
  const feasibilitySignals = buildFeasibilitySignals(prdFields);
  const readySignalCount = feasibilitySignals.filter((signal) => signal.state === "ready_for_review").length;
  const readinessScore = P133_FOUNDATION_PRD_FIELDS.length
    ? (P133_FOUNDATION_PRD_FIELDS.length - missingPrdFields.length) / P133_FOUNDATION_PRD_FIELDS.length
    : 0;
  const state = readinessState(missingPrdFields.length, readinessScore);
  const safetyFlags = blockedSafetyFlags();

  return createPassResult({
    phase: P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE,
    mode: "local-founder-idea-to-prd-model",
    source: "live-ready/founderIdeaToPrdModel.js",
    summary: "Founder idea-to-PRD model is assembled locally from intake, Q&A, comprehension, feasibility, and PRD readiness signals while execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: `founder_idea_to_prd_${state}`,
      modelMode: "deterministic-local-readiness",
      intake: {
        safeSessionKey: intakeSession.safeSessionKey,
        stage: intakeSession.stage,
        founderIdeaSummary: intakeSession.founderIdeaSummary,
        answeredFields: intakeSession.answeredFields,
        missingFields: intakeSession.missingFields,
        answeredCount: intakeSummary.answeredCount,
        missingCount: intakeSummary.missingCount,
        readiness: intakeSummary.readiness,
      },
      question: {
        questionId: nextQuestion.questionId,
        field: nextQuestion.field,
        prompt: nextQuestion.prompt,
        confidence: nextQuestion.confidence,
        nextAction: nextQuestion.nextAction,
        missingFields: nextQuestion.missingFields,
      },
      comprehension: {
        score: comprehension.comprehensionScore,
        ready: comprehension.ready,
        blockers: comprehension.blockers,
        nextAction: comprehension.nextAction,
      },
      prdReadiness: {
        sourceDraftId: prdData.draftId,
        readyForSafePreview: missingPrdFields.length === 0 && prdValidation.valid,
        score: readinessScore,
        answeredFields: prdData.answeredFields || [],
        missingFields: missingPrdFields,
        fieldRows: buildPrdFieldRows(prdFields),
      },
      feasibility: {
        state: readySignalCount === feasibilitySignals.length ? "ready_for_operator_review" : "needs_founder_inputs",
        readySignalCount,
        totalSignalCount: feasibilitySignals.length,
        signals: feasibilitySignals,
      },
      localState: {
        storesInMemoryOnly: true,
        writesFiles: false,
        writesDb: false,
        mutatesProjects: false,
        dispatchesAgents: false,
        callsProviders: false,
        usesNetwork: false,
        spendsBudget: false,
      },
      allowedLocalOperations: [
        "normalize founder answers",
        "select deterministic next question",
        "score founder comprehension",
        "map answers to PRD readiness",
        "summarize feasibility blockers",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      safetyFlags,
      nextAction: missingPrdFields.length === 0
        ? "Route to P133.3 safe PRD preview."
        : `Collect ${missingPrdFields[0]} before safe PRD preview.`,
      blockers: [
        ...missingPrdFields.map((field) => `${field} is required before safe PRD preview.`),
        "Provider/model PRD generation remains blocked.",
        "Agent dispatch remains blocked.",
        "Project mutation remains blocked.",
      ],
      disabledReason:
        "P133.2 defines a deterministic local intake and PRD readiness model only. Autonomous Q&A execution, provider/model calls, PRD generation execution, agent dispatch, project creation, project mutation, DB/runtime writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Idea-to-PRD Model",
      evidenceRefs: [
        "reports/p1332-founder-idea-to-prd-model-report.md",
        "reports/p1331-founder-idea-to-prd-productization-report.md",
        "reports/p803-founder-intake-qna-report.md",
        "reports/p812-prd-schema-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic modeling only. No provider/model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...safetyFlags,
    },
    evidence: [
      "reports/p1332-founder-idea-to-prd-model-report.md",
      "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json",
    ],
    warnings: [
      "P133.2 is a local model only. It does not execute Q&A, generate PRDs with providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, export, package, or spend.",
    ],
  });
}

export function validateFounderIdeaToPrdModel(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE) errors.push("phase must be P133.2");
  for (const field of [
    "schemaVersion",
    "currentState",
    "modelMode",
    "intake",
    "question",
    "comprehension",
    "prdReadiness",
    "feasibility",
    "localState",
    "allowedLocalOperations",
    "forbiddenOperations",
    "safetyFlags",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
    "commandCenterVisible",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.modelMode !== "deterministic-local-readiness") errors.push("modelMode must stay deterministic-local-readiness");
  if (!Array.isArray(data.intake?.answeredFields)) errors.push("intake.answeredFields must be an array");
  if (!Array.isArray(data.intake?.missingFields)) errors.push("intake.missingFields must be an array");
  if (!data.question?.questionId || typeof data.question.prompt !== "string") errors.push("question shape is incomplete");
  if (typeof data.comprehension?.score !== "number") errors.push("comprehension.score must be numeric");
  if (!Array.isArray(data.prdReadiness?.fieldRows) || data.prdReadiness.fieldRows.length !== P133_FOUNDATION_PRD_FIELDS.length) errors.push("prdReadiness.fieldRows must cover required PRD fields");
  if (!Array.isArray(data.feasibility?.signals) || data.feasibility.signals.length < 7) errors.push("feasibility.signals must cover core feasibility signals");
  for (const field of ["writesFiles", "writesDb", "mutatesProjects", "dispatchesAgents", "callsProviders", "usesNetwork", "spendsBudget"]) {
    if (data.localState?.[field] !== false) errors.push(`localState.${field} must be false`);
  }
  if (data.localState?.storesInMemoryOnly !== true) errors.push("localState.storesInMemoryOnly must be true");
  for (const flag of P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized)) errors.push("model must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
