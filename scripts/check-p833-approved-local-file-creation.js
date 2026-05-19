import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildSnakeIosScaffoldPlan, SNAKE_IOS_SCAFFOLD_FILES } from "../ios-scaffold/snakeIosScaffoldPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p833-approved-local-file-creation-report.md";
const GENERATED_ROOT = "generated-projects/snake-ios";

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

const plan = buildSnakeIosScaffoldPlan();
const plannedFiles = new Set(SNAKE_IOS_SCAFFOLD_FILES.map((file) => `${GENERATED_ROOT}/${file}`));
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const gameState = readText(`${GENERATED_ROOT}/Sources/SnakeIOSApp/GameState.swift`);
const gameScene = readText(`${GENERATED_ROOT}/Sources/SnakeIOSApp/GameScene.swift`);
const tests = readText(`${GENERATED_ROOT}/Tests/SnakeIOSAppTests/GameStateTests.swift`);

addCheck("P83.2 scaffold plan reused", plan.data?.targetRoot === GENERATED_ROOT && plan.data?.filePlan?.length === SNAKE_IOS_SCAFFOLD_FILES.length);
addCheck("all planned files exist", [...plannedFiles].every(fileExists));
addCheck("no extra generated source files required", plan.data.filePlan.every((file) => plannedFiles.has(file.targetPath)));
addCheck("Swift package manifest exists", fileExists(`${GENERATED_ROOT}/Package.swift`) && readText(`${GENERATED_ROOT}/Package.swift`).includes("SnakeIOSApp"));
addCheck("game state implements core rules", ["step()", "setDirection", "wallCollision", "selfCollision", "restart"].every((token) => gameState.includes(token)));
addCheck("SpriteKit scene renders core entities", ["drawSnake", "drawFood", "drawScore", "Game Over"].every((token) => gameScene.includes(token)));
addCheck("unit tests cover expected game behavior", ["testStepMovesSnakeForward", "testCollectingFoodGrowsSnakeAndScores", "testWallCollisionEndsGame", "testSelfCollisionEndsGame", "testRestartResetsScoreAndStatus"].every((token) => tests.includes(token)));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p833-approved-local-file-creation"]));
addCheck("contract references P83.3 files", contract.includes("generated-projects/snake-ios/**") && contract.includes("check:p833-approved-local-file-creation"));
addCheck("docs mention P83.3 validation", docs.includes("P83.3 Approved Local File Creation") && docs.includes("Status: complete. P83.3"));
addCheck("phase status advanced", statusById.get("P83.3")?.status === "complete" && status.currentPhase === "P83.3" && status.nextPhase === "P83.4");
addCheck("existing project roots remain forbidden", !contract.includes("\"projects/snake-ios\"") && contract.includes("\"projects/**\""));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P83.3 approved local file creation.",
        "- Confirms scaffold files exist only under `generated-projects/snake-ios`.",
        "- Does not mutate existing projects, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Generated Files",
      body: [...plannedFiles].sort().map((file) => `- ${file}`).join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p833-approved-local-file-creation",
        "- npm run check:p832-snake-ios-scaffold-plan",
        "- npm run check:p83-execution-plan",
        "- npm run check:os-phase-status",
        "- cd generated-projects/snake-ios && swift run SnakeIOSAppTests",
        "- cd generated-projects/snake-ios && swift build",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.3 creates a local Swift package scaffold only. The active SwiftPM environment does not expose XCTest or Testing, so game-rule assertions run through the local executable test target until P83.4 adds the durable validation harness." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.3 Approved Local File Creation Report", phase: "P83.3" },
);

printCheckReport("P83.3 Approved Local File Creation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
