import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p84-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md";
const REPORT_PATH = "reports/p84-execution-plan-report.md";
const P84_SUBPHASES = ["P84.1", "P84.2", "P84.3", "P84.4", "P84.5", "P84.6", "P84.7"];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const contract = readJson(CONTRACT_PATH);
const plan = read(PLAN_PATH);
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const tasks = Array.isArray(contract.taskContracts) ? contract.taskContracts : [];
const taskByPhase = new Map(tasks.map((task) => [task.inputs?.phaseId, task]));
const invalidTasks = tasks.flatMap((task) => validateTaskContract(task).valid ? [] : [task.id || "unknown"]);
const allSafetyText = JSON.stringify(tasks.map((task) => task.inputs || {}));
const requiredForbidden = ["projects/**", "careloop/**", "providers/**", "tools/**", "worker-runtime/**", "db/**", "deploy/**", "release/**", ".env.*"];

addCheck("contract declares P84", contract.phase === "P84" && contract.classification === "NEXUS_OS_CHANGE");
addCheck("seven subphases are planned", P84_SUBPHASES.every((phaseId) => taskByPhase.has(phaseId)) && tasks.length >= 7);
addCheck("task contracts validate", invalidTasks.length === 0, invalidTasks.join(", "));
addCheck("forbidden roots are covered", tasks.every((task) => requiredForbidden.every((root) => task.forbiddenFiles?.includes(root))));
addCheck("P84.1 exact module is listed", JSON.stringify(taskByPhase.get("P84.1")?.allowedFiles || []).includes("live-ready/founderRuntimeAdmission.js"));
addCheck("reuse rule names P80 and P81 helpers", allSafetyText.includes("P80") && allSafetyText.includes("P81"));
addCheck("unsafe runtime remains blocked in contract", /provider\/model calls|agent dispatch|project mutation|DB writes|provider spend/i.test(allSafetyText));
addCheck("docs reference contract", plan.includes(CONTRACT_PATH));
addCheck("docs list all subphases", P84_SUBPHASES.every((phaseId) => plan.includes(phaseId)));
addCheck(
  "status advanced through P84",
  statusById.get("P84")?.status === "in_progress"
    && statusById.get("P84.1")?.status === "complete"
    && P84_SUBPHASES.includes(status.currentPhase)
    && P84_SUBPHASES.includes(status.nextPhase),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84 implementation-grade founder runtime admission contracts.",
        "- Confirms P84 starts with local deterministic founder runtime admission only.",
        "- Does not call providers/models, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p84-execution-plan",
        "- npm run check:p841-founder-runtime-admission",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P84.1 is contract/admission only. P84.2 creates the local runtime envelope." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84 Execution Plan Report", phase: "P84" },
);

printCheckReport("P84 Execution Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
