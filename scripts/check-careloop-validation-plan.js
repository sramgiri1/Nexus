import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const PLAN_MD_PATH = path.join(ROOT, "reports/careloop-validation-plan.md");
const PLAN_JSON_PATH = path.join(ROOT, "reports/careloop-validation-plan.json");
const CONTRACT_PATH = path.join(ROOT, "contracts/careloop/backend-validation-task-contract.json");

const REQUIRED_MODULES = ["careloop-readiness/careloopValidationPlan.js"];

const REQUIRED_EXPORTS = [
  "createCareLoopBackendValidationTaskContract",
  "buildCareLoopBackendValidationPlan",
  "runCareLoopGovernedValidationPlanning",
  "writeCareLoopValidationPlanReports",
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
  const reportPath = path.join(ROOT, "reports/careloop-validation-plan.md");
  const lines = [
    "# NEXUS CareLoop Validation Plan Check",
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
    `Contract: ${statusLabel(sections.contract)}`,
    `Validation plan: ${statusLabel(sections.validationPlan)}`,
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
    "NEXUS CareLoop Validation Plan Check",
    "====================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Validation plan: ${statusLabel(sections.validationPlan)}`,
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
    validationPlan: true,
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
  if (packageJson.scripts?.["careloop:validation-plan"] !== "NEXUS_MODE=local-private node scripts/careloop-validation-plan.js") {
    sections.modules = false;
    failures.push("package.json is missing careloop:validation-plan script.");
  }
  if (packageJson.scripts?.["check:careloop-validation-plan"] !== "node scripts/check-careloop-validation-plan.js") {
    sections.modules = false;
    failures.push("package.json is missing check:careloop-validation-plan script.");
  }

  // Load module
  let validationPlanModule = {};
  let indexModule = {};
  try {
    validationPlanModule = await import(
      `${pathToFileURL(path.join(ROOT, "careloop-readiness/careloopValidationPlan.js")).href}?t=${Date.now()}`
    );
    indexModule = await import(
      `${pathToFileURL(path.join(ROOT, "careloop-readiness/index.js")).href}?t=${Date.now()}`
    );
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import careloopValidationPlan.js: ${error.message}`);
  }

  // 2. Required exports
  for (const exportName of REQUIRED_EXPORTS) {
    if (!(exportName in validationPlanModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }

  // 3. Policy
  let policy = null;
  try {
    policy = readJson("policy/careloop-validation-plan-policy.json");
  } catch {
    sections.policy = false;
    failures.push("policy/careloop-validation-plan-policy.json missing or invalid.");
  }
  if (policy) {
    const checks = {
      modeRequired: "local-private",
      mutationAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      apiServerAllowed: false,
      evidenceAllowed: true,
      auditAllowed: true,
      localTaskRecordAllowed: true,
      publicDemoOutputAllowed: false,
    };
    for (const [key, expected] of Object.entries(checks)) {
      if (policy[key] !== expected) {
        sections.policy = false;
        failures.push(`careloop-validation-plan-policy.json: ${key} should be ${JSON.stringify(expected)}`);
      }
    }
  }

  // 4. Contract
  let contract = null;
  if (!fs.existsSync(CONTRACT_PATH)) {
    sections.contract = false;
    failures.push("contracts/careloop/backend-validation-task-contract.json does not exist.");
  } else {
    try {
      contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
    } catch {
      sections.contract = false;
      failures.push("contracts/careloop/backend-validation-task-contract.json is not valid JSON.");
    }
  }
  if (contract) {
    const contractChecks = {
      mutationAllowed: false,
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
    if (contract.capabilityId !== "orchestration.plan_flow") {
      sections.contract = false;
      failures.push("Contract: capabilityId should be orchestration.plan_flow");
    }
    if (contract.targetAgent !== "shepherd") {
      sections.contract = false;
      failures.push("Contract: targetAgent should be shepherd");
    }
  }

  // 5. Validation plan
  let planJson = null;
  if (!fs.existsSync(PLAN_JSON_PATH)) {
    sections.validationPlan = false;
    failures.push("reports/careloop-validation-plan.json does not exist.");
  } else {
    try {
      planJson = JSON.parse(fs.readFileSync(PLAN_JSON_PATH, "utf8"));
    } catch {
      sections.validationPlan = false;
      failures.push("reports/careloop-validation-plan.json is not valid JSON.");
    }
  }
  if (planJson) {
    if (!planJson.recommendedNextTask || typeof planJson.recommendedNextTask !== "object") {
      sections.validationPlan = false;
      failures.push("Validation plan missing recommendedNextTask.");
    }
    if (!planJson.safety || planJson.safety.providerCalls !== false) {
      sections.validationPlan = false;
      failures.push("Validation plan safety.providerCalls must be false.");
    }
    const safeChecks = planJson.validationPlan?.safeNextChecks ?? [];
    const hasExecutionNow = safeChecks.some((c) => c.executionNow === true);
    if (hasExecutionNow) {
      sections.validationPlan = false;
      failures.push("Validation plan safeNextChecks must all have executionNow: false.");
    }
    const secretPatterns = [/sk-[A-Za-z0-9]{10,}/, /ANTHROPIC_API_KEY=/, /DATABASE_URL=/];
    const planStr = JSON.stringify(planJson);
    for (const pattern of secretPatterns) {
      if (pattern.test(planStr)) {
        sections.validationPlan = false;
        failures.push("Validation plan JSON contains secret-like content.");
      }
    }
  }

  if (!fs.existsSync(PLAN_MD_PATH)) {
    sections.validationPlan = false;
    failures.push("reports/careloop-validation-plan.md does not exist.");
  } else {
    const mdContent = fs.readFileSync(PLAN_MD_PATH, "utf8");
    if (!/Validation HEAD/.test(mdContent)) {
      sections.validationPlan = false;
      failures.push("careloop-validation-plan.md must include 'Validation HEAD' metadata line.");
    }
  }

  // 6. Governed local path
  const tasksPath = path.join(ROOT, "local-state/runtime/tasks.json");
  if (!fs.existsSync(tasksPath)) {
    sections.governedLocalPath = false;
    failures.push("local-state/runtime/tasks.json does not exist.");
  } else {
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      const taskList = Array.isArray(tasks.tasks) ? tasks.tasks : [];
      if (taskList.length === 0) {
        sections.governedLocalPath = false;
        failures.push("No tasks found in local-state/runtime/tasks.json.");
      } else {
        const pvtTasks = taskList.filter((t) =>
          t.taskType === "validation_planning" ||
          (t.projectId === "private-project-01")
        );
        if (pvtTasks.length === 0) {
          sections.governedLocalPath = false;
          failures.push("No validation_planning task found in local task store.");
        }
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
          record.type === "validation_planning_completed" ||
          record.eventType === "validation_plan_created" ||
          record.eventType === "governed_validation_planning_completed"
        ) {
          if (record.redacted !== true) {
            sections.governedLocalPath = false;
            failures.push(`Runtime record of validation planning type must have redacted: true`);
          }
        }
      } catch { /* ignore malformed lines */ }
    }
  }

  // 7. Mode boundary — snapshot/restore runtime files around mutating test calls
  if (validationPlanModule.runCareLoopGovernedValidationPlanning) {
    const runtimeSnapshot = snapshotRuntimeFiles();
    try {
      const demoResult = validationPlanModule.runCareLoopGovernedValidationPlanning({ mode: "demo" });
      if (demoResult.ok !== false || demoResult.errors.length === 0) {
        sections.modeBoundary = false;
        failures.push("Demo mode must block CareLoop validation planning.");
      }

      const testResult = validationPlanModule.runCareLoopGovernedValidationPlanning({ mode: "test" });
      if (testResult.errors.some((e) => e.includes("does not allow"))) {
        sections.modeBoundary = false;
        failures.push("test mode should allow CareLoop validation planning.");
      }
    } finally {
      restoreRuntimeFiles(runtimeSnapshot);
    }
  }

  // 8. Public safety
  try {
    execFileSync("node", ["scripts/check-public-safety.js"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch {
    sections.publicSafety = false;
    failures.push("check:public-safety failed.");
  }

  // 9. No forbidden changes
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

  // 10. Formatting/readability
  const filesToCheck = [
    "careloop-readiness/careloopValidationPlan.js",
    "scripts/careloop-validation-plan.js",
    "scripts/check-careloop-validation-plan.js",
    "policy/careloop-validation-plan-policy.json",
    "docs/architecture/CARELOOP_GOVERNED_VALIDATION_TASK.md",
    "reports/careloop-validation-plan.md",
    "reports/careloop-validation-plan.json",
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
