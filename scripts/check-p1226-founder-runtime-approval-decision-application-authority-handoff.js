import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1226-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future|validation-only|docs-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1225 = subphaseById.get("P122.5") || {};
const p1226 = subphaseById.get("P122.6") || {};
const p1227 = subphaseById.get("P122.7") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1225Checker = readText("scripts/check-p1225-founder-runtime-approval-decision-application-authority-handoff.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.6";
const allowedFiles = new Set(p1226.allowedFiles || []);
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
const p1226HandoffAccepted = (status.currentPhase === "P122.6"
  && status.previousPhase === "P122.5"
  && status.nextPhase === "P122.7"
  && roadmap.currentPhase === "P122.6"
  && roadmap.previousPhase === "P122.5"
  && roadmap.nextPhase === "P122.7")
  || (status.currentPhase === "P122.7"
    && status.previousPhase === "P122.6"
    && roadmap.currentPhase === "P122.7"
    && roadmap.previousPhase === "P122.6");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1226-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("contract marks P122.6 complete", p1226.status === "complete" && p1226.scopeClassification === "NEXUS_OS_CHANGE" && ["planned", "complete"].includes(p1227.status));
addCheck("contract records validation/docs-only scope", p1226.narrowGoal?.includes("validation/docs") && p1226.expectedExports?.length === 0 && p1226.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1226.forbiddenFiles || []).includes("dashboard/src/**") && (p1226.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P122.5 checker accepts P122.6 handoff", p1225Checker.includes("P122.6") && p1225Checker.includes("P122.7") && p1225Checker.includes("p1225HandoffAccepted"));
addCheck("P122.5 UX regression coverage remains present", routeTests.includes("Approval application authority handoff appears only on scoped pages") && routeTests.includes("Founder approval application authority handoff") && routeTests.includes("Authority scope"));
addCheck("display model remains safe", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && displayModel.authorityCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("primary UX stays scoped", pageSource.includes("Business Build Approval Application Authority Handoff") && pageSource.includes("Agent Flow Approval Application Authority Handoff") && !pageSource.includes("Lite Approval Application Authority Handoff") && !pageSource.includes("Chat Approval Application Authority Handoff"));
addCheck("primary UX avoids internal phase labels and report paths", !/P122|p122\d|reports\/p122/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(founderApprovalDecisionApplication|approval_decision_application|approval_application_authority|authorityDraftRef|authorityEventRef|authorityEvidenceRef|approvalApplicationAuthorityKey|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs record P122.6", /P122\.6 Authority Handoff Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P122.6", /P122\.6 is complete/.test(platformRoadmap) && /P122\.7\s+is\s+next/.test(platformRoadmap));
addCheck("README records P122.6", /P122\.6 approval application authority validation\/docs closure/.test(readme) && /P122\.7\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1226HandoffAccepted
    && statusById.get("P122")?.status === "in_progress"
    && statusById.get("P122.5")?.status === "complete"
    && statusById.get("P122.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.7")?.status)
    && roadmapById.get("P122.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P122.6 contract avoids forbidden file scope", !(p1226.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1226.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1226.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1225Checker}\n${readText("scripts/check-p1226-founder-runtime-approval-decision-application-authority-handoff.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.6 approval application authority handoff validation/docs closure.",
        "- Confirms the P122.5 UX remains scoped while P122.6 updates docs, contract, status, and generated reports only.",
        "- Does not modify Command Center source/tests and does not enable grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1226.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.6 is validation/docs closure only. It does not grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.6 Approval Application Authority Handoff Validation / Docs Report", phase: "P122.6" },
);

printCheckReport("P122.6 Approval Application Authority Handoff Validation / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
