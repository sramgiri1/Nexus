import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { appendFounderQnaTurn, createFounderQnaTurnState } from "../live-ready/enterpriseFounderQnaTurnState.js";
import { buildFounderPrdReviewGate } from "../live-ready/enterpriseFounderPrdReviewGate.js";
import { buildFounderTaskBoardAdmission, validateFounderTaskBoardAdmission } from "../live-ready/enterpriseFounderTaskBoardAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p854-task-board-admission-report.md";

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

let qna = createFounderQnaTurnState({ founderIdeaSummary: "Build a simple iOS Snake game for the App Store" });
for (const answer of [
  "The first customers are casual iPhone players who want a clean arcade game.",
  "The problem is existing Snake games are cluttered with ads and weak touch controls.",
  "They use existing App Store snake games and browser games today.",
  "The product is a focused SpriteKit Snake game with responsive touch controls.",
  "The business model starts free with an optional ad-free paid version.",
  "Go to market is App Store keywords, gameplay clips, and indie launch posts.",
  "Constraints are small scope, no backend, local build validation first, and no release without approval.",
  "Success means playable MVP, passing game-state tests, clean iPhone layout, and an App Store checklist.",
]) qna = appendFounderQnaTurn(qna, answer);

const review = buildFounderPrdReviewGate({ qnaState: qna, founderDecision: "approved" });
const board = buildFounderTaskBoardAdmission({ qnaState: qna, prdReview: review });
const validation = validateFounderTaskBoardAdmission(board);
const boardText = JSON.stringify(board);
const moduleSource = readText("live-ready/enterpriseFounderTaskBoardAdmission.js");
const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P85_ENTERPRISE_FOUNDER_BUSINESS_RUNTIME_PLAN.md");
const contract = readText("contracts/os-roadmap/p85-execution-contracts.json");

const blockedFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authSessionUserWorkspaceMutationAllowed",
  "providerSpendAllowed",
];

addCheck("task board validates", validation.valid, validation.errors.join("; "));
addCheck("task board includes agent lanes", board.data.tasks.length === 8 && board.data.tasks.some((task) => task.title.includes("Engineering")));
addCheck("dispatch remains blocked", board.data.dispatchAllowed === false && board.data.executionAllowed === false && board.data.tasks.every((task) => task.dispatchAllowed === false));
addCheck("validation commands are attached", board.data.tasks.every((task) => task.validationCommand.includes("check:p854-task-board-admission")));
addCheck("unsafe execution remains false", blockedFlags.every((flag) => board.data[flag] === false && board.data.safety?.[flag] === false));
addCheck("P85.3 review gate reused", moduleSource.includes("buildFounderPrdReviewGate"));
addCheck("shared result envelope reused", moduleSource.includes("createPassResult"));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("Command Center task board visible", dashboardSource.includes("Local agent task board") && dashboardSource.includes("buildFounderTaskBoardAdmission"));
addCheck("Playwright coverage added", tests.includes("Command Center Lite route renders local task board") && tests.includes("Local agent task board"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p854-task-board-admission"]));
addCheck("contract references P85.4 files", contract.includes("live-ready/enterpriseFounderTaskBoardAdmission.js") && contract.includes("check:p854-task-board-admission"));
addCheck("docs mention P85.4 validation", docs.includes("P85.4 Local Agent Task Board Admission") && docs.includes("npm run check:p854-task-board-admission"));
addCheck(
  "phase status advanced",
  statusById.get("P85.4")?.status === "complete" &&
    ["P85.4", "P85.5", "P85.6", "P85.7"].includes(status.currentPhase) &&
    ["P85.5", "P85.6", "P85.7", "P86"].includes(status.nextPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p853-prd-review-gate-report.md"));
addCheck("display payload has no private ids", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(boardText));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|create project now/i.test(boardText));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85.4 local agent task board admission.",
        "- Converts local agent lanes into display-safe planning tasks.",
        "- Does not dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call providers, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Task Board",
      body: [
        `- Board state: ${board.data.boardState}`,
        `- Task count: ${board.data.taskCount}`,
        `- Next action: ${board.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p854-task-board-admission",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders local task board\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85.4 admits local planning tasks only. Agent dispatch, worker/tool execution, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.4 Task Board Admission Report", phase: "P85.4" },
);

printCheckReport("P85.4 Task Board Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
