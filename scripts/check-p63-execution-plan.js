import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p63-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P63_AI_INTERACTION_SNAPSHOT_RECOVERY_PLAN.md";
const ROADMAP_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const PHASES_PATH = "os-roadmap/nexus-phases.json";
const REPORT_PATH = "reports/p63-execution-plan-report.md";

const expectedPhases = ["P63.1", "P63.2", "P63.3", "P63.4", "P63.5", "P63.6", "P63.7"];
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
const forbiddenRuntimePatterns = [
  "provider",
  "tool",
  "project mutation",
  "DB",
  "deploy",
];

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
  reportWritten: true,
};
const failures = [];

function fail(section, message) {
  checks[section] = false;
  failures.push(message);
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function hasAllText(values, needles) {
  const text = values.join(" ").toLowerCase();
  return needles.every((needle) => text.includes(needle.toLowerCase()));
}

if (!existsSync(join(ROOT, CONTRACT_PATH))) {
  fail("contractFile", `${CONTRACT_PATH} is missing`);
}
if (!existsSync(join(ROOT, PLAN_PATH))) {
  fail("docs", `${PLAN_PATH} is missing`);
}

let contract = { taskContracts: [] };
let phaseStatus = { phases: [] };
let phaseIndex = { phases: [] };

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

try {
  phaseIndex = readJson(PHASES_PATH);
} catch (error) {
  fail("roadmapStatus", `Could not parse ${PHASES_PATH}: ${error.message}`);
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
    for (const issue of validation.issues) {
      failures.push(`  ${issue.path}: ${issue.message}`);
    }
    continue;
  }

  const inputs = task.inputs || {};
  taskByPhase.set(inputs.phaseId, task);

  for (const field of requiredInputFields) {
    if (!(field in inputs)) {
      fail("requiredFields", `${task.id} missing inputs.${field}`);
    }
  }

  if (!Array.isArray(task.allowedFiles) || task.allowedFiles.length === 0) {
    fail("requiredFields", `${task.id} must list allowedFiles`);
  }

  if (!Array.isArray(task.forbiddenFiles) || task.forbiddenFiles.length === 0) {
    fail("requiredFields", `${task.id} must list forbiddenFiles`);
  }

  if (!String(inputs.narrowScope || "").trim()) {
    fail("requiredFields", `${task.id} must define a narrow scope`);
  }

  if (!String(inputs.startingBranch || "").trim()) {
    fail("requiredFields", `${task.id} must define startingBranch`);
  }

  if (!String(inputs.expectedBaseCommit || "").trim()) {
    fail("requiredFields", `${task.id} must define expectedBaseCommit`);
  }

  if (!Array.isArray(inputs.safetyRules) || inputs.safetyRules.length < 2) {
    fail("safetyRules", `${task.id} must define safety rules`);
  }

  if (!hasAllText(inputs.safetyRules || [], forbiddenRuntimePatterns)) {
    fail("safetyRules", `${task.id} safety rules must explicitly block provider/tool/project mutation/DB/deploy enablement`);
  }

  if (!task.forbiddenFiles.includes("projects/**")) {
    fail("safetyRules", `${task.id} must forbid projects/** unless the phase explicitly allows project mutation`);
  }

  const reuseCheck = inputs.reuseCheck || {};
  if (!Array.isArray(reuseCheck.inspectBeforeWriting) || reuseCheck.inspectBeforeWriting.length === 0) {
    fail("reuseCheck", `${task.id} must list reuse inspection targets`);
  }
  if (!String(reuseCheck.rule || "").toLowerCase().includes("do not duplicate")) {
    fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
  }

  const uxUpdate = inputs.uxUpdate || {};
  if (!String(uxUpdate.required || "").trim()) {
    fail("uxRules", `${task.id} must describe UX update`);
  }

  if (!String(inputs.commandCenterUxRequirements || "").trim()) {
    fail("uxRules", `${task.id} must define Command Center UX requirements`);
  }

  if (!Array.isArray(inputs.themeRequirements) || inputs.themeRequirements.length < 3) {
    fail("themeRules", `${task.id} must define dark/light/system theme requirements`);
  } else if (!hasAllText(inputs.themeRequirements, ["system", "dark", "light"])) {
    fail("themeRules", `${task.id} theme requirements must mention system, dark, and light`);
  }

  if (!Array.isArray(inputs.playwrightTests) || inputs.playwrightTests.length === 0) {
    fail("playwright", `${task.id} must define Playwright requirements`);
  }

  if (inputs.phaseId === "P63.5") {
    if (!hasAllText(inputs.safetyRules || [], ["DemoApp", "raw IDs", "primary UX"])) {
      fail("uxRules", "P63.5 must explicitly block DemoApp full exposure and primary raw IDs");
    }
    if (!hasAllText([uxUpdate.required || ""], ["disabled", "restore", "replay", "resume"])) {
      fail("uxRules", "P63.5 UX update must keep restore/replay/resume as disabled previews");
    }
    if (!hasAllText(inputs.playwrightTests || [], ["dark", "light", "system", "DemoApp", "raw"])) {
      fail("playwright", "P63.5 Playwright requirements must cover themes, DemoApp leakage, and raw ID/data safety");
    }
  }

  const exactFiles = inputs.exactFilesModules || {};
  if (!Array.isArray(exactFiles.create) || !Array.isArray(exactFiles.update)) {
    fail("exactFiles", `${task.id} must define exactFilesModules.create and exactFilesModules.update`);
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

  if (!Array.isArray(inputs.checkerUpdates) || inputs.checkerUpdates.length === 0) {
    fail("checkerUpdates", `${task.id} must define checker updates`);
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

  if (!inputs.validationCommands.includes("npm run check:p63-execution-plan")) {
    fail("validationCommands", `${task.id} must include npm run check:p63-execution-plan`);
  }

  if (!inputs.validationCommands.includes("npm run check:os-phase-status")) {
    fail("validationCommands", `${task.id} must include npm run check:os-phase-status`);
  }

  if (!inputs.validationCommands.includes("git diff --check")) {
    fail("validationCommands", `${task.id} must include git diff --check`);
  }

  if (!Array.isArray(inputs.finalSafetyChecks) || inputs.finalSafetyChecks.length === 0) {
    fail("finalSafety", `${task.id} must define final safety checks`);
  } else if (!hasAllText(inputs.finalSafetyChecks, forbiddenRuntimePatterns)) {
    fail("finalSafety", `${task.id} final safety checks must cover provider/tool/project mutation/DB/deploy`);
  }

  if (!Array.isArray(inputs.gitCommands) || inputs.gitCommands.length < 2) {
    fail("gitCommands", `${task.id} must include git add/commit/push commands`);
  } else if (!hasAllText(inputs.gitCommands, ["git add", "git commit", "git push"])) {
    fail("gitCommands", `${task.id} git commands must include add, commit, and push`);
  }

  if (!Array.isArray(inputs.finalResponseChecklist) || inputs.finalResponseChecklist.length < 4) {
    fail("requiredFields", `${task.id} must include a final response checklist`);
  }
}

for (const phaseId of expectedPhases) {
  if (!taskByPhase.has(phaseId)) {
    fail("taskContracts", `Missing task contract for ${phaseId}`);
  }
}

for (let index = 0; index < expectedPhases.length; index += 1) {
  const phaseId = expectedPhases[index];
  const statusEntry = phaseStatus.phases.find((phase) => phase.phaseId === phaseId);
  const catalogEntry = phaseIndex.phases.find((phase) => phase.phaseId === phaseId);
  if (!statusEntry) fail("roadmapStatus", `phase-status missing ${phaseId}`);
  if (!catalogEntry) fail("roadmapStatus", `nexus-phases missing ${phaseId}`);
  if (statusEntry && statusEntry.status !== "planned") {
    fail("roadmapStatus", `${phaseId} must remain planned until implemented`);
  }
  const expectedNext = index === expectedPhases.length - 1 ? "P64" : expectedPhases[index + 1];
  if (statusEntry && statusEntry.nextPhase !== expectedNext) {
    fail("roadmapStatus", `${phaseId} nextPhase must be ${expectedNext}`);
  }
}

const p63 = phaseStatus.phases.find((phase) => phase.phaseId === "P63");
if (p63?.nextPhase !== "P63.1") {
  fail("roadmapStatus", "P63 nextPhase must be P63.1");
}
if (phaseStatus.nextPhase !== "P63") {
  fail("roadmapStatus", "Top-level nextPhase must remain P63");
}

const plan = read(PLAN_PATH);
const roadmap = read(ROADMAP_PATH);
if (!plan.includes(CONTRACT_PATH)) {
  fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
}
for (const phaseId of expectedPhases) {
  if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  if (!roadmap.includes(phaseId)) fail("docs", `${ROADMAP_PATH} missing ${phaseId}`);
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
    title: "P63 Execution Plan Report",
    phase: "P63",
  },
);

printCheckReport("P63 Execution Plan Check", checkRows, failures.length === 0 ? "PASS" : "FAIL");

if (failures.length > 0) {
  console.error("P63 execution plan check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("P63 execution plan check passed.");
