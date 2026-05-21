import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p971-founder-business-build-governed-execution-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p97-execution-contracts.json");
const p96Contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const serializedContract = JSON.stringify(contract);
const p971 = contract.subphases?.find((entry) => entry.phaseId === "P97.1");
const allSubphases = ["P97.1", "P97.2", "P97.3", "P97.4", "P97.5", "P97.6", "P97.7"];
const requiredContractFields = [
  "objective",
  "classification",
  "allowedFiles",
  "forbiddenFiles",
  "expectedExportsSchemasDataShapes",
  "commandCenterUxRequirements",
  "themeRequirements",
  "playwrightTests",
  "testsCheckers",
  "docsRoadmapUpdates",
  "validationCommands",
  "finalSafetyChecks",
  "gitCommands",
  "finalResponseChecklist",
];
const forbiddenPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
];
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|create project now|write hosted db now|generate app now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p971-founder-business-build-governed-execution-contract"]));
addCheck("contract phase is P97", contract.phase === "P97" && contract.title === "Founder Business Build Governed Execution Contract" && contract.classification === "NEXUS_OS_CHANGE");
addCheck("contract has seven subphases", allSubphases.every((phaseId) => contract.subphases?.some((entry) => entry.phaseId === phaseId)));
addCheck("P97.1 complete and P97.2 handoff exists", p971?.status === "complete" && contract.subphases?.some((entry) => entry.phaseId === "P97.2" && entry.status === "planned"));
addCheck("P97.1 includes implementation-grade fields", requiredContractFields.every((field) => Object.prototype.hasOwnProperty.call(p971 || {}, field)));
addCheck("P97.1 allowed files scoped", p971?.allowedFiles?.includes("contracts/os-roadmap/p97-execution-contracts.json") && p971.allowedFiles.includes("scripts/check-p971-founder-business-build-governed-execution-contract.js"));
addCheck("P97.1 forbids project and runtime mutation paths", p971?.forbiddenFiles?.includes("projects/**") && p971.forbiddenFiles.includes("providers/**") && p971.forbiddenFiles.includes("worker-runtime/**"));
addCheck("P97.1 avoids forbidden allowed-file scope", !p971?.allowedFiles?.some((file) => forbiddenPatterns.some((pattern) => pattern.test(file))));
addCheck("safety rules block unsafe operations", ["provider/model calls", "agent dispatch", "worker execution", "project mutation", "hosted DB mutation", "provider spend"].every((term) => serializedContract.includes(term)));
addCheck("reuse requirements name existing helpers", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/redaction.js", "os-roadmap/updatePhaseStatus.js", "founderBusinessBuildExecutionReadiness.js"].every((term) => serializedContract.includes(term)));
addCheck("future exports defined", serializedContract.includes("buildFounderBusinessBuildExecutionContract") && serializedContract.includes("executeApprovedBusinessBuildDbCrudRequest") && serializedContract.includes("buildBusinessBuildDbViewModel"));
addCheck("future DB entities defined", serializedContract.includes("business_build_sessions") && serializedContract.includes("business_build_execution_requests") && serializedContract.includes("business_build_agent_lanes") && serializedContract.includes("business_build_prd_snapshots"));
addCheck("future data shapes preserve execution blocks", serializedContract.includes("runtimeFlags") && serializedContract.includes("forbiddenOperations") && serializedContract.includes("all non-scoped unsafe runtime flags false"));
addCheck("Command Center UX requirements present", serializedContract.includes("DB-backed Chat with NEXUS") && serializedContract.includes("disabled reason") && serializedContract.includes("Preserve System theme"));
addCheck("P96 parent contract closed", p96Contract.status === "complete");
addCheck("docs record P97.1", docs.includes("P97.1 is complete") && docs.includes("npm run check:p971-founder-business-build-governed-execution-contract"));
addCheck("platform roadmap records P97.1", platformRoadmap.includes("P97.1 is complete") && platformRoadmap.includes("P97.2 is next"));
addCheck("README records P97.1", readme.includes("Current Status Through P97.1") && readme.includes("P97.1 governed Business Build DB CRUD contract"));
addCheck("PRD records P97.1", prd.includes("updated through P97.1") && prd.includes("P97.1 defines the governed Business Build DB CRUD contract"));
addCheck(
  "phase status advanced",
  statusById.get("P97")?.status === "in_progress"
    && statusById.get("P97.1")?.status === "complete"
    && status.currentPhase === "P97.1"
    && status.previousPhase === "P96.7"
    && status.nextPhase === "P97.2",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.1", roadmapById.get("P97")?.status === "in_progress" && roadmapById.get("P97.1")?.status === "complete");
addCheck("P97.2 handoff exists", ["planned", "in_progress"].includes(statusById.get("P97.2")?.status) && ["planned", "in_progress"].includes(roadmapById.get("P97.2")?.status));
addCheck("status checker accepts P97 subphases", allSubphases.every((phaseId) => statusChecker.includes(`"${phaseId}"`)));
addCheck("contract does not expose raw private IDs", !rawPrivateIdPattern.test(serializedContract));
addCheck("contract does not invent runnable actions", !unsafeWords.test(JSON.stringify([contract, docs, platformRoadmap, readme, prd])));
addCheck("P97.1 remains contract-only", !p971?.allowedFiles?.some((file) => file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("db/") || file.startsWith("live-ready/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P97.1 governed Business Build DB CRUD execution contract.",
        "- Confirms the P97 contract is implementation-grade, split into seven subphases, and OS-scoped.",
        "- Confirms P97.1 does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p971-founder-business-build-governed-execution-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P97.1 is contract-only. It does not modify db/**, dashboard/src/**, live-ready/**, local-state/runtime/**, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.1 Founder Business Build Governed Execution Contract Report", phase: "P97.1" },
);

printCheckReport("P97.1 Founder Business Build Governed Execution Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
