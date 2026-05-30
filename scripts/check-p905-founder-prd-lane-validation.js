import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p905-founder-prd-lane-validation-report.md";

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
const contract = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const p901Report = readText("reports/p901-founder-prd-live-lane-contract-report.md");
const p902Report = readText("reports/p902-founder-prd-local-model-report.md");
const p903Report = readText("reports/p903-founder-prd-safe-authoring-report.md");
const p904Report = readText("reports/p904-command-center-prd-lane-ux-report.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const businessBuildData = readText("dashboard/src/data/businessBuild.js");
const businessBuildPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const implementationSources = [businessBuildData, businessBuildPage].join("\n");

const p90Scripts = [
  "check:p901-founder-prd-live-lane-contract",
  "check:p902-founder-prd-local-model",
  "check:p903-founder-prd-safe-authoring",
  "check:p904-command-center-prd-lane-ux",
  "check:p905-founder-prd-lane-validation",
];

const requiredReports = [
  "reports/p901-founder-prd-live-lane-contract-report.md",
  "reports/p902-founder-prd-local-model-report.md",
  "reports/p903-founder-prd-safe-authoring-report.md",
  "reports/p904-command-center-prd-lane-ux-report.md",
];

addCheck("package registers all P90 scripts", p90Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P90 reports exist", requiredReports.every((report) => existsSync(join(ROOT, report))));
addCheck("P90 reports pass", [p901Report, p902Report, p903Report, p904Report].every((report) => /Result: PASS|PASS \(/.test(report)));
addCheck("contract tracks P90.5", contract.includes("P90.5") && contract.includes("check:p905-founder-prd-lane-validation"));
addCheck("P90.1 contract evidence present", contract.includes("P90.1") && p901Report.includes("P90.1 Founder PRD Live Lane Contract Report"));
addCheck("P90.2 model evidence present", contract.includes("P90.2") && p902Report.includes("P90.2 Founder PRD Local Model Report"));
addCheck("P90.3 authoring evidence present", contract.includes("P90.3") && p903Report.includes("P90.3 Founder PRD Safe Authoring Report"));
addCheck("P90.4 UX evidence present", contract.includes("P90.4") && p904Report.includes("P90.4 Command Center PRD Lane UX Report"));
addCheck("Business Build Playwright coverage present", (routeTests.includes("Business Build Local PRD tab shows safe in-memory artifact") || routeTests.includes("Business Build Local PRD tab shows safe idea-to-PRD preview")) && routeTests.includes("Business Build Founder Dry Run tab keeps live execution disabled"));
addCheck("Local PRD UX still wired to safe authoring", businessBuildData.includes("buildFounderPrdSafeAuthoring") && businessBuildPage.includes('tabId="localPrd"'));
addCheck("docs record P90.5", docs.includes("P90.5 is complete") && docs.includes("npm run check:p905-founder-prd-lane-validation"));
addCheck(
  "platform roadmap records P90.5",
  platformRoadmap.includes("P90.5 is complete")
    && (platformRoadmap.includes("P90.6 is next") || platformRoadmap.includes("P90.6 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P90")?.status)
    && statusById.get("P90.5")?.status === "complete"
    && ["P90.5", "P90.6", "P90.7"].includes(status.currentPhase)
    && ["P90.4", "P90.5", "P90.6"].includes(status.previousPhase)
    && ["P90.6", "P90.7", "P91"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.5", roadmapById.get("P90.5")?.track === "NEXUS_OS" && roadmapById.get("P90.5")?.status === "complete");
addCheck(
  "P90.6 handoff exists",
  ["planned", "complete"].includes(statusById.get("P90.6")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P90.6")?.status),
);
addCheck("status checker accepts P90.6", statusChecker.includes("\"P90.6\""));
addCheck("no forbidden project imports in P90 implementation", !/from\s+["'][^"']*(projects|careloop|generated-projects\/[^/]+\/(?:Sources|Tests)|providers|tools|worker-runtime|db|prisma|migrations|deploy|release|exports|packages)\//.test(implementationSources));
addCheck("no DemoApp/private IDs in primary implementation surfaces", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(implementationSources));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(implementationSources));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90 aggregate evidence across contract, model, safe authoring, Command Center UX, Playwright coverage, docs, roadmap, and phase status.",
        "- Confirms the Local PRD lane remains display-safe and backed by the safe in-memory authoring helper.",
        "- Confirms no provider/model calls, agent dispatch, project mutation, DB writes, deploy, release, export, package, network calls, or spend are enabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p905-founder-prd-lane-validation",
        "- npm run check:p904-command-center-prd-lane-ux",
        "- npm run check:p903-founder-prd-safe-authoring",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.5 is validation aggregation only. It does not write project files, dispatch agents, execute tools/workers, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.5 Founder PRD Lane Validation Report", phase: "P90.5" },
);

printCheckReport("P90.5 Founder PRD Lane Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
