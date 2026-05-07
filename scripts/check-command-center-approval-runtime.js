import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/command-center-approval-runtime-report.md"
);
const REQUIRED_MODULES = [
  "local-state/normalizeRuntimeFiles.js",
  "scripts/generate-command-center-snapshot.js",
  "dashboard/src/data/runtimeSnapshot.js",
];
const REQUIRED_DOCS = [
  "docs/architecture/COMMAND_CENTER_APPROVAL_RUNTIME_REFRESH.md",
  "docs/architecture/COMMAND_CENTER_RUNTIME_INGESTION.md",
  "docs/architecture/LOCAL_APPROVAL_WORKFLOW.md",
];
const REQUIRED_POLICY = "policy/command-center-approval-runtime-policy.json";
const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  REQUIRED_POLICY,
  "local-state/readLocalState.js",
  "dashboard/src/data/localReports.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/styles.css",
  "dashboard/tests/routes.spec.js",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
];
const PUBLIC_SCAN_FILES = PHASE_FILES.filter(
  (relativePath) => relativePath !== "package.json"
);
const FORBIDDEN_PATTERNS = [
  { label: "fetch", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "WebSocket", pattern: /\bWebSocket\b/ },
  { label: "api endpoint", pattern: /\/api\// },
  {
    label: "private project name",
    pattern: new RegExp(
      [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
    ),
  },
  {
    label: "OpenAI key",
    pattern: new RegExp([["OPENAI", "_", "API", "_", "KEY"].join(""), "="].join("")),
  },
  {
    label: "Anthropic key",
    pattern: new RegExp(
      [["ANTHROPIC", "_", "API", "_", "KEY"].join(""), "="].join("")
    ),
  },
  {
    label: "database url",
    pattern: new RegExp([["DATABASE", "_", "URL"].join(""), "="].join("")),
  },
  {
    label: "private key",
    pattern: new RegExp(["-----BEGIN ", "[A-Z ]+", "PRIVATE KEY", "-----"].join("")),
  },
];
const PRIVATE_EXECUTION_KEY = ["care", "loop", "ExecutionAllowed"].join("");

const EXPORT_MAP = {
  "local-state/normalizeRuntimeFiles.js": [
    "readRuntimeTasks",
    "readRuntimeJsonl",
    "readRuntimeEvidence",
    "readRuntimeAudit",
    "readRuntimeEvents",
    "readRuntimeApprovals",
    "readRuntimeIncidents",
    "summarizeRuntimeFiles",
    "buildCommandCenterRuntimeSnapshot",
  ],
};

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
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
    // Local metadata is optional for validation.
  }

  return metadata;
}

async function loadModule(relativePath) {
  const moduleUrl = `${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`;
  return import(moduleUrl);
}

function checkLongLines(relativePath) {
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Command Center Approval Runtime Refresh Check",
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
    `Runtime approval summary: ${statusLabel(sections.runtimeApprovalSummary)}`,
    `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Dashboard tests: ${statusLabel(sections.dashboardTests)}`,
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
    "NEXUS Command Center Approval Runtime Refresh Check",
    "===================================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Runtime approval summary: ${statusLabel(sections.runtimeApprovalSummary)}`,
    `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Dashboard tests: ${statusLabel(sections.dashboardTests)}`,
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
    runtimeApprovalSummary: true,
    snapshotGeneration: true,
    dashboardContent: true,
    noForbiddenBehavior: true,
    docs: true,
    policy: true,
    dashboardTests: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      failures.push(`Missing required file: ${relativePath}`);
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

  const runtimeModule = await loadModule("local-state/normalizeRuntimeFiles.js");
  for (const exportName of EXPORT_MAP["local-state/normalizeRuntimeFiles.js"]) {
    if (!(exportName in runtimeModule)) {
      failures.push(`Missing export ${exportName} from local-state/normalizeRuntimeFiles.js`);
      sections.exports = false;
    }
  }

  const runtimeSummary = runtimeModule.summarizeRuntimeFiles();
  if (
    !runtimeSummary.runtimeState?.approvals ||
    typeof runtimeSummary.approvalWorkflow?.requested !== "number" ||
    typeof runtimeSummary.approvalWorkflow?.approved !== "number" ||
    typeof runtimeSummary.approvalWorkflow?.rejected !== "number" ||
    typeof runtimeSummary.approvalWorkflow?.expired !== "number" ||
    !Array.isArray(runtimeSummary.approvalWorkflow?.recent) ||
    !Array.isArray(runtimeSummary.approvalWorkflow?.linkedEvidence)
  ) {
    failures.push("Runtime approval workflow summary is incomplete.");
    sections.runtimeApprovalSummary = false;
  }

  if (
    typeof runtimeSummary.runtimeState.approvals.byTaskId !== "object" ||
    !runtimeSummary.refresh ||
    runtimeSummary.refresh.command !== "npm run generate:command-center-snapshot"
  ) {
    failures.push("Runtime refresh metadata or approvals byTaskId summary is missing.");
    sections.runtimeApprovalSummary = false;
  }

  try {
    execFileSync("npm", ["run", "generate:command-center-snapshot"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    failures.push(`Snapshot generation command failed: ${error.message}`);
    sections.snapshotGeneration = false;
  }

  const snapshotModule = await loadModule("dashboard/src/data/runtimeSnapshot.js");
  const runtimeSnapshot = snapshotModule.runtimeSnapshot || {};
  const privateExecutionFlag = runtimeSnapshot.limits?.[
    ["care", "loop", "ExecutionEnabled"].join("")
  ];

  if (
    runtimeSnapshot.readOnly !== true ||
    runtimeSnapshot.source !== "generated-from-local-state-runtime" ||
    runtimeSnapshot.refresh?.command !== "npm run generate:command-center-snapshot" ||
    runtimeSnapshot.refresh?.readOnly !== true ||
    runtimeSnapshot.refresh?.liveApi !== false ||
    typeof runtimeSnapshot.approvalWorkflow?.total !== "number" ||
    typeof runtimeSnapshot.approvalWorkflow?.requested !== "number" ||
    !Array.isArray(runtimeSnapshot.approvalWorkflow?.recent) ||
    !Array.isArray(runtimeSnapshot.approvalWorkflow?.linkedEvidence) ||
    runtimeSnapshot.limits?.apiWired !== false ||
    runtimeSnapshot.limits?.dbWired !== false ||
    runtimeSnapshot.limits?.mutationEnabled !== false ||
    runtimeSnapshot.limits?.providerCallsEnabled !== false ||
    privateExecutionFlag !== false
  ) {
    failures.push("Generated runtime snapshot approval workflow or limits are incorrect.");
    sections.snapshotGeneration = false;
  }

  const commandCenterText = exists("dashboard/src/pages/CommandCenter.jsx")
    ? readFile("dashboard/src/pages/CommandCenter.jsx")
    : "";
  for (const phrase of [
    "Approval Workflow",
    "Approval Evidence",
    "Runtime Refresh",
    "Blocked by Approval",
    "No UI mutation yet",
    "npm run approvals:approve",
    "npm run approvals:reject",
  ]) {
    if (!commandCenterText.includes(phrase)) {
      failures.push(`Command Center is missing phrase: ${phrase}`);
      sections.dashboardContent = false;
    }
  }

  if (/<button\b/i.test(commandCenterText)) {
    failures.push("Command Center must not add mutation buttons in this phase.");
    sections.noForbiddenBehavior = false;
  }

  for (const relativePath of PUBLIC_SCAN_FILES) {
    if (!exists(relativePath)) {
      continue;
    }

    const text = readFile(relativePath);
    for (const entry of FORBIDDEN_PATTERNS) {
      if (entry.pattern.test(text)) {
        failures.push(`Forbidden ${entry.label} reference found in ${relativePath}`);
        sections.noForbiddenBehavior = false;
      }
    }
  }

  const docsText = REQUIRED_DOCS.map((relativePath) => readFile(relativePath)).join("\n");
  for (const phrase of [
    "generated snapshot",
    "read-only",
    "no API",
    "no DB",
    "no mutation",
  ]) {
    if (!docsText.includes(phrase)) {
      failures.push(`Docs are missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }

  if (policy) {
    const privateExecutionPolicyFlag = policy[PRIVATE_EXECUTION_KEY];
    if (
      policy.readOnly !== true ||
      policy.approvalActionsInUiAllowed !== false ||
      policy.cliApprovalActionsAllowed !== true ||
      policy.snapshotRefreshRequired !== true ||
      policy.apiRequiredForLiveMutation !== true ||
      policy.dbReadsAllowed !== false ||
      policy.providerCallsAllowed !== false ||
      privateExecutionPolicyFlag !== false ||
      policy.publicSafetyRequired !== true
    ) {
      failures.push("Approval runtime policy values are incorrect.");
      sections.policy = false;
    }
  }

  try {
    const packageJson = readJson("package.json");
    if (
      packageJson.scripts?.["generate:command-center-snapshot"] !==
        "node scripts/generate-command-center-snapshot.js" ||
      packageJson.scripts?.["check:command-center-approval-runtime"] !==
        "node scripts/check-command-center-approval-runtime.js"
    ) {
      failures.push("package.json is missing the expected snapshot or approval runtime script.");
      sections.policy = false;
    }
  } catch (error) {
    failures.push(`Unable to read package.json: ${error.message}`);
    sections.policy = false;
  }

  try {
    execFileSync("npm", ["run", "test:unit"], {
      cwd: path.join(ROOT, "dashboard"),
      encoding: "utf8",
      stdio: "pipe",
    });
    execFileSync("npm", ["run", "test:pages"], {
      cwd: path.join(ROOT, "dashboard"),
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    failures.push(`Dashboard tests failed: ${error.message}`);
    sections.dashboardTests = false;
  }

  for (const relativePath of [
    ...PHASE_FILES,
    "reports/command-center-approval-runtime-report.md",
  ]) {
    if (!exists(relativePath)) {
      continue;
    }

    for (const problem of checkLongLines(relativePath)) {
      failures.push(`Line exceeds 1000 characters: ${problem}`);
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
