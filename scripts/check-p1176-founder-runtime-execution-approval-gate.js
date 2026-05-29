import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderRuntimeExecutionApprovalGateDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1176-founder-runtime-execution-approval-gate-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|docs-only|read-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1176 = subphaseById.get("P117.6") || {};
const p1177 = subphaseById.get("P117.7") || {};
const plan = readText("docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1175Checker = readText("scripts/check-p1175-founder-runtime-execution-approval-gate.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P117.6";
const allowedFiles = new Set(p1176.allowedFiles || []);

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
  "check:p1171-founder-runtime-execution-approval-gate-contract",
  "check:p1172-founder-runtime-execution-approval-gate",
  "check:p1173-founder-runtime-execution-approval-gate",
  "check:p1174-founder-runtime-execution-approval-gate",
  "check:p1175-founder-runtime-execution-approval-gate",
  "check:p1176-founder-runtime-execution-approval-gate",
];

const requiredReports = [
  "reports/p1171-founder-runtime-execution-approval-gate-contract-report.md",
  "reports/p1172-founder-runtime-execution-approval-gate-report.md",
  "reports/p1173-founder-runtime-execution-approval-gate-report.md",
  "reports/p1174-founder-runtime-execution-approval-gate-report.md",
  "reports/p1175-founder-runtime-execution-approval-gate-report.md",
];

const validationCommands = [
  "npm run check:p1176-founder-runtime-execution-approval-gate",
  "npm run check:p1175-founder-runtime-execution-approval-gate",
  "npm run check:p1174-founder-runtime-execution-approval-gate",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime execution approval gate appears only on Business Build and Agent Flow\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource].join("\n");
const serializedDisplayModel = JSON.stringify(
  buildFounderRuntimeExecutionApprovalGateDisplayModel("Build a simple iOS Snake game for the App Store"),
  null,
  2,
);

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P117.1-P117.5 are complete", ["P117.1", "P117.2", "P117.3", "P117.4", "P117.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P117.6 contract is complete", p1176.status === "complete" && ["planned", "complete"].includes(p1177.status));
addCheck("P117.6 records validation commands", validationCommands.every((command) => p1176.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS|PASS \(/.test(readText(report))));
addCheck("P117.5 checker accepts P117.6 handoff", p1175Checker.includes('["P117.5", "P117.6", "P117.7"].includes(status.currentPhase)') && p1175Checker.includes('["P117.6", "P117.7", "P118"].includes(status.nextPhase)'));
addCheck("P117.5 Command Center UX preserved", pageSource.includes("FounderRuntimeExecutionApprovalGateCard") && pageSource.includes("Business Build Runtime Execution Approval Gate") && pageSource.includes("Agent Flow Runtime Execution Approval Gate") && !pageSource.includes("Lite Runtime Execution Approval Gate") && !pageSource.includes("Live Readiness Runtime Execution Approval Gate"));
addCheck("P117.5 display model preserved", businessBuildSource.includes("buildFounderRuntimeExecutionApprovalGateDisplayModel") && businessBuildSource.includes("approvalGateRows") && businessBuildSource.includes("Runtime execution approval gate preview report"));
addCheck("P117.5 Playwright coverage preserved", routeTests.includes("Runtime execution approval gate appears only on Business Build and Agent Flow") && routeTests.includes("Runtime execution approval gate") && routeTests.includes("Build a simple iOS Snake game for the App Store"));
addCheck(
  "P117 plan records all completed subphases",
  [
    /P117\.1 Runtime Execution Approval Contract \/ Policy[\s\S]*Status:\s+complete/,
    /P117\.2 Approval Evidence Schema Metadata[\s\S]*Status:\s+complete/,
    /P117\.3 Governed Local Approval Decision Model[\s\S]*Status:\s+complete/,
    /P117\.4 Approval Gate Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/,
    /P117\.5 Command Center Approval Gate UX[\s\S]*Status:\s+complete/,
    /P117\.6 Approval Gate Validation \/ Docs[\s\S]*Status:\s+complete/,
  ].every((pattern) => pattern.test(plan)),
);
addCheck("README records P117.6", /P117\.6 approval gate validation/.test(readme) && (/P117\.7 is next/.test(readme) || /P117\.7 final validation/.test(readme)));
addCheck("platform roadmap records P117.6", /P117\.6 is complete/.test(platformRoadmap) && (/P117\.7 is next/.test(platformRoadmap) || /P117\.7 is complete/.test(platformRoadmap)));

const p1176HandoffState =
  status.currentPhase === "P117.6"
    && status.previousPhase === "P117.5"
    && status.nextPhase === "P117.7"
    && roadmap.currentPhase === "P117.6"
    && roadmap.previousPhase === "P117.5"
    && roadmap.nextPhase === "P117.7"
    && statusById.get("P117")?.status === "in_progress"
    && statusById.get("P117.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.7")?.status)
    && roadmapById.get("P117")?.status === "in_progress"
    && roadmapById.get("P117.6")?.status === "complete";
const p1177HandoffState =
  status.currentPhase === "P117.7"
    && status.previousPhase === "P117.6"
    && status.nextPhase === "P118"
    && roadmap.currentPhase === "P117.7"
    && roadmap.previousPhase === "P117.6"
    && roadmap.nextPhase === "P118"
    && statusById.get("P117")?.status === "complete"
    && statusById.get("P117.6")?.status === "complete"
    && statusById.get("P117.7")?.status === "complete"
    && roadmapById.get("P117")?.status === "complete"
    && roadmapById.get("P117.6")?.status === "complete"
    && roadmapById.get("P117.7")?.status === "complete";

addCheck("phase status advanced", p1176HandoffState || p1177HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P117.6" && contract.previousSubphase === "P117.5" && contract.nextSubphase === "P117.7") || (contract.currentSubphase === "P117.7" && contract.previousSubphase === "P117.6" && contract.nextSubphase === "P118"));
addCheck(
  "changed files stay in P117.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P117.6 contract avoids forbidden file scope", !(p1176.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw approval/runtime table names", !/(founder_runtime_execution_approval_|founder_runtime_execution_readiness_|approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId)/i.test(uxSourceText));
addCheck("public docs avoid raw approval/runtime table names", !/(founder_runtime_execution_approval_|founder_runtime_execution_readiness_|approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId)/i.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|call provider now|create project now|dispatch agent now|write sqlite now|run runtime now|unlock execution now/i.test(uxSourceText));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(uxSourceText) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${uxSourceText}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P117.1-P117.5 together before final validation.",
        "- Confirms runtime execution approval gate contracts, local schema metadata, governed local approval review, safe dry-run preview, and Command Center UX evidence remain aligned.",
        "- Confirms approval capture, approval persistence, approval decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P117.6 is aggregate validation and docs closure only. It does not write approval evidence records, capture approvals, persist decisions, record approve/reject decisions, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.6 Founder Runtime Execution Approval Gate Validation Report", phase: "P117.6" },
);

printCheckReport("P117.6 Founder Runtime Execution Approval Gate Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
