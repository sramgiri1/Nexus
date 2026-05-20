import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p941-founder-runtime-db-crud-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const p941 = contract.subphases?.find((entry) => entry.phaseId === "P94.1");
const p942 = contract.subphases?.find((entry) => entry.phaseId === "P94.2");
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now)/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p941-founder-runtime-db-crud-contract"]));
addCheck("contract phase is P94", contract.phase === "P94" && contract.title === "Founder Runtime DB CRUD Workflow Wiring");
addCheck("contract has seven subphases", contract.subphases?.length === 7);
addCheck("P94.1 complete and P94.2 handoff exists", p941?.status === "complete" && ["planned", "complete"].includes(p942?.status));
addCheck("P94.1 allowed files scoped", p941?.allowedFiles?.includes("contracts/os-roadmap/p94-execution-contracts.json") && p941.allowedFiles.includes("scripts/check-p941-founder-runtime-db-crud-contract.js"));
addCheck("P94.1 forbids db and UI changes", p941?.forbiddenFiles?.includes("db/**") && p941.forbiddenFiles.includes("dashboard/src/**") && p941.forbiddenFiles.includes("live-ready/**"));
addCheck("safety rules block unsafe operations", contractText.includes("provider/model calls") && contractText.includes("agent dispatch") && contractText.includes("project mutation") && contractText.includes("provider spend"));
addCheck("future exports defined", contractText.includes("buildFounderRuntimeDbCrudWorkflow") && contractText.includes("executeApprovedFounderRuntimeDbCrudRequest") && contractText.includes("buildFounderRuntimeDbViewModel"));
addCheck("future DB entities defined", contractText.includes("founder_sessions") && contractText.includes("founder_qna_turns") && contractText.includes("founder_prd_artifacts") && contractText.includes("founder_workstream_plans"));
addCheck("Command Center UX requirements present", contractText.includes("saved founder session state") && contractText.includes("without raw JSON"));
addCheck("docs record P94.1", docs.includes("P94.1 is complete") && docs.includes("npm run check:p941-founder-runtime-db-crud-contract"));
addCheck("platform roadmap records P94.1", platformRoadmap.includes("P94.1 is complete") && (platformRoadmap.includes("P94.2 is next") || platformRoadmap.includes("P94.2 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P94")?.status === "in_progress"
    && statusById.get("P94.1")?.status === "complete"
    && ["P94.1", "P94.2", "P94.3", "P94.4", "P94.5", "P94.6", "P94.7"].includes(status.currentPhase)
    && ["P93.7", "P94.1", "P94.2", "P94.3", "P94.4", "P94.5", "P94.6"].includes(status.previousPhase)
    && ["P94.2", "P94.3", "P94.4", "P94.5", "P94.6", "P94.7", "P95"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P94.1", roadmapById.get("P94.1")?.track === "NEXUS_OS" && roadmapById.get("P94.1")?.status === "complete");
addCheck("P94.2 handoff exists", ["planned", "complete"].includes(statusById.get("P94.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P94.2")?.status));
addCheck("status checker accepts P94.1-P94.7", ["P94.1", "P94.2", "P94.3", "P94.4", "P94.5", "P94.6", "P94.7"].every((phaseId) => statusChecker.includes(`\"${phaseId}\"`)));
addCheck("contract does not expose raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(contractText));
addCheck("contract does not invent runnable actions", !unsafeWords.test(contractText));
addCheck("P94.1 remains contract-only", !p941.allowedFiles.some((file) => file.startsWith("db/") || file.startsWith("dashboard/src/") || file.startsWith("live-ready/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P94.1 founder runtime DB CRUD workflow wiring contract.",
        "- Confirms P94 is split into implementation-grade subphases.",
        "- Confirms P94.1 is contract-only and does not enable DB schema changes, runtime writes, dispatch, project mutation, provider calls, deploy, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94.1 is contract-only. It does not modify db/**, dashboard/src/**, live-ready/**, local-state/runtime/**, execute CRUD, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.1 Founder Runtime DB CRUD Contract Report", phase: "P94.1" },
);

printCheckReport("P94.1 Founder Runtime DB CRUD Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
