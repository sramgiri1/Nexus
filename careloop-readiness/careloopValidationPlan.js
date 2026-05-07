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

const INVENTORY_SNAPSHOT_PATH = "reports/careloop-inventory.json";
const CONTRACT_DIR = "contracts/careloop";
const CONTRACT_FILE = "contracts/careloop/backend-validation-task-contract.json";
const PLAN_MD_PATH = "reports/careloop-validation-plan.md";
const PLAN_JSON_PATH = "reports/careloop-validation-plan.json";

// Generic identifiers used in write-guarded runtime files.
const RUNTIME_PROJECT_ID = "private-project-01";
const RUNTIME_TASK_ID = "pvt-backend-validation-plan";

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

function loadInventorySnapshot(mode) {
  const result = readJsonSafe(INVENTORY_SNAPSHOT_PATH);
  if (result.ok && result.data) {
    return result.data;
  }
  return null;
}

export function createCareLoopBackendValidationTaskContract(snapshot) {
  const now = new Date().toISOString();
  const backendScripts = snapshot?.backendPackage?.scripts ?? [];
  const backendStructure = snapshot?.backendStructure ?? {};

  return {
    contractVersion: "1.0",
    contractType: "task",
    projectId: "careloop",
    privateProject: true,
    mode: "local-private",
    taskId: "careloop-backend-validation-plan",
    title: "Create CareLoop backend validation plan through NEXUS",
    objective:
      "Create a governed validation plan for the existing CareLoop backend without mutating project files or running build/test commands.",
    sourceAgent: "nexus",
    targetAgent: "shepherd",
    capabilityId: "orchestration.plan_flow",
    riskLevel: "medium",
    dataClassification: "confidential",
    mutationAllowed: false,
    buildExecutionAllowed: false,
    testExecutionAllowed: false,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    dbAccessAllowed: false,
    allowedRoots: ["projects/careloop"],
    forbiddenActions: [
      "modify CareLoop source files",
      "run npm install",
      "run npm test",
      "run Prisma commands",
      "call providers",
      "call network",
      "start API server",
      "access DB",
      "read .env",
    ],
    acceptanceCriteria: [
      "CareLoop backend validation plan is created",
      "No CareLoop files are modified",
      "No build/test commands are executed",
      "No provider/API/DB/network calls are made",
      "Task enters local runtime state through guarded NEXUS path",
      "Evidence and audit records are redacted and linked",
    ],
    requiredEvidence: [
      "careloop_inventory_snapshot",
      "validation_plan_artifact",
      "local_task_record",
      "audit_event",
      "runtime_event",
    ],
    observedBackendScripts: backendScripts,
    observedBackendStructure: backendStructure,
    createdAt: now,
  };
}

export function buildCareLoopBackendValidationPlan(snapshot) {
  const now = new Date().toISOString();
  const backendScripts = snapshot?.backendPackage?.scripts ?? [];
  const backendStructure = snapshot?.backendStructure ?? {};
  const backendReadiness = snapshot?.readiness?.backend?.status ?? "UNKNOWN";

  return {
    planVersion: "1.0",
    projectId: "careloop",
    privateProject: true,
    mode: "local-private",
    createdAt: now,
    ownerAgent: "shepherd",
    capabilityId: "orchestration.plan_flow",
    mutationAllowed: false,
    executionAllowed: false,
    backend: {
      readiness: backendReadiness,
      observedScripts: backendScripts,
      observedStructure: backendStructure,
    },
    validationPlan: {
      safeNextChecks: [
        {
          id: "backend-package-script-review",
          description:
            "Review available backend package scripts and classify which can run later under NEXUS.",
          executionNow: false,
          riskLevel: "low",
        },
        {
          id: "prisma-schema-validation-candidate",
          description:
            "Plan future Prisma schema validation without reading schema contents in this phase.",
          executionNow: false,
          riskLevel: "medium",
        },
        {
          id: "backend-test-command-candidate",
          description:
            "Plan future backend test execution after command allowlist and dependency readiness are checked.",
          executionNow: false,
          riskLevel: "medium",
        },
      ],
      requiredFutureApprovals: [],
      requiredFutureEvidence: [
        "package_script_classification",
        "prisma_validation_result",
        "backend_test_result",
        "audit_event",
        "command_allowlist_decision",
      ],
      blockedNow: [
        "source mutation",
        "dependency install",
        "test execution",
        "database access",
        "provider calls",
        "network calls",
      ],
    },
    recommendedNextTask: {
      title: "Classify CareLoop backend validation commands for controlled execution",
      agent: "AUDITOR",
      capabilityId: "verification.code_quality_gate",
      riskLevel: "medium",
      mutationAllowed: false,
      executionAllowed: false,
    },
    safety: {
      providerCalls: false,
      projectMutation: false,
      buildExecuted: false,
      testExecuted: false,
      dbAccess: false,
      apiServer: false,
    },
    evidence: [],
    warnings: [],
    errors: [],
  };
}

function runLocalTaskPath(mode, warnings) {
  const taskId = randomUUID();
  const taskRecord = {
    taskId,
    projectId: RUNTIME_PROJECT_ID,
    sourceAgent: "nexus",
    targetAgent: "shepherd",
    taskType: "validation_planning",
    objective: "Governed validation planning task",
    state: "queued",
    riskLevel: "medium",
    capabilityId: "orchestration.plan_flow",
    blocking: false,
    dependsOn: [],
    redacted: true,
  };

  const addResult = addTask(taskRecord);
  if (!addResult.ok) {
    warnings.push(`Task add failed: ${addResult.errors.join("; ")}`);
    return { taskId: null, finalState: null, transitions: [], warnings: addResult.warnings };
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
      taskId,
      fromState: from,
      toState: to,
      actor: "shepherd",
      evidence: [{ type: "validation_plan_artifact" }],
    });

    if (!guard.allowed) {
      warnings.push(`Transition ${from}->${to} blocked: ${guard.errors?.join("; ") ?? "unknown"}`);
      break;
    }

    const updateResult = updateTaskState(taskId, to, {
      actor: "shepherd",
      evidence: [{ type: "validation_plan_artifact" }],
    });

    if (!updateResult.ok) {
      warnings.push(`State update ${from}->${to} failed: ${updateResult.errors.join("; ")}`);
      break;
    }

    transitions.push({ from, to, allowed: true });
    currentState = to;
  }

  return { taskId, finalState: currentState, transitions, warnings: [] };
}

function appendSafeRecords(mode) {
  const evidenceIds = [];
  const auditIds = [];
  const errors = [];

  try {
    const evResult = appendEvidence({
      type: "validation_planning_completed",
      result: "PASS",
      summary: "Governed validation planning task completed",
      classification: "confidential",
      redacted: true,
      metadata: { mode, phase: "p28" },
    });
    if (evResult?.record?.evidenceId) {
      evidenceIds.push(evResult.record.evidenceId);
    }
  } catch (err) {
    errors.push(`Evidence append failed: ${err.message}`);
  }

  try {
    const auditResult = appendAuditEvent({
      eventType: "validation_plan_created",
      actorId: "shepherd",
      actorType: "agent",
      summary: "Governed validation planning task completed",
      classification: "confidential",
      redacted: true,
      metadata: { mode, phase: "p28" },
    });
    if (auditResult?.record?.auditId) {
      auditIds.push(auditResult.record.auditId);
    }
  } catch (err) {
    errors.push(`Audit append failed: ${err.message}`);
  }

  try {
    appendRuntimeEvent({
      eventType: "governed_validation_planning_completed",
      projectId: RUNTIME_PROJECT_ID,
      taskId: RUNTIME_TASK_ID,
      agentId: "shepherd",
      runtime: "local",
      summary: "Governed validation planning completed",
      redacted: true,
    });
  } catch (err) {
    errors.push(`Runtime event append failed: ${err.message}`);
  }

  return { evidenceIds, auditIds, errors };
}

export function runCareLoopGovernedValidationPlanning(options = {}) {
  const mode = getNexusMode({ NEXUS_MODE: options.mode ?? process.env.NEXUS_MODE });
  const warnings = [];
  const errors = [];

  if (!requireAllowedMode(mode)) {
    return {
      ok: false,
      mode,
      contract: null,
      plan: null,
      taskRecord: null,
      evidenceIds: [],
      auditIds: [],
      warnings,
      errors: [`Mode '${mode}' does not allow CareLoop validation planning.`],
    };
  }

  const access = validatePrivateProjectAccess({
    projectId: "careloop",
    relativePath: "projects/careloop",
    mode,
    purpose: "read",
    actor: options.actor ?? "system",
  });

  if (!access.allowed) {
    return {
      ok: false,
      mode,
      contract: null,
      plan: null,
      taskRecord: null,
      evidenceIds: [],
      auditIds: [],
      warnings,
      errors: [`Access denied: ${access.reason}`],
    };
  }

  const inventorySnapshot = loadInventorySnapshot(mode);
  if (!inventorySnapshot) {
    warnings.push("P27 inventory snapshot not found — proceeding without cached backend details.");
  }

  const contract = createCareLoopBackendValidationTaskContract(inventorySnapshot);
  const plan = buildCareLoopBackendValidationPlan(inventorySnapshot);

  const taskPath = runLocalTaskPath(mode, warnings);
  if (!taskPath.taskId) {
    warnings.push("Local task record could not be created — continuing without task state.");
  }
  warnings.push(...(taskPath.warnings ?? []));

  const safeRecords = appendSafeRecords(mode);
  errors.push(...safeRecords.errors);

  return {
    ok: errors.length === 0,
    mode,
    contract,
    plan,
    taskRecord: { taskId: taskPath.taskId, finalState: taskPath.finalState, transitions: taskPath.transitions },
    evidenceIds: safeRecords.evidenceIds,
    auditIds: safeRecords.auditIds,
    warnings,
    errors,
  };
}

export function writeCareLoopValidationPlanReports(result) {
  const root = getRepoRoot();
  const contractDir = path.join(root, CONTRACT_DIR);
  const planMdPath = path.join(root, PLAN_MD_PATH);
  const planJsonPath = path.join(root, PLAN_JSON_PATH);

  fs.mkdirSync(contractDir, { recursive: true });
  fs.mkdirSync(path.dirname(planMdPath), { recursive: true });

  if (result.contract) {
    fs.writeFileSync(
      path.join(root, CONTRACT_FILE),
      JSON.stringify(result.contract, null, 2),
      "utf8"
    );
  }

  const plan = result.plan ?? {};
  const contract = result.contract ?? {};
  const taskRecord = result.taskRecord ?? {};
  const safeChecks = plan.validationPlan?.safeNextChecks ?? [];
  const nextTask = plan.recommendedNextTask ?? {};
  const backendScripts = plan.backend?.observedScripts ?? [];

  const mdLines = [
    "# CareLoop Governed Validation Plan",
    "",
    "## Metadata",
    "",
    `- Generated at: ${plan.createdAt ?? new Date().toISOString()}`,
    `- Mode: ${result.mode}`,
    `- Phase: P28-LOCAL`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    "## Task Contract",
    "",
    `- Task ID: ${contract.taskId ?? "N/A"}`,
    `- Title: ${contract.title ?? "N/A"}`,
    `- Source agent: ${contract.sourceAgent ?? "N/A"}`,
    `- Target agent: ${contract.targetAgent ?? "N/A"}`,
    `- Capability: ${contract.capabilityId ?? "N/A"}`,
    `- Risk level: ${contract.riskLevel ?? "N/A"}`,
    `- Mutation allowed: ${contract.mutationAllowed ?? false}`,
    `- Build execution allowed: ${contract.buildExecutionAllowed ?? false}`,
    `- Provider calls allowed: ${contract.providerCallsAllowed ?? false}`,
    "",
    "## Backend Inventory Summary",
    "",
    `- Readiness: ${plan.backend?.readiness ?? "UNKNOWN"}`,
    `- Observed scripts: ${backendScripts.join(", ") || "(none)"}`,
    `- src: ${plan.backend?.observedStructure?.src ?? false}`,
    `- tests: ${plan.backend?.observedStructure?.tests ?? false}`,
    `- prisma: ${plan.backend?.observedStructure?.prisma ?? false}`,
    "",
    "## Validation Plan",
    "",
    "Safe next checks (none execute now):",
    ...safeChecks.map((c) => `- [${c.id}] ${c.description} (risk: ${c.riskLevel})`),
    "",
    "Blocked now:",
    ...(plan.validationPlan?.blockedNow ?? []).map((b) => `- ${b}`),
    "",
    "## Local Task Record",
    "",
    `- Task ID (runtime): ${taskRecord.taskId ?? "N/A"}`,
    `- Final state: ${taskRecord.finalState ?? "N/A"}`,
    `- Transitions: ${(taskRecord.transitions ?? []).map((t) => `${t.from}->${t.to}`).join(", ") || "(none)"}`,
    "",
    "## Recommended Next Task",
    "",
    `- Title: ${nextTask.title ?? "N/A"}`,
    `- Agent: ${nextTask.agent ?? "N/A"}`,
    `- Capability: ${nextTask.capabilityId ?? "N/A"}`,
    `- Risk level: ${nextTask.riskLevel ?? "N/A"}`,
    `- Mutation allowed: ${nextTask.mutationAllowed ?? false}`,
    "",
    "## Safety Flags",
    "",
    `- Provider calls: ${plan.safety?.providerCalls ?? false}`,
    `- Project mutation: ${plan.safety?.projectMutation ?? false}`,
    `- Build executed: ${plan.safety?.buildExecuted ?? false}`,
    `- Test executed: ${plan.safety?.testExecuted ?? false}`,
    `- DB access: ${plan.safety?.dbAccess ?? false}`,
    `- API server: ${plan.safety?.apiServer ?? false}`,
    "",
    "## Warnings",
    "",
    ...(result.warnings.length ? result.warnings.map((w) => `- ${w}`) : ["- None"]),
    "",
    `Result: ${result.errors.length === 0 ? "PASS" : "FAIL"}`,
    "",
  ];

  fs.writeFileSync(planMdPath, mdLines.join("\n"), "utf8");

  const safeJson = {
    planVersion: plan.planVersion ?? "1.0",
    projectId: plan.projectId ?? "careloop",
    privateProject: plan.privateProject ?? true,
    mode: result.mode,
    createdAt: plan.createdAt ?? new Date().toISOString(),
    ownerAgent: plan.ownerAgent ?? "shepherd",
    capabilityId: plan.capabilityId ?? "orchestration.plan_flow",
    mutationAllowed: plan.mutationAllowed ?? false,
    executionAllowed: plan.executionAllowed ?? false,
    backend: plan.backend ?? {},
    validationPlan: plan.validationPlan ?? {},
    recommendedNextTask: plan.recommendedNextTask ?? {},
    safety: plan.safety ?? {},
    taskRecord,
    evidenceIds: result.evidenceIds,
    auditIds: result.auditIds,
    warnings: result.warnings,
    errors: result.errors,
  };

  fs.writeFileSync(planJsonPath, JSON.stringify(safeJson, null, 2), "utf8");

  return {
    contractPath: CONTRACT_FILE,
    planMdPath: PLAN_MD_PATH,
    planJsonPath: PLAN_JSON_PATH,
  };
}
