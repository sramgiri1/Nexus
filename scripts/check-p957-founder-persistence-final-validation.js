import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p957-founder-persistence-final-validation-report.md";
const P95_SUBPHASES = ["P95.1", "P95.2", "P95.3", "P95.4", "P95.5", "P95.6", "P95.7"];

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
const contract = readJson("contracts/os-roadmap/p95-execution-contracts.json");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contractById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const combinedDocs = `${readme}\n${prd}\n${docs}\n${platformRoadmap}`;
const p95UxSource = source.slice(source.indexOf("function buildFounderPersistenceControlsViewModel"), source.indexOf("function CommandCenterLitePage"));

const requiredScripts = [
  "check:p951-founder-persistence-controls-contract",
  "check:p952-founder-persistence-control-model",
  "check:p953-approved-local-persistence-adapter",
  "check:p954-command-center-persistence-controls-ux",
  "check:p955-founder-persistence-controls-validation",
  "check:p956-founder-persistence-docs-roadmap",
  "check:p957-founder-persistence-final-validation",
];
const requiredReports = [
  "reports/p951-founder-persistence-controls-contract-report.md",
  "reports/p952-founder-persistence-control-model-report.md",
  "reports/p953-approved-local-persistence-adapter-report.md",
  "reports/p954-command-center-persistence-controls-ux-report.md",
  "reports/p955-founder-persistence-controls-validation-report.md",
  "reports/p956-founder-persistence-docs-roadmap-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract closes P95.1-P95.7", P95_SUBPHASES.every((phaseId) => contractById.get(phaseId)?.status === "complete"));
addCheck("status closes P95.1-P95.7", P95_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("roadmap closes P95.1-P95.7", P95_SUBPHASES.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"));
addCheck("P95 parent complete", statusById.get("P95")?.status === "complete" && roadmapById.get("P95")?.status === "complete");
addCheck("P95 completed commits are real or current placeholders", P95_SUBPHASES.every((phaseId) => {
  const commit = statusById.get(phaseId)?.commit || "";
  if (["P95", "P95.7"].includes(phaseId)) return commit && commit !== "planned";
  return commit && commit !== "planned" && !commit.includes("pending");
}));
addCheck("P95.7 current handoff", status.currentPhase === "P95.7" && status.previousPhase === "P95.6" && status.nextPhase === "P96" && status.currentPhaseStatus === "complete", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P96 planned handoff exists", statusById.get("P96")?.status === "planned" && roadmapById.get("P96")?.status === "planned");
addCheck("required reports exist", requiredReports.every((reportPath) => existsSync(join(ROOT, reportPath))));
addCheck("docs record P95 final closure", docs.includes("P95.7 is complete") && docs.includes("P95 is complete") && docs.includes("npm run check:p957-founder-persistence-final-validation"));
addCheck("platform roadmap records P95 final closure", platformRoadmap.includes("P95.7 is complete") && platformRoadmap.includes("P95 is complete") && platformRoadmap.includes("P96"));
addCheck("README records P95 final state", readme.includes("Current Status Through P95") && readme.includes("P95 founder persistence controls") && readme.includes("P96 handoff"));
addCheck("PRD records P95 final state", prd.includes("updated through P95 Founder") && prd.includes("Current Implementation Status Through P95") && prd.includes("P95.3 is the founder persistence control exception"));
addCheck("P95 Playwright coverage retained", routeTests.includes("Founder persistence controls appear in Lite, Business Build, and DB Runtime") && routeTests.includes("expect(body).not.toContain(\"private-project-01\")"));
addCheck("Command Center persistence controls retained", source.includes("FounderPersistenceControlsCard") && source.includes("buildFounderPersistenceControlsViewModel") && source.includes("Persistence adapter report"));
addCheck("P95 UX stays display safe", !/founder_sessions|founder_question_turns|prd_artifacts|workstream_plans|reports\/p95|p95\d|private-project-|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(p95UxSource));
addCheck("docs preserve blocked unsafe runtime", combinedDocs.includes("provider/model calls") && combinedDocs.includes("agent dispatch") && combinedDocs.includes("project mutation") && combinedDocs.includes("hosted DB mutation") && /remain blocked|does not enable/i.test(combinedDocs));
addCheck("docs do not imply broad enablement", !/provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|deploy is enabled|package creation is enabled|provider spend is enabled/i.test(combinedDocs));
addCheck("no forbidden project paths in P95 allowed files", (contract.subphases || []).every((phase) => !(phase.allowedFiles || []).some((file) => /^projects\/|^careloop\//.test(file))));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P95 Founder Persistence Operator Controls.",
        "- Confirms P95.1-P95.7 are complete in contract, roadmap, phase status, docs, and validation evidence.",
        "- Confirms P96 handoff exists and unsafe runtime operations remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p957-founder-persistence-final-validation",
        "- npm run check:p956-founder-persistence-docs-roadmap",
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
      body: "- P95 closes founder persistence operator controls but still does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.7 Founder Persistence Final Validation Report", phase: "P95.7" },
);

printCheckReport("P95.7 Founder Persistence Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
