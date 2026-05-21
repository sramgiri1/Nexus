import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p995-command-center-execution-admission-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p99-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const p99Plan = readText("docs/architecture/P99_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p995 = subphaseById.get("P99.5");

const expectedSurfaces = [
  "Lite Execution Admission",
  "Agent Flow Execution Admission",
  "Business Build Execution Admission",
  "DB Runtime Execution Admission",
];

const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p995-command-center-execution-admission-ux"]));
addCheck("P99.5 contract complete with P99.6 handoff", p995?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P99.6")?.status));
addCheck("P99.5 allowed files scoped", p995?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p995.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P99.5 allowed files avoid forbidden roots", !p995?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("UX card component exists", pageSource.includes("function ExecutionAdmissionCard") && pageSource.includes('aria-label="Execution admission readiness"'));
addCheck("UX surfaces all placements", expectedSurfaces.every((label) => pageSource.includes(label)));
addCheck("UX uses admission, envelope, and dry-run model", ["executionAdmission", "executionAdmissionApprovalEnvelope", "executionAdmissionDryRun"].every((token) => pageSource.includes(token)));
addCheck("UX exposes operator context", ["Next action", "Evidence", "Activity", "Cost impact", "Disabled reason", "Owner capability"].every((label) => pageSource.includes(label)));
addCheck("UX exposes approval and lane status", ["Approval gates", "Executable lanes", "Blocked lanes"].every((label) => pageSource.includes(label)) && model.executionAdmissionDryRun?.lanes?.some((lane) => lane.previewDecision === "Do Not Admit Execution"));
addCheck("view model has display data", model.executionAdmission?.commandCenterVisible === true && model.executionAdmissionApprovalEnvelope?.commandCenterVisible === true && model.executionAdmissionDryRun?.commandCenterVisible === true);
addCheck("dry run remains non-executable", model.executionAdmissionDryRun?.executableCount === 0 && model.executionAdmissionDryRun?.lanes?.every((lane) => lane.wouldDispatchAgent === false && lane.wouldMutateProject === false && lane.wouldSpend === false));
addCheck("Playwright coverage added", routeTests.includes("Execution admission readiness appears without runnable actions") && routeTests.includes("DB Runtime Execution Admission"));
addCheck("docs record P99.5", p99Plan.includes("P99.5 is complete") && p99Plan.includes("npm run check:p995-command-center-execution-admission-ux"));
addCheck("platform roadmap records P99.5", /P99\.5 is\s+complete/.test(platformRoadmap) && (/P99\.6 is\s+next/.test(platformRoadmap) || /P99\.6 is\s+complete/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P99.5")?.status === "complete"
    && ["P99.5", "P99.6", "P99.7"].includes(status.currentPhase)
    && ["P99.4", "P99.5", "P99.6"].includes(status.previousPhase)
    && ["P99.6", "P99.7", "P100"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.5", roadmapById.get("P99.5")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P99.6")?.status));

const uxStart = pageSource.indexOf("function ExecutionAdmissionCard");
const uxEnd = pageSource.indexOf("function LiveWorkstreamHandoffCard");
const uxSlice = pageSource.slice(uxStart, uxEnd);
const serialized = JSON.stringify([model.executionAdmission, model.executionAdmissionApprovalEnvelope, model.executionAdmissionDryRun, uxSlice]);
addCheck("no DemoApp leakage", !serialized.includes("DemoApp"));
addCheck("no raw DB table names in UX", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(serialized));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects|db)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(uxSlice));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P99.5 Command Center execution admission UX.",
        "- Confirms Lite, Agent Flow, Business Build, and DB Runtime show display-safe admission model, approval envelope, and dry-run state.",
        "- Confirms the UX remains display-only and does not expose runnable execution, provider/model, project mutation, hosted DB, deploy, package, network, or spend actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p995-command-center-execution-admission-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Execution admission\"",
        "- cd dashboard && npm run build",
        "- npm run check:p994-founder-execution-admission-dry-run",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.5 is display-safe UX only. It does not approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.5 Command Center Execution Admission UX Report", phase: "P99.5" },
);

printCheckReport("P99.5 Command Center Execution Admission UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
