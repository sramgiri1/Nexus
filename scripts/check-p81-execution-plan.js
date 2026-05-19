import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p81-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P81_BUSINESS_BUILD_ORCHESTRATION_PLAN.md";
const REPORT_PATH = "reports/p81-execution-plan-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";

export const P81_BUSINESS_BUILD_SUBPHASES = ["P81.1", "P81.2", "P81.3", "P81.4", "P81.5", "P81.6", "P81.7"];

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

export function checkP81ExecutionPlan() {
  const checks = {
    contractFile: true,
    taskContracts: true,
    safetyRules: true,
    reuseCheck: true,
    uxRules: true,
    exactFiles: true,
    businessBuildScope: true,
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
  if (contract.phase !== "P81") fail("contractFile", "P81 contract must declare phase P81");
  if (tasks.length !== P81_BUSINESS_BUILD_SUBPHASES.length) fail("taskContracts", `Expected ${P81_BUSINESS_BUILD_SUBPHASES.length} task contracts, found ${tasks.length}`);

  const taskByPhase = new Map();
  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    taskByPhase.set(inputs.phaseId, task);
    if (inputs.scopeClassification !== "NEXUS_OS_CHANGE") fail("taskContracts", `${task.id} must be classified as NEXUS_OS_CHANGE`);
    if (!task.forbiddenFiles?.includes("projects/**")) fail("safetyRules", `${task.id} must forbid projects/**`);
    if (!task.forbiddenFiles?.includes("db/**") || !task.forbiddenFiles?.includes("providers/**") || !task.forbiddenFiles?.includes("worker-runtime/**")) {
      fail("safetyRules", `${task.id} must forbid db/**, providers/**, and worker-runtime/**`);
    }
    if (!includesAll((inputs.safetyRules || []).join(" "), ["approval", "scope", "budget", "rollback", "project mutation", "DB writes", "deploy", "provider spend"])) {
      fail("safetyRules", `${task.id} safety rules must cover approval, scope, budget, rollback, mutation, deploy, and spend`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    if (!includesAll(inputs.commandCenterUxRequirements || "", ["current state", "next action", "blockers", "disabled reason", "owner", "evidence", "cost impact"])) {
      fail("uxRules", `${task.id} UX requirements must include current state, next action, blockers, disabled reason, owner, evidence, and cost impact`);
    }
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) fail("exactFiles", `${task.id} must define exact create/update files`);
    if (!(inputs.validationCommands || []).includes("npm run check:p81-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p81-execution-plan`);
  }

  for (const phaseId of P81_BUSINESS_BUILD_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const contractText = JSON.stringify(contract);
  if (!includesAll(contractText, ["PRD", "agent", "workstream", "business build", "Command Center", "Final Validation"])) {
    fail("businessBuildScope", "P81 contracts must cover PRD, agents, workstreams, business build, Command Center, and final validation");
  }
  if (/(providerCallsAllowed|agentDispatchAllowed|projectMutationAllowed|providerSpendAllowed): true/.test(contractText)) {
    fail("safetyRules", "P81 contracts must not enable provider, agent, project, or spend flags");
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const expectedNext = P81_BUSINESS_BUILD_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P82";
  if (phaseStatus.get("P80")?.status !== "complete") fail("roadmapStatus", "P80 must be complete before P81 starts");
  if (!["planned", "in_progress", "complete"].includes(phaseStatus.get("P81")?.status)) fail("roadmapStatus", "P81 must be planned, in_progress, or complete");
  if (phaseStatus.get("P81")?.nextPhase !== expectedNext) fail("roadmapStatus", `P81 nextPhase must be ${expectedNext}`);
  if (!["P81", ...P81_BUSINESS_BUILD_SUBPHASES].includes(status.currentPhase) || status.nextPhase !== expectedNext) {
    fail("roadmapStatus", `Root phase status must be active in P81 with nextPhase ${expectedNext}`);
  }

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P81_BUSINESS_BUILD_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/provider calls[\s\S]+blocked/i.test(plan) || !/project creation[\s\S]+blocked/i.test(plan) || !/provider spend[\s\S]+blocked/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state provider calls, project creation, and provider spend remain blocked`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P81_BUSINESS_BUILD_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      {
        title: "Known Limitations",
        body: "- P81.1 is contract-only. PRD generation execution, agent dispatch, project creation, project mutation, DB writes, deploy, and provider spend remain blocked.",
      },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P81 Execution Plan Report", phase: "P81" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP81ExecutionPlan();
printCheckReport("P81 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
