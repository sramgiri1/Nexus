import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/local-state-boundary-report.md");

const REQUIRED_MODULES = [
  "local-state/index.js",
  "local-state/readLocalState.js",
  "local-state/normalizeReports.js",
  "local-state/normalizeDemoArtifacts.js",
  "local-state/normalizeRuntimeStatus.js",
  "local-state/safeFileReader.js",
  "local-state/schema.js",
];

const REQUIRED_DOCS = [
  "docs/architecture/LOCAL_STATE_ADAPTER.md",
  "docs/architecture/READ_API_BOUNDARY.md",
];

const REQUIRED_POLICIES = [
  "policy/local-state-policy.json",
  "policy/read-api-boundary-policy.json",
];

const EXPORT_MAP = {
  "local-state/safeFileReader.js": [
    "getRepoRoot",
    "isPathAllowed",
    "readJsonSafe",
    "readTextSafe",
    "listFilesSafe",
  ],
  "local-state/normalizeReports.js": [
    "readValidationReports",
    "summarizeValidationReports",
    "parseReportStatus",
  ],
  "local-state/normalizeDemoArtifacts.js": [
    "readDemoContracts",
    "readDemoReports",
    "readDemoScenario",
    "summarizeDemoArtifacts",
  ],
  "local-state/normalizeRuntimeStatus.js": [
    "getRuntimeTrafficPlaneStatus",
    "getCapabilityStatus",
    "getPolicyStatus",
    "getReadinessSummary",
  ],
  "local-state/readLocalState.js": [
    "readLocalStateSnapshot",
    "validateLocalStateSnapshot",
  ],
  "local-state/schema.js": [
    "LOCAL_STATE_VERSION",
    "ALLOWED_SOURCE_DIRS",
    "BLOCKED_SOURCE_DIRS",
    "KNOWN_REPORTS",
    "KNOWN_DEMO_CONTRACTS",
    "KNOWN_DEMO_REPORTS",
  ],
  "local-state/index.js": [
    "readLocalStateSnapshot",
    "validateLocalStateSnapshot",
    "readValidationReports",
    "summarizeValidationReports",
    "readDemoContracts",
    "readDemoReports",
    "summarizeDemoArtifacts",
    "getRuntimeTrafficPlaneStatus",
    "getCapabilityStatus",
    "getPolicyStatus",
    "getReadinessSummary",
    "readJsonSafe",
    "readTextSafe",
    "listFilesSafe",
    "isPathAllowed",
  ],
};

const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  ...REQUIRED_POLICIES,
  "README.md",
  "docs/architecture/COMMAND_CENTER_LIVE_WIRING.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "scripts/check-local-state-boundary.js",
];

const PUBLIC_SCAN_FILES = [...PHASE_FILES];

const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERNS = [
  new RegExp(`${["OPENAI", "_", "API", "_", "KEY", "="].join("")}`),
  new RegExp(`${["ANTHROPIC", "_", "API", "_", "KEY", "="].join("")}`),
  new RegExp(`${["DATABASE", "_", "URL", "="].join("")}`),
  /sk-[A-Za-z0-9]{10,}/,
  /sk-ant-[A-Za-z0-9_-]{6,}/,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
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
  const lines = readFile(relativePath).split(/\r?\n/);
  return lines
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
    "# NEXUS Local State Boundary Check",
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
    `Safe file reader: ${statusLabel(sections.safeFileReader)}`,
    `Snapshot: ${statusLabel(sections.snapshot)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Demo artifacts: ${statusLabel(sections.demoArtifacts)}`,
    `Runtime status: ${statusLabel(sections.runtimeStatus)}`,
    `Docs: ${statusLabel(sections.docs)}`,
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

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    safeFileReader: true,
    snapshot: true,
    reports: true,
    demoArtifacts: true,
    runtimeStatus: true,
    docs: true,
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

  for (const relativePath of REQUIRED_POLICIES) {
    if (!exists(relativePath)) {
      failures.push(`Missing policy: ${relativePath}`);
      sections.docs = false;
    } else {
      try {
        readJson(relativePath);
      } catch (error) {
        failures.push(`Invalid JSON in ${relativePath}: ${error.message}`);
        sections.docs = false;
      }
    }
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

  const safeFileReader = modules["local-state/safeFileReader.js"];
  const allowedPaths = [
    "reports/runtime-traffic-plane-report.md",
    "demo/reports/release-decision.json",
  ];
  for (const allowedPath of allowedPaths) {
    if (!safeFileReader.isPathAllowed(allowedPath)) {
      failures.push(`Expected allowed path: ${allowedPath}`);
      sections.safeFileReader = false;
    }
  }

  const blockedProjectPath = ["projects/", "care", "loop", "/file.json"].join("");
  const blockedPaths = [
    "../package.json",
    ".env",
    blockedProjectPath,
    "node_modules/test.json",
    ".git/config",
  ];
  for (const blockedPath of blockedPaths) {
    if (safeFileReader.isPathAllowed(blockedPath)) {
      failures.push(`Expected blocked path: ${blockedPath}`);
      sections.safeFileReader = false;
    }
  }

  const textResult = safeFileReader.readTextSafe("reports/runtime-traffic-plane-report.md");
  const jsonResult = safeFileReader.readJsonSafe("demo/reports/release-decision.json");
  if (!textResult.ok || !jsonResult.ok) {
    failures.push("Safe file reader could not read approved local files.");
    sections.safeFileReader = false;
  }

  const localState = modules["local-state/readLocalState.js"];
  const snapshot = localState.readLocalStateSnapshot();
  const snapshotValidation = localState.validateLocalStateSnapshot(snapshot);

  if (snapshot.readOnly !== true || snapshot.source !== "local-files") {
    failures.push("Snapshot must be read-only and sourced from local-files.");
    sections.snapshot = false;
  }
  if (!snapshot.validation?.summary || !snapshot.demo?.summary || !snapshot.runtime?.runtimeTrafficPlane) {
    failures.push("Snapshot is missing required summary sections.");
    sections.snapshot = false;
  }
  if (!snapshotValidation.valid) {
    failures.push(...snapshotValidation.errors.map((error) => `Snapshot validation: ${error}`));
    sections.snapshot = false;
  }

  const reportModule = modules["local-state/normalizeReports.js"];
  let reportState;
  try {
    reportState = reportModule.readValidationReports();
    const reportSummary = reportModule.summarizeValidationReports(reportState);
    if (!Array.isArray(reportState.reports) || reportSummary.total === 0) {
      failures.push("Validation reports did not normalize correctly.");
      sections.reports = false;
    }
    const formatReport = reportState.reports.find((report) => report.id === "format-readability");
    if (formatReport && !Number.isFinite(Number(formatReport.warnings))) {
      failures.push("Format readability warnings were not normalized as a number.");
      sections.reports = false;
    }
    const emptyParse = reportModule.parseReportStatus("");
    if (emptyParse.status !== "UNKNOWN") {
      failures.push("Empty report text should normalize to UNKNOWN.");
      sections.reports = false;
    }
  } catch (error) {
    failures.push(`Report normalization threw: ${error.message}`);
    sections.reports = false;
  }

  const demoModule = modules["local-state/normalizeDemoArtifacts.js"];
  const demoState = demoModule.summarizeDemoArtifacts();
  if (
    !demoState.summary?.contracts ||
    !demoState.summary?.reports ||
    !demoState.summary?.scenarioPresent
  ) {
    failures.push("Demo artifacts did not normalize correctly.");
    sections.demoArtifacts = false;
  }
  if (demoState.summary?.releaseDecision === "GO") {
    failures.push("Demo release decision should not be a fake GO.");
    sections.demoArtifacts = false;
  }
  if (PRIVATE_NAME_PATTERN.test(JSON.stringify(demoState))) {
    failures.push("Demo artifact snapshot contains a private project reference.");
    sections.demoArtifacts = false;
  }

  const runtimeModule = modules["local-state/normalizeRuntimeStatus.js"];
  const runtimeState = runtimeModule.getReadinessSummary();
  if (!runtimeState.runtimeTrafficPlane?.status) {
    failures.push("Runtime traffic plane status is missing.");
    sections.runtimeStatus = false;
  }
  if (runtimeState.runtimeTrafficPlane?.dispatchWiring !== "not_wired") {
    failures.push("dispatchWiring should remain not_wired.");
    sections.runtimeStatus = false;
  }
  if (!runtimeState.policies?.runtimeTraffic || !runtimeState.policies?.securityBoundary) {
    failures.push("Runtime policy presence did not normalize correctly.");
    sections.runtimeStatus = false;
  }

  const localStateDoc = exists("docs/architecture/LOCAL_STATE_ADAPTER.md")
    ? readFile("docs/architecture/LOCAL_STATE_ADAPTER.md")
    : "";
  const readApiDoc = exists("docs/architecture/READ_API_BOUNDARY.md")
    ? readFile("docs/architecture/READ_API_BOUNDARY.md")
    : "";
  const readme = exists("README.md") ? readFile("README.md") : "";

  for (const phrase of [
    "read-only",
    "no DB",
    "no mutation",
    "no API",
  ]) {
    if (!localStateDoc.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`LOCAL_STATE_ADAPTER.md is missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }
  for (const phrase of [
    "local adapter only",
    "API",
    "not local files",
    "no API server",
  ]) {
    if (!readApiDoc.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`READ_API_BOUNDARY.md is missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }
  for (const phrase of ["local state adapter", "read-only file boundary", "no API, DB, or mutation path yet"]) {
    if (!readme.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`README is missing phrase: ${phrase}`);
      sections.docs = false;
    }
  }

  for (const relativePath of PUBLIC_SCAN_FILES) {
    if (!exists(relativePath)) {
      continue;
    }
    const text = readFile(relativePath);
    if (PRIVATE_NAME_PATTERN.test(text)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }
    if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
      failures.push(`Secret-like content found in ${relativePath}`);
      sections.publicSafety = false;
    }
  }

  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) continue;
    const longLines = checkLongLines(relativePath);
    if (longLines.length) {
      failures.push(...longLines.map((entry) => `Line exceeds 1000 chars: ${entry}`));
      sections.formattingReadability = false;
    }
  }

  const metadata = getGitMetadata();
  writeReport(metadata, sections, failures);

  const output = [
    "NEXUS Local State Boundary Check",
    "================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Safe file reader: ${statusLabel(sections.safeFileReader)}`,
    `Snapshot: ${statusLabel(sections.snapshot)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Demo artifacts: ${statusLabel(sections.demoArtifacts)}`,
    `Runtime status: ${statusLabel(sections.runtimeStatus)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
  ];

  console.log(output.join("\n"));

  if (failures.length) {
    process.exitCode = 1;
  }
}

main();
