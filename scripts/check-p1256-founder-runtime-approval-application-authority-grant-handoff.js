import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1256-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|display-only|read-only|validation-only|planned-only|local-only|future)\b/i.test(context);
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
const p1256 = subphaseById.get("P125.6") || {};
const p1257 = subphaseById.get("P125.7") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1255Checker = readText("scripts/check-p1255-founder-runtime-approval-application-authority-grant-handoff.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.6";
const allowedFiles = new Set(p1256.allowedFiles || []);
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
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const p125Subphases = ["P125.1", "P125.2", "P125.3", "P125.4", "P125.5"];
const p125CheckScripts = p125Subphases.map((phaseId) => `scripts/check-${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff.js`);
const p125Reports = p125Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-report.md`);
const p1256CurrentState = status.currentPhase === "P125.6"
  && status.previousPhase === "P125.5"
  && status.nextPhase === "P125.7"
  && roadmap.currentPhase === "P125.6"
  && roadmap.previousPhase === "P125.5"
  && roadmap.nextPhase === "P125.7";
const p1257StartedState = status.currentPhase === "P125.7"
  && status.previousPhase === "P125.6"
  && status.nextPhase === "P126"
  && roadmap.currentPhase === "P125.7"
  && roadmap.previousPhase === "P125.6"
  && roadmap.nextPhase === "P126";
const p1257FinalState = p1257StartedState
  && statusById.get("P125")?.status === "complete"
  && roadmapById.get("P125")?.status === "complete"
  && statusById.get("P125.7")?.status === "complete"
  && roadmapById.get("P125.7")?.status === "complete";
const p125ParentOpenState = (p1256CurrentState || p1257StartedState)
  && !p1257FinalState
  && statusById.get("P125")?.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1256-founder-runtime-approval-application-authority-grant-handoff"]));
addCheck("P125.1-P125.5 package scripts exist", p125Subphases.every((phaseId) => Boolean(packageJson.scripts?.[`check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff`])));
addCheck("P125.1-P125.5 checkers exist", p125CheckScripts.every((path) => existsSync(join(ROOT, path))), p125CheckScripts.join(", "));
addCheck("P125.1-P125.5 reports exist", p125Reports.every((path) => existsSync(join(ROOT, path))), p125Reports.join(", "));
addCheck("P125.1-P125.5 reports pass", p125Reports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P125.1-P125.5 complete", p125Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract marks P125.6 complete and P125.7 handoff valid", p1256.status === "complete" && ["planned", "complete"].includes(p1257.status));
addCheck("P125.5 checker accepts P125.6 handoff", p1255Checker.includes("P125.6") && p1255Checker.includes("P125.7") && p1255Checker.includes("p1256StartedState"));
addCheck("P125.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff") && commandCenterSource.includes("Handoff read-only"));
addCheck("P125.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel") && dataSource.includes("Approval application authority grant handoff safe dry-run report"));
addCheck("P125.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant handoff appears only on scoped pages") && routeTests.includes("Handoff read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("docs record P125.6", /P125\.6 Handoff Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P125.6",
  /P125\.6 approval application authority grant handoff validation/i.test(readme)
    && (/P125\.7\s+is\s+next/.test(readme) || /P125\.7 approval application authority grant handoff final validation/i.test(readme)),
);
addCheck(
  "platform roadmap records P125.6",
  /P125\.6 is complete/.test(platformRoadmap)
    && (/P125\.7\s+is\s+next/.test(platformRoadmap) || /P125\.7 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (
    p125ParentOpenState
      && statusById.get("P125.5")?.status === "complete"
      && statusById.get("P125.6")?.status === "complete"
      && ["planned", "complete"].includes(statusById.get("P125.7")?.status)
      && roadmapById.get("P125.6")?.status === "complete"
  )
    || (
      p1257FinalState
      && statusById.get("P125.5")?.status === "complete"
      && statusById.get("P125.6")?.status === "complete"
      && roadmapById.get("P125.6")?.status === "complete"
    ),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P125.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));
addCheck("Command Center handoff UX avoids raw paths and fake actions", !/reports\/p125|approval_authority_grant_handoff|handoff authority now|execute now/i.test(commandCenterSource));
addCheck("validation subphase has no runtime imports", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1256-founder-runtime-approval-application-authority-grant-handoff.js")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.6 approval application authority grant handoff validation/docs closure.",
        "- Confirms P125.1-P125.5 checkers, reports, docs, status, and scoped Command Center handoff UX evidence are present.",
        "- Does not change runtime behavior, hand off authority, grant authority, activate authority, apply approvals, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1256.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.6 is validation/docs only. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.6 Approval Application Authority Grant Handoff Validation Report", phase: "P125.6" },
);

printCheckReport("P125.6 Approval Application Authority Grant Handoff Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
