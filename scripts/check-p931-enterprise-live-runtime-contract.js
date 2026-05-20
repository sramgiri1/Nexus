import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p931-enterprise-live-runtime-contract-report.md";

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
const contract = readText("contracts/os-roadmap/p93-execution-contracts.json");
const docs = readText("docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");

const p931 = readJson("contracts/os-roadmap/p93-execution-contracts.json").subphases?.find((entry) => entry.phaseId === "P93.1");
const p932 = readJson("contracts/os-roadmap/p93-execution-contracts.json").subphases?.find((entry) => entry.phaseId === "P93.2");
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now)/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p931-enterprise-live-runtime-contract"]));
addCheck("contract phase is P93", contract.includes('"phase": "P93"') && contract.includes("Enterprise Live Runtime Expansion"));
addCheck("contract has seven subphases", readJson("contracts/os-roadmap/p93-execution-contracts.json").subphases?.length === 7);
addCheck("P93.1 complete and P93.2 handoff exists", p931?.status === "complete" && ["planned", "complete"].includes(p932?.status));
addCheck("P93.1 allowed files scoped", p931?.allowedFiles?.includes("contracts/os-roadmap/p93-execution-contracts.json") && p931.allowedFiles.includes("scripts/check-p931-enterprise-live-runtime-contract.js"));
addCheck("P93.1 forbids db changes", p931?.forbiddenFiles?.includes("db/**"));
addCheck("safety rules block unsafe operations", contract.includes("provider/model calls") && contract.includes("agent dispatch") && contract.includes("project mutation") && contract.includes("provider spend"));
addCheck("future exports defined", contract.includes("buildEnterpriseLiveRuntimeCrudPlan") && contract.includes("buildGovernedRuntimeMutationRequest"));
addCheck("Command Center UX requirements present", contract.includes("DB-backed runtime state") && contract.includes("without raw JSON"));
addCheck("docs record P93.1", docs.includes("P93.1 is complete") && docs.includes("npm run check:p931-enterprise-live-runtime-contract"));
addCheck("platform roadmap records P93.1", platformRoadmap.includes("P93.1 is complete") && (platformRoadmap.includes("P93.2 is next") || platformRoadmap.includes("P93.2 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P93")?.status === "in_progress"
    && statusById.get("P93.1")?.status === "complete"
    && ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].includes(status.currentPhase)
    && ["P91.7", "P92.7", "P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6"].includes(status.previousPhase)
    && ["P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.1", roadmapById.get("P93.1")?.track === "NEXUS_OS" && roadmapById.get("P93.1")?.status === "complete");
addCheck("P93.2 handoff exists", ["planned", "complete"].includes(statusById.get("P93.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.2")?.status));
addCheck("status checker accepts P93.1-P93.7", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].every((phaseId) => statusChecker.includes(`\"${phaseId}\"`)));
addCheck("contract does not expose raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(contract));
addCheck("contract does not invent runnable actions", !unsafeWords.test(contract));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P93.1 enterprise live-runtime expansion contract.",
        "- Confirms P93 is split into implementation-grade subphases.",
        "- Confirms P93.1 is contract-only and does not enable DB writes, dispatch, project mutation, provider calls, deploy, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p931-enterprise-live-runtime-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.1 is contract-only. It does not modify db/**, run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.1 Enterprise Live Runtime Contract Report", phase: "P93.1" },
);

printCheckReport("P93.1 Enterprise Live Runtime Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
