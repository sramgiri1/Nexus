import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p897-final-validation-report.md";

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
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p89-execution-contracts.json");
const docs = readText("docs/architecture/P89_GOVERNED_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildData = readText("dashboard/src/data/businessBuild.js");
const tests = readText("dashboard/tests/routes.spec.js");

const p89Subphases = ["P89.1", "P89.2", "P89.3", "P89.4", "P89.5", "P89.6", "P89.7"];
const requiredScripts = [
  "check:p891-local-enterprise-runtime-handoff-profile",
  "check:p892-local-founder-workstream-runtime-envelope",
  "check:p893-local-founder-workstream-dry-run",
  "check:p894-command-center-founder-workstream-ux",
  "check:p895-tests-checkers",
  "check:p896-docs-roadmap",
  "check:p897-final-validation",
];
const requiredReports = [
  "reports/p891-local-enterprise-runtime-handoff-profile-report.md",
  "reports/p892-local-founder-workstream-runtime-envelope-report.md",
  "reports/p893-local-founder-workstream-dry-run-report.md",
  "reports/p894-command-center-founder-workstream-ux-report.md",
  "reports/p895-tests-checkers-report.md",
  "reports/p896-docs-roadmap-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P89 evidence reports exist", requiredReports.every(fileExists));
addCheck("contract tracks P89.1-P89.7", p89Subphases.every((phaseId) => contract.includes(phaseId)));
addCheck("docs mark P89.7 complete", docs.includes("## P89.7 Final Validation") && docs.includes("P89.7 is complete"));
addCheck("platform roadmap closes P89", platformRoadmap.includes("P89.7 is complete") && platformRoadmap.includes("P89 is complete"));
addCheck("P90 handoff planned", statusById.get("P90")?.status === "planned" && roadmapById.get("P90")?.status === "planned");
addCheck("roadmap statuses complete through P89.7", p89Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P89.7", p89Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck(
  "parent phase closed",
  statusById.get("P89")?.status === "complete"
    && roadmapById.get("P89")?.status === "complete"
    && statusById.get("P89")?.nextPhase === "P90",
);
addCheck(
  "phase status advanced",
  status.currentPhase === "P89.7"
    && status.previousPhase === "P89.6"
    && status.nextPhase === "P90"
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("Command Center Business Build preserved", businessBuildData.includes("founderWorkstreamDryRun") && businessBuildData.includes("Founder Dry Run is display-only"));
addCheck("Playwright coverage retained", tests.includes("Business Build route renders founder workstream dry-run state") && tests.includes("Business Build Founder Dry Run tab keeps live execution disabled"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(businessBuildData));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(businessBuildData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P89 governed local enterprise runtime handoff validation.",
        "- Closes P89 and P89.7 status records with P90 planned as the next scoped handoff.",
        "- Confirms Business Build Founder Dry Run UX remains display-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p897-final-validation",
        "- npm run check:p896-docs-roadmap",
        "- npm run check:p895-tests-checkers",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.7 is final validation only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.7 Final Validation Report", phase: "P89.7" },
);

printCheckReport("P89.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
