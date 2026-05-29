import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveAgentWorkAssignmentDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1135-command-center-work-assignment-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderLiveAgentWorkAssignmentDisplayModel("Build a simple iOS Snake game for the App Store");
const p1135 = subphaseById.get("P113.5") || {};
const p1136 = subphaseById.get("P113.6") || {};
const cardUseCount = (pageSource.match(/<FounderLiveAgentWorkAssignmentCard/g) || []).length;
const serializedDisplayModel = JSON.stringify(displayModel);
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1135-command-center-work-assignment-ux"]));
addCheck("business build uses browser-safe P113 display model", businessBuildSource.includes("buildFounderLiveAgentWorkAssignmentDisplayModel") && businessBuildSource.includes("reports/p1134-founder-live-agent-work-assignment-preview-report.md"));
addCheck("dashboard avoids node-only assignment runtime import", !businessBuildSource.includes("founderLiveAgentWorkAssignmentReadiness.js") && !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("DB runtime summarizes assignment readiness", dbRuntimeSource.includes("agentWorkAssignment") && dbRuntimeSource.includes("Agent work assignment readiness"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.blockedCandidateCount === 3 && Array.isArray(displayModel.assignmentRows) && displayModel.assignmentRows.length === 3);
addCheck("display model rows useful", displayModel.assignmentRows.every((row) => row.proposedAgentLane && row.nextAction && row.blocker && row.evidenceLocation?.includes("p1134")));
addCheck("display model safety counts blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("Command Center card exists", pageSource.includes("function FounderLiveAgentWorkAssignmentCard") && pageSource.includes("aria-label=\"Founder agent work assignment readiness\""));
addCheck("card rendered on Business Build and Agent Flow only", cardUseCount === 2 && pageSource.includes("Business Build Agent Work Assignment") && pageSource.includes("Agent Flow Agent Work Assignment") && !pageSource.includes("Lite Agent Work Assignment") && !pageSource.includes("Chat Agent Work Assignment") && !pageSource.includes("Live Readiness Agent Work Assignment"));
addCheck("card renders founder-useful state", pageSource.includes("Assignment candidates") && pageSource.includes("Blocked candidates") && pageSource.includes("Writable candidates") && pageSource.includes("Dispatchable candidates") && pageSource.includes("Executable candidates") && `${pageSource}\n${businessBuildSource}`.includes("Assignment writes") && `${pageSource}\n${businessBuildSource}`.includes("Local CRUD admission"));
addCheck("Playwright coverage added", routeTests.includes("Agent work assignment readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder agent work assignment readiness") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("contract marks P113.5 complete", p1135.status === "complete" && ["planned", "complete"].includes(p1136.status));
addCheck("docs record P113.5", /P113\.5 Command Center Agent Assignment UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P113.5", /P113\.5 is complete/.test(platformRoadmap) && (/P113\.6 is next/.test(platformRoadmap) || /P113\.6 is complete/.test(platformRoadmap)));
addCheck("README records P113.5", /P113\.5 Command Center agent assignment UX/.test(readme) && (/P113\.6 is next/.test(readme) || /P113\.6 validation and docs/.test(readme)));
addCheck(
  "phase status advanced",
  ["P113.5", "P113.6"].includes(status.currentPhase)
    && ["P113.4", "P113.5"].includes(status.previousPhase)
    && ["P113.6", "P113.7"].includes(status.nextPhase)
    && ["P113.5", "P113.6"].includes(roadmap.currentPhase)
    && ["P113.4", "P113.5"].includes(roadmap.previousPhase)
    && ["P113.6", "P113.7"].includes(roadmap.nextPhase)
    && statusById.get("P113")?.status === "in_progress"
    && statusById.get("P113.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P113.6")?.status)
    && roadmapById.get("P113.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P113.5 avoids forbidden file scope", !(p1135.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw assignment keys and table names", !/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(serializedDisplayModel));
addCheck("page/test avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(pageSource));
addCheck("no raw dumps introduced", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P113.5 Command Center agent work assignment UX.",
        "- Confirms Business Build and Agent Flow render display-safe assignment candidates while Chat/Lite and Live Readiness stay clean.",
        "- Confirms the UX stays read-only and does not expose provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, assignment writes, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1135-command-center-work-assignment-ux",
        "- npm run check:p1134-founder-live-agent-work-assignment-preview",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Agent work assignment\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P113.5 renders display-safe assignment readiness preview state only. It does not write assignment records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.5 Command Center Work Assignment UX Report", phase: "P113.5" },
);

printCheckReport("P113.5 Command Center Work Assignment UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
