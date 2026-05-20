import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p954-command-center-persistence-controls-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p95-execution-contracts.json");
const source = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p954 = contract.subphases?.find((entry) => entry.phaseId === "P95.4");
const p955 = contract.subphases?.find((entry) => entry.phaseId === "P95.5");
const persistenceSource = source.slice(source.indexOf("function buildFounderPersistenceControlsViewModel"), source.indexOf("function CommandCenterLitePage"));

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p954-command-center-persistence-controls-ux"]));
addCheck("contract tracks P95.4 complete", p954?.status === "complete" && ["planned", "complete"].includes(p955?.status));
addCheck("Command Center helper exists", source.includes("buildFounderPersistenceControlsViewModel") && source.includes("FounderPersistenceControlsCard"));
addCheck("Lite renders persistence controls", source.includes("liteFounderPersistenceControls") && source.includes("<FounderPersistenceControlsCard controls={liteFounderPersistenceControls} />"));
addCheck("Business Build renders persistence controls", source.includes("founderPersistenceControls = buildFounderPersistenceControlsViewModel(build.founderDbWorkflow)") && source.includes("<FounderPersistenceControlsCard controls={founderPersistenceControls} />"));
addCheck("DB Runtime renders persistence controls", source.includes("founderPersistenceControls = buildFounderPersistenceControlsViewModel(dbRuntime.founderRuntime)") && source.includes("<FounderPersistenceControlsCard controls={founderPersistenceControls} />"));
addCheck("UX exposes required operator state", ["Approval state", "Write posture", "Rollback", "Audit", "Evidence", "Activity", "Cost impact", "Next action", "Disabled reason"].every((label) => persistenceSource.includes(label)));
addCheck("UX exposes local actions and records", persistenceSource.includes("Save founder session locally") && persistenceSource.includes("Read founder session locally") && persistenceSource.includes("PRD artifact") && persistenceSource.includes("List workstream plans locally") && persistenceSource.includes("controls.records.map"));
addCheck("UX preserves local-only safety copy", persistenceSource.includes("Local SQLite gated") && persistenceSource.includes("No provider spend") && persistenceSource.includes("agent dispatch") && persistenceSource.includes("hosted DBs"));
addCheck("primary P95 UX avoids raw phase report paths", !/p95\d|p953|reports\/p95/i.test(persistenceSource));
addCheck("primary P95 UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(persistenceSource));
addCheck("primary P95 UX avoids fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now/i.test(persistenceSource));
addCheck("Playwright coverage added", tests.includes("Founder persistence controls appear in Lite, Business Build, and DB Runtime") && tests.includes("/command-center/lite") && tests.includes("/command-center/business-build") && tests.includes("/command-center/database"));
addCheck("Playwright safety assertions retained", tests.includes("founder_sessions") && tests.includes("DemoApp") && tests.includes("write hosted db now"));
addCheck("docs record P95.4", docs.includes("P95.4 is complete") && docs.includes("npm run check:p954-command-center-persistence-controls-ux"));
addCheck("platform roadmap records P95.4", platformRoadmap.includes("P95.4 is complete") && (platformRoadmap.includes("P95.5 is next") || platformRoadmap.includes("P95.5 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P95")?.status === "in_progress"
    && statusById.get("P95.4")?.status === "complete"
    && status.currentPhase === "P95.4"
    && status.previousPhase === "P95.3"
    && status.nextPhase === "P95.5",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.4", roadmapById.get("P95.4")?.track === "NEXUS_OS" && roadmapById.get("P95.4")?.status === "complete");
addCheck("P95.5 handoff exists", ["planned", "complete"].includes(statusById.get("P95.5")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.5")?.status));
addCheck("P95.4 avoids forbidden source scope", !p954.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/") || file.startsWith("deploy/") || file.startsWith("release/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P95.4 Command Center founder persistence controls UX.",
        "- Confirms Lite, Business Build, and DB Runtime render display-safe local persistence state.",
        "- Confirms Playwright coverage and safety assertions for raw IDs, DemoApp leakage, raw internals, and fake unsafe actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p954-command-center-persistence-controls-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder persistence controls\"",
        "- cd dashboard && npm run build",
        "- npm run check:p953-approved-local-persistence-adapter",
        "- npm run check:p952-founder-persistence-control-model",
        "- npm run check:p951-founder-persistence-controls-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.4 adds display-safe Command Center UX only. It does not add new execution buttons, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.4 Command Center Persistence Controls UX Report", phase: "P95.4" },
);

printCheckReport("P95.4 Command Center Persistence Controls UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
