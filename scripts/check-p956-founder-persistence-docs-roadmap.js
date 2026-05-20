import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p956-founder-persistence-docs-roadmap-report.md";

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
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p956 = contract.subphases?.find((entry) => entry.phaseId === "P95.6");
const combinedDocs = `${readme}\n${prd}\n${guide}\n${docs}\n${platformRoadmap}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p956-founder-persistence-docs-roadmap"]));
addCheck("contract tracks P95.6 complete", p956?.status === "complete" && p956.allowedFiles?.includes("README.md") && p956.allowedFiles?.includes("docs/usage/COMMAND_CENTER_GUIDE.md"));
addCheck("README records P95.6 current state", readme.includes("Current Status Through P95.6") && readme.includes("P95 founder persistence controls"));
addCheck("PRD records P95.6 current state", prd.includes("updated through P95 Founder Persistence Operator Controls") && prd.includes("Current Implementation Status Through P95.6"));
addCheck("Command Center guide documents persistence controls", guide.includes("Founder Persistence Controls") && guide.includes("/command-center/business-build") && guide.includes("approved local SQLite create, read, update, upsert"));
addCheck("P95 plan records P95.6", docs.includes("P95.6 is complete") && docs.includes("npm run check:p956-founder-persistence-docs-roadmap") && docs.includes("P95.7 is next"));
addCheck("platform roadmap records P95.6", platformRoadmap.includes("P95.6 is complete") && platformRoadmap.includes("P95.7 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P95")?.status === "in_progress"
    && statusById.get("P95.6")?.status === "complete"
    && status.currentPhase === "P95.6"
    && status.previousPhase === "P95.5"
    && status.nextPhase === "P95.7",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.6", roadmapById.get("P95.6")?.track === "NEXUS_OS" && roadmapById.get("P95.6")?.status === "complete");
addCheck("P95.7 handoff exists", ["planned", "complete"].includes(statusById.get("P95.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.7")?.status));
addCheck("docs explain live-local boundary", /live-local|local SQLite/i.test(combinedDocs) && combinedDocs.includes("operator approval") && combinedDocs.includes("rollback acceptance") && combinedDocs.includes("audit acceptance"));
addCheck("docs explain blocked operations", combinedDocs.includes("hosted DB mutation") && combinedDocs.includes("project mutation") && combinedDocs.includes("provider/model calls") && combinedDocs.includes("agent dispatch") && combinedDocs.includes("provider spend"));
addCheck("docs do not imply broad live execution", !/provider calls are live|model calls are live|agent dispatch is live|project mutation is live|hosted DB writes are live|deploy is live|package creation is live|provider spend is live/i.test(combinedDocs));
addCheck("docs avoid raw private IDs", !/private-project-|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(combinedDocs));
addCheck("no forbidden project paths in P95.6 contract", !p956?.allowedFiles?.some((file) => /^projects\/|^careloop\/|^dashboard\/src\/|^dashboard\/tests\/|^providers\/|^tools\/|^worker-runtime\/|^deploy\/|^release\/|^exports\/|^packages\//.test(file)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P95.6 founder persistence docs and roadmap readiness.",
        "- Confirms README, PRD, Command Center guide, P95 plan, platform roadmap, phase status, and handoff wording are aligned.",
        "- Confirms docs explain the live-local boundary without implying unsafe execution.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p956-founder-persistence-docs-roadmap",
        "- npm run check:p955-founder-persistence-controls-validation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.6 is docs/readiness-only. It does not add provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.6 Founder Persistence Docs Roadmap Report", phase: "P95.6" },
);

printCheckReport("P95.6 Founder Persistence Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
