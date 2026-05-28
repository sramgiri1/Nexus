import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1126-founder-live-agent-work-queue-admission-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1126 = subphaseById.get("P112.6") || {};
const p1127 = subphaseById.get("P112.7") || {};
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1125Checker = readText("scripts/check-p1125-command-center-work-queue-admission-ux.js");
const changed = changedFiles();
const allowedFiles = new Set(p1126.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P112.6";
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const requiredScripts = [
  "check:p1121-founder-live-agent-work-queue-admission-contract",
  "check:p1122-founder-live-agent-work-queue-schema",
  "check:p1123-founder-live-agent-work-queue-crud-model",
  "check:p1124-founder-live-agent-work-queue-admission-preview",
  "check:p1125-command-center-work-queue-admission-ux",
  "check:p1126-founder-live-agent-work-queue-admission-validation",
];
const reportPaths = [
  "reports/p1121-founder-live-agent-work-queue-admission-contract-report.md",
  "reports/p1122-founder-live-agent-work-queue-schema-report.md",
  "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
  "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md",
  "reports/p1125-command-center-work-queue-admission-ux-report.md",
];
const validationCommands = [
  "npm run check:p1126-founder-live-agent-work-queue-admission-validation",
  "npm run check:p1125-command-center-work-queue-admission-ux",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P112.1-P112.5 are complete", ["P112.1", "P112.2", "P112.3", "P112.4", "P112.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P112.6 contract is complete", p1126.status === "complete" && ["planned", "complete"].includes(p1127.status));
addCheck("P112.6 records validation commands", validationCommands.every((command) => p1126.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("P112.5 checker accepts P112.6 handoff", p1125Checker.includes('["P112.5", "P112.6"].includes(status.currentPhase)') && p1125Checker.includes('["P112.6", "P112.7"].includes(status.nextPhase)'));

const p1126HandoffState =
  status.currentPhase === "P112.6"
    && status.previousPhase === "P112.5"
    && status.nextPhase === "P112.7"
    && roadmap.currentPhase === "P112.6"
    && roadmap.previousPhase === "P112.5"
    && roadmap.nextPhase === "P112.7"
    && statusById.get("P112")?.status === "in_progress"
    && statusById.get("P112.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P112.7")?.status)
    && roadmapById.get("P112")?.status === "in_progress"
    && roadmapById.get("P112.6")?.status === "complete";
const p1127HandoffState =
  status.currentPhase === "P112.7"
    && status.previousPhase === "P112.6"
    && status.nextPhase === "P113"
    && roadmap.currentPhase === "P112.7"
    && roadmap.previousPhase === "P112.6"
    && roadmap.nextPhase === "P113"
    && statusById.get("P112")?.status === "complete"
    && statusById.get("P112.6")?.status === "complete"
    && statusById.get("P112.7")?.status === "complete"
    && roadmapById.get("P112")?.status === "complete"
    && roadmapById.get("P112.6")?.status === "complete"
    && roadmapById.get("P112.7")?.status === "complete";

addCheck("phase status advanced", p1126HandoffState || p1127HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P112 plan records all completed subphases", [
  /P112\.1 Queue Admission Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/,
  /P112\.2 Agent Work Queue SQLite Schema[\s\S]*Status:\s+complete/,
  /P112\.3 Governed Local Queue CRUD Model[\s\S]*Status:\s+complete/,
  /P112\.4 Queue Admission Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/,
  /P112\.5 Command Center Queue Admission UX[\s\S]*Status:\s+complete/,
  /P112\.6 Work Queue Admission Validation \/ Docs[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P112.6", /P112\.6 validation and docs closure/.test(readme) && /P112\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P112.6", /P112\.6 is complete/.test(platformRoadmap) && /P112\.7 is next/.test(platformRoadmap));
addCheck(
  "contract handoff points to final validation",
  (contract.currentSubphase === "P112.6" && contract.previousSubphase === "P112.5" && contract.nextSubphase === "P112.7")
    || (contract.currentSubphase === "P112.7" && contract.previousSubphase === "P112.6" && contract.nextSubphase === "P113"),
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("public docs avoid raw queue keys and table names", !/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|queue writes are enabled/i.test(docsBundle));
addCheck(
  "changed files stay in P112.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P112.6 aggregate docs and validation closure.",
        "- Confirms P112.1-P112.5 are recorded complete and P112.7 is the final validation handoff.",
        "- Confirms P112 documentation, README, platform roadmap, contract, status files, and prior reports are aligned.",
        "- Does not change Command Center UX, runtime behavior, DB schema, project files, providers, tools, workers, deploy, release, exports, packages, network, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P112.6 is validation/docs closure only. It does not change Command Center UX, write queue records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.6 Founder Live Agent Work Queue Admission Validation Report", phase: "P112.6" },
);

printCheckReport("P112.6 Founder Live Agent Work Queue Admission Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
