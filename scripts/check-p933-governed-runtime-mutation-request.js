import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { P93_LIVE_RUNTIME_ENTITY_LANES } from "../live-ready/enterpriseLiveRuntimeCrudPlan.js";
import {
  buildGovernedRuntimeMutationRequest,
  validateGovernedRuntimeMutationRequest,
} from "../live-ready/governedRuntimeMutationRequest.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p933-governed-runtime-mutation-request-report.md";

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
const source = readText("live-ready/governedRuntimeMutationRequest.js");
const unsafeImportPattern = new RegExp("from\\\\s+[\"'][^\"']*(projects|careloop|generated-projects|providers|tools|worker-runtime|deploy|release|exports|packages|db|prisma|migrations)/");

const envelope = buildGovernedRuntimeMutationRequest();
const validation = validateGovernedRuntimeMutationRequest(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);
const requestLanes = new Set((data.mutationRequests || []).map((request) => request.lane));

addCheck("result envelope valid", envelope.status === "PASS" && envelope.phase === "P93.3");
addCheck("mutation request validation passes", validation.valid, validation.errors.join("; "));
addCheck("requests cover runtime lanes", data.mutationRequests?.length === P93_LIVE_RUNTIME_ENTITY_LANES.length && P93_LIVE_RUNTIME_ENTITY_LANES.every((lane) => requestLanes.has(lane.lane)));
addCheck("requests map to SQLite entities", data.mutationRequests?.every((request) => Boolean(request.sqliteEntity) && request.payloadShape?.sqliteEntity === request.sqliteEntity));
addCheck("payloads are field summaries only", data.mutationRequests?.every((request) => request.payloadShape?.shapeMode === "field-summary-only" && Array.isArray(request.payloadShape?.fields)));
addCheck("operator approval and audit required", data.mutationRequests?.every((request) => request.operatorApprovalRequired === true && request.rollbackRequired === true && request.auditRequired === true && request.validationRequired === true));
addCheck("request states are review-only", data.requestMode === "local-sqlite-mutation-request-review-only" && data.mutationRequests?.every((request) => ["ready_for_operator_review_not_executable", "blocked_missing_review_evidence"].includes(request.requestState)));
addCheck("SQLite writes remain blocked", data.dbWritesAllowed === false && data.sqliteWriteAllowed === false && data.mutationRequests?.every((request) => request.dbWritesAllowed === false && request.sqliteWriteAllowed === false && request.requestCanExecute === false));
addCheck("unsafe runtime flags blocked", data.providerCallsAllowed === false && data.agentDispatchAllowed === false && data.workerExecutionAllowed === false && data.projectMutationAllowed === false && data.networkCallsAllowed === false && data.providerSpendAllowed === false);
addCheck("local operations are request-only", data.allowedLocalOperations?.every((item) => /prepare|review/i.test(item)));
addCheck("no unsafe imports", !unsafeImportPattern.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p933-governed-runtime-mutation-request"]));
addCheck("contract tracks P93.3 files", contract.includes("P93.3") && contract.includes("live-ready/governedRuntimeMutationRequest.js") && contract.includes("check:p933-governed-runtime-mutation-request"));
addCheck("docs record P93.3", docs.includes("P93.3 is complete") && docs.includes("npm run check:p933-governed-runtime-mutation-request"));
addCheck("platform roadmap records P93.3", platformRoadmap.includes("P93.3 is complete") && (platformRoadmap.includes("P93.4 is next") || platformRoadmap.includes("P93.4 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P93")?.status === "in_progress"
    && statusById.get("P93.3")?.status === "complete"
    && ["P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].includes(status.currentPhase)
    && ["P93.2", "P93.3", "P93.4", "P93.5", "P93.6"].includes(status.previousPhase)
    && ["P93.4", "P93.5", "P93.6", "P93.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.3", roadmapById.get("P93.3")?.track === "NEXUS_OS" && roadmapById.get("P93.3")?.status === "complete");
addCheck("P93.4 handoff exists", ["planned", "complete"].includes(statusById.get("P93.4")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.4")?.status));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized + source));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|write sqlite now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P93.3 governed runtime mutation request model.",
        "- Confirms each enterprise live-runtime lane has a local SQLite request envelope with field-summary payload shape only.",
        "- Confirms P93.3 does not execute SQLite writes or enable providers, agents, tools, workers, project mutation, hosted DBs, network calls, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p933-governed-runtime-mutation-request",
        "- npm run check:p932-enterprise-runtime-crud-plan",
        "- npm run check:p931-enterprise-live-runtime-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.3 creates governed mutation request envelopes only. It does not modify `db/**`, write SQLite records, run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.3 Governed Runtime Mutation Request Report", phase: "P93.3" },
);

printCheckReport("P93.3 Governed Runtime Mutation Request Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
