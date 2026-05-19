import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p85-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P85_ENTERPRISE_FOUNDER_BUSINESS_RUNTIME_PLAN.md";
const REPORT_PATH = "reports/p85-execution-plan-report.md";
const P85_SUBPHASES = ["P85.1", "P85.2", "P85.3", "P85.4", "P85.5", "P85.6", "P85.7"];

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
const invalidTasks = tasks.flatMap((task) => (validateTaskContract(task).valid ? [] : [task.id || "unknown"]));
const allInputsText = JSON.stringify(tasks.map((task) => task.inputs || {}));
const requiredForbidden = ["projects/**", "careloop/**", "providers/**", "tools/**", "worker-runtime/**", "db/**", "deploy/**", "release/**", ".env.*"];

addCheck("contract declares P85", contract.phase === "P85" && contract.classification === "NEXUS_OS_CHANGE");
addCheck("seven subphases are planned", P85_SUBPHASES.every((phaseId) => taskByPhase.has(phaseId)) && tasks.length >= 7);
addCheck("task contracts validate", invalidTasks.length === 0, invalidTasks.join(", "));
addCheck("forbidden roots are covered", tasks.every((task) => requiredForbidden.every((root) => task.forbiddenFiles?.includes(root))));
addCheck("P85.1 exact module is listed", JSON.stringify(taskByPhase.get("P85.1")?.allowedFiles || []).includes("live-ready/enterpriseFounderBusinessRuntime.js"));
addCheck("reuse rule names P84 helpers", allInputsText.includes("P84 founder runtime envelope") && allInputsText.includes("agent flow"));
addCheck("unsafe runtime remains blocked in contract", /provider\/model calls|agent dispatch|project mutation|DB writes|provider spend/i.test(allInputsText));
addCheck("docs reference contract", plan.includes(CONTRACT_PATH));
addCheck("docs list all subphases", P85_SUBPHASES.every((phaseId) => plan.includes(phaseId)));
addCheck(
  "status advanced into P85",
  ["in_progress", "complete"].includes(statusById.get("P85")?.status) &&
    statusById.get("P85.1")?.status === "complete" &&
    ["P85.1", "P85.2", "P85.3", "P85.4", "P85.5", "P85.6", "P85.7"].includes(status.currentPhase) &&
    ["P85.2", "P85.3", "P85.4", "P85.5", "P85.6", "P85.7", "P86"].includes(status.nextPhase),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85 implementation-grade enterprise founder business runtime contracts.",
        "- Confirms P85 starts with a governed local runtime session record and can advance through implementation-grade subphases.",
        "- Does not call providers/models, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p85-execution-plan",
        "- npm run check:p851-enterprise-founder-session",
        "- npm run check:p852-founder-turn-state",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P85 is still local runtime state and UX. Provider/model calls, dispatch, project mutation, DB writes, deploy, package, and spend remain disabled until a later explicit phase." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85 Execution Plan Report", phase: "P85" },
);

printCheckReport("P85 Execution Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
