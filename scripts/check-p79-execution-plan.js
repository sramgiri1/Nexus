import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p79-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p79-execution-plan-report.md";

export const P79_LIVE_SUBPHASES = ["P79.1", "P79.2", "P79.3", "P79.4", "P79.5", "P79.6", "P79.7"];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function includesAll(text, needles) {
  return needles.every((needle) => text.toLowerCase().includes(needle.toLowerCase()));
}

export function checkP79ExecutionPlan() {
  const checks = {
    contractFile: true,
    taskContracts: true,
    safetyRules: true,
    reuseCheck: true,
    liveGateScope: true,
    uxRules: true,
    exactFiles: true,
    validationCommands: true,
    roadmapStatus: true,
    docs: true,
  };
  const failures = [];
  const fail = (section, message) => {
    checks[section] = false;
    failures.push(message);
  };

  let contract = { taskContracts: [] };
  let status = { phases: [] };
  try { contract = readJson(CONTRACT_PATH); } catch (error) { fail("contractFile", `Could not parse ${CONTRACT_PATH}: ${error.message}`); }
  try { status = readJson(STATUS_PATH); } catch (error) { fail("roadmapStatus", `Could not parse ${STATUS_PATH}: ${error.message}`); }

  const tasks = Array.isArray(contract.taskContracts) ? contract.taskContracts : [];
  if (tasks.length !== P79_LIVE_SUBPHASES.length) fail("taskContracts", `Expected ${P79_LIVE_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (inputs.scopeClassification !== "NEXUS_OS_CHANGE") fail("taskContracts", `${task.id} must be classified as NEXUS_OS_CHANGE`);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!task.forbiddenFiles?.includes("db/**") || !task.forbiddenFiles?.includes("prisma/**") || !task.forbiddenFiles?.includes("migrations/**")) {
      fail("safetyRules", `${task.id} must forbid db/**, prisma/**, and migrations/**`);
    }
    if (!task.forbiddenFiles?.includes("providers/**") || !task.forbiddenFiles?.includes("tools/**") || !task.forbiddenFiles?.includes("worker-runtime/**")) {
      fail("safetyRules", `${task.id} must forbid provider, tool, and worker runtime paths`);
    }
    if (!includesAll((inputs.safetyRules || []).join(" "), ["approval", "scope", "budget", "rollback", "provider", "tool", "project mutation", "DB writes", "deploy", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must cover approval, scope, budget, rollback, runtime execution, mutation, deploy, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!includesAll(inputs.commandCenterUxRequirements || "", ["current state", "next action", "blockers", "disabled reason", "owner", "evidence", "cost impact"])) {
      fail("uxRules", `${task.id} UX requirements must include current state, next action, blockers, disabled reason, owner, evidence, and cost impact`);
    }
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p79-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p79-execution-plan`);
  }

  for (const phaseId of P79_LIVE_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const p791 = taskByPhase.get("P79.1");
  const p791Text = JSON.stringify(p791 || {});
  if (!includesAll(p791Text, ["live-execution/liveExecutionGate.js", "shared/modeGuard.js", "providerCallsAllowed", "projectMutationAllowed", "providerSpendAllowed"])) {
    fail("liveGateScope", "P79.1 must define live mode gate files and blocked capability flags");
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const p79 = phaseStatus.get("P79");
  const expectedNext = P79_LIVE_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "complete";
  if (!["in_progress", "complete"].includes(p79?.status)) fail("roadmapStatus", "P79 must be in_progress or complete");
  if (p79?.nextPhase !== expectedNext) fail("roadmapStatus", `P79 nextPhase must be ${expectedNext}`);
  if (!["P79", ...P79_LIVE_SUBPHASES].includes(status.currentPhase)) fail("roadmapStatus", "currentPhase must be P79 or an active P79 subphase");
  if (status.nextPhase !== expectedNext) fail("roadmapStatus", `nextPhase must be ${expectedNext}`);

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P79_LIVE_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/provider calls[\s\S]+blocked/i.test(plan) || !/project mutation[\s\S]+blocked/i.test(plan) || !/provider spend[\s\S]+blocked/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state provider calls, project mutation, and provider spend remain blocked`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P79_LIVE_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P79 Execution Plan Report", phase: "P79.1" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP79ExecutionPlan();
printCheckReport("P79 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
