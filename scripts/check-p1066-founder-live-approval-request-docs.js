import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1066-founder-live-approval-request-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1066 = subphaseById.get("P106.6") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1066-founder-live-approval-request-docs"]));
addCheck("contract marks P106.1-P106.6 complete", ["P106.1", "P106.2", "P106.3", "P106.4", "P106.5", "P106.6"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P106.7 planned", subphaseById.get("P106.7")?.status === "planned");
addCheck("contract records docs validation commands", ["npm run check:p1066-founder-live-approval-request-docs", "npm run check:p1065-founder-live-approval-request-validation", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1066.validationCommands?.includes(command)));
addCheck("P106.6 avoids forbidden file scope", !(p1066.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P106.1-P106.6 complete", [
  /P106\.1 Approval Request Contract \/ Schema Baseline[\s\S]*Status:\s+complete/,
  /P106\.2 Approval Request Model[\s\S]*Status:\s+complete/,
  /P106\.3 Request Queue Preview[\s\S]*Status:\s+complete/,
  /P106\.4 Command Center Approval Request UX[\s\S]*Status:\s+complete/,
  /P106\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/,
  /P106\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P106.6", /P106\.6 docs closure/.test(readme) && /P106\.7 is\s+next/.test(readme));
addCheck("platform roadmap records P106.6", /P106\.6 is\s+complete/.test(platformRoadmap) && /P106\.7 is\s+next/.test(platformRoadmap));
addCheck("docs preserve blocked approval request language", /approval request submission[\s\S]*remain blocked/i.test(readme) && /approval capture[\s\S]*remain blocked/i.test(platformRoadmap));
addCheck("docs preserve Command Center placement", /Business Build, Agent Flow, and Live Readiness/.test(readme) && /Chat with NEXUS and Lite/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P106.6", "P106.7"].includes(status.currentPhase)
    && ["P106.5", "P106.6"].includes(status.previousPhase)
    && ["P106.7", "P107"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P106")?.status)
    && statusById.get("P106.6")?.status === "complete"
    && statusById.get("P106.7")?.status === "planned"
    && roadmapById.get("P106.6")?.status === "complete",
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
        "- Validates P106 docs, README, platform roadmap, contract, reports, and OS phase status closure.",
        "- Confirms documentation records completed P106.1-P106.6 scope while keeping approval request submission/capture/persistence/writes and execution authority blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, execution unlock, approval writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1066-founder-live-approval-request-docs",
        "- npm run check:p1065-founder-live-approval-request-validation",
        "- npm run check:p1064-command-center-approval-request-ux",
        "- npm run check:p1063-founder-live-approval-request-queue-preview",
        "- npm run check:p1062-founder-live-approval-request-model",
        "- npm run check:p1061-founder-live-approval-request-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P106.6 is docs/checker only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.6 Founder Live Approval Request Docs Report", phase: "P106.6" },
);

printCheckReport("P106.6 Founder Live Approval Request Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
