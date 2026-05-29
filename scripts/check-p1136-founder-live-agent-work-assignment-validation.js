import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1136-founder-live-agent-work-assignment-validation-report.md";

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
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1136 = subphaseById.get("P113.6") || {};
const p1137 = subphaseById.get("P113.7") || {};
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1135Checker = readText("scripts/check-p1135-command-center-work-assignment-ux.js");
const changed = changedFiles();
const allowedFiles = new Set(p1136.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P113.6";
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
  "check:p1131-founder-live-agent-work-assignment-contract",
  "check:p1132-founder-live-agent-work-assignment-schema",
  "check:p1133-founder-live-agent-work-assignment-crud-model",
  "check:p1134-founder-live-agent-work-assignment-preview",
  "check:p1135-command-center-work-assignment-ux",
  "check:p1136-founder-live-agent-work-assignment-validation",
];
const reportPaths = [
  "reports/p1131-founder-live-agent-work-assignment-contract-report.md",
  "reports/p1132-founder-live-agent-work-assignment-schema-report.md",
  "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
  "reports/p1134-founder-live-agent-work-assignment-preview-report.md",
  "reports/p1135-command-center-work-assignment-ux-report.md",
];
const validationCommands = [
  "npm run check:p1136-founder-live-agent-work-assignment-validation",
  "npm run check:p1135-command-center-work-assignment-ux",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P113.1-P113.5 are complete", ["P113.1", "P113.2", "P113.3", "P113.4", "P113.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P113.6 contract is complete", p1136.status === "complete" && ["planned", "complete"].includes(p1137.status));
addCheck("P113.6 records validation commands", validationCommands.every((command) => p1136.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("P113.5 checker accepts P113.6 handoff", p1135Checker.includes('["P113.5", "P113.6"].includes(status.currentPhase)') && p1135Checker.includes('["P113.6", "P113.7"].includes(status.nextPhase)'));

const p1136HandoffState =
  status.currentPhase === "P113.6"
    && status.previousPhase === "P113.5"
    && status.nextPhase === "P113.7"
    && roadmap.currentPhase === "P113.6"
    && roadmap.previousPhase === "P113.5"
    && roadmap.nextPhase === "P113.7"
    && statusById.get("P113")?.status === "in_progress"
    && statusById.get("P113.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P113.7")?.status)
    && roadmapById.get("P113")?.status === "in_progress"
    && roadmapById.get("P113.6")?.status === "complete";
const p1137HandoffState =
  status.currentPhase === "P113.7"
    && status.previousPhase === "P113.6"
    && status.nextPhase === "P114"
    && roadmap.currentPhase === "P113.7"
    && roadmap.previousPhase === "P113.6"
    && roadmap.nextPhase === "P114"
    && statusById.get("P113")?.status === "complete"
    && statusById.get("P113.6")?.status === "complete"
    && statusById.get("P113.7")?.status === "complete"
    && roadmapById.get("P113")?.status === "complete"
    && roadmapById.get("P113.6")?.status === "complete"
    && roadmapById.get("P113.7")?.status === "complete";

addCheck("phase status advanced", p1136HandoffState || p1137HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P113 plan records all completed subphases", [
  /P113\.1 Assignment Readiness Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/,
  /P113\.2 Agent Work Assignment SQLite Schema[\s\S]*Status:\s+complete/,
  /P113\.3 Governed Local Assignment CRUD Model[\s\S]*Status:\s+complete/,
  /P113\.4 Assignment Readiness Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/,
  /P113\.5 Command Center Agent Assignment UX[\s\S]*Status:\s+complete/,
  /P113\.6 Work Assignment Validation \/ Docs[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck(
  "README records P113.6",
  /P113\.6 validation and docs closure/.test(readme)
    && (/P113\.7\s+is\s+next/.test(readme) || /P113\.7 final validation/.test(readme)),
);
addCheck(
  "platform roadmap records P113.6",
  /P113\.6 is complete/.test(platformRoadmap)
    && (/P113\.7 is next/.test(platformRoadmap) || /P113\.7 is complete/.test(platformRoadmap)),
);
addCheck(
  "contract handoff points to final validation",
  (contract.currentSubphase === "P113.6" && contract.previousSubphase === "P113.5" && contract.nextSubphase === "P113.7")
    || (contract.currentSubphase === "P113.7" && contract.previousSubphase === "P113.6" && contract.nextSubphase === "P114"),
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("public docs avoid raw assignment keys and table names", !/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|assignment writes are enabled/i.test(docsBundle));
addCheck(
  "changed files stay in P113.6 allowed scope",
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
        "- Validates P113.6 aggregate docs and validation closure.",
        "- Confirms P113.1-P113.5 are recorded complete and P113.7 is the final validation handoff.",
        "- Confirms P113 documentation, README, platform roadmap, contract, status files, and prior reports are aligned.",
        "- Does not change Command Center UX, runtime behavior, DB schema, project files, providers, tools, workers, deploy, release, exports, packages, network, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P113.6 is validation/docs closure only. It does not change Command Center UX, write assignment records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.6 Founder Live Agent Work Assignment Validation Report", phase: "P113.6" },
);

printCheckReport("P113.6 Founder Live Agent Work Assignment Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
