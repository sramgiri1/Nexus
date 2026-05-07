import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/command-center-live-report.md");

const REQUIRED_DASHBOARD_FILES = [
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/data/studio.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/data/localReports.js",
  "dashboard/src/data/runtimeTrafficSample.js",
];

const REQUIRED_DOCS = ["docs/architecture/COMMAND_CENTER_LIVE_WIRING.md"];

const INTEGRATION_FILES = [
  "reports/runtime-traffic-plane-report.md",
  "reports/demo-showcase-report.md",
  "reports/public-safety-report.md",
  "dashboard/tests/routes.spec.js",
];

const PHASE_FILES = [
  ...REQUIRED_DASHBOARD_FILES,
  ...REQUIRED_DOCS,
  "README.md",
  "docs/architecture/COMMAND_CENTER_UI.md",
  "docs/architecture/RUNTIME_TRAFFIC_PLANE.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "scripts/check-command-center-live.js",
];

const FORBIDDEN_PATTERNS = [
  { label: "fetch", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "WebSocket", pattern: /\bWebSocket\b/ },
  { label: "api endpoint", pattern: /\/api\// },
  { label: "private project name", pattern: /\bCareLoop\b|\bcareloop\b/ },
  { label: "OpenAI key", pattern: /\bOPENAI_API_KEY=/ },
  { label: "Anthropic key", pattern: /\bANTHROPIC_API_KEY=/ },
  { label: "database url", pattern: /\bDATABASE_URL=/ },
  { label: "private key", pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----/ },
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
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

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Command Center Live Wiring Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Dashboard files: ${statusLabel(sections.dashboardFiles)}`,
    `UI content: ${statusLabel(sections.uiContent)}`,
    `Data modules: ${statusLabel(sections.dataModules)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `README: ${statusLabel(sections.readme)}`,
    `Integration consistency: ${statusLabel(sections.integrationConsistency)}`,
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

function main() {
  const failures = [];
  const sections = {
    dashboardFiles: true,
    uiContent: true,
    dataModules: true,
    noForbiddenBehavior: true,
    docs: true,
    readme: true,
    integrationConsistency: true,
    formattingReadability: true,
  };

  for (const relativePath of REQUIRED_DASHBOARD_FILES) {
    if (!exists(relativePath)) {
      failures.push(`Missing dashboard file: ${relativePath}`);
      sections.dashboardFiles = false;
    }
  }

  const commandCenterText = exists("dashboard/src/pages/CommandCenter.jsx")
    ? readFile("dashboard/src/pages/CommandCenter.jsx")
    : "";
  for (const phrase of [
    "Runtime Traffic Plane",
    "Identity Propagation",
    "Validation Status",
    "Local Evidence",
    "Not Wired Yet",
    "No live API",
    "DemoApp",
  ]) {
    if (!commandCenterText.includes(phrase)) {
      failures.push(`Command Center is missing phrase: ${phrase}`);
      sections.uiContent = false;
    }
  }

  const localReportsText = exists("dashboard/src/data/localReports.js")
    ? readFile("dashboard/src/data/localReports.js")
    : "";
  const runtimeSampleText = exists("dashboard/src/data/runtimeTrafficSample.js")
    ? readFile("dashboard/src/data/runtimeTrafficSample.js")
    : "";
  for (const phrase of [
    "runtimeTrafficPlane",
    "publicSafety",
    "demoShowcase",
    "formatReadability",
  ]) {
    if (!localReportsText.includes(phrase)) {
      failures.push(`dashboard/src/data/localReports.js is missing: ${phrase}`);
      sections.dataModules = false;
    }
  }
  for (const phrase of [
    "evidenceRecordSample",
    "policyDecisionSample",
    "behaviorBaselineSample",
  ]) {
    if (!runtimeSampleText.includes(phrase)) {
      failures.push(`dashboard/src/data/runtimeTrafficSample.js is missing: ${phrase}`);
      sections.dataModules = false;
    }
  }

  for (const relativePath of REQUIRED_DASHBOARD_FILES) {
    if (!exists(relativePath)) continue;
    const text = readFile(relativePath);
    for (const { label, pattern } of FORBIDDEN_PATTERNS) {
      if (pattern.test(text)) {
        failures.push(`Forbidden ${label} found in ${relativePath}`);
        sections.noForbiddenBehavior = false;
      }
    }
  }

  for (const relativePath of REQUIRED_DOCS) {
    if (!exists(relativePath)) {
      failures.push(`Missing doc: ${relativePath}`);
      sections.docs = false;
    }
  }

  const readmeText = exists("README.md") ? readFile("README.md") : "";
  for (const phrase of [
    "Command Center local read-only wiring",
    "no API, DB, or mutation path yet",
  ]) {
    if (!readmeText.includes(phrase)) {
      failures.push(`README is missing phrase: ${phrase}`);
      sections.readme = false;
    }
  }

  for (const relativePath of INTEGRATION_FILES) {
    if (!exists(relativePath)) {
      failures.push(`Missing integration file: ${relativePath}`);
      sections.integrationConsistency = false;
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
    "NEXUS Command Center Live Wiring Check",
    "======================================",
    "",
    `Dashboard files: ${statusLabel(sections.dashboardFiles)}`,
    `UI content: ${statusLabel(sections.uiContent)}`,
    `Data modules: ${statusLabel(sections.dataModules)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `README: ${statusLabel(sections.readme)}`,
    `Integration consistency: ${statusLabel(sections.integrationConsistency)}`,
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
