import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p961-founder-business-build-readiness-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p96-execution-contracts.json");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const p961 = contract.subphases?.find((entry) => entry.phaseId === "P96.1");
const p962 = contract.subphases?.find((entry) => entry.phaseId === "P96.2");
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now|create project now|write hosted db now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p961-founder-business-build-readiness-contract"]));
addCheck("contract phase is P96", contract.phase === "P96" && contract.title === "Founder Business Build Local Execution Readiness");
addCheck("contract has seven subphases", contract.subphases?.length === 7);
addCheck("P96.1 complete and P96.2 handoff exists", p961?.status === "complete" && ["planned", "complete"].includes(p962?.status));
addCheck("P96.1 allowed files scoped", p961?.allowedFiles?.includes("contracts/os-roadmap/p96-execution-contracts.json") && p961.allowedFiles.includes("scripts/check-p961-founder-business-build-readiness-contract.js"));
addCheck("P96.1 forbids DB, UI, API, runtime, and project changes", p961?.forbiddenFiles?.includes("db/**") && p961.forbiddenFiles.includes("dashboard/src/**") && p961.forbiddenFiles.includes("local-api/**") && p961.forbiddenFiles.includes("live-ready/**") && p961.forbiddenFiles.includes("projects/**"));
addCheck("safety rules block unsafe operations", contractText.includes("provider/model calls") && contractText.includes("agent dispatch") && contractText.includes("project mutation") && contractText.includes("hosted DB mutation") && contractText.includes("provider spend"));
addCheck("reuse requirements name existing helpers", contractText.includes("shared/reportWriter.js") && contractText.includes("live-ready/founderRuntimeDbCrudWorkflow.js") && contractText.includes("live-ready/founderPersistenceOperatorControls.js") && contractText.includes("db/sqliteCrudRepository.js"));
addCheck("future exports defined", contractText.includes("buildFounderBusinessBuildPersistenceSnapshot") && contractText.includes("validateFounderBusinessBuildPersistenceSnapshot") && contractText.includes("buildFounderBusinessBuildReadinessViewModel"));
addCheck("future data shape defined", contractText.includes("dbSourceState") && contractText.includes("founderSessionSummary") && contractText.includes("prdArtifactSummary") && contractText.includes("workstreamPlanSummary"));
addCheck("Command Center UX requirements present", contractText.includes("DB source state") && contractText.includes("without raw JSON") && contractText.includes("no raw table dumps"));
addCheck("docs record P96.1", docs.includes("P96.1 is complete") && docs.includes("npm run check:p961-founder-business-build-readiness-contract"));
addCheck("platform roadmap records P96.1", platformRoadmap.includes("P96.1 is complete") && (platformRoadmap.includes("P96.2 is next") || platformRoadmap.includes("P96.2 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P96")?.status === "in_progress"
    && statusById.get("P96.1")?.status === "complete"
    && ["P96.1", "P96.2", "P96.3"].includes(status.currentPhase)
    && ["P95.7", "P96.1", "P96.2"].includes(status.previousPhase)
    && ["P96.2", "P96.3", "P96.4"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.1", roadmapById.get("P96.1")?.track === "NEXUS_OS" && roadmapById.get("P96.1")?.status === "complete");
addCheck("P96.2 handoff exists", ["planned", "complete"].includes(statusById.get("P96.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.2")?.status));
addCheck("status checker accepts P96 and P96.1", ["P96", "P96.1"].every((phaseId) => statusChecker.includes(`"${phaseId}"`)));
addCheck("contract does not expose raw private IDs", !rawPrivateIdPattern.test(contractText));
addCheck("contract does not invent runnable actions", !unsafeWords.test(contractText));
addCheck("P96.1 remains contract-only", !p961.allowedFiles.some((file) => file.startsWith("db/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("live-ready/") || file.startsWith("local-api/") || file.startsWith("local-state/runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.1 founder Business Build local execution readiness contract.",
        "- Confirms P96 is split into implementation-grade subphases.",
        "- Confirms P96.1 is contract-only and does not enable DB route changes, runtime writes, UI changes, dispatch, project mutation, provider calls, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p961-founder-business-build-readiness-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96.1 is contract-only. It does not modify db/**, dashboard/src/**, dashboard/tests/**, live-ready/**, local-api/**, local-state/runtime/**, execute CRUD, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.1 Founder Business Build Readiness Contract Report", phase: "P96.1" },
);

printCheckReport("P96.1 Founder Business Build Readiness Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
