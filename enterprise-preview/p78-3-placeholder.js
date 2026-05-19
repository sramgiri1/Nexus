import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";
import { P78_2_SAMPLE_PREVIEWS, validateFounderIntakePreview } from "./p78-2-placeholder.js";

export const P78_3_REQUIRED_FIELDS = Object.freeze([
  "prdAssemblyPreviewId",
  "sourceFounderIntakePreviewId",
  "founderIdeaSummary",
  "prdPreviewState",
  "problemStatement",
  "targetAudience",
  "valueProposition",
  "mvpScope",
  "acceptanceCriteria",
  "riskRows",
  "missingInputs",
  "redactionState",
  "founderIntakeExecutionAllowed",
  "autonomousQnaAllowed",
  "prdGenerationAllowed",
  "projectFileWriteAllowed",
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

export function createPrdAssemblyPreview(input = {}) {
  const sourceIntake = input.sourceIntake || P78_2_SAMPLE_PREVIEWS[0];
  const intakeValidation = validateFounderIntakePreview(sourceIntake);
  const sourceFounderIntakePreviewId = intakeValidation.valid
    ? sourceIntake.founderIntakePreviewId
    : "founder-intake-preview-unavailable";
  const founderIdeaSummary =
    input.founderIdeaSummary ||
    sourceIntake.founderIdeaSummary ||
    "Founder brings a startup idea for feasibility, PRD, and agent work planning.";
  const redaction = summarizeRedaction({
    founderIdeaSummary,
    sourceFounderIntakePreviewId,
    prdPreviewState: input.prdPreviewState || "prd sections assembled as preview only",
  });

  return {
    prdAssemblyPreviewId: input.prdAssemblyPreviewId || "prd-assembly-preview",
    sourceFounderIntakePreviewId,
    founderIdeaSummary,
    prdPreviewState: input.prdPreviewState || "PRD sections are drafted as preview data only.",
    problemStatement:
      input.problemStatement ||
      "Preview the founder problem hypothesis after required clarifying answers are supplied.",
    targetAudience:
      input.targetAudience ||
      "Target audience remains provisional until founder customer and pain details are complete.",
    valueProposition:
      input.valueProposition ||
      "Value proposition remains a preview and cannot be promoted into a project artifact yet.",
    mvpScope: [
      "Founder intake summary",
      "Clarifying Q&A gaps",
      "Feasibility questions",
      "PRD section preview",
      ...normalizeList(input.mvpScope),
    ],
    acceptanceCriteria: [
      "Problem, audience, value proposition, MVP scope, risks, and missing inputs are visible.",
      "PRD generation and project file writes remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, package, and spend execution remain disabled.",
      ...normalizeList(input.acceptanceCriteria),
    ],
    riskRows: [
      { label: "Founder clarity", state: "blocked until missing answers are supplied" },
      { label: "Market feasibility", state: "preview only, no provider research executed" },
      { label: "Build feasibility", state: "preview only, no agent dispatch executed" },
      { label: "Compliance", state: "preview only, no legal attestation or certification" },
    ],
    missingInputs: [
      "validated target customer",
      "pain severity evidence",
      "pricing hypothesis",
      "delivery and compliance constraints",
    ],
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    founderIntakeExecutionAllowed: false,
    autonomousQnaAllowed: false,
    prdGenerationAllowed: false,
    projectFileWriteAllowed: false,
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
    blockedOperations: [
      "Founder intake execution and autonomous Q&A",
      "PRD generation execution and project file writes",
      "Agent dispatch and self-healing apply",
      "Project mutation and DB writes",
      "Provider, tool, and worker execution",
      "Network, deploy, release, export, and package execution",
      "Auth, session, user, workspace mutation, certification, attestation, and provider spend",
    ],
    disabledReason:
      "P78.3 records PRD assembly previews only; PRD generation, project file writes, agent dispatch, self-healing apply, project mutation, DB writes, provider/tool/worker execution, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, certification, attestation, and provider spend remain disabled.",
    blockers: [
      "Founder answers are still required before a PRD can be generated.",
      "PRD generation execution remains disabled.",
      "Project file writes and project mutation remain disabled.",
      "Agent dispatch and self-healing apply remain disabled.",
      "DB writes, provider calls, tool execution, worker execution, network calls, and provider spend remain disabled.",
      "Deploy, release, export, package, auth, session, user, workspace mutation, certification, and attestation remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p783-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P78.3"])],
    costImpact:
      "No model calls, provider calls, PRD generation jobs, project writes, DB writes, network calls, tool execution, worker execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.prdAssemblyPreview",
    nextAction: input.nextAction || "Route PRD assembly preview into P78.4 agent workplan and self-healing preview.",
    commandCenterVisible: true,
  };
}

export function validatePrdAssemblyPreview(preview = {}) {
  const errors = [];
  for (const field of P78_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  for (const flag of [
    "founderIntakeExecutionAllowed",
    "autonomousQnaAllowed",
    "prdGenerationAllowed",
    "projectFileWriteAllowed",
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
  ]) {
    if (preview[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (!Array.isArray(preview.mvpScope) || preview.mvpScope.length < 4) errors.push("mvpScope must be visible");
  if (!Array.isArray(preview.acceptanceCriteria) || preview.acceptanceCriteria.length < 3) errors.push("acceptanceCriteria must be visible");
  if (!Array.isArray(preview.riskRows) || preview.riskRows.length < 4) errors.push("riskRows must be visible");
  if (!Array.isArray(preview.missingInputs) || preview.missingInputs.length < 4) errors.push("missingInputs must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (
    !Array.isArray(preview.forbiddenFiles) ||
    !preview.forbiddenFiles.includes("projects/**") ||
    !preview.forbiddenFiles.includes("project-roadmap/**") ||
    !preview.forbiddenFiles.includes("providers/**")
  ) {
    errors.push("project, project-roadmap, and provider files must remain forbidden");
  }
  if (
    !preview.disabledReason ||
    /generate prd|write project|create project|dispatch agent|self-heal now|execute now/i.test(preview.disabledReason)
  ) {
    errors.push("disabledReason must not imply runnable behavior");
  }
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildPrdAssemblyPreviewEnvelope(input = {}) {
  const preview = createPrdAssemblyPreview(input);
  return createPassResult({
    phase: "P78.3",
    mode: "preview-only",
    source: "enterprise-preview/p78-3-placeholder.js",
    summary:
      "PRD assembly preview recorded without enabling PRD generation, project writes, agent dispatch, runtime execution, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P78_3_SAMPLE_PREVIEWS = Object.freeze([
  createPrdAssemblyPreview({
    sourceIntake: P78_2_SAMPLE_PREVIEWS[0],
    evidenceRefs: ["reports/p783-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P78.3"],
  }),
]);
