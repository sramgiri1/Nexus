import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveWorkstreamHandoffContract,
  buildFounderLiveWorkstreamHandoffPacket,
  validateFounderLiveWorkstreamHandoffReadiness,
} from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p982-founder-live-workstream-handoff-model-report.md";

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
const p981Report = readText("reports/p981-founder-live-workstream-handoff-contract-report.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p982 = subphaseById.get("P98.2");
const packet = buildFounderLiveWorkstreamHandoffPacket("Build a simple iOS Snake game for the App Store");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const exportedContract = buildFounderLiveWorkstreamHandoffContract();
const validation = validateFounderLiveWorkstreamHandoffReadiness(packet);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p982-founder-live-workstream-handoff-model"]));
addCheck("P98.2 contract complete with P98.3 handoff", p982?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P98.3")?.status));
addCheck("P98.2 allowed files scoped", p982?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p982.allowedFiles.includes("scripts/check-p982-founder-live-workstream-handoff-model.js"));
addCheck("P98.2 allowed files avoid forbidden roots", !p982?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("exports live handoff helpers", ["buildFounderLiveWorkstreamHandoffContract", "buildFounderLiveWorkstreamHandoffPacket", "validateFounderLiveWorkstreamHandoffReadiness"].every((name) => source.includes(`export function ${name}`)));
addCheck("handoff contract is display-safe", exportedContract.phase === "P98.2" && exportedContract.mode === "display_safe_local_handoff_model");
addCheck("packet validates", validation.valid === true && packet.validation?.valid === true, validation.errors.join("; "));
addCheck("packet is Command Center visible", packet.commandCenterVisible === true && viewModel.liveWorkstreamHandoff?.commandCenterVisible === true);
addCheck("packet includes display source records", packet.sourceRecords?.length === 4 && packet.sourceRecords.every((record) => !/business_build_/.test(JSON.stringify(record))));
addCheck("packet includes agent lanes", packet.agentLanes?.length >= 6 && packet.agentLanes.some((lane) => lane.lane === "iOS"));
addCheck("packet records required evidence", packet.requiredEvidence?.length >= 4 && packet.requiredEvidence.some((entry) => /Execution request remains blocked/.test(entry)));
addCheck("all unsafe runtime flags false", unsafeRuntimeFlags.every((flag) => packet.runtimeFlags?.[flag] === false));
addCheck("dispatch and mutation remain blocked in lanes", packet.agentLanes.every((lane) => lane.dispatchAllowed === "Blocked" && lane.projectMutationAllowed === "Blocked"));
addCheck("P98.1 evidence retained", p981Report.includes("P98.1 Founder Live Workstream Handoff Contract Report") && p981Report.includes("PASS"));
addCheck("docs record P98.2", p98Plan.includes("P98.2 is complete") && p98Plan.includes("npm run check:p982-founder-live-workstream-handoff-model"));
addCheck("platform roadmap records P98.2", platformRoadmap.includes("P98.2 is complete") && platformRoadmap.includes("P98.3 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P98.2")?.status === "complete"
    && status.currentPhase === "P98.2"
    && status.previousPhase === "P98.1"
    && status.nextPhase === "P98.3",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.2", roadmapById.get("P98.2")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P98.3")?.status));

const serialized = JSON.stringify([packet, viewModel.liveWorkstreamHandoff, statusById.get("P98.2")]);
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
        "- Validates P98.2 display-safe live workstream handoff model.",
        "- Confirms the packet reuses Business Build DB CRUD state and exposes local owner lanes for later Command Center UX.",
        "- Confirms all unsafe runtime flags remain false and no execution path is enabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p982-founder-live-workstream-handoff-model",
        "- npm run check:p981-founder-live-workstream-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.2 is a pure local model. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.2 Founder Live Workstream Handoff Model Report", phase: "P98.2" },
);

printCheckReport("P98.2 Founder Live Workstream Handoff Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
