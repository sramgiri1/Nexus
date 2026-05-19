import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p855-command-center-business-runtime-ux-report.md";

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

const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const styles = readText("dashboard/src/styles-command-center-v2.css");
const tests = readText("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P85_ENTERPRISE_FOUNDER_BUSINESS_RUNTIME_PLAN.md");
const contract = readText("contracts/os-roadmap/p85-execution-contracts.json");

addCheck("workflow summary visible", dashboardSource.includes("Founder workflow summary") && dashboardSource.includes("taskBoard.boardState") && dashboardSource.includes("prdReview.reviewState"));
addCheck("workflow summary has no raw ids", !/Founder workflow summary[\\s\\S]{0,1000}P85\\./.test(dashboardSource) && !dashboardSource.includes("founder_qna_collecting_answers"));
addCheck("responsive workflow styles exist", styles.includes(".ccv2-lite-workflow") && styles.includes("grid-template-columns: repeat(4") && styles.includes("@media (max-width: 720px)"));
addCheck("Playwright coverage added", tests.includes("Command Center Lite route renders founder workflow summary") && tests.includes("Founder workflow summary"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p855-command-center-business-runtime-ux"]));
addCheck("contract references P85.5 files", contract.includes("check:p855-command-center-business-runtime-ux") && contract.includes("dashboard/src/pages/CommandCenterV2.jsx"));
addCheck("docs mention P85.5 validation", docs.includes("P85.5 Command Center Business Runtime UX") && docs.includes("npm run check:p855-command-center-business-runtime-ux"));
addCheck(
  "phase status advanced",
  statusById.get("P85.5")?.status === "complete" &&
    ["P85.5", "P85.6", "P85.7"].includes(status.currentPhase) &&
    ["P85.6", "P85.7", "P86"].includes(status.nextPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p854-task-board-admission-report.md"));
addCheck("no DemoApp/private IDs in Lite UX source", !dashboardSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(dashboardSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|create project now/i.test(dashboardSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85.5 Command Center Lite founder business runtime UX consolidation.",
        "- Confirms chat, PRD review, and local task board states appear as one founder workflow summary.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p855-command-center-business-runtime-ux",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders founder workflow summary\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85.5 is UX consolidation only. Provider/model calls, dispatch, workers, tools, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.5 Command Center Business Runtime UX Report", phase: "P85.5" },
);

printCheckReport("P85.5 Command Center Business Runtime UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
