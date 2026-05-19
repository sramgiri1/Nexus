import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p76-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P76_TENANT_PROJECT_ISOLATION_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p76-execution-plan-report.md";

export const P76_ISOLATION_SUBPHASES = ["P76.1", "P76.2", "P76.3", "P76.4", "P76.5", "P76.6", "P76.7"];

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

export function checkP76ExecutionPlan() {
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
  if (tasks.length !== P76_ISOLATION_SUBPHASES.length) fail("taskContracts", `Expected ${P76_ISOLATION_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!task.forbiddenFiles?.includes("db/**") || !task.forbiddenFiles?.includes("prisma/**") || !task.forbiddenFiles?.includes("migrations/**")) {
      fail("safetyRules", `${task.id} must forbid db/**, prisma/**, and migrations/**`);
    }
    if (!task.forbiddenFiles?.includes("providers/**") || !task.forbiddenFiles?.includes("tools/**") || !task.forbiddenFiles?.includes("worker-runtime/**")) {
      fail("safetyRules", `${task.id} must forbid provider, tool, and worker runtime paths`);
    }
    if (!hasAllText(inputs.safetyRules || [], ["tenant", "project", "DB writes", "project mutation", "provider", "tool execution", "network", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must block tenant/project mutation, DB writes, project mutation, provider/tool execution, network calls, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!hasAllText([inputs.commandCenterUxRequirements || ""], ["disabled", "raw", "next action"])) fail("uxRules", `${task.id} UX requirements must cover disabled state, raw output safety, and next action`);
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p76-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p76-execution-plan`);
  }
  for (const phaseId of P76_ISOLATION_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p76 = phaseStatus.get("P76");
  const expectedNext = P76_ISOLATION_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P77";
  const finalHandoff = p76?.status === "complete" && status.currentPhase === "P77" && status.previousPhase === "P76" && status.nextPhase === "P77";
  if (!["in_progress", "complete"].includes(p76?.status)) fail("roadmapStatus", "P76 must be in_progress or complete");
  if (p76?.nextPhase !== expectedNext) fail("roadmapStatus", `P76 nextPhase must be ${expectedNext}`);
  if (!finalHandoff && status.currentPhase !== "P76") fail("roadmapStatus", "currentPhase must be P76 before final handoff");
  if (!finalHandoff && status.previousPhase !== "P75") fail("roadmapStatus", "previousPhase must be P75 before final handoff");
  if (!finalHandoff && status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P76_ISOLATION_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/tenant[\s\S]+mutation[\s\S]+remain disabled/i.test(plan) || !/project[\s\S]+mutation[\s\S]+disabled/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state tenant and project mutation remain disabled`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P76_ISOLATION_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P76 Execution Plan Report", phase: "P76.1" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP76ExecutionPlan();
printCheckReport("P76 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
