import { buildAgentWorkOrderRuntimeModel } from "./agentWorkOrderRuntimeModel.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const PROJECT_WORKSPACE_MUTATION_PHASE = "P138.2";
export const PROJECT_WORKSPACE_MUTATION_VERSION = "1.0";

export const PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES = Object.freeze([
  "projectMutationAllowed",
  "patchApplicationAllowed",
  "buildExecutionAllowed",
  "testExecutionAllowed",
  "rollbackExecutionAllowed",
  "dbRuntimeWritesAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "mcpServerStartupAllowed",
  "agentDispatchAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "rawProjectIdsVisible",
  "rawPatchVisible",
  "rawDiffVisible",
  "rawLogsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Project Workspace Mutation Guard";
const DISABLED_REASON = "P138.2 defines a read-only workspace mutation model. Project mutation, patch application, build/test execution, rollback execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, deploy, release, export, package, network calls, and spend remain blocked.";
const DEFAULT_INTENT = "Founder wants NEXUS to plan the project changes needed to turn a validated idea and PRD into a governed application workspace.";

function blockedSafetyFlags() {
  return Object.fromEntries(PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeIntent(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed || DEFAULT_INTENT;
}

function buildSelectedProjectProfile(intent, workOrderModel = {}) {
  const snakeGame = /snake|ios|iphone|app store|game/i.test(intent);
  return {
    profileLabel: snakeGame ? "Selected iOS game workspace concept" : "Selected founder application workspace concept",
    scopeLabel: "Future admitted project workspace",
    source: "display-safe founder intent and P137 scoped work-order model",
    sourceWorkOrderPhase: workOrderModel.phase || "P137.2",
    privateRawIdVisible: false,
    projectMutationAllowed: false,
    buildExecutionAllowed: false,
    testExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    deployAllowed: false,
    packageCreationAllowed: false,
    nextAction: "Resolve an approved project boundary before any later patch/build preview.",
  };
}

function buildProjectBoundary(intent) {
  return {
    boundaryLabel: /snake|ios|iphone|app store|game/i.test(intent)
      ? "Future approved iOS app workspace boundary"
      : "Future approved application workspace boundary",
    selectedProjectProfileRequired: true,
    approvedBoundaryRequired: true,
    approvedBoundaryPresent: false,
    allowedPathGlobs: [
      "approved project root source files",
      "approved project root test files",
      "approved project root documentation files",
    ],
    forbiddenPathGlobs: [
      "NEXUS OS runtime internals",
      "private project roots outside the selected boundary",
      "generated workspaces outside the selected boundary",
      "local runtime state",
      "provider, tool, worker, deploy, release, export, package, and env paths",
    ],
    rawPathValuesVisible: false,
    boundaryBypassAllowed: false,
  };
}

function inferChangeIntent(intent, workOrderModel = {}) {
  const workOrderLabels = (workOrderModel.workOrderPackets || []).slice(0, 5).map((packet) => packet.packetLabel);
  return {
    summary: intent,
    sourceWorkOrderLabels: workOrderLabels,
    requestedOutcome: /snake|ios|iphone|app store|game/i.test(intent)
      ? "Plan the app workspace changes needed for a small iOS Snake game MVP."
      : "Plan the workspace changes needed for the founder application MVP.",
    currentState: "model_ready_mutation_blocked",
    nextAction: "Route this read-only model to P138.3 patch/build preview without applying changes.",
  };
}

function buildPatchPlan(intent) {
  const snakeGame = /snake|ios|iphone|app store|game/i.test(intent);
  return {
    planOnly: true,
    patchApplicationAllowed: false,
    rawPatchVisible: false,
    rawDiffVisible: false,
    candidateChangeCount: 4,
    appliedPatchCount: 0,
    candidateChanges: [
      {
        label: snakeGame ? "Game loop implementation" : "Core application implementation",
        targetScope: "approved project source files only",
        summary: snakeGame
          ? "Add game state, movement, scoring, collision, pause, and restart behavior after approval."
          : "Add application state, core workflow, persistence boundary, and user flow behavior after approval.",
        applyNowAllowed: false,
        rawDiffVisible: false,
      },
      {
        label: "UI shell update",
        targetScope: "approved project UI files only",
        summary: "Update the app surface after approval with scoped, reviewable UI changes.",
        applyNowAllowed: false,
        rawDiffVisible: false,
      },
      {
        label: "Validation harness",
        targetScope: "approved project test files only",
        summary: "Add or update tests after approval to cover the intended workflow.",
        applyNowAllowed: false,
        rawDiffVisible: false,
      },
      {
        label: "Operator notes",
        targetScope: "approved project documentation files only",
        summary: "Add implementation and validation notes after approval.",
        applyNowAllowed: false,
        rawDiffVisible: false,
      },
    ],
  };
}

function buildBuildPlan() {
  return {
    planOnly: true,
    buildExecutionAllowed: false,
    executableCommand: null,
    rawLogsVisible: false,
    commandCandidates: [
      {
        label: "Project build",
        commandSummary: "Use the selected project profile build command after boundary approval.",
        executableNow: false,
        disabledReason: "Project build execution is not enabled by P138.2.",
      },
    ],
    expectedEvidence: ["build command summary", "build result summary", "build log redaction summary"],
  };
}

function buildTestPlan() {
  return {
    planOnly: true,
    testExecutionAllowed: false,
    executableCommand: null,
    rawLogsVisible: false,
    commandCandidates: [
      {
        label: "Project tests",
        commandSummary: "Use the selected project profile test command after boundary approval.",
        executableNow: false,
        disabledReason: "Project test execution is not enabled by P138.2.",
      },
    ],
    expectedEvidence: ["test command summary", "test result summary", "test log redaction summary"],
  };
}

function buildRollbackPlan() {
  return {
    planOnly: true,
    rollbackExecutionAllowed: false,
    rollbackRequiredBeforeMutation: true,
    rollbackSteps: [
      "Record approved boundary and baseline evidence.",
      "Capture display-safe patch summary before any future apply step.",
      "Prepare reverse-patch or restore plan before any future apply step.",
      "Verify validation commands after any future rollback.",
    ],
    rawPatchVisible: false,
    executableNow: false,
    disabledReason: "Rollback execution is not enabled by P138.2.",
  };
}

function buildApprovalGate() {
  return {
    required: true,
    approvalCaptured: false,
    approved: false,
    approverRole: "operator",
    gateState: "required_not_granted",
    bypassAllowed: false,
    nextAction: "Capture explicit boundary and mutation approval in a later admitted subphase before any project write.",
  };
}

function buildCandidateCounts(patchPlan = {}) {
  return {
    patchCandidates: patchPlan.candidateChangeCount || 0,
    appliedPatchCandidates: 0,
    buildExecutionCandidates: 0,
    testExecutionCandidates: 0,
    rollbackExecutionCandidates: 0,
    dbRuntimeWriteCandidates: 0,
    providerCallCandidates: 0,
    modelCallCandidates: 0,
    toolExecutionCandidates: 0,
    mcpStartupCandidates: 0,
    agentDispatchCandidates: 0,
    projectMutationCandidates: 0,
    deployCandidates: 0,
    releaseCandidates: 0,
    exportCandidates: 0,
    packageCandidates: 0,
    networkCallCandidates: 0,
    providerSpendCandidates: 0,
  };
}

export function buildProjectWorkspaceMutationModel(input = {}) {
  const intent = normalizeIntent(input.changeIntent || input.founderIdeaSummary);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const workOrderModel = input.workOrderModel || buildAgentWorkOrderRuntimeModel({ founderIdeaSummary: intent });
  const selectedProjectProfile = buildSelectedProjectProfile(intent, workOrderModel);
  const projectBoundary = buildProjectBoundary(intent);
  const changeIntent = inferChangeIntent(intent, workOrderModel);
  const patchPlan = buildPatchPlan(intent);
  const buildPlan = buildBuildPlan();
  const testPlan = buildTestPlan();
  const rollbackPlan = buildRollbackPlan();
  const approvalGate = buildApprovalGate();
  const safetyFlags = blockedSafetyFlags();
  const payload = {
    selectedProjectProfile,
    projectBoundary,
    changeIntent,
    patchPlan,
    buildPlan,
    testPlan,
    rollbackPlan,
    approvalGate,
  };
  const redactionSummary = summarizeRedaction(payload);

  return {
    phase: PROJECT_WORKSPACE_MUTATION_PHASE,
    version: PROJECT_WORKSPACE_MUTATION_VERSION,
    mode: "project-workspace-mutation-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    currentState: "workspace_mutation_model_ready_execution_blocked",
    sourceWorkOrderPhase: workOrderModel.phase || "P137.2",
    sourceWorkOrderVersion: workOrderModel.version || "",
    modeGuard,
    selectedProjectProfile,
    projectBoundary,
    allowedPathGlobs: [...projectBoundary.allowedPathGlobs],
    forbiddenPathGlobs: [...projectBoundary.forbiddenPathGlobs],
    changeIntent,
    patchPlan,
    buildPlan,
    testPlan,
    rollbackPlan,
    approvalGate,
    candidateCounts: buildCandidateCounts(patchPlan),
    evidenceRefs: [
      "reports/p1382-project-workspace-mutation-build-pipeline-report.md",
      "reports/p1381-project-workspace-mutation-build-pipeline-report.md",
      ...(workOrderModel.evidenceRefs || []).slice(0, 4),
    ],
    auditRefs: ["reports/p1382-project-workspace-mutation-build-pipeline-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    ownerAgentCapability: OWNER_CAPABILITY,
    nextAction: "Route this read-only model to P138.3 patch/build preview without applying patches or running commands.",
    blockers: [
      "Approved selected project boundary is required.",
      "Patch application remains blocked.",
      "Project build and test execution remain blocked.",
      "Rollback execution remains blocked.",
      "DB/runtime writes, provider/model calls, tool execution, MCP startup, and agent dispatch remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    costImpact: "Zero-spend read-only workspace mutation model. No project command, provider call, model call, tool execution, network call, deploy, package creation, or provider spend.",
    redaction: {
      changed: redactionSummary.changed,
      redactionCount: redactionSummary.redactionCount,
    },
    safetyFlags,
    ...safetyFlags,
  };
}

export function validateProjectWorkspaceMutationModel(model = {}) {
  const errors = [];
  if (model.phase !== PROJECT_WORKSPACE_MUTATION_PHASE) errors.push("phase must be P138.2");
  if (model.version !== PROJECT_WORKSPACE_MUTATION_VERSION) errors.push("version must be 1.0");
  if (model.mode !== "project-workspace-mutation-model") errors.push("mode must be project-workspace-mutation-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain read-only local metadata");
  if (model.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  for (const field of [
    "selectedProjectProfile",
    "projectBoundary",
    "allowedPathGlobs",
    "forbiddenPathGlobs",
    "changeIntent",
    "patchPlan",
    "buildPlan",
    "testPlan",
    "rollbackPlan",
    "approvalGate",
    "candidateCounts",
  ]) {
    if (!(field in model)) errors.push(`${field} missing`);
  }
  if (model.selectedProjectProfile?.privateRawIdVisible !== false || model.selectedProjectProfile?.projectMutationAllowed !== false) errors.push("selectedProjectProfile must hide raw IDs and block mutation");
  if (model.projectBoundary?.approvedBoundaryPresent !== false || model.projectBoundary?.boundaryBypassAllowed !== false || model.projectBoundary?.rawPathValuesVisible !== false) errors.push("projectBoundary must require approval and hide raw paths");
  if (!Array.isArray(model.allowedPathGlobs) || model.allowedPathGlobs.length < 3) errors.push("allowedPathGlobs must include scoped summaries");
  if (!Array.isArray(model.forbiddenPathGlobs) || model.forbiddenPathGlobs.length < 5) errors.push("forbiddenPathGlobs must include blocked summaries");
  if (model.patchPlan?.planOnly !== true || model.patchPlan?.patchApplicationAllowed !== false || model.patchPlan?.rawPatchVisible !== false || model.patchPlan?.rawDiffVisible !== false || model.patchPlan?.appliedPatchCount !== 0) errors.push("patchPlan must be preview-only and unapplied");
  if (!Array.isArray(model.patchPlan?.candidateChanges) || model.patchPlan.candidateChanges.length < 4) errors.push("patchPlan must include useful candidate summaries");
  if (!model.patchPlan?.candidateChanges?.every((entry) => entry.applyNowAllowed === false && entry.rawDiffVisible === false && entry.label && entry.summary)) errors.push("candidate changes must be display-safe and non-runnable");
  if (model.buildPlan?.buildExecutionAllowed !== false || model.buildPlan?.executableCommand !== null || model.buildPlan?.rawLogsVisible !== false) errors.push("buildPlan must not execute");
  if (model.testPlan?.testExecutionAllowed !== false || model.testPlan?.executableCommand !== null || model.testPlan?.rawLogsVisible !== false) errors.push("testPlan must not execute");
  if (model.rollbackPlan?.rollbackExecutionAllowed !== false || model.rollbackPlan?.executableNow !== false || model.rollbackPlan?.rawPatchVisible !== false) errors.push("rollbackPlan must not execute");
  if (model.approvalGate?.required !== true || model.approvalGate?.approved !== false || model.approvalGate?.approvalCaptured !== false || model.approvalGate?.bypassAllowed !== false) errors.push("approvalGate must require approval without granting it");
  if (model.candidateCounts?.patchCandidates < 1 || model.candidateCounts?.appliedPatchCandidates !== 0 || model.candidateCounts?.projectMutationCandidates !== 0 || model.candidateCounts?.buildExecutionCandidates !== 0 || model.candidateCounts?.testExecutionCandidates !== 0 || model.candidateCounts?.providerSpendCandidates !== 0) errors.push("candidate counts must keep execution blocked");
  for (const flag of PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must be false`);
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!Array.isArray(model.evidenceRefs) || !Array.isArray(model.auditRefs) || !Array.isArray(model.activityRefs)) errors.push("evidenceRefs, auditRefs, and activityRefs must be arrays");
  if (!model.ownerAgentCapability || !model.nextAction || !model.disabledReason || !model.costImpact) errors.push("operator-facing summary fields are required");
  if (typeof model.redaction?.changed !== "boolean" || typeof model.redaction?.redactionCount !== "number") errors.push("redaction summary is required");

  const serialized = JSON.stringify(model);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(serialized)) errors.push("model must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw registry dump|raw patch dump|raw diff dump/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildProjectWorkspaceMutationEnvelope(input = {}) {
  const model = input.model || buildProjectWorkspaceMutationModel(input);
  const validation = validateProjectWorkspaceMutationModel(model);
  const result = createPassResult({
    phase: PROJECT_WORKSPACE_MUTATION_PHASE,
    mode: "project-workspace-mutation-model",
    source: "shared/projectWorkspaceMutationModel.js",
    summary: validation.valid
      ? "P138.2 read-only workspace mutation model is valid; mutation and build execution remain blocked."
      : "P138.2 read-only workspace mutation model is invalid.",
    data: model,
    errors: validation.errors,
    evidence: model.evidenceRefs || [],
  });
  const envelopeValidation = validateResultEnvelope(result);
  if (!validation.valid || !envelopeValidation.valid) {
    return {
      ...result,
      ok: false,
      status: "FAIL",
      errors: [...validation.errors, ...envelopeValidation.errors],
    };
  }
  return result;
}
