import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateTaskContract } from "../contracts/validators/validateTaskContract.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const CONTRACT_PATH = "contracts/os-roadmap/p83-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md";
const REPORT_PATH = "reports/p83-execution-plan-report.md";
const P83_SUBPHASES = ["P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"];

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
const validCurrentPhases = ["P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"];
const expectedNextByCurrent = new Map([
  ["P83.1", "P83.2"],
  ["P83.2", "P83.3"],
  ["P83.3", "P83.4"],
  ["P83.4", "P83.5"],
  ["P83.5", "P83.6"],
  ["P83.6", "P83.7"],
  ["P83.7", "P84"],
]);

const requiredForbidden = ["projects/**", "careloop/**", "db/**", "providers/**", "tools/**", "worker-runtime/**", "deploy/**", "release/**", ".env.*"];
const invalidTasks = tasks.flatMap((task) => validateTaskContract(task).valid ? [] : [task.id || "unknown"]);
const allSafetyText = JSON.stringify(tasks.map((task) => task.inputs || {}));

addCheck("contract declares P83", contract.phase === "P83" && contract.classification === "NEXUS_OS_CHANGE");
addCheck("seven subphases are planned", P83_SUBPHASES.every((phaseId) => taskByPhase.has(phaseId)) && tasks.length >= 7);
addCheck("task contracts validate", invalidTasks.length === 0, invalidTasks.join(", "));
addCheck("forbidden roots are covered", tasks.every((task) => requiredForbidden.every((root) => task.forbiddenFiles?.includes(root) || (task.inputs?.phaseId === "P83.3" && root === "projects/**"))));
addCheck("P83.1 exact files are listed", JSON.stringify(taskByPhase.get("P83.1")?.inputs?.exactFilesModules || {}).includes("live-ready/localProjectCreationAdmission.js"));
addCheck("approval and rollback gates are required", /approval/i.test(allSafetyText) && /rollback/i.test(allSafetyText) && /validation/i.test(allSafetyText));
addCheck("generated workspace root is the only admitted project root", allSafetyText.includes("generated-projects/snake-ios") && !/(^|[^-])projects\/snake-ios/.test(allSafetyText));
addCheck("docs reference contract", plan.includes(CONTRACT_PATH));
addCheck("docs list all subphases", P83_SUBPHASES.every((phaseId) => plan.includes(phaseId)));
addCheck(
  "status advanced within P83",
  ["in_progress", "complete"].includes(statusById.get("P83")?.status)
    && statusById.get("P83.1")?.status === "complete"
    && validCurrentPhases.includes(status.currentPhase)
    && status.nextPhase === expectedNextByCurrent.get(status.currentPhase),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P83 implementation-grade runtime admission contracts.",
        "- Confirms P83 admission starts with a generated workspace root before any file creation.",
        "- Does not write project files, call providers/tools, start workers, write DB state, deploy, release, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p83-execution-plan",
        "- npm run check:p831-local-project-creation-admission",
        "- npm run check:p832-snake-ios-scaffold-plan",
        "- npm run check:p827-final-validation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.1 and P83.2 do not create the iOS project files. File creation is planned for P83.3 after scaffold planning." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83 Execution Plan Report", phase: "P83" },
);

printCheckReport("P83 Execution Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
