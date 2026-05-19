import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const FOUNDER_INTAKE_PHASE = "P80.1";

export const FOUNDER_INTAKE_REQUIRED_FIELDS = Object.freeze([
  "targetCustomer",
  "problem",
  "currentAlternatives",
  "proposedSolution",
  "businessModel",
  "goToMarket",
  "constraints",
  "successCriteria",
]);

export const FOUNDER_INTAKE_REQUIRED_EVIDENCE = Object.freeze([
  "operatorApproval",
  "scopeBoundary",
  "budgetLimit",
  "rollbackPlan",
  "activityLedger",
  "costLedger",
  "redactionCheck",
]);

export const FOUNDER_INTAKE_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "careloop/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "auth/**",
  "users/**",
  "rbac/**",
  ".env",
  ".env.*",
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authMutationAllowed",
  "sessionMutationAllowed",
  "userMutationAllowed",
  "workspaceMutationAllowed",
  "providerSpendAllowed",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function createQuestionSet() {
  return FOUNDER_INTAKE_REQUIRED_FIELDS.map((field) => ({
    field,
    status: "needed",
    prompt: `Clarify ${field} for the business idea.`,
  }));
}

export function createFounderIntakeSessionEnvelope(input = {}) {
  const redaction = summarizeRedaction({
    founderIdeaSummary: input.founderIdeaSummary || "Founder has a startup idea that needs feasibility, PRD, and agent work planning.",
    founderNotes: input.founderNotes || "",
    answers: input.answers || {},
  });
  const answers = input.answers && typeof input.answers === "object" ? input.answers : {};
  const answeredFields = FOUNDER_INTAKE_REQUIRED_FIELDS.filter((field) => Boolean(answers[field]));
  const missingFields = FOUNDER_INTAKE_REQUIRED_FIELDS.filter((field) => !answeredFields.includes(field));
  const runtimeFlags = Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
  const approvalState = Object.fromEntries(FOUNDER_INTAKE_REQUIRED_EVIDENCE.map((field) => [field, input.approval?.[field] === true]));

  const session = {
    schemaVersion: "1.0",
    safeSessionKey: input.safeSessionKey || "founder-intake-session",
    mode: "live",
    stage: "schema_ready",
    founderIdeaSummary: redaction.redacted.founderIdeaSummary,
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    commandCenterVisible: true,
  };
  const data = {
    session,
    questionSet: createQuestionSet(),
    answerState: {
      answeredFields,
      missingFields,
      answers: redaction.redacted.answers || {},
      readyForComprehension: missingFields.length === 0,
    },
    comprehensionScore: {
      score: missingFields.length === 0 ? 1 : answeredFields.length / FOUNDER_INTAKE_REQUIRED_FIELDS.length,
      threshold: 0.8,
      ready: missingFields.length === 0,
      reasons: missingFields.length === 0 ? ["All required intake fields are present."] : missingFields.map((field) => `${field} is missing.`),
    },
    approvalState,
    requiredEvidence: [...FOUNDER_INTAKE_REQUIRED_EVIDENCE],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p801-founder-intake-schema-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P80.1"])],
    costImpact: "No model calls, provider calls, worker runtime, project writes, DB writes, network calls, deploy, or provider spend in P80.1.",
    ownerCapability: "NEXUS.founderIntakeRuntime",
    nextAction: "Implement P80.2 local intake session state transitions.",
    disabledReason: "P80.1 defines founder intake schemas only. Provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
    blockers: [
      "P80.2 local session model is not implemented.",
      "P80.3 guided Q&A loop is not implemented.",
      "P80.4 Command Center founder intake UX is not implemented.",
      "Provider, tool, worker, project, DB, deploy, network, and spend gates remain blocked.",
    ],
    forbiddenFiles: [...FOUNDER_INTAKE_FORBIDDEN_FILES],
    ...runtimeFlags,
  };

  return createPassResult({
    phase: FOUNDER_INTAKE_PHASE,
    mode: "live",
    source: "founder-intake/founderIntakeSchema.js",
    summary: "Founder intake schema is available; runtime execution and mutation remain blocked.",
    data,
    evidence: data.evidenceRefs,
    warnings: ["Schema readiness is not execution. P80.1 does not ask questions, call providers, create projects, or spend budget."],
  });
}

export function validateFounderIntakeSession(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  for (const field of ["session", "questionSet", "answerState", "comprehensionScore", "approvalState", "evidenceRefs", "costImpact"]) {
    if (!(field in data)) errors.push(`missing ${field}`);
  }
  if (data.session?.mode !== "live") errors.push("session.mode must be live");
  if (!Array.isArray(data.questionSet) || data.questionSet.length !== FOUNDER_INTAKE_REQUIRED_FIELDS.length) errors.push("questionSet must cover required fields");
  if (!Array.isArray(data.answerState?.missingFields)) errors.push("answerState.missingFields must be an array");
  if (typeof data.comprehensionScore?.score !== "number") errors.push("comprehensionScore.score must be numeric");
  if (!Array.isArray(data.requiredEvidence) || data.requiredEvidence.length !== FOUNDER_INTAKE_REQUIRED_EVIDENCE.length) errors.push("requiredEvidence must be represented");
  for (const evidence of FOUNDER_INTAKE_REQUIRED_EVIDENCE) {
    if (typeof data.approvalState?.[evidence] !== "boolean") errors.push(`approvalState.${evidence} must be boolean`);
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (!Array.isArray(data.forbiddenFiles) || !data.forbiddenFiles.includes("projects/**") || !data.forbiddenFiles.includes("providers/**")) errors.push("forbiddenFiles must block projects and providers");
  if (!Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0) errors.push("evidenceRefs must be present");
  if (!Array.isArray(data.activityRefs) || data.activityRefs.length === 0) errors.push("activityRefs must be present");
  if (!data.disabledReason || /execute now|create project|deploy now|spend now/i.test(data.disabledReason)) errors.push("disabledReason must not imply runnable actions");
  return { valid: errors.length === 0, errors };
}
