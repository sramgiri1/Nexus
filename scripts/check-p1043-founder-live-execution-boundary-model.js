import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P104_EXECUTION_BOUNDARY_MODEL_STATES,
  P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE,
  buildFounderLiveExecutionBoundaryModel,
  validateFounderLiveExecutionBoundaryModel,
} from "../live-ready/founderLiveExecutionBoundaryModel.js";
import { P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS } from "../live-ready/founderLiveExecutionBoundarySchema.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1043-founder-live-execution-boundary-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveExecutionBoundaryModel.js");
const envelope = buildFounderLiveExecutionBoundaryModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveExecutionBoundaryModel(envelope);
const data = envelope.data || {};
const p1043 = subphaseById.get("P104.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1043-founder-live-execution-boundary-model"]));
addCheck("model exports exist", source.includes("buildFounderLiveExecutionBoundaryModel") && source.includes("validateFounderLiveExecutionBoundaryModel"));
addCheck("phase constant", P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE === "P104.3");
addCheck("state constant", Object.values(P104_EXECUTION_BOUNDARY_MODEL_STATES).includes("founder_live_execution_boundary_model_ready_execution_blocked"));
addCheck("model validates", validation.valid, validation.errors.join("; "));
addCheck("model shape", data.schemaVersion === "1.0" && Boolean(data.boundaryReadiness) && Array.isArray(data.boundaryRows));
addCheck("boundary rows useful", data.boundaryRows?.length === 6 && data.boundaryReadiness?.boundaryRowCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("execution remains blocked", data.boundaryReadiness?.executableBoundaryCount === 0 && data.boundaryReadiness?.dispatchableBoundaryCount === 0 && data.boundaryReadiness?.projectMutationBoundaryCount === 0 && data.boundaryReadiness?.hostedDbMutationBoundaryCount === 0 && data.boundaryReadiness?.approvedBoundaryCount === 0);
addCheck("rows remain blocked", data.boundaryRows?.every((row) => row.executionAllowed === false && row.dispatchAllowed === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("rows include evidence and validation", data.boundaryRows?.every((row) => row.requiredEvidence?.length >= 8 && row.validationCommands?.includes("npm run check:p1043-founder-live-execution-boundary-model")));
addCheck("all blocked flags false", P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.boundaryRows.every((row) => row[flag] === false)));
addCheck("reuses schema and P103 work admission", source.includes("buildFounderLiveExecutionBoundarySchema") && source.includes("buildFounderLiveWorkAdmission"));
addCheck("contract marks P104.3 complete", p1043.status === "complete");
addCheck("P104.4 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P104.4")?.status));
addCheck("docs record P104.3", /P104\.3 Execution Boundary Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104.3", /P104\.3 is\s+complete/.test(platformRoadmap) && /P104\.4 is\s+next/.test(platformRoadmap));
addCheck("README records P104.3", /P104\.3 execution-boundary model/.test(readme) && /P104\.4\s+is next/.test(readme));
addCheck(
  "phase status advanced",
  ["P104.3", "P104.4", "P104.5", "P104.6", "P104.7"].includes(status.currentPhase)
    && ["P104.2", "P104.3", "P104.4", "P104.5", "P104.6"].includes(status.previousPhase)
    && ["P104.4", "P104.5", "P104.6", "P104.7", "P105"].includes(status.nextPhase)
    && statusById.get("P104")?.status === "in_progress"
    && statusById.get("P104.3")?.status === "complete"
    && roadmapById.get("P104.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P104.3 avoids forbidden file scope", !(p1043.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(data)));
addCheck("model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(JSON.stringify(data)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P104.3 founder live execution-boundary local model.",
        "- Confirms boundary rows are assembled from P103 work admissions and P104.2 schema without enabling execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1043-founder-live-execution-boundary-model",
        "- npm run check:p1042-founder-live-execution-boundary-schema",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.3 is a local model only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.3 Founder Live Execution Boundary Model Report", phase: "P104.3" },
);

printCheckReport("P104.3 Founder Live Execution Boundary Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
