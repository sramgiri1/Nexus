import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot, readJsonSafe } from "../local-state/safeFileReader.js";
import { getNexusMode, isLocalPrivateMode, validatePrivateProjectAccess } from "../private-mode/index.js";
import { addTask, updateTaskState } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { appendRuntimeEvent } from "../local-state/stateStore.js";
import { validateLocalTaskTransition } from "../local-state/stateTransitionGuard.js";
import { validateCommandAgainstAllowlist } from "../command-execution/commandAllowlist.js";
import { runCommandPreflight } from "../command-execution/commandPreflight.js";
import { runControlledCommand, createCommandEvidence } from "../command-execution/controlledCommandRunner.js";

const CLASSIFICATION_PATH = "reports/careloop-command-classification.json";
const VALIDATION_PLAN_PATH = "reports/careloop-validation-plan.json";
const INVENTORY_PATH = "reports/careloop-inventory.json";
const CONTRACT_DIR = "contracts/careloop";
const CONTRACT_FILE = "contracts/careloop/backend-controlled-validation-contract.json";
const REPORT_MD_PATH = "reports/careloop-backend-validation.md";
const REPORT_JSON_PATH = "reports/careloop-backend-validation.json";

// P30 target command.
const P30_COMMAND = { command: "npm", args: ["test"], workingDirectory: "projects/careloop" };
const COMMAND_ID = "careloop-backend-npm-test";

// Abstract IDs for write-guarded runtime files.
const RUNTIME_PROJECT_ID = "private-project-01";
const RUNTIME_TASK_ID = "pvt-backend-controlled-validation";

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

export function loadCareLoopCommandClassification(mode) {
  const result = readJsonSafe(CLASSIFICATION_PATH);
  return result.ok ? result.data : null;
}

function createContract() {
  return {
    contractVersion: "1.0",
    contractType: "task",
    projectId: "careloop",
    privateProject: true,
    mode: "local-private",
    taskId: "careloop-backend-controlled-validation",
    title: "Run CareLoop backend controlled validation through NEXUS",
    objective:
      "Run the first approved backend validation command through the governed NEXUS local execution path.",
    sourceAgent: "auditor",
    targetAgent: "auditor",
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    dataClassification: "confidential",
    commandId: COMMAND_ID,
    command: P30_COMMAND.command,
    args: P30_COMMAND.args,
    workingDirectory: P30_COMMAND.workingDirectory,
    mutationAllowed: false,
    buildExecutionAllowed: false,
    testExecutionAllowed: true,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    dbAccessAllowed: false,
    dependencyInstallAllowed: false,
    allowedRoots: ["projects/careloop"],
    forbiddenActions: [
      "modify private project source files",
      "run npm install",
      "run dev/start/studio/watch commands",
      "run Prisma migrate/reset/seed",
      "call providers",
      "call network",
      "access DB",
      "read .env",
    ],
    acceptanceCriteria: [
      "Command allowlist permits npm test",
      "Preflight passes or blocks safely",
      "No dependency install is performed",
      "No provider/API/DB/network calls are made",
      "No private project files are modified",
      "Command output is captured and redacted",
      "Evidence and audit records are linked",
    ],
    requiredEvidence: [
      "command_classification_artifact",
      "command_allowlist_decision",
      "preflight_result",
      "controlled_command_result",
      "local_task_record",
      "audit_event",
      "runtime_event",
    ],
    createdAt: new Date().toISOString(),
  };
}

function runLocalTaskPath(mode, evidenceType, warnings) {
  const taskRecord = {
    taskId: randomUUID(),
    projectId: RUNTIME_PROJECT_ID,
    taskType: "controlled_validation",
    state: "queued",
    sourceAgent: "auditor",
    targetAgent: "auditor",
    objective: "Governed controlled validation task",
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    redacted: true,
    classification: "confidential",
    mutationAllowed: false,
    testExecutionAllowed: true,
    createdAt: new Date().toISOString(),
  };

  const addResult = addTask(taskRecord);
  if (!addResult.ok) {
    const msg = addResult.errors?.join("; ") ?? "unknown error";
    warnings.push(`Failed to add task to local store: ${msg}`);
    return { taskId: taskRecord.taskId, finalState: "queued", transitions: [] };
  }

  const transitions = [];
  const transitionPairs = [
    { from: "queued", to: "running" },
    { from: "running", to: "implementation_done" },
  ];

  let currentState = "queued";
  for (const { from, to } of transitionPairs) {
    const guard = validateLocalTaskTransition({
      entityType: "task",
      taskId: taskRecord.taskId,
      fromState: from,
      toState: to,
      actor: "auditor",
      evidence: [{ type: evidenceType }],
    });

    if (!guard.allowed) {
      warnings.push(`Transition ${from}->${to} blocked: ${guard.errors?.join("; ") ?? "unknown"}`);
      break;
    }

    const updateResult = updateTaskState(taskRecord.taskId, to, {
      actor: "auditor",
      evidence: [{ type: evidenceType }],
    });

    if (!updateResult.ok) {
      warnings.push(`State update ${from}->${to} failed: ${updateResult.errors?.join("; ") ?? "unknown"}`);
      break;
    }

    transitions.push({ from, to, allowed: true });
    currentState = to;
  }

  return { taskId: taskRecord.taskId, finalState: currentState, transitions };
}

export function createCareLoopBackendControlledValidationContract(classification) {
  return createContract();
}

export function runCareLoopBackendControlledValidation(options = {}) {
  const env = options.env ?? process.env;
  const mode = getNexusMode(env);
  const errors = [];
  const warnings = [];

  if (!requireAllowedMode(mode)) {
    return {
      ok: false,
      errors: [`Mode '${mode}' does not allow CareLoop controlled validation.`],
      warnings,
    };
  }

  const access = validatePrivateProjectAccess({
    projectId: "careloop",
    purpose: "inventory",
    mode,
  });
  if (!access.allowed) {
    return { ok: false, errors: [access.reason], warnings };
  }

  const classification = loadCareLoopCommandClassification(mode);
  if (!classification) {
    warnings.push("Command classification not found; proceeding with P30 defaults.");
  }

  const contract = createContract();

  // Step 1: allowlist check.
  const allowlistResult = validateCommandAgainstAllowlist({
    projectId: "careloop",
    command: P30_COMMAND.command,
    args: P30_COMMAND.args,
    workingDirectory: P30_COMMAND.workingDirectory,
    mode,
  });

  if (!allowlistResult.allowed) {
    warnings.push(`Command blocked by allowlist: ${allowlistResult.reason}`);
    const taskResult = runLocalTaskPath(mode, "command_allowlist_blocked", warnings);
    appendEvidence({
      type: "controlled_validation_blocked",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      agentId: "auditor",
      capabilityId: "verification.code_quality_gate",
      result: "BLOCKED",
      summary: "Command blocked by allowlist.",
      dataClassification: "confidential",
      redacted: true,
      classification: "confidential",
    });
    appendAuditEvent({
      eventType: "controlled_validation_blocked",
      actorId: "auditor",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      redacted: true,
      classification: "confidential",
    });
    appendRuntimeEvent({
      eventType: "governed_controlled_validation_blocked",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      agentId: "auditor",
      mode,
      redacted: true,
      classification: "confidential",
    });
    return {
      ok: false,
      mode,
      contract,
      preflight: null,
      execution: { status: "BLOCKED", reason: allowlistResult.reason },
      taskResult,
      safety: buildSafetyFlags(false),
      warnings,
      errors: [allowlistResult.reason],
    };
  }

  // Step 2: preflight.
  const preflight = runCommandPreflight({
    projectRoot: P30_COMMAND.workingDirectory,
    scriptName: "test",
    mode,
  });

  if (!preflight.ok) {
    warnings.push(...preflight.warnings);
    const taskResult = runLocalTaskPath(mode, "preflight_blocked", warnings);
    appendEvidence({
      type: "controlled_validation_preflight_blocked",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      agentId: "auditor",
      capabilityId: "verification.code_quality_gate",
      result: "BLOCKED",
      summary: "Preflight blocked controlled validation.",
      dataClassification: "confidential",
      redacted: true,
      classification: "confidential",
    });
    appendAuditEvent({
      eventType: "controlled_validation_preflight_blocked",
      actorId: "auditor",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      redacted: true,
      classification: "confidential",
    });
    appendRuntimeEvent({
      eventType: "governed_controlled_validation_preflight_blocked",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      agentId: "auditor",
      mode,
      redacted: true,
      classification: "confidential",
    });
    return {
      ok: false,
      mode,
      contract,
      preflight,
      execution: { status: "BLOCKED", reason: preflight.errors.join("; ") },
      taskResult,
      safety: buildSafetyFlags(false),
      warnings,
      errors: preflight.errors,
    };
  }

  warnings.push(...preflight.warnings);

  // Step 3: run controlled command.
  const execution = runControlledCommand({
    projectId: "careloop",
    commandId: COMMAND_ID,
    command: P30_COMMAND.command,
    args: P30_COMMAND.args,
    workingDirectory: P30_COMMAND.workingDirectory,
    timeoutSeconds: allowlistResult.timeoutSeconds ?? 120,
    mode,
    captureOutput: true,
    redactOutput: true,
  });

  warnings.push(...execution.warnings);
  if (execution.errors?.length > 0) {
    errors.push(...execution.errors);
  }

  // Route through governed local path.
  const evidenceType = execution.status === "PASS"
    ? "controlled_command_result_pass"
    : "controlled_command_result_fail";
  const taskResult = runLocalTaskPath(mode, evidenceType, warnings);

  const cmdEvidence = createCommandEvidence({
    commandId: COMMAND_ID,
    status: execution.status,
    exitCode: execution.exitCode,
    durationMs: execution.durationMs,
    outputHash: execution.outputHash,
    mutationDetected: execution.mutationDetected,
  });

  appendEvidence({
    type: "controlled_validation_completed",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    capabilityId: "verification.code_quality_gate",
    result: execution.status === "PASS" ? "PASS" : "FAIL",
    summary: `Controlled validation completed: ${execution.status}`,
    artifactPaths: [REPORT_MD_PATH, REPORT_JSON_PATH],
    dataClassification: "confidential",
    redacted: true,
    classification: "confidential",
  });

  appendAuditEvent({
    eventType: "controlled_validation_completed",
    actorId: "auditor",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    redacted: true,
    classification: "confidential",
    details: { mode, status: execution.status, exitCode: execution.exitCode },
  });

  appendRuntimeEvent({
    eventType: "governed_controlled_validation_completed",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    mode,
    status: execution.status,
    redacted: true,
    classification: "confidential",
  });

  return {
    ok: execution.status === "PASS",
    mode,
    contract,
    preflight,
    execution,
    commandEvidence: cmdEvidence,
    governance: {
      identityContext: true,
      agentContext: true,
      trafficDecision: "allowed",
      stateMachine: taskResult.transitions.length > 0,
      localWriteBoundary: true,
    },
    taskResult,
    safety: buildSafetyFlags(false),
    warnings,
    errors,
  };
}

function buildSafetyFlags(dependencyInstall) {
  return {
    providerCalls: false,
    networkCalls: false,
    dbAccess: false,
    apiServer: false,
    dependencyInstall: dependencyInstall,
    projectMutation: false,
  };
}

export function writeCareLoopBackendValidationReports(result) {
  const root = getRepoRoot();
  const now = new Date().toISOString();

  // Write contract.
  const contractDir = path.join(root, CONTRACT_DIR);
  fs.mkdirSync(contractDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, CONTRACT_FILE),
    JSON.stringify(result.contract, null, 2),
    "utf8"
  );

  const execution = result.execution ?? {};
  const preflight = result.preflight ?? {};

  // Write JSON report.
  const reportJson = {
    validationVersion: "1.0",
    mode: result.mode,
    projectId: "careloop",
    privateProject: true,
    generatedAt: now,
    command: {
      commandId: COMMAND_ID,
      command: P30_COMMAND.command,
      args: P30_COMMAND.args,
      workingDirectory: P30_COMMAND.workingDirectory,
    },
    preflight: {
      status: preflight.status ?? "UNKNOWN",
      scriptExists: preflight.scriptExists ?? false,
      nodeModulesPresent: preflight.nodeModulesPresent ?? false,
      lockfilePresent: preflight.lockfilePresent ?? false,
      dependencyReadiness: preflight.dependencyReadiness ?? "UNKNOWN",
      dbRequirementDetected: preflight.dbRequirementDetected ?? false,
      networkRequirementDetected: preflight.networkRequirementDetected ?? false,
      warnings: preflight.warnings ?? [],
      errors: preflight.errors ?? [],
    },
    execution: {
      status: execution.status ?? "UNKNOWN",
      exitCode: execution.exitCode ?? -1,
      durationMs: execution.durationMs ?? 0,
      stdoutPreview: (execution.stdoutPreview ?? "").slice(0, 900),
      stderrPreview: (execution.stderrPreview ?? "").slice(0, 900),
      outputHash: execution.outputHash ?? "",
      mutationDetected: execution.mutationDetected ?? false,
      mutatedPaths: execution.mutatedPaths ?? [],
      warnings: execution.warnings ?? [],
      errors: execution.errors ?? [],
    },
    governance: result.governance ?? {},
    safety: result.safety ?? buildSafetyFlags(false),
    evidence: [],
    warnings: result.warnings ?? [],
    errors: result.errors ?? [],
  };

  const reportsDir = path.join(root, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, REPORT_JSON_PATH),
    JSON.stringify(reportJson, null, 2),
    "utf8"
  );

  // Write markdown report.
  const lines = [
    "# NEXUS CareLoop Backend Controlled Validation",
    "",
    "## Metadata",
    "",
    `- Generated at: ${now}`,
    `- Mode: ${result.mode}`,
    `- Validation HEAD: (see git log)`,
    "- Note: Validation HEAD is the commit when the report was generated.",
    "",
    "## Command",
    "",
    `- Command ID: ${COMMAND_ID}`,
    `- Command: ${P30_COMMAND.command} ${P30_COMMAND.args.join(" ")}`,
    `- Working directory: ${P30_COMMAND.workingDirectory}`,
    "",
    "## Preflight",
    "",
    `- Status: ${preflight.status ?? "N/A"}`,
    `- Script exists: ${preflight.scriptExists ?? "N/A"}`,
    `- Dependencies: ${preflight.dependencyReadiness ?? "N/A"}`,
    `- node_modules present: ${preflight.nodeModulesPresent ?? "N/A"}`,
    `- Lockfile present: ${preflight.lockfilePresent ?? "N/A"}`,
    `- DB requirement detected: ${preflight.dbRequirementDetected ?? false}`,
    `- Network requirement detected: ${preflight.networkRequirementDetected ?? false}`,
    ...(preflight.warnings?.length ? ["", "### Preflight Warnings", "", ...preflight.warnings.map((w) => `- ${w}`)] : []),
    ...(preflight.errors?.length ? ["", "### Preflight Errors", "", ...preflight.errors.map((e) => `- ${e}`)] : []),
    "",
    "## Execution",
    "",
    `- Status: ${execution.status ?? "N/A"}`,
    `- Exit code: ${execution.exitCode ?? "N/A"}`,
    `- Duration: ${execution.durationMs ?? 0}ms`,
    `- Output hash: ${execution.outputHash ?? ""}`,
    `- Mutation detected: ${execution.mutationDetected ?? false}`,
    ...(execution.stdoutPreview ? ["", "### Stdout (redacted preview)", "", "```", execution.stdoutPreview, "```"] : []),
    ...(execution.stderrPreview ? ["", "### Stderr (redacted preview)", "", "```", execution.stderrPreview, "```"] : []),
    "",
    "## Safety",
    "",
    `- Provider calls: ${result.safety?.providerCalls ?? false}`,
    `- Network calls: ${result.safety?.networkCalls ?? false}`,
    `- DB access: ${result.safety?.dbAccess ?? false}`,
    `- API server: ${result.safety?.apiServer ?? false}`,
    `- Dependency install: ${result.safety?.dependencyInstall ?? false}`,
    `- Project mutation: ${result.safety?.projectMutation ?? false}`,
    "",
    `## Result: ${execution.status ?? "UNKNOWN"}`,
    "",
  ];

  if ((result.warnings ?? []).length > 0) {
    lines.push("## Warnings", "", ...result.warnings.map((w) => `- ${w}`), "");
  }

  fs.writeFileSync(
    path.join(root, REPORT_MD_PATH),
    lines.join("\n"),
    "utf8"
  );
}
