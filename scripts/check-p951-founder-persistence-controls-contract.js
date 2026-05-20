import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p951-founder-persistence-controls-contract-report.md";

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
const contractText = readText("contracts/os-roadmap/p95-execution-contracts.json");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const p951 = contract.subphases?.find((entry) => entry.phaseId === "P95.1");
const p952 = contract.subphases?.find((entry) => entry.phaseId === "P95.2");
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p951-founder-persistence-controls-contract"]));
addCheck("contract phase is P95", contract.phase === "P95" && contract.title === "Founder Persistence Operator Controls");
addCheck("contract has seven subphases", contract.subphases?.length === 7);
addCheck("P95.1 complete and P95.2 handoff exists", p951?.status === "complete" && ["planned", "complete"].includes(p952?.status));
addCheck("P95.1 allowed files scoped", p951?.allowedFiles?.includes("contracts/os-roadmap/p95-execution-contracts.json") && p951.allowedFiles.includes("scripts/check-p951-founder-persistence-controls-contract.js"));
addCheck("P95.1 forbids DB, UI, runtime, and project changes", p951?.forbiddenFiles?.includes("db/**") && p951.forbiddenFiles.includes("dashboard/src/**") && p951.forbiddenFiles.includes("live-ready/**") && p951.forbiddenFiles.includes("projects/**"));
addCheck("safety rules block unsafe operations", contractText.includes("provider/model calls") && contractText.includes("agent dispatch") && contractText.includes("project mutation") && contractText.includes("provider spend"));
addCheck("reuse requirements name existing helpers", contractText.includes("shared/reportWriter.js") && contractText.includes("live-ready/founderRuntimeDbCrudWorkflow.js") && contractText.includes("db/sqliteCrudRepository.js"));
addCheck("future exports defined", contractText.includes("buildFounderPersistenceOperatorControls") && contractText.includes("executeFounderPersistenceControlAction") && contractText.includes("buildFounderPersistenceControlViewModel"));
addCheck("future data shape defined", contractText.includes("approvalState") && contractText.includes("localEntitySummaries") && contractText.includes("pendingControlActions") && contractText.includes("rollbackPlan"));
addCheck("Command Center UX requirements present", contractText.includes("explicit local persistence approval state") && contractText.includes("without raw JSON"));
addCheck("docs record P95.1", docs.includes("P95.1 is complete") && docs.includes("npm run check:p951-founder-persistence-controls-contract"));
addCheck("platform roadmap records P95.1", platformRoadmap.includes("P95.1 is complete") && (platformRoadmap.includes("P95.2 is next") || platformRoadmap.includes("P95.2 is complete")));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P95")?.status)
    && statusById.get("P95.1")?.status === "complete"
    && ["P95.1", "P95.2", "P95.3", "P95.4", "P95.5", "P95.6", "P95.7"].includes(status.currentPhase)
    && ["P94.7", "P95.1", "P95.2", "P95.3", "P95.4", "P95.5", "P95.6"].includes(status.previousPhase)
    && ["P95.2", "P95.3", "P95.4", "P95.5", "P95.6", "P95.7", "P96"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.1", roadmapById.get("P95.1")?.track === "NEXUS_OS" && roadmapById.get("P95.1")?.status === "complete");
addCheck("P95.2 handoff exists", ["planned", "complete"].includes(statusById.get("P95.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.2")?.status));
addCheck("status checker accepts P95.1-P95.7", ["P95.1", "P95.2", "P95.3", "P95.4", "P95.5", "P95.6", "P95.7"].every((phaseId) => statusChecker.includes(`"${phaseId}"`)));
addCheck("contract does not expose raw private IDs", !rawPrivateIdPattern.test(contractText));
addCheck("contract does not invent runnable actions", !unsafeWords.test(contractText));
addCheck("P95.1 remains contract-only", !p951.allowedFiles.some((file) => file.startsWith("db/") || file.startsWith("dashboard/src/") || file.startsWith("live-ready/") || file.startsWith("local-state/runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P95.1 founder persistence operator controls contract.",
        "- Confirms P95 is split into implementation-grade subphases.",
        "- Confirms P95.1 is contract-only and does not enable DB schema changes, runtime writes, UI changes, dispatch, project mutation, provider calls, deploy, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p951-founder-persistence-controls-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.1 is contract-only. It does not modify db/**, dashboard/src/**, dashboard/tests/**, live-ready/**, local-state/runtime/**, execute CRUD, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.1 Founder Persistence Controls Contract Report", phase: "P95.1" },
);

printCheckReport("P95.1 Founder Persistence Controls Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
