import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p126Subphases = ["P126.1", "P126.2", "P126.3", "P126.4", "P126.5", "P126.6", "P126.7"];
const p1267 = subphaseById.get("P126.7") || {};
const p127Status = statusById.get("P127") || {};
const p127Roadmap = roadmapById.get("P127") || {};
const plan = readText("docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1266Checker = readText("scripts/check-p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const primaryUxSource = `${commandCenterSource}\n${dataSource}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P126.7";
const allowedFiles = new Set(p1267.allowedFiles || []);
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
const requiredScripts = p126Subphases.map((phaseId) => `check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`);
const requiredReports = p126Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`);
const priorReports = requiredReports.filter((path) => path !== REPORT_PATH);
const validationCommands = [
  "npm run check:p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary",
  "npm run check:p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance appears only on scoped pages\"",
  "git diff --check",
];
const finalState =
  status.currentPhase === "P126.7"
  && status.previousPhase === "P126.6"
  && status.nextPhase === "P127"
  && roadmap.currentPhase === "P126.7"
  && roadmap.previousPhase === "P126.6"
  && roadmap.nextPhase === "P127";
const p126Entries = [statusById.get("P126"), ...p126Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p126Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P126", "P126.7"].includes(entry.phaseId));

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P126 prior reports exist", priorReports.every((path) => existsSync(join(ROOT, path))), priorReports.join(", "));
addCheck("P126 prior reports pass", priorReports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P126 complete", contract.status === "complete" && contract.currentSubphase === "P126.7" && contract.previousSubphase === "P126.6" && contract.nextPhase === "P127");
addCheck("contract marks every P126 subphase complete", p126Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1267.status === "complete" && p1267.scopeClassification === "NEXUS_OS_CHANGE" && p1267.expectedExports?.length === 0 && p1267.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1267.forbiddenFiles || []).includes("dashboard/src/**") && (p1267.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P126.7 records validation commands", validationCommands.every((command) => p1267.validationCommands?.includes(command)));
addCheck("OS checker recognizes P126.7 and P127", /"P126\.7"/.test(osStatusChecker) && /"P127"/.test(osStatusChecker));
addCheck("P126.6 checker accepts P126.7 final handoff", p1266Checker.includes("p1267FinalState") && p1266Checker.includes('status.nextPhase === "P127"'));
addCheck("P126.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance") && commandCenterSource.includes("Acceptance read-only"));
addCheck("P126.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryDisplayModel") && dataSource.includes("Approval application authority grant handoff acceptance safe dry-run report"));
addCheck("P126.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant handoff acceptance appears only on scoped pages") && routeTests.includes("Acceptance read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("primary UX stays scoped", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance") && !commandCenterSource.includes("Lite Approval Application Authority Grant Handoff Acceptance") && !commandCenterSource.includes("Chat Approval Application Authority Grant Handoff Acceptance"));
addCheck("primary UX avoids raw report paths and table names", !/reports\/p126|approval_authority_grant_handoff_acceptance/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|accept handoff now|capture acceptance now|grant authority now|handoff authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P126.7", /P126\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P126.7 and parent completion", /P126\.7 is complete/.test(platformRoadmap) && /P126\s+is\s+complete/.test(platformRoadmap) && /P127\s+is\s+planned next/.test(platformRoadmap));
addCheck("README records P126.7 and parent completion", /P126\.7 approval application authority grant handoff acceptance final\s+validation/i.test(readme) && /P126\s+is\s+complete/i.test(readme) && /P127\s+is\s+planned next/i.test(readme));
addCheck(
  "phase status advanced",
  finalState
    && statusById.get("P126")?.status === "complete"
    && roadmapById.get("P126")?.status === "complete"
    && p126Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
    && p126Subphases.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "P127 handoff exists",
  p127Status.status === "planned"
    && p127Roadmap.status === "planned"
    && p127Status.commandCenterVisible === true
    && p127Roadmap.commandCenterVisible === true
    && /planned-only/i.test(p127Status.knownLimitations?.join(" ") || ""),
);
addCheck("completed P126 entries have commits", p126Entries.length === 8 && p126Entries.every((entry) => Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P126.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P126.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P126.7 contract avoids forbidden file scope", !(p1267.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1267.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1267.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw acceptance table names", !/(approval_authority_grant_handoff_acceptance_records|grant_handoff_acceptance_events|handoff_acceptance_requests|acceptance_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1266Checker}\n${readText("scripts/check-p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /handoff acceptance is enabled|acceptance capture is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P126.7 final validation and parent P126 closure.",
        "- Confirms P126.1-P126.7 are complete, P126 is complete, scoped Business Build/Agent Flow acceptance UX remains display-only, and P127 is the planned next handoff.",
        "- Does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1267.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P126.7 is final validation only. It does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend. P127 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P126.7 Approval Application Authority Grant Handoff Acceptance Final Validation Report", phase: "P126.7" },
);

printCheckReport("P126.7 Approval Application Authority Grant Handoff Acceptance Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
