import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1257-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
const contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p125Subphases = ["P125.1", "P125.2", "P125.3", "P125.4", "P125.5", "P125.6", "P125.7"];
const p1257 = subphaseById.get("P125.7") || {};
const p126Status = statusById.get("P126") || {};
const p126Roadmap = roadmapById.get("P126") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1256Checker = readText("scripts/check-p1256-founder-runtime-approval-application-authority-grant-handoff.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const primaryUxSource = `${commandCenterSource}\n${dataSource}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.7";
const allowedFiles = new Set(p1257.allowedFiles || []);
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
const requiredScripts = p125Subphases.map((phaseId) => `check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff`);
const requiredReports = p125Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-report.md`);
const priorReports = requiredReports.filter((path) => path !== REPORT_PATH);
const validationCommands = [
  "npm run check:p1257-founder-runtime-approval-application-authority-grant-handoff",
  "npm run check:p1256-founder-runtime-approval-application-authority-grant-handoff",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff appears only on scoped pages\"",
  "git diff --check",
];
const finalState =
  status.currentPhase === "P125.7"
  && status.previousPhase === "P125.6"
  && status.nextPhase === "P126"
  && roadmap.currentPhase === "P125.7"
  && roadmap.previousPhase === "P125.6"
  && roadmap.nextPhase === "P126";
const p1261StartedState =
  status.currentPhase === "P126.1"
  && status.previousPhase === "P125.7"
  && status.nextPhase === "P126.2"
  && roadmap.currentPhase === "P126.1"
  && roadmap.previousPhase === "P125.7"
  && roadmap.nextPhase === "P126.2";
const p125Entries = [statusById.get("P125"), ...p125Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p125Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P125", "P125.7"].includes(entry.phaseId));

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P125 prior reports exist", priorReports.every((path) => existsSync(join(ROOT, path))), priorReports.join(", "));
addCheck("P125 prior reports pass", priorReports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P125 complete", contract.status === "complete" && contract.currentSubphase === "P125.7" && contract.previousSubphase === "P125.6" && contract.nextPhase === "P126");
addCheck("contract marks every P125 subphase complete", p125Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1257.status === "complete" && p1257.scopeClassification === "NEXUS_OS_CHANGE" && p1257.expectedExports?.length === 0 && p1257.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1257.forbiddenFiles || []).includes("dashboard/src/**") && (p1257.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P125.7 records validation commands", validationCommands.every((command) => p1257.validationCommands?.includes(command)));
addCheck("OS checker recognizes P125.7 and P126", /"P125\.7"/.test(osStatusChecker) && /"P126"/.test(osStatusChecker));
addCheck("P125.6 checker accepts P125.7 final handoff", p1256Checker.includes("p1257FinalState") && p1256Checker.includes('status.nextPhase === "P126"'));
addCheck("P125.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff") && commandCenterSource.includes("Handoff read-only"));
addCheck("P125.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel") && dataSource.includes("Approval application authority grant handoff safe dry-run report"));
addCheck("P125.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant handoff appears only on scoped pages") && routeTests.includes("Handoff read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("primary UX stays scoped", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff") && !commandCenterSource.includes("Lite Approval Application Authority Grant Handoff") && !commandCenterSource.includes("Chat Approval Application Authority Grant Handoff"));
addCheck("primary UX avoids raw report paths and table names", !/reports\/p125|approval_authority_grant_handoff/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|handoff authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P125.7", /P125\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P125.7 and parent completion", /P125\.7 is complete/.test(platformRoadmap) && /P125\s+is\s+complete/.test(platformRoadmap) && /P126\s+is\s+planned next/.test(platformRoadmap));
addCheck("README records P125.7 and parent completion", /P125\.7 approval application authority grant handoff final validation/i.test(readme) && /P125\s+is\s+complete/i.test(readme) && /P126\s+is\s+planned next/i.test(readme));
addCheck(
  "phase status advanced",
  (finalState || p1261StartedState)
    && statusById.get("P125")?.status === "complete"
    && roadmapById.get("P125")?.status === "complete"
    && p125Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
    && p125Subphases.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "P126 handoff exists",
  ["planned", "in_progress"].includes(p126Status.status)
    && ["planned", "in_progress"].includes(p126Roadmap.status)
    && p126Status.commandCenterVisible === true
    && p126Roadmap.commandCenterVisible === true,
);
addCheck("completed P125 entries have commits", p125Entries.length === 8 && p125Entries.every((entry) => Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P125.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P125.7 contract avoids forbidden file scope", !(p1257.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1257.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1257.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1256Checker}\n${readText("scripts/check-p1257-founder-runtime-approval-application-authority-grant-handoff.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.7 final validation and parent P125 closure.",
        "- Confirms P125.1-P125.7 are complete, P125 is complete, scoped Business Build/Agent Flow handoff UX remains display-only, and P126 is the planned next handoff.",
        "- Does not hand off authority, grant authority, activate authority, apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1257.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.7 is final validation only. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend. P126 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.7 Approval Application Authority Grant Handoff Final Validation Report", phase: "P125.7" },
);

printCheckReport("P125.7 Approval Application Authority Grant Handoff Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
