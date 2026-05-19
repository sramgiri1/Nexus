import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p82-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md";
const REPORT_PATH = "reports/p82-execution-plan-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";

export const P82_LIVE_READY_SUBPHASES = ["P82.1", "P82.2", "P82.3", "P82.4", "P82.5", "P82.6", "P82.7"];

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

function stringify(value) {
  return JSON.stringify(value || {});
}

export function checkP82ExecutionPlan() {
  const checks = {
    contractFile: true,
    taskContracts: true,
    safetyRules: true,
    reuseCheck: true,
    uxRules: true,
    exactFiles: true,
    liveReadyScope: true,
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
  if (contract.phase !== "P82") fail("contractFile", "P82 contract must declare phase P82");
  if (contract.classification !== "NEXUS_OS_CHANGE") fail("contractFile", "P82 contract must be NEXUS_OS_CHANGE");
  if (tasks.length !== P82_LIVE_READY_SUBPHASES.length) {
    fail("taskContracts", `Expected ${P82_LIVE_READY_SUBPHASES.length} task contracts, found ${tasks.length}`);
  }

  const requiredForbidden = [
    "projects/**",
    "project-roadmap/**",
    "careloop/**",
    "db/**",
    "providers/**",
    "tools/**",
    "worker-runtime/**",
    "deploy/**",
    "release/**",
    ".env.*",
  ];
  const taskByPhase = new Map();

  for (const task of tasks) {
    const validation = validateTaskContract(task);
    if (!validation.valid) fail("taskContracts", `${task.id || "(unknown task)"} is not a valid task contract`);
    const inputs = task.inputs || {};
    const phaseId = inputs.phaseId;
    taskByPhase.set(phaseId, task);
    if (inputs.scopeClassification !== "NEXUS_OS_CHANGE") fail("taskContracts", `${task.id} must be classified as NEXUS_OS_CHANGE`);
    for (const forbidden of requiredForbidden) {
      if (!task.forbiddenFiles?.includes(forbidden)) fail("safetyRules", `${task.id} must forbid ${forbidden}`);
    }

    const safetyText = stringify([
      inputs.safetyRules,
      inputs.activationGates,
      inputs.finalSafetyChecks,
      inputs.validationCommands,
      inputs.expectedExportsSchemasDataShapes,
    ]);
    if (!includesAll(safetyText, ["approval", "scope", "rollback", "evidence", "cost", "redaction", "validation"])) {
      fail("safetyRules", `${task.id} must cover approval, scope, rollback, evidence, cost, redaction, and validation`);
    }
    const boundaryText = stringify([safetyText, task.forbiddenFiles]);
    if (!includesAll(boundaryText, ["provider", "tool", "worker", "project", "DB", "deploy"])) {
      fail("safetyRules", `${task.id} must account for provider, tool, worker, project, DB, and deploy boundaries`);
    }
    if (!String(inputs.reuseCheck?.rule || "").toLowerCase().includes("do not duplicate")) {
      fail("reuseCheck", `${task.id} reuse rule must prohibit duplicate helpers`);
    }

    const uxText = stringify([inputs.commandCenterUxRequirements, inputs.expectedExportsSchemasDataShapes]);
    if (!includesAll(uxText, ["current", "next", "blockers", "disabled", "evidence", "cost"])) {
      fail("uxRules", `${task.id} UX/data shape must include current state, next action, blockers, disabled reason, evidence, and cost`);
    }
    if (!Array.isArray(inputs.exactFilesModules?.create) || !Array.isArray(inputs.exactFilesModules?.update)) {
      fail("exactFiles", `${task.id} must define exact create/update files`);
    }
    if (!(inputs.validationCommands || []).includes("npm run check:p82-execution-plan")) {
      fail("validationCommands", `${task.id} must include npm run check:p82-execution-plan`);
    }
  }

  for (const phaseId of P82_LIVE_READY_SUBPHASES) {
    if (!taskByPhase.has(phaseId)) fail("taskContracts", `Missing task contract for ${phaseId}`);
  }

  const contractText = JSON.stringify(contract);
  if (!includesAll(contractText, ["Ready", "Needs setup", "Blocked by policy", "provider", "tool", "worker", "project mutation", "DB writes", "deploy", "Command Center"])) {
    fail("liveReadyScope", "P82 contracts must cover live-ready labels and all major execution surfaces");
  }
  if (/"(providerCallsAllowed|toolExecutionAllowed|workerExecutionAllowed|projectMutationAllowed|dbWritesAllowed|networkCallsAllowed|deployExecutionAllowed|providerSpendAllowed|agentDispatchAllowed)"\s*:\s*true/.test(contractText)) {
    fail("safetyRules", "P82 contracts must not enable unsafe runtime flags");
  }

  const phaseStatus = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const expectedNext = P82_LIVE_READY_SUBPHASES.find((phaseId) => phaseStatus.get(phaseId)?.status !== "complete") || "P83";
  if (phaseStatus.get("P81")?.status !== "complete") fail("roadmapStatus", "P81 must be complete before P82 starts");
  if (!["planned", "in_progress", "complete"].includes(phaseStatus.get("P82")?.status)) fail("roadmapStatus", "P82 must be planned, in_progress, or complete");
  if (phaseStatus.get("P82")?.nextPhase !== expectedNext) fail("roadmapStatus", `P82 nextPhase must be ${expectedNext}`);
  const p83ActivePhases = ["P83", "P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"];
  const p83Started = p83ActivePhases.includes(status.currentPhase) && phaseStatus.get("P82")?.status === "complete";
  if ((!["P82", ...P82_LIVE_READY_SUBPHASES].includes(status.currentPhase) || status.nextPhase !== expectedNext) && !p83Started) {
    fail("roadmapStatus", `Root phase status must be active in P82 with nextPhase ${expectedNext}`);
  }

  const plan = read(PLAN_PATH);
  if (!plan.includes(CONTRACT_PATH)) fail("docs", `${PLAN_PATH} must reference ${CONTRACT_PATH}`);
  for (const phaseId of P82_LIVE_READY_SUBPHASES) {
    if (!plan.includes(phaseId)) fail("docs", `${PLAN_PATH} missing ${phaseId}`);
  }
  if (!/provider calls[\s\S]+remain blocked/i.test(plan) || !/project mutation[\s\S]+remain blocked/i.test(plan) || !/provider spend[\s\S]+remain blocked/i.test(plan)) {
    fail("docs", `${PLAN_PATH} must state provider calls, project mutation, and provider spend remain blocked`);
  }

  const rows = Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "PASS" : "FAIL" }));
  writeMarkdownReport(
    REPORT_PATH,
    [
      {
        title: "Contract",
        body: [`- Path: ${CONTRACT_PATH}`, "- Phase: P82.1", `- Subphases: ${P82_LIVE_READY_SUBPHASES.join(", ")}`].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(rows) },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      {
        title: "Known Limitations",
        body: "- P82.1 is contract-only. Provider calls, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
      },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P82 Execution Plan Report", phase: "P82" },
  );
  return { rows, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP82ExecutionPlan();
printCheckReport("P82 Execution Plan Check", result.rows, result.result);
if (result.failures.length > 0) process.exit(1);
