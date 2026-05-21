import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveWorkstreamHandoffDryRun,
} from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p983-founder-live-workstream-handoff-dry-run-report.md";

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
const contract = readJson("contracts/os-roadmap/p98-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const p98Plan = readText("docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("dashboard/src/data/businessBuild.js");
const p982Report = readText("reports/p982-founder-live-workstream-handoff-model-report.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p983 = subphaseById.get("P98.3");
const dryRun = buildFounderLiveWorkstreamHandoffDryRun("Build a simple iOS Snake game for the App Store");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const unsafeRuntimeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "workerExecutionAllowed",
  "toolExecutionAllowed",
  "projectMutationAllowed",
  "hostedDbWritesAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p983-founder-live-workstream-handoff-dry-run"]));
addCheck("P98.3 contract complete with P98.4 handoff", p983?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P98.4")?.status));
addCheck("P98.3 allowed files scoped", p983?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p983.allowedFiles.includes("scripts/check-p983-founder-live-workstream-handoff-dry-run.js"));
addCheck("P98.3 allowed files avoid forbidden roots", !p983?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("exports dry-run helper", source.includes("export function buildFounderLiveWorkstreamHandoffDryRun"));
addCheck("dry run visible through Business Build model", viewModel.liveWorkstreamHandoffDryRun?.currentState === dryRun.currentState && dryRun.commandCenterVisible === true);
addCheck("dry run has lane previews", dryRun.lanes?.length >= 6 && dryRun.lanes.some((lane) => lane.lane === "iOS"));
addCheck("dry run has operator checklist", dryRun.safetyRows?.some((row) => row.label === "Agent dispatch" && row.value === "Blocked") && dryRun.blockers?.length >= 4);
addCheck("dry run remains non-executable", dryRun.executableCount === 0 && dryRun.dryRunOnly === true && dryRun.lanes.every((lane) => lane.wouldDispatchAgent === false && lane.wouldMutateProject === false));
addCheck("all unsafe runtime flags false", unsafeRuntimeFlags.every((flag) => dryRun.runtimeFlags?.[flag] === false));
addCheck("P98.2 evidence retained", p982Report.includes("P98.2 Founder Live Workstream Handoff Model Report") && p982Report.includes("PASS"));
addCheck("docs record P98.3", p98Plan.includes("P98.3 is complete") && p98Plan.includes("npm run check:p983-founder-live-workstream-handoff-dry-run"));
addCheck("platform roadmap records P98.3", platformRoadmap.includes("P98.3 is complete") && (platformRoadmap.includes("P98.4 is next") || platformRoadmap.includes("P98.4 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P98.3")?.status === "complete"
    && ["P98.3", "P98.4", "P98.5", "P98.6", "P98.7"].includes(status.currentPhase)
    && ["P98.2", "P98.3", "P98.4", "P98.5", "P98.6"].includes(status.previousPhase)
    && ["P98.4", "P98.5", "P98.6", "P98.7", "P99"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.3", roadmapById.get("P98.3")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P98.4")?.status));

const serialized = JSON.stringify([dryRun, viewModel.liveWorkstreamHandoffDryRun, statusById.get("P98.3")]);
addCheck("no DemoApp leakage", !serialized.includes("DemoApp"));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P98.3 deterministic safe dry-run handoff preview records.",
        "- Confirms the dry-run reuses the P98.2 handoff packet and remains display-only.",
        "- Confirms dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p983-founder-live-workstream-handoff-dry-run",
        "- npm run check:p982-founder-live-workstream-handoff-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.3 is a deterministic dry-run model only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.3 Founder Live Workstream Handoff Dry Run Report", phase: "P98.3" },
);

printCheckReport("P98.3 Founder Live Workstream Handoff Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
