import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveAgentWorkAssignmentDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1137-founder-live-agent-work-assignment-final-report.md";

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
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1136Checker = readText("scripts/check-p1136-founder-live-agent-work-assignment-validation.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const assignmentCardSource = extractFunction(pageSource, "FounderLiveAgentWorkAssignmentCard");
const displayModel = buildFounderLiveAgentWorkAssignmentDisplayModel("Build a simple iOS Snake game for the App Store");
const serializedDisplayModel = JSON.stringify(displayModel);
const p1137 = subphaseById.get("P113.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1137.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P113.7";
const p113Scripts = [
  "check:p1131-founder-live-agent-work-assignment-contract",
  "check:p1132-founder-live-agent-work-assignment-schema",
  "check:p1133-founder-live-agent-work-assignment-crud-model",
  "check:p1134-founder-live-agent-work-assignment-preview",
  "check:p1135-command-center-work-assignment-ux",
  "check:p1136-founder-live-agent-work-assignment-validation",
  "check:p1137-founder-live-agent-work-assignment-final",
];
const p113Reports = [
  "reports/p1131-founder-live-agent-work-assignment-contract-report.md",
  "reports/p1132-founder-live-agent-work-assignment-schema-report.md",
  "reports/p1133-founder-live-agent-work-assignment-crud-model-report.md",
  "reports/p1134-founder-live-agent-work-assignment-preview-report.md",
  "reports/p1135-command-center-work-assignment-ux-report.md",
  "reports/p1136-founder-live-agent-work-assignment-validation-report.md",
];
const validationCommands = [
  "npm run check:p1137-founder-live-agent-work-assignment-final",
  "npm run check:p1136-founder-live-agent-work-assignment-validation",
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
const p113ClosedState =
  status.currentPhase === "P113.7"
    && status.previousPhase === "P113.6"
    && status.nextPhase === "P114"
    && roadmap.currentPhase === "P113.7"
    && roadmap.previousPhase === "P113.6"
    && roadmap.nextPhase === "P114"
    && statusById.get("P113")?.status === "complete"
    && roadmapById.get("P113")?.status === "complete"
    && statusById.get("P113.7")?.status === "complete"
    && roadmapById.get("P113.7")?.status === "complete";
const p114StartedState =
  status.currentPhase === "P114.1"
    && status.previousPhase === "P113.7"
    && status.nextPhase === "P114.2"
    && roadmap.currentPhase === "P114.1"
    && roadmap.previousPhase === "P113.7"
    && roadmap.nextPhase === "P114.2"
    && statusById.get("P113")?.status === "complete"
    && roadmapById.get("P113")?.status === "complete"
    && statusById.get("P113.7")?.status === "complete"
    && roadmapById.get("P113.7")?.status === "complete"
    && statusById.get("P114")?.status === "in_progress"
    && roadmapById.get("P114")?.status === "in_progress"
    && statusById.get("P114.1")?.status === "complete"
    && roadmapById.get("P114.1")?.status === "complete";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1137-founder-live-agent-work-assignment-final"]));
addCheck("all P113 scripts registered", p113Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P113 reports exist and pass", p113Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P113 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P114", contract.currentSubphase === "P113.7" && contract.previousSubphase === "P113.6" && contract.nextSubphase === "P114");
addCheck("P113.7 records final validation commands", validationCommands.every((command) => p1137.validationCommands?.includes(command)));
addCheck("P113.7 avoids forbidden file scope", !(p1137.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P113.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P113.6 checker accepts final handoff", p1136Checker.includes("p1137HandoffState") && p1136Checker.includes("P114") && p1136Checker.includes("scope check relaxed"));
addCheck("OS status checker accepts P114 handoff", osStatusChecker.includes('"P114"') && osStatusChecker.includes('phaseStatus.nextPhase === "P114"'));
addCheck("phase status closed", p113ClosedState || p114StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P113")?.commit, statusById.get("P113.7")?.commit, roadmapById.get("P113")?.commit, roadmapById.get("P113.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P113")?.commandCenterVisible === true && statusById.get("P113.7")?.commandCenterVisible === true);
addCheck("P113 plan records final validation", /P113\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P113 is complete/.test(plan) && /P114 is next/.test(plan));
addCheck("platform roadmap records P113 complete", /P113\.7 is complete/.test(platformRoadmap) && /P113 is complete/.test(platformRoadmap) && /P114 is next/.test(platformRoadmap));
addCheck("README records P113 complete", /P113\.7 final validation/.test(readme) && /P113 is complete/.test(readme) && /P114\s+is\s+next/.test(readme));
addCheck("dashboard uses browser-safe assignment display model", businessBuildSource.includes("buildFounderLiveAgentWorkAssignmentDisplayModel") && businessBuildSource.includes("reports/p1134-founder-live-agent-work-assignment-preview-report.md"));
addCheck("DB readiness summarizes assignment readiness", dbRuntimeSource.includes("agentWorkAssignment") && dbRuntimeSource.includes("Agent work assignment readiness"));
addCheck("Command Center assignment card retained", assignmentCardSource.includes("aria-label=\"Founder agent work assignment readiness\"") && assignmentCardSource.includes("Assignment candidates") && assignmentCardSource.includes("Blocked candidates"));
addCheck("Command Center assignment surfaces remain scoped", pageSource.includes("Business Build Agent Work Assignment") && pageSource.includes("Agent Flow Agent Work Assignment") && !pageSource.includes("Lite Agent Work Assignment") && !pageSource.includes("Chat Agent Work Assignment") && !pageSource.includes("Live Readiness Agent Work Assignment"));
addCheck("route coverage retained", routeTests.includes("Agent work assignment readiness appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.assignmentRows?.every((row) => row.proposedAgentLane && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.writableCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("assignment UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${assignmentCardSource}\n${serializedDisplayModel}`));
addCheck("assignment UX avoids raw assignment keys and table names", !/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(`${assignmentCardSource}\n${serializedDisplayModel}`));
addCheck("assignment UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(`${assignmentCardSource}\n${serializedDisplayModel}`));
addCheck("public docs avoid raw assignment keys and table names", !/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|assignment writes are enabled/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P113 founder live agent work assignment readiness closure.",
        "- Confirms parent P113 and all subphases are complete, reports and scripts exist, Command Center assignment readiness route safety is retained, and the P114 handoff state is valid.",
        "- Does not enable assignment writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P113.7 closes P113 validation only. It does not add Command Center source changes, assignment writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend. P114 is a handoff placeholder until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.7 Founder Live Agent Work Assignment Final Report", phase: "P113.7" },
);

printCheckReport("P113.7 Founder Live Agent Work Assignment Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
