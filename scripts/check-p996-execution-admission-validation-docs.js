import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p996-execution-admission-validation-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p99-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const p99Plan = readText("docs/architecture/P99_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p995Report = readText("reports/p995-command-center-execution-admission-ux-report.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p996 = subphaseById.get("P99.6");
const combinedDocs = `${readme}\n${prd}\n${guide}\n${p99Plan}\n${platformRoadmap}`;
const p99ScopedDocs = [
  readme.slice(readme.indexOf("## Current Status Through P99.6"), readme.indexOf("## CareLoop Project Progress")),
  prd.slice(prd.indexOf("## 1A. Current Implementation Status Through P99.6"), prd.indexOf("## 2. Problem")),
  guide.slice(guide.indexOf("## Business Build Execution Admission"), guide.indexOf("## Using Command Center Tabs")),
  p99Plan,
  platformRoadmap.slice(platformRoadmap.indexOf("## P99 - Founder Business Build Governed Execution Admission Handoff"), platformRoadmap.indexOf("The detailed plan lives in\n[`P97")),
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p996-execution-admission-validation-docs"]));
addCheck("contract tracks P99.6 complete", p996?.status === "complete" && p996.allowedFiles?.includes("README.md") && p996.allowedFiles?.includes("docs/usage/COMMAND_CENTER_GUIDE.md"));
addCheck("P99.6 allowed files avoid forbidden roots", !p996?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("README records P99.6 current state", readme.includes("Current Status Through P99.6") && readme.includes("P99 governed execution admission readiness"));
addCheck("PRD records P99.6 current state", prd.includes("updated through P99.6 Founder Business Build Governed Execution Admission Docs/Roadmap") && prd.includes("Current Implementation Status Through P99.6"));
addCheck("Command Center guide documents admission", guide.includes("Business Build Execution Admission") && guide.includes("/command-center/agent-flow") && guide.includes("executable lane count remains `0`"));
addCheck("P99 plan records P99.6", p99Plan.includes("P99.6 is complete") && p99Plan.includes("npm run check:p996-execution-admission-validation-docs") && (p99Plan.includes("P99.7 is next") || p99Plan.includes("P99.7 is complete")));
addCheck("platform roadmap records P99.6", /P99\.6 is\s+complete/.test(platformRoadmap) && (/P99\.7 is\s+next/.test(platformRoadmap) || /P99\.7 is\s+complete/.test(platformRoadmap)));
addCheck("P99.5 validation evidence retained", /Result[\s\S]*PASS|Result: PASS/.test(p995Report) && p995Report.includes("P99.5 Command Center Execution Admission UX Report"));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P99")?.status)
    && statusById.get("P99.6")?.status === "complete"
    && ["P99.6", "P99.7"].includes(status.currentPhase)
    && ["P99.5", "P99.6"].includes(status.previousPhase)
    && ["P99.7", "P100"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.6", roadmapById.get("P99.6")?.track === "NEXUS_OS" && roadmapById.get("P99.6")?.status === "complete");
addCheck("P99.7 handoff exists", ["planned", "complete"].includes(statusById.get("P99.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P99.7")?.status));
addCheck("docs explain admission boundary", /execution admission|admission review/i.test(combinedDocs) && combinedDocs.includes("approval envelope") && combinedDocs.includes("admission dry-run"));
addCheck("docs explain blocked operations", ["provider/model calls", "agent dispatch", "worker/tool execution", "project mutation", "hosted DB mutation", "provider spend"].every((term) => combinedDocs.includes(term)));
addCheck("docs do not imply broad live execution", !/provider calls are live|model calls are live|agent dispatch is live|project mutation is live|hosted DB writes are live|deploy is live|package creation is live|provider spend is live|execute now|dispatch agent now|run worker now|generate app now|approve now/i.test(combinedDocs));
addCheck("docs avoid raw private IDs and credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\//i.test(combinedDocs));
addCheck("docs avoid raw DB table names in primary guidance", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(`${readme}\n${prd}\n${guide}`));
addCheck("no DemoApp leakage", !p99ScopedDocs.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P99.6 execution admission docs and roadmap readiness.",
        "- Confirms README, PRD, Command Center guide, P99 plan, platform roadmap, phase status, and P99.5 evidence are aligned.",
        "- Confirms docs describe governed admission readiness without implying unsafe execution authority.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p996-execution-admission-validation-docs",
        "- npm run check:p995-command-center-execution-admission-ux",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.6 is docs/readiness-only. It does not change Command Center UX, approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.6 Execution Admission Validation Docs Report", phase: "P99.6" },
);

printCheckReport("P99.6 Execution Admission Validation Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
