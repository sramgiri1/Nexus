import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1076-founder-live-approval-capture-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1076 = subphaseById.get("P107.6") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1076-founder-live-approval-capture-docs"]));
addCheck("contract marks P107.1-P107.6 complete", ["P107.1", "P107.2", "P107.3", "P107.4", "P107.5", "P107.6"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P107.7 planned or complete", ["planned", "complete"].includes(subphaseById.get("P107.7")?.status));
addCheck("contract records docs validation commands", ["npm run check:p1076-founder-live-approval-capture-docs", "npm run check:p1075-founder-live-approval-capture-validation", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1076.validationCommands?.includes(command)));
addCheck("P107.6 avoids forbidden file scope", !(p1076.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P107.1-P107.6 complete", [
  /P107\.1 Approval Capture Contract \/ Schema Baseline[\s\S]*Status:\s+complete/,
  /P107\.2 Approval Capture Model[\s\S]*Status:\s+complete/,
  /P107\.3 Capture Audit Preview[\s\S]*Status:\s+complete/,
  /P107\.4 Command Center Capture Boundary UX[\s\S]*Status:\s+complete/,
  /P107\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/,
  /P107\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P107.6", /P107\.6 docs closure/.test(readme) && /P107\.7 is\s+next/.test(readme));
addCheck("platform roadmap records P107.6", /P107\.6 is\s+complete/.test(platformRoadmap) && (/P107\.7 is\s+next/.test(platformRoadmap) || /P107\.7 is\s+complete/.test(platformRoadmap)));
addCheck("docs preserve blocked approval capture language", /approval capture[\s\S]*remain blocked/i.test(readme) && /approval persistence[\s\S]*remain blocked/i.test(platformRoadmap));
addCheck("docs preserve Command Center placement", /Business Build, Agent Flow, and Live Readiness/.test(readme) && /Chat with NEXUS and Lite/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P107.6", "P107.7"].includes(status.currentPhase)
    && ["P107.5", "P107.6"].includes(status.previousPhase)
    && ["P107.7", "P108"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P107")?.status)
    && statusById.get("P107.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.7")?.status)
    && roadmapById.get("P107.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(docsBundle));
addCheck("docs do not claim execution live", !/execution is live|approval capture is live|runtime admission is enabled|provider spend is enabled/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P107 docs, README, platform roadmap, contract, reports, and OS phase status closure.",
        "- Confirms documentation records completed P107.1-P107.6 scope while keeping approval capture, persistence, writes, runtime admission, and execution authority blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, execution unlock, approval writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1076-founder-live-approval-capture-docs",
        "- npm run check:p1075-founder-live-approval-capture-validation",
        "- npm run check:p1074-command-center-approval-capture-boundary-ux",
        "- npm run check:p1073-founder-live-approval-capture-audit-preview",
        "- npm run check:p1072-founder-live-approval-capture-model",
        "- npm run check:p1071-founder-live-approval-capture-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P107.6 is docs/checker only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.6 Founder Live Approval Capture Docs Report", phase: "P107.6" },
);

printCheckReport("P107.6 Founder Live Approval Capture Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
