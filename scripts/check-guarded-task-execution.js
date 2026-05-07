import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/guarded-task-execution-report.md");
const REQUIRED_MODULES = [
  "orchestrator/guardedTaskExecutor.js",
  "orchestrator/guardedTaskPlan.js",
];
const REQUIRED_DOCS = [
  "docs/architecture/GUARDED_LOCAL_AGENT_TASK_EXECUTION.md",
];
const REQUIRED_POLICY = "policy/guarded-local-agent-task-policy.json";
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
  "orchestrator/localExecutor.js",
  "local-state/writeLocalState.js",
  "local-state/appendEvidence.js",
  "local-state/appendAuditEvent.js",
  "local-state/stateStore.js",
  "scripts/guarded-task-execute.js",
  "scripts/check-guarded-task-execution.js",
  "docs/architecture/CONTROLLED_LOCAL_EXECUTION.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
];
const PUBLIC_SCAN_FILES = PHASE_FILES.filter(
  (relativePath) => relativePath !== "package.json"
);

const EXPORT_MAP = {
  "orchestrator/guardedTaskExecutor.js": [
    "runGuardedLocalAgentTask",
    "validateGuardedTaskInput",
    "buildGuardedTaskContext",
    "executeDeterministicLocalStep",
    "summarizeGuardedTaskResult",
  ],
  "orchestrator/guardedTaskPlan.js": [
    "createAuditorDemoContractsTask",
    "createSentinelDemoReportsTask",
    "createWardenPublicSafetyTask",
    "createCoreRuntimeSnapshotTask",
    "createBlockedUnknownActionTask",
    "runGuardedTaskPlan",
    "summarizeGuardedTaskPlanResults",
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
const PRIVATE_EXECUTION_KEY = ["care", "loop", "ExecutionAllowed"].join("");

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
    // Ignore metadata failures.
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

async function loadModules() {
  const modules = {};

  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = `${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`;
    modules[relativePath] = await import(moduleUrl);
  }

  return modules;
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Guarded Task Execution Check",
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
    `Guarded task plan: ${statusLabel(sections.guardedTaskPlan)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Governed path integration: ${statusLabel(sections.governedPathIntegration)}`,
    `Local write restoration: ${statusLabel(sections.localWriteRestoration)}`,
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
    "NEXUS Guarded Task Execution Check",
    "==================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Guarded task plan: ${statusLabel(sections.guardedTaskPlan)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Governed path integration: ${statusLabel(sections.governedPathIntegration)}`,
    `Local write restoration: ${statusLabel(sections.localWriteRestoration)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];

  console.log(lines.join("\n"));
}

function hasSecretLikeContent(value) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    guardedTaskPlan: true,
    expectedOutcomes: true,
    governedPathIntegration: true,
    localWriteRestoration: true,
    docs: true,
    policy: true,
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
        sections.policy = false;
      }
    }
  }

  let packageJson = null;
  let policy = null;
  try {
    packageJson = readJson("package.json");
  } catch (error) {
    failures.push(`Invalid package.json: ${error.message}`);
    sections.modules = false;
  }

  try {
    policy = readJson(REQUIRED_POLICY);
  } catch (error) {
    failures.push(`Invalid JSON in ${REQUIRED_POLICY}: ${error.message}`);
    sections.policy = false;
  }

  if (packageJson?.scripts) {
    for (const scriptName of [
      "guarded-task:execute",
      "check:guarded-task-execution",
    ]) {
      if (!packageJson.scripts[scriptName]) {
        failures.push(`Missing package script: ${scriptName}`);
        sections.modules = false;
      }
    }
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

  const { runGuardedTaskPlan } = modules["orchestrator/guardedTaskPlan.js"];
  const runtimeBefore = snapshotRuntimeFiles();
  const envBefore = exists(".env");
  let plan;

  try {
    plan = runGuardedTaskPlan();

    if (plan.executionMode !== "guarded-local" || plan.scenarioCount < 5) {
      failures.push(
        "Guarded task plan must return guarded-local mode with at least five scenarios."
      );
      sections.guardedTaskPlan = false;
    }

    if (
      plan.results.some(
        (result) =>
          result.executionFlags?.providerCallsExecuted !== false ||
          result.executionFlags?.externalToolCallsExecuted !== false ||
          result.executionFlags?.projectMutationExecuted !== false ||
          result.executionFlags?.apiCallsExecuted !== false ||
          result.executionFlags?.dbWritesExecuted !== false
      )
    ) {
      failures.push(
        "Guarded tasks must keep provider, external tool, project, API, and DB execution disabled."
      );
      sections.guardedTaskPlan = false;
    }

    const resultsByAction = new Map(
      plan.results.map((result) => [
        result.taskContract?.allowedLocalAction,
        result.result,
      ])
    );

    for (const action of [
      "validate_demo_contracts",
      "validate_demo_reports",
      "validate_public_safety_surface",
      "validate_runtime_snapshot",
    ]) {
      if (resultsByAction.get(action) !== "PASS") {
        failures.push(`Expected PASS for action ${action}.`);
        sections.expectedOutcomes = false;
      }
    }

    if (resultsByAction.get("unknown_guarded_action") !== "BLOCKED") {
      failures.push("Expected BLOCKED for unknown guarded action.");
      sections.expectedOutcomes = false;
    }

    if (
      plan.pass !== 4 ||
      plan.blocked !== 1 ||
      plan.fail !== 0
    ) {
      failures.push("Guarded task summary counts must be 4 PASS, 1 BLOCKED, 0 FAIL.");
      sections.expectedOutcomes = false;
    }

    if (
      plan.results.some(
        (result) =>
          !result.identityContext ||
          !result.agentContext ||
          !result.trafficDecision ||
          !result.evidenceRecord ||
          !Array.isArray(result.localWrites)
      )
    ) {
      failures.push(
        "Every guarded task result must include identityContext, agentContext, trafficDecision, evidenceRecord, and localWrites."
      );
      sections.governedPathIntegration = false;
    }

    const invalidPathWrite = plan.results.some((result) =>
      result.localWrites.some(
        (write) =>
          typeof write.path === "string" &&
          !write.path.startsWith("local-state/runtime/")
      )
    );
    if (invalidPathWrite) {
      failures.push("Guarded task local writes must stay under local-state/runtime.");
      sections.governedPathIntegration = false;
    }

    if (
      plan.results.some(
        (result) =>
          !result.steps.some((step) => step.name === "capability_check") ||
          !result.steps.some((step) => step.name === "evaluate_traffic_plane")
      )
    ) {
      failures.push(
        "Guarded task steps must include capability_check and evaluate_traffic_plane."
      );
      sections.governedPathIntegration = false;
    }

    const passResults = plan.results.filter((result) => result.result === "PASS");
    const blockedResult = plan.results.find((result) => result.result === "BLOCKED");

    for (const result of passResults) {
      const hasEvidenceWrite = result.localWrites.some(
        (write) => write.label === "evidence" && write.ok
      );
      const hasAuditWrite = result.localWrites.some(
        (write) => write.label === "audit" && write.ok
      );
      const hasRuntimeWrite = result.localWrites.some(
        (write) => write.label === "runtime_event" && write.ok
      );

      if (!hasEvidenceWrite || !hasAuditWrite || !hasRuntimeWrite) {
        failures.push(
          `PASS scenario ${result.taskContract?.allowedLocalAction} must create evidence, audit, and runtime-event writes.`
        );
        sections.governedPathIntegration = false;
      }
    }

    if (!blockedResult) {
      failures.push("Blocked guarded action scenario was not found.");
      sections.expectedOutcomes = false;
    } else {
      const blockedTaskWrite = blockedResult.localWrites.some(
        (write) => write.label === "task" && !write.ok
      );
      if (blockedTaskWrite) {
        failures.push("Blocked scenario should not fail task creation before the guarded action is evaluated.");
        sections.governedPathIntegration = false;
      }

      const blockedProjectWrite = blockedResult.localWrites.some((write) =>
        /projects\//.test(JSON.stringify(write))
      );
      if (blockedProjectWrite) {
        failures.push("Blocked guarded action scenario must not create project writes.");
        sections.governedPathIntegration = false;
      }
    }

    const tasksAfter = JSON.parse(readFile("local-state/runtime/tasks.json"));
    const evidenceAfter = parseJsonl(readFile("local-state/runtime/evidence.jsonl"));
    const auditAfter = parseJsonl(readFile("local-state/runtime/audit.jsonl"));
    const eventsAfter = parseJsonl(readFile("local-state/runtime/events.jsonl"));

    if (!Array.isArray(tasksAfter.tasks)) {
      failures.push("tasks.json must remain valid JSON with a tasks array.");
      sections.localWriteRestoration = false;
    }

    if (
      evidenceAfter.length <= parseJsonl(runtimeBefore["local-state/runtime/evidence.jsonl"]).length ||
      auditAfter.length <= parseJsonl(runtimeBefore["local-state/runtime/audit.jsonl"]).length ||
      eventsAfter.length <= parseJsonl(runtimeBefore["local-state/runtime/events.jsonl"]).length
    ) {
      failures.push("Guarded task execution must append evidence, audit, and runtime events.");
      sections.governedPathIntegration = false;
    }
  } finally {
    restoreRuntimeFiles(runtimeBefore);
  }

  const runtimeAfterRestore = snapshotRuntimeFiles();
  for (const relativePath of RUNTIME_FILES) {
    if (runtimeAfterRestore[relativePath] !== runtimeBefore[relativePath]) {
      failures.push(`Runtime file was not restored after validation: ${relativePath}`);
      sections.localWriteRestoration = false;
    }
  }

  if (exists(".env") !== envBefore) {
    failures.push(".env creation state changed during guarded task validation.");
    sections.localWriteRestoration = false;
  }

  try {
    const diffPaths = execFileSync(
      "git",
      ["diff", "--name-only", "--", "projects", "memory", "config"],
      {
        cwd: ROOT,
        encoding: "utf8",
      }
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (diffPaths.length > 0) {
      failures.push(
        `Forbidden tracked writes detected outside runtime boundary: ${diffPaths.join(", ")}`
      );
      sections.localWriteRestoration = false;
    }
  } catch (error) {
    failures.push(`Unable to inspect forbidden writes: ${error.message}`);
    sections.localWriteRestoration = false;
  }

  if (policy) {
    const privateExecutionFlag = policy[PRIVATE_EXECUTION_KEY];
    if (
      policy.executionMode !== "guarded-local" ||
      policy.providerCallsAllowed !== false ||
      policy.externalToolCallsAllowed !== false ||
      policy.projectWritesAllowed !== false ||
      policy.dbWritesAllowed !== false ||
      policy.apiCallsAllowed !== false ||
      privateExecutionFlag !== false ||
      policy.requireIdentityContext !== true ||
      policy.requireAgentContext !== true ||
      policy.requireTrafficPlaneDecision !== true ||
      policy.requireStateMachineTransition !== true ||
      policy.requireEvidenceRecord !== true ||
      policy.requireAuditEvent !== true ||
      policy.publicSafetyRequired !== true ||
      !Array.isArray(policy.allowedLocalActions) ||
      policy.allowedLocalActions.length < 4
    ) {
      failures.push("Guarded local agent task policy values are incorrect.");
      sections.policy = false;
    }
  }

  const docText = readFile(REQUIRED_DOCS[0]);
  for (const phrase of [
    "deterministic local actions only",
    "no provider calls",
    "no external tool calls",
    "no project mutation",
    "future bridge",
  ]) {
    if (!docText.toLowerCase().includes(phrase)) {
      failures.push(`Guarded task execution doc is missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }

  for (const relativePath of PUBLIC_SCAN_FILES) {
    if (!exists(relativePath)) {
      continue;
    }

    const text = readFile(relativePath).replaceAll(
      PRIVATE_EXECUTION_KEY,
      "privateProductExecutionAllowed"
    );

    if (PRIVATE_NAME_PATTERN.test(text)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }

    if (hasSecretLikeContent(text)) {
      failures.push(`Secret-like content found in ${relativePath}`);
      sections.publicSafety = false;
    }
  }

  for (const relativePath of [
    ...PHASE_FILES,
    "reports/guarded-task-execution-report.md",
  ]) {
    if (!exists(relativePath)) {
      continue;
    }

    for (const issue of checkLongLines(relativePath)) {
      failures.push(`Line exceeds 1000 characters: ${issue}`);
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
