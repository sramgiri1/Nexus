import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md";

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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|display-only|read-only|validation-only|final-validation-only|planned-only|planned next|future|local-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p127Subphases = ["P127.1", "P127.2", "P127.3", "P127.4", "P127.5", "P127.6", "P127.7"];
const p1277 = subphaseById.get("P127.7") || {};
const p128Status = statusById.get("P128") || {};
const p128Roadmap = roadmapById.get("P128") || {};
const plan = readText("docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1276Checker = readText("scripts/check-p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const primaryUxSource = `${commandCenterSource}\n${dataSource}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P127.7";
const allowedFiles = new Set(p1277.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
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
const requiredScripts = p127Subphases.map((phaseId) => `check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`);
const requiredReports = p127Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`);
const priorReports = requiredReports.filter((path) => path !== REPORT_PATH);
const validationCommands = [
  "npm run check:p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance capture appears only on scoped pages\"",
  "git diff --check",
];
const finalState =
  status.currentPhase === "P127.7"
  && status.previousPhase === "P127.6"
  && status.nextPhase === "P128"
  && roadmap.currentPhase === "P127.7"
  && roadmap.previousPhase === "P127.6"
  && roadmap.nextPhase === "P128";
const p127Entries = [statusById.get("P127"), ...p127Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p127Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P127", "P127.7"].includes(entry.phaseId));
const p128PlannedState = p128Status.status === "planned"
  && p128Roadmap.status === "planned"
  && p128Status.previousPhase === "P127.7"
  && /planned-only/i.test(p128Status.knownLimitations?.join(" ") || "");
const p1281HandoffState =
  status.currentPhase === "P128.1"
  && status.previousPhase === "P127.7"
  && status.nextPhase === "P128.2"
  && roadmap.currentPhase === "P128.1"
  && roadmap.previousPhase === "P127.7"
  && roadmap.nextPhase === "P128.2"
  && p128Status.status === "in_progress"
  && p128Roadmap.status === "in_progress";
const p128ProgressState =
  /^P128\.[1-7]$/.test(status.currentPhase || "")
  && /^P128\.[2-7]$/.test(status.nextPhase || "")
  && roadmap.currentPhase === status.currentPhase
  && roadmap.previousPhase === status.previousPhase
  && roadmap.nextPhase === status.nextPhase
  && p128Status.status === "in_progress"
  && p128Roadmap.status === "in_progress";

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P127 prior reports exist", priorReports.every((path) => existsSync(join(ROOT, path))), priorReports.join(", "));
addCheck("P127 prior reports pass", priorReports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P127 complete", contract.status === "complete" && contract.currentSubphase === "P127.7" && contract.previousSubphase === "P127.6" && contract.nextPhase === "P128");
addCheck("contract marks every P127 subphase complete", p127Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1277.status === "complete" && p1277.scopeClassification === "NEXUS_OS_CHANGE" && p1277.expectedExports?.length === 0 && p1277.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1277.forbiddenFiles || []).includes("dashboard/src/**") && (p1277.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P127.7 records validation commands", validationCommands.every((command) => p1277.validationCommands?.includes(command)));
addCheck("OS checker recognizes P127.7 and P128", /"P127\.7"/.test(osStatusChecker) && /"P128"/.test(osStatusChecker));
addCheck("P127.6 checker accepts P127.7 final handoff", p1276Checker.includes("p1277FinalState") && p1276Checker.includes('status.nextPhase === "P128"'));
addCheck("P127.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture") && commandCenterSource.includes("Capture read-only"));
addCheck("P127.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel") && dataSource.includes("Acceptance capture safe dry-run report"));
addCheck("P127.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant handoff acceptance capture appears only on scoped pages") && routeTests.includes("Capture read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("primary UX stays scoped", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture") && !commandCenterSource.includes("Lite Approval Application Authority Grant Handoff Acceptance Capture") && !commandCenterSource.includes("Chat Approval Application Authority Grant Handoff Acceptance Capture"));
addCheck("primary UX avoids raw report paths and table names", !/reports\/p127|approval_authority_grant_handoff_acceptance_capture/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/capture acceptance now|record acceptance now|run now|execute now|deploy now|activate now|accept handoff now|grant authority now|handoff authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P127.7", /P127\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P127.7 and parent completion", /P127\.7 is complete/.test(platformRoadmap) && /P127\s+is\s+complete/.test(platformRoadmap) && /P128\s+is\s+planned next/.test(platformRoadmap));
addCheck("README records P127.7 and parent completion", /P127\.7 acceptance capture final validation/i.test(readme) && /P127\s+is\s+complete/i.test(readme) && /P128\s+is\s+planned next/i.test(readme));
addCheck(
  "phase status advanced",
  (finalState || p1281HandoffState || p128ProgressState)
    && statusById.get("P127")?.status === "complete"
    && roadmapById.get("P127")?.status === "complete"
    && p127Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
    && p127Subphases.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "P128 planned handoff exists",
  (p128PlannedState || p1281HandoffState || p128ProgressState)
    && p128Status.commandCenterVisible === true
    && p128Roadmap.commandCenterVisible === true,
);
addCheck("completed P127 entries have commits", p127Entries.length === 8 && p127Entries.every((entry) => Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P127.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P127.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P127.7 contract avoids forbidden file scope", !(p1277.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1277.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1277.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw capture table names", !/(approval_authority_grant_handoff_acceptance_capture_records|grant_handoff_acceptance_capture_events|acceptance_capture_requests|capture_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1276Checker}\n${readText("scripts/check-p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture is enabled|handoff acceptance is enabled|grant handoff is enabled|authority handoff is enabled|grant authority is enabled|approval application authority grant handoff is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P127.7 final validation and parent P127 closure.",
        "- Confirms P127.1-P127.7 are complete, P127 is complete, scoped Business Build/Agent Flow acceptance capture UX remains display-only, and P128 is the planned next handoff.",
        "- Does not capture acceptance, record acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1277.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P127.7 is final validation only. It does not capture acceptance, record acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend. P128 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P127.7 Acceptance Capture Final Validation Report", phase: "P127.7" },
);

printCheckReport("P127.7 Acceptance Capture Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
