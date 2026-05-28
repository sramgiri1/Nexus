import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1096-founder-live-operator-decision-ledger-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1096 = subphaseById.get("P109.6") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1096-founder-live-operator-decision-ledger-docs"]));
addCheck("contract marks P109.1-P109.6 complete", ["P109.1", "P109.2", "P109.3", "P109.4", "P109.5", "P109.6"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P109.7 planned or complete", ["planned", "complete"].includes(subphaseById.get("P109.7")?.status));
addCheck("contract records docs validation commands", [
  "npm run check:p1096-founder-live-operator-decision-ledger-docs",
  "npm run check:p1095-founder-live-operator-decision-ledger-validation",
  "npm run check:p1094-command-center-decision-ledger-ux",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1096.validationCommands?.includes(command)));
addCheck("P109.6 avoids forbidden file scope", !(p1096.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P109.1-P109.6 complete", [
  /P109\.1 Decision Ledger Contract \/ Schema Baseline[\s\S]*Status:\s+complete/,
  /P109\.2 Decision Ledger Model[\s\S]*Status:\s+complete/,
  /P109\.3 Decision Ledger Audit Preview[\s\S]*Status:\s+complete/,
  /P109\.4 Command Center Decision Ledger UX[\s\S]*Status:\s+complete/,
  /P109\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/,
  /P109\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P109.6", /P109\.6 docs closure/.test(readme) && /P109\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P109.6", /P109\.6 is\s+complete/.test(platformRoadmap) && (/P109\.7 is\s+next/.test(platformRoadmap) || /P109\.7 is\s+complete/.test(platformRoadmap)));
addCheck("docs preserve blocked decision ledger language", /operator decision capture[\s\S]*remain blocked/i.test(readme) && /ledger writes[\s\S]*remain blocked/i.test(platformRoadmap));
addCheck("docs preserve Command Center placement", /Business Build, Agent Flow, and Live Readiness/.test(readme) && /Chat with NEXUS and Lite/.test(platformRoadmap));
addCheck("docs point at P109 contract and plan", platformRoadmap.includes("p109-founder-live-operator-decision-ledger-contracts.json") && platformRoadmap.includes("P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PLAN.md"));
addCheck(
  "phase status advanced",
  ["P109.6", "P109.7"].includes(status.currentPhase)
    && ["P109.5", "P109.6"].includes(status.previousPhase)
    && ["P109.7", "P110"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P109")?.status)
    && statusById.get("P109.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.7")?.status)
    && roadmapById.get("P109.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(docsBundle));
addCheck("docs do not claim ledger or execution live", !/decision ledger is writable|operator decision ledger writes are enabled|operator decision capture is live|runtime admission is enabled|execution is live|provider spend is enabled/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P109 docs, README, platform roadmap, contract, reports, and OS phase status closure.",
        "- Confirms documentation records completed P109.1-P109.6 scope while keeping operator decision capture, persistence, ledger writes, DB writes, replay, runtime admission, and execution authority blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, execution unlock, ledger writes, DB writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1096-founder-live-operator-decision-ledger-docs",
        "- npm run check:p1095-founder-live-operator-decision-ledger-validation",
        "- npm run check:p1094-command-center-decision-ledger-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.6 is docs/checker only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.6 Founder Live Operator Decision Ledger Docs Report", phase: "P109.6" },
);

printCheckReport("P109.6 Founder Live Operator Decision Ledger Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
