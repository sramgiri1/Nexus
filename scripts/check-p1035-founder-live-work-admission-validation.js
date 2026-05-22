import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildFounderLiveWorkAdmission, validateFounderLiveWorkAdmission } from "../live-ready/founderLiveWorkAdmission.js";
import {
  buildFounderLiveWorkAdmissionApprovalEnvelope,
  validateFounderLiveWorkAdmissionApprovalEnvelope,
} from "../live-ready/founderLiveWorkAdmissionApprovalEnvelope.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1035-founder-live-work-admission-validation-report.md";

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
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const plan = readText("docs/architecture/P103_FOUNDER_LIVE_WORK_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const requiredReports = [
  "reports/p1031-founder-live-work-admission-contract-report.md",
  "reports/p1032-founder-live-work-admission-model-report.md",
  "reports/p1033-founder-live-work-admission-approval-envelope-report.md",
  "reports/p1034-command-center-founder-live-work-admission-ux-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
];
const admissionEnvelope = buildFounderLiveWorkAdmission({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const approvalEnvelope = buildFounderLiveWorkAdmissionApprovalEnvelope({ workAdmissionEnvelope: admissionEnvelope });
const admissionValidation = validateFounderLiveWorkAdmission(admissionEnvelope);
const approvalValidation = validateFounderLiveWorkAdmissionApprovalEnvelope(approvalEnvelope);
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const uiAdmission = viewModel.founderLiveWorkAdmission || {};
const uiApproval = viewModel.founderLiveWorkAdmissionApproval || {};
const p1035 = subphaseById.get("P103.5") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1035-founder-live-work-admission-validation"]));
addCheck("P103.1-P103.4 complete", ["P103.1", "P103.2", "P103.3", "P103.4"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P103.5 contract complete", p1035.status === "complete");
addCheck("required reports exist", requiredReports.every((report) => existsSync(join(ROOT, report))));
addCheck("work admission model still validates", admissionValidation.valid, admissionValidation.errors.join("; "));
addCheck("approval envelope still validates", approvalValidation.valid, approvalValidation.errors.join("; "));
addCheck("Command Center view model populated", uiAdmission.workAdmissions?.length === 6 && uiApproval.approvalGates?.length === 6);
addCheck("Command Center approval/execution blocked", uiApproval.approvedGateCount === 0 && uiAdmission.executableWorkCount === 0 && uiAdmission.dispatchableWorkCount === 0);
addCheck("Command Center card wired", pageSource.includes("FounderLiveWorkAdmissionCard") && pageSource.includes("Founder live work admission"));
addCheck("focused Playwright coverage retained", routeTests.includes("Founder live work admission appears across founder routes"));
addCheck("route safety coverage retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("docs record P103.5", /P103\.5 Tests \/ Checkers \/ Aggregate Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.5", /P103\.5 is\s+complete/.test(platformRoadmap) && /P103\.6 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P103.5"
    && status.previousPhase === "P103.4"
    && status.nextPhase === "P103.6"
    && statusById.get("P103")?.status === "in_progress"
    && statusById.get("P103.5")?.status === "complete"
    && roadmapById.get("P103.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs in P103 UX state", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify({ uiAdmission, uiApproval })));
addCheck("no unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + JSON.stringify({ uiAdmission, uiApproval })));
addCheck("P103.5 avoids forbidden file scope", !(p1035.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P103.1-P103.4 contract, model, approval envelope, Command Center UX, Playwright coverage, build evidence, OS status, and safety checks.",
        "- Confirms founder live work admission is display-safe and approval/execution remain blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1035-founder-live-work-admission-validation",
        "- npm run check:p1034-command-center-founder-live-work-admission-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live work admission|full Command Center routes do not show DemoApp\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.5 is aggregate validation only. It does not approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.5 Founder Live Work Admission Validation Report", phase: "P103.5" },
);

printCheckReport("P103.5 Founder Live Work Admission Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
