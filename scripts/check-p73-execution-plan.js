import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p73-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P73_AUTH_RBAC_MULTI_USER_GOVERNANCE_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p73-execution-plan-report.md";

export const P73_AUTH_GOVERNANCE_SUBPHASES = ["P73.1", "P73.2", "P73.3", "P73.4", "P73.5", "P73.6", "P73.7"];

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

export function checkP73ExecutionPlan() {
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
  if (tasks.length !== P73_AUTH_GOVERNANCE_SUBPHASES.length) fail("taskContracts", `Expected ${P73_AUTH_GOVERNANCE_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!task.forbiddenFiles?.includes("auth/**") || !task.forbiddenFiles?.includes("users/**") || !task.forbiddenFiles?.includes("rbac/**")) fail("safetyRules", `${task.id} must forbid auth/**, users/**, and rbac/**`);
    if (!task.forbiddenFiles?.includes("db/**") || !task.forbiddenFiles?.includes("prisma/**")) fail("safetyRules", `${task.id} must forbid db/** and prisma/**`);
    if (!hasAllText(inputs.safetyRules || [], ["user", "role", "DB writes", "project mutation", "provider dispatch", "tool execution", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must block user/role mutation, DB writes, project mutation, provider/tool execution, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "next action"])) fail("uxRules", `${task.id} UX requirements must cover disabled state, raw output safety, and next action`);
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p73-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p73-execution-plan`);
  }
  for (const phaseId of P73_AUTH_GOVERNANCE_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p73 = phaseStatus.get("P73");
  const expectedNext = P73_AUTH_GOVERNANCE_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P74";
  const finalHandoff = p73?.status === "complete" && status.currentPhase === "P74" && status.previousPhase === "P73" && status.nextPhase === "P74";
  if (!["in_progress", "complete"].includes(p73?.status)) fail("roadmapStatus", "P73 must be in_progress or complete");
  if (p73?.nextPhase !== expectedNext) fail("roadmapStatus", `P73 nextPhase must be ${expectedNext}`);
  if (!finalHandoff && status.currentPhase !== "P73") fail("roadmapStatus", "currentPhase must be P73 before final handoff");
  if (!finalHandoff && status.previousPhase !== "P72") fail("roadmapStatus", "previousPhase must be P72 before final handoff");
  if (!finalHandoff && status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P73_AUTH_GOVERNANCE_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/login[\s\S]+remain disabled/i.test(plan) || !/role[\s\S]+mutation[\s\S]+remain disabled/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state login and role mutation remain disabled`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P73_AUTH_GOVERNANCE_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P73 Execution Plan Report", phase: "P73.1" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP73ExecutionPlan();
printCheckReport("P73 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
