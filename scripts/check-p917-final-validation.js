import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p917-final-validation-report.md";

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
const contract = readText("contracts/os-roadmap/p91-execution-contracts.json");
const docs = readText("docs/architecture/P91_GOVERNED_FOUNDER_WORKSTREAM_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildData = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");

const p91Subphases = ["P91.1", "P91.2", "P91.3", "P91.4", "P91.5", "P91.6", "P91.7"];
const requiredScripts = [
  "check:p911-founder-workstream-activation-contract",
  "check:p912-founder-workstream-activation-model",
  "check:p913-founder-activation-review-packet",
  "check:p914-command-center-workstream-activation-ux",
  "check:p915-tests-checkers",
  "check:p916-docs-roadmap",
  "check:p917-final-validation",
];
const requiredReports = [
  "reports/p911-founder-workstream-activation-contract-report.md",
  "reports/p912-founder-workstream-activation-model-report.md",
  "reports/p913-founder-activation-review-packet-report.md",
  "reports/p914-command-center-workstream-activation-ux-report.md",
  "reports/p915-tests-checkers-report.md",
  "reports/p916-docs-roadmap-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P91 evidence reports exist", requiredReports.every(fileExists));
addCheck("contract tracks P91.1-P91.7", p91Subphases.every((phaseId) => contract.includes(phaseId)) && contract.includes("check:p917-final-validation"));
addCheck("docs mark P91.7 complete", docs.includes("## P91.7 Final Validation") && docs.includes("P91.7 is complete"));
addCheck("docs close P91", docs.includes("P91 is complete") && docs.includes("P93 is next"));
addCheck("platform roadmap closes P91", platformRoadmap.includes("P91.7 is complete") && platformRoadmap.includes("P91 is complete") && platformRoadmap.includes("P93 is next"));
addCheck("roadmap statuses complete through P91.7", p91Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P91.7", p91Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck(
  "parent phase closed",
  statusById.get("P91")?.status === "complete"
    && roadmapById.get("P91")?.status === "complete"
    && statusById.get("P91")?.nextPhase === "P93",
);
addCheck("P92 remains complete", statusById.get("P92")?.status === "complete" && roadmapById.get("P92")?.status === "complete");
addCheck("P93 planned handoff exists", statusById.get("P93")?.status === "planned" && roadmapById.get("P93")?.status === "planned");
addCheck(
  "phase status advanced",
  status.currentPhase === "P91.7"
    && status.previousPhase === "P91.6"
    && status.nextPhase === "P93"
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("Command Center Activation Review preserved", businessBuildData.includes("activationReview") && businessBuildData.includes("The local activation review packet is review-only"));
addCheck("Playwright coverage retained", routeTests.includes("Business Build Activation Review tab shows packet without execution"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(businessBuildData));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(businessBuildData));
addCheck(
  "unsafe runtime operations remain documented as blocked",
  docs.includes("dispatch agents")
    && docs.includes("call providers/models")
    && docs.includes("DB state")
    && docs.includes("deploy, release")
    && docs.includes("export")
    && docs.includes("package")
    && docs.includes("spend"),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P91 governed founder workstream activation planning validation.",
        "- Closes P91 and P91.7 status records with P93 as the next active scoped handoff.",
        "- Confirms Business Build Activation Review remains display-only while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p917-final-validation",
        "- npm run check:p916-docs-roadmap",
        "- npm run check:p915-tests-checkers",
        "- npm run check:p914-command-center-workstream-activation-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build Activation Review\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.7 is final validation only. It does not run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.7 Final Validation Report", phase: "P91.7" },
);

printCheckReport("P91.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
