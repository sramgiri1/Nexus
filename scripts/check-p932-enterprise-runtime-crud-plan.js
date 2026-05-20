import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P93_LIVE_RUNTIME_ENTITY_LANES,
  buildEnterpriseLiveRuntimeCrudPlan,
  validateEnterpriseLiveRuntimeCrudPlan,
} from "../live-ready/enterpriseLiveRuntimeCrudPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p932-enterprise-runtime-crud-plan-report.md";

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
const contract = readText("contracts/os-roadmap/p93-execution-contracts.json");
const docs = readText("docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("live-ready/enterpriseLiveRuntimeCrudPlan.js");
const unsafeImportPattern = new RegExp("from\\\\s+[\"'][^\"']*(projects|careloop|generated-projects|providers|tools|worker-runtime|deploy|release|exports|packages|db)/");

const plan = buildEnterpriseLiveRuntimeCrudPlan();
const validation = validateEnterpriseLiveRuntimeCrudPlan(plan);
const data = plan.data || {};
const serialized = JSON.stringify(data);

addCheck("result envelope valid", plan.status === "PASS" && plan.phase === "P93.2");
addCheck("CRUD plan validation passes", validation.valid, validation.errors.join("; "));
addCheck("runtime lanes exported", P93_LIVE_RUNTIME_ENTITY_LANES.length === 8 && P93_LIVE_RUNTIME_ENTITY_LANES.some((lane) => lane.lane === "prdArtifact"));
addCheck("entity lanes complete", Array.isArray(data.entityLanes) && data.entityLanes.length === P93_LIVE_RUNTIME_ENTITY_LANES.length);
addCheck("entity lanes map to SQLite entities", data.entityLanes?.every((lane) => Boolean(lane.sqliteEntity) && Array.isArray(lane.crudOperationsPlanned)));
addCheck("CRUD readiness present", data.crudReadiness?.totalLaneCount === P93_LIVE_RUNTIME_ENTITY_LANES.length);
addCheck("local operations are planning-only", data.allowedLocalCrudOperations?.every((item) => /plan|review|prepare/i.test(item)));
addCheck("writes and mutation requests remain blocked", data.dbWritesAllowed === false && data.entityLanes?.every((lane) => lane.currentCreateAllowed === false && lane.currentUpdateAllowed === false && lane.currentDeleteAllowed === false && lane.mutationRequestAllowed === false));
addCheck("unsafe runtime flags blocked", data.providerCallsAllowed === false && data.agentDispatchAllowed === false && data.workerExecutionAllowed === false && data.projectMutationAllowed === false && data.providerSpendAllowed === false);
addCheck("no unsafe imports", !unsafeImportPattern.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p932-enterprise-runtime-crud-plan"]));
addCheck("contract tracks P93.2 files", contract.includes("P93.2") && contract.includes("live-ready/enterpriseLiveRuntimeCrudPlan.js") && contract.includes("check:p932-enterprise-runtime-crud-plan"));
addCheck("docs record P93.2", docs.includes("P93.2 is complete") && docs.includes("npm run check:p932-enterprise-runtime-crud-plan"));
addCheck("platform roadmap records P93.2", platformRoadmap.includes("P93.2 is complete") && (platformRoadmap.includes("P93.3 is next") || platformRoadmap.includes("P93.3 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P93")?.status === "in_progress"
    && statusById.get("P93.2")?.status === "complete"
    && ["P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].includes(status.currentPhase)
    && ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6"].includes(status.previousPhase)
    && ["P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.2", roadmapById.get("P93.2")?.track === "NEXUS_OS" && roadmapById.get("P93.2")?.status === "complete");
addCheck("P93.3 handoff exists", ["planned", "complete"].includes(statusById.get("P93.3")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.3")?.status));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized + source));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P93.2 local enterprise live-runtime CRUD plan model.",
        "- Confirms founder/session/PRD/workstream/action-state lanes are mapped to local SQLite entity targets.",
        "- Confirms P93.2 does not execute mutations or enable DB writes, provider calls, dispatch, project mutation, deploy, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p932-enterprise-runtime-crud-plan",
        "- npm run check:p931-enterprise-live-runtime-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.2 is a local model only. It does not modify db/**, write SQLite records, run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.2 Enterprise Runtime CRUD Plan Report", phase: "P93.2" },
);

printCheckReport("P93.2 Enterprise Runtime CRUD Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
