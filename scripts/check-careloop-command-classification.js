import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

const REQUIRED_MODULES = ["careloop-readiness/careloopCommandClassification.js"];

const REQUIRED_EXPORTS = [
  "loadCareLoopValidationPlan",
  "loadCareLoopInventorySnapshot",
  "classifyCareLoopBackendCommand",
  "classifyCareLoopBackendCommands",
  "recommendFirstControlledValidationCommand",
  "runCareLoopCommandClassification",
  "writeCareLoopCommandClassificationReports",
];

const RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
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

function snapshotRuntimeFiles() {
  const snapshot = {};
  for (const rel of RUNTIME_FILES) {
    const abs = path.join(ROOT, rel);
    snapshot[rel] = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  }
  return snapshot;
}

function restoreRuntimeFiles(snapshot) {
  for (const [rel, content] of Object.entries(snapshot)) {
    const abs = path.join(ROOT, rel);
    if (content === null) {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } else {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
  }
}

function getMetadata() {
  const metadata = { generatedAt: new Date().toISOString(), branch: "unknown", head: "unknown" };
  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch { /* ignore */ }
  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  if (!exists(relativePath)) return [];
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function writeReport(metadata, sections, failures) {
  const reportPath = path.join(ROOT, "reports/careloop-command-classification-check.md");
  const lines = [
    "# NEXUS CareLoop Command Classification Check",
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
    `Contract: ${statusLabel(sections.contract)}`,
    `Classification report: ${statusLabel(sections.classificationReport)}`,
    `Expected script classification: ${statusLabel(sections.expectedClassification)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((f) => `- ${f}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  const lines = [
    "NEXUS CareLoop Command Classification Check",
    "==========================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Classification report: ${statusLabel(sections.classificationReport)}`,
    `Expected script classification: ${statusLabel(sections.expectedClassification)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
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
    policy: true,
    contract: true,
    classificationReport: true,
    expectedClassification: true,
    governedLocalPath: true,
    modeBoundary: true,
    publicSafety: true,
    noForbiddenChanges: true,
    formattingReadability: true,
  };

  // 1. Required modules exist
  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      sections.modules = false;
      failures.push(`Missing required module: ${relativePath}`);
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson.scripts?.["careloop:command-classify"] !==
    "NEXUS_MODE=local-private node scripts/careloop-command-classify.js") {
    sections.modules = false;
    failures.push("package.json is missing careloop:command-classify script.");
  }
  if (packageJson.scripts?.["check:careloop-command-classification"] !==
    "node scripts/check-careloop-command-classification.js") {
    sections.modules = false;
    failures.push("package.json is missing check:careloop-command-classification script.");
  }

  // Load modules
  let classificationModule = {};
  let indexModule = {};
  try {
    classificationModule = await import(
      `${pathToFileURL(path.join(ROOT, "careloop-readiness/careloopCommandClassification.js")).href}?t=${Date.now()}`
    );
    indexModule = await import(
      `${pathToFileURL(path.join(ROOT, "careloop-readiness/index.js")).href}?t=${Date.now()}`
    );
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import careloopCommandClassification.js: ${error.message}`);
  }

  // 2. Required exports
  for (const exportName of REQUIRED_EXPORTS) {
    if (!(exportName in classificationModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }

  // 3. Policy
  let policy = null;
  try {
    policy = readJson("policy/careloop-command-classification-policy.json");
  } catch {
    sections.policy = false;
    failures.push("policy/careloop-command-classification-policy.json missing or invalid.");
  }
  if (policy) {
    const checks = {
      modeRequired: "local-private",
      mutationAllowed: false,
      executionAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      apiServerAllowed: false,
      commandExecutionAllowed: false,
      packageScriptReadAllowed: true,
      evidenceAllowed: true,
      auditAllowed: true,
      localTaskRecordAllowed: true,
      publicDemoOutputAllowed: false,
    };
    for (const [key, expected] of Object.entries(checks)) {
      if (policy[key] !== expected) {
        sections.policy = false;
        failures.push(`careloop-command-classification-policy.json: ${key} should be ${JSON.stringify(expected)}`);
      }
    }
  }

  // 4. Contract
  let contract = null;
  const contractPath = path.join(ROOT, "contracts/careloop/backend-command-classification-contract.json");
  if (!fs.existsSync(contractPath)) {
    sections.contract = false;
    failures.push("contracts/careloop/backend-command-classification-contract.json does not exist.");
  } else {
    try {
      contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    } catch {
      sections.contract = false;
      failures.push("contracts/careloop/backend-command-classification-contract.json is not valid JSON.");
    }
  }
  if (contract) {
    const contractChecks = {
      mutationAllowed: false,
      executionAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
    };
    for (const [key, expected] of Object.entries(contractChecks)) {
      if (contract[key] !== expected) {
        sections.contract = false;
        failures.push(`Contract: ${key} should be ${JSON.stringify(expected)}`);
      }
    }
    if (contract.capabilityId !== "verification.code_quality_gate") {
      sections.contract = false;
      failures.push("Contract: capabilityId should be verification.code_quality_gate");
    }
    if (contract.targetAgent !== "auditor") {
      sections.contract = false;
      failures.push("Contract: targetAgent should be auditor");
    }
  }

  // 5. Classification report
  const reportJsonPath = path.join(ROOT, "reports/careloop-command-classification.json");
  const reportMdPath = path.join(ROOT, "reports/careloop-command-classification.md");
  let reportJson = null;

  if (!fs.existsSync(reportJsonPath)) {
    sections.classificationReport = false;
    failures.push("reports/careloop-command-classification.json does not exist.");
  } else {
    try {
      reportJson = JSON.parse(fs.readFileSync(reportJsonPath, "utf8"));
    } catch {
      sections.classificationReport = false;
      failures.push("reports/careloop-command-classification.json is not valid JSON.");
    }
  }

  if (reportJson) {
    if (!Array.isArray(reportJson.commands)) {
      sections.classificationReport = false;
      failures.push("Classification report missing commands array.");
    }
    if (!reportJson.summary || typeof reportJson.summary !== "object") {
      sections.classificationReport = false;
      failures.push("Classification report missing summary.");
    }
    if (!reportJson.recommendedFirstExecution || typeof reportJson.recommendedFirstExecution !== "object") {
      sections.classificationReport = false;
      failures.push("Classification report missing recommendedFirstExecution.");
    }
    // All executionAllowedNow must be false
    const commands = reportJson.commands ?? [];
    if (commands.some((c) => c.executionAllowedNow !== false)) {
      sections.classificationReport = false;
      failures.push("All command executionAllowedNow values must be false.");
    }
    // All mutationAllowed must be false
    if (commands.some((c) => c.mutationAllowed !== false)) {
      sections.classificationReport = false;
      failures.push("All command mutationAllowed values must be false.");
    }
    // Safety flags all false
    const safety = reportJson.safety ?? {};
    const safetyFlags = ["commandsExecuted", "projectMutation", "providerCalls", "networkCalls", "dbAccess", "apiServer", "dependencyInstall"];
    for (const flag of safetyFlags) {
      if (safety[flag] !== false) {
        sections.classificationReport = false;
        failures.push(`Classification report safety.${flag} must be false.`);
      }
    }
    // No secrets
    const secretPatterns = [/sk-[A-Za-z0-9]{10,}/, /ANTHROPIC_API_KEY=/, /DATABASE_URL=/];
    const reportStr = JSON.stringify(reportJson);
    for (const pattern of secretPatterns) {
      if (pattern.test(reportStr)) {
        sections.classificationReport = false;
        failures.push("Classification report JSON contains secret-like content.");
      }
    }
  }

  if (!fs.existsSync(reportMdPath)) {
    sections.classificationReport = false;
    failures.push("reports/careloop-command-classification.md does not exist.");
  } else {
    const mdContent = fs.readFileSync(reportMdPath, "utf8");
    if (!/Validation HEAD/.test(mdContent)) {
      sections.classificationReport = false;
      failures.push("careloop-command-classification.md must include 'Validation HEAD' metadata line.");
    }
  }

  // 6. Expected script classification
  if (reportJson && Array.isArray(reportJson.commands) && reportJson.commands.length > 0) {
    const byName = Object.fromEntries(reportJson.commands.map((c) => [c.name, c]));
    const expectedCategories = {
      dev: "blocked_for_now",
      start: "blocked_for_now",
      migrate: "requires_db",
      studio: "blocked_for_now",
      "qa:reset": "requires_db",
      "qa:seed:sprint1": "requires_db",
      test: "safe_to_run_later",
      "test:watch": "blocked_for_now",
    };
    for (const [name, expectedCategory] of Object.entries(expectedCategories)) {
      if (!(name in byName)) continue;
      const actual = byName[name]?.category;
      if (actual !== expectedCategory) {
        sections.expectedClassification = false;
        failures.push(`Script '${name}': expected category '${expectedCategory}', got '${actual}'.`);
      }
    }
    // generate: safe_to_run_later or requires_dependency_install
    if ("generate" in byName) {
      const genCat = byName["generate"]?.category;
      if (genCat !== "safe_to_run_later" && genCat !== "requires_dependency_install") {
        sections.expectedClassification = false;
        failures.push(`Script 'generate': expected safe_to_run_later or requires_dependency_install, got '${genCat}'.`);
      }
    }
  }

  // 7. Governed local path
  const tasksPath = path.join(ROOT, "local-state/runtime/tasks.json");
  if (!fs.existsSync(tasksPath)) {
    sections.governedLocalPath = false;
    failures.push("local-state/runtime/tasks.json does not exist.");
  } else {
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      const taskList = Array.isArray(tasks.tasks) ? tasks.tasks : [];
      const classificationTasks = taskList.filter(
        (t) => t.taskType === "command_classification" || t.projectId === "private-project-01"
      );
      if (classificationTasks.length === 0) {
        sections.governedLocalPath = false;
        failures.push("No command_classification task found in local task store.");
      }
    } catch {
      sections.governedLocalPath = false;
      failures.push("local-state/runtime/tasks.json is not valid JSON.");
    }
  }

  const evidencePath = path.join(ROOT, "local-state/runtime/evidence.jsonl");
  const auditPath = path.join(ROOT, "local-state/runtime/audit.jsonl");
  const eventsPath = path.join(ROOT, "local-state/runtime/events.jsonl");

  for (const runtimePath of [evidencePath, auditPath, eventsPath]) {
    if (!fs.existsSync(runtimePath)) {
      sections.governedLocalPath = false;
      failures.push(`Missing runtime file: ${path.relative(ROOT, runtimePath)}`);
      continue;
    }
    const lines = fs.readFileSync(runtimePath, "utf8").trim().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (
          record.type === "careloop_backend_command_classification" ||
          record.eventType === "careloop_command_classification_completed" ||
          record.eventType === "governed_command_classification_completed"
        ) {
          if (record.redacted !== true) {
            sections.governedLocalPath = false;
            failures.push("Runtime record of classification type must have redacted: true");
          }
        }
      } catch { /* ignore malformed lines */ }
    }
  }

  // 8. Mode boundary — snapshot/restore runtime files around mutating test calls
  if (classificationModule.runCareLoopCommandClassification) {
    const runtimeSnapshot = snapshotRuntimeFiles();
    try {
      const demoResult = classificationModule.runCareLoopCommandClassification({ env: { NEXUS_MODE: "demo" } });
      if (demoResult.ok !== false || demoResult.errors.length === 0) {
        sections.modeBoundary = false;
        failures.push("Demo mode must block CareLoop command classification.");
      }

      const testResult = classificationModule.runCareLoopCommandClassification({ env: { NEXUS_MODE: "test" } });
      if (testResult.errors.some((e) => e.includes("does not allow"))) {
        sections.modeBoundary = false;
        failures.push("test mode should allow CareLoop command classification.");
      }
    } finally {
      restoreRuntimeFiles(runtimeSnapshot);
    }
  }

  // 9. Public safety
  try {
    execFileSync("node", ["scripts/check-public-safety.js"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch {
    sections.publicSafety = false;
    failures.push("check:public-safety failed.");
  }

  // 10. No forbidden changes
  const projectDiff = execFileSync(
    "git", ["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (projectDiff) {
    sections.noForbiddenChanges = false;
    failures.push("Private project files were modified.");
  }

  const forbiddenDiff = execFileSync(
    "git",
    ["diff", "--name-only", "--", "agents", "orchestrator/loop.js", "orchestrator/runner.js", "tools", "skills", "providers", "state-machine", "config", "memory"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (forbiddenDiff) {
    sections.noForbiddenChanges = false;
    failures.push(`Forbidden paths were modified: ${forbiddenDiff}`);
  }

  // 11. Formatting/readability
  const filesToCheck = [
    "careloop-readiness/careloopCommandClassification.js",
    "scripts/careloop-command-classify.js",
    "scripts/check-careloop-command-classification.js",
    "policy/careloop-command-classification-policy.json",
    "docs/architecture/CARELOOP_COMMAND_CLASSIFICATION.md",
    "reports/careloop-command-classification.md",
    "reports/careloop-command-classification.json",
  ];
  for (const relativePath of filesToCheck) {
    for (const entry of checkLongLines(relativePath)) {
      sections.formattingReadability = false;
      failures.push(`Line exceeds 1000 chars: ${entry}`);
    }
  }

  const metadata = getMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);
  process.exit(overallPass ? 0 : 1);
}

main();
