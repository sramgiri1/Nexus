import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P78_2_REQUIRED_FIELDS = Object.freeze([
  "founderIntakePreviewId",
  "founderIdeaSummary",
  "qnaState",
  "feasibilityState",
  "redactionState",
  "autonomousQnaAllowed",
  "prdGenerationAllowed",
  "agentDispatchAllowed",
  "selfHealingApplyAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
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
  "questionRows",
  "missingAnswers",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "forbiddenFiles",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
  "commandCenterVisible",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
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

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createFounderIntakePreview(input = {}) {
  const redaction = summarizeRedaction({
    founderIdeaSummary: input.founderIdeaSummary || "startup idea preview without private founder identifiers",
    qnaState: input.qnaState || "questions drafted, not asked autonomously",
    sampleValue: input.sampleValue || "metadata_only_no_private_ids",
  });

  return {
    founderIntakePreviewId: input.founderIntakePreviewId || "founder-intake-preview",
    founderIdeaSummary: input.founderIdeaSummary || "Founder brings a startup idea for feasibility, PRD, and agent work planning.",
    qnaState: input.qnaState || "Clarifying questions are drafted but not asked autonomously.",
    feasibilityState: input.feasibilityState || "Feasibility remains a preview until founder answers are supplied.",
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    autonomousQnaAllowed: false,
    prdGenerationAllowed: false,
    agentDispatchAllowed: false,
    selfHealingApplyAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    authMutationAllowed: false,
    sessionMutationAllowed: false,
    userMutationAllowed: false,
    workspaceMutationAllowed: false,
    providerSpendAllowed: false,
    questionRows: [
      { label: "Customer", prompt: "Who has the painful problem?", state: "needs founder answer" },
      { label: "Problem", prompt: "What workflow breaks today?", state: "needs founder answer" },
      { label: "Business model", prompt: "How will the company charge?", state: "needs founder answer" },
      { label: "Constraints", prompt: "What budget, timeline, compliance, or integration limits exist?", state: "needs founder answer" },
    ],
    missingAnswers: ["target customer", "pain severity", "pricing hypothesis", "go-to-market motion"],
    blockedOperations: [
      "Autonomous founder Q&A",
      "Provider or model calls",
      "PRD generation execution",
      "Agent dispatch",
      "Project mutation and DB writes",
      "Tool, worker, network, deploy, release, export, and package execution",
      "Auth, session, user, workspace mutation, and provider spend",
    ],
    disabledReason: "P78.2 records founder intake and Q&A previews only; autonomous Q&A, provider calls, PRD generation, agent dispatch, project mutation, DB writes, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Autonomous founder Q&A remains disabled.",
      "Provider and model calls remain disabled.",
      "PRD generation execution remains disabled.",
      "Agent dispatch and self-healing apply remain disabled.",
      "Project mutation and DB writes remain disabled.",
      "Tool, worker, network, deploy, release, export, package, auth, session, user, workspace mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p782-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P78.2"])],
    costImpact: "No model calls, provider calls, DB writes, network calls, project writes, tool execution, worker execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.founderIntakePreview",
    nextAction: input.nextAction || "Route founder intake preview into P78.3 PRD assembly preview.",
    commandCenterVisible: true,
  };
}

export function validateFounderIntakePreview(preview = {}) {
  const errors = [];
  for (const field of P78_2_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  for (const flag of ["autonomousQnaAllowed", "prdGenerationAllowed", "agentDispatchAllowed", "selfHealingApplyAllowed", "projectMutationAllowed", "dbWritesAllowed", "providerDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "networkCallsAllowed", "deployExecutionAllowed", "releaseExecutionAllowed", "exportExecutionAllowed", "packageCreationAllowed", "authMutationAllowed", "sessionMutationAllowed", "userMutationAllowed", "workspaceMutationAllowed", "providerSpendAllowed"]) {
    if (preview[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (!Array.isArray(preview.questionRows) || preview.questionRows.length < 4) errors.push("questionRows must be visible");
  if (!Array.isArray(preview.missingAnswers) || preview.missingAnswers.length < 4) errors.push("missingAnswers must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(preview.forbiddenFiles) || !preview.forbiddenFiles.includes("projects/**") || !preview.forbiddenFiles.includes("providers/**")) errors.push("project and provider files must remain forbidden");
  if (!preview.disabledReason || /ask founder now|generate prd|dispatch agent|self-heal now|create project|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildFounderIntakePreviewEnvelope(input = {}) {
  const preview = createFounderIntakePreview(input);
  return createPassResult({
    phase: "P78.2",
    mode: "preview-only",
    source: "enterprise-preview/p78-2-placeholder.js",
    summary: "Founder intake and Q&A preview recorded without enabling autonomous Q&A, provider calls, PRD generation, agent dispatch, project mutation, DB writes, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P78_2_SAMPLE_PREVIEWS = Object.freeze([
  createFounderIntakePreview({
    evidenceRefs: ["reports/p782-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P78.2"],
  }),
]);
