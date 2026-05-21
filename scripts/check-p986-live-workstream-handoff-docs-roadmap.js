import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p986-live-workstream-handoff-docs-roadmap-report.md";

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
const contract = readJson("contracts/os-roadmap/p98-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const p98Plan = readText("docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p985Report = readText("reports/p985-live-workstream-handoff-validation-report.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p986 = subphaseById.get("P98.6");
const combinedDocs = `${readme}\n${prd}\n${guide}\n${p98Plan}\n${platformRoadmap}`;
const p98ScopedDocs = [
  readme.slice(readme.indexOf("## Current Status Through P98.6"), readme.indexOf("## CareLoop Project Progress")),
  prd.slice(prd.indexOf("## 1A. Current Implementation Status Through P98.6"), prd.indexOf("## 2. Problem")),
  guide.slice(guide.indexOf("## Business Build Live Workstream Handoff"), guide.indexOf("## Using Command Center Tabs")),
  p98Plan,
  platformRoadmap.slice(platformRoadmap.indexOf("## P98 - Founder Business Build Live Workstream Handoff"), platformRoadmap.indexOf("## P99")),
].join("\n");

const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^dashboard\/src\//,
  /^dashboard\/tests\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p986-live-workstream-handoff-docs-roadmap"]));
addCheck("contract tracks P98.6 complete", p986?.status === "complete" && p986.allowedFiles?.includes("README.md") && p986.allowedFiles?.includes("docs/usage/COMMAND_CENTER_GUIDE.md"));
addCheck("P98.6 allowed files avoid forbidden roots", !p986?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("README records P98.6 current state", readme.includes("Current Status Through P98.6") && readme.includes("P98 live workstream handoff readiness"));
addCheck("PRD records P98.6 current state", prd.includes("updated through P98.6 Founder Business Build Live Workstream Handoff Docs/Roadmap") && prd.includes("Current Implementation Status Through P98.6"));
addCheck("Command Center guide documents handoff", guide.includes("Business Build Live Workstream Handoff") && guide.includes("/command-center/agent-flow") && guide.includes("Admitted execution remains `0`"));
addCheck("P98 plan records P98.6", p98Plan.includes("P98.6 is complete") && p98Plan.includes("npm run check:p986-live-workstream-handoff-docs-roadmap") && (p98Plan.includes("P98.7 is next") || p98Plan.includes("P98.7 is complete")));
addCheck("platform roadmap records P98.6", /P98\.6 is\s+complete/.test(platformRoadmap) && (/P98\.7 is\s+next/.test(platformRoadmap) || /P98\.7 is\s+complete/.test(platformRoadmap)));
addCheck("P98.5 validation evidence retained", /Result[\s\S]*PASS|Result: PASS/.test(p985Report) && p985Report.includes("P98.5 Live Workstream Handoff Validation Report"));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P98")?.status)
    && statusById.get("P98.6")?.status === "complete"
    && ["P98.6", "P98.7"].includes(status.currentPhase)
    && ["P98.5", "P98.6"].includes(status.previousPhase)
    && ["P98.7", "P99"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.6", roadmapById.get("P98.6")?.track === "NEXUS_OS" && roadmapById.get("P98.6")?.status === "complete");
addCheck("P98.7 handoff exists", ["planned", "complete"].includes(statusById.get("P98.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P98.7")?.status));
addCheck("docs explain live-local handoff boundary", /live-local|local handoff|local workstream planning/i.test(combinedDocs) && combinedDocs.includes("display-safe") && combinedDocs.includes("dry-run lane"));
addCheck("docs explain blocked operations", ["provider/model calls", "agent dispatch", "worker/tool execution", "project mutation", "hosted DB mutation", "provider spend"].every((term) => combinedDocs.includes(term)));
addCheck("docs do not imply broad live execution", !/provider calls are live|model calls are live|agent dispatch is live|project mutation is live|hosted DB writes are live|deploy is live|package creation is live|provider spend is live|execute now|dispatch agent now|run worker now|generate app now/i.test(combinedDocs));
addCheck("docs avoid raw private IDs and credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\//i.test(combinedDocs));
addCheck("docs avoid raw DB table names in primary guidance", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(`${readme}\n${prd}\n${guide}`));
addCheck("no DemoApp leakage", !p98ScopedDocs.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P98.6 live workstream handoff docs and roadmap readiness.",
        "- Confirms README, PRD, Command Center guide, P98 plan, platform roadmap, phase status, and P98.5 evidence are aligned.",
        "- Confirms docs describe live-local handoff readiness without implying unsafe execution authority.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p986-live-workstream-handoff-docs-roadmap",
        "- npm run check:p985-live-workstream-handoff-validation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.6 is docs/readiness-only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.6 Live Workstream Handoff Docs Roadmap Report", phase: "P98.6" },
);

printCheckReport("P98.6 Live Workstream Handoff Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
