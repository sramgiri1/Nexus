import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p648-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P64_8_CODE_MODE_RUNTIME_LAZY_LOADING_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p648-execution-plan-report.md";
const expectedPhases = ["P64.8.1", "P64.8.2", "P64.8.3", "P64.8.4", "P64.8.5"];
const requiredInputFields = [
  "phaseId",
  "startingBranch",
  "expectedBaseCommit",
  "narrowScope",
  "safetyRules",
  "reuseCheck",
  "uxUpdate",
  "exactFilesModules",
  "expectedExportsSchemasDataShapes",
  "commandCenterUxRequirements",
  "themeRequirements",
  "playwrightTests",
  "testsCheckers",
  "checkerUpdates",
  "docsRoadmap",
  "phaseStatusUpdate",
  "validationCommands",
  "finalSafetyChecks",
  "gitCommands",
  "finalResponseChecklist",
];
const forbiddenTerms = ["code execution", "provider dispatch", "tool execution", "project mutation", "DB", "deploy"];
const checks = {
  contractFile: true,
  taskContracts: true,
  requiredFields: true,
  safetyRules: true,
  reuseCheck: true,
  uxRules: true,
  themeRules: true,
  playwright: true,
  checkerUpdates: true,
  exactFiles: true,
  expectedShapes: true,
  gitCommands: true,
  finalSafety: true,
  validationCommands: true,
  roadmapStatus: true,
  docs: true,
};
const failures = [];

function fail(section, message) {
  checks[section] = false;
  failures.push(message);
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function hasAllText(values, needles) {
  const text = values.join(" ").toLowerCase();
  return needles.every((needle) => text.includes(needle.toLowerCase()));
}

function hasCommand(commands, command) {
  return commands.some((entry) => entry === command || entry.startsWith(`${command} `));
}

let contract = { taskContracts: [] };
let status = { phases: [] };
try {
  contract = readJson(CONTRACT_PATH);
} catch (error) {
  fail("contractFile", `Could not parse ${CONTRACT_PATH}: ${error.message}`);
}
try {
  status = readJson(STATUS_PATH);
} catch (error) {
  fail("roadmapStatus", `Could not parse ${STATUS_PATH}: ${error.message}`);
}

const tasks = Array.isArray(contract.taskContracts) ? contract.taskContracts : [];
if (tasks.length !== expectedPhases.length) {
  fail("taskContracts", `Expected ${expectedPhases.length} task contracts, found ${tasks.length}`);
}

const taskByPhase = new Map();
for (const task of tasks) {
  const validation = validateTaskContract(task);
  if (!validation.valid) {
    fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    continue;
  }

  const inputs = task.inputs || {};
  taskByPhase.set(inputs.phaseId, task);
  for (const field of requiredInputFields) {
    if (!(field in inputs)) fail("requiredFields", `${task.id} missing inputs.${field}`);
  }
  if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
  if (!hasAllText(inputs.safetyRules || [], forbiddenTerms)) {
    fail("safetyRules", `${task.id} safety rules must block code/provider/tool/project/DB/deploy execution`);
  }
  if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) {
    fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
  }
  if (!Array.isArray(inputs.reuseCheck?.inspectBeforeWriting) || inputs.reuseCheck.inspectBeforeWriting.length === 0) {
    fail("reuseCheck", `${task.id} must list reuse inspection targets`);
  }
  if (!String(inputs.commandCenterUxRequirements || "").trim()) fail("uxRules", `${task.id} must define UX requirements`);
  if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw"])) {
    fail("uxRules", `${task.id} UX requirements must cover disabled state and raw output safety`);
  }
  if (!Array.isArray(inputs.themeRequirements) || !hasAllText(inputs.themeRequirements, ["system", "dark", "light"])) {
    fail("themeRules", `${task.id} theme requirements must mention system, dark, and light`);
  }
  if (!Array.isArray(inputs.playwrightTests) || inputs.playwrightTests.length === 0) fail("playwright", `${task.id} missing Playwright requirements`);
  if (!Array.isArray(inputs.checkerUpdates) || inputs.checkerUpdates.length === 0) fail("checkerUpdates", `${task.id} missing checker updates`);
  if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) {
    fail("exactFiles", `${task.id} must define exact create/update files`);
  }
  for (const field of ["exports", "schemas", "dataShapes"]) {
    if (!Array.isArray(inputs.expectedExportsSchemasDataShapes?.[field]) || inputs.expectedExportsSchemasDataShapes[field].length === 0) {
      fail("expectedShapes", `${task.id} missing expected ${field}`);
    }
  }
  if (!hasCommand(inputs.validationCommands || [], "npm run check:p648-execution-plan")) {
    fail("validationCommands", `${task.id} must include npm run check:p648-execution-plan`);
  }
  if (!hasCommand(inputs.validationCommands || [], "npm run check:os-phase-status")) {
    fail("validationCommands", `${task.id} must include npm run check:os-phase-status`);
  }
  if (!hasCommand(inputs.validationCommands || [], "git diff --check")) {
    fail("validationCommands", `${task.id} must include git diff --check`);
  }
  if (!hasAllText(inputs.finalSafetyChecks || [], forbiddenTerms)) {
    fail("finalSafety", `${task.id} final safety must cover code/provider/tool/project/DB/deploy execution`);
  }
  if (!hasAllText(inputs.gitCommands || [], ["git add", "git commit", "git push"])) {
    fail("gitCommands", `${task.id} git commands must include add, commit, and push`);
  }
}

for (const phaseId of expectedPhases) {
  if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
}

const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
const p648 = phaseStatus.get("P64.8");
const p6481 = phaseStatus.get("P64.8.1");
const p6482 = phaseStatus.get("P64.8.2");
const p6483 = phaseStatus.get("P64.8.3");
const expectedNext =
  p6483?.status === "complete" ? "P64.8.4" : p6482?.status === "complete" ? "P64.8.3" : p6481?.status === "complete" ? "P64.8.2" : "P64.8.1";
if (p648?.status !== "in_progress") fail("roadmapStatus", "P64.8 must be in_progress");
if (p648?.nextPhase !== expectedNext) fail("roadmapStatus", `P64.8 nextPhase must be ${expectedNext}`);
if (status.currentPhase !== "P64.8") fail("roadmapStatus", "currentPhase must be P64.8");
if (status.previousPhase !== "P64") fail("roadmapStatus", "previousPhase must be P64");
if (status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

const plan = read(PLAN_PATH);
if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
for (const phaseId of expectedPhases) {
  if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
}

const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${expectedPhases.join(", ")}`].join("\n") },
    { title: "Checks", body: buildCheckTable(rows) },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P64.8 Execution Plan Report", phase: "P64.8.1" },
);

printCheckReport("P64.8 Execution Plan Check", rows, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
