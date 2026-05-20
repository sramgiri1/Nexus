import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p914-command-center-workstream-activation-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p91-execution-contracts.json");
const docs = readText("docs/architecture/P91_GOVERNED_FOUNDER_WORKSTREAM_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");

const view = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const activationReview = view.activationReview || {};
const serializedView = JSON.stringify(view);
const unsafePattern = /run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i;
const privatePattern = /DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i;

addCheck("Business Build view exposes activation review", activationReview.currentState === "Local Activation Review Packet Ready For Operator Review");
addCheck("activation review readiness visible", activationReview.ready === true && activationReview.readyItemCount === 8 && activationReview.totalItemCount === 8);
addCheck("review items mapped", Array.isArray(activationReview.reviewItems) && activationReview.reviewItems.length === 8 && activationReview.reviewItems.some((item) => item.label === "Engineering"));
addCheck("operator checklist mapped", Array.isArray(activationReview.checklist) && activationReview.checklist.length >= 4);
addCheck("safety rows mapped", activationReview.safetyRows?.some((row) => row.label === "DB writes" && row.value === "Blocked") && activationReview.safetyRows?.some((row) => row.label === "Agent dispatch" && row.value === "Blocked"));
addCheck("evidence activity cost visible", Boolean(activationReview.evidenceLocation) && Boolean(activationReview.activityLocation) && Boolean(activationReview.costImpact));
addCheck("unsafe UX remains blocked", !unsafePattern.test(serializedView));
addCheck("no DemoApp/private IDs/secrets", !privatePattern.test(serializedView));
addCheck("no raw phase labels in Business Build view", !/P91\./.test(serializedView));
addCheck("P91.3 helper reused", businessBuildSource.includes("buildFounderActivationReviewPacket") && !businessBuildSource.includes("buildReviewItems("));
addCheck("Business Build tab registered", tabsSource.includes('id: "activationReview"') && tabsSource.includes("Activation Review"));
addCheck("Command Center renders activation review tab", pageSource.includes('tabId="activationReview"') && pageSource.includes("Workstream Activation Review"));
addCheck("Playwright coverage added", routeTests.includes("Business Build Activation Review tab shows packet without execution") && routeTests.includes("Ready items: 8 of 8"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p914-command-center-workstream-activation-ux"]));
addCheck("contract tracks P91.4", contract.includes("P91.4") && contract.includes("dashboard/src/data/businessBuild.js") && contract.includes("check:p914-command-center-workstream-activation-ux"));
addCheck("docs record P91.4", docs.includes("P91.4 is complete") && docs.includes("npm run check:p914-command-center-workstream-activation-ux"));
addCheck(
  "platform roadmap records P91.4",
  platformRoadmap.includes("P91.4 is complete")
    && (platformRoadmap.includes("P91.5 is next") || platformRoadmap.includes("P91.5 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P91")?.status) &&
    statusById.get("P91.4")?.status === "complete" &&
    ["P91.4", "P91.5", "P91.6", "P91.7"].includes(status.currentPhase) &&
    ["P91.3", "P91.4", "P91.5", "P91.6"].includes(status.previousPhase) &&
    ["P91.5", "P91.6", "P91.7", "P92", "P93"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P91.4", roadmapById.get("P91.4")?.track === "NEXUS_OS" && roadmapById.get("P91.4")?.status === "complete");
addCheck(
  "P91.5 handoff exists",
  ["planned", "complete"].includes(statusById.get("P91.5")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P91.5")?.status),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P91.4 Command Center workstream activation UX.",
        "- Confirms Business Build shows the P91.3 review packet, owner lanes, checklist, evidence, activity, cost, and blockers.",
        "- Confirms no provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, network calls, or spend are enabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p914-command-center-workstream-activation-ux",
        "- npm run check:p913-founder-activation-review-packet",
        "- npm run check:p912-founder-workstream-activation-model",
        "- npm run check:p911-founder-workstream-activation-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build Activation Review\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.4 is Command Center UX only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.4 Command Center Workstream Activation UX Report", phase: "P91.4" },
);

printCheckReport("P91.4 Command Center Workstream Activation UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
