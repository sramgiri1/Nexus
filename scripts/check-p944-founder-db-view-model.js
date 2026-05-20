import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { businessBuildViewModel, buildFounderRuntimeDbViewModel } from "../dashboard/src/data/businessBuild.js";
import { dbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";
import { founderIntakeViewModel } from "../dashboard/src/data/founderIntake.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p944-founder-db-view-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p944 = contract.subphases?.find((entry) => entry.phaseId === "P94.4");
const founderDbWorkflow = buildFounderRuntimeDbViewModel("Build a simple iOS Snake game for the App Store");
const sources = [
  readText("dashboard/src/data/businessBuild.js"),
  readText("dashboard/src/data/founderIntake.js"),
  readText("dashboard/src/data/dbRuntimeReadiness.js"),
].join("\n");
const serializedData = JSON.stringify({
  founderDbWorkflow,
  businessBuildFounderDbWorkflow: businessBuildViewModel.founderDbWorkflow,
  intakeFounderDbWorkflow: founderIntakeViewModel.founderDbWorkflow,
  dbRuntimeFounderRuntime: dbRuntimeReadinessViewModel.founderRuntime,
});

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p944-founder-db-view-model"]));
addCheck("contract tracks P94.4 complete", p944?.status === "complete" && p944.allowedFiles?.includes("dashboard/src/data/businessBuild.js"));
addCheck("business build exposes founder DB workflow", Boolean(businessBuildViewModel.founderDbWorkflow) && businessBuildViewModel.founderDbWorkflow.lanes.length === 4);
addCheck("founder intake exposes founder DB workflow", founderIntakeViewModel.founderDbWorkflow?.laneCount === 4 && founderIntakeViewModel.founderDbWorkflow.nextQuestion);
addCheck("DB runtime exposes founder workflow", dbRuntimeReadinessViewModel.founderRuntime?.currentState === "DB-backed founder workflow ready for local review" && dbRuntimeReadinessViewModel.summaryRows.some((row) => row.label === "Founder workflow records"));
addCheck("view model has session and PRD state", founderDbWorkflow.savedSessionState && founderDbWorkflow.nextQuestion && founderDbWorkflow.prdReadiness && founderDbWorkflow.prdState);
addCheck("view model has workstream lanes", founderDbWorkflow.lanes.length === 4 && founderDbWorkflow.lanes.some((lane) => lane.label === "Workstream plan"));
addCheck("view model has required operator context", founderDbWorkflow.nextAction && founderDbWorkflow.disabledReason && founderDbWorkflow.ownerCapability && founderDbWorkflow.evidenceLocation && founderDbWorkflow.activityLocation && founderDbWorkflow.costImpact);
addCheck("view model blocks unsafe operations", founderDbWorkflow.safety.providerCallsAllowed === false && founderDbWorkflow.safety.agentDispatchAllowed === false && founderDbWorkflow.safety.projectMutationAllowed === false && founderDbWorkflow.safety.hostedDbWritesAllowed === false && founderDbWorkflow.safety.providerSpendAllowed === false);
addCheck("view model lists local CRUD and forbidden operations", founderDbWorkflow.allowedLocalCrudOperations.includes("Create") && founderDbWorkflow.forbiddenOperations.includes("Hosted DB Mutation"));
addCheck("docs record P94.4", docs.includes("P94.4 is complete") && docs.includes("npm run check:p944-founder-db-view-model"));
addCheck("platform roadmap records P94.4", platformRoadmap.includes("P94.4 is complete") && (platformRoadmap.includes("P94.5 is next") || platformRoadmap.includes("P94.5 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P94.4")?.status === "complete"
    && ["P94.4", "P94.5", "P94.6", "P94.7"].includes(status.currentPhase)
    && ["P94.3", "P94.4", "P94.5", "P94.6"].includes(status.previousPhase)
    && ["P94.5", "P94.6", "P94.7", "P95"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P94.4", roadmapById.get("P94.4")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P94.5")?.status));
addCheck("no DemoApp/private IDs in view data", !/DemoApp|private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|token_|Bearer\s+/i.test(serializedData));
addCheck("no fake runnable actions in view data", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write sqlite now|migrate now/i.test(serializedData));
addCheck("no mutation controls added in data modules", !/onClick|buttonLabel:\s*["'](?:Run|Execute|Deploy|Write|Migrate|Dispatch)|mutationButton|deployButton|dispatchButton/i.test(sources));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(sources));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P94.4 display-safe founder DB workflow view-model data.",
        "- Confirms Business Build, Founder Intake, and DB Runtime can consume saved session, PRD, lane, blocker, owner, evidence, activity, disabled reason, and cost context.",
        "- Confirms no route UI, mutation controls, provider calls, dispatch, project mutation, hosted DB, deploy, package, or spend behavior is added.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p944-founder-db-view-model",
        "- npm run check:p943-founder-runtime-crud-model",
        "- npm run check:p942-founder-runtime-db-schema",
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94.4 is data-only. It does not render new Command Center sections, dispatch agents, execute workers/tools, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.4 Founder DB View Model Report", phase: "P94.4" },
);

printCheckReport("P94.4 Founder DB View Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
