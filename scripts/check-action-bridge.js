import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/action-bridge-report.md");
const REQUIRED_MODULES = [
  "action-bridge/actionSchema.js",
  "action-bridge/actionStore.js",
  "action-bridge/actionValidator.js",
  "action-bridge/actionRouter.js",
  "action-bridge/index.js",
];
const REQUIRED_POLICY = "policy/action-bridge-policy.json";
const REQUIRED_DOC = "docs/architecture/COMMAND_CENTER_ACTION_BRIDGE.md";
const GENERATED_JSON = "reports/action-bridge-snapshot.json";
const GENERATED_MODULE = "dashboard/src/data/actionBridgeSnapshot.js";
const RUNTIME_ACTIONS_FILE = "local-state/runtime/actions.jsonl";
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
  const metadata = { generatedAt: new Date().toISOString(), branch: "unknown", head: "unknown" };
  try {
    metadata.branch =
      execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() ||
      "unknown";
    metadata.head =
      execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() ||
      "unknown";
  } catch { /* ignore */ }
  return metadata;
}

function runCommand(command, args) {
  return execFileSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
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
    "# NEXUS Action Bridge Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Action demo: ${statusLabel(sections.actionDemo)}`,
    `Snapshot: ${statusLabel(sections.snapshot)}`,
    `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
    `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
    `No direct execution: ${statusLabel(sections.noDirectExecution)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((f) => `- ${f}`) : ["- None"]),
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
      "NEXUS Action Bridge Check",
      "=========================",
      "",
      `Modules: ${statusLabel(sections.modules)}`,
      `Exports: ${statusLabel(sections.exports)}`,
      `Policy: ${statusLabel(sections.policy)}`,
      `Action demo: ${statusLabel(sections.actionDemo)}`,
      `Snapshot: ${statusLabel(sections.snapshot)}`,
      `Dashboard content: ${statusLabel(sections.dashboardContent)}`,
      `No forbidden behavior: ${statusLabel(sections.noForbiddenBehavior)}`,
      `No direct execution: ${statusLabel(sections.noDirectExecution)}`,
      `Public safety: ${statusLabel(sections.publicSafety)}`,
      `Docs: ${statusLabel(sections.docs)}`,
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
    actionDemo: true,
    snapshot: true,
    dashboardContent: true,
    noForbiddenBehavior: true,
    noDirectExecution: true,
    publicSafety: true,
    docs: true,
  };

  // 1. Module existence
  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      sections.modules = false;
      failures.push(`Missing required module: ${relativePath}`);
    }
  }

  for (const relativePath of [REQUIRED_POLICY, REQUIRED_DOC]) {
    if (!exists(relativePath)) {
      if (relativePath === REQUIRED_POLICY) sections.policy = false;
      else sections.docs = false;
      failures.push(`Missing required file: ${relativePath}`);
    }
  }

  // 2. Exports
  let bridgeModule = {};
  try {
    bridgeModule = await loadModule("action-bridge/index.js");
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import action-bridge/index.js: ${error.message}`);
  }

  for (const exportName of [
    "buildAction",
    "validateActionSchema",
    "validateActionRequest",
    "routeActionRequest",
    "appendAction",
    "readActions",
    "readRecentActions",
    "ACTION_TYPES",
    "ACTION_STATUSES",
    "LOCAL_ACTIONS_FILE",
  ]) {
    if (!(exportName in bridgeModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }

  // 3. Policy
  try {
    const policy = readJson(REQUIRED_POLICY);
    if (
      policy.modeRequired !== "local-private" ||
      policy.readOnly !== true ||
      policy.directCommandExecutionAllowed !== false ||
      policy.browserFilesystemWriteAllowed !== false ||
      policy.providerCallsAllowed !== false ||
      policy.networkCallsAllowed !== false ||
      policy.dbAccessAllowed !== false ||
      policy.mutationAllowedFromUi !== false ||
      policy.npmTestExecutionAllowed !== false ||
      policy.publicSafetyMustRemainStrict !== true
    ) {
      sections.policy = false;
      failures.push("action-bridge-policy.json does not match required values.");
    }
  } catch (error) {
    sections.policy = false;
    failures.push(`Invalid policy JSON: ${error.message}`);
  }

  // 4. Action demo run
  try {
    runCommand("npm", ["run", "action:bridge-demo"]);
  } catch (error) {
    sections.actionDemo = false;
    failures.push(`action:bridge-demo failed: ${error.stdout || error.message}`);
  }

  // 5. Snapshot validation
  if (!exists(GENERATED_JSON) || !exists(GENERATED_MODULE)) {
    sections.snapshot = false;
    failures.push("Generated action bridge snapshot outputs are missing.");
  }

  let snapshot = null;
  try {
    snapshot = readJson(GENERATED_JSON);
  } catch (error) {
    sections.snapshot = false;
    failures.push(`Failed to parse ${GENERATED_JSON}: ${error.message}`);
  }

  if (snapshot) {
    if (
      snapshot.readOnly !== true ||
      snapshot.mode !== "local-private" ||
      snapshot.source !== "action-bridge-demo" ||
      snapshot.bridgeReadiness?.status !== "READY" ||
      snapshot.lastDemoAction?.commandExecuted !== false ||
      snapshot.lastDemoAction?.providerCalled !== false ||
      snapshot.lastDemoAction?.mutationApplied !== false ||
      snapshot.governance?.mutationEnabledFromUi !== false ||
      snapshot.governance?.directCommandExecutionAllowed !== false ||
      snapshot.governance?.providerCallsAllowed !== false
    ) {
      sections.snapshot = false;
      failures.push("Action bridge snapshot contents are incomplete or incorrect.");
    }

    const snapshotStr = JSON.stringify(snapshot);
    if (PRIVATE_NAME_PATTERN.test(snapshotStr)) {
      sections.publicSafety = false;
      failures.push("Private project name found in action bridge snapshot.");
    }

    if (SECRET_PATTERN.test(snapshotStr)) {
      sections.noForbiddenBehavior = false;
      failures.push("Secret-like content found in action bridge snapshot.");
    }
  }

  // Verify actions.jsonl was written
  if (!exists(RUNTIME_ACTIONS_FILE)) {
    sections.actionDemo = false;
    failures.push("local-state/runtime/actions.jsonl was not created by demo.");
  } else {
    const actionsContent = readFile(RUNTIME_ACTIONS_FILE);
    const actionsLines = actionsContent.split("\n").filter(Boolean);
    if (!actionsLines.length) {
      sections.actionDemo = false;
      failures.push("local-state/runtime/actions.jsonl is empty after demo run.");
    } else {
      const lastAction = JSON.parse(actionsLines[actionsLines.length - 1]);
      if (lastAction.requestedCommand !== null) {
        sections.noDirectExecution = false;
        failures.push("Action record has non-null requestedCommand.");
      }
      if (lastAction.mutationRequested !== false) {
        sections.noDirectExecution = false;
        failures.push("Action record has mutationRequested=true.");
      }
      if (lastAction.redacted !== true) {
        sections.noForbiddenBehavior = false;
        failures.push("Action record has redacted=false.");
      }
    }
  }

  // 6. Dashboard content
  if (exists("dashboard/src/pages/CommandCenter.jsx")) {
    const commandCenterSource = readFile("dashboard/src/pages/CommandCenter.jsx");
    for (const requiredText of [
      "Governed Actions",
      "Action bridge readiness",
      "npm run action:bridge-demo",
      "UI cannot execute",
    ]) {
      if (!commandCenterSource.includes(requiredText)) {
        sections.dashboardContent = false;
        failures.push(`Command Center is missing required text: ${requiredText}`);
      }
    }
  } else {
    sections.dashboardContent = false;
    failures.push("dashboard/src/pages/CommandCenter.jsx is missing.");
  }

  // 7. No forbidden behavior in dashboard files
  for (const relativePath of [
    "dashboard/src/pages/CommandCenter.jsx",
    "dashboard/src/hooks/useStudioData.js",
    GENERATED_MODULE,
  ]) {
    if (!exists(relativePath)) continue;
    const source = readFile(relativePath);

    for (const pattern of [
      { label: "fetch(", regex: /\bfetch\s*\(/ },
      { label: "XMLHttpRequest", regex: /\bXMLHttpRequest\b/ },
      { label: "WebSocket", regex: /\bWebSocket\b/ },
      { label: "execSync/spawnSync", regex: /\bexec(File|Sync)?\b|\bspawn(Sync)?\b/ },
    ]) {
      if (pattern.regex.test(source)) {
        sections.noForbiddenBehavior = false;
        failures.push(`Forbidden ${pattern.label} found in ${relativePath}.`);
      }
    }

    if (SECRET_PATTERN.test(source)) {
      sections.noForbiddenBehavior = false;
      failures.push(`Secret-like content found in ${relativePath}.`);
    }
  }

  // 8. No direct execution
  if (exists("scripts/action-bridge-demo.js")) {
    const demoSource = readFile("scripts/action-bridge-demo.js");
    for (const pattern of [
      { label: "npm test execution", regex: /spawnSync.*npm.*test|execFile.*npm.*test/ },
      { label: "direct shell execution in demo", regex: /\bspawnSync\s*\(/ },
    ]) {
      if (pattern.regex.test(demoSource)) {
        sections.noDirectExecution = false;
        failures.push(`Forbidden ${pattern.label} found in action-bridge-demo.js.`);
      }
    }
  }

  // 9. Public safety
  for (const relativePath of [
    "README.md",
    "dashboard/src/data/localReports.js",
    "dashboard/src/hooks/useStudioData.js",
    "dashboard/src/pages/CommandCenter.jsx",
  ]) {
    if (!exists(relativePath)) continue;
    if (PRIVATE_NAME_PATTERN.test(readFile(relativePath))) {
      sections.publicSafety = false;
      failures.push(`Private project name leaked in public surface: ${relativePath}`);
    }
  }

  // 10. Docs
  if (exists(REQUIRED_DOC)) {
    const docSource = readFile(REQUIRED_DOC);
    for (const requiredText of [
      "action bridge",
      "no direct execution",
      "no API",
      "no DB",
      "governed",
    ]) {
      if (!docSource.toLowerCase().includes(requiredText.toLowerCase())) {
        sections.docs = false;
        failures.push(`Doc is missing required phrasing: ${requiredText}`);
      }
    }
  }

  // Formatting
  for (const relativePath of [...REQUIRED_MODULES, REQUIRED_POLICY, REQUIRED_DOC]) {
    if (!exists(relativePath)) continue;
    for (const failure of checkLongLines(relativePath)) {
      failures.push(`Line exceeds 1000 chars: ${failure}`);
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
