import { createPassResult } from "../shared/resultEnvelope.js";
import { P78_3_SAMPLE_PREVIEWS, validatePrdAssemblyPreview } from "./p78-3-placeholder.js";

export const P78_4_REQUIRED_FIELDS = Object.freeze([
  "agentWorkplanPreviewId",
  "sourcePrdAssemblyPreviewId",
  "founderIdeaSummary",
  "agentWorkplanState",
  "selfHealingState",
  "ownerCapabilities",
  "taskLanes",
  "validationGates",
  "healingLoops",
  "blockedOperations",
  "founderIntakeExecutionAllowed",
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

export function createAgentWorkplanPreview(input = {}) {
  const sourcePrd = input.sourcePrd || P78_3_SAMPLE_PREVIEWS[0];
  const prdValidation = validatePrdAssemblyPreview(sourcePrd);
  const sourcePrdAssemblyPreviewId = prdValidation.valid
    ? sourcePrd.prdAssemblyPreviewId
    : "prd-assembly-preview-unavailable";

  return {
    agentWorkplanPreviewId: input.agentWorkplanPreviewId || "agent-workplan-preview",
    sourcePrdAssemblyPreviewId,
    founderIdeaSummary:
      input.founderIdeaSummary ||
      sourcePrd.founderIdeaSummary ||
      "Founder brings a startup idea for feasibility, PRD, and agent work planning.",
    agentWorkplanState: input.agentWorkplanState || "Agent work lanes are drafted as preview data only.",
    selfHealingState: input.selfHealingState || "Self-healing loops are visible but cannot apply changes.",
    ownerCapabilities: [
      { capability: "NEXUS.strategy", responsibility: "Founder Q&A and feasibility framing", executionState: "disabled" },
      { capability: "NEXUS.product", responsibility: "PRD section review", executionState: "disabled" },
      { capability: "NEXUS.architecture", responsibility: "System shape and dependency review", executionState: "disabled" },
      { capability: "NEXUS.validation", responsibility: "Gate and checker planning", executionState: "disabled" },
      ...normalizeList(input.ownerCapabilities),
    ],
    taskLanes: [
      { lane: "Founder discovery", currentState: "waiting on founder answers", dispatchState: "not dispatched" },
      { lane: "PRD hardening", currentState: "preview sections available", dispatchState: "not dispatched" },
      { lane: "Build planning", currentState: "blocked until PRD approval", dispatchState: "not dispatched" },
      { lane: "Validation planning", currentState: "checker gates drafted", dispatchState: "not dispatched" },
    ],
    validationGates: [
      { gate: "Founder answers complete", requiredState: "complete", currentState: "blocked" },
      { gate: "PRD approved", requiredState: "approved", currentState: "blocked" },
      { gate: "Runtime permission granted", requiredState: "explicitly allowed", currentState: "disabled" },
      { gate: "Project mutation permission granted", requiredState: "explicitly allowed", currentState: "disabled" },
    ],
    healingLoops: [
      { loop: "Plan quality review", trigger: "checker failure", applyState: "disabled" },
      { loop: "UX safety review", trigger: "route safety failure", applyState: "disabled" },
      { loop: "Evidence refresh", trigger: "stale status", applyState: "disabled" },
    ],
    blockedOperations: [
      "Founder intake execution and autonomous Q&A",
      "PRD generation execution",
      "Agent dispatch",
      "Self-healing apply",
      "Project mutation and DB writes",
      "Provider, tool, worker, network, deploy, release, export, and package execution",
      "Auth, session, user, workspace mutation, certification, attestation, and provider spend",
    ],
    founderIntakeExecutionAllowed: false,
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
    disabledReason:
      "P78.4 records agent workplan and self-healing previews only; founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, project mutation, DB writes, provider/tool/worker execution, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, certification, attestation, and provider spend remain disabled.",
    blockers: [
      "Founder answers and PRD approval are required before any future dispatch.",
      "Agent dispatch remains disabled.",
      "Self-healing apply remains disabled.",
      "Project mutation and DB writes remain disabled.",
      "Provider calls, tool execution, worker execution, network calls, and provider spend remain disabled.",
      "Deploy, release, export, package, auth, session, user, workspace mutation, certification, and attestation remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p784-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P78.4"])],
    costImpact:
      "No model calls, provider calls, agent jobs, tool execution, worker execution, self-healing apply jobs, network calls, DB writes, project writes, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.agentWorkplanPreview",
    nextAction: input.nextAction || "Route agent workplan preview into P78.5 Command Center Enterprise Preview UX.",
    commandCenterVisible: true,
  };
}

export function validateAgentWorkplanPreview(preview = {}) {
  const errors = [];
  for (const field of P78_4_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  for (const flag of [
    "founderIntakeExecutionAllowed",
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
  ]) {
    if (preview[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (!Array.isArray(preview.ownerCapabilities) || preview.ownerCapabilities.length < 4) errors.push("ownerCapabilities must be visible");
  if (!Array.isArray(preview.taskLanes) || preview.taskLanes.length < 4) errors.push("taskLanes must be visible");
  if (!Array.isArray(preview.validationGates) || preview.validationGates.length < 4) errors.push("validationGates must be visible");
  if (!Array.isArray(preview.healingLoops) || preview.healingLoops.length < 3) errors.push("healingLoops must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (
    !Array.isArray(preview.forbiddenFiles) ||
    !preview.forbiddenFiles.includes("projects/**") ||
    !preview.forbiddenFiles.includes("tools/**") ||
    !preview.forbiddenFiles.includes("worker-runtime/**")
  ) {
    errors.push("project, tool, and worker files must remain forbidden");
  }
  if (
    !preview.disabledReason ||
    /dispatch agent|run agent|apply healing|self-heal now|execute tool|start worker|create project|execute now/i.test(preview.disabledReason)
  ) {
    errors.push("disabledReason must not imply runnable behavior");
  }
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildAgentWorkplanPreviewEnvelope(input = {}) {
  const preview = createAgentWorkplanPreview(input);
  return createPassResult({
    phase: "P78.4",
    mode: "preview-only",
    source: "enterprise-preview/p78-4-placeholder.js",
    summary:
      "Agent workplan and self-healing preview recorded without enabling agent dispatch, self-healing apply, runtime execution, project mutation, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P78_4_SAMPLE_PREVIEWS = Object.freeze([
  createAgentWorkplanPreview({
    sourcePrd: P78_3_SAMPLE_PREVIEWS[0],
    evidenceRefs: ["reports/p784-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P78.4"],
  }),
]);
