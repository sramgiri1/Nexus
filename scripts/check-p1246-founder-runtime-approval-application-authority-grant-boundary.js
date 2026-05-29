import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1246-founder-runtime-approval-application-authority-grant-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1246 = subphaseById.get("P124.6") || {};
const p1247 = subphaseById.get("P124.7") || {};
const plan = readText("docs/architecture/P124_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1245Checker = readText("scripts/check-p1245-founder-runtime-approval-application-authority-grant-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P124.6";
const allowedFiles = new Set(p1246.allowedFiles || []);
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
const p124Subphases = ["P124.1", "P124.2", "P124.3", "P124.4", "P124.5"];
const p124CheckScripts = p124Subphases.map((phaseId) => `scripts/check-${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-boundary.js`);
const p124Reports = p124Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-boundary-report.md`);
const p1246CurrentState = status.currentPhase === "P124.6"
  && status.previousPhase === "P124.5"
  && status.nextPhase === "P124.7"
  && roadmap.currentPhase === "P124.6"
  && roadmap.previousPhase === "P124.5"
  && roadmap.nextPhase === "P124.7";
const p1247StartedState = status.currentPhase === "P124.7"
  && status.previousPhase === "P124.6"
  && status.nextPhase === "P125"
  && roadmap.currentPhase === "P124.7"
  && roadmap.previousPhase === "P124.6"
  && roadmap.nextPhase === "P125";
const p1247FinalState = p1247StartedState
  && statusById.get("P124")?.status === "complete"
  && roadmapById.get("P124")?.status === "complete"
  && statusById.get("P124.7")?.status === "complete"
  && roadmapById.get("P124.7")?.status === "complete";
const p124ParentOpenState = (p1246CurrentState || p1247StartedState)
  && !p1247FinalState
  && statusById.get("P124")?.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1246-founder-runtime-approval-application-authority-grant-boundary"]));
addCheck("P124.1-P124.5 package scripts exist", p124Subphases.every((phaseId) => Boolean(packageJson.scripts?.[`check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-boundary`])));
addCheck("P124.1-P124.5 checkers exist", p124CheckScripts.every((path) => existsSync(join(ROOT, path))), p124CheckScripts.join(", "));
addCheck("P124.1-P124.5 reports exist", p124Reports.every((path) => existsSync(join(ROOT, path))), p124Reports.join(", "));
addCheck("P124.1-P124.5 reports pass", p124Reports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P124.1-P124.5 complete", p124Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract marks P124.6 complete and P124.7 handoff valid", p1246.status === "complete" && ["planned", "complete"].includes(p1247.status));
addCheck("P124.5 checker accepts P124.6 handoff", p1245Checker.includes("P124.6") && p1245Checker.includes("P124.7") && p1245Checker.includes("p1246StartedState"));
addCheck("P124.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant") && commandCenterSource.includes("Grant read-only"));
addCheck("P124.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantBoundaryDisplayModel") && dataSource.includes("Approval application authority grant safe dry-run report"));
addCheck("P124.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant appears only on scoped pages") && routeTests.includes("Grant read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("docs record P124.6", /P124\.6 Grant Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P124.6", /P124\.6 approval application authority grant validation/i.test(readme) && /P124\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P124.6", /P124\.6 is complete/.test(platformRoadmap) && /P124\.7\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (
    p124ParentOpenState
      && statusById.get("P124.5")?.status === "complete"
      && statusById.get("P124.6")?.status === "complete"
      && ["planned", "complete"].includes(statusById.get("P124.7")?.status)
      && roadmapById.get("P124.6")?.status === "complete"
  )
    || (
      p1247FinalState
      && statusById.get("P124.5")?.status === "complete"
      && statusById.get("P124.6")?.status === "complete"
      && roadmapById.get("P124.6")?.status === "complete"
    ),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P124.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P124.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw grant table names", !/(founder_runtime_approval_grant|approval_authority_grant_records|approval_authority_grant_events|approval_authority_grant_requests|grant_boundary_records)/i.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));
addCheck("Command Center grant UX avoids raw paths and fake actions", !/reports\/p124|approval_authority_grant|grant authority now|execute now/i.test(commandCenterSource));
addCheck("validation subphase has no runtime imports", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1246-founder-runtime-approval-application-authority-grant-boundary.js")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P124.6 approval application authority grant validation/docs closure.",
        "- Confirms P124.1-P124.5 checkers, reports, docs, status, and scoped Command Center grant UX evidence are present.",
        "- Does not change runtime behavior, grant authority, activate authority, apply approvals, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1246.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P124.6 is validation/docs only. It does not grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P124.6 Approval Application Authority Grant Validation Report", phase: "P124.6" },
);

printCheckReport("P124.6 Approval Application Authority Grant Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
