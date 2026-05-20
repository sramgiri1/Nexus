import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p955-founder-persistence-controls-validation-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p95-execution-contracts.json");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routes = readText("dashboard/tests/routes.spec.js");
const p955 = contract.subphases?.find((entry) => entry.phaseId === "P95.5");
const p956 = contract.subphases?.find((entry) => entry.phaseId === "P95.6");

const requiredScripts = [
  "check:p951-founder-persistence-controls-contract",
  "check:p952-founder-persistence-control-model",
  "check:p953-approved-local-persistence-adapter",
  "check:p954-command-center-persistence-controls-ux",
  "check:p955-founder-persistence-controls-validation",
];
const requiredReports = [
  "reports/p951-founder-persistence-controls-contract-report.md",
  "reports/p952-founder-persistence-control-model-report.md",
  "reports/p953-approved-local-persistence-adapter-report.md",
  "reports/p954-command-center-persistence-controls-ux-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P95.1-P95.5 contract complete", ["P95.1", "P95.2", "P95.3", "P95.4", "P95.5"].every((phaseId) => contract.subphases?.find((entry) => entry.phaseId === phaseId)?.status === "complete"));
addCheck("P95.6 handoff planned", ["planned", "complete"].includes(p956?.status));
addCheck("required reports exist", requiredReports.every(exists));
addCheck("Command Center persistence controls retained", source.includes("FounderPersistenceControlsCard") && source.includes("buildFounderPersistenceControlsViewModel") && source.includes("Persistence adapter report"));
addCheck("Command Center routes covered by Playwright", routes.includes("Founder persistence controls appear in Lite, Business Build, and DB Runtime") && routes.includes("/command-center/lite") && routes.includes("/command-center/business-build") && routes.includes("/command-center/database"));
addCheck("Playwright safety assertions retained", routes.includes("founder_sessions") && routes.includes("DemoApp") && routes.includes("write hosted db now"));
addCheck("docs record P95.5", docs.includes("P95.5 is complete") && docs.includes("npm run check:p955-founder-persistence-controls-validation"));
addCheck("platform roadmap records P95.5", platformRoadmap.includes("P95.5 is complete") && (platformRoadmap.includes("P95.6 is next") || platformRoadmap.includes("P95.6 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P95")?.status === "in_progress"
    && statusById.get("P95.5")?.status === "complete"
    && ["P95.5", "P95.6", "P95.7"].includes(status.currentPhase)
    && ["P95.4", "P95.5", "P95.6"].includes(status.previousPhase)
    && ["P95.6", "P95.7", "P96"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.5", roadmapById.get("P95.5")?.track === "NEXUS_OS" && roadmapById.get("P95.5")?.status === "complete");
addCheck("P95.6 handoff exists", ["planned", "complete"].includes(statusById.get("P95.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.6")?.status));
addCheck("no raw private IDs in P95 UX source", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(source.slice(source.indexOf("function buildFounderPersistenceControlsViewModel"), source.indexOf("function CommandCenterLitePage"))));
addCheck("no fake unsafe actions in P95 UX source", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now/i.test(source));
addCheck("P95.5 avoids forbidden source scope", !p955.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/") || file.startsWith("deploy/") || file.startsWith("release/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P95.1-P95.4 founder persistence controls validation.",
        "- Confirms contract, model, adapter, Command Center UX, route safety, reports, docs, and phase status are aligned.",
        "- Does not execute providers, dispatch agents, mutate projects, use hosted DBs, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p955-founder-persistence-controls-validation",
        "- npm run check:p954-command-center-persistence-controls-ux",
        "- npm run check:p953-approved-local-persistence-adapter",
        "- npm run check:p952-founder-persistence-control-model",
        "- npm run check:p951-founder-persistence-controls-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder persistence controls\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.5 is validation aggregation only. It does not add new runtime behavior, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.5 Founder Persistence Controls Validation Report", phase: "P95.5" },
);

printCheckReport("P95.5 Founder Persistence Controls Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
