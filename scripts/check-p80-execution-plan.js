import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p80-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REPORT_PATH = "reports/p80-execution-plan-report.md";
const HANDOFF_REPORT_PATH = "reports/p797-p80-handoff-report.md";

export const P80_FOUNDER_INTAKE_SUBPHASES = ["P80.1", "P80.2", "P80.3", "P80.4", "P80.5", "P80.6", "P80.7"];

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

export function checkP80ExecutionPlan() {
  const checks = {
    contractFile: true,
    taskContracts: true,
    safetyRules: true,
    reuseCheck: true,
    uxRules: true,
    exactFiles: true,
    founderIntakeScope: true,
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
  if (contract.phase !== "P80") fail("contractFile", "P80 contract must declare phase P80");
  if (tasks.length !== P80_FOUNDER_INTAKE_SUBPHASES.length) fail("taskContracts", `Expected ${P80_FOUNDER_INTAKE_SUBPHASES.length} task contracts, found ${tasks.length}`);

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
    if (!(inputs.validationCommands || []).includes("npm run check:p80-execution-plan")) fail("validationCommands", `${task.id} must include npm run check:p80-execution-plan`);
  }

  for (const phaseId of P80_FOUNDER_INTAKE_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const p801Text = JSON.stringify(taskByPhase.get("P80.1") || {});
  const p804Text = JSON.stringify(taskByPhase.get("P80.4") || {});
  if (!includesAll(p801Text, ["founder-intake/founderIntakeSchema.js", "session", "questionSet", "answerState", "comprehensionScore"])) {
    fail("founderIntakeScope", "P80.1 must define founder intake schemas and data shapes");
  }
  if (!includesAll(p804Text, ["dashboard/src/data/founderIntake", "Command Center", "theme", "Playwright"])) {
    fail("founderIntakeScope", "P80.4 must define Command Center founder intake UX coverage");
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const expectedNext = P80_FOUNDER_INTAKE_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P81";
  const p80Status = phaseStatus.get("P80")?.status;
  const atHandoff = status.currentPhase === "P79.7" && status.nextPhase === "P80";
  if (phaseStatus.get("P79")?.status !== "complete") fail("roadmapStatus", "P79 must be complete before P80 starts");
  if (phaseStatus.get("P79.7")?.status !== "complete") fail("roadmapStatus", "P79.7 must be complete before P80 starts");
  if (!["planned", "in_progress", "complete"].includes(p80Status)) fail("roadmapStatus", "P80 must be planned, in_progress, or complete");
  if (phaseStatus.get("P80")?.nextPhase !== expectedNext) fail("roadmapStatus", `P80 nextPhase must be ${expectedNext}`);
  if (atHandoff) {
    if (expectedNext !== "P80.1") fail("roadmapStatus", "handoff must point to P80.1");
  } else if (!["P80", ...P80_FOUNDER_INTAKE_SUBPHASES].includes(status.currentPhase) || status.nextPhase !== expectedNext) {
    fail("roadmapStatus", `Root phase status must be active in P80 with nextPhase ${expectedNext}`);
  }

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P80_FOUNDER_INTAKE_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/provider calls[\s\S]+blocked/i.test(plan) || !/project mutation[\s\S]+blocked/i.test(plan) || !/provider spend[\s\S]+blocked/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state provider calls, project mutation, and provider spend remain blocked`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      { title: "Contract", body: [`- Path: ${CONTRACT_PATH}`, `- Subphases: ${P80_FOUNDER_INTAKE_SUBPHASES.join(", ")}`].join("\n") },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      {
        title: "Known Limitations",
        body: "- P80 handoff is contract-only. Founder intake runtime implementation starts in P80.1.",
      },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P80 Execution Plan Report", phase: "P80" },
  );
  writeMarkdownReport(
    HANDOFF_REPORT_PATH,
    [
      {
        title: "Scope",
        body: [
          "- P79.7 closes live readiness and hands off to P80 founder intake runtime planning.",
          "- This report is generated by check:p80-execution-plan.",
          "- No provider calls, tool execution, worker execution, project mutation, DB writes, deploy, network calls, or provider spend are enabled.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Next Phase", body: "- P80 Founder Intake Runtime" },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P79.7 P80 Handoff Report", phase: "P79.7" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP80ExecutionPlan();
printCheckReport("P80 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
