import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1106-founder-live-operator-decision-ledger-persistence-docs-report.md";

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
    .map((line) => line.includes(" -> ") ? line.split(" -> ").pop() : line);
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1105Checker = readText("scripts/check-p1105-founder-live-operator-decision-ledger-persistence-validation.js");
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const changed = changedFiles();
const p1106 = subphaseById.get("P110.6") || {};
const p1107 = subphaseById.get("P110.7") || {};
const requiredScripts = [
  "check:p1101-founder-live-operator-decision-ledger-persistence-contract",
  "check:p1102-founder-live-operator-decision-ledger-schema",
  "check:p1103-founder-live-operator-decision-ledger-crud-model",
  "check:p1104-command-center-decision-ledger-persistence-ux",
  "check:p1105-founder-live-operator-decision-ledger-persistence-validation",
  "check:p1106-founder-live-operator-decision-ledger-persistence-docs",
];
const reportPaths = [
  "reports/p1101-founder-live-operator-decision-ledger-persistence-contract-report.md",
  "reports/p1102-founder-live-operator-decision-ledger-schema-report.md",
  "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md",
  "reports/p1104-command-center-decision-ledger-persistence-ux-report.md",
  "reports/p1105-founder-live-operator-decision-ledger-persistence-validation-report.md",
];
const validationCommands = [
  "npm run check:p1106-founder-live-operator-decision-ledger-persistence-docs",
  "npm run check:p1105-founder-live-operator-decision-ledger-persistence-validation",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "dashboard/src/",
  "dashboard/tests/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
  "local-state/runtime/",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P110.1-P110.5 are complete", ["P110.1", "P110.2", "P110.3", "P110.4", "P110.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P110.6 contract is complete", p1106.status === "complete" && ["planned", "complete"].includes(p1107.status));
addCheck("P110.6 records validation commands", validationCommands.every((command) => p1106.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("P110 plan records statuses", ["P110.1", "P110.2", "P110.3", "P110.4", "P110.5", "P110.6"].every((phaseId) => new RegExp(`${phaseId.replace(".", "\\.")}[\\s\\S]*Status:\\s+complete`).test(plan)) && /P110\.7 Final Validation[\s\S]*Status:\s+planned/.test(plan));
addCheck("README records P110.6", /P110\.6 docs and roadmap closure/.test(readme) && /P110\.7\s+is next/.test(readme));
addCheck("platform roadmap records P110.6", /P110\.6 is\s+complete/.test(platformRoadmap) && /P110\.7\s+is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P110.6"
    && status.previousPhase === "P110.5"
    && status.nextPhase === "P110.7"
    && statusById.get("P110")?.status === "in_progress"
    && statusById.get("P110.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P110.7")?.status)
    && roadmap.currentPhase === "P110.6"
    && roadmap.previousPhase === "P110.5"
    && roadmap.nextPhase === "P110.7"
    && roadmapById.get("P110.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P110.5 checker accepts P110.6 handoff", p1105Checker.includes("P110.6") && p1105Checker.includes("P110.7"));
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw DB entity names in primary prose", !/operator_decision_ledger_entries|operator_decision_ledger_events|operator_decision_ledger_evidence_refs/.test(`${platformRoadmap}\n${readme}`));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|operator decision ledger writes are enabled/i.test(docsBundle));
addCheck("DemoApp is not exposed as runnable UX", !/DemoApp route|DemoApp page|DemoApp card|open DemoApp|launch DemoApp/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P110.6 docs and roadmap closure evidence.",
        "- Confirms P110.1-P110.5 remain complete, P110.6 is complete, P110.7 is next, docs/status/report evidence is current, and unsafe authority claims remain blocked.",
        "- Does not change runtime behavior, Command Center source, project files, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P110.6 is docs/roadmap closure only. It does not change Command Center UX, write DB records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.6 Founder Live Operator Decision Ledger Persistence Docs Report", phase: "P110.6" },
);

printCheckReport("P110.6 Founder Live Operator Decision Ledger Persistence Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
