import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildFounderPrdSafeAuthoring } from "../live-ready/founderPrdSafeAuthoring.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p907-founder-prd-final-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const p904Report = readText("reports/p904-command-center-prd-lane-ux-report.md");
const p905Report = readText("reports/p905-founder-prd-lane-validation-report.md");
const p906Report = readText("reports/p906-founder-prd-docs-roadmap-report.md");

const safeAuthoring = buildFounderPrdSafeAuthoring({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
}).data;
const businessBuild = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const implementationSources = [pageSource, readText("dashboard/src/data/businessBuild.js")].join("\n");

const p90Scripts = [
  "check:p901-founder-prd-live-lane-contract",
  "check:p902-founder-prd-local-model",
  "check:p903-founder-prd-safe-authoring",
  "check:p904-command-center-prd-lane-ux",
  "check:p905-founder-prd-lane-validation",
  "check:p906-founder-prd-docs-roadmap",
  "check:p907-founder-prd-final",
];

addCheck("package registers all P90 scripts", p90Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract tracks P90.7", contract.includes("P90.7") && contract.includes("check:p907-founder-prd-final"));
addCheck("docs close P90", docs.includes("P90.7 is complete") && docs.includes("P90 is complete"));
addCheck("platform roadmap closes P90", platformRoadmap.includes("P90.7 is complete") && platformRoadmap.includes("P90 is complete"));
addCheck("platform roadmap creates P91 handoff", platformRoadmap.includes("P91 is next"));
addCheck("P90 reports pass", [p904Report, p905Report, p906Report].every((report) => /Result: PASS|PASS \(/.test(report)));
addCheck("safe PRD artifact is useful", safeAuthoring.prdArtifact?.title?.includes("Snake") && safeAuthoring.prdArtifact?.sections?.some((section) => /casual iPhone players/i.test(section.content)));
addCheck("Business Build Local PRD view model ready", businessBuild.founderPrdAuthoring?.title?.includes("Snake") && businessBuild.founderPrdAuthoring?.reviewState === "Ready For Operator Review");
addCheck("Business Build Playwright coverage retained", routeTests.includes("Business Build Local PRD tab shows safe in-memory artifact") && routeTests.includes("Business Build route renders founder workstream dry-run state"));
addCheck(
  "phase status closed",
  statusById.get("P90")?.status === "complete"
    && statusById.get("P90.7")?.status === "complete"
    && status.currentPhase === "P90.7"
    && status.previousPhase === "P90.6"
    && status.nextPhase === "P91",
  `${statusById.get("P90")?.status}/${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90 closed", roadmapById.get("P90")?.status === "complete" && roadmapById.get("P90.7")?.status === "complete");
addCheck("P91 planned handoff exists", statusById.get("P91")?.status === "planned" && roadmapById.get("P91")?.status === "planned");
addCheck("status checker accepts P91", statusChecker.includes("\"P91\""));
addCheck("all unsafe runtime flags remain blocked", Object.values(safeAuthoring.runtimeFlags || {}).every((value) => value === false));
addCheck("local authoring remains non-mutating", safeAuthoring.localAuthoring?.writesFiles === false && safeAuthoring.localAuthoring?.mutatesProjects === false && safeAuthoring.localAuthoring?.dispatchesAgents === false);
addCheck("Command Center avoids internal phase labels in Local PRD panel", !/P90\./.test(pageSource.slice(pageSource.indexOf('tabId="localPrd"'), pageSource.indexOf('tabId="workstreams"'))));
addCheck("Command Center avoids DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(implementationSources));
addCheck("Command Center avoids fake unsafe actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(implementationSources));
addCheck("no forbidden project imports", !/from\s+["'][^"']*(projects|careloop|generated-projects\/[^/]+\/(?:Sources|Tests)|providers|tools|worker-runtime|db|prisma|migrations|deploy|release|exports|packages)\//.test(implementationSources));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P90 Governed Founder PRD Live Authoring Lane.",
        "- Confirms the local founder PRD artifact, Business Build Local PRD UX, reports, docs, roadmap, and phase status agree.",
        "- Closes P90 without enabling project mutation, provider/model calls, agent dispatch, DB writes, deploy, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p907-founder-prd-final",
        "- npm run check:p906-founder-prd-docs-roadmap",
        "- npm run check:p905-founder-prd-lane-validation",
        "- npm run check:p904-command-center-prd-lane-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.7 finalizes local PRD authoring only. It does not write project files, dispatch agents, execute tools/workers, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.7 Founder PRD Final Validation Report", phase: "P90.7" },
);

printCheckReport("P90.7 Founder PRD Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
