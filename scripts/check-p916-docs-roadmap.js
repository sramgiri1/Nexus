import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p916-docs-roadmap-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");

const p91Subphases = ["P91.1", "P91.2", "P91.3", "P91.4", "P91.5", "P91.6"];
const requiredScripts = [
  "check:p911-founder-workstream-activation-contract",
  "check:p912-founder-workstream-activation-model",
  "check:p913-founder-activation-review-packet",
  "check:p914-command-center-workstream-activation-ux",
  "check:p915-tests-checkers",
  "check:p916-docs-roadmap",
];
const requiredReports = [
  "reports/p911-founder-workstream-activation-contract-report.md",
  "reports/p912-founder-workstream-activation-model-report.md",
  "reports/p913-founder-activation-review-packet-report.md",
  "reports/p914-command-center-workstream-activation-ux-report.md",
  "reports/p915-tests-checkers-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("prior P91 reports exist", requiredReports.every(fileExists));
addCheck("contract tracks P91.1-P91.6", p91Subphases.every((phaseId) => contract.includes(phaseId)));
addCheck("contract keeps P91.6 docs-only", contract.includes("nexus-os-p91-6-docs-roadmap") && contract.includes("docs and roadmap closure only"));
addCheck("P91 plan documents P91.6 complete", docs.includes("## P91.6 Docs / Roadmap") && docs.includes("P91.6 is complete"));
addCheck("P91 plan keeps P91.7 final validation next", docs.includes("P91.7 Final Validation") && (docs.includes("P91.7 is next") || docs.includes("P91.7 is complete")));
addCheck("P91 plan records validation commands", docs.includes("npm run check:p916-docs-roadmap") && docs.includes("npm run check:p915-tests-checkers"));
addCheck("platform roadmap records P91.6", platformRoadmap.includes("P91.6 is complete") && (platformRoadmap.includes("P91.7 is next") || platformRoadmap.includes("P91.7 is complete")));
addCheck("roadmap statuses complete through P91.6", p91Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P91.6", p91Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck("P91.7 planned or complete", ["planned", "complete"].includes(statusById.get("P91.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P91.7")?.status));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P91")?.status)
    && statusById.get("P91.6")?.status === "complete"
    && ["P91.6", "P91.7", "P92.7"].includes(status.currentPhase)
    && ["P91.5", "P91.6", "P92.6"].includes(status.previousPhase)
    && ["P91.7", "P92", "P93"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("status checker accepts P91.7 handoff", statusChecker.includes("\"P91.7\""));
addCheck(
  "Command Center UX preserved",
  businessBuildData.includes("activationReview")
    && businessBuildData.includes("The local activation review packet is review-only")
    && routeTests.includes("Business Build Activation Review tab shows packet without execution"),
);
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(businessBuildData));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(businessBuildData));
addCheck("docs preserve blocked runtime boundary", docs.includes("dispatch agents") && docs.includes("call providers/models") && docs.includes("deploy, release") && docs.includes("package, or spend"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P91 docs, roadmap, contract, and status evidence before final validation.",
        "- Confirms P91.1-P91.6 are tracked as NEXUS OS subphases.",
        "- Confirms P91.7 remains the final validation handoff while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p916-docs-roadmap",
        "- npm run check:p915-tests-checkers",
        "- npm run check:p914-command-center-workstream-activation-ux",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.6 is docs and roadmap closure only. It does not run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.6 Docs Roadmap Report", phase: "P91.6" },
);

printCheckReport("P91.6 Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
