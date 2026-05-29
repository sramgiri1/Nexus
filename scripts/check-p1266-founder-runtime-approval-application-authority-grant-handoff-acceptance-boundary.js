import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1266 = subphaseById.get("P126.6") || {};
const p1267 = subphaseById.get("P126.7") || {};
const plan = readText("docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1265Checker = readText("scripts/check-p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P126.6";
const allowedFiles = new Set(p1266.allowedFiles || []);
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
const p126Subphases = ["P126.1", "P126.2", "P126.3", "P126.4", "P126.5"];
const p126CheckScripts = p126Subphases.map((phaseId) => `scripts/check-${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`);
const p126Reports = p126Subphases.map((phaseId) => `reports/${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`);
const p1266CurrentState = status.currentPhase === "P126.6"
  && status.previousPhase === "P126.5"
  && status.nextPhase === "P126.7"
  && roadmap.currentPhase === "P126.6"
  && roadmap.previousPhase === "P126.5"
  && roadmap.nextPhase === "P126.7";
const p1267StartedState = status.currentPhase === "P126.7"
  && status.previousPhase === "P126.6"
  && status.nextPhase === "P127"
  && roadmap.currentPhase === "P126.7"
  && roadmap.previousPhase === "P126.6"
  && roadmap.nextPhase === "P127";
const p1267FinalState = p1267StartedState
  && statusById.get("P126")?.status === "complete"
  && roadmapById.get("P126")?.status === "complete"
  && statusById.get("P126.7")?.status === "complete"
  && roadmapById.get("P126.7")?.status === "complete";
const p126ParentOpenState = (p1266CurrentState || p1267StartedState)
  && !p1267FinalState
  && statusById.get("P126")?.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary"]));
addCheck("P126.1-P126.5 package scripts exist", p126Subphases.every((phaseId) => Boolean(packageJson.scripts?.[`check:${phaseId.toLowerCase().replace(".", "")}-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`])));
addCheck("P126.1-P126.5 checkers exist", p126CheckScripts.every((path) => existsSync(join(ROOT, path))), p126CheckScripts.join(", "));
addCheck("P126.1-P126.5 reports exist", p126Reports.every((path) => existsSync(join(ROOT, path))), p126Reports.join(", "));
addCheck("P126.1-P126.5 reports pass", p126Reports.every((path) => /Result[\s\S]*PASS/.test(readText(path))));
addCheck("contract marks P126.1-P126.5 complete", p126Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract marks P126.6 complete and P126.7 handoff valid", p1266.status === "complete" && ["planned", "complete"].includes(p1267.status));
addCheck("P126.5 checker accepts P126.6 handoff", p1265Checker.includes("P126.6") && p1265Checker.includes("P126.7") && p1265Checker.includes("p1266StartedState"));
addCheck("P126.5 scoped UX source preserved", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance") && commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance") && commandCenterSource.includes("Acceptance read-only"));
addCheck("P126.5 display model preserved", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryDisplayModel") && dataSource.includes("Approval application authority grant handoff acceptance safe dry-run report"));
addCheck("P126.5 Playwright coverage preserved", routeTests.includes("Approval application authority grant handoff acceptance appears only on scoped pages") && routeTests.includes("Acceptance read-only") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck("docs record P126.6", /P126\.6 Acceptance Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P126.6",
  /P126\.6 approval application authority grant handoff acceptance\s+validation\/docs closure/i.test(readme)
    && (/P126\.7\s+is\s+next/.test(readme) || /P126\.7 final validation/i.test(readme)),
);
addCheck(
  "platform roadmap records P126.6",
  /P126\.6 is complete/.test(platformRoadmap)
    && (/P126\.7\s+is\s+next/.test(platformRoadmap) || /P126\.7 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (
    p126ParentOpenState
      && statusById.get("P126.5")?.status === "complete"
      && statusById.get("P126.6")?.status === "complete"
      && ["planned", "complete"].includes(statusById.get("P126.7")?.status)
      && roadmapById.get("P126.6")?.status === "complete"
  )
    || (
      p1267FinalState
      && statusById.get("P126.5")?.status === "complete"
      && statusById.get("P126.6")?.status === "complete"
      && roadmapById.get("P126.6")?.status === "complete"
    ),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P126.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P126.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw acceptance table names", !/(approval_authority_grant_handoff_acceptance_records|grant_handoff_acceptance_events|handoff_acceptance_requests|acceptance_boundary_records)/i.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /handoff acceptance is enabled|acceptance capture is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));
addCheck("Command Center acceptance UX avoids raw paths and fake actions", !/reports\/p126|approval_authority_grant_handoff_acceptance|accept handoff now|capture acceptance now|handoff authority now|grant authority now|activate now|execute now|run now|deploy now/i.test(commandCenterSource));
addCheck("validation subphase has no runtime imports", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P126.6 approval application authority grant handoff acceptance validation/docs closure.",
        "- Confirms P126.1-P126.5 checkers, reports, docs, status, and scoped Command Center acceptance UX evidence are present.",
        "- Does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: (p1266.validationCommands || []).map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P126.6 is validation/docs only. It does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P126.6 Approval Application Authority Grant Handoff Acceptance Validation / Docs Report", phase: "P126.6" },
);

printCheckReport("P126.6 Approval Application Authority Grant Handoff Acceptance Validation / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
