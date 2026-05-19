import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p68-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P68_SELF_UPDATE_WORKFLOW_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p68-execution-plan-report.md";

export const P68_SELF_UPDATE_SUBPHASES = ["P68.1", "P68.2", "P68.3", "P68.4", "P68.5", "P68.6", "P68.7"];

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

export function checkP68ExecutionPlan() {
  const checks = {
    contractFile: true,
    taskContracts: true,
    safetyRules: true,
    reuseCheck: true,
    uxRules: true,
    exactFiles: true,
    validationCommands: true,
    roadmapStatus: true,
    docs: true,
  };
  const failures = [];
  const fail = (section, message) => { checks[section] = false; failures.push(message); };

  let contract = { taskContracts: [] };
  let status = { phases: [] };
  try { contract = readJson(CONTRACT_PATH); } catch (error) { fail("contractFile", `Could not parse ${CONTRACT_PATH}: ${error.message}`); }
  try { status = readJson(STATUS_PATH); } catch (error) { fail("roadmapStatus", `Could not parse ${STATUS_PATH}: ${error.message}`); }

  const tasks = Array.isArray(contract.taskContracts) ? contract.taskContracts : [];
  if (tasks.length !== P68_SELF_UPDATE_SUBPHASES.length) fail("taskContracts", `Expected ${P68_SELF_UPDATE_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!hasAllText(inputs.safetyRules || [], ["self-update apply", "project mutation", "provider dispatch", "tool execution", "DB", "deploy", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must block self-update apply, mutation, execution, DB, deploy, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "next action"])) fail("uxRules", `${task.id} UX requirements must cover disabled state, raw output safety, and next action`);
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p68-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p68-execution-plan`);
  }
  for (const phaseId of P68_SELF_UPDATE_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p68 = phaseStatus.get("P68");
  const expectedNext = P68_SELF_UPDATE_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P69";
  const p68CompleteHandoff = p68?.status === "complete"
    && p68?.nextPhase === "P69"
    && status.currentPhase === "P69"
    && status.previousPhase === "P68"
    && status.nextPhase === "P70";
  if (!["in_progress", "complete"].includes(p68?.status)) fail("roadmapStatus", "P68 must be in_progress or complete");
  if (p68?.nextPhase !== expectedNext) fail("roadmapStatus", `P68 nextPhase must be ${expectedNext}`);
  if (!p68CompleteHandoff && status.currentPhase !== "P68") fail("roadmapStatus", "currentPhase must be P68 or P69 after P68 completion");
  if (!p68CompleteHandoff && status.previousPhase !== "P67") fail("roadmapStatus", "previousPhase must be P67 before P68 completion");
  if (!p68CompleteHandoff && status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P68_SELF_UPDATE_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P68_SELF_UPDATE_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P68 Execution Plan Report", phase: "P68.1" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP68ExecutionPlan();
printCheckReport("P68 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
