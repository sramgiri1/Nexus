import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1116-founder-live-agent-work-order-persistence-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1116 = subphaseById.get("P111.6") || {};
const p1117 = subphaseById.get("P111.7") || {};
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1115Checker = readText("scripts/check-p1115-founder-live-agent-work-order-persistence-validation.js");
const changed = changedFiles();
const allowedFiles = new Set(p1116.allowedFiles || []);
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
  "check:p1111-founder-live-agent-work-order-persistence-contract",
  "check:p1112-founder-live-agent-work-order-schema",
  "check:p1113-founder-live-agent-work-order-crud-model",
  "check:p1114-command-center-work-order-persistence-ux",
  "check:p1115-founder-live-agent-work-order-persistence",
  "check:p1116-founder-live-agent-work-order-persistence",
];
const reportPaths = [
  "reports/p1111-founder-live-agent-work-order-persistence-contract-report.md",
  "reports/p1112-founder-live-agent-work-order-schema-report.md",
  "reports/p1113-founder-live-agent-work-order-crud-model-report.md",
  "reports/p1114-command-center-work-order-persistence-ux-report.md",
  "reports/p1115-founder-live-agent-work-order-persistence-validation-report.md",
];
const validationCommands = [
  "npm run check:p1116-founder-live-agent-work-order-persistence",
  "npm run check:p1115-founder-live-agent-work-order-persistence",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P111.1-P111.5 are complete", ["P111.1", "P111.2", "P111.3", "P111.4", "P111.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P111.6 contract is complete", p1116.status === "complete" && ["planned", "complete"].includes(p1117.status));
addCheck("P111.6 records validation commands", validationCommands.every((command) => p1116.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("P111.5 checker accepts P111.6 handoff", p1115Checker.includes('status.currentPhase === "P111.6"') && p1115Checker.includes('status.nextPhase === "P111.7"'));
addCheck(
  "phase status advanced",
  status.currentPhase === "P111.6"
    && status.previousPhase === "P111.5"
    && status.nextPhase === "P111.7"
    && roadmap.currentPhase === "P111.6"
    && roadmap.previousPhase === "P111.5"
    && roadmap.nextPhase === "P111.7"
    && statusById.get("P111")?.status === "in_progress"
    && statusById.get("P111.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P111.7")?.status)
    && roadmapById.get("P111")?.status === "in_progress"
    && roadmapById.get("P111.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P111 plan records all completed subphases", [
  /P111\.1 Work Order Persistence Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/,
  /P111\.2 Agent Work Order SQLite Schema[\s\S]*Status:\s+complete/,
  /P111\.3 Governed Local Work Order CRUD Model[\s\S]*Status:\s+complete/,
  /P111\.4 Command Center Work Order Persistence UX[\s\S]*Status:\s+complete/,
  /P111\.5 Work Order Persistence Validation[\s\S]*Status:\s+complete/,
  /P111\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P111.6", /P111\.6 docs closure/.test(readme) && /P111\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P111.6", /P111\.6 is\s+complete/.test(platformRoadmap) && /P111\.7\s+is\s+next/.test(platformRoadmap));
addCheck("contract handoff points to final validation", contract.currentSubphase === "P111.6" && contract.previousSubphase === "P111.5" && contract.nextSubphase === "P111.7");
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|work order execution is enabled/i.test(docsBundle));
addCheck("changed files stay in P111.6 allowed scope", changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P111.6 docs and roadmap closure evidence.",
        "- Confirms P111.1-P111.5 are recorded complete and P111.7 is the final validation handoff.",
        "- Confirms P111 documentation, README, platform roadmap, contract, status files, and prior reports are aligned.",
        "- Does not change Command Center UX, runtime behavior, DB schema, project files, providers, tools, workers, deploy, release, exports, packages, network, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P111.6 is docs/roadmap closure only. It does not change Command Center UX, write DB records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.6 Founder Live Agent Work Order Persistence Docs Report", phase: "P111.6" },
);

printCheckReport("P111.6 Founder Live Agent Work Order Persistence Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
