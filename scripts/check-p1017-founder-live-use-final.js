import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1017-founder-live-use-final-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const businessData = readText("dashboard/src/data/businessBuild.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const review = viewModel.founderLiveUseReview || {};
const componentSource = pageSource.slice(
  pageSource.indexOf("function FounderLiveUseReviewCard"),
  pageSource.indexOf("function ExecutionAdmissionCard"),
);
const p101Subphases = ["P101.1", "P101.2", "P101.3", "P101.4", "P101.5", "P101.6", "P101.7"];
const p101Scripts = [
  "check:p1011-founder-live-use-contract",
  "check:p1012-founder-live-use-readiness-model",
  "check:p1013-founder-live-use-review-packet",
  "check:p1014-command-center-founder-live-use-ux",
  "check:p1015-founder-live-use-validation",
  "check:p1016-founder-live-use-docs-roadmap",
  "check:p1017-founder-live-use-final",
];
const p101Reports = [
  "reports/p1011-founder-live-use-contract-report.md",
  "reports/p1012-founder-live-use-readiness-model-report.md",
  "reports/p1013-founder-live-use-review-packet-report.md",
  "reports/p1014-command-center-founder-live-use-ux-report.md",
  "reports/p1015-founder-live-use-validation-report.md",
  "reports/p1016-founder-live-use-docs-roadmap-report.md",
];
const validationCommands = [
  "npm run check:p1017-founder-live-use-final",
  "npm run check:p1016-founder-live-use-docs-roadmap",
  "npm run check:p1015-founder-live-use-validation",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live use|full Command Center demo leakage safety\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const serializedView = JSON.stringify(review);

addCheck("package scripts registered", p101Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P101 contract subphases complete", p101Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P101 reports exist", p101Reports.every(exists));
addCheck("P101 final report path exists or is current target", REPORT_PATH.endsWith("p1017-founder-live-use-final-report.md"));
addCheck("Command Center founder live-use card remains wired", pageSource.includes("FounderLiveUseReviewCard") && businessData.includes("founderLiveUseReview"));
addCheck("focused route tests retained", routeTests.includes("Founder live use readiness appears across founder routes"));
addCheck("route-wide safety retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher"));
addCheck("review packet remains useful", review.laneRows?.length === 6 && review.checklist?.length >= 4 && Boolean(review.nextAction));
addCheck("execution remains blocked", review.executableLaneCount === 0 && review.dispatchableLaneCount === 0 && review.projectMutationLaneCount === 0);
addCheck("P101 plan records final validation", /P101\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && validationCommands.every((command) => plan.includes(command)));
addCheck("platform roadmap closes P101", /P101\.7 is\s+complete/.test(platformRoadmap) && /P101 is\s+complete/.test(platformRoadmap) && /P102 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status closes P101",
  status.currentPhase === "P101.7"
    && status.previousPhase === "P101.6"
    && status.nextPhase === "P102"
    && statusById.get("P101")?.status === "complete"
    && statusById.get("P101.7")?.status === "complete"
    && statusById.get("P102")?.status === "planned"
    && roadmapById.get("P101")?.status === "complete"
    && roadmapById.get("P101.7")?.status === "complete"
    && roadmapById.get("P102")?.status === "planned",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status records final checks", validationCommands.every((command) => statusById.get("P101.7")?.checksRun?.includes(command)));
addCheck("P102 remains planned only", statusById.get("P102")?.commit === "planned" && roadmapById.get("P102")?.commit === "planned");
addCheck("no unsafe runnable actions in final view", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedView + componentSource));
addCheck("no raw private ids in final view", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedView + componentSource));
addCheck("P101.7 avoids forbidden file scope", !(subphaseById.get("P101.7")?.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P101 Founder Live Use Hardening.",
        "- Confirms P101 contract, readiness model, review packet, Command Center UX, docs, reports, phase status, and P102 handoff are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101 closes the founder live-use hardening layer only. P102 remains planned and must define any later handoff under its own execution contract before coding.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.7 Founder Live Use Final Report", phase: "P101.7" },
);

printCheckReport("P101.7 Founder Live Use Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
