import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE,
  buildFounderBusinessBuildDryRunAdmission,
  validateFounderBusinessBuildDryRunAdmission,
} from "../live-ready/founderBusinessBuildExecutionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p963-founder-business-build-dry-run-admission-report.md";

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
const contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p96-execution-contracts.json");
const moduleSource = readText("live-ready/founderBusinessBuildExecutionReadiness.js");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p963 = contract.subphases?.find((entry) => entry.phaseId === "P96.3");
const p964 = contract.subphases?.find((entry) => entry.phaseId === "P96.4");
const blockedAdmission = buildFounderBusinessBuildDryRunAdmission();
const readyAdmission = buildFounderBusinessBuildDryRunAdmission({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderBusinessBuildDryRunAdmission(blockedAdmission);
const readyValidation = validateFounderBusinessBuildDryRunAdmission(readyAdmission);

const unsafeRuntimeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
];

function allFlagsBlocked(envelope) {
  return unsafeRuntimeFlags.every((flag) => (
    envelope.data?.[flag] === false
    && envelope.data?.runtimeFlags?.[flag] === false
    && envelope.data?.lanes?.every((lane) => lane[flag] === false)
  ));
}

const serialized = JSON.stringify([blockedAdmission.data, readyAdmission.data]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p963-founder-business-build-dry-run-admission"]));
addCheck("phase export is P96.3", P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE === "P96.3");
addCheck("blocked dry-run admission validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready dry-run admission validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("readiness model reused", moduleSource.includes("buildFounderBusinessBuildPersistenceSnapshot(input)") && moduleSource.includes("buildDryRunAdmissionLane"));
addCheck("blocked admission requires evidence", blockedAdmission.data.currentState === "dry_run_admission_blocked_until_local_evidence" && blockedAdmission.data.futureReviewEligibleCount === 0 && blockedAdmission.data.lanes.every((lane) => lane.futureReviewEligible === false));
addCheck("ready admission remains execution blocked", readyAdmission.data.currentState === "dry_run_admission_preview_ready_execution_blocked" && readyAdmission.data.futureReviewEligibleCount === 4 && readyAdmission.data.admittedForExecutionCount === 0);
addCheck("lanes cover founder workflow entities", readyAdmission.data.laneCount === 4 && readyAdmission.data.lanes.length === 4);
addCheck("lane matrix is display-safe", readyAdmission.data.lanes.every((lane) => lane.allowedLocalInspection === true && lane.admissionPreviewAllowed === true && lane.executionAllowed === false && lane.dispatchAllowed === false && lane.projectMutationAllowed === false));
addCheck("validation commands attached to each lane", readyAdmission.data.lanes.every((lane) => lane.validationCommands?.includes("npm run check:p963-founder-business-build-dry-run-admission") && lane.validationCommands?.includes("npm run check:p962-founder-business-build-readiness-model")));
addCheck("unsafe runtime flags remain false", allFlagsBlocked(blockedAdmission) && allFlagsBlocked(readyAdmission));
addCheck("contract marks P96.3 complete", p963?.status === "complete" && ["planned", "complete"].includes(p964?.status));
addCheck("contract expected export retained", contractText.includes("buildFounderBusinessBuildDryRunAdmission"));
addCheck("docs record P96.3", docs.includes("P96.3 is complete") && docs.includes("npm run check:p963-founder-business-build-dry-run-admission") && !docs.includes("check:p963-founder-business-build-local-api"));
addCheck("platform roadmap records P96.3", platformRoadmap.includes("P96.3 is complete") && (platformRoadmap.includes("P96.4 is next") || platformRoadmap.includes("P96.4 is planned")));
addCheck(
  "phase status advanced",
  statusById.get("P96")?.status === "in_progress"
    && statusById.get("P96.3")?.status === "complete"
    && status.currentPhase === "P96.3"
    && status.previousPhase === "P96.2"
    && status.nextPhase === "P96.4",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.3", roadmapById.get("P96.3")?.track === "NEXUS_OS" && roadmapById.get("P96.3")?.status === "complete");
addCheck("P96.4 handoff exists", ["planned", "complete"].includes(statusById.get("P96.4")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.4")?.status));
addCheck("dry-run admission does not expose raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("dry-run admission does not invent unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("P96.3 avoids forbidden file scope", !p963.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.3 founder Business Build dry-run admission matrix.",
        "- Confirms P96.3 reuses the P96.2 local readiness model.",
        "- Confirms admission preview remains display-safe and does not dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Admission Count", body: `- ${readyAdmission.data.laneCount || 0} local dry-run admission lanes` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p963-founder-business-build-dry-run-admission",
        "- npm run check:p962-founder-business-build-readiness-model",
        "- npm run check:p961-founder-business-build-readiness-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96.3 is dry-run admission only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.3 Founder Business Build Dry-Run Admission Report", phase: "P96.3" },
);

printCheckReport("P96.3 Founder Business Build Dry-Run Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
