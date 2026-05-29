import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalCaptureBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1186-founder-runtime-approval-capture-boundary-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|docs-only|read-only|dry-run)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1186 = subphaseById.get("P118.6") || {};
const p1187 = subphaseById.get("P118.7") || {};
const plan = readText("docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1185Checker = readText("scripts/check-p1185-founder-runtime-approval-capture-boundary.js");
const displayModel = buildFounderApprovalCaptureBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel, null, 2);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P118.6";
const allowedFiles = new Set(p1186.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];

const requiredScripts = [
  "check:p1181-founder-runtime-approval-capture-boundary-contract",
  "check:p1182-founder-runtime-approval-capture-boundary",
  "check:p1183-founder-runtime-approval-capture-boundary",
  "check:p1184-founder-runtime-approval-capture-boundary",
  "check:p1185-founder-runtime-approval-capture-boundary",
  "check:p1186-founder-runtime-approval-capture-boundary",
];

const requiredReports = [
  "reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md",
  "reports/p1182-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1183-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1184-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1185-founder-runtime-approval-capture-boundary-report.md",
];

const validationCommands = [
  "npm run check:p1186-founder-runtime-approval-capture-boundary",
  "npm run check:p1185-founder-runtime-approval-capture-boundary",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Approval capture boundary appears only on scoped pages\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource, serializedDisplayModel].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P118.1-P118.5 are complete", ["P118.1", "P118.2", "P118.3", "P118.4", "P118.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P118.6 contract is complete", p1186.status === "complete" && ["planned", "complete"].includes(p1187.status));
addCheck("P118.6 records validation commands", validationCommands.every((command) => p1186.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS|PASS \(/.test(readText(report))));
addCheck("P118.5 checker accepts P118.6 handoff", p1185Checker.includes("P118.6") && p1185Checker.includes("P118.7") && p1185Checker.includes("scope check relaxed"));
addCheck("P118.5 Command Center UX preserved", pageSource.includes("FounderApprovalCaptureBoundaryCard") && pageSource.includes("Business Build Runtime Approval Capture Boundary") && pageSource.includes("Agent Flow Runtime Approval Capture Boundary") && !pageSource.includes("Lite Runtime Approval Capture Boundary") && !pageSource.includes("Chat Runtime Approval Capture Boundary") && !pageSource.includes("Live Readiness Runtime Approval Capture Boundary"));
addCheck("P118.5 display model preserved", businessBuildSource.includes("buildFounderApprovalCaptureBoundaryDisplayModel") && businessBuildSource.includes("readinessRows") && businessBuildSource.includes("Approval capture safe dry-run report"));
addCheck("P118.5 Playwright coverage preserved", routeTests.includes("Approval capture boundary appears only on scoped pages") && routeTests.includes("Founder runtime approval capture boundary") && routeTests.includes("Build a simple iOS Snake game for the App Store"));
addCheck("P118.5 display model remains blocked", displayModel.blockedReadinessRowCount === 3 && displayModel.capturableCandidateCount === 0 && displayModel.persistableCandidateCount === 0 && displayModel.decisionRecordableCandidateCount === 0 && displayModel.runtimeExecutableCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck(
  "P118 plan records all completed subphases",
  [
    /P118\.1 Approval Capture Contract \/ Policy[\s\S]*Status:\s+complete/,
    /P118\.2 Approval Capture Schema Metadata[\s\S]*Status:\s+complete/,
    /P118\.3 Governed Local Approval Intent Model[\s\S]*Status:\s+complete/,
    /P118\.4 Approval Capture Safe Dry Run[\s\S]*Status:\s+complete/,
    /P118\.5 Command Center Approval Capture Boundary UX[\s\S]*Status:\s+complete/,
    /P118\.6 Approval Capture Validation \/ Docs[\s\S]*Status:\s+complete/,
  ].every((pattern) => pattern.test(plan)),
);
addCheck("README records P118.6", /P118\.6 approval capture validation/i.test(readme) && (/P118\.7 is next/.test(readme) || /P118\.7 final validation/i.test(readme)));
addCheck("platform roadmap records P118.6", /P118\.6 is complete/.test(platformRoadmap) && (/P118\.7 is next/.test(platformRoadmap) || /P118\.7 is complete/.test(platformRoadmap)));

const p1186HandoffState =
  status.currentPhase === "P118.6"
    && status.previousPhase === "P118.5"
    && status.nextPhase === "P118.7"
    && roadmap.currentPhase === "P118.6"
    && roadmap.previousPhase === "P118.5"
    && roadmap.nextPhase === "P118.7"
    && statusById.get("P118")?.status === "in_progress"
    && statusById.get("P118.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P118.7")?.status)
    && roadmapById.get("P118")?.status === "in_progress"
    && roadmapById.get("P118.6")?.status === "complete";
const p1187HandoffState =
  status.currentPhase === "P118.7"
    && status.previousPhase === "P118.6"
    && status.nextPhase === "P119"
    && roadmap.currentPhase === "P118.7"
    && roadmap.previousPhase === "P118.6"
    && roadmap.nextPhase === "P119"
    && statusById.get("P118")?.status === "complete"
    && statusById.get("P118.6")?.status === "complete"
    && statusById.get("P118.7")?.status === "complete"
    && roadmapById.get("P118")?.status === "complete"
    && roadmapById.get("P118.6")?.status === "complete"
    && roadmapById.get("P118.7")?.status === "complete";

addCheck("phase status advanced", p1186HandoffState || p1187HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P118.6" && contract.previousSubphase === "P118.5" && contract.nextSubphase === "P118.7") || (contract.currentSubphase === "P118.7" && contract.previousSubphase === "P118.6" && contract.nextSubphase === "P119"));
addCheck(
  "changed files stay in P118.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P118.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P118.6 contract avoids forbidden file scope", !(p1186.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw schema names and record refs", !/(founderApprovalCapture|approval_capture_|captureRequestRef|captureEventRef|captureEvidenceRef|approvalCaptureRecordKey|capturePreviewKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_capture|approval_capture_requests|approval_capture_events|approval_capture_evidence_refs|founderApprovalCaptureRequests|founderApprovalCaptureEvents|founderApprovalCaptureEvidenceRefs)/.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(uxSourceText));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(uxSourceText) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${uxSourceText}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P118.1-P118.5 together before final validation.",
        "- Confirms approval capture contracts, schema metadata, intent model, safe dry-run preview, and scoped Command Center UX evidence remain aligned.",
        "- Confirms approval capture, approval persistence, approve/reject decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P118.6 is aggregate validation and docs closure only. It does not capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P118.6 Founder Runtime Approval Capture Boundary Validation Report", phase: "P118.6" },
);

printCheckReport("P118.6 Founder Runtime Approval Capture Boundary Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
