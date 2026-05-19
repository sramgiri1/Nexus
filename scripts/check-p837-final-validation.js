import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p837-final-validation-report.md";
const REQUIRED_PHASES = ["P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"];
const REQUIRED_REPORTS = [
  "reports/p831-local-project-creation-admission-report.md",
  "reports/p832-snake-ios-scaffold-plan-report.md",
  "reports/p833-approved-local-file-creation-report.md",
  "reports/p834-local-validation-harness-report.md",
  "reports/p835-command-center-build-ux-report.md",
  "reports/p836-tests-checkers-docs-report.md",
];
const GENERATED_FILES = [
  "generated-projects/snake-ios/Package.swift",
  "generated-projects/snake-ios/README.md",
  "generated-projects/snake-ios/Sources/SnakeIOSApp/SnakeIOSApp.swift",
  "generated-projects/snake-ios/Sources/SnakeIOSApp/GameScene.swift",
  "generated-projects/snake-ios/Sources/SnakeIOSApp/GameState.swift",
  "generated-projects/snake-ios/Sources/SnakeIOSApp/SnakeTypes.swift",
  "generated-projects/snake-ios/Sources/SnakeIOSApp/Theme.swift",
  "generated-projects/snake-ios/Tests/SnakeIOSAppTests/GameStateTests.swift",
  "generated-projects/snake-ios/validation/local-validation.json",
];

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

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const activation = buildLiveReadyActivationViewModel();
const activationText = JSON.stringify(activation);

addCheck("P83 root is complete", statusById.get("P83")?.status === "complete");
addCheck("all P83 subphases are complete", REQUIRED_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("status closes on P83.7", status.currentPhase === "P83.7" && status.nextPhase === "P84");
addCheck("required P83 reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("generated Snake iOS files exist", GENERATED_FILES.every(fileExists));
addCheck("local validation manifest exists", fileExists("generated-projects/snake-ios/validation/local-validation.json"));
addCheck("Command Center local build row is visible", activation.readinessRows.some((row) => row.label === "Generated Snake iOS Build" && row.readinessLabel === "Ready"));
addCheck("runtime flags remain disabled", Object.values(activation.safety || {}).every((value) => value === false));
addCheck("package scripts include P83 checkers", ["check:p831-local-project-creation-admission", "check:p832-snake-ios-scaffold-plan", "check:p833-approved-local-file-creation", "check:p834-local-validation-harness", "check:p835-command-center-build-ux", "check:p836-tests-checkers-docs", "check:p837-final-validation"].every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("docs close P83", docs.includes("Status: complete. P83.7") && roadmap.includes("P83 is complete"));
addCheck("contract references final validation", contract.includes("check:p837-final-validation"));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(activationText));
addCheck("no raw private IDs", !/(?:private-project-|private_project_|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_)/.test(activationText));
addCheck("blocked actions remain explicit", ["providerSpendAllowed", "deployExecutionAllowed", "workerExecutionAllowed", "dbWritesAllowed"].every((flag) => activationText.includes(`"${flag}":false`)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P83 Explicit Runtime Admission Activation Contract.",
        "- Confirms Snake iOS is admitted, scaffolded, locally validated, and visible in Command Center.",
        "- Confirms deploy, release, package, provider, worker, DB, network, auth/session/user/workspace mutation, existing project mutation, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p837-final-validation",
        "- npm run check:p836-tests-checkers-docs",
        "- npm run check:p835-command-center-build-ux",
        "- npm run check:p834-local-validation-harness",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P83 completes local generated workspace activation only.",
        "- Simulator launch, signing, App Store/TestFlight, provider calls, worker dispatch, DB writes, deploy, release, package creation, network calls, and spend remain blocked until later explicit admission.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.7 Final Validation Report", phase: "P83.7" },
);

printCheckReport("P83.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
