import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/orchestrator-dry-run-report.md");

const REQUIRED_MODULES = [
  "orchestrator/localAdapter.js",
  "orchestrator/dryRunTaskFactory.js",
  "orchestrator/dryRunPlan.js",
];

const REQUIRED_DOCS = [
  "docs/architecture/ORCHESTRATOR_ADAPTER_DRY_RUN.md",
];

const REQUIRED_POLICY = "policy/orchestrator-dry-run-policy.json";

const EXPORT_MAP = {
  "orchestrator/localAdapter.js": [
    "runLocalOrchestratorDryRun",
    "validateDryRunInput",
    "buildDryRunExecutionContext",
    "createDryRunStep",
  ],
  "orchestrator/dryRunTaskFactory.js": [
    "createDemoReleaseReviewTask",
    "createDemoBackendTask",
    "createDemoQaGateTask",
    "createDemoApprovalRequiredTask",
    "createBlockedSecretDataTask",
  ],
  "orchestrator/dryRunPlan.js": [
    "runDefaultDryRunPlan",
    "summarizeDryRunResults",
  ],
};

const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  REQUIRED_POLICY,
  "README.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
  "docs/architecture/RUNTIME_TRAFFIC_PLANE.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "scripts/orchestrator-dry-run.js",
  "scripts/check-orchestrator-dry-run.js",
];

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
    // ignore git metadata failures
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
    const moduleUrl = pathToFileURL(path.join(ROOT, relativePath)).href;
    modules[relativePath] = await import(moduleUrl);
  }

  return modules;
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Orchestrator Dry-Run Check",
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
    `Dry-run execution: ${statusLabel(sections.dryRunExecution)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Traffic plane integration: ${statusLabel(sections.trafficPlaneIntegration)}`,
    `Local write boundary integration: ${statusLabel(sections.localWriteBoundaryIntegration)}`,
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
    "NEXUS Orchestrator Dry-Run Check",
    "================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Dry-run execution: ${statusLabel(sections.dryRunExecution)}`,
    `Expected outcomes: ${statusLabel(sections.expectedOutcomes)}`,
    `Traffic plane integration: ${statusLabel(sections.trafficPlaneIntegration)}`,
    `Local write boundary integration: ${statusLabel(sections.localWriteBoundaryIntegration)}`,
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
    dryRunExecution: true,
    expectedOutcomes: true,
    trafficPlaneIntegration: true,
    localWriteBoundaryIntegration: true,
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

  const tasksBefore = readFile("local-state/runtime/tasks.json");
  const auditBefore = readFile("local-state/runtime/audit.jsonl");
  const evidenceBefore = readFile("local-state/runtime/evidence.jsonl");
  const eventsBefore = readFile("local-state/runtime/events.jsonl");

  const plan = modules["orchestrator/dryRunPlan.js"].runDefaultDryRunPlan();

  if (plan.dryRun !== true || plan.scenarioCount !== 5) {
    failures.push("Dry-run plan must return dryRun true with five scenarios.");
    sections.dryRunExecution = false;
  }

  if (plan.results.some((result) => PRIVATE_NAME_PATTERN.test(JSON.stringify(result)))) {
    failures.push("Dry-run results contain a private project reference.");
    sections.dryRunExecution = false;
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
    failures.push("Dry-run execution flags must remain fully disabled.");
    sections.dryRunExecution = false;
  }

  const resultsByType = new Map(
    plan.results.map((result) => [
      result.agentContext?.normalizedTask?.taskType,
      result.result,
    ])
  );

  if (resultsByType.get("backend.code_edit") !== "PASS") {
    failures.push("Demo backend task must PASS.");
    sections.expectedOutcomes = false;
  }
  if (resultsByType.get("verification_gate") !== "PASS") {
    failures.push("Demo QA gate task must PASS.");
    sections.expectedOutcomes = false;
  }
  if (resultsByType.get("deploy.plan") !== "REQUIRE_APPROVAL") {
    failures.push("Approval required deploy must REQUIRE_APPROVAL.");
    sections.expectedOutcomes = false;
  }
  if (resultsByType.get("ai.integration_blocked_review") !== "BLOCKED") {
    failures.push("Secret data dry-run must be BLOCKED.");
    sections.expectedOutcomes = false;
  }

  const releaseResult = resultsByType.get("demo.release_review");
  if (!["PASS", "REQUIRE_APPROVAL", "BLOCKED"].includes(releaseResult)) {
    failures.push("Release review must remain in the accepted dry-run result set.");
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
    failures.push("Each dry-run result must include identity, traffic, behavior, evidence, and localWrites.");
    sections.trafficPlaneIntegration = false;
  }

  if (
    plan.results.some((result) =>
      result.localWrites.some(
        (write) => write.dryRun !== true && write.written !== false
      )
    )
  ) {
    failures.push("Dry-run local writes must remain non-persistent.");
    sections.trafficPlaneIntegration = false;
  }

  const tasksAfter = readFile("local-state/runtime/tasks.json");
  const auditAfter = readFile("local-state/runtime/audit.jsonl");
  const evidenceAfter = readFile("local-state/runtime/evidence.jsonl");
  const eventsAfter = readFile("local-state/runtime/events.jsonl");

  if (
    tasksBefore !== tasksAfter ||
    auditBefore !== auditAfter ||
    evidenceBefore !== evidenceAfter ||
    eventsBefore !== eventsAfter
  ) {
    failures.push("Dry-run plan must not persist runtime task, audit, evidence, or event writes.");
    sections.localWriteBoundaryIntegration = false;
  }

  const docText = readFile("docs/architecture/ORCHESTRATOR_ADAPTER_DRY_RUN.md");
  if (
    !/dry-run first/i.test(docText) ||
    !/no provider calls/i.test(docText) ||
    !/no tool calls/i.test(docText) ||
    !/no project mutation/i.test(docText) ||
    !/no DB\/API/i.test(docText)
  ) {
    failures.push("Dry-run adapter doc is missing required boundary language.");
    sections.docs = false;
  }

  const policyKey = ["care", "loop", "ExecutionAllowed"].join("");
  if (
    !policy ||
    policy.dryRunOnly !== true ||
    policy.providerCallsAllowed !== false ||
    policy.toolCallsAllowed !== false ||
    policy.projectWritesAllowed !== false ||
    policy.dbWritesAllowed !== false ||
    policy.apiCallsAllowed !== false ||
    policy[policyKey] !== false ||
    policy.requireIdentityContext !== true ||
    policy.requireAgentContext !== true ||
    policy.requireTrafficPlaneDecision !== true ||
    policy.requireLocalWriteBoundaryDryRun !== true ||
    policy.requireEvidenceRecord !== true ||
    policy.noRawPromptStorage !== true ||
    policy.noRawResponseStorage !== true ||
    policy.publicSafetyRequired !== true
  ) {
    failures.push("Orchestrator dry-run policy values are not configured correctly.");
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
        failures.push(`Secret-like pattern found in ${relativePath}`);
        sections.publicSafety = false;
        break;
      }
    }
  }

  const longLines = [];
  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) {
      continue;
    }
    longLines.push(...checkLongLines(relativePath));
  }

  if (longLines.length > 0) {
    failures.push(
      ...longLines.map((entry) => `Line exceeds 1000 characters: ${entry}`)
    );
    sections.formattingReadability = false;
  }

  const metadata = getGitMetadata();
  writeReport(metadata, sections, failures);
  const overallPass = failures.length === 0;
  printConsole(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

await main();
