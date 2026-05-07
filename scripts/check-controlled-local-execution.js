import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/controlled-local-execution-report.md"
);
const REQUIRED_MODULES = [
  "orchestrator/localExecutor.js",
  "orchestrator/localExecutionPlan.js",
];
const REQUIRED_DOCS = ["docs/architecture/CONTROLLED_LOCAL_EXECUTION.md"];
const REQUIRED_POLICY = "policy/controlled-local-execution-policy.json";
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
  ...REQUIRED_DOCS,
  REQUIRED_POLICY,
  "README.md",
  "docs/architecture/ORCHESTRATOR_ADAPTER_DRY_RUN.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
  "docs/architecture/RUNTIME_TRAFFIC_PLANE.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "scripts/orchestrator-local-execute.js",
  "scripts/check-controlled-local-execution.js",
];

const EXPORT_MAP = {
  "orchestrator/localExecutor.js": [
    "runControlledLocalExecution",
    "validateControlledExecutionInput",
    "buildControlledExecutionContext",
    "createControlledExecutionStep",
  ],
  "orchestrator/localExecutionPlan.js": [
    "createControlledDemoTask",
    "createControlledApprovalTask",
    "createControlledBlockedSecretTask",
    "runControlledLocalExecutionPlan",
    "summarizeControlledExecutionResults",
  ],
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
    // Ignore git metadata failures in validation mode.
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

function parseJsonl(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function loadModules() {
  const modules = {};

  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = pathToFileURL(path.join(ROOT, relativePath)).href;
    modules[relativePath] = await import(moduleUrl);
  }

  return modules;
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Controlled Local Execution Check",
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
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Traffic plane integration: ${statusLabel(sections.trafficPlaneIntegration)}`,
    `Local write boundary integration: ${statusLabel(sections.localWriteBoundaryIntegration)}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policy: ${statusLabel(sections.policy)}`,
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
    "NEXUS Controlled Local Execution Check",
    "======================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Traffic plane integration: ${statusLabel(sections.trafficPlaneIntegration)}`,
    `Local write boundary integration: ${statusLabel(
      sections.localWriteBoundaryIntegration
    )}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];

  console.log(lines.join("\n"));
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    controlledExecution: true,
    expectedOutcomes: true,
    trafficPlaneIntegration: true,
    localWriteBoundaryIntegration: true,
    noForbiddenWrites: true,
    docs: true,
    policy: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      failures.push(`Missing module: ${relativePath}`);
      sections.modules = false;
    }
  }

  for (const relativePath of REQUIRED_DOCS) {
    if (!exists(relativePath)) {
      failures.push(`Missing doc: ${relativePath}`);
      sections.docs = false;
    }
  }

  if (!exists(REQUIRED_POLICY)) {
    failures.push(`Missing policy: ${REQUIRED_POLICY}`);
    sections.policy = false;
  }

  let policy = null;
  try {
    policy = readJson(REQUIRED_POLICY);
  } catch (error) {
    failures.push(`Invalid JSON in ${REQUIRED_POLICY}: ${error.message}`);
    sections.policy = false;
  }

  const modules = await loadModules();
  for (const [relativePath, exportsList] of Object.entries(EXPORT_MAP)) {
    const moduleExports = modules[relativePath];
    for (const exportName of exportsList) {
      if (!(exportName in moduleExports)) {
        failures.push(`Missing export ${exportName} from ${relativePath}`);
        sections.exports = false;
      }
    }
  }

  const runtimeSnapshot = snapshotRuntimeFiles();
  const tasksBefore = JSON.parse(runtimeSnapshot["local-state/runtime/tasks.json"]);
  const evidenceBefore = parseJsonl(
    runtimeSnapshot["local-state/runtime/evidence.jsonl"]
  );
  const auditBefore = parseJsonl(runtimeSnapshot["local-state/runtime/audit.jsonl"]);
  const eventsBefore = parseJsonl(
    runtimeSnapshot["local-state/runtime/events.jsonl"]
  );
  const approvalsBefore = parseJsonl(
    runtimeSnapshot["local-state/runtime/approvals.jsonl"]
  );
  const incidentsBefore = parseJsonl(
    runtimeSnapshot["local-state/runtime/incidents.jsonl"]
  );
  let plan;

  try {
    plan = modules[
      "orchestrator/localExecutionPlan.js"
    ].runControlledLocalExecutionPlan();

    if (plan.executionMode !== "controlled-local" || plan.scenarioCount !== 3) {
      failures.push(
        "Controlled execution plan must return controlled-local mode with three scenarios."
      );
      sections.controlledExecution = false;
    }

    if (
      plan.results.some(
        (result) =>
          result.executionFlags?.providerCallsExecuted !== false ||
          result.executionFlags?.toolCallsExecuted !== false ||
          result.executionFlags?.projectMutationExecuted !== false ||
          result.executionFlags?.apiCallsExecuted !== false ||
          result.executionFlags?.dbWritesExecuted !== false
      )
    ) {
      failures.push(
        "Controlled execution must keep provider, tool, project, API, and DB execution disabled."
      );
      sections.controlledExecution = false;
    }

    if (plan.results.some((result) => PRIVATE_NAME_PATTERN.test(JSON.stringify(result)))) {
      failures.push("Controlled execution results contain a private project reference.");
      sections.controlledExecution = false;
    }

    const resultsByType = new Map(
      plan.results.map((result) => [
        result.agentContext?.normalizedTask?.taskType,
        result.result,
      ])
    );

    if (resultsByType.get("demo.local_execution") !== "PASS") {
      failures.push("Controlled DemoApp task must PASS.");
      sections.expectedOutcomes = false;
    }
    if (resultsByType.get("deploy.plan") !== "REQUIRE_APPROVAL") {
      failures.push("Approval required deploy must REQUIRE_APPROVAL.");
      sections.expectedOutcomes = false;
    }
    if (resultsByType.get("ai.integration_blocked_review") !== "BLOCKED") {
      failures.push("Secret data task must be BLOCKED.");
      sections.expectedOutcomes = false;
    }

    if (
      plan.results.some(
        (result) =>
          !result.identityContext ||
          !result.trafficDecision ||
          !result.evidenceRecord ||
          !result.behavior ||
          !Array.isArray(result.localWrites)
      )
    ) {
      failures.push(
        "Each controlled execution result must include identity, traffic, behavior, evidence, and localWrites."
      );
      sections.trafficPlaneIntegration = false;
    }

    const passResult = plan.results.find(
      (result) => result.agentContext?.normalizedTask?.taskType === "demo.local_execution"
    );
    const approvalResult = plan.results.find(
      (result) => result.agentContext?.normalizedTask?.taskType === "deploy.plan"
    );
    const blockedResult = plan.results.find(
      (result) =>
        result.agentContext?.normalizedTask?.taskType ===
        "ai.integration_blocked_review"
    );

    if (
      !passResult?.localWrites.some((write) => write.label === "task" && write.written) ||
      !passResult?.localWrites.some(
        (write) => write.label === "audit" && write.written
      ) ||
      !passResult?.localWrites.some(
        (write) => write.label === "evidence" && write.written
      ) ||
      !passResult?.localWrites.some(
        (write) => write.label === "runtime_event" && write.written
      )
    ) {
      failures.push("PASS scenario must write task, audit, evidence, and runtime event.");
      sections.localWriteBoundaryIntegration = false;
    }

    if (
      !approvalResult?.localWrites.some((write) => write.label === "task" && write.written) ||
      !approvalResult?.localWrites.some(
        (write) => write.label === "audit" && write.written
      ) ||
      !approvalResult?.localWrites.some(
        (write) => write.label === "approval" && write.written
      )
    ) {
      failures.push("REQUIRE_APPROVAL scenario must write task, audit, and approval.");
      sections.localWriteBoundaryIntegration = false;
    }

    if (blockedResult?.localWrites.some((write) => write.label === "task")) {
      failures.push("BLOCKED scenario must not create a task record.");
      sections.localWriteBoundaryIntegration = false;
    }

    if (
      !blockedResult?.localWrites.some(
        (write) => write.label === "audit" && write.written
      )
    ) {
      failures.push("BLOCKED scenario must write an audit record.");
      sections.localWriteBoundaryIntegration = false;
    }

    const tasksAfter = JSON.parse(readFile("local-state/runtime/tasks.json"));
    const evidenceAfter = parseJsonl(readFile("local-state/runtime/evidence.jsonl"));
    const auditAfter = parseJsonl(readFile("local-state/runtime/audit.jsonl"));
    const eventsAfter = parseJsonl(readFile("local-state/runtime/events.jsonl"));
    const approvalsAfter = parseJsonl(
      readFile("local-state/runtime/approvals.jsonl")
    );
    const incidentsAfter = parseJsonl(
      readFile("local-state/runtime/incidents.jsonl")
    );

    const previousTaskIds = new Set(
      (Array.isArray(tasksBefore.tasks) ? tasksBefore.tasks : []).map(
        (task) => task.taskId
      )
    );
    const previousEvidenceIds = new Set(
      evidenceBefore.map((record) => record.evidenceId)
    );
    const previousAuditIds = new Set(auditBefore.map((record) => record.auditId));
    const previousEventIds = new Set(eventsBefore.map((record) => record.eventId));
    const previousApprovalIds = new Set(
      approvalsBefore.map((record) => record.approvalId)
    );
    const previousIncidentIds = new Set(
      incidentsBefore.map((record) => record.incidentId)
    );

    const newTasks = tasksAfter.tasks.filter(
      (task) => !previousTaskIds.has(task.taskId)
    );
    const newEvidence = evidenceAfter.filter(
      (record) => !previousEvidenceIds.has(record.evidenceId)
    );
    const newAudit = auditAfter.filter(
      (record) => !previousAuditIds.has(record.auditId)
    );
    const newEvents = eventsAfter.filter(
      (record) => !previousEventIds.has(record.eventId)
    );
    const newApprovals = approvalsAfter.filter(
      (record) => !previousApprovalIds.has(record.approvalId)
    );
    const newIncidents = incidentsAfter.filter(
      (record) => !previousIncidentIds.has(record.incidentId)
    );

    const expectedPassTaskId = passResult?.taskId;
    const expectedApprovalTaskId = approvalResult?.taskId;
    const blockedTaskId = blockedResult?.taskId;

    if (
      !newTasks.some((task) => task.taskId === expectedPassTaskId) ||
      !newTasks.some((task) => task.taskId === expectedApprovalTaskId) ||
      newTasks.some((task) => task.taskId === blockedTaskId)
    ) {
      failures.push(
        "Task store must append only the PASS and REQUIRE_APPROVAL scenario tasks."
      );
      sections.localWriteBoundaryIntegration = false;
    }

    const passEvidenceId = passResult?.localWrites.find(
      (write) => write.label === "evidence"
    )?.record?.evidenceId;
    const passAuditId = passResult?.localWrites.find(
      (write) => write.label === "audit"
    )?.record?.auditId;
    const passEventId = passResult?.localWrites.find(
      (write) => write.label === "runtime_event"
    )?.record?.eventId;
    const approvalAuditId = approvalResult?.localWrites.find(
      (write) => write.label === "audit"
    )?.record?.auditId;
    const approvalRecordId = approvalResult?.localWrites.find(
      (write) => write.label === "approval"
    )?.record?.approvalId;
    const blockedAuditId = blockedResult?.localWrites.find(
      (write) => write.label === "audit"
    )?.record?.auditId;
    const blockedIncidentId = blockedResult?.localWrites.find(
      (write) => write.label === "incident"
    )?.record?.incidentId;

    if (
      !newEvidence.some((record) => record.evidenceId === passEvidenceId) ||
      !newAudit.some((record) => record.auditId === passAuditId) ||
      !newAudit.some((record) => record.auditId === approvalAuditId) ||
      !newAudit.some((record) => record.auditId === blockedAuditId) ||
      !newEvents.some((record) => record.eventId === passEventId) ||
      !newApprovals.some((record) => record.approvalId === approvalRecordId) ||
      !newIncidents.some((record) => record.incidentId === blockedIncidentId)
    ) {
      failures.push(
        "Controlled execution did not append the expected runtime records."
      );
      sections.localWriteBoundaryIntegration = false;
    }

    if (
      plan.results.some((result) =>
        result.localWrites.some(
          (write) =>
            typeof write.path === "string" &&
            !write.path.startsWith("local-state/runtime/")
        )
      )
    ) {
      failures.push("Controlled execution wrote outside local-state/runtime.");
      sections.localWriteBoundaryIntegration = false;
    }

    const forbiddenStatus = execFileSync(
      "git",
      ["status", "--short", "--", "projects", "memory", "config", ".env", ".env.local"],
      {
        cwd: ROOT,
        encoding: "utf8",
      }
    ).trim();

    if (forbiddenStatus) {
      failures.push("Controlled execution touched forbidden project, memory, config, or env paths.");
      sections.noForbiddenWrites = false;
    }
  } catch (error) {
    failures.push(`Controlled execution validation failed: ${error.message}`);
    sections.controlledExecution = false;
  } finally {
    restoreRuntimeFiles(runtimeSnapshot);
  }

  const restoredTasks = readFile("local-state/runtime/tasks.json");
  const restoredEvidence = readFile("local-state/runtime/evidence.jsonl");
  const restoredAudit = readFile("local-state/runtime/audit.jsonl");
  const restoredEvents = readFile("local-state/runtime/events.jsonl");
  const restoredApprovals = readFile("local-state/runtime/approvals.jsonl");
  const restoredIncidents = readFile("local-state/runtime/incidents.jsonl");

  if (
    restoredTasks !== runtimeSnapshot["local-state/runtime/tasks.json"] ||
    restoredEvidence !== runtimeSnapshot["local-state/runtime/evidence.jsonl"] ||
    restoredAudit !== runtimeSnapshot["local-state/runtime/audit.jsonl"] ||
    restoredEvents !== runtimeSnapshot["local-state/runtime/events.jsonl"] ||
    restoredApprovals !== runtimeSnapshot["local-state/runtime/approvals.jsonl"] ||
    restoredIncidents !== runtimeSnapshot["local-state/runtime/incidents.jsonl"]
  ) {
    failures.push("Runtime files were not restored after controlled execution validation.");
    sections.noForbiddenWrites = false;
  }

  const docText = readFile("docs/architecture/CONTROLLED_LOCAL_EXECUTION.md");
  if (
    !/controlled local/i.test(docText) ||
    !/no provider calls/i.test(docText) ||
    !/no tool calls/i.test(docText) ||
    !/no project mutation/i.test(docText) ||
    !/no DB\/API/i.test(docText)
  ) {
    failures.push("Controlled local execution doc is missing required boundary language.");
    sections.docs = false;
  }

  const policyKey = ["care", "loop", "ExecutionAllowed"].join("");
  if (
    !policy ||
    policy.executionMode !== "controlled-local" ||
    policy.providerCallsAllowed !== false ||
    policy.toolCallsAllowed !== false ||
    policy.projectWritesAllowed !== false ||
    policy.dbWritesAllowed !== false ||
    policy.apiCallsAllowed !== false ||
    policy[policyKey] !== false ||
    policy.localStateWritesAllowed !== true ||
    policy.allowedWriteRoot !== "local-state/runtime" ||
    policy.requireIdentityContext !== true ||
    policy.requireAgentContext !== true ||
    policy.requireTrafficPlaneDecision !== true ||
    policy.requireLocalWriteBoundary !== true ||
    policy.requireEvidenceRecord !== true ||
    policy.requireAuditEvent !== true ||
    policy.noRawPromptStorage !== true ||
    policy.noRawResponseStorage !== true ||
    policy.publicSafetyRequired !== true
  ) {
    failures.push("Controlled local execution policy values are not configured correctly.");
    sections.policy = false;
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

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`Secret-like content found in ${relativePath}`);
        sections.publicSafety = false;
        break;
      }
    }
  }

  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) {
      continue;
    }

    const violations = checkLongLines(relativePath);
    if (violations.length > 0) {
      failures.push(...violations.map((entry) => `Line too long: ${entry}`));
      sections.formattingReadability = false;
    }
  }

  const metadata = getGitMetadata();
  writeReport(metadata, sections, failures);
  printConsole(sections, failures.length === 0);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
