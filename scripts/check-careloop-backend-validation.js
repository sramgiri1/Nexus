import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

const REQUIRED_MODULES = [
  "careloop-readiness/careloopControlledValidation.js",
  "command-execution/commandAllowlist.js",
  "command-execution/commandPreflight.js",
  "command-execution/controlledCommandRunner.js",
];

const REQUIRED_VALIDATION_EXPORTS = [
  "loadCareLoopCommandClassification",
  "createCareLoopBackendControlledValidationContract",
  "runCareLoopBackendControlledValidation",
  "writeCareLoopBackendValidationReports",
];

const REQUIRED_ALLOWLIST_EXPORTS = [
  "loadCommandExecutionAllowlist",
  "isCommandAllowed",
  "validateCommandAgainstAllowlist",
];

const REQUIRED_PREFLIGHT_EXPORTS = [
  "runCommandPreflight",
  "checkDependencyAvailability",
  "checkScriptExists",
  "checkNoForbiddenEnvironment",
  "snapshotProjectTree",
  "compareProjectTreeBeforeAfter",
];

const REQUIRED_RUNNER_EXPORTS = [
  "runControlledCommand",
  "redactCommandOutput",
  "createCommandEvidence",
  "normalizeCommandResult",
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

function snapshotProjectTree(projectRoot) {
  const absRoot = path.join(ROOT, projectRoot);
  if (!fs.existsSync(absRoot)) return {};
  const paths = {};
  function walk(dir, relBase) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git") continue;
      const relPath = relBase ? `${relBase}/${entry}` : entry;
      const fullPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) { walk(fullPath, relPath); }
        else { paths[relPath] = { size: stat.size, mtime: stat.mtimeMs }; }
      } catch { /* ignore */ }
    }
  }
  walk(absRoot, "");
  return paths;
}

function getMetadata() {
  const metadata = { generatedAt: new Date().toISOString(), branch: "unknown", head: "unknown" };
  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch { /* ignore */ }
  return metadata;
}

function statusLabel(pass) { return pass ? "PASS" : "FAIL"; }

function checkLongLines(relativePath) {
  if (!exists(relativePath)) return [];
  return readFile(relativePath).split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function writeReport(metadata, sections, failures) {
  const reportPath = path.join(ROOT, "reports/careloop-backend-validation-check.md");
  const lines = [
    "# NEXUS CareLoop Backend Validation Check",
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
    `Policies: ${statusLabel(sections.policies)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Allowlist: ${statusLabel(sections.allowlist)}`,
    `Preflight: ${statusLabel(sections.preflight)}`,
    `Execution: ${statusLabel(sections.execution)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
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
  console.log([
    "NEXUS CareLoop Backend Validation Check",
    "======================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Allowlist: ${statusLabel(sections.allowlist)}`,
    `Preflight: ${statusLabel(sections.preflight)}`,
    `Execution: ${statusLabel(sections.execution)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ].join("\n"));
}

async function main() {
  const failures = [];
  const sections = {
    modules: true, exports: true, policies: true, contract: true,
    allowlist: true, preflight: true, execution: true, reports: true,
    governedLocalPath: true, publicSafety: true, noForbiddenChanges: true,
    formattingReadability: true,
  };

  // 1. Required modules
  for (const rel of REQUIRED_MODULES) {
    if (!exists(rel)) {
      sections.modules = false;
      failures.push(`Missing required module: ${rel}`);
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson.scripts?.["careloop:backend-validate"] !==
    "NEXUS_MODE=local-private node scripts/careloop-backend-validate.js") {
    sections.modules = false;
    failures.push("package.json missing careloop:backend-validate script.");
  }
  if (packageJson.scripts?.["check:careloop-backend-validation"] !==
    "node scripts/check-careloop-backend-validation.js") {
    sections.modules = false;
    failures.push("package.json missing check:careloop-backend-validation script.");
  }

  // 2. Required exports
  let validationModule = {}, allowlistModule = {}, preflightModule = {}, runnerModule = {};
  try {
    validationModule = await import(`${pathToFileURL(path.join(ROOT, "careloop-readiness/careloopControlledValidation.js")).href}?t=${Date.now()}`);
    allowlistModule = await import(`${pathToFileURL(path.join(ROOT, "command-execution/commandAllowlist.js")).href}?t=${Date.now()}`);
    preflightModule = await import(`${pathToFileURL(path.join(ROOT, "command-execution/commandPreflight.js")).href}?t=${Date.now()}`);
    runnerModule = await import(`${pathToFileURL(path.join(ROOT, "command-execution/controlledCommandRunner.js")).href}?t=${Date.now()}`);
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import modules: ${error.message}`);
  }

  for (const name of REQUIRED_VALIDATION_EXPORTS) {
    if (!(name in validationModule)) { sections.exports = false; failures.push(`Missing export: ${name} from careloopControlledValidation.js`); }
  }
  for (const name of REQUIRED_ALLOWLIST_EXPORTS) {
    if (!(name in allowlistModule)) { sections.exports = false; failures.push(`Missing export: ${name} from commandAllowlist.js`); }
  }
  for (const name of REQUIRED_PREFLIGHT_EXPORTS) {
    if (!(name in preflightModule)) { sections.exports = false; failures.push(`Missing export: ${name} from commandPreflight.js`); }
  }
  for (const name of REQUIRED_RUNNER_EXPORTS) {
    if (!(name in runnerModule)) { sections.exports = false; failures.push(`Missing export: ${name} from controlledCommandRunner.js`); }
  }

  // 3. Policies
  for (const policyPath of ["policy/careloop-controlled-validation-policy.json", "policy/command-execution-allowlist.json"]) {
    if (!exists(policyPath)) {
      sections.policies = false;
      failures.push(`Missing policy: ${policyPath}`);
      continue;
    }
    try { readJson(policyPath); } catch {
      sections.policies = false;
      failures.push(`Invalid JSON: ${policyPath}`);
    }
  }

  const cvPolicy = exists("policy/careloop-controlled-validation-policy.json")
    ? (() => { try { return readJson("policy/careloop-controlled-validation-policy.json"); } catch { return null; } })()
    : null;
  if (cvPolicy) {
    const checks = {
      modeRequired: "local-private", mutationAllowed: false, buildExecutionAllowed: false,
      testExecutionAllowed: true, providerCallsAllowed: false, networkCallsAllowed: false,
      dbAccessAllowed: false, apiServerAllowed: false, dependencyInstallAllowed: false,
      commandOutputCaptureAllowed: true, commandOutputRedactionRequired: true,
      evidenceAllowed: true, auditAllowed: true, publicDemoOutputAllowed: false,
    };
    for (const [key, expected] of Object.entries(checks)) {
      if (cvPolicy[key] !== expected) {
        sections.policies = false;
        failures.push(`careloop-controlled-validation-policy.json: ${key} should be ${JSON.stringify(expected)}, got ${JSON.stringify(cvPolicy[key])}`);
      }
    }
  }

  // 4. Contract
  let contract = null;
  const contractPath = path.join(ROOT, "contracts/careloop/backend-controlled-validation-contract.json");
  if (!fs.existsSync(contractPath)) {
    sections.contract = false;
    failures.push("contracts/careloop/backend-controlled-validation-contract.json does not exist.");
  } else {
    try { contract = JSON.parse(fs.readFileSync(contractPath, "utf8")); }
    catch { sections.contract = false; failures.push("backend-controlled-validation-contract.json is not valid JSON."); }
  }
  if (contract) {
    const contractChecks = {
      mutationAllowed: false, buildExecutionAllowed: false, testExecutionAllowed: true,
      providerCallsAllowed: false, networkCallsAllowed: false, dbAccessAllowed: false,
      dependencyInstallAllowed: false,
    };
    for (const [key, expected] of Object.entries(contractChecks)) {
      if (contract[key] !== expected) {
        sections.contract = false;
        failures.push(`Contract: ${key} should be ${JSON.stringify(expected)}`);
      }
    }
    if (contract.command !== "npm") { sections.contract = false; failures.push("Contract: command should be npm"); }
    if (JSON.stringify(contract.args) !== JSON.stringify(["test"])) { sections.contract = false; failures.push("Contract: args should be [\"test\"]"); }
    if (contract.capabilityId !== "verification.code_quality_gate") { sections.contract = false; failures.push("Contract: capabilityId should be verification.code_quality_gate"); }
    if (contract.targetAgent !== "auditor") { sections.contract = false; failures.push("Contract: targetAgent should be auditor"); }
  }

  // 5. Allowlist
  if (allowlistModule.validateCommandAgainstAllowlist) {
    const npmTestResult = allowlistModule.validateCommandAgainstAllowlist({
      projectId: "careloop", command: "npm", args: ["test"],
      workingDirectory: "projects/careloop", mode: "local-private",
    });
    if (!npmTestResult.allowed) {
      sections.allowlist = false;
      failures.push(`npm test should be allowed by allowlist: ${npmTestResult.reason}`);
    }

    const npmInstallResult = allowlistModule.validateCommandAgainstAllowlist({
      projectId: "careloop", command: "npm", args: ["install"],
      workingDirectory: "projects/careloop", mode: "local-private",
    });
    if (npmInstallResult.allowed) {
      sections.allowlist = false;
      failures.push("npm install must be blocked by allowlist.");
    }

    for (const blockedArgs of [["run", "dev"], ["start"], ["run", "migrate"], ["run", "studio"], ["run", "test:watch"]]) {
      const r = allowlistModule.validateCommandAgainstAllowlist({
        projectId: "careloop", command: "npm", args: blockedArgs,
        workingDirectory: "projects/careloop", mode: "local-private",
      });
      if (r.allowed) {
        sections.allowlist = false;
        failures.push(`npm ${blockedArgs.join(" ")} must be blocked by allowlist.`);
      }
    }
  }

  // 6. Preflight
  if (preflightModule.runCommandPreflight) {
    const preflightResult = preflightModule.runCommandPreflight({
      projectRoot: "projects/careloop", scriptName: "test", mode: "local-private",
    });
    if (!preflightResult.scriptExists) {
      sections.preflight = false;
      failures.push("Preflight: test script not found in package.json.");
    }
    // Check that missing deps block execution.
    const fakeRoot = "projects/does-not-exist";
    const missingResult = preflightModule.runCommandPreflight({
      projectRoot: fakeRoot, scriptName: "test", mode: "local-private",
    });
    if (missingResult.ok) {
      sections.preflight = false;
      failures.push("Preflight should block when project root does not exist.");
    }
  }

  // 7. Execution — validate report
  const reportJsonPath = path.join(ROOT, "reports/careloop-backend-validation.json");
  const reportMdPath = path.join(ROOT, "reports/careloop-backend-validation.md");
  let reportJson = null;

  if (!fs.existsSync(reportJsonPath)) {
    sections.reports = false;
    sections.execution = false;
    failures.push("reports/careloop-backend-validation.json does not exist.");
  } else {
    try { reportJson = JSON.parse(fs.readFileSync(reportJsonPath, "utf8")); }
    catch { sections.reports = false; failures.push("reports/careloop-backend-validation.json is not valid JSON."); }
  }

  if (reportJson) {
    // execution.status must be PASS, FAIL, BLOCKED, or TIMEOUT — all are valid.
    const validStatuses = new Set(["PASS", "FAIL", "BLOCKED", "TIMEOUT"]);
    if (!validStatuses.has(reportJson.execution?.status)) {
      sections.execution = false;
      failures.push(`Execution status must be PASS/FAIL/BLOCKED/TIMEOUT, got: ${reportJson.execution?.status}`);
    }
    // Safety flags must all be false.
    const safety = reportJson.safety ?? {};
    for (const flag of ["providerCalls", "networkCalls", "dbAccess", "apiServer", "dependencyInstall", "projectMutation"]) {
      if (safety[flag] !== false) {
        sections.execution = false;
        failures.push(`Report safety.${flag} must be false.`);
      }
    }
    // No mutation allowed.
    if (reportJson.execution?.mutationDetected === true) {
      sections.execution = false;
      failures.push("Execution must not detect project mutation.");
    }
    // No secrets.
    const secretPatterns = [/sk-[A-Za-z0-9]{10,}/, /ANTHROPIC_API_KEY=/, /DATABASE_URL=/];
    const reportStr = JSON.stringify(reportJson);
    for (const pattern of secretPatterns) {
      if (pattern.test(reportStr)) {
        sections.reports = false;
        failures.push("Validation report JSON contains secret-like content.");
      }
    }
  }

  if (!fs.existsSync(reportMdPath)) {
    sections.reports = false;
    failures.push("reports/careloop-backend-validation.md does not exist.");
  } else {
    const mdContent = fs.readFileSync(reportMdPath, "utf8");
    if (!/Validation HEAD/.test(mdContent)) {
      sections.reports = false;
      failures.push("careloop-backend-validation.md must include 'Validation HEAD' metadata line.");
    }
  }

  // 8. Reports (separate from execution check above)
  // Already validated above; nothing more needed here.

  // 9. Governed local path
  const tasksPath = path.join(ROOT, "local-state/runtime/tasks.json");
  if (!fs.existsSync(tasksPath)) {
    sections.governedLocalPath = false;
    failures.push("local-state/runtime/tasks.json does not exist.");
  } else {
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      const taskList = Array.isArray(tasks.tasks) ? tasks.tasks : [];
      const validationTasks = taskList.filter(
        (t) => t.taskType === "controlled_validation" || t.projectId === "private-project-01"
      );
      if (validationTasks.length === 0) {
        sections.governedLocalPath = false;
        failures.push("No controlled_validation task found in local task store.");
      }
    } catch {
      sections.governedLocalPath = false;
      failures.push("local-state/runtime/tasks.json is not valid JSON.");
    }
  }

  for (const runtimePath of [
    path.join(ROOT, "local-state/runtime/evidence.jsonl"),
    path.join(ROOT, "local-state/runtime/audit.jsonl"),
    path.join(ROOT, "local-state/runtime/events.jsonl"),
  ]) {
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
          record.type === "controlled_validation_completed" ||
          record.type === "controlled_validation_blocked" ||
          record.type === "controlled_validation_preflight_blocked" ||
          record.eventType === "controlled_validation_completed" ||
          record.eventType === "governed_controlled_validation_completed" ||
          record.eventType === "governed_controlled_validation_blocked"
        ) {
          if (record.redacted !== true) {
            sections.governedLocalPath = false;
            failures.push("Runtime record of controlled validation type must have redacted: true");
          }
        }
      } catch { /* ignore malformed lines */ }
    }
  }

  // Mode boundary — snapshot and restore runtime files
  if (validationModule.runCareLoopBackendControlledValidation) {
    const runtimeSnapshot = snapshotRuntimeFiles();
    const projectSnapshot = snapshotProjectTree("projects/careloop");
    try {
      const demoResult = validationModule.runCareLoopBackendControlledValidation({ env: { NEXUS_MODE: "demo" } });
      if (demoResult.ok !== false || demoResult.errors.length === 0) {
        sections.governedLocalPath = false;
        failures.push("Demo mode must block controlled validation.");
      }
    } finally {
      restoreRuntimeFiles(runtimeSnapshot);
    }
    // Verify project tree unchanged after mode boundary test.
    const projectAfter = snapshotProjectTree("projects/careloop");
    const addedPaths = Object.keys(projectAfter).filter((k) => !(k in projectSnapshot));
    const removedPaths = Object.keys(projectSnapshot).filter((k) => !(k in projectAfter));
    if (addedPaths.length > 0 || removedPaths.length > 0) {
      sections.noForbiddenChanges = false;
      failures.push(`Private project tree mutated during mode boundary test: added=${addedPaths.length}, removed=${removedPaths.length}`);
    }
  }

  // 10. Public safety
  try {
    execFileSync("node", ["scripts/check-public-safety.js"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch {
    sections.publicSafety = false;
    failures.push("check:public-safety failed.");
  }

  // 11. No forbidden changes
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

  // 12. Formatting/readability
  const filesToCheck = [
    "careloop-readiness/careloopControlledValidation.js",
    "command-execution/commandAllowlist.js",
    "command-execution/commandPreflight.js",
    "command-execution/controlledCommandRunner.js",
    "scripts/careloop-backend-validate.js",
    "scripts/check-careloop-backend-validation.js",
    "policy/careloop-controlled-validation-policy.json",
    "policy/command-execution-allowlist.json",
    "docs/architecture/CARELOOP_CONTROLLED_BACKEND_VALIDATION.md",
    "reports/careloop-backend-validation.md",
    "reports/careloop-backend-validation.json",
  ];
  for (const rel of filesToCheck) {
    for (const entry of checkLongLines(rel)) {
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
