import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/command-center-runtime-ingestion-report.md"
);
const REQUIRED_MODULES = [
  "local-state/normalizeRuntimeFiles.js",
  "scripts/generate-command-center-snapshot.js",
  "dashboard/src/data/runtimeSnapshot.js",
];
const REQUIRED_DOCS = [
  "docs/architecture/COMMAND_CENTER_RUNTIME_INGESTION.md",
];
const REQUIRED_POLICY =
  "policy/command-center-runtime-ingestion-policy.json";
const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  REQUIRED_POLICY,
  "local-state/readLocalState.js",
  "local-state/index.js",
  "local-state/schema.js",
  "dashboard/src/data/localReports.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/styles.css",
  "dashboard/tests/routes.spec.js",
  "docs/architecture/COMMAND_CENTER_LIVE_WIRING.md",
  "docs/architecture/LOCAL_STATE_ADAPTER.md",
  "docs/architecture/CONTROLLED_LOCAL_EXECUTION.md",
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
    // Ignore metadata failures in local validation mode.
  }

  return metadata;
}

function checkLongLines(relativePath) {
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

async function loadModule(relativePath) {
  const moduleUrl = `${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`;
  return import(moduleUrl);
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Command Center Runtime Ingestion Check",
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
    `Runtime normalization: ${statusLabel(sections.runtimeNormalization)}`,
    `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
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
    "NEXUS Command Center Runtime Ingestion Check",
    "===========================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Runtime normalization: ${statusLabel(sections.runtimeNormalization)}`,
    `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
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
    runtimeNormalization: true,
    snapshotGeneration: true,
    dashboardContent: true,
    noForbiddenBehavior: true,
    docs: true,
    policy: true,
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
    !runtimeSummary.runtimeState ||
    !runtimeSummary.runtimeState.tasks ||
    !runtimeSummary.runtimeState.evidence ||
    !runtimeSummary.runtimeState.audit ||
    !runtimeSummary.runtimeState.events ||
    !runtimeSummary.runtimeState.approvals ||
    !runtimeSummary.runtimeState.incidents
  ) {
    failures.push("Runtime normalization did not return all runtimeState categories.");
    sections.runtimeNormalization = false;
  }

  if (
    !Array.isArray(runtimeSummary.runtimeState.evidence.recent) ||
    !Array.isArray(runtimeSummary.runtimeState.audit.recent)
  ) {
    failures.push("Runtime normalization did not produce recent runtime records.");
    sections.runtimeNormalization = false;
  }

  if (!Array.isArray(runtimeSummary.warnings) || !Array.isArray(runtimeSummary.errors)) {
    failures.push("Runtime normalization must return warnings and errors arrays.");
    sections.runtimeNormalization = false;
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
    runtimeSnapshot.limits?.apiWired !== false ||
    runtimeSnapshot.limits?.dbWired !== false ||
    runtimeSnapshot.limits?.mutationEnabled !== false ||
    runtimeSnapshot.limits?.providerCallsEnabled !== false ||
    privateExecutionFlag !== false
  ) {
    failures.push("Generated runtime snapshot limits or metadata are incorrect.");
    sections.snapshotGeneration = false;
  }

  const commandCenterText = exists("dashboard/src/pages/CommandCenter.jsx")
    ? readFile("dashboard/src/pages/CommandCenter.jsx")
    : "";
  for (const phrase of [
    "Runtime Files",
    "Local Task Store",
    "Evidence Store",
    "Audit Trail",
    "Snapshot Metadata",
    "Not Wired Yet",
  ]) {
    if (!commandCenterText.includes(phrase)) {
      failures.push(`Command Center is missing phrase: ${phrase}`);
      sections.dashboardContent = false;
    }
  }

  for (const relativePath of [
    "dashboard/src/data/runtimeSnapshot.js",
    "dashboard/src/data/localReports.js",
    "dashboard/src/hooks/useStudioData.js",
    "dashboard/src/pages/CommandCenter.jsx",
  ]) {
    if (!exists(relativePath)) {
      continue;
    }

    const text = readFile(relativePath);
    for (const { label, pattern } of FORBIDDEN_PATTERNS) {
      if (pattern.test(text)) {
        failures.push(`Forbidden ${label} found in ${relativePath}`);
        sections.noForbiddenBehavior = false;
      }
    }
  }

  const docsText = exists("docs/architecture/COMMAND_CENTER_RUNTIME_INGESTION.md")
    ? readFile("docs/architecture/COMMAND_CENTER_RUNTIME_INGESTION.md")
    : "";
  for (const phrase of [
    "Generated static snapshot from local-state/runtime",
    "read-only",
    "no API",
    "no DB",
    "no mutation",
  ]) {
    if (!docsText.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`Runtime ingestion doc is missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }

  if (
    !policy ||
    policy.readOnly !== true ||
    policy.mutationAllowed !== false ||
    policy.browserFilesystemReadAllowed !== false ||
    policy.providerCallsAllowed !== false ||
    policy[PRIVATE_EXECUTION_KEY] !== false
  ) {
    failures.push("Command Center runtime ingestion policy values are incorrect.");
    sections.policy = false;
  }

  for (const relativePath of PUBLIC_SCAN_FILES) {
    if (!exists(relativePath)) {
      continue;
    }

    const content = readFile(relativePath);
    if (FORBIDDEN_PATTERNS[4].pattern.test(content)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }

    for (const { label, pattern } of FORBIDDEN_PATTERNS.slice(5)) {
      if (pattern.test(content)) {
        failures.push(`Forbidden ${label} found in ${relativePath}`);
        sections.publicSafety = false;
        break;
      }
    }

    const longLines = checkLongLines(relativePath);
    if (longLines.length > 0) {
      failures.push(...longLines.map((entry) => `Line exceeds 1000 chars: ${entry}`));
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
