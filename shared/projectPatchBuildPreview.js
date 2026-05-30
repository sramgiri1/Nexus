import {
  PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES,
  buildProjectWorkspaceMutationModel,
  validateProjectWorkspaceMutationModel,
} from "./projectWorkspaceMutationModel.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const PROJECT_PATCH_BUILD_PREVIEW_PHASE = "P138.3";
export const PROJECT_PATCH_BUILD_PREVIEW_VERSION = "1.0";
export const PROJECT_PATCH_BUILD_PREVIEW_SAFETY_FLAG_NAMES = PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES;

const OWNER_CAPABILITY = "NEXUS Project Patch and Build Preview Guard";
const DISABLED_REASON = "P138.3 produces a non-runnable patch/build preview. Project mutation, patch application, build/test execution, rollback execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(PROJECT_PATCH_BUILD_PREVIEW_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function buildTouchedPathClassifications(model = {}) {
  return (model.patchPlan?.candidateChanges || []).map((change, index) => ({
    rowId: `preview-row-${index + 1}`,
    label: change.label,
    targetScope: change.targetScope,
    allowedBoundary: "approved project boundary only",
    forbiddenBoundary: "NEXUS OS, private roots outside the approved boundary, runtime state, provider/tool/worker/deploy/release/export/package/env paths",
    rawPathVisible: false,
    classification: "display_safe_scope_summary",
  }));
}

function buildPreviewRows(model = {}) {
  return (model.patchPlan?.candidateChanges || []).map((change, index) => ({
    rowId: `preview-row-${index + 1}`,
    label: change.label,
    changeSummary: change.summary,
    targetScope: change.targetScope,
    validationSummary: index === 2
      ? "Would require project test coverage after explicit project boundary approval."
      : "Would require selected project build and test summaries after explicit project boundary approval.",
    rollbackSummary: "Would require baseline evidence and restore plan before any future write.",
    currentState: "blocked_preview",
    nextAction: "Keep as preview until an approved project boundary and mutation approval exist.",
    disabledReason: DISABLED_REASON,
    wouldApplyPatch: false,
    wouldMutateProject: false,
    wouldRunBuild: false,
    wouldRunTests: false,
    wouldRollback: false,
    wouldSpend: false,
    rawDiffVisible: false,
    rawPatchVisible: false,
    rawLogsVisible: false,
  }));
}

function buildRedactedPatchSummary(model = {}) {
  return {
    previewOnly: true,
    candidateChangeCount: model.patchPlan?.candidateChanges?.length || 0,
    appliedPatchCount: 0,
    rawPatchVisible: false,
    rawDiffVisible: false,
    summary: "Display-safe change summaries only. Patch content and diff content are withheld until a later explicitly approved apply subphase.",
  };
}

function createCommandSummary(candidate = {}, kind) {
  return {
    label: candidate.label || `${kind} command`,
    commandSummary: candidate.commandSummary || `Use the selected project ${kind.toLowerCase()} command after approval.`,
    executableCommand: null,
    commandVisible: false,
    executionAllowed: false,
    executableNow: false,
    rawLogsVisible: false,
    disabledReason: `Project ${kind.toLowerCase()} execution is not enabled by P138.3.`,
  };
}

function buildRollbackSummary(model = {}) {
  return {
    previewOnly: true,
    rollbackExecutionAllowed: false,
    executableNow: false,
    rawPatchVisible: false,
    restorePlanVisible: "display-safe summary only",
    rollbackSteps: [...(model.rollbackPlan?.rollbackSteps || [])],
    disabledReason: "Rollback execution is not enabled by P138.3.",
  };
}

function buildCandidateCounts(previewRows = []) {
  return {
    patchPreviewRows: previewRows.length,
    patchApplicationCandidates: 0,
    appliedPatchCandidates: 0,
    projectMutationCandidates: 0,
    buildExecutionCandidates: 0,
    testExecutionCandidates: 0,
    rollbackExecutionCandidates: 0,
    dbRuntimeWriteCandidates: 0,
    providerCallCandidates: 0,
    modelCallCandidates: 0,
    toolExecutionCandidates: 0,
    mcpStartupCandidates: 0,
    agentDispatchCandidates: 0,
    deployCandidates: 0,
    releaseCandidates: 0,
    exportCandidates: 0,
    packageCandidates: 0,
    networkCallCandidates: 0,
    providerSpendCandidates: 0,
  };
}

export function buildProjectPatchBuildPreview(input = {}) {
  const sourceModel = input.sourceModel || input.model || buildProjectWorkspaceMutationModel(input);
  const sourceValidation = validateProjectWorkspaceMutationModel(sourceModel);
  const safetyFlags = blockedSafetyFlags();
  const previewRows = sourceValidation.valid ? buildPreviewRows(sourceModel) : [];
  const touchedPathClassifications = sourceValidation.valid ? buildTouchedPathClassifications(sourceModel) : [];
  const redactedPatchSummary = sourceValidation.valid ? buildRedactedPatchSummary(sourceModel) : {};
  const buildCommandSummary = createCommandSummary(sourceModel.buildPlan?.commandCandidates?.[0], "Build");
  const testCommandSummary = createCommandSummary(sourceModel.testPlan?.commandCandidates?.[0], "Test");
  const rollbackSummary = sourceValidation.valid ? buildRollbackSummary(sourceModel) : {};
  const payload = {
    previewRows,
    touchedPathClassifications,
    redactedPatchSummary,
    buildCommandSummary,
    testCommandSummary,
    rollbackSummary,
  };
  const redactionSummary = summarizeRedaction(payload);

  return {
    phase: PROJECT_PATCH_BUILD_PREVIEW_PHASE,
    version: PROJECT_PATCH_BUILD_PREVIEW_VERSION,
    mode: "project-patch-build-preview",
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    currentState: "patch_build_preview_ready_execution_blocked",
    sourceModelPhase: sourceModel.phase,
    sourceModelValid: sourceValidation.valid,
    sourceModelErrors: sourceValidation.errors,
    selectedProjectProfile: sourceModel.selectedProjectProfile,
    projectBoundary: sourceModel.projectBoundary,
    allowedPathGlobs: [...(sourceModel.allowedPathGlobs || [])],
    forbiddenPathGlobs: [...(sourceModel.forbiddenPathGlobs || [])],
    previewRows,
    touchedPathClassifications,
    redactedPatchSummary,
    buildCommandSummary,
    testCommandSummary,
    rollbackSummary,
    approvalGate: {
      ...sourceModel.approvalGate,
      previewApprovalState: "required_not_granted",
      previewBypassAllowed: false,
    },
    candidateCounts: buildCandidateCounts(previewRows),
    evidenceRefs: [
      "reports/p1383-project-workspace-mutation-build-pipeline-report.md",
      "reports/p1382-project-workspace-mutation-build-pipeline-report.md",
      ...(sourceModel.evidenceRefs || []).slice(0, 4),
    ],
    auditRefs: ["reports/p1383-project-workspace-mutation-build-pipeline-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    ownerAgentCapability: OWNER_CAPABILITY,
    nextAction: "Route this non-runnable preview to P138.4 Command Center UX wiring without applying patches or running project commands.",
    blockers: [
      "Approved selected project boundary is required.",
      "Mutation approval is required and not granted.",
      "Patch application remains blocked.",
      "Project build and test execution remain blocked.",
      "Rollback execution remains blocked.",
      "DB/runtime writes, provider/model calls, tool execution, MCP startup, and agent dispatch remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    costImpact: "Zero-spend preview. No project command, provider call, model call, tool execution, network call, deploy, package creation, or provider spend.",
    redaction: {
      changed: redactionSummary.changed,
      redactionCount: redactionSummary.redactionCount,
    },
    safetyFlags,
    ...safetyFlags,
  };
}

export function validateProjectPatchBuildPreview(preview = {}) {
  const errors = [];
  if (preview.phase !== PROJECT_PATCH_BUILD_PREVIEW_PHASE) errors.push("phase must be P138.3");
  if (preview.version !== PROJECT_PATCH_BUILD_PREVIEW_VERSION) errors.push("version must be 1.0");
  if (preview.mode !== "project-patch-build-preview") errors.push("mode must be project-patch-build-preview");
  if (preview.previewOnly !== true || preview.readOnly !== true || preview.localOnly !== true) errors.push("preview must remain read-only local metadata");
  if (preview.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (preview.sourceModelPhase !== "P138.2" || preview.sourceModelValid !== true) errors.push("preview must consume a valid P138.2 source model");
  for (const field of [
    "selectedProjectProfile",
    "projectBoundary",
    "previewRows",
    "touchedPathClassifications",
    "redactedPatchSummary",
    "buildCommandSummary",
    "testCommandSummary",
    "rollbackSummary",
    "approvalGate",
    "candidateCounts",
  ]) {
    if (!(field in preview)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(preview.previewRows) || preview.previewRows.length < 4) errors.push("previewRows must include useful change previews");
  if (!preview.previewRows?.every((row) => row.label && row.changeSummary && row.targetScope && row.wouldApplyPatch === false && row.wouldMutateProject === false && row.wouldRunBuild === false && row.wouldRunTests === false && row.wouldRollback === false && row.wouldSpend === false && row.rawDiffVisible === false && row.rawPatchVisible === false && row.rawLogsVisible === false)) errors.push("preview rows must be display-safe and non-runnable");
  if (!Array.isArray(preview.touchedPathClassifications) || preview.touchedPathClassifications.length !== preview.previewRows.length) errors.push("touchedPathClassifications must match preview rows");
  if (!preview.touchedPathClassifications?.every((row) => row.rawPathVisible === false && row.classification === "display_safe_scope_summary")) errors.push("path classifications must hide raw paths");
  if (preview.redactedPatchSummary?.previewOnly !== true || preview.redactedPatchSummary?.appliedPatchCount !== 0 || preview.redactedPatchSummary?.rawPatchVisible !== false || preview.redactedPatchSummary?.rawDiffVisible !== false) errors.push("redactedPatchSummary must remain unapplied and display-safe");
  if (preview.buildCommandSummary?.executionAllowed !== false || preview.buildCommandSummary?.executableCommand !== null || preview.buildCommandSummary?.commandVisible !== false || preview.buildCommandSummary?.rawLogsVisible !== false) errors.push("buildCommandSummary must not execute or expose commands");
  if (preview.testCommandSummary?.executionAllowed !== false || preview.testCommandSummary?.executableCommand !== null || preview.testCommandSummary?.commandVisible !== false || preview.testCommandSummary?.rawLogsVisible !== false) errors.push("testCommandSummary must not execute or expose commands");
  if (preview.rollbackSummary?.rollbackExecutionAllowed !== false || preview.rollbackSummary?.executableNow !== false || preview.rollbackSummary?.rawPatchVisible !== false || !Array.isArray(preview.rollbackSummary?.rollbackSteps)) errors.push("rollbackSummary must not execute");
  if (preview.approvalGate?.required !== true || preview.approvalGate?.approved !== false || preview.approvalGate?.approvalCaptured !== false || preview.approvalGate?.previewBypassAllowed !== false) errors.push("approvalGate must require approval without granting it");
  if (preview.candidateCounts?.patchPreviewRows < 1 || preview.candidateCounts?.patchApplicationCandidates !== 0 || preview.candidateCounts?.projectMutationCandidates !== 0 || preview.candidateCounts?.buildExecutionCandidates !== 0 || preview.candidateCounts?.testExecutionCandidates !== 0 || preview.candidateCounts?.providerSpendCandidates !== 0) errors.push("candidate counts must keep execution blocked");
  for (const flag of PROJECT_PATCH_BUILD_PREVIEW_SAFETY_FLAG_NAMES) {
    if (preview[flag] !== false) errors.push(`${flag} must be false`);
    if (preview.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!Array.isArray(preview.evidenceRefs) || !Array.isArray(preview.auditRefs) || !Array.isArray(preview.activityRefs)) errors.push("evidenceRefs, auditRefs, and activityRefs must be arrays");
  if (!preview.ownerAgentCapability || !preview.nextAction || !preview.disabledReason || !preview.costImpact) errors.push("operator-facing summary fields are required");
  if (typeof preview.redaction?.changed !== "boolean" || typeof preview.redaction?.redactionCount !== "number") errors.push("redaction summary is required");

  const serialized = JSON.stringify(preview);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("preview must not expose raw private IDs");
  if (/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(serialized)) errors.push("preview must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw registry dump|raw patch dump|raw diff dump/i.test(serialized)) errors.push("preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildProjectPatchBuildPreviewEnvelope(input = {}) {
  const preview = input.preview || buildProjectPatchBuildPreview(input);
  const validation = validateProjectPatchBuildPreview(preview);
  const result = createPassResult({
    phase: PROJECT_PATCH_BUILD_PREVIEW_PHASE,
    mode: "project-patch-build-preview",
    source: "shared/projectPatchBuildPreview.js",
    summary: validation.valid
      ? "P138.3 non-runnable patch/build preview is valid; project mutation and command execution remain blocked."
      : "P138.3 non-runnable patch/build preview is invalid.",
    data: preview,
    errors: validation.errors,
    evidence: preview.evidenceRefs || [],
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
