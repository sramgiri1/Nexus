import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveAgentWorkQueueAdmissionDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1125-command-center-work-queue-admission-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderLiveAgentWorkQueueAdmissionDisplayModel("Build a simple iOS Snake game for the App Store");
const p1125 = subphaseById.get("P112.5") || {};
const p1126 = subphaseById.get("P112.6") || {};
const cardUseCount = (pageSource.match(/<FounderLiveAgentWorkQueueAdmissionCard/g) || []).length;
const serializedDisplayModel = JSON.stringify(displayModel);
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1125-command-center-work-queue-admission-ux"]));
addCheck("business build uses browser-safe P112 display model", businessBuildSource.includes("buildFounderLiveAgentWorkQueueAdmissionDisplayModel") && businessBuildSource.includes("reports/p1124-founder-live-agent-work-queue-admission-preview-report.md"));
addCheck("dashboard avoids node-only queue runtime import", !businessBuildSource.includes("founderLiveAgentWorkQueueAdmission.js") && !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("DB runtime summarizes queue admission", dbRuntimeSource.includes("agentWorkQueueAdmission") && dbRuntimeSource.includes("Agent work queue admission"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.blockedCandidateCount === 3 && Array.isArray(displayModel.queueRows) && displayModel.queueRows.length === 3);
addCheck("display model rows useful", displayModel.queueRows.every((row) => row.proposedAgentLane && row.nextAction && row.blocker && row.evidenceLocation?.includes("p1124")));
addCheck("display model safety counts blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("Command Center card exists", pageSource.includes("function FounderLiveAgentWorkQueueAdmissionCard") && pageSource.includes("aria-label=\"Founder agent work queue admission\""));
addCheck("card rendered on Business Build and Agent Flow only", cardUseCount === 2 && pageSource.includes("Business Build Agent Work Queue Admission") && pageSource.includes("Agent Flow Agent Work Queue Admission") && !pageSource.includes("Lite Agent Work Queue Admission") && !pageSource.includes("Chat Agent Work Queue Admission") && !pageSource.includes("Live Readiness Agent Work Queue Admission"));
addCheck("card renders founder-useful state", pageSource.includes("Queue candidates") && pageSource.includes("Blocked candidates") && pageSource.includes("Writable candidates") && pageSource.includes("Dispatchable candidates") && pageSource.includes("Executable candidates") && `${pageSource}\n${businessBuildSource}`.includes("Queue writes") && `${pageSource}\n${businessBuildSource}`.includes("Local CRUD admission"));
addCheck("Playwright coverage added", routeTests.includes("Agent work queue admission appears only on Business Build and Agent Flow") && routeTests.includes("Founder agent work queue admission") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("contract marks P112.5 complete", p1125.status === "complete" && ["planned", "complete"].includes(p1126.status));
addCheck("docs record P112.5", /P112\.5 Command Center Queue Admission UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P112.5", /P112\.5 is complete/.test(platformRoadmap) && /P112\.6 is next/.test(platformRoadmap));
addCheck("README records P112.5", /P112\.5 Command Center queue admission UX/.test(readme) && /P112\.6 is next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P112.5"
    && status.previousPhase === "P112.4"
    && status.nextPhase === "P112.6"
    && roadmap.currentPhase === "P112.5"
    && roadmap.previousPhase === "P112.4"
    && roadmap.nextPhase === "P112.6"
    && statusById.get("P112")?.status === "in_progress"
    && statusById.get("P112.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P112.6")?.status)
    && roadmapById.get("P112.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P112.5 avoids forbidden file scope", !(p1125.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw queue keys and table names", !/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(serializedDisplayModel));
addCheck("page/test avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(pageSource));
addCheck("no raw dumps introduced", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P112.5 Command Center queue admission UX.",
        "- Confirms Business Build and Agent Flow render display-safe queue admission candidates while Chat/Lite and Live Readiness stay clean.",
        "- Confirms the UX stays read-only and does not expose provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, queue writes, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1125-command-center-work-queue-admission-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Agent work queue admission\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P112.5 renders display-safe queue admission preview state only. It does not write queue records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.5 Command Center Work Queue Admission UX Report", phase: "P112.5" },
);

printCheckReport("P112.5 Command Center Work Queue Admission UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
