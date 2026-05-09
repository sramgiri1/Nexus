/**
 * implementationBridge.js
 * First Controlled Implementation Workflow Bridge — P39-LOCAL.
 *
 * Applies a narrow, governed documentation change to
 * projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md.
 * No execution. No providers. No network. No DB. No shell commands.
 * No production source mutation. No test/schema/iOS mutation.
 */

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import {
  createImplementationProposal,
  validateImplementationProposal,
  createPatchPlan,
  createRollbackPlan,
  writeImplementationProposalReports,
} from "./implementationPlan.js";
import { appendImplementationAction } from "./implementationStore.js";
import { readTasks } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { writeLocalStateEvent } from "../local-state/writeLocalState.js";
import { getNexusMode } from "../private-mode/privateMode.js";

const ROOT = process.cwd();
const ALLOWED_ACTION_TYPES = new Set(["implementation.propose", "implementation.apply"]);
const ALLOWED_MODES = new Set(["local-private", "test"]);
const ALLOWED_IMPL_TYPES = new Set(["documentation_readiness_log"]);
const ALLOWED_TARGET = "CORE";
const ALLOWED_CAPABILITY = "implementation.backend_code";
const ALLOWED_PATH = "projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md";
const FORBIDDEN_PATH_PREFIXES = [
  "projects/careloop/src",
  "projects/careloop/test",
  "projects/careloop/prisma",
  "projects/careloop-ios",
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isForbiddenPath(p) {
  return FORBIDDEN_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

// ─── createImplementationRequest ─────────────────────────────────────────────

export function createImplementationRequest(input = {}) {
  const errors = [];
  const warnings = [];

  const actionType = normalizeString(input.actionType);
  const mode = normalizeString(input.mode) || "local-private";
  const implementationType = normalizeString(input.implementationType);
  const targetAgent = normalizeString(input.targetAgent);
  const runtimeTaskId = normalizeString(input.runtimeTaskId);

  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    errors.push(`actionType must be one of: ${[...ALLOWED_ACTION_TYPES].join(", ")}. Got: ${actionType || "(empty)"}`);
  }
  if (!ALLOWED_MODES.has(mode)) {
    errors.push(`mode must be local-private or test. Got: ${mode}`);
  }
  if (!ALLOWED_IMPL_TYPES.has(implementationType)) {
    errors.push(`implementationType must be documentation_readiness_log. Got: ${implementationType || "(empty)"}`);
  }
  if (targetAgent && targetAgent !== ALLOWED_TARGET) {
    errors.push(`targetAgent must be CORE. Got: ${targetAgent}`);
  }

  if (errors.length > 0) return { ok: false, request: null, errors, warnings };

  return {
    ok: true,
    request: {
      actionId: randomUUID(),
      actionType,
      mode,
      projectId: normalizeString(input.projectId) || "private-project-01",
      missionId: normalizeString(input.missionId) || "private-project-governed-build-mission",
      runtimeTaskId,
      targetAgent: targetAgent || ALLOWED_TARGET,
      capabilityId: normalizeString(input.capabilityId) || ALLOWED_CAPABILITY,
      implementationType,
      allowedPaths: [ALLOWED_PATH],
      requestedBy: input.requestedBy || { userId: "local-operator", role: "founder", authType: "local" },
      source: normalizeString(input.source) || "command_center_v2",
      createdAt: new Date().toISOString(),
    },
    errors: [],
    warnings,
  };
}

// ─── validateImplementationRequest ───────────────────────────────────────────

export function validateImplementationRequest(request = {}) {
  const errors = [];
  if (!request || typeof request !== "object") {
    return { valid: false, errors: ["request must be an object."] };
  }
  if (!request.actionId) errors.push("actionId is required.");
  if (!ALLOWED_ACTION_TYPES.has(request.actionType)) errors.push(`actionType invalid: ${request.actionType}`);
  if (!ALLOWED_MODES.has(request.mode)) errors.push(`mode invalid: ${request.mode}`);
  if (!ALLOWED_IMPL_TYPES.has(request.implementationType)) errors.push(`implementationType invalid: ${request.implementationType}`);
  if (request.targetAgent !== ALLOWED_TARGET) errors.push(`targetAgent must be CORE. Got: ${request.targetAgent}`);
  return { valid: errors.length === 0, errors };
}

// ─── runImplementationRequest ─────────────────────────────────────────────────

export async function runImplementationRequest(request = {}) {
  // 1. Validate request
  const validation = validateImplementationRequest(request);
  if (!validation.valid) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId || "", status: "failed",
      runtimeTaskId: request.runtimeTaskId || "", errors: validation.errors, warnings: [], result: null });
  }

  // 2. Check mode
  const envMode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(envMode)) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId,
      errors: [`Implementation requires local-private mode. Got: ${envMode}`], warnings: [], result: null });
  }

  // 3. Block demo/public mode
  if (envMode === "demo" || request.mode === "demo") {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId,
      errors: ["Controlled implementation is not available in demo mode."], warnings: [], result: null });
  }

  // 4. For apply — verify runtimeTaskId exists
  if (request.actionType === "implementation.apply") {
    if (!request.runtimeTaskId) {
      return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "failed",
        runtimeTaskId: "", errors: ["runtimeTaskId is required for implementation.apply"], warnings: [], result: null });
    }
    const tasksResult = readTasks();
    if (tasksResult.ok) {
      const task = tasksResult.document.tasks.find((t) => t.taskId === request.runtimeTaskId);
      if (!task) {
        return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "failed",
          runtimeTaskId: request.runtimeTaskId,
          errors: [`runtimeTaskId not found: ${request.runtimeTaskId}`], warnings: [], result: null });
      }
    }
  }

  // 5. Create proposal
  const proposalResult = createImplementationProposal({
    mode: request.mode,
    projectId: request.projectId,
    missionId: request.missionId,
    runtimeTaskId: request.runtimeTaskId,
    targetAgent: request.targetAgent,
    capabilityId: request.capabilityId,
    implementationType: request.implementationType,
    allowedPaths: request.allowedPaths || [ALLOWED_PATH],
  });

  if (!proposalResult.ok) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId, errors: proposalResult.errors, warnings: proposalResult.warnings, result: null });
  }

  const proposal = proposalResult.proposal;
  const proposalValidation = validateImplementationProposal(proposal);
  if (!proposalValidation.valid) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId, errors: proposalValidation.errors, warnings: [], result: null });
  }

  // For propose-only actions, return the proposal without applying
  if (request.actionType === "implementation.propose") {
    writeImplementationProposalReports({ proposal, proposedAt: new Date().toISOString() });
    return buildImplementationResponse({
      ok: true, actionId: request.actionId, status: "proposed",
      runtimeTaskId: request.runtimeTaskId,
      errors: [], warnings: proposalResult.warnings,
      result: {
        proposalCreated: true,
        patchApplied: false,
        changedFiles: [],
        patchSummary: proposal.changeSummary,
        rollbackPlan: proposal.rollbackPlan.summary,
        validationRun: false, validationStatus: "SKIPPED",
        evidenceCreated: false, auditCreated: false, runtimeEventCreated: false,
      },
    });
  }

  // 6. Create patch plan
  const patchPlanResult = createPatchPlan(proposal);
  if (!patchPlanResult.ok) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId, errors: patchPlanResult.errors, warnings: [], result: null });
  }

  const patchPlan = patchPlanResult.plan;

  // 7. Final path safety check before write
  if (patchPlan.targetFile !== ALLOWED_PATH) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId,
      errors: [`Path not allowed: ${patchPlan.targetFile}`], warnings: [], result: null });
  }
  if (isForbiddenPath(patchPlan.targetFile)) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId,
      errors: [`Forbidden path: ${patchPlan.targetFile}`], warnings: [], result: null });
  }

  // 8. Apply doc-only change
  let patchApplied = false;
  const targetFullPath = join(ROOT, patchPlan.targetFile);
  try {
    const dir = dirname(targetFullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (patchPlan.operation === "create") {
      writeFileSync(targetFullPath, patchPlan.content, "utf8");
    } else {
      const existing = existsSync(targetFullPath) ? readFileSync(targetFullPath, "utf8") : "";
      writeFileSync(targetFullPath, existing + patchPlan.content, "utf8");
    }
    patchApplied = true;
  } catch (e) {
    return buildImplementationResponse({ ok: false, actionId: request.actionId, status: "failed",
      runtimeTaskId: request.runtimeTaskId,
      errors: [`Failed to apply patch: ${e.message}`], warnings: [], result: null });
  }

  // 9. Write implementation result report
  const rollbackPlan = createRollbackPlan(proposal);
  const resultReport = {
    actionId: request.actionId,
    implementationType: request.implementationType,
    changedFiles: [patchPlan.targetFile],
    patchSummary: patchPlan.patchSummary,
    rollbackNote: patchPlan.rollbackNote,
    rollbackPlan,
    validationStatus: "SKIPPED",
    appliedAt: new Date().toISOString(),
    redacted: true,
  };
  try {
    writeFileSync(join(ROOT, "reports/implementation-result.json"), JSON.stringify(resultReport, null, 2), "utf8");
    writeImplementationProposalReports({ proposal, appliedAt: new Date().toISOString() });
  } catch { /* non-fatal */ }

  // 10. Append evidence
  const evidenceResult = appendEvidence({
    type: "implementation_result",
    projectId: "private-project-01",
    taskId: request.runtimeTaskId || "system",
    agentId: ALLOWED_TARGET,
    capabilityId: ALLOWED_CAPABILITY,
    result: "PASS",
    summary: `Controlled implementation applied: ${patchPlan.patchSummary}`,
    dataClassification: "confidential",
    redacted: true,
  });

  // 11. Append audit event
  const auditResult = appendAuditEvent({
    eventType: "controlled_implementation_applied",
    actorId: "local-operator",
    actorType: "founder",
    projectId: "private-project-01",
    taskId: request.runtimeTaskId || "system",
    capabilityId: ALLOWED_CAPABILITY,
    summary: `Controlled doc implementation by CORE. File: ${patchPlan.targetFile}`,
    previousState: "proposed",
    nextState: "applied",
    redacted: true,
  });

  // 12. Write runtime event
  const eventResult = writeLocalStateEvent({
    type: "audit",
    record: {
      eventType: "governed_implementation_applied",
      actorId: "local-operator",
      actorType: "founder",
      projectId: "private-project-01",
      taskId: request.runtimeTaskId || "system",
      capabilityId: ALLOWED_CAPABILITY,
      summary: "Governed implementation applied. Documentation change only.",
      changedFile: patchPlan.targetFile,
      redacted: true,
    },
  });

  // 13. Store implementation action record
  appendImplementationAction({
    actionId: request.actionId,
    actionType: request.actionType,
    mode: request.mode,
    projectId: request.projectId,
    runtimeTaskId: request.runtimeTaskId,
    targetAgent: ALLOWED_TARGET,
    capabilityId: ALLOWED_CAPABILITY,
    implementationType: request.implementationType,
    changedFiles: [patchPlan.targetFile],
    patchSummary: patchPlan.patchSummary,
    validationStatus: "SKIPPED",
    status: "completed",
    createdAt: request.createdAt,
    evidenceIds: evidenceResult.ok ? [evidenceResult.record?.evidenceId] : [],
    auditIds: auditResult.ok ? [auditResult.record?.auditId] : [],
  });

  return buildImplementationResponse({
    ok: true, actionId: request.actionId, status: "completed",
    runtimeTaskId: request.runtimeTaskId, errors: [], warnings: [],
    result: {
      proposalCreated: true,
      patchApplied,
      changedFiles: [patchPlan.targetFile],
      patchSummary: patchPlan.patchSummary,
      rollbackPlan: rollbackPlan.summary,
      rollbackNote: patchPlan.rollbackNote,
      validationRun: false,
      validationStatus: "SKIPPED",
      validationNote: "Documentation-only change; controlled backend validation can be run separately via careloop:backend-validate.",
      evidenceCreated: evidenceResult.ok,
      auditCreated: auditResult.ok,
      runtimeEventCreated: eventResult.ok,
    },
  });
}

// ─── getImplementationResult ──────────────────────────────────────────────────

export function getImplementationResult(actionId) {
  return getImplementationAction(actionId);
}

// ─── listImplementationActions ────────────────────────────────────────────────

export { listImplementationActions } from "./implementationStore.js";
import { getImplementationAction } from "./implementationStore.js";

// ─── buildImplementationResponse ─────────────────────────────────────────────

export function buildImplementationResponse(opts = {}) {
  return {
    ok: opts.ok === true,
    actionId: normalizeString(opts.actionId),
    actionType: "implementation.apply",
    status: normalizeString(opts.status) || "failed",
    mode: normalizeString(opts.mode) || "local-private",
    runtimeTaskId: normalizeString(opts.runtimeTaskId),
    targetAgent: ALLOWED_TARGET,
    result: opts.result || null,
    warnings: Array.isArray(opts.warnings) ? opts.warnings : [],
    errors: Array.isArray(opts.errors) ? opts.errors : [],
  };
}
