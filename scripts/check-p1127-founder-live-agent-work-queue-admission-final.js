import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1127-founder-live-agent-work-queue-admission-final-report.md";

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

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) return "";
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
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
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1126Checker = readText("scripts/check-p1126-founder-live-agent-work-queue-admission-validation.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const queueCardSource = extractFunction(pageSource, "FounderLiveAgentWorkQueueAdmissionCard");
const p1127 = subphaseById.get("P112.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1127.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P112.7";
const p112Scripts = [
  "check:p1121-founder-live-agent-work-queue-admission-contract",
  "check:p1122-founder-live-agent-work-queue-schema",
  "check:p1123-founder-live-agent-work-queue-crud-model",
  "check:p1124-founder-live-agent-work-queue-admission-preview",
  "check:p1125-command-center-work-queue-admission-ux",
  "check:p1126-founder-live-agent-work-queue-admission-validation",
  "check:p1127-founder-live-agent-work-queue-admission-final",
];
const p112Reports = [
  "reports/p1121-founder-live-agent-work-queue-admission-contract-report.md",
  "reports/p1122-founder-live-agent-work-queue-schema-report.md",
  "reports/p1123-founder-live-agent-work-queue-crud-model-report.md",
  "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md",
  "reports/p1125-command-center-work-queue-admission-ux-report.md",
  "reports/p1126-founder-live-agent-work-queue-admission-validation-report.md",
];
const validationCommands = [
  "npm run check:p1127-founder-live-agent-work-queue-admission-final",
  "npm run check:p1126-founder-live-agent-work-queue-admission-validation",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
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
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const p112ClosedState =
  status.currentPhase === "P112.7"
    && status.previousPhase === "P112.6"
    && status.nextPhase === "P113"
    && roadmap.currentPhase === "P112.7"
    && roadmap.previousPhase === "P112.6"
    && roadmap.nextPhase === "P113"
    && statusById.get("P112")?.status === "complete"
    && roadmapById.get("P112")?.status === "complete"
    && statusById.get("P112.7")?.status === "complete"
    && roadmapById.get("P112.7")?.status === "complete";
const p113StartedState =
  status.currentPhase === "P113.1"
    && status.previousPhase === "P112.7"
    && status.nextPhase === "P113.2"
    && roadmap.currentPhase === "P113.1"
    && roadmap.previousPhase === "P112.7"
    && roadmap.nextPhase === "P113.2"
    && statusById.get("P112")?.status === "complete"
    && roadmapById.get("P112")?.status === "complete"
    && statusById.get("P112.7")?.status === "complete"
    && roadmapById.get("P112.7")?.status === "complete"
    && statusById.get("P113")?.status === "in_progress"
    && roadmapById.get("P113")?.status === "in_progress"
    && statusById.get("P113.1")?.status === "complete"
    && roadmapById.get("P113.1")?.status === "complete";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1127-founder-live-agent-work-queue-admission-final"]));
addCheck("all P112 scripts registered", p112Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P112 reports exist and pass", p112Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P112 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("P112.7 records final validation commands", validationCommands.every((command) => p1127.validationCommands?.includes(command)));
addCheck("P112.7 avoids forbidden file scope", !(p1127.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P112.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P112.6 checker accepts final handoff", p1126Checker.includes("P112.7") && p1126Checker.includes("P113") && p1126Checker.includes("scope check relaxed"));
addCheck("OS status checker accepts P113 handoff", osStatusChecker.includes('"P113"') && osStatusChecker.includes('phaseStatus.nextPhase === "P113"'));
addCheck("phase status closed", p112ClosedState || p113StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P112")?.commit, statusById.get("P112.7")?.commit, roadmapById.get("P112")?.commit, roadmapById.get("P112.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P112")?.commandCenterVisible === true && statusById.get("P112.7")?.commandCenterVisible === true);
addCheck("P112 plan records final validation", /P112\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P112 is complete/.test(plan) && /P113 is next/.test(plan));
addCheck("platform roadmap records P112 complete", /P112\.7 is complete/.test(platformRoadmap) && /P112 is complete/.test(platformRoadmap) && /P113 is next/.test(platformRoadmap));
addCheck("README records P112 complete", /P112\.7 final validation/.test(readme) && /P112 is complete/.test(readme) && /P113 is next/.test(readme));
addCheck("dashboard uses browser-safe queue display model", businessBuildSource.includes("buildFounderLiveAgentWorkQueueAdmissionDisplayModel") && businessBuildSource.includes("reports/p1124-founder-live-agent-work-queue-admission-preview-report.md"));
addCheck("DB readiness summarizes queue admission", dbRuntimeSource.includes("agentWorkQueueAdmission") && dbRuntimeSource.includes("Agent work queue admission"));
addCheck("Command Center admission card retained", queueCardSource.includes("aria-label=\"Founder agent work queue admission\"") && queueCardSource.includes("Queue candidates") && queueCardSource.includes("Blocked candidates"));
addCheck("Command Center surfaces remain scoped", pageSource.includes("Business Build Agent Work Queue Admission") && pageSource.includes("Agent Flow Agent Work Queue Admission") && !pageSource.includes("Lite Agent Work Queue Admission") && !pageSource.includes("Chat Agent Work Queue Admission") && !pageSource.includes("Live Readiness Agent Work Queue Admission"));
addCheck("route coverage retained", routeTests.includes("Agent work queue admission appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("queue UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(queueCardSource));
addCheck("queue UX avoids raw queue keys and table names", !/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(queueCardSource));
addCheck("queue UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(queueCardSource));
addCheck("public docs avoid raw queue keys and table names", !/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|queue writes are enabled/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P112 founder live agent work queue admission closure.",
        "- Confirms parent P112 and all subphases are complete, reports and scripts exist, Command Center queue admission route safety is retained, and the P113 handoff state is valid.",
        "- Does not enable queue writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P112.7 closes P112 validation only. It does not add Command Center source changes, queue writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend. P113 is a handoff placeholder until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.7 Founder Live Agent Work Queue Admission Final Report", phase: "P112.7" },
);

printCheckReport("P112.7 Founder Live Agent Work Queue Admission Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
