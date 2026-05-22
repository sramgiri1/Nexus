import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE,
  P103_WORK_ADMISSION_APPROVAL_STATES,
  buildFounderLiveWorkAdmissionApprovalEnvelope,
  validateFounderLiveWorkAdmissionApprovalEnvelope,
} from "../live-ready/founderLiveWorkAdmissionApprovalEnvelope.js";
import { P103_WORK_ADMISSION_SAFETY_FLAGS } from "../live-ready/founderLiveWorkAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1033-founder-live-work-admission-approval-envelope-report.md";

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
const source = readText("live-ready/founderLiveWorkAdmissionApprovalEnvelope.js");
const envelope = buildFounderLiveWorkAdmissionApprovalEnvelope({
  founderIdea: "Build a simple iOS Snake game for the App Store",
});
const validation = validateFounderLiveWorkAdmissionApprovalEnvelope(envelope);
const data = envelope.data || {};
const p1033 = subphaseById.get("P103.3") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1033-founder-live-work-admission-approval-envelope"]));
addCheck("approval envelope exports exist", source.includes("buildFounderLiveWorkAdmissionApprovalEnvelope") && source.includes("validateFounderLiveWorkAdmissionApprovalEnvelope"));
addCheck("phase constant", P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE === "P103.3");
addCheck("approval states exported", Object.values(P103_WORK_ADMISSION_APPROVAL_STATES).includes("founder_live_work_admission_evidence_ready_approval_blocked"));
addCheck("approval envelope validates", validation.valid, validation.errors.join("; "));
addCheck("approval envelope shape", data.schemaVersion === "1.0" && Boolean(data.approvalReadiness) && Array.isArray(data.approvalGates));
addCheck("approval gates useful", data.approvalGates?.length === 6 && data.approvalReadiness?.approvalGateCount === 6);
addCheck("approval remains blocked", data.approvalReadiness?.approvedGateCount === 0 && data.approvalGates?.every((gate) => gate.approvalAllowed === false));
addCheck("execution remains blocked", data.approvalReadiness?.executableGateCount === 0 && data.approvalReadiness?.dispatchableGateCount === 0 && data.approvalReadiness?.projectMutationGateCount === 0 && data.approvalReadiness?.hostedDbMutationGateCount === 0);
addCheck("gates include review questions", data.approvalGates?.every((gate) => gate.reviewQuestions?.length >= 3 && gate.missingEvidence?.length >= 4));
addCheck("all safety flags false", P103_WORK_ADMISSION_SAFETY_FLAGS.every((flag) => data[flag] === false && data.approvalGates.every((gate) => gate[flag] === false)));
addCheck("reuses P103.2 model", source.includes("buildFounderLiveWorkAdmission"));
addCheck("contract marks P103.3 complete", p1033.status === "complete");
addCheck("P103.4 remains planned", subphaseById.get("P103.4")?.status === "planned");
addCheck("docs record P103.3", /P103\.3 Approval Evidence Envelope[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.3", /P103\.3 is\s+complete/.test(platformRoadmap) && /P103\.4 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P103.3"
    && status.previousPhase === "P103.2"
    && status.nextPhase === "P103.4"
    && statusById.get("P103")?.status === "in_progress"
    && statusById.get("P103.3")?.status === "complete"
    && roadmapById.get("P103.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("no unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|approve now/i.test(JSON.stringify(data)));
addCheck("P103.3 avoids forbidden file scope", !(p1033.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P103.3 local founder live work admission approval evidence envelope.",
        "- Confirms P103.3 reuses P103.2 work admission rows, exposes display-safe approval gates, and keeps approval/execution blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1033-founder-live-work-admission-approval-envelope",
        "- npm run check:p1032-founder-live-work-admission-model",
        "- npm run check:p1031-founder-live-work-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.3 is a local approval evidence envelope only. It does not approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.3 Founder Live Work Admission Approval Envelope Report", phase: "P103.3" },
);

printCheckReport("P103.3 Founder Live Work Admission Approval Envelope Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
