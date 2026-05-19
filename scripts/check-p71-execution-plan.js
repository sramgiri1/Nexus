import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p71-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P71_PROJECT_SHIPPING_EXPORT_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p71-execution-plan-report.md";

export const P71_PROJECT_SHIPPING_SUBPHASES = ["P71.1", "P71.2", "P71.3", "P71.4", "P71.5", "P71.6", "P71.7"];

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

export function checkP71ExecutionPlan() {
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
  if (tasks.length !== P71_PROJECT_SHIPPING_SUBPHASES.length) fail("taskContracts", `Expected ${P71_PROJECT_SHIPPING_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!hasAllText(inputs.safetyRules || [], ["package creation", "export execution", "project mutation", "provider dispatch", "tool execution", "DB", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must block package/export execution, mutation, provider/tool execution, DB, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "next action"])) fail("uxRules", `${task.id} UX requirements must cover disabled state, raw output safety, and next action`);
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p71-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p71-execution-plan`);
  }
  for (const phaseId of P71_PROJECT_SHIPPING_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p71 = phaseStatus.get("P71");
  const expectedNext = P71_PROJECT_SHIPPING_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P72";
  const finalHandoff = p71?.status === "complete" && status.currentPhase === "P72" && status.previousPhase === "P71" && status.nextPhase === "P72";
  if (!["in_progress", "complete"].includes(p71?.status)) fail("roadmapStatus", "P71 must be in_progress or complete");
  if (p71?.nextPhase !== expectedNext) fail("roadmapStatus", `P71 nextPhase must be ${expectedNext}`);
  if (!finalHandoff && status.currentPhase !== "P71") fail("roadmapStatus", "currentPhase must be P71 before final handoff");
  if (!finalHandoff && status.previousPhase !== "P70") fail("roadmapStatus", "previousPhase must be P70 before final handoff");
  if (!finalHandoff && status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P71_PROJECT_SHIPPING_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/package creation[\s\S]+remain disabled/i.test(plan) || !/export execution[\s\S]+remain disabled/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state package creation and export execution remain disabled`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P71_PROJECT_SHIPPING_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P71 Execution Plan Report", phase: "P71.1" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP71ExecutionPlan();
printCheckReport("P71 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
