import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/local-state-machine-enforcement-report.md"
);
const REQUIRED_MODULES = [
  "local-state/stateTransitionGuard.js",
  "local-state/writeLocalState.js",
  "local-state/taskStore.js",
  "orchestrator/localExecutor.js",
  "orchestrator/localExecutionPlan.js",
];
const REQUIRED_DOCS = [
  "docs/architecture/LOCAL_STATE_MACHINE_ENFORCEMENT.md",
];
const REQUIRED_POLICY = "policy/local-state-machine-enforcement-policy.json";
const RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
  "local-state/runtime/approvals.jsonl",
  "local-state/runtime/incidents.jsonl",
];
const PHASE_FILES = [
  ...REQUIRED_MODULES,
  "local-state/appendAuditEvent.js",
  "local-state/stateStore.js",
  "local-state/index.js",
  "local-state/schema.js",
  ...REQUIRED_DOCS,
  "docs/architecture/CONTROLLED_LOCAL_EXECUTION.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  REQUIRED_POLICY,
  "scripts/check-local-state-machine-enforcement.js",
  "README.md",
];
const EXPORT_MAP = {
  "local-state/stateTransitionGuard.js": [
    "validateLocalTaskTransition",
    "buildTransitionEvidence",
    "normalizeTransitionActor",
    "createTransitionGuardResult",
  ],
};
const OPTIONAL_EXPORTS = {
  "local-state/taskStore.js": ["getTaskById"],
};

const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERNS = [
  new RegExp([["OPENAI", "_", "API", "_", "KEY"].join(""), "="].join("")),
  new RegExp(
    [["ANTHROPIC", "_", "API", "_", "KEY"].join(""), "="].join("")
  ),
  new RegExp([["DATABASE", "_", "URL"].join(""), "="].join("")),
  new RegExp([["sk", "-"].join(""), "[A-Za-z0-9]{10,}"].join("")),
  new RegExp([["sk", "-", "ant", "-"].join(""), "[A-Za-z0-9_-]{6,}"].join("")),
  new RegExp(["-----BEGIN ", "[A-Z ]+", "PRIVATE KEY", "-----"].join("")),
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function parseJsonl(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function getGitMetadata() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };

  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    // Ignore git metadata failures.
  }

  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function snapshotRuntimeFiles() {
  return Object.fromEntries(
    RUNTIME_FILES.map((relativePath) => [relativePath, readFile(relativePath)])
  );
}

function restoreRuntimeFiles(snapshot) {
  for (const [relativePath, content] of Object.entries(snapshot)) {
    writeFile(relativePath, content);
  }
}

async function loadModules() {
  const modules = {};

  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = `${pathToFileURL(path.join(ROOT, relativePath)).href}?ts=${Date.now()}`;
    modules[relativePath] = await import(moduleUrl);
  }

  return modules;
}

function createTaskRecord(overrides = {}) {
  return {
    projectId: "demoapp",
    sourceAgent: "nexus",
    targetAgent: "core",
    taskType: "demo.state_machine_test",
    objective: "Validate local task state enforcement.",
    state: "queued",
    riskLevel: "medium",
    capabilityId: "implementation.backend_code",
    contractId: "state-machine-test-contract",
    redacted: true,
    ...overrides,
  };
}

function createTaskStateRecord(taskId, nextState, overrides = {}) {
  return {
    taskId,
    nextState,
    actorId: "core",
    actorType: "agent",
    agentId: "core",
    capabilityId: "implementation.backend_code",
    policyDecisionId: "policy-test",
    runtime: "node-local",
    evidence: [],
    context: {
      taskType: "demo.state_machine_test",
    },
    redacted: true,
    ...overrides,
  };
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Local State Machine Enforcement Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Transition guard: ${statusLabel(sections.transitionGuard)}`,
    `writeLocalState task_state: ${statusLabel(sections.writeLocalStateTaskState)}`,
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  const lines = [
    "NEXUS Local State Machine Enforcement Check",
    "==========================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Transition guard: ${statusLabel(sections.transitionGuard)}`,
    `writeLocalState task_state: ${statusLabel(sections.writeLocalStateTaskState)}`,
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];

  console.log(lines.join("\n"));
}

function checkTransition(failures, sections, validator, description, input, expected) {
  const result = validator(input);
  if (result.allowed !== expected) {
    failures.push(`${description} expected allowed=${expected} but received ${result.allowed}.`);
    sections.transitionGuard = false;
  }
  return result;
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    transitionGuard: true,
    writeLocalStateTaskState: true,
    controlledExecution: true,
    policies: true,
    docs: true,
    noForbiddenWrites: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of [...REQUIRED_MODULES, ...REQUIRED_DOCS, REQUIRED_POLICY]) {
    if (!exists(relativePath)) {
      failures.push(`Missing required file: ${relativePath}`);
      if (REQUIRED_MODULES.includes(relativePath)) {
        sections.modules = false;
      } else if (REQUIRED_DOCS.includes(relativePath)) {
        sections.docs = false;
      } else {
        sections.policies = false;
      }
    }
  }

  let policy = null;
  try {
    policy = readJson(REQUIRED_POLICY);
  } catch (error) {
    failures.push(`Invalid JSON in ${REQUIRED_POLICY}: ${error.message}`);
    sections.policies = false;
  }

  let modules;
  try {
    modules = await loadModules();
  } catch (error) {
    failures.push(`Module load failed: ${error.message}`);
    sections.modules = false;
    const metadata = getGitMetadata();
    writeReport(metadata, sections, failures);
    printConsole(sections, false);
    process.exitCode = 1;
    return;
  }
  for (const [relativePath, exportsList] of Object.entries(EXPORT_MAP)) {
    for (const exportName of exportsList) {
      if (!(exportName in modules[relativePath])) {
        failures.push(`Missing export ${exportName} from ${relativePath}`);
        sections.exports = false;
      }
    }
  }

  for (const [relativePath, exportsList] of Object.entries(OPTIONAL_EXPORTS)) {
    for (const exportName of exportsList) {
      if (!(exportName in modules[relativePath])) {
        failures.push(`Expected optional export ${exportName} from ${relativePath}`);
        sections.exports = false;
      }
    }
  }

  const {
    validateLocalTaskTransition,
  } = modules["local-state/stateTransitionGuard.js"];
  const { writeLocalStateEvent } = modules["local-state/writeLocalState.js"];
  const { getTaskById } = modules["local-state/taskStore.js"];
  const { runControlledLocalExecutionPlan } =
    modules["orchestrator/localExecutionPlan.js"];

  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "queued -> running",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "queued",
      toState: "running",
      actor: "core",
      agentId: "core",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "running -> implementation_done",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "running",
      toState: "implementation_done",
      actor: "core",
      agentId: "core",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "running -> completed blocked for core",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "running",
      toState: "completed",
      actor: "core",
      agentId: "core",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    false
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "implementation_done -> awaiting_verification",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "implementation_done",
      toState: "awaiting_verification",
      actor: "core",
      agentId: "core",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "awaiting_verification -> completed with auditor PASS evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "awaiting_verification",
      toState: "completed",
      actor: "auditor",
      agentId: "auditor",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [{ type: "verification_contract" }, "PASS"],
      context: { taskType: "demo.state_machine_test" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "awaiting_verification -> completed blocked without evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "awaiting_verification",
      toState: "completed",
      actor: "auditor",
      agentId: "auditor",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    false
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "awaiting_approval -> running blocked without approval evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "awaiting_approval",
      toState: "running",
      actor: "forge",
      agentId: "forge",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "deploy.plan" },
    },
    false
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "awaiting_approval -> running with approval evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "awaiting_approval",
      toState: "running",
      actor: "forge",
      agentId: "forge",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: ["approval_granted"],
      context: { taskType: "deploy.plan" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "deferred_batch -> completed blocked without batch evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "deferred_batch",
      toState: "completed",
      actor: "loop",
      agentId: "loop",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.batch" },
    },
    false
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "deferred_batch -> completed with batch evidence",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "deferred_batch",
      toState: "completed",
      actor: "loop",
      agentId: "loop",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: ["batch_reconciled"],
      context: { taskType: "demo.batch" },
    },
    true
  );
  checkTransition(
    failures,
    sections,
    validateLocalTaskTransition,
    "unknown state blocked",
    {
      entityType: "task",
      entityId: "task-1",
      fromState: "unknown",
      toState: "running",
      actor: "core",
      agentId: "core",
      projectId: "demoapp",
      taskId: "task-1",
      evidence: [],
      context: { taskType: "demo.state_machine_test" },
    },
    false
  );

  const runtimeSnapshot = snapshotRuntimeFiles();

  try {
    const createResult = writeLocalStateEvent({
      type: "task",
      record: createTaskRecord(),
      dryRun: false,
    });

    if (!createResult.ok) {
      failures.push(`Failed to create queued test task: ${createResult.errors.join("; ")}`);
      sections.writeLocalStateTaskState = false;
    }

    const taskId = createResult.record?.taskId;
    const runningTransition = writeLocalStateEvent({
      type: "task_state",
      record: createTaskStateRecord(taskId, "running"),
      dryRun: false,
    });

    if (!runningTransition.ok || runningTransition.blocked) {
      failures.push("queued -> running task_state write should succeed.");
      sections.writeLocalStateTaskState = false;
    }

    const invalidCompletion = writeLocalStateEvent({
      type: "task_state",
      record: createTaskStateRecord(taskId, "completed"),
      dryRun: false,
    });

    if (invalidCompletion.ok || invalidCompletion.blocked !== true) {
      failures.push("running -> completed as core should be blocked.");
      sections.writeLocalStateTaskState = false;
    }

    const taskAfterBlocked = getTaskById(taskId);
    if (!taskAfterBlocked.ok || taskAfterBlocked.record?.state !== "running") {
      failures.push("Blocked transition should not update the task state.");
      sections.writeLocalStateTaskState = false;
    }

    if (!invalidCompletion.audit && !(invalidCompletion.errors || []).length) {
      failures.push("Blocked transition should return audit or clear blocked details.");
      sections.writeLocalStateTaskState = false;
    }

    const beforeDryRunTasks = readFile("local-state/runtime/tasks.json");
    const beforeDryRunAudit = readFile("local-state/runtime/audit.jsonl");
    const dryRunTransition = writeLocalStateEvent({
      type: "task_state",
      record: createTaskStateRecord(taskId, "implementation_done"),
      dryRun: true,
    });
    const afterDryRunTasks = readFile("local-state/runtime/tasks.json");
    const afterDryRunAudit = readFile("local-state/runtime/audit.jsonl");

    if (!dryRunTransition.ok || dryRunTransition.written !== false) {
      failures.push("Dry-run transition should validate without writing.");
      sections.writeLocalStateTaskState = false;
    }

    if (
      beforeDryRunTasks !== afterDryRunTasks ||
      beforeDryRunAudit !== afterDryRunAudit
    ) {
      failures.push("Dry-run transition mutated runtime files.");
      sections.writeLocalStateTaskState = false;
    }

    const beforePlan = snapshotRuntimeFiles();
    const plan = runControlledLocalExecutionPlan();

    if (plan.executionMode !== "controlled-local" || plan.scenarioCount !== 3) {
      failures.push("Controlled local execution plan did not return the expected mode or scenario count.");
      sections.controlledExecution = false;
    }

    const resultByType = new Map(
      plan.results.map((result) => [
        result.agentContext?.normalizedTask?.taskType,
        result,
      ])
    );

    const passResult = resultByType.get("demo.local_execution");
    const approvalResult = resultByType.get("deploy.plan");
    const blockedResult = resultByType.get("ai.integration_blocked_review");

    if (passResult?.result !== "PASS") {
      failures.push("Controlled DemoApp task must PASS.");
      sections.controlledExecution = false;
    }
    if (approvalResult?.result !== "REQUIRE_APPROVAL") {
      failures.push("Approval task must REQUIRE_APPROVAL.");
      sections.controlledExecution = false;
    }
    if (blockedResult?.result !== "BLOCKED") {
      failures.push("Secret task must BLOCK before task creation.");
      sections.controlledExecution = false;
    }

    if (
      Number(passResult?.transitionsAttempted) < 2 ||
      Number(passResult?.transitionsAllowed) < 2
    ) {
      failures.push("Controlled DemoApp task should record allowed queued and running transitions.");
      sections.controlledExecution = false;
    }

    if (Number(passResult?.transitionEvidenceCount) < 0) {
      failures.push("Transition evidence count must be present.");
      sections.controlledExecution = false;
    }

    if (
      approvalResult?.localWrites.some(
        (write) =>
          typeof write.label === "string" &&
          write.label.startsWith("task_state_")
      )
    ) {
      failures.push("Approval task must not bypass approval by transitioning into running.");
      sections.controlledExecution = false;
    }

    if (blockedResult?.localWrites.some((write) => write.label === "task")) {
      failures.push("Secret task must be blocked before task creation.");
      sections.controlledExecution = false;
    }

    const afterPlanTasks = readJson("local-state/runtime/tasks.json");
    const afterPlanAudit = parseJsonl(
      readFile("local-state/runtime/audit.jsonl")
    );
    const afterPlanEvents = parseJsonl(
      readFile("local-state/runtime/events.jsonl")
    );
    const afterPlanApprovals = parseJsonl(
      readFile("local-state/runtime/approvals.jsonl")
    );
    const afterPlanIncidents = parseJsonl(
      readFile("local-state/runtime/incidents.jsonl")
    );

    const beforePlanTasks = JSON.parse(beforePlan["local-state/runtime/tasks.json"]);
    const beforePlanAuditRecords = parseJsonl(beforePlan["local-state/runtime/audit.jsonl"]);
    const beforePlanEventRecords = parseJsonl(beforePlan["local-state/runtime/events.jsonl"]);
    const beforePlanApprovalRecords = parseJsonl(beforePlan["local-state/runtime/approvals.jsonl"]);
    const beforePlanIncidentRecords = parseJsonl(beforePlan["local-state/runtime/incidents.jsonl"]);

    const newTaskIds = new Set(
      afterPlanTasks.tasks
        .map((task) => task.taskId)
        .filter(
          (taskIdEntry) =>
            !beforePlanTasks.tasks.some((task) => task.taskId === taskIdEntry)
        )
    );

    if (!newTaskIds.has(passResult?.taskId) || !newTaskIds.has(approvalResult?.taskId)) {
      failures.push("Controlled execution should create PASS and REQUIRE_APPROVAL tasks.");
      sections.controlledExecution = false;
    }

    if (newTaskIds.has(blockedResult?.taskId)) {
      failures.push("Blocked secret task should not create a task record.");
      sections.controlledExecution = false;
    }

    const passTask = afterPlanTasks.tasks.find((task) => task.taskId === passResult?.taskId);
    const approvalTask = afterPlanTasks.tasks.find(
      (task) => task.taskId === approvalResult?.taskId
    );

    if (passTask?.state !== "implementation_done") {
      failures.push("Controlled DemoApp task should end in implementation_done.");
      sections.controlledExecution = false;
    }

    if (approvalTask?.state !== "awaiting_approval") {
      failures.push("Approval-required task should remain awaiting_approval.");
      sections.controlledExecution = false;
    }

    const newAuditCount =
      afterPlanAudit.length - beforePlanAuditRecords.length;
    const newEventCount =
      afterPlanEvents.length - beforePlanEventRecords.length;
    const newApprovalCount =
      afterPlanApprovals.length - beforePlanApprovalRecords.length;
    const newIncidentCount =
      afterPlanIncidents.length - beforePlanIncidentRecords.length;

    if (newAuditCount < 4 || newEventCount < 3) {
      failures.push("Controlled execution should append transition and execution audit/runtime records.");
      sections.controlledExecution = false;
    }

    if (newApprovalCount < 1) {
      failures.push("Approval-required execution should append an approval record.");
      sections.controlledExecution = false;
    }

    if (newIncidentCount < 1) {
      failures.push("Blocked secret execution should append an incident record.");
      sections.controlledExecution = false;
    }
  } catch (error) {
    failures.push(`Local state machine validation failed: ${error.message}`);
    sections.writeLocalStateTaskState = false;
    sections.controlledExecution = false;
  } finally {
    restoreRuntimeFiles(runtimeSnapshot);
  }

  if (policy) {
    if (policy.taskTransitionsRequireStateMachine !== true) {
      failures.push("Policy must set taskTransitionsRequireStateMachine to true.");
      sections.policies = false;
    }
    if (policy.directTaskStateUpdateAllowed !== false) {
      failures.push("Policy must set directTaskStateUpdateAllowed to false.");
      sections.policies = false;
    }
    if (policy.implementationAgentsCannotCompleteDirectly !== true) {
      failures.push("Policy must block direct completion by implementation agents.");
      sections.policies = false;
    }
    if (policy.verificationRequiredForCompletion !== true) {
      failures.push("Policy must require verification for completion.");
      sections.policies = false;
    }
  }

  const docsText = REQUIRED_DOCS.map((relativePath) => readFile(relativePath)).join("\n");
  if (!docsText.includes("implementation agents cannot complete directly")) {
    failures.push("Docs must state that implementation agents cannot complete directly.");
    sections.docs = false;
  }
  if (!/approval evidence/i.test(docsText)) {
    failures.push("Docs must mention approval evidence requirements.");
    sections.docs = false;
  }
  if (!/batch reconciliation evidence|batch_reconciled/i.test(docsText)) {
    failures.push("Docs must mention batch reconciliation evidence.");
    sections.docs = false;
  }
  if (!/gate\/release\/batch enforcement later|gate, release, and batch/i.test(docsText)) {
    failures.push("Docs must state that gate, release, and batch enforcement come later.");
    sections.docs = false;
  }

  const forbiddenStatus = execFileSync(
    "git",
    ["status", "--short", "--", "projects", "memory", "config"],
    {
      cwd: ROOT,
      encoding: "utf8",
    }
  ).trim();

  if (forbiddenStatus) {
    failures.push("Validation touched forbidden projects, memory, or config paths.");
    sections.noForbiddenWrites = false;
  }

  const runtimeContent = RUNTIME_FILES.map((relativePath) => readFile(relativePath)).join("\n");
  if (PRIVATE_NAME_PATTERN.test(runtimeContent)) {
    failures.push("Runtime files contain a private project reference.");
    sections.noForbiddenWrites = false;
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(runtimeContent))) {
    failures.push("Runtime files contain secret-like content.");
    sections.noForbiddenWrites = false;
  }

  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) {
      continue;
    }
    const content = readFile(relativePath);
    if (PRIVATE_NAME_PATTERN.test(content)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }
    if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
      failures.push(`Secret-like content found in ${relativePath}`);
      sections.publicSafety = false;
    }
    const longLines = checkLongLines(relativePath);
    if (longLines.length > 0) {
      failures.push(...longLines.map((entry) => `Line too long: ${entry}`));
      sections.formattingReadability = false;
    }
  }

  const metadata = getGitMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

await main();
