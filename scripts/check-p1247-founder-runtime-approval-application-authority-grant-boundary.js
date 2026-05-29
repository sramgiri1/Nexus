import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1247-founder-runtime-approval-application-authority-grant-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p124Subphases = ["P124.1", "P124.2", "P124.3", "P124.4", "P124.5", "P124.6", "P124.7"];
const p1247 = subphaseById.get("P124.7") || {};
const p125Status = statusById.get("P125") || {};
const p125Roadmap = roadmapById.get("P125") || {};
const plan = readText("docs/architecture/P124_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1246Checker = readText("scripts/check-p1246-founder-runtime-approval-application-authority-grant-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const primaryUxSource = `${commandCenterSource}\n${dataSource}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P124.7";
const allowedFiles = new Set(p1247.allowedFiles || []);
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
const requiredScripts = p124Subphases.map((phaseId) => `check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-boundary`);
const requiredReports = p124Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-boundary-report.md`);
const priorReports = requiredReports.filter((path) => path !== REPORT_PATH);
const validationCommands = [
  "npm run check:p1247-founder-runtime-approval-application-authority-grant-boundary",
  "npm run check:p1246-founder-runtime-approval-application-authority-grant-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant appears only on scoped pages\"",
  "git diff --check",
];
const finalState =
  status.currentPhase === "P124.7"
  && status.previousPhase === "P124.6"
  && status.nextPhase === "P125"
  && roadmap.currentPhase === "P124.7"
  && roadmap.previousPhase === "P124.6"
  && roadmap.nextPhase === "P125";
const p1251StartedState =
  status.currentPhase === "P125.1"
  && status.previousPhase === "P124.7"
  && status.nextPhase === "P125.2"
  && roadmap.currentPhase === "P125.1"
  && roadmap.previousPhase === "P124.7"
  && roadmap.nextPhase === "P125.2";
const p124Entries = [statusById.get("P124"), ...p124Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p124Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P124", "P124.7"].includes(entry.phaseId));

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P124 prior reports exist", priorReports.every((path) => existsSync(join(ROOT, path))), priorReports.join(", "));
addCheck("P124 prior reports pass", priorReports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P124 complete", contract.status === "complete" && contract.currentSubphase === "P124.7" && contract.previousSubphase === "P124.6" && contract.nextPhase === "P125");
addCheck("contract marks every P124 subphase complete", p124Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1247.status === "complete" && p1247.scopeClassification === "NEXUS_OS_CHANGE" && p1247.expectedExports?.length === 0 && p1247.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1247.forbiddenFiles || []).includes("dashboard/src/**") && (p1247.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P124.7 records validation commands", validationCommands.every((command) => p1247.validationCommands?.includes(command)));
addCheck("OS checker recognizes P124.7 and P125", /"P124\.7"/.test(osStatusChecker) && /"P125"/.test(osStatusChecker));
addCheck("P124.6 checker accepts P124.7 final handoff", p1246Checker.includes("p1247FinalState") && p1246Checker.includes('status.nextPhase === "P125"'));
addCheck("P124.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant") && commandCenterSource.includes("Grant read-only"));
addCheck("P124.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantBoundaryDisplayModel") && dataSource.includes("Approval application authority grant safe dry-run report"));
addCheck("P124.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant appears only on scoped pages") && routeTests.includes("Grant read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("primary UX stays scoped", commandCenterSource.includes("Business Build Approval Application Authority Grant") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant") && !commandCenterSource.includes("Lite Approval Application Authority Grant") && !commandCenterSource.includes("Chat Approval Application Authority Grant"));
addCheck("primary UX avoids raw report paths and table names", !/reports\/p124|approval_authority_grant/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P124.7", /P124\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P124.7 and parent completion", /P124\.7 is complete/.test(platformRoadmap) && /P124\s+is\s+complete/.test(platformRoadmap) && /P125\s+is\s+planned next/.test(platformRoadmap));
addCheck("README records P124.7 and parent completion", /P124\.7 approval application authority grant final validation/i.test(readme) && /P124\s+is\s+complete/i.test(readme) && /P125\s+is\s+planned next/i.test(readme));
addCheck(
  "phase status advanced",
  (
    finalState
    || (
      p1251StartedState
      && statusById.get("P125")?.status === "in_progress"
      && roadmapById.get("P125")?.status === "in_progress"
      && statusById.get("P125.1")?.status === "complete"
      && roadmapById.get("P125.1")?.status === "complete"
    )
  )
  && statusById.get("P124")?.status === "complete"
  && roadmapById.get("P124")?.status === "complete"
  && p124Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
  && p124Subphases.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P125 handoff exists", ["planned", "in_progress"].includes(p125Status.status) && ["planned", "in_progress"].includes(p125Roadmap.status) && p125Status.commandCenterVisible === true && p125Roadmap.commandCenterVisible === true);
addCheck("completed P124 entries have commits", p124Entries.length === 8 && p124Entries.every((entry) => Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P124.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P124.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P124.7 contract avoids forbidden file scope", !(p1247.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1247.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1247.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw grant table names", !/(founder_runtime_approval_grant|approval_authority_grant_records|approval_authority_grant_events|approval_authority_grant_requests|grant_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1246Checker}\n${readText("scripts/check-p1247-founder-runtime-approval-application-authority-grant-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P124.7 final validation and parent P124 closure.",
        "- Confirms P124.1-P124.7 are complete, P124 is complete, scoped Business Build/Agent Flow grant UX remains display-only, and P125 is the planned next handoff.",
        "- Does not grant authority, activate authority, apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1247.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P124.7 is final validation only. It does not grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend. P125 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P124.7 Approval Application Authority Grant Final Validation Report", phase: "P124.7" },
);

printCheckReport("P124.7 Approval Application Authority Grant Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
