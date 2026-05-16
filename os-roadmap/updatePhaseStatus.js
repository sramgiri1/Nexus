import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createReportMetadata, formatReportMetadataMarkdown } from "../shared/reportMetadata.js";

const ROOT = process.cwd();
const DEFAULT_STATUS_PATH = join(ROOT, "os-roadmap/phase-status.json");

export function loadPhaseStatus(filePath = DEFAULT_STATUS_PATH) {
  if (!existsSync(filePath)) {
    return {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      phases: [],
      track: "NEXUS_OS",
      updatedAt: new Date().toISOString(),
      currentPhase: "unknown",
      previousPhase: "unknown",
      nextPhase: "unknown",
    };
  }
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed.phases)) parsed.phases = [];
  return parsed;
}

export function validatePhaseStatus(status = {}) {
  const errors = [];
  if (!status || typeof status !== "object") errors.push("phase status must be an object");
  if (!Array.isArray(status.phases)) errors.push("phase status phases must be an array");
  for (const phase of status.phases || []) {
    if (!phase.phaseId) errors.push("phase entry missing phaseId");
    if (!phase.title) errors.push(`phase ${phase.phaseId || "unknown"} missing title`);
    if (!["planned", "in_progress", "complete", "blocked", "skipped"].includes(phase.status)) {
      errors.push(`phase ${phase.phaseId || "unknown"} has invalid status`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function upsertPhase(status, phaseUpdate = {}) {
  const index = status.phases.findIndex((phase) => phase.phaseId === phaseUpdate.phaseId);
  if (index >= 0) {
    status.phases[index] = { ...status.phases[index], ...phaseUpdate };
    return status.phases[index];
  }
  const entry = {
    track: "NEXUS_OS",
    status: "planned",
    branch: "unknown",
    commit: "unknown",
    completedAt: "",
    checksRun: [],
    knownLimitations: [],
    commandCenterVisible: true,
    ...phaseUpdate,
  };
  status.phases.push(entry);
  return entry;
}

export function updatePhaseStatus(phaseUpdate, options = {}) {
  const status = loadPhaseStatus(options.filePath);
  const entry = upsertPhase(status, phaseUpdate);
  status.updatedAt = new Date().toISOString();
  if (options.write !== false) writePhaseStatus(status, options.filePath);
  return { status, entry };
}

export function markPhaseComplete(options = {}) {
  return updatePhaseStatus({
    phaseId: options.phaseId,
    title: options.title,
    status: "complete",
    branch: options.branch || "unknown",
    commit: options.commit || "unknown",
    completedAt: options.completedAt || new Date().toISOString(),
    summary: options.summary,
    checksRun: options.checksRun || [],
    knownLimitations: options.knownLimitations || [],
    nextPhase: options.nextPhase,
    commandCenterVisible: options.commandCenterVisible !== false,
  }, options);
}

export function markPhaseCurrent(options = {}) {
  const result = updatePhaseStatus({
    phaseId: options.phaseId,
    title: options.title,
    status: "in_progress",
    branch: options.branch || "unknown",
    commit: options.commit || "pending-final-commit",
    summary: options.summary,
    nextPhase: options.nextPhase,
    commandCenterVisible: options.commandCenterVisible !== false,
  }, options);
  result.status.currentPhase = options.phaseId;
  result.status.previousPhase = options.previousPhase || result.status.previousPhase;
  result.status.nextPhase = options.nextPhase || result.status.nextPhase;
  if (options.write !== false) writePhaseStatus(result.status, options.filePath);
  return result;
}

export function markNextPhase(options = {}) {
  const result = updatePhaseStatus({
    phaseId: options.phaseId,
    title: options.title,
    status: "planned",
    branch: options.branch || "planned",
    commit: options.commit || "planned",
    summary: options.summary,
    commandCenterVisible: options.commandCenterVisible !== false,
  }, options);
  result.status.nextPhase = options.phaseId;
  if (options.write !== false) writePhaseStatus(result.status, options.filePath);
  return result;
}

export function writePhaseStatus(status, filePath = DEFAULT_STATUS_PATH) {
  writeFileSync(filePath, JSON.stringify(status, null, 2) + "\n");
}

export function buildPhaseStatusReport(status = loadPhaseStatus()) {
  const metadata = createReportMetadata({ phase: "P56.8 - Codebase Maintainability Guardrails" });
  const validation = validatePhaseStatus(status);
  const current = status.phases?.find((phase) => phase.phaseId === status.currentPhase);
  const next = status.phases?.find((phase) => phase.phaseId === status.nextPhase);
  return [
    "# OS Phase Status Report",
    "",
    formatReportMetadataMarkdown(metadata),
    "",
    "## Summary",
    "",
    `- Current phase: ${status.currentPhase || "unknown"}${current?.title ? ` - ${current.title}` : ""}`,
    `- Previous phase: ${status.previousPhase || "unknown"}`,
    `- Next phase: ${status.nextPhase || "unknown"}${next?.title ? ` - ${next.title}` : ""}`,
    `- Phase entries: ${status.phases?.length || 0}`,
    `- Valid schema: ${validation.valid ? "PASS" : "FAIL"}`,
    "",
    "## Validation",
    "",
    validation.errors.length ? validation.errors.map((error) => `- ${error}`).join("\n") : "- None",
  ].join("\n");
}
