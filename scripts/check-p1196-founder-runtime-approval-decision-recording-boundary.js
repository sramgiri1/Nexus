import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1196-founder-runtime-approval-decision-recording-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1196 = subphaseById.get("P119.6") || {};
const p1197 = subphaseById.get("P119.7") || {};
const plan = readText("docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1195Checker = readText("scripts/check-p1195-founder-runtime-approval-decision-recording-boundary.js");
const displayModel = buildFounderApprovalDecisionBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel, null, 2);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P119.6";
const allowedFiles = new Set(p1196.allowedFiles || []);
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
  "check:p1191-founder-runtime-approval-decision-recording-boundary-contract",
  "check:p1192-founder-runtime-approval-decision-recording-boundary",
  "check:p1193-founder-runtime-approval-decision-recording-boundary",
  "check:p1194-founder-runtime-approval-decision-recording-boundary",
  "check:p1195-founder-runtime-approval-decision-recording-boundary",
  "check:p1196-founder-runtime-approval-decision-recording-boundary",
];

const requiredReports = [
  "reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md",
  "reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1193-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1194-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1195-founder-runtime-approval-decision-recording-boundary-report.md",
];

const validationCommands = [
  "npm run check:p1196-founder-runtime-approval-decision-recording-boundary",
  "npm run check:p1195-founder-runtime-approval-decision-recording-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource, serializedDisplayModel].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P119.1-P119.5 are complete", ["P119.1", "P119.2", "P119.3", "P119.4", "P119.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P119.6 contract is complete", p1196.status === "complete" && ["planned", "complete"].includes(p1197.status));
addCheck("P119.6 records validation commands", validationCommands.every((command) => p1196.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS|PASS \(/.test(readText(report))));
addCheck("P119.5 checker accepts P119.6 handoff", p1195Checker.includes("P119.6") && p1195Checker.includes("P119.7") && p1195Checker.includes("scope check relaxed"));
addCheck("P119.5 Command Center UX preserved", pageSource.includes("FounderApprovalDecisionBoundaryCard") && pageSource.includes("Business Build Runtime Approval Decision Boundary") && pageSource.includes("Agent Flow Runtime Approval Decision Boundary") && !pageSource.includes("Lite Runtime Approval Decision Boundary") && !pageSource.includes("Chat Runtime Approval Decision Boundary") && !pageSource.includes("Live Readiness Runtime Approval Decision Boundary"));
addCheck("P119.5 display model preserved", businessBuildSource.includes("buildFounderApprovalDecisionBoundaryDisplayModel") && businessBuildSource.includes("readinessRows") && businessBuildSource.includes("Approval decision safe dry-run report"));
addCheck("P119.5 Playwright coverage preserved", routeTests.includes("Approval decision boundary appears only on scoped pages") && routeTests.includes("Founder runtime approval decision boundary") && routeTests.includes("Build a simple iOS Snake game for the App Store"));
addCheck(
  "P119.5 display model remains blocked",
  displayModel.blockedReadinessRowCount === 3
    && displayModel.decisionReviewCandidateCount === 0
    && displayModel.approvableCandidateCount === 0
    && displayModel.rejectableCandidateCount === 0
    && displayModel.persistableCandidateCount === 0
    && displayModel.decisionRecordableCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck(
  "P119 plan records all completed subphases",
  [
    /P119\.1 Approval Decision Recording Contract \/ Policy[\s\S]*Status:\s+complete/,
    /P119\.2 Approval Decision Schema Metadata[\s\S]*Status:\s+complete/,
    /P119\.3 Governed Local Approval Decision Intent Model[\s\S]*Status:\s+complete/,
    /P119\.4 Approval Decision Safe Dry Run[\s\S]*Status:\s+complete/,
    /P119\.5 Command Center Approval Decision Boundary UX[\s\S]*Status:\s+complete/,
    /P119\.6 Approval Decision Validation \/ Docs[\s\S]*Status:\s+complete/,
  ].every((pattern) => pattern.test(plan)),
);
addCheck("README records P119.6", /P119\.6 approval decision validation/i.test(readme) && (/P119\.7 is next/.test(readme) || /P119\.7 final validation/i.test(readme)));
addCheck("platform roadmap records P119.6", /P119\.6 is complete/.test(platformRoadmap) && (/P119\.7 is next/.test(platformRoadmap) || /P119\.7 is complete/.test(platformRoadmap)));

const p1196HandoffState =
  status.currentPhase === "P119.6"
    && status.previousPhase === "P119.5"
    && status.nextPhase === "P119.7"
    && roadmap.currentPhase === "P119.6"
    && roadmap.previousPhase === "P119.5"
    && roadmap.nextPhase === "P119.7"
    && statusById.get("P119")?.status === "in_progress"
    && statusById.get("P119.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P119.7")?.status)
    && roadmapById.get("P119")?.status === "in_progress"
    && roadmapById.get("P119.6")?.status === "complete";
const p1197HandoffState =
  status.currentPhase === "P119.7"
    && status.previousPhase === "P119.6"
    && roadmap.currentPhase === "P119.7"
    && roadmap.previousPhase === "P119.6"
    && statusById.get("P119")?.status === "complete"
    && statusById.get("P119.6")?.status === "complete"
    && statusById.get("P119.7")?.status === "complete"
    && roadmapById.get("P119")?.status === "complete"
    && roadmapById.get("P119.6")?.status === "complete"
    && roadmapById.get("P119.7")?.status === "complete";

addCheck("phase status advanced", p1196HandoffState || p1197HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P119.6" && contract.previousSubphase === "P119.5" && contract.nextSubphase === "P119.7") || (contract.currentSubphase === "P119.7" && contract.previousSubphase === "P119.6"));
addCheck(
  "changed files stay in P119.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P119.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P119.6 contract avoids forbidden file scope", !(p1196.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw schema names and record refs", !/(founderApprovalDecision|approval_decision_|decisionRequestRef|decisionEventRef|decisionEvidenceRef|approvalDecisionRecordKey|decisionPreviewKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision|approval_decision_requests|approval_decision_events|approval_decision_evidence_refs|founderApprovalDecisionRequests|founderApprovalDecisionEvents|founderApprovalDecisionEvidenceRefs)/.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(uxSourceText));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
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
        "- Validates P119.1-P119.5 together before final validation.",
        "- Confirms approval decision contracts, schema metadata, intent model, safe dry-run preview, and scoped Command Center UX evidence remain aligned.",
        "- Confirms approval capture, approval persistence, approve/reject decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P119.6 is aggregate validation and docs closure only. It does not capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P119.6 Founder Runtime Approval Decision Recording Boundary Validation Report", phase: "P119.6" },
);

printCheckReport("P119.6 Founder Runtime Approval Decision Recording Boundary Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
