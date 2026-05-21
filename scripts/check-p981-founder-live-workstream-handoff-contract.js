import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p981-founder-live-workstream-handoff-contract-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p981 = subphaseById.get("P98.1");
const allSubphases = ["P98.1", "P98.2", "P98.3", "P98.4", "P98.5", "P98.6", "P98.7"];
const requiredP981Fields = [
  "phaseId",
  "title",
  "status",
  "scopeClassification",
  "objective",
  "narrowScope",
  "allowedFiles",
  "forbiddenFiles",
  "exactFilesToUpdate",
  "uxUpdate",
  "themeRequirements",
  "testsAndCheckers",
  "docsRoadmap",
  "phaseStatusUpdate",
  "validationCommands",
  "finalResponseChecklist",
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
const serializedContract = JSON.stringify(contract);
const serializedStatus = JSON.stringify([statusById.get("P98"), statusById.get("P98.1"), roadmapById.get("P98"), roadmapById.get("P98.1")]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p981-founder-live-workstream-handoff-contract"]));
addCheck("contract phase is P98", contract.phaseId === "P98" && contract.title === "Founder Business Build Live Workstream Handoff");
addCheck("contract has seven subphases", allSubphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P98.1 complete and P98.2 handoff exists", p981?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P98.2")?.status));
addCheck("P98.1 includes implementation-grade fields", requiredP981Fields.every((field) => Object.prototype.hasOwnProperty.call(p981 || {}, field)));
addCheck("P98.1 allowed files scoped", p981?.allowedFiles?.includes("contracts/os-roadmap/p98-execution-contracts.json") && p981.allowedFiles.includes("scripts/check-p981-founder-live-workstream-handoff-contract.js"));
addCheck("P98.1 forbids project and mutation paths", p981?.forbiddenFiles?.includes("projects/**") && p981.forbiddenFiles.includes("providers/**") && p981.forbiddenFiles.includes("worker-runtime/**"));
addCheck("P98.1 allowed files avoid forbidden roots", !p981?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("safety rules keep execution blocked", ["No provider/model calls", "No agent dispatch", "No worker/tool execution", "No project source mutation", "No hosted DB mutation", "No deploy"].every((term) => serializedContract.includes(term)));
addCheck("reuse check names existing helpers", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "shared/resultEnvelope.js", "shared/redaction.js"].every((term) => serializedContract.includes(term)));
addCheck("future exports defined", ["buildFounderLiveWorkstreamHandoffContract", "buildFounderLiveWorkstreamHandoffPacket", "validateFounderLiveWorkstreamHandoffReadiness", "buildFounderLiveWorkstreamHandoffViewModel"].every((term) => serializedContract.includes(term)));
addCheck("future data shapes preserve blocked runtime flags", ["handoffPacket", "sourceRecords", "agentLanes", "runtimeFlags", "providerCallsAllowed", "agentDispatchAllowed", "projectMutationAllowed"].every((term) => serializedContract.includes(term)));
addCheck("Command Center UX requirements present", p981?.uxUpdate?.includes("Lite") && p981.uxUpdate.includes("Agent Flow") && p981.uxUpdate.includes("disabled reason") && p981.uxUpdate.includes("cost impact"));
addCheck("theme requirements present", p981?.themeRequirements?.includes("System") && p981.themeRequirements.includes("Dark") && p981.themeRequirements.includes("Light"));
addCheck("docs record P98.1", p98Plan.includes("P98.1 is complete") && p98Plan.includes("npm run check:p981-founder-live-workstream-handoff-contract"));
addCheck("platform roadmap records P98.1", platformRoadmap.includes("## P98 - Founder Business Build Live Workstream Handoff") && platformRoadmap.includes("P98.1 is complete") && (platformRoadmap.includes("P98.2 is next") || platformRoadmap.includes("P98.2 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P98")?.status === "in_progress"
    && statusById.get("P98.1")?.status === "complete"
    && ["P98.1", "P98.2", "P98.3", "P98.4", "P98.5"].includes(status.currentPhase)
    && ["P97.7", "P98.1", "P98.2", "P98.3", "P98.4"].includes(status.previousPhase)
    && ["P98.2", "P98.3", "P98.4", "P98.5", "P98.6"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.1", roadmapById.get("P98")?.status === "in_progress" && roadmapById.get("P98.1")?.status === "complete");
addCheck("status checker accepts P98.1", statusChecker.includes('"P98.1"'));
addCheck("no DemoApp leakage", !JSON.stringify([p98Plan, serializedStatus]).includes("DemoApp") && serializedContract.includes("No DemoApp exposure"));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(JSON.stringify([contract, p98Plan, platformRoadmap, serializedStatus])));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(JSON.stringify([contract, p98Plan, platformRoadmap])));
addCheck("P98.1 remains contract-only", !p981?.allowedFiles?.some((file) => file.startsWith("dashboard/src/") || file.startsWith("db/") || file.startsWith("live-ready/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P98.1 live workstream handoff execution contract.",
        "- Confirms P98 is split into implementation-grade subphases before coding runtime or UX behavior.",
        "- Confirms execution, project mutation, hosted DB mutation, deployment, packaging, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p981-founder-live-workstream-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.1 is contract-only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.1 Founder Live Workstream Handoff Contract Report", phase: "P98.1" },
);

printCheckReport("P98.1 Founder Live Workstream Handoff Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
