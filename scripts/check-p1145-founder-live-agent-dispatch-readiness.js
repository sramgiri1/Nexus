import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveAgentDispatchReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1145-founder-live-agent-dispatch-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderLiveAgentDispatchReadinessDisplayModel("Build a simple iOS Snake game for the App Store");
const p1145 = subphaseById.get("P114.5") || {};
const p1146 = subphaseById.get("P114.6") || {};
const cardUseCount = (pageSource.match(/<FounderLiveAgentDispatchReadinessCard/g) || []).length;
const serializedDisplayModel = JSON.stringify(displayModel);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P114.5";
const allowedFiles = new Set(p1145.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1145-founder-live-agent-dispatch-readiness"]));
addCheck("business build uses browser-safe P114 display model", businessBuildSource.includes("buildFounderLiveAgentDispatchReadinessDisplayModel") && businessBuildSource.includes("reports/p1144-founder-live-agent-dispatch-readiness-report.md"));
addCheck("dashboard avoids node-only dispatch runtime import", !businessBuildSource.includes("founderLiveAgentDispatchReadiness.js") && !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.blockedCandidateCount === 3 && Array.isArray(displayModel.dispatchRows) && displayModel.dispatchRows.length === 3);
addCheck("display model rows useful", displayModel.dispatchRows.every((row) => row.proposedDispatchLane && row.nextAction && row.blocker && row.evidenceLocation?.includes("p1144")));
addCheck("display model safety counts blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("Command Center card exists", pageSource.includes("function FounderLiveAgentDispatchReadinessCard") && pageSource.includes("aria-label=\"Founder agent dispatch readiness\""));
addCheck("card rendered on Business Build and Agent Flow only", cardUseCount === 2 && pageSource.includes("Business Build Agent Dispatch Readiness") && pageSource.includes("Agent Flow Agent Dispatch Readiness") && !pageSource.includes("Lite Agent Dispatch Readiness") && !pageSource.includes("Chat Agent Dispatch Readiness") && !pageSource.includes("Live Readiness Agent Dispatch Readiness"));
addCheck("card renders founder-useful state", pageSource.includes("Dispatch candidates") && pageSource.includes("Blocked candidates") && pageSource.includes("Writable candidates") && pageSource.includes("Dispatchable candidates") && pageSource.includes("Executable candidates") && `${pageSource}\n${businessBuildSource}`.includes("Dispatch writes") && `${pageSource}\n${businessBuildSource}`.includes("Local CRUD admission"));
addCheck("Playwright coverage added", routeTests.includes("Agent dispatch readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder agent dispatch readiness") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Founder Strategy Dispatch"));
addCheck("contract marks P114.5 complete", p1145.status === "complete" && ["planned", "complete"].includes(p1146.status));
addCheck("docs record P114.5", /P114\.5 Command Center Agent Dispatch UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P114.5", /P114\.5 is complete/.test(platformRoadmap) && (/P114\.6 is next/.test(platformRoadmap) || /P114\.6 is complete/.test(platformRoadmap)));
addCheck("README records P114.5", /P114\.5 Command Center agent dispatch UX/.test(readme) && (/P114\.6 is next/.test(readme) || /P114\.6 dispatch validation/.test(readme)));
addCheck(
  "phase status advanced",
  ["P114.5", "P114.6", "P114.7"].includes(status.currentPhase)
    && ["P114.4", "P114.5", "P114.6"].includes(status.previousPhase)
    && ["P114.6", "P114.7", "P115"].includes(status.nextPhase)
    && ["P114.5", "P114.6", "P114.7"].includes(roadmap.currentPhase)
    && ["P114.4", "P114.5", "P114.6"].includes(roadmap.previousPhase)
    && ["P114.6", "P114.7", "P115"].includes(roadmap.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P114")?.status)
    && statusById.get("P114.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P114.6")?.status)
    && roadmapById.get("P114.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P114.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P114.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P114.5 contract avoids forbidden file scope", !(p1145.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw dispatch keys and table names", !/(dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_dispatch_readiness_items|founder_agent_dispatch_readiness_events|founder_agent_dispatch_readiness_evidence_refs)/.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(serializedDisplayModel));
addCheck("page/test avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(pageSource));
addCheck("no raw dumps introduced", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P114.5 Command Center agent dispatch readiness UX.",
        "- Confirms Business Build and Agent Flow render display-safe dispatch candidates while Chat/Lite and Live Readiness stay clean.",
        "- Confirms the UX stays read-only and does not expose provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, dispatch writes, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1145-founder-live-agent-dispatch-readiness",
        "- npm run check:p1144-founder-live-agent-dispatch-readiness",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Agent dispatch readiness appears only on Business Build and Agent Flow\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P114.5 renders display-safe dispatch readiness preview state only. It does not write dispatch records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.5 Command Center Agent Dispatch Readiness UX Report", phase: "P114.5" },
);

printCheckReport("P114.5 Command Center Agent Dispatch Readiness UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
