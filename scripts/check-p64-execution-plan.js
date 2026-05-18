import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p64-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P64_PROVIDER_TOOL_DISPATCH_GOVERNANCE_PLAN.md";
const ROADMAP_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p64-execution-plan-report.md";
const expectedPhases = ["P64.1", "P64.2", "P64.3", "P64.4", "P64.5", "P64.6", "P64.7"];
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
const forbiddenRuntimeTerms = ["provider dispatch", "tool execution", "project mutation", "DB", "deploy"];

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

function arrayIncludesCommand(commands, required) {
  return commands.some((command) => command === required || command.startsWith(`${required} `));
}

let contract = { taskContracts: [] };
let phaseStatus = { phases: [] };

try {
  contract = readJson(CONTRACT_PATH);
} catch (error) {
  fail("contractFile", `Could not parse ${CONTRACT_PATH}: ${error.message}`);
}

try {
  phaseStatus = readJson(STATUS_PATH);
} catch (error) {
  fail("roadmapStatus", `Could not parse ${STATUS_PATH}: ${error.message}`);
}

if (!existsSync(join(ROOT, PLAN_PATH))) fail("docs", `${PLAN_PATH} is missing`);

const tasks = Array.isArray(contract.taskContracts) ? contract.taskContracts : [];
if (tasks.length !== expectedPhases.length) {
  fail("taskContracts", `Expected ${expectedPhases.length} task contracts, found ${tasks.length}`);
}

const taskByPhase = new Map();

for (const task of tasks) {
  const validation = validateTaskContract(task);
  if (!validation.valid) {
    fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    for (const issue of validation.issues) failures.push(`  ${issue.path}: ${issue.message}`);
    continue;
  }

  const inputs = task.inputs || {};
  taskByPhase.set(inputs.phaseId, task);

  for (const field of requiredInputFields) {
    if (!(field in inputs)) fail("requiredFields", `${task.id} missing inputs.${field}`);
  }

  if (!Array.isArray(task.allowedFiles) || task.allowedFiles.length === 0) {
    fail("requiredFields", `${task.id} must list allowedFiles`);
  }
  if (!Array.isArray(task.forbiddenFiles) || task.forbiddenFiles.length === 0) {
    fail("requiredFields", `${task.id} must list forbiddenFiles`);
  }
  if (!task.forbiddenFiles.includes("projects/**")) {
    fail("safetyRules", `${task.id} must forbid projects/**`);
  }

  if (!String(inputs.startingBranch || "").trim()) fail("requiredFields", `${task.id} missing startingBranch`);
  if (!String(inputs.expectedBaseCommit || "").trim()) fail("requiredFields", `${task.id} missing expectedBaseCommit`);
  if (!String(inputs.narrowScope || "").trim()) fail("requiredFields", `${task.id} missing narrowScope`);

  if (!Array.isArray(inputs.safetyRules) || inputs.safetyRules.length < 2) {
    fail("safetyRules", `${task.id} must define safety rules`);
  } else if (!hasAllText(inputs.safetyRules, forbiddenRuntimeTerms)) {
    fail("safetyRules", `${task.id} safety rules must block provider dispatch/tool execution/project mutation/DB/deploy`);
  }

  const reuseCheck = inputs.reuseCheck || {};
  if (!Array.isArray(reuseCheck.inspectBeforeWriting) || reuseCheck.inspectBeforeWriting.length === 0) {
    fail("reuseCheck", `${task.id} must list reuse inspection targets`);
  }
  if (!String(reuseCheck.rule || "").toLowerCase().includes("do not duplicate")) {
    fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
  }

  const uxUpdate = inputs.uxUpdate || {};
  if (!String(uxUpdate.required || "").trim()) fail("uxRules", `${task.id} must describe UX update`);
  if (!String(inputs.commandCenterUxRequirements || "").trim()) {
    fail("uxRules", `${task.id} must define Command Center UX requirements`);
  }
  if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "DemoApp"])) {
    fail("uxRules", `${task.id} Command Center requirements must cover disabled state, raw output safety, and DemoApp boundary`);
  }

  if (!Array.isArray(inputs.themeRequirements) || !hasAllText(inputs.themeRequirements, ["system", "dark", "light"])) {
    fail("themeRules", `${task.id} theme requirements must mention system, dark, and light`);
  }
  if (!Array.isArray(inputs.playwrightTests) || inputs.playwrightTests.length === 0) {
    fail("playwright", `${task.id} must define Playwright requirements`);
  }
  if (!Array.isArray(inputs.checkerUpdates) || inputs.checkerUpdates.length === 0) {
    fail("checkerUpdates", `${task.id} must define checker updates`);
  }

  const exactFiles = inputs.exactFilesModules || {};
  if (!Array.isArray(exactFiles.create) || !Array.isArray(exactFiles.update)) {
    fail("exactFiles", `${task.id} must define exactFilesModules.create and update arrays`);
  }

  const expectedShapes = inputs.expectedExportsSchemasDataShapes || {};
  for (const field of ["exports", "schemas", "dataShapes"]) {
    if (!Array.isArray(expectedShapes[field]) || expectedShapes[field].length === 0) {
      fail("expectedShapes", `${task.id} must define expectedExportsSchemasDataShapes.${field}`);
    }
  }

  if (!Array.isArray(inputs.testsCheckers) || inputs.testsCheckers.length === 0) {
    fail("validationCommands", `${task.id} must list tests/checkers`);
  }
  if (!Array.isArray(inputs.docsRoadmap) || inputs.docsRoadmap.length === 0) {
    fail("requiredFields", `${task.id} must list docs/roadmap updates`);
  }
  if (!String(inputs.phaseStatusUpdate || "").includes(inputs.phaseId)) {
    fail("requiredFields", `${task.id} phase status update must reference ${inputs.phaseId}`);
  }
  if (!Array.isArray(inputs.validationCommands) || inputs.validationCommands.length === 0) {
    fail("validationCommands", `${task.id} must list validation commands`);
  }
  if (!arrayIncludesCommand(inputs.validationCommands || [], "npm run check:p64-execution-plan")) {
    fail("validationCommands", `${task.id} must include npm run check:p64-execution-plan`);
  }
  if (!arrayIncludesCommand(inputs.validationCommands || [], "npm run check:os-phase-status")) {
    fail("validationCommands", `${task.id} must include npm run check:os-phase-status`);
  }
  if (!arrayIncludesCommand(inputs.validationCommands || [], "git diff --check")) {
    fail("validationCommands", `${task.id} must include git diff --check`);
  }
  if (!Array.isArray(inputs.finalSafetyChecks) || !hasAllText(inputs.finalSafetyChecks, forbiddenRuntimeTerms)) {
    fail("finalSafety", `${task.id} final safety checks must cover provider dispatch/tool execution/project mutation/DB/deploy`);
  }
  if (!Array.isArray(inputs.gitCommands) || !hasAllText(inputs.gitCommands, ["git add", "git commit", "git push"])) {
    fail("gitCommands", `${task.id} git commands must include add, commit, and push`);
  }
}

for (const phaseId of expectedPhases) {
  if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
}

const p64 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64");
const p642 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64.2");
const p643 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64.3");
const p644 = phaseStatus.phases?.find((phase) => phase.phaseId === "P64.4");
const expectedNextPhase = p644?.status === "complete"
  ? "P64.5"
  : p643?.status === "complete"
    ? "P64.4"
    : p642?.status === "complete"
      ? "P64.3"
      : "P64.1";
if (p64?.status !== "in_progress") fail("roadmapStatus", "P64 must be in_progress during P64.1 contract work");
if (p64?.nextPhase !== expectedNextPhase) fail("roadmapStatus", `P64 nextPhase must be ${expectedNextPhase}`);
if (phaseStatus.currentPhase !== "P64") fail("roadmapStatus", "Top-level currentPhase must be P64");
if (phaseStatus.previousPhase !== "P63") fail("roadmapStatus", "Top-level previousPhase must be P63");
if (phaseStatus.nextPhase !== expectedNextPhase) fail("roadmapStatus", `Top-level nextPhase must be ${expectedNextPhase}`);

const plan = read(PLAN_PATH);
const roadmap = read(ROADMAP_PATH);
if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
if (!roadmap.includes("P64")) fail("docs", `${ROADMAP_PATH} missing P64`);
for (const phaseId of expectedPhases) {
  if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
}

const checkRows = Object.entries(checks).map(([name, passed]) => ({
  name,
  status: passed ? "PASS" : "FAIL",
  details: "",
}));

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Contract",
      body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${expectedPhases.join(", ")}`].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checkRows),
    },
    {
      title: "Failures",
      body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n"),
    },
    {
      title: "Result",
      body: failures.length === 0 ? "PASS" : "FAIL",
    },
  ],
  {
    title: "P64 Execution Plan Report",
    phase: "P64.1",
  },
);

printCheckReport("P64 Execution Plan Check", checkRows, failures.length === 0 ? "PASS" : "FAIL");

if (failures.length > 0) {
  console.error("P64 execution plan check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("P64 execution plan check passed.");
