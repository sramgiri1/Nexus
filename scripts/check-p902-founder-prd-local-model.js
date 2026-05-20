import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  buildFounderPrdLiveAuthoringLane,
  P90_FOUNDER_PRD_REQUIRED_INPUTS,
  validateFounderPrdLiveAuthoringLane,
} from "../live-ready/founderPrdLiveAuthoringLane.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p902-founder-prd-local-model-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const source = readText("live-ready/founderPrdLiveAuthoringLane.js");

const envelope = buildFounderPrdLiveAuthoringLane({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const envelopeValidation = validateResultEnvelope(envelope);
const laneValidation = validateFounderPrdLiveAuthoringLane(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

addCheck("result envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("lane validation passes", laneValidation.valid, laneValidation.errors.join("; "));
addCheck("required inputs exported", P90_FOUNDER_PRD_REQUIRED_INPUTS.length === 8 && P90_FOUNDER_PRD_REQUIRED_INPUTS.includes("founderIdea"));
addCheck("PRD sections defined", Array.isArray(data.prdSections) && data.prdSections.length === P90_FOUNDER_PRD_REQUIRED_INPUTS.length);
addCheck("founder inputs mapped", Array.isArray(data.founderInputs) && data.founderInputs.every((entry) => "captured" in entry));
addCheck("snake game PRD content inferred", serialized.includes("Snake") && serialized.includes("App Store") && serialized.includes("casual iPhone players"));
addCheck("readiness model present", typeof data.prdReadiness?.score === "number" && data.prdReadiness.totalSections === P90_FOUNDER_PRD_REQUIRED_INPUTS.length);
addCheck("local operations are non-mutating", data.allowedLocalOperations?.every((entry) => !/write project|create project|deploy|package|dispatch/i.test(entry)));
addCheck("runtime flags blocked", Object.values(data.runtimeFlags || {}).every((value) => value === false));
addCheck("top-level execution flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "exportExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed", "localPrdAuthoringAllowed"].every((flag) => data[flag] === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|packages)\//.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p902-founder-prd-local-model"]));
addCheck("contract tracks P90.2 files", contract.includes("P90.2") && contract.includes("live-ready/founderPrdLiveAuthoringLane.js") && contract.includes("check:p902-founder-prd-local-model"));
addCheck("docs record P90.2", docs.includes("P90.2 is complete") && docs.includes("npm run check:p902-founder-prd-local-model"));
addCheck(
  "platform roadmap records P90.2",
  platformRoadmap.includes("P90.2 is complete")
    && (platformRoadmap.includes("P90.3 is next") || platformRoadmap.includes("P90.3 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P90")?.status === "in_progress"
    && statusById.get("P90.2")?.status === "complete"
    && ["P90.2", "P90.3", "P90.4", "P90.5", "P90.6", "P90.7"].includes(status.currentPhase)
    && ["P90.1", "P90.2", "P90.3", "P90.4", "P90.5", "P90.6"].includes(status.previousPhase)
    && ["P90.3", "P90.4", "P90.5", "P90.6", "P90.7", "P91"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.2", roadmapById.get("P90.2")?.track === "NEXUS_OS" && roadmapById.get("P90.2")?.status === "complete");
addCheck("status checker accepts P90.3", statusChecker.includes("\"P90.3\""));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90.2 local founder PRD authoring model.",
        "- Confirms founder context maps into deterministic PRD sections.",
        "- Confirms provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p902-founder-prd-local-model",
        "- npm run check:p901-founder-prd-live-lane-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.2 is a local model only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.2 Founder PRD Local Model Report", phase: "P90.2" },
);

printCheckReport("P90.2 Founder PRD Local Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
