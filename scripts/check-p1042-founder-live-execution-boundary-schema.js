import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS,
  P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS,
  P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE,
  P104_EXECUTION_BOUNDARY_STATES,
  P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE,
  buildFounderLiveExecutionBoundarySchema,
  validateFounderLiveExecutionBoundarySchema,
} from "../live-ready/founderLiveExecutionBoundarySchema.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1042-founder-live-execution-boundary-schema-report.md";

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
const source = readText("live-ready/founderLiveExecutionBoundarySchema.js");
const envelope = buildFounderLiveExecutionBoundarySchema();
const validation = validateFounderLiveExecutionBoundarySchema(envelope);
const data = envelope.data || {};
const p1042 = subphaseById.get("P104.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1042-founder-live-execution-boundary-schema"]));
addCheck("schema exports exist", source.includes("buildFounderLiveExecutionBoundarySchema") && source.includes("validateFounderLiveExecutionBoundarySchema"));
addCheck("phase constant", P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE === "P104.2");
addCheck("state constant", Object.values(P104_EXECUTION_BOUNDARY_STATES).includes("founder_live_execution_boundary_schema_ready_execution_blocked"));
addCheck("required evidence covers execution gates", P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE.length >= 8 && P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE.includes("operatorApprovalCaptured"));
addCheck("forbidden actions cover live execution", ["agent dispatch", "worker/tool execution", "project source mutation", "provider spend"].every((item) => P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS.includes(item)));
addCheck("blocked flags cover execution authority", ["liveExecutionAllowed", "executionApprovalAllowed", "agentDispatchExecutionAllowed", "providerSpendAllowed"].every((flag) => P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && Boolean(data.boundaryRecordShape) && Boolean(data.laneRecordShape));
addCheck("approval predicates useful", data.approvalPredicateCount >= 5 && data.boundaryRecordShape?.approvalPredicates?.length === data.approvalPredicateCount);
addCheck("execution remains blocked", data.executionAllowed === false && data.dispatchAllowed === false && data.workerExecutionAllowed === false && data.projectMutationAllowed === false && data.hostedDbMutationAllowed === false && data.spendAllowed === false);
addCheck("lane shape remains blocked", data.laneRecordShape?.executionAllowed === false && data.laneRecordShape?.dispatchAllowed === false && data.laneRecordShape?.projectMutationAllowed === false && data.laneRecordShape?.spendAllowed === false);
addCheck("all blocked flags false", P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.boundaryRecordShape?.blockedFlags?.[flag] === false && data.laneRecordShape?.[flag] === false));
addCheck("contract marks P104.2 complete", p1042.status === "complete");
addCheck("P104.3 remains planned", subphaseById.get("P104.3")?.status === "planned");
addCheck("docs record P104.2", /P104\.2 Execution Boundary Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104.2", /P104\.2 is\s+complete/.test(platformRoadmap) && /P104\.3 is\s+next/.test(platformRoadmap));
addCheck("README records P104.2", /P104\.2 execution-boundary schema/.test(readme) && /P104\.3 is next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P104.2"
    && status.previousPhase === "P104.1"
    && status.nextPhase === "P104.3"
    && statusById.get("P104")?.status === "in_progress"
    && statusById.get("P104.2")?.status === "complete"
    && roadmapById.get("P104.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P104.2 avoids forbidden file scope", !(p1042.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("schema avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("schema avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(data)));
addCheck("schema avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(JSON.stringify(data)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P104.2 founder live execution-boundary schema.",
        "- Confirms schema exports, required evidence, approval predicates, forbidden actions, and blocked flags.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1042-founder-live-execution-boundary-schema",
        "- npm run check:p1041-chat-surface-consolidation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.2 is schema-only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.2 Founder Live Execution Boundary Schema Report", phase: "P104.2" },
);

printCheckReport("P104.2 Founder Live Execution Boundary Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
