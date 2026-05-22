import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE,
  P103_WORK_ADMISSION_SAFETY_FLAGS,
  P103_WORK_ADMISSION_STATES,
  buildFounderLiveWorkAdmission,
  validateFounderLiveWorkAdmission,
} from "../live-ready/founderLiveWorkAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1032-founder-live-work-admission-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p103-founder-live-work-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P103_FOUNDER_LIVE_WORK_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("live-ready/founderLiveWorkAdmission.js");
const envelope = buildFounderLiveWorkAdmission({
  founderIdea: "Build a simple iOS Snake game for the App Store",
});
const validation = validateFounderLiveWorkAdmission(envelope);
const data = envelope.data || {};
const p1032 = subphaseById.get("P103.2") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1032-founder-live-work-admission-model"]));
addCheck("work admission exports exist", source.includes("buildFounderLiveWorkAdmission") && source.includes("validateFounderLiveWorkAdmission"));
addCheck("phase constant", P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE === "P103.2");
addCheck("work admission states exported", Object.values(P103_WORK_ADMISSION_STATES).includes("founder_live_work_admission_ready_execution_blocked"));
addCheck("safety flags cover admission boundaries", ["agentDispatchAllowed", "projectMutationAllowed", "workAdmissionApprovalAllowed", "agentWorkAdmissionExecutionAllowed"].every((flag) => P103_WORK_ADMISSION_SAFETY_FLAGS.includes(flag)));
addCheck("work admission validates", validation.valid, validation.errors.join("; "));
addCheck("work admission shape", data.schemaVersion === "1.0" && Boolean(data.admissionReadiness) && Boolean(data.approvalBoundary));
addCheck("work admissions useful", data.workAdmissions?.length === 6 && data.admissionReadiness?.admittedWorkCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("approval remains blocked", data.approvalBoundary?.approvalState === "operator_review_required_execution_blocked" && data.admissionReadiness?.approvedWorkCount === 0);
addCheck("execution remains blocked", data.admissionReadiness?.executableWorkCount === 0 && data.admissionReadiness?.dispatchableWorkCount === 0 && data.admissionReadiness?.projectMutationWorkCount === 0 && data.admissionReadiness?.hostedDbMutationWorkCount === 0);
addCheck("rows are non-executable", data.workAdmissions?.every((row) => row.executable === false && row.dispatchable === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("admissions include evidence and validation commands", data.workAdmissions?.every((row) => row.requiredEvidence?.length >= 4 && row.validationCommands?.includes("npm run check:p1032-founder-live-work-admission-model")));
addCheck("all safety flags false", P103_WORK_ADMISSION_SAFETY_FLAGS.every((flag) => data[flag] === false && data.approvalBoundary?.[flag] === false && data.workAdmissions.every((row) => row[flag] === false)));
addCheck("reuses P102 handoff helpers", source.includes("buildFounderLiveHandoffManifest") && source.includes("buildFounderLiveHandoffWorkOrders"));
addCheck("contract marks P103.2 complete", p1032.status === "complete");
addCheck("P103.3 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P103.3")?.status));
addCheck("docs record P103.2", /P103\.2 Work Admission Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.2", /P103\.2 is\s+complete/.test(platformRoadmap) && /P103\.3 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P103.2", "P103.3", "P103.4", "P103.5"].includes(status.currentPhase)
    && ["P103.1", "P103.2", "P103.3", "P103.4"].includes(status.previousPhase)
    && ["P103.3", "P103.4", "P103.5", "P103.6"].includes(status.nextPhase)
    && statusById.get("P103")?.status === "in_progress"
    && statusById.get("P103.2")?.status === "complete"
    && roadmapById.get("P103.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("no unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(data)));
addCheck("P103.2 avoids forbidden file scope", !(p1032.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P103.2 local founder live work admission model.",
        "- Confirms P103.2 reuses P102 handoff/work-order artifacts, exposes display-safe work admission rows, and keeps approval/execution blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1032-founder-live-work-admission-model",
        "- npm run check:p1031-founder-live-work-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.2 is a local work admission model only. It does not approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.2 Founder Live Work Admission Model Report", phase: "P103.2" },
);

printCheckReport("P103.2 Founder Live Work Admission Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
