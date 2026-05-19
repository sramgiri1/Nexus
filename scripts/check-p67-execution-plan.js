import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p67-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P67_CONTROLLED_SOURCE_MUTATION_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p67-execution-plan-report.md";

export const P67_CONTROLLED_MUTATION_SUBPHASES = ["P67.1", "P67.2", "P67.3", "P67.4", "P67.5", "P67.6", "P67.7"];

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

const forbiddenTerms = [
  "project mutation",
  "provider dispatch",
  "tool execution",
  "worker execution",
  "automatic source apply",
  "DB",
  "deploy",
  "provider spend",
];

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

export function checkP67ExecutionPlan() {
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
  if (tasks.length !== P67_CONTROLLED_MUTATION_SUBPHASES.length) {
    fail("taskContracts", `Expected ${P67_CONTROLLED_MUTATION_SUBPHASES.length} task contracts, found ${tasks.length}`);
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
      fail("safetyRules", `${task.id} safety rules must block mutation, execution, automatic apply, DB, deploy, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) {
      fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    }
    if (!Array.isArray(inputs.reuseCheck?.inspectBeforeWriting) || inputs.reuseCheck.inspectBeforeWriting.length === 0) {
      fail("reuseCheck", `${task.id} must list reuse inspection targets`);
    }
    if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "next action"])) {
      fail("uxRules", `${task.id} UX requirements must cover disabled state, raw output safety, and next action`);
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
    if (!hasCommand(inputs.validationCommands || [], "npm run check:p67-execution-plan")) {
      fail("validationCommands", `${task.id} must include npm run check:p67-execution-plan`);
    }
    if (!hasCommand(inputs.validationCommands || [], "npm run check:os-phase-status")) {
      fail("validationCommands", `${task.id} must include npm run check:os-phase-status`);
    }
    if (!hasCommand(inputs.validationCommands || [], "git diff --check")) {
      fail("validationCommands", `${task.id} must include git diff --check`);
    }
    if (!hasAllText(inputs.finalSafetyChecks || [], forbiddenTerms)) {
      fail("finalSafety", `${task.id} final safety must cover mutation, execution, automatic apply, DB, deploy, and spend`);
    }
    if (!hasAllText(inputs.gitCommands || [], ["git add", "git commit", "git push"])) {
      fail("gitCommands", `${task.id} git commands must include add, commit, and push`);
    }
  }

  for (const phaseId of P67_CONTROLLED_MUTATION_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p67 = phaseStatus.get("P67");
  const expectedNext = P67_CONTROLLED_MUTATION_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P68";
  if (!["in_progress", "complete"].includes(p67?.status)) fail("roadmapStatus", "P67 must be in_progress or complete");
  if (p67?.nextPhase !== expectedNext) fail("roadmapStatus", `P67 nextPhase must be ${expectedNext}`);
  const p67Complete = p67?.status === "complete";
  const expectedCurrent = p67Complete ? "P68" : "P67";
  const expectedPrevious = p67Complete ? "P67" : "P66";
  if (status.currentPhase !== expectedCurrent) fail("roadmapStatus", `currentPhase must be ${expectedCurrent}`);
  if (status.previousPhase !== expectedPrevious) fail("roadmapStatus", `previousPhase must be ${expectedPrevious}`);
  if (status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P67_CONTROLLED_MUTATION_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P67_CONTROLLED_MUTATION_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P67 Execution Plan Report", phase: "P67.1" },
  );

  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP67ExecutionPlan();
printCheckReport("P67 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
