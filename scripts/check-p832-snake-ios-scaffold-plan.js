import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildSnakeIosScaffoldPlan, validateSnakeIosScaffoldPlan } from "../ios-scaffold/snakeIosScaffoldPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p832-snake-ios-scaffold-plan-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const envelope = buildSnakeIosScaffoldPlan();
const validation = validateSnakeIosScaffoldPlan(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(envelope);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const validCurrentPhases = ["P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"];
const expectedNextByCurrent = new Map([
  ["P83.2", "P83.3"],
  ["P83.3", "P83.4"],
  ["P83.4", "P83.5"],
  ["P83.5", "P83.6"],
  ["P83.6", "P83.7"],
  ["P83.7", "P84"],
]);
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const moduleSource = readText("ios-scaffold/snakeIosScaffoldPlan.js");

addCheck("scaffold envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("scaffold validation passes", validation.valid, validation.errors.join("; "));
addCheck("target root is admitted generated workspace", data.targetRoot === "generated-projects/snake-ios");
addCheck("file plan covers app and tests", data.filePlan?.some((file) => file.relativePath === "Sources/SnakeIOSApp/GameScene.swift") && data.filePlan?.some((file) => file.relativePath === "Tests/SnakeIOSAppTests/GameStateTests.swift"));
addCheck("all target paths stay in admitted root", data.filePlan?.every((file) => file.targetPath.startsWith("generated-projects/snake-ios/")));
addCheck("writes deferred to P83.3", data.filePlan?.every((file) => file.writeAllowedInPhase === "P83.3") && data.newWorkspaceFileWritesAllowed === false);
addCheck("runtime flags remain false", ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "dbWritesAllowed", "networkCallsAllowed", "deployExecutionAllowed", "providerSpendAllowed"].every((flag) => data[flag] === false));
addCheck("project admission reused", moduleSource.includes("buildLocalProjectCreationAdmission"));
addCheck("no fake runnable actions", !/write now|deploy now|call provider now|spend now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p832-snake-ios-scaffold-plan"]));
addCheck("contract references P83.2 files", contract.includes("ios-scaffold/snakeIosScaffoldPlan.js") && contract.includes("check:p832-snake-ios-scaffold-plan"));
addCheck("docs mention P83.2 validation", docs.includes("P83.2 Snake iOS Scaffold Plan") && docs.includes("Status: complete. P83.2"));
addCheck(
  "phase status remains valid after P83.2",
  statusById.get("P83.2")?.status === "complete"
    && validCurrentPhases.includes(status.currentPhase)
    && status.nextPhase === expectedNextByCurrent.get(status.currentPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p831-local-project-creation-admission-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P83.2 Snake iOS scaffold plan.",
        "- Plans SwiftUI/SpriteKit files for the admitted generated workspace root.",
        "- Does not write app files, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Planned Files",
      body: data.filePlan.map((file) => `- ${file.targetPath}`).join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p832-snake-ios-scaffold-plan",
        "- npm run check:p831-local-project-creation-admission",
        "- npm run check:p83-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.2 is plan-only. P83.3 creates files under `generated-projects/snake-ios`." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.2 Snake iOS Scaffold Plan Report", phase: "P83.2" },
);

printCheckReport("P83.2 Snake iOS Scaffold Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
