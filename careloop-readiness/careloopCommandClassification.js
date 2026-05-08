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

const INVENTORY_PATH = "reports/careloop-inventory.json";
const VALIDATION_PLAN_PATH = "reports/careloop-validation-plan.json";
const CONTRACT_DIR = "contracts/careloop";
const CONTRACT_FILE = "contracts/careloop/backend-command-classification-contract.json";
const REPORT_MD_PATH = "reports/careloop-command-classification.md";
const REPORT_JSON_PATH = "reports/careloop-command-classification.json";

// Abstract IDs for write-guarded runtime files — must not contain "careloop".
const RUNTIME_PROJECT_ID = "private-project-01";
const RUNTIME_TASK_ID = "pvt-backend-cmd-classification";

// High-risk script name patterns for unknown scripts.
const HIGH_RISK_NAME_PATTERN =
  /deploy|migrat|seed|reset|start|dev|server|db|prisma|studio|watch/i;

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

export function loadCareLoopInventorySnapshot(mode) {
  const result = readJsonSafe(INVENTORY_PATH);
  if (result.ok && result.data) {
    return result.data;
  }
  return null;
}

export function loadCareLoopValidationPlan(mode) {
  const result = readJsonSafe(VALIDATION_PLAN_PATH);
  if (result.ok && result.data) {
    return result.data;
  }
  return null;
}

// Return classification record for a single backend script name.
export function classifyCareLoopBackendCommand(command) {
  const name = typeof command === "string" ? command.trim() : "";

  switch (name) {
    case "dev":
      return {
        name,
        category: "blocked_for_now",
        riskLevel: "high",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Starts server process; long-running and requires DB and full dependency stack.",
      };

    case "start":
      return {
        name,
        category: "blocked_for_now",
        riskLevel: "high",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Starts runtime process; requires full dependency and DB stack.",
      };

    case "migrate":
      return {
        name,
        category: "requires_db",
        riskLevel: "critical",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Database schema mutation risk; must never run without explicit DB readiness approval.",
      };

    case "generate":
      return {
        name,
        category: "requires_dependency_install",
        riskLevel: "medium",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: false,
        requiresDb: false,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "P31",
        reason: "Likely Prisma client generation; safe when dependencies are installed but must be verified first.",
      };

    case "studio":
      return {
        name,
        category: "blocked_for_now",
        riskLevel: "high",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Starts local UI/server and accesses DB; blocked until DB readiness is approved.",
      };

    case "qa:reset":
      return {
        name,
        category: "requires_db",
        riskLevel: "critical",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Likely destructive database reset operation; must never run without explicit approval.",
      };

    case "qa:seed:sprint1":
      return {
        name,
        category: "requires_db",
        riskLevel: "high",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: true,
        requiresDb: true,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Writes seed data to DB; blocked until DB readiness and approval gate.",
      };

    case "test":
      return {
        name,
        category: "safe_to_run_later",
        riskLevel: "medium",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: false,
        requiresDb: false,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "P30",
        reason: "Safest validation candidate; no DB or network required. P30 must first verify dependency availability and command allowlist.",
      };

    case "test:watch":
      return {
        name,
        category: "blocked_for_now",
        riskLevel: "medium",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: false,
        requiresDb: false,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: "Long-running watch mode; not suitable for governed single-run execution.",
      };

    default: {
      const needsApproval = HIGH_RISK_NAME_PATTERN.test(name);
      return {
        name,
        category: "safe_to_inspect",
        riskLevel: "medium",
        executionAllowedNow: false,
        mutationAllowed: false,
        requiresApproval: needsApproval,
        requiresDb: false,
        requiresNetwork: false,
        requiresDependencyInstall: true,
        recommendedPhase: "later",
        reason: `Unknown script; requires manual review before controlled execution.${needsApproval ? " High-risk name pattern detected." : ""}`,
      };
    }
  }
}

export function classifyCareLoopBackendCommands(snapshot) {
  const scripts = snapshot?.backendPackage?.scripts ?? [];
  return scripts.map(classifyCareLoopBackendCommand);
}

export function recommendFirstControlledValidationCommand(classifications) {
  const list = Array.isArray(classifications) ? classifications : [];

  // Priority 1: test — no DB/network, safe_to_run_later
  const testCmd = list.find((c) => c.name === "test" && c.category === "safe_to_run_later");
  if (testCmd) {
    return {
      command: "test",
      phase: "P30",
      reason:
        "Existing test script is the safest validation candidate; no DB or network requirement detected.",
      preconditions: [
        "dependencies are installed or install is explicitly approved",
        "command allowlist permits npm test",
        "no DB/network requirement detected",
        "execution is run through controlled local execution path",
        "output is captured as evidence",
        "no project mutation",
      ],
    };
  }

  // Priority 2: generate — if non-destructive and dependency-ready
  const generateCmd = list.find(
    (c) => c.name === "generate" && c.category !== "blocked_for_now"
  );
  if (generateCmd) {
    return {
      command: "generate",
      phase: "P31",
      reason:
        "Prisma client generation is the safest option when test is unavailable; requires dependency verification first.",
      preconditions: [
        "dependencies are installed",
        "Prisma schema is present and validated",
        "command allowlist permits npx prisma generate or npm run generate",
        "no DB connection required for client generation",
      ],
    };
  }

  // Fallback
  return {
    command: "package-script-review",
    phase: "later",
    reason: "No safe execution candidate found; manual package script review required first.",
    preconditions: [
      "all scripts are manually reviewed and classified",
      "dependency installation is approved",
    ],
  };
}

function buildSummary(classifications) {
  const summary = {
    total: classifications.length,
    safeToInspect: 0,
    safeToRunLater: 0,
    requiresApproval: 0,
    requiresDb: 0,
    requiresNetwork: 0,
    requiresDependencyInstall: 0,
    blockedForNow: 0,
  };
  for (const c of classifications) {
    if (c.category === "safe_to_inspect") summary.safeToInspect++;
    if (c.category === "safe_to_run_later") summary.safeToRunLater++;
    if (c.requiresApproval) summary.requiresApproval++;
    if (c.requiresDb) summary.requiresDb++;
    if (c.requiresNetwork) summary.requiresNetwork++;
    if (c.requiresDependencyInstall) summary.requiresDependencyInstall++;
    if (c.category === "blocked_for_now" || c.category === "requires_db") summary.blockedForNow++;
  }
  return summary;
}

function createTaskContract(snapshot) {
  return {
    contractVersion: "1.0",
    contractType: "task",
    projectId: "careloop",
    privateProject: true,
    mode: "local-private",
    taskId: "careloop-backend-command-classification",
    title: "Classify CareLoop backend validation commands for controlled execution",
    objective:
      "Classify existing backend package scripts by execution safety without running them.",
    sourceAgent: "shepherd",
    targetAgent: "auditor",
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    dataClassification: "confidential",
    mutationAllowed: false,
    executionAllowed: false,
    buildExecutionAllowed: false,
    testExecutionAllowed: false,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    dbAccessAllowed: false,
    allowedRoots: ["projects/careloop"],
    forbiddenActions: [
      "modify private project source files",
      "run npm install",
      "run npm test",
      "run Prisma commands",
      "start server",
      "start studio",
      "call providers",
      "call network",
      "access DB",
      "read .env",
    ],
    acceptanceCriteria: [
      "Backend package scripts are classified",
      "No backend commands are executed",
      "No private project files are modified",
      "No provider/API/DB/network calls are made",
      "Recommended first controlled validation command is identified",
      "Evidence and audit records are redacted and linked",
    ],
    requiredEvidence: [
      "careloop_inventory_snapshot",
      "careloop_validation_plan",
      "command_classification_artifact",
      "local_task_record",
      "audit_event",
      "runtime_event",
    ],
    createdAt: new Date().toISOString(),
  };
}

function runLocalTaskPath(mode, warnings) {
  const taskRecord = {
    taskId: randomUUID(),
    projectId: RUNTIME_PROJECT_ID,
    taskType: "command_classification",
    state: "queued",
    sourceAgent: "shepherd",
    targetAgent: "auditor",
    objective: "Governed command classification task",
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    redacted: true,
    classification: "confidential",
    mutationAllowed: false,
    executionAllowed: false,
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
      evidence: [{ type: "command_classification_artifact" }],
    });

    if (!guard.allowed) {
      warnings.push(`Transition ${from}->${to} blocked: ${guard.errors?.join("; ") ?? "unknown"}`);
      break;
    }

    const updateResult = updateTaskState(taskRecord.taskId, to, {
      actor: "auditor",
      evidence: [{ type: "command_classification_artifact" }],
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

export function runCareLoopCommandClassification(options = {}) {
  const env = options.env ?? process.env;
  const mode = getNexusMode(env);
  const errors = [];
  const warnings = [];

  if (!requireAllowedMode(mode)) {
    return {
      ok: false,
      errors: [`Mode '${mode}' does not allow CareLoop command classification.`],
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

  const inventory = loadCareLoopInventorySnapshot(mode);
  if (!inventory) {
    warnings.push("Inventory snapshot not found; using empty script list.");
  }

  const validationPlan = loadCareLoopValidationPlan(mode);
  if (!validationPlan) {
    warnings.push("Validation plan not found; continuing with inventory data only.");
  }

  const classifications = classifyCareLoopBackendCommands(inventory ?? {});
  const recommendation = recommendFirstControlledValidationCommand(classifications);
  const summary = buildSummary(classifications);
  const contract = createTaskContract(inventory ?? {});

  // Route through governed local path.
  const taskResult = runLocalTaskPath(mode, warnings);

  // Append evidence — must not contain "careloop" or "CareLoop" string literals.
  appendEvidence({
    type: "careloop_backend_command_classification",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    capabilityId: "verification.code_quality_gate",
    result: "PASS",
    summary: "Backend command classification completed.",
    artifactPaths: [REPORT_MD_PATH, REPORT_JSON_PATH],
    dataClassification: "confidential",
    redacted: true,
    classification: "confidential",
  });

  appendAuditEvent({
    eventType: "careloop_command_classification_completed",
    actorId: "auditor",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    redacted: true,
    classification: "confidential",
    details: { mode, commandCount: classifications.length },
  });

  appendRuntimeEvent({
    eventType: "governed_command_classification_completed",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    mode,
    redacted: true,
    classification: "confidential",
  });

  return {
    ok: true,
    mode,
    contract,
    classifications,
    summary,
    recommendation,
    taskResult,
    safety: {
      commandsExecuted: false,
      projectMutation: false,
      providerCalls: false,
      networkCalls: false,
      dbAccess: false,
      apiServer: false,
      dependencyInstall: false,
    },
    warnings,
    errors,
  };
}

export function writeCareLoopCommandClassificationReports(result) {
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

  // Write JSON report.
  const reportJson = {
    classificationVersion: "1.0",
    mode: result.mode,
    projectId: "careloop",
    privateProject: true,
    generatedAt: now,
    readOnly: true,
    sourceArtifacts: {
      inventory: INVENTORY_PATH,
      validationPlan: VALIDATION_PLAN_PATH,
    },
    commands: result.classifications,
    summary: result.summary,
    recommendedFirstExecution: result.recommendation,
    safety: result.safety,
    evidence: [],
    warnings: result.warnings,
    errors: result.errors,
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
    "# NEXUS CareLoop Backend Command Classification",
    "",
    "## Metadata",
    "",
    `- Generated at: ${now}`,
    `- Mode: ${result.mode}`,
    `- Validation HEAD: (see git log)`,
    "- Note: Validation HEAD is the commit checked out when the report was generated.",
    "",
    "## Summary",
    "",
    `- Total commands classified: ${result.summary.total}`,
    `- Safe to inspect: ${result.summary.safeToInspect}`,
    `- Safe to run later: ${result.summary.safeToRunLater}`,
    `- Requires approval: ${result.summary.requiresApproval}`,
    `- Requires DB: ${result.summary.requiresDb}`,
    `- Requires network: ${result.summary.requiresNetwork}`,
    `- Requires dependency install: ${result.summary.requiresDependencyInstall}`,
    `- Blocked for now: ${result.summary.blockedForNow}`,
    "",
    "## Recommended First Execution",
    "",
    `- Command: ${result.recommendation.command}`,
    `- Phase: ${result.recommendation.phase}`,
    `- Reason: ${result.recommendation.reason}`,
    "",
    "### Preconditions",
    "",
    ...result.recommendation.preconditions.map((p) => `- ${p}`),
    "",
    "## Command Classifications",
    "",
    ...result.classifications.flatMap((c) => [
      `### ${c.name}`,
      "",
      `- Category: ${c.category}`,
      `- Risk level: ${c.riskLevel}`,
      `- Execution allowed now: ${c.executionAllowedNow}`,
      `- Mutation allowed: ${c.mutationAllowed}`,
      `- Requires approval: ${c.requiresApproval}`,
      `- Requires DB: ${c.requiresDb}`,
      `- Requires network: ${c.requiresNetwork}`,
      `- Requires dependency install: ${c.requiresDependencyInstall}`,
      `- Recommended phase: ${c.recommendedPhase}`,
      `- Reason: ${c.reason}`,
      "",
    ]),
    "## Safety",
    "",
    `- Commands executed: ${result.safety.commandsExecuted}`,
    `- Project mutation: ${result.safety.projectMutation}`,
    `- Provider calls: ${result.safety.providerCalls}`,
    `- Network calls: ${result.safety.networkCalls}`,
    `- DB access: ${result.safety.dbAccess}`,
    `- API server: ${result.safety.apiServer}`,
    `- Dependency install: ${result.safety.dependencyInstall}`,
    "",
  ];
  if (result.warnings.length > 0) {
    lines.push("## Warnings", "", ...result.warnings.map((w) => `- ${w}`), "");
  }
  fs.writeFileSync(
    path.join(root, REPORT_MD_PATH),
    lines.join("\n"),
    "utf8"
  );
}
