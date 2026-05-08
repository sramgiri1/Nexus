import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { addTask } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { appendRuntimeEvent } from "../local-state/stateStore.js";
import { getNexusMode } from "../private-mode/privateMode.js";
import { createMissionContract, writeMissionContract } from "./missionContract.js";
import { createInitialMissionTaskPlan, writeMissionTaskPlan } from "./missionPlanner.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_MODES = new Set(["local-private", "test"]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getGitBranch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim() || "arch/mission-composer-governed-kickoff";
  } catch {
    return "arch/mission-composer-governed-kickoff";
  }
}

function getGitHead() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export function validateMissionInput(input = {}) {
  const errors = [];
  const warnings = [];

  if (!normalizeString(input.missionText)) {
    errors.push("missionText is required.");
  }

  if (!normalizeString(input.projectId)) {
    warnings.push("projectId not provided; will default to private-project-01.");
  }

  if (!normalizeString(input.mode)) {
    warnings.push("mode not provided; will default based on NEXUS_MODE env var.");
  }

  if (input.requestedBy && !normalizeString(input.requestedBy.userId)) {
    warnings.push("requestedBy.userId is missing.");
  }

  const mode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(mode)) {
    errors.push(`mode must be local-private or test. Got: ${mode}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function normalizeMissionInput(input = {}) {
  const mode = getNexusMode(process.env);

  return {
    mode: normalizeString(input.mode) || mode,
    projectId: normalizeString(input.projectId) || "private-project-01",
    projectLabel: normalizeString(input.projectLabel) || "Private Project",
    missionText:
      normalizeString(input.missionText) ||
      "Build the private project through governed planning, validation, privacy review, and controlled implementation.",
    requestedBy: input.requestedBy || {
      userId: "local-operator",
      role: "founder",
      authType: "local",
    },
    constraints: input.constraints || {
      mutationAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
    },
  };
}

export function createMissionInput(input = {}) {
  const normalized = normalizeMissionInput(input);
  const validation = validateMissionInput(normalized);
  return { ...normalized, _validation: validation };
}

export async function runMissionComposer(input = {}) {
  const errors = [];
  const warnings = [];

  // 1. Validate mode
  const mode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(mode)) {
    return {
      ok: false,
      mode,
      errors: [`Mission composer requires local-private or test mode. Got: ${mode}`],
      warnings: [],
    };
  }

  // 2. Normalize input
  const normalizedInput = normalizeMissionInput(input);
  const validation = validateMissionInput(normalizedInput);
  if (!validation.valid) {
    return {
      ok: false,
      mode,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
  warnings.push(...validation.warnings);

  // 3. Create mission contract
  const contract = createMissionContract(normalizedInput);

  // 4. Create task plan
  const taskPlan = createInitialMissionTaskPlan(normalizedInput);

  // 5. Write contract and plan files
  const contractResult = writeMissionContract(contract);
  const planResult = writeMissionTaskPlan(taskPlan);

  // 6. Create local task record for the mission itself
  const taskResult = addTask({
    projectId: normalizedInput.projectId,
    sourceAgent: "nexus",
    targetAgent: "shepherd",
    taskType: "orchestration.mission_kickoff",
    objective: "Governed mission kickoff via mission composer",
    state: "queued",
    riskLevel: "medium",
    blocking: false,
    dependsOn: [],
    redacted: true,
  });

  if (!taskResult.ok) {
    errors.push(...taskResult.errors);
  }

  // 7. Append evidence record
  const evidenceResult = appendEvidence({
    type: "mission_composer_plan",
    projectId: normalizedInput.projectId,
    agentId: "nexus",
    result: "PASS",
    summary: "Mission composer generated governed plan",
    dataClassification: "confidential",
    redacted: true,
  });

  if (!evidenceResult.ok) {
    errors.push(...evidenceResult.errors);
  }

  // 8. Append audit event
  const auditResult = appendAuditEvent({
    eventType: "mission_composer_completed",
    actorId: "nexus",
    actorType: "agent",
    projectId: normalizedInput.projectId,
    summary: "Mission composer completed governed kickoff",
    redacted: true,
  });

  if (!auditResult.ok) {
    errors.push(...auditResult.errors);
  }

  // 9. Append runtime event
  const runtimeEventResult = appendRuntimeEvent({
    eventType: "governed_mission_plan_created",
    projectId: normalizedInput.projectId,
    agentId: "nexus",
    runtime: "node-local",
    summary: "Governed mission plan created via mission composer",
    redacted: true,
  });

  if (!runtimeEventResult.ok) {
    errors.push(...runtimeEventResult.errors);
  }

  const result = {
    ok: errors.length === 0,
    mode,
    projectId: normalizedInput.projectId,
    projectLabel: normalizedInput.projectLabel,
    missionText: normalizedInput.missionText,
    contract: {
      contractId: contract.contractId,
      path: contractResult.path,
    },
    taskPlan: {
      taskCount: taskPlan.tasks.length,
      path: planResult.path,
    },
    localTask: taskResult.ok ? { taskId: taskResult.record?.taskId } : null,
    evidence: evidenceResult.ok ? { evidenceId: evidenceResult.record?.evidenceId } : null,
    audit: auditResult.ok ? { auditId: auditResult.record?.auditId } : null,
    runtimeEvent: runtimeEventResult.ok ? { eventId: runtimeEventResult.record?.eventId } : null,
    errors,
    warnings,
    generatedAt: new Date().toISOString(),
  };

  // 10. Write reports
  writeMissionComposerReports(result);

  return result;
}

export function writeMissionComposerReports(result = {}) {
  const reportsDir = path.join(REPO_ROOT, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const now = result.generatedAt || new Date().toISOString();
  const branch = getGitBranch();
  const head = getGitHead();

  const markdownLines = [
    "# NEXUS Mission Composer Report",
    "",
    "## Metadata",
    "",
    `- Branch: ${branch}`,
    `- HEAD: ${head}`,
    `- Generated at: ${now}`,
    "",
    "## Mission",
    "",
    result.missionText || "No mission text provided.",
    "",
    "## Governance",
    "",
    "- Mode: local-private",
    "- Provider calls: disabled",
    "- Network: disabled",
    "- DB/API: disabled",
    "- Project mutation: disabled",
    "- Build/test execution: disabled",
    "",
    "## Task Plan",
    "",
    `- Task count: ${result.taskPlan?.taskCount || 0}`,
    `- Plan path: ${result.taskPlan?.path || "unknown"}`,
    `- Contract path: ${result.contract?.path || "unknown"}`,
    "",
    "Agents assigned:",
    "- SHEPHERD / orchestration.plan_flow / Project Brief",
    "- AUDITOR / verification.code_quality_gate / Backend Validation Follow-up",
    "- PRISM / design.ux_flow / UX Product Flow Planning",
    "- SENTINEL / verification.qa_gate / iOS Readiness Planning",
    "- WARDEN / security.privacy_review / Privacy Compliance Review",
    "- CORE / implementation.backend_code / First Controlled Implementation Candidate",
    "",
    "## Local Records",
    "",
    `- Local task: ${result.localTask?.taskId || "none"}`,
    `- Evidence: ${result.evidence?.evidenceId || "none"}`,
    `- Audit: ${result.audit?.auditId || "none"}`,
    `- Runtime event: ${result.runtimeEvent?.eventId || "none"}`,
    "",
    "## Warnings",
    "",
    ...(result.warnings?.length ? result.warnings.map((w) => `- ${w}`) : ["- None"]),
    "",
    "## Failures",
    "",
    ...(result.errors?.length ? result.errors.map((e) => `- ${e}`) : ["- None"]),
    "",
    `## Result: ${result.ok ? "PASS" : "FAIL"}`,
    "",
  ];

  fs.writeFileSync(
    path.join(reportsDir, "mission-composer-report.md"),
    markdownLines.join("\n"),
    "utf8"
  );

  // Write JSON output
  const outputJson = {
    reportVersion: "1.0",
    mode: result.mode || "local-private",
    projectId: result.projectId || "private-project-01",
    projectLabel: result.projectLabel || "Private Project",
    missionText: result.missionText || "",
    generatedAt: now,
    source: "command_center_mission_composer",
    ownerAgent: "nexus",
    plannerAgent: "shepherd",
    contract: result.contract || null,
    taskPlan: result.taskPlan || null,
    localRecords: {
      task: result.localTask || null,
      evidence: result.evidence || null,
      audit: result.audit || null,
      runtimeEvent: result.runtimeEvent || null,
    },
    governance: {
      mutationAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
      localTaskRecordAllowed: true,
      evidenceAllowed: true,
      auditAllowed: true,
      runtimeEventAllowed: true,
    },
    result: result.ok ? "PASS" : "FAIL",
    errors: result.errors || [],
    warnings: result.warnings || [],
    nextAction: "Create governed project brief from mission composer",
  };

  fs.writeFileSync(
    path.join(reportsDir, "mission-composer-output.json"),
    `${JSON.stringify(outputJson, null, 2)}\n`,
    "utf8"
  );

  return { ok: true };
}
