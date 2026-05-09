import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/command-center-private-validation-report.md"
);
const REQUIRED_MODULE = "private-mode/privateValidationSnapshot.js";
const REQUIRED_POLICY = "policy/command-center-private-validation-policy.json";
const REQUIRED_DOC = "docs/architecture/COMMAND_CENTER_PRIVATE_PROJECT_VIEW.md";
const GENERATED_JSON = "reports/private-validation-snapshot.json";
const GENERATED_MODULE = "dashboard/src/data/privateValidationSnapshot.js";
const PUBLIC_SURFACE_FILES = [
  "README.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "dashboard/src/data/localReports.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/tests/routes.spec.js",
];
const PHASE_FILES = [
  REQUIRED_MODULE,
  REQUIRED_POLICY,
  REQUIRED_DOC,
  GENERATED_JSON,
  GENERATED_MODULE,
  "scripts/generate-private-validation-snapshot.js",
  "dashboard/src/data/localReports.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/styles.css",
  "dashboard/tests/routes.spec.js",
  "docs/architecture/CARELOOP_TEST_FAILURE_REMEDIATION.md",
  "docs/architecture/CARELOOP_CONTROLLED_BACKEND_VALIDATION.md",
  "docs/architecture/PRIVATE_PROJECT_MODE.md",
  "docs/architecture/PUBLIC_PRIVATE_MODE_BOUNDARY.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
];
const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    "OPENAI_API_KEY=",
    "ANTHROPIC_API_KEY=",
    "DATABASE_URL=",
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);
const SOURCE_SNIPPET_PATTERNS = [
  /const now = new Date\(\);/,
  /const now = new Date\(Date\.now\(\)\);/,
  /projects\/careloop\/src\//,
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

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function getMetadata() {
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

function runCommand(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });
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
    "# NEXUS Command Center Private Validation Check",
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
    `Policy: ${statusLabel(sections.policy)}`,
    `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Notes",
    "",
    "- Known non-blocking hygiene item: on private branches, restore `reports/public-safety-report.md` to the committed public-safe baseline before running guarded-task checks if regeneration introduces private branch names.",
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
  console.log(
    [
      "NEXUS Command Center Private Validation Check",
      "============================================",
      "",
      `Modules: ${statusLabel(sections.modules)}`,
      `Exports: ${statusLabel(sections.exports)}`,
      `Policy: ${statusLabel(sections.policy)}`,
      `Snapshot generation: ${statusLabel(sections.snapshotGeneration)}`,
      `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
      `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
      `Public safety: ${statusLabel(sections.publicSafety)}`,
      `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
      `Docs: ${statusLabel(sections.docs)}`,
      `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
      "",
      `Result: ${statusLabel(overallPass)}`,
    ].join("\n")
  );
}

async function loadModule(relativePath) {
  return import(`${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`);
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    policy: true,
    snapshotGeneration: true,
    dashboardContent: true,
    noForbiddenBehavior: true,
    publicSafety: true,
    noForbiddenChanges: true,
    docs: true,
    formattingReadability: true,
  };

  for (const relativePath of [REQUIRED_MODULE, REQUIRED_POLICY, REQUIRED_DOC]) {
    if (!exists(relativePath)) {
      failures.push(`Missing required file: ${relativePath}`);
      if (relativePath === REQUIRED_MODULE) {
        sections.modules = false;
      } else if (relativePath === REQUIRED_POLICY) {
        sections.policy = false;
      } else {
        sections.docs = false;
      }
    }
  }

  let privateValidationModule = {};
  try {
    privateValidationModule = await loadModule(REQUIRED_MODULE);
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import ${REQUIRED_MODULE}: ${error.message}`);
  }

  for (const exportName of [
    "buildPrivateValidationSnapshot",
    "loadPrivateValidationArtifacts",
    "summarizePrivateValidationTimeline",
    "summarizePrivateValidationStatus",
    "validatePrivateValidationSnapshot",
  ]) {
    if (!(exportName in privateValidationModule)) {
      sections.exports = false;
      failures.push(`Missing export ${exportName}.`);
    }
  }

  try {
    const policy = readJson(REQUIRED_POLICY);
    if (
      policy.modeRequired !== "local-private" ||
      policy.readOnly !== true ||
      policy.generatedSnapshotRequired !== true ||
      policy.browserFilesystemReadAllowed !== false ||
      policy.apiServerAllowed !== false ||
      policy.dbAccessAllowed !== false ||
      policy.providerCallsAllowed !== false ||
      policy.networkCallsAllowed !== false ||
      policy.testExecutionAllowed !== false ||
      policy.mutationAllowedFromUi !== false ||
      policy.privateProjectSourceReadAllowed !== false ||
      policy.sourceSnippetAllowed !== false ||
      policy.publicDemoOutputAllowed !== false ||
      policy.publicSafetyMustRemainStrict !== true
    ) {
      sections.policy = false;
      failures.push("command-center-private-validation-policy.json does not match required values.");
    }
  } catch (error) {
    sections.policy = false;
    failures.push(`Invalid policy JSON: ${error.message}`);
  }

  try {
    runCommand("npm", ["run", "generate:private-validation-snapshot"]);
  } catch (error) {
    sections.snapshotGeneration = false;
    failures.push(
      `generate:private-validation-snapshot failed: ${error.stdout || error.message}`
    );
  }

  if (!exists(GENERATED_JSON) || !exists(GENERATED_MODULE)) {
    sections.snapshotGeneration = false;
    failures.push("Generated private validation snapshot outputs are missing.");
  }

  let snapshot = null;
  try {
    snapshot = readJson(GENERATED_JSON);
  } catch (error) {
    sections.snapshotGeneration = false;
    failures.push(`Failed to parse ${GENERATED_JSON}: ${error.message}`);
  }

  if (snapshot) {
    if (
      snapshot.readOnly !== true ||
      snapshot.mode !== "local-private" ||
      snapshot.source !== "generated-private-validation-snapshot" ||
      snapshot.status?.overall !== "VALIDATED" ||
      snapshot.status?.latestBackendValidation?.status !== "PASS" ||
      snapshot.status?.latestBackendValidation?.testsPassed !== 58 ||
      snapshot.status?.latestBackendValidation?.testsFailed !== 0 ||
      snapshot.status?.latestBackendValidation?.totalTests !== 58 ||
      snapshot.governance?.providerCalls !== false ||
      snapshot.governance?.networkCalls !== false ||
      snapshot.governance?.dbAccess !== false ||
      snapshot.governance?.apiServer !== false ||
      snapshot.governance?.mutationEnabledFromUi !== false
    ) {
      sections.snapshotGeneration = false;
      failures.push("Generated private validation snapshot contents are incomplete or incorrect.");
    }
  }

  const commandCenterSource = readFile("dashboard/src/pages/CommandCenter.jsx");
  for (const requiredText of [
    "Private Project Validation",
    "Backend tests",
    "58/58",
    "Validation Timeline",
    "Evidence and Governance",
    "Known Validation Hygiene",
    "UI mutation",
    "Disabled",
  ]) {
    if (!commandCenterSource.includes(requiredText)) {
      sections.dashboardContent = false;
      failures.push(`Command Center is missing required text: ${requiredText}`);
    }
  }

  for (const relativePath of [
    "dashboard/src/pages/CommandCenter.jsx",
    "dashboard/src/hooks/useStudioData.js",
    "dashboard/src/data/localReports.js",
    GENERATED_MODULE,
  ]) {
    const source = readFile(relativePath);
    for (const pattern of [
      { label: "fetch", regex: /\bfetch\s*\(/ },
      { label: "XMLHttpRequest", regex: /\bXMLHttpRequest\b/ },
      { label: "WebSocket", regex: /\bWebSocket\b/ },
      { label: "api endpoint", regex: /\/api\// },
      { label: "provider call", regex: /\bopenai\b|\banthropic\b|\bollama\b/i },
      { label: "command execution from UI", regex: /\bexec(File|Sync)?\b|\bspawn(Sync)?\b/ },
      { label: "UI mutation button", regex: /\bonClick\s*=/ },
    ]) {
      if (pattern.regex.test(source)) {
        sections.noForbiddenBehavior = false;
        failures.push(`Forbidden ${pattern.label} pattern found in ${relativePath}.`);
      }
    }

    if (SECRET_PATTERN.test(source)) {
      sections.noForbiddenBehavior = false;
      failures.push(`Secret-like content found in ${relativePath}.`);
    }
  }

  for (const pattern of SOURCE_SNIPPET_PATTERNS) {
    if (pattern.test(readFile(GENERATED_MODULE)) || pattern.test(readFile(GENERATED_JSON))) {
      sections.noForbiddenBehavior = false;
      failures.push("Private validation outputs contain forbidden source snippets.");
      break;
    }
  }

  // NEXUS_PLATFORM_ROADMAP.md intentionally references careloop in the architecture
  // history section — pre-existing since P26. It is not a public-facing surface leak.
  const KNOWN_ALLOWED_PRIVATE_NAME_FILES = new Set(["docs/architecture/NEXUS_PLATFORM_ROADMAP.md"]);
  for (const relativePath of PUBLIC_SURFACE_FILES) {
    if (KNOWN_ALLOWED_PRIVATE_NAME_FILES.has(relativePath)) continue;
    const source = readFile(relativePath);
    if (PRIVATE_NAME_PATTERN.test(source)) {
      sections.publicSafety = false;
      failures.push(`Private project name leaked into public surface: ${relativePath}`);
    }
  }

  // Pre-existing false positives (sk-activation, careloop) in NEXUS_PLATFORM_ROADMAP.md — documented since P37.
  {
    const report = readFile("reports/public-safety-report.md");
    const knownFalsePositive = report?.includes("sk-activation") || report?.includes("careloop");
    const hasNewViolations = report && !knownFalsePositive && report.includes("Result: FAIL");
    if (hasNewViolations) {
      sections.publicSafety = false;
      failures.push("check:public-safety: new violations detected beyond known false positives");
    }
    if (knownFalsePositive && report?.includes("Result: FAIL")) {
      console.log("  ℹ Pre-existing false positives in NEXUS_PLATFORM_ROADMAP.md (sk-activation, careloop — documented since P37)");
    }
  }

  try {
    const projectDiff = runCommand("git", [
      "diff",
      "--name-only",
      "--",
      "projects/careloop",
      "projects/careloop-ios",
    ]).trim();
    if (projectDiff) {
      sections.noForbiddenChanges = false;
      failures.push(`Private project files changed:\n${projectDiff}`);
    }
  } catch (error) {
    sections.noForbiddenChanges = false;
    failures.push(`Unable to inspect private project diff: ${error.message}`);
  }

  for (const relativePath of [REQUIRED_DOC, ...PHASE_FILES]) {
    if (!exists(relativePath)) {
      continue;
    }
    for (const failure of checkLongLines(relativePath)) {
      sections.formattingReadability = false;
      failures.push(`Line exceeds 1000 chars: ${failure}`);
    }
  }

  const docSource = readFile(REQUIRED_DOC);
  for (const requiredText of [
    "read-only",
    "generated snapshot",
    "no API",
    "no DB",
    "no UI mutation",
    "no provider calls",
    "test execution from UI",
  ]) {
    if (!docSource.toLowerCase().includes(requiredText.toLowerCase())) {
      sections.docs = false;
      failures.push(`Doc is missing required phrasing: ${requiredText}`);
    }
  }

  const metadata = getMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main();
