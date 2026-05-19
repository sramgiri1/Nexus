import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { appendFounderQnaTurn, createFounderQnaTurnState } from "../live-ready/enterpriseFounderQnaTurnState.js";
import { buildFounderPrdReviewGate, validateFounderPrdReviewGate } from "../live-ready/enterpriseFounderPrdReviewGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p853-prd-review-gate-report.md";

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
  "Constraints are small scope, no backend, local build validation first, and no deploy without release admission.",
  "Success means playable MVP, passing game-state tests, clean iPhone layout, and an App Store checklist.",
]) {
  qna = appendFounderQnaTurn(qna, answer);
}

const pendingReview = buildFounderPrdReviewGate({ qnaState: qna });
const approvedReview = buildFounderPrdReviewGate({ qnaState: qna, founderDecision: "approved", versionNumber: 2 });
const pendingValidation = validateFounderPrdReviewGate(pendingReview);
const approvedValidation = validateFounderPrdReviewGate(approvedReview);
const reviewText = JSON.stringify({ pendingReview, approvedReview });
const moduleSource = readText("live-ready/enterpriseFounderPrdReviewGate.js");
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
  "prdGenerationAllowed",
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

addCheck("pending review validates", pendingValidation.valid, pendingValidation.errors.join("; "));
addCheck("approved review validates", approvedValidation.valid, approvedValidation.errors.join("; "));
addCheck("versions are display-safe", pendingReview.data.versionLabel === "PRD v1" && approvedReview.data.versionLabel === "PRD v2");
addCheck("review gate blocks until founder approval", pendingReview.data.downstreamPlanningAllowed === false && pendingReview.data.blockers.length > 0);
addCheck("approved complete PRD admits downstream planning only", approvedReview.data.downstreamPlanningAllowed === true && approvedReview.data.executionAllowed === false);
addCheck("unsafe execution remains false", blockedFlags.every((flag) => pendingReview.data[flag] === false && pendingReview.data.safety?.[flag] === false && approvedReview.data[flag] === false && approvedReview.data.safety?.[flag] === false));
addCheck("shared result envelope reused", moduleSource.includes("createPassResult"));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("Command Center review panel visible", dashboardSource.includes("Local PRD review gate") && dashboardSource.includes("buildFounderPrdReviewGate"));
addCheck("Playwright coverage added", tests.includes("Command Center Lite route renders PRD review gate") && tests.includes("Local PRD review gate"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p853-prd-review-gate"]));
addCheck("contract references P85.3 files", contract.includes("live-ready/enterpriseFounderPrdReviewGate.js") && contract.includes("check:p853-prd-review-gate"));
addCheck("docs mention P85.3 validation", docs.includes("P85.3 PRD Version Review Gate") && docs.includes("npm run check:p853-prd-review-gate"));
addCheck(
  "phase status advanced",
  statusById.get("P85.3")?.status === "complete" &&
    ["P85.3", "P85.4", "P85.5", "P85.6", "P85.7"].includes(status.currentPhase) &&
    ["P85.4", "P85.5", "P85.6", "P85.7", "P86"].includes(status.nextPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p852-founder-turn-state-report.md"));
addCheck("display payload has no private ids", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(reviewText));
addCheck("no fake unsafe runnable actions", !/generate PRD now|call provider now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(reviewText));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85.3 local PRD version review gate.",
        "- Builds display-safe PRD review records from local founder Q&A state.",
        "- Does not generate PRDs through providers, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Review Gate",
      body: [
        `- Pending version: ${pendingReview.data.versionLabel} / ${pendingReview.data.reviewState}`,
        `- Approved version: ${approvedReview.data.versionLabel} / ${approvedReview.data.reviewState}`,
        `- Pending next action: ${pendingReview.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p853-prd-review-gate",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders PRD review gate\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85.3 is local deterministic PRD review only. It does not enable provider/model PRD generation, agent dispatch, project mutation, DB writes, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.3 PRD Review Gate Report", phase: "P85.3" },
);

printCheckReport("P85.3 PRD Review Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
