import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p985-live-workstream-handoff-validation-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const reports = [
  "reports/p981-founder-live-workstream-handoff-contract-report.md",
  "reports/p982-founder-live-workstream-handoff-model-report.md",
  "reports/p983-founder-live-workstream-handoff-dry-run-report.md",
  "reports/p984-command-center-live-workstream-handoff-ux-report.md",
].map((path) => [path, readText(path)]);
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p985 = subphaseById.get("P98.5");
const completedSubphases = ["P98.1", "P98.2", "P98.3", "P98.4", "P98.5"];
const expectedScripts = [
  "check:p981-founder-live-workstream-handoff-contract",
  "check:p982-founder-live-workstream-handoff-model",
  "check:p983-founder-live-workstream-handoff-dry-run",
  "check:p984-command-center-live-workstream-handoff-ux",
  "check:p985-live-workstream-handoff-validation",
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

addCheck("package registers P98.1-P98.5 scripts", expectedScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P98.1-P98.5 complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P98.5 allowed files scoped", p985?.allowedFiles?.includes("scripts/check-p985-live-workstream-handoff-validation.js") && p985.allowedFiles.includes("reports/p985-live-workstream-handoff-validation-report.md"));
addCheck("P98.5 allowed files avoid forbidden roots", !p985?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("P98.5 validation commands aggregate required checks", expectedScripts.slice(0, 4).every((script) => p985?.validationCommands?.includes(`npm run ${script}`)));
addCheck("prior P98 reports exist and passed", reports.every(([, body]) => /Result[\s\S]*PASS|Result: PASS/.test(body)));
addCheck("view model keeps live handoff data visible", viewModel.liveWorkstreamHandoff?.commandCenterVisible === true && viewModel.liveWorkstreamHandoffDryRun?.commandCenterVisible === true);
addCheck("dry run stays non-executable", viewModel.liveWorkstreamHandoffDryRun?.executableCount === 0 && viewModel.liveWorkstreamHandoffDryRun?.lanes?.every((lane) => lane.wouldDispatchAgent === false && lane.wouldMutateProject === false));
addCheck("Command Center UX retained", commandCenterSource.includes("LiveWorkstreamHandoffCard") && commandCenterSource.includes("DB Runtime Live Workstream Handoff"));
addCheck("Playwright coverage retained", routeTests.includes("Live workstream handoff appears in Lite, Business Build, Agent Flow, and DB Runtime"));
addCheck("docs record P98.5", p98Plan.includes("P98.5 is complete") && p98Plan.includes("npm run check:p985-live-workstream-handoff-validation"));
addCheck("platform roadmap records P98.5", platformRoadmap.includes("P98.5 is complete") && platformRoadmap.includes("P98.6 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P98.5")?.status === "complete"
    && status.currentPhase === "P98.5"
    && status.previousPhase === "P98.4"
    && status.nextPhase === "P98.6",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.5", roadmapById.get("P98.5")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P98.6")?.status));

const serialized = JSON.stringify([viewModel.liveWorkstreamHandoff, viewModel.liveWorkstreamHandoffDryRun, statusById.get("P98.5")]);
addCheck("no DemoApp leakage", !serialized.includes("DemoApp"));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("no raw Business Build table names in Command Center source", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(commandCenterSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P98.1-P98.4 live workstream handoff validation.",
        "- Confirms contract, packet model, dry-run model, Command Center UX, Playwright coverage, docs, and phase status agree.",
        "- Confirms unsafe execution paths remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p985-live-workstream-handoff-validation",
        "- npm run check:p984-command-center-live-workstream-handoff-ux",
        "- npm run check:p983-founder-live-workstream-handoff-dry-run",
        "- npm run check:p982-founder-live-workstream-handoff-model",
        "- npm run check:p981-founder-live-workstream-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.5 is aggregate validation only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.5 Live Workstream Handoff Validation Report", phase: "P98.5" },
);

printCheckReport("P98.5 Live Workstream Handoff Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
