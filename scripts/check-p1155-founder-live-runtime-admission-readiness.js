import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveRuntimeAdmissionReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1155-founder-live-runtime-admission-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderLiveRuntimeAdmissionReadinessDisplayModel("Build a simple iOS Snake game for the App Store");
const p1155 = subphaseById.get("P115.5") || {};
const p1156 = subphaseById.get("P115.6") || {};
const cardUseCount = (pageSource.match(/<FounderLiveRuntimeAdmissionReadinessCard/g) || []).length;
const serializedDisplayModel = JSON.stringify(displayModel);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P115.5";
const allowedFiles = new Set(p1155.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1155-founder-live-runtime-admission-readiness"]));
addCheck("business build uses browser-safe P115 display model", businessBuildSource.includes("buildFounderLiveRuntimeAdmissionReadinessDisplayModel") && businessBuildSource.includes("reports/p1154-founder-live-runtime-admission-readiness-report.md"));
addCheck("dashboard avoids node-only runtime admission import", !businessBuildSource.includes("founderLiveRuntimeAdmissionReadiness.js") && !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.blockedCandidateCount === 3 && Array.isArray(displayModel.runtimeAdmissionRows) && displayModel.runtimeAdmissionRows.length === 3);
addCheck("display model rows useful", displayModel.runtimeAdmissionRows.every((row) => row.proposedAdmissionLane && row.nextAction && row.blocker && row.evidenceLocation?.includes("p1154")));
addCheck("display model safety counts blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.runtimeAdmissibleCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("Command Center card exists", pageSource.includes("function FounderLiveRuntimeAdmissionReadinessCard") && pageSource.includes("aria-label=\"Founder runtime admission readiness\""));
addCheck("card rendered on Business Build and Agent Flow only", cardUseCount === 2 && pageSource.includes("Business Build Runtime Admission Readiness") && pageSource.includes("Agent Flow Runtime Admission Readiness") && !pageSource.includes("Lite Runtime Admission Readiness") && !pageSource.includes("Chat Runtime Admission Readiness") && !pageSource.includes("Live Readiness Runtime Admission Readiness"));
addCheck("card renders founder-useful state", pageSource.includes("Runtime candidates") && pageSource.includes("Blocked candidates") && pageSource.includes("Writable candidates") && pageSource.includes("Admissible candidates") && pageSource.includes("Executable candidates") && `${pageSource}\n${businessBuildSource}`.includes("Runtime admission") && `${pageSource}\n${businessBuildSource}`.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Runtime admission readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder runtime admission readiness") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Founder Runtime Gate"));
addCheck("contract marks P115.5 complete", p1155.status === "complete" && ["planned", "complete"].includes(p1156.status));
addCheck("docs record P115.5", /P115\.5 Command Center Runtime Admission UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P115.5", /P115\.5 is complete/.test(platformRoadmap) && (/P115\.6 is next/.test(platformRoadmap) || /P115\.6 is complete/.test(platformRoadmap)));
addCheck("README records P115.5", /P115\.5 Command Center runtime admission UX/.test(readme) && (/P115\.6 is next/.test(readme) || /P115\.6 runtime admission validation/.test(readme)));
addCheck(
  "phase status advanced",
  ["P115.5", "P115.6", "P115.7"].includes(status.currentPhase)
    && ["P115.4", "P115.5", "P115.6"].includes(status.previousPhase)
    && ["P115.6", "P115.7", "P116"].includes(status.nextPhase)
    && ["P115.5", "P115.6", "P115.7"].includes(roadmap.currentPhase)
    && ["P115.4", "P115.5", "P115.6"].includes(roadmap.previousPhase)
    && ["P115.6", "P115.7", "P116"].includes(roadmap.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P115")?.status)
    && statusById.get("P115.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.6")?.status)
    && roadmapById.get("P115.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P115.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P115.5 contract avoids forbidden file scope", !(p1155.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw runtime keys and table names", !/(runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(serializedDisplayModel));
addCheck("page/test avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(pageSource));
addCheck("no raw dumps introduced", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P115.5 Command Center runtime admission readiness UX.",
        "- Confirms Business Build and Agent Flow render display-safe runtime readiness candidates while Chat/Lite and Live Readiness stay clean.",
        "- Confirms the UX stays read-only and does not expose runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1155-founder-live-runtime-admission-readiness",
        "- npm run check:p1154-founder-live-runtime-admission-readiness",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime admission readiness appears only on Business Build and Agent Flow\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P115.5 renders display-safe runtime admission readiness preview state only. It does not write readiness records, unlock execution, admit runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.5 Command Center Runtime Admission Readiness UX Report", phase: "P115.5" },
);

printCheckReport("P115.5 Command Center Runtime Admission Readiness UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
