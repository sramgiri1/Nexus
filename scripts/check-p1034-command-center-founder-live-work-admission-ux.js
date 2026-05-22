import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1034-command-center-founder-live-work-admission-ux-report.md";

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
const plan = readText("docs/architecture/P103_FOUNDER_LIVE_WORK_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const admission = viewModel.founderLiveWorkAdmission || {};
const approval = viewModel.founderLiveWorkAdmissionApproval || {};
const p1034 = subphaseById.get("P103.4") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1034-command-center-founder-live-work-admission-ux"]));
addCheck("dashboard data exposes admission models", dataSource.includes("buildFounderLiveWorkAdmissionDisplayModels") && dataSource.includes("founderLiveWorkAdmissionApproval"));
addCheck("Command Center card exists", pageSource.includes("FounderLiveWorkAdmissionCard") && pageSource.includes('aria-label="Founder live work admission"'));
addCheck("card rendered in founder routes", ["Lite Founder Work Admission", "Business Build Founder Work Admission", "Agent Flow Founder Work Admission", "Live Readiness Founder Work Admission"].every((label) => pageSource.includes(label)));
addCheck("view model has useful admission rows", admission.workAdmissions?.length === 6 && admission.admittedWorkCount === 6);
addCheck("view model has useful approval gates", approval.approvalGates?.length === 6 && approval.approvalGateCount === 6);
addCheck("approval and execution blocked", approval.approvedGateCount === 0 && admission.executableWorkCount === 0 && admission.dispatchableWorkCount === 0 && admission.projectMutationWorkCount === 0);
addCheck("evidence and validation visible", approval.evidenceLocation === "reports/p1033-founder-live-work-admission-approval-envelope-report.md" && admission.workAdmissions?.every((row) => row.validationCommand === "npm run check:p1032-founder-live-work-admission-model"));
addCheck("focused Playwright coverage retained", routeTests.includes("Founder live work admission appears across founder routes"));
addCheck("route-wide safety assertions retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("contract marks P103.4 complete", p1034.status === "complete");
addCheck("P103.5 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P103.5")?.status));
addCheck("docs record P103.4", /P103\.4 Command Center Work Admission UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.4", /P103\.4 is\s+complete/.test(platformRoadmap) && /P103\.5 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P103.4", "P103.5", "P103.6", "P103.7"].includes(status.currentPhase)
    && ["P103.3", "P103.4", "P103.5", "P103.6"].includes(status.previousPhase)
    && ["P103.5", "P103.6", "P103.7", "P104"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P103")?.status)
    && statusById.get("P103.4")?.status === "complete"
    && roadmapById.get("P103.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify({ admission, approval })));
addCheck("primary UX avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + JSON.stringify({ admission, approval })));
addCheck("P103.4 avoids forbidden file scope", !(p1034.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P103.4 Command Center founder live work admission UX wiring.",
        "- Confirms Lite, Business Build, Agent Flow, and Live Readiness render display-safe work admission state, approval gates, evidence, validation, blockers, and cost without runnable controls.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1034-command-center-founder-live-work-admission-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live work admission|full Command Center routes do not show DemoApp\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1033-founder-live-work-admission-approval-envelope",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.4 is Command Center UX only. It does not approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.4 Command Center Founder Live Work Admission UX Report", phase: "P103.4" },
);

printCheckReport("P103.4 Command Center Founder Live Work Admission UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
